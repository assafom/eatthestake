const Staker = artifacts.require("./Staker.sol");
const timeMachine = require('ganache-time-traveler');
var ERC20Factory = artifacts.require("./ERC20Factory.sol");
var MockERC20 = artifacts.require("./MockERC20.sol");


contract("Staker", async accounts => {

    beforeEach(async() => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot['result'];
    });

    afterEach(async() => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    async function getTime() {
        return (await web3.eth.getBlock((await web3.eth.getBlockNumber())))["timestamp"];
    }

    let defaultOptions = { from: accounts[0] };
    let BN = web3.utils.BN;
    let secondsInDayBN = new BN(24).mul(new BN(60)).mul(new BN(60));
    let rpsMultiplierBN = new BN(10**7);


    it("should calculate the rewards correctly", async () => {
        const staker = await Staker.deployed();
        const depositTokenAddr = await staker.depositToken.call();
        const rewardTokenAddr = await staker.rewardToken.call();

        let rewardAmount = web3.utils.toWei("300");
        let days = 30;

        const rewardToken = await MockERC20.at(rewardTokenAddr);
        await rewardToken.approve(staker.address, rewardAmount, defaultOptions);
        
        // Add staking rewards
        await staker.addRewards(rewardAmount, days, defaultOptions);
        let startingTime = await getTime();

        // Verify rewards-per-second calculation is correct
        let contractRps = await staker.rewardPerSecond.call(defaultOptions);
        let expectedRps = await (new BN(rewardAmount)).mul(rpsMultiplierBN).div(new BN(days)).div(secondsInDayBN);
        assert.equal(contractRps.toString(), expectedRps.toString() , "Wrong rewards per second");

        // Verify staking campaign end time calculation is correct
        let contractEndTime = await staker.rewardPeriodEndTimestamp.call(defaultOptions);
        let expectedEndTime = await (new BN(startingTime).add(new BN(days).mul(secondsInDayBN)));
        assert.equal(contractEndTime.toString(), expectedEndTime.toString() , "Wrong contract end time");
    });


    it("should calculate and distribute rewards correctly to one person across multiple campaigns", async () => {
        const staker = await Staker.deployed();
        const depositTokenAddr = await staker.depositToken.call();
        const rewardTokenAddr = await staker.rewardToken.call();

        let rewardAmount = web3.utils.toWei("300");
        let days = 30;

        const rewardToken = await MockERC20.at(rewardTokenAddr);
        const depositToken = await MockERC20.at(depositTokenAddr);

        let prevUserRewardTokenBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        let prevUserDepositTokenBalance = await depositToken.balanceOf.call(accounts[1], { from: accounts[1] });
        
        // Add staking rewards
        await rewardToken.approve(staker.address, rewardAmount, defaultOptions);
        await staker.addRewards(rewardAmount, days, defaultOptions);
        let prevContractRewardTokenBalance = await rewardToken.balanceOf(staker.address, { from: accounts[1] });

        let startingTime = await getTime();

        let contractRps = await staker.rewardPerSecond.call(defaultOptions);
        let contractEndTime = await staker.rewardPeriodEndTimestamp.call(defaultOptions);

        
        // User stakes funds, make sure no pending rewards yet
        let depositAmount = web3.utils.toWei("10");
        await depositToken.approve(staker.address, depositAmount, { from: accounts[1] });
        await staker.deposit(depositAmount, { from: accounts[1] });
        let initialReward = await staker.pendingRewards.call(accounts[1], { from: accounts[1] });
        assert.equal(initialReward.toString(), 0 , "User has rewards pending straight after staking");


        // Advance time by 10 days, make sure reward calculation is correct in pendingRewards() view function
        let secsToAdvance = 60*60*24*10;
        await timeMachine.advanceTimeAndBlock(secsToAdvance);
        let contractPendingReward = await staker.pendingRewards.call(accounts[1], { from: accounts[1] });
        let expectedPendingReward = contractRps.mul(new BN(secsToAdvance)).div(rpsMultiplierBN);
        assert.equal(contractPendingReward.toString(), expectedPendingReward.toString() , "Wrong pending rewards (view) calculation");


        // Claim rewards using claim(), make sure actual reward balance delta = the correctly calculated pending rewards
        await staker.claim({ from: accounts[1] });
        // Check user rewards balance
        let userNewRewardBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        let delta = userNewRewardBalance.sub(prevUserRewardTokenBalance);
        assert.equal(delta.toString(), expectedPendingReward.toString(), "Wrong amount of rewards sent to user after claim()");
        prevUserRewardTokenBalance = userNewRewardBalance;
        // Check contract rewards balance 
        let contractNewRewardBalance = await rewardToken.balanceOf(staker.address, { from: accounts[1] });
        let contractDelta = prevContractRewardTokenBalance.sub(contractNewRewardBalance);
        assert.equal(contractDelta.toString(), expectedPendingReward.toString(), "Contract lost different amount of rewards than should have");
        prevContractRewardTokenBalance = contractNewRewardBalance;


        // Withdraw funds, advance 15 days, make sure user doesn't get anything
        await staker.withdraw(depositAmount, { from: accounts[1] });
        prevUserRewardTokenBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] }); // Need to set here again as a little time elapsed between previous claim() and current withdraw()
        // Check user deposit balance
        let userNewDepositBalance = await depositToken.balanceOf(accounts[1], { from: accounts[1] });
        assert.equal(userNewDepositBalance.toString(), prevUserDepositTokenBalance.toString(), "Wrong user deposit token balance after withdrawl");
        prevUserDepositTokenBalance = userNewDepositBalance;
        // Advance 15 days
        secsToAdvance = 60*60*24*15;
        await timeMachine.advanceTimeAndBlock(secsToAdvance);
        // Try to claim rewards
        await staker.claim({ from: accounts[1] });
        userNewRewardBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        assert.equal(userNewRewardBalance.toString(), prevUserRewardTokenBalance.toString(), "User received rewards even tho he withdrew all stake previously");


        // Test adding new campaign:
        // Now only 5 days remaining for this staking campaign.
        // Do: user stakes funds, advance 7 days, owner adds new rewards, advance 3 days.
        // User should only get 5 days worth of rewards of the original campaign + 3 days worth of rewards from new campaign.
        await depositToken.approve(staker.address, depositAmount, { from: accounts[1] });
        await staker.deposit(depositAmount, { from: accounts[1] });
        secsToAdvance = 60*60*24*7;
        await timeMachine.advanceTimeAndBlock(secsToAdvance);
        let newRewardAmount = web3.utils.toWei("1");
        let newDays = 6;
        await rewardToken.approve(staker.address, newRewardAmount, defaultOptions);
        await staker.addRewards(newRewardAmount, newDays, defaultOptions);
        let newSecsToAdvance = 60*60*24*3;
        await timeMachine.advanceTimeAndBlock(newSecsToAdvance);
        let newContractRps = await staker.rewardPerSecond.call(defaultOptions);
        // Test pendingRewards()
        let expectedTotalReward = contractRps.mul(new BN(60*60*24*5)).div(rpsMultiplierBN).add(newContractRps.mul(new BN(newSecsToAdvance)).div(rpsMultiplierBN));
        contractPendingReward = await staker.pendingRewards.call(accounts[1], { from: accounts[1] });
        assert.equal(contractPendingReward.toString(), expectedTotalReward.toString() , "Wrong pending rewards (view) calculation after adding new campaign");
        // Test withdraw() [both stake + rewards]


    });


    it("calculate and distribute rewards correctly to multiple stakers", async () => {


    });
});
