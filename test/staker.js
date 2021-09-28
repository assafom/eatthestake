const Staker = artifacts.require("./Staker.sol");
const timeMachine = require('ganache-time-traveler');
var ERC20Factory = artifacts.require("./ERC20Factory.sol");
var MockERC20 = artifacts.require("./MockERC20.sol");
require('dotenv').config()


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

    function assertEqualWithMargin(_num1, _num2, _margin, _message) {
        if (BN.max(_num1,_num2).sub(BN.min(_num1,_num2)).lte(_margin.mul(new BN(3))))
            return;

        assert.equal(_num1.toString(), _num2.toString() , _message);
    }


    it("should calculate the parameters correctly", async () => {
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


    it("should calculate and distribute rewards correctly to one person across multiple campaigns and multiple actions", async () => {
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

        let contractRps = await staker.rewardPerSecond.call(defaultOptions);

        
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
        assertEqualWithMargin(contractPendingReward, expectedPendingReward, contractRps.div(rpsMultiplierBN) , "Wrong pending rewards (view) calculation");


        // Claim rewards using claim(), make sure actual reward balance delta = the correctly calculated pending rewards
        await staker.claim({ from: accounts[1] });
        // Check user rewards balance
        let userNewRewardBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        let delta = userNewRewardBalance.sub(prevUserRewardTokenBalance);
        assertEqualWithMargin(delta, expectedPendingReward, contractRps.div(rpsMultiplierBN), "Wrong amount of rewards sent to user after claim()");
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
        let newRewardAmount = web3.utils.toWei("10");
        let newDays = 6;
        await rewardToken.approve(staker.address, newRewardAmount, defaultOptions);
        await staker.addRewards(newRewardAmount, newDays, defaultOptions);
        let newSecsToAdvance = 60*60*24*3;
        await timeMachine.advanceTimeAndBlock(newSecsToAdvance);
        let newContractRps = await staker.rewardPerSecond.call(defaultOptions);
        // Test pendingRewards()
        let expectedTotalReward = contractRps.mul(new BN(60*60*24*5)).div(rpsMultiplierBN).add(newContractRps.mul(new BN(newSecsToAdvance)).div(rpsMultiplierBN));
        contractPendingReward = await staker.pendingRewards.call(accounts[1], { from: accounts[1] });
        assertEqualWithMargin(contractPendingReward, expectedTotalReward, contractRps.add(newContractRps).div(rpsMultiplierBN), "Wrong pending rewards (view) calculation after adding new campaign" );
        
        // Test withdraw() [both stake + rewards]
        prevUserRewardTokenBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        prevUserDepositTokenBalance = await depositToken.balanceOf(accounts[1], { from: accounts[1] });
        let withdrawAmount = new BN(depositAmount).div(new BN(2));
        await staker.withdraw(withdrawAmount.toString(), { from: accounts[1] });
        let newUserRewardTokenBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        let newUserDepositTokenBalance = await depositToken.balanceOf(accounts[1], { from: accounts[1] });
        
        assertEqualWithMargin(newUserDepositTokenBalance, prevUserDepositTokenBalance.add(withdrawAmount), contractRps.add(newContractRps).div(rpsMultiplierBN), "After withdraw(), wrong deposit token balance");
        assertEqualWithMargin(newUserRewardTokenBalance, prevUserRewardTokenBalance.add(expectedTotalReward), contractRps.add(newContractRps).div(rpsMultiplierBN), "After withdraw(), wrong reward token balance");


    });
    it("should calculate and distribute rewards correctly to multiple stakers + skim functionality", async () => {
        const staker = await Staker.deployed();
        const depositTokenAddr = await staker.depositToken.call();
        const rewardTokenAddr = await staker.rewardToken.call();

        let rewardAmount = web3.utils.toWei("300");
        let days = 30;

        const rewardToken = await MockERC20.at(rewardTokenAddr);
        const depositToken = await MockERC20.at(depositTokenAddr);

        let prevUser1RewardTokenBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        let prevUser1DepositTokenBalance = await depositToken.balanceOf.call(accounts[1], { from: accounts[1] });
        let prevUser2RewardTokenBalance = await rewardToken.balanceOf(accounts[2], { from: accounts[2] });
        let prevUser2DepositTokenBalance = await depositToken.balanceOf.call(accounts[2], { from: accounts[2] });
        
        // Add staking rewards
        await rewardToken.approve(staker.address, rewardAmount, defaultOptions);
        await staker.addRewards(rewardAmount, days, defaultOptions);

        // Transfer deposit token (LPtoken) from user straight to pool without using the stake mechanism.
        // Will test that all rewards are calculated correctly (= without taking this deposit into account)
        // And in the end owner will call skim to collect excess balance.
        let depositAmount = web3.utils.toWei("10");
        await depositToken.transfer(staker.address, depositAmount, { from: accounts[1] });
        prevUser1DepositTokenBalance = await depositToken.balanceOf.call(accounts[1], { from: accounts[1] });

        let contractRps = await staker.rewardPerSecond.call(defaultOptions);

        // User 1 stakes
        await depositToken.approve(staker.address, depositAmount, { from: accounts[1] });
        await staker.deposit(depositAmount, { from: accounts[1] });
        let user1StartingTime = await getTime();

        // Advance time by 10 days (2/3 of campaign length), user 2 now also stakes but 4 times the amount user1 staked
        let secsToAdvance = 60*60*24*10;
        await timeMachine.advanceTimeAndBlock(secsToAdvance);
        let depositAmount2 = web3.utils.toWei((10*4).toString());
        await depositToken.approve(staker.address, depositAmount2, { from: accounts[2] });
        await staker.deposit(depositAmount2, { from: accounts[2] });
        let user2StartingTime = await getTime();

        // Advance time by 20 days, campaign has finished, users call withdraw, make sure users received correct rewards:
        // User1 had 100% of pool for 1/3 of the campaign so should receive 1/3 of the pool (100) + 20% of pool for remaining 20 days so should receive 40 for a total of 140
        // User2 had 80% of pool for 20 days of the campaign so should receive 300*0.8*2/3 = 160
        secsToAdvance = 60*60*24*20;
        await timeMachine.advanceTimeAndBlock(secsToAdvance);
        
        await staker.withdraw(depositAmount.toString(), { from: accounts[1] });
        let user1EndingTime = await getTime();
        await staker.withdraw(depositAmount2.toString(), { from: accounts[2] });
        let user2EndingTime = await getTime();
        let newUser1RewardTokenBalance = await rewardToken.balanceOf(accounts[1], { from: accounts[1] });
        let newUser1DepositTokenBalance = await depositToken.balanceOf.call(accounts[1], { from: accounts[1] });
        let newUser2RewardTokenBalance = await rewardToken.balanceOf(accounts[2], { from: accounts[2] });
        let newUser2DepositTokenBalance = await depositToken.balanceOf.call(accounts[2], { from: accounts[2] });
        assertEqualWithMargin(newUser1DepositTokenBalance, prevUser1DepositTokenBalance, contractRps.div(rpsMultiplierBN), "User1 hasn't received correct amount of deposit back");
        assertEqualWithMargin(newUser2DepositTokenBalance, prevUser2DepositTokenBalance, contractRps.div(rpsMultiplierBN), "User2 hasn't received correct amount of deposit back");
        let user1ExpectedReward = contractRps.mul(new BN(user2StartingTime - user1StartingTime)).div(rpsMultiplierBN).add(contractRps.mul(new BN(user1EndingTime - user2StartingTime)).div(new BN(5)).div(rpsMultiplierBN));
        let user2ExpectedReward = contractRps.mul(new BN(user1EndingTime - user2StartingTime)).mul(new BN(4)).div(new BN(5)).div(rpsMultiplierBN).add(contractRps.mul(new BN(user2EndingTime - user1EndingTime)).div(rpsMultiplierBN));
        assertEqualWithMargin(newUser1RewardTokenBalance, prevUser1RewardTokenBalance.add(user1ExpectedReward), contractRps.div(rpsMultiplierBN),  "User1 hasn't received correct amount of rewards");
        assertEqualWithMargin(newUser2RewardTokenBalance, prevUser2RewardTokenBalance.add(user2ExpectedReward), contractRps.div(rpsMultiplierBN),  "User2 hasn't received correct amount of rewards");
        
        // Owner calls skim() and collects excess balance
        let prevOwnerDepositTokenBalance = await depositToken.balanceOf.call(accounts[0], { from: accounts[0] });
        await staker.skim({from: accounts[0] });
        let newOwnerDepositTokenBalance = await depositToken.balanceOf.call(accounts[0], { from: accounts[0] });
        assert.equal(newOwnerDepositTokenBalance.toString(), prevOwnerDepositTokenBalance.add(new BN(depositAmount)).toString(), "Wrong owner balance after skim()")
    });

    it("should not let user withdraw more than staked", async () => {
        const staker = await Staker.deployed();
        const depositTokenAddr = await staker.depositToken.call();
        const rewardTokenAddr = await staker.rewardToken.call();

        let rewardAmount = web3.utils.toWei("300");
        let days = 30;

        const rewardToken = await MockERC20.at(rewardTokenAddr);
        const depositToken = await MockERC20.at(depositTokenAddr);

        // Add staking rewards
        await rewardToken.approve(staker.address, rewardAmount, defaultOptions);
        await staker.addRewards(rewardAmount, days, defaultOptions);
        // User 1 stakes
        let depositAmount = web3.utils.toWei("10");
        await depositToken.approve(staker.address, depositAmount, { from: accounts[1] });
        await staker.deposit(depositAmount, { from: accounts[1] });
        
        // Try to withdraw more than possible
        let withdrawAmount = web3.utils.toWei("11");
        try {
            await staker.withdraw(withdrawAmount, { from: accounts[1] });;
            throw null;
        }
        catch (error) {
            assert(error, "Expected an error but did not get one");
            assert(error.message.search("revert") >= 0, "Not reverted on too big withdraw");
        }
    });

    it("should limit sensitive functions only to owner", async () => {
        const staker = await Staker.deployed();
        const depositTokenAddr = await staker.depositToken.call();
        const rewardTokenAddr = await staker.rewardToken.call();

        let rewardAmount = web3.utils.toWei("300");
        let days = 30;

        const rewardToken = await MockERC20.at(rewardTokenAddr);
        const depositToken = await MockERC20.at(depositTokenAddr);

        // Add staking rewards
        

        try {
            await staker.addRewards(rewardAmount, days, {from: accounts[1]});
            throw null;
        }
        catch (error) {
            assert(error, "Expected an error but did not get one");
            assert(error.message.search("Ownable") >= 0, "Not reverted on addRewards");
        }

        try {
            await staker.skim( {from: accounts[1]});
            throw null;
        }
        catch (error) {
            assert(error, "Expected an error but did not get one");
            assert(error.message.search("Ownable") >= 0, "Not reverted on skim");
        }
    });
});
