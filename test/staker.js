const Staker = artifacts.require("./Staker.sol");
const timeMachine = require('ganache-time-traveler');
var ERC20Factory = artifacts.require("./ERC20Factory.sol");
var MockERC20 = artifacts.require("./MockERC20.sol");


contract("Staker", async accounts => {

    /*beforeEach(async() => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot['result'];
    });

    afterEach(async() => {
        await timeMachine.revertToSnapshot(snapshotId);
    });*/


    it("should init the values", async () => {
    const staker = await Staker.deployed();
    const depositTokenAddr = await staker.depositToken.call();
    const rewardTokenAddr = await staker.rewardToken.call();

    let rewardAmount = web3.utils.toWei("300");

    const depositToken = await MockERC20.at(depositTokenAddr);
    const rewardToken = await MockERC20.at(rewardTokenAddr);

    await rewardToken.approve(staker.address, rewardAmount, { from: accounts[0] });

    await staker.addRewards(rewardAmount, 30);
    temp = await staker.rewardPeriodEndTimestamp.call();
    console.log("ending timestamp :" + temp.toString());

    temp = await depositToken.balanceOf.call(accounts[1], { from: accounts[1] });
    console.log("account1 deposit at begin : " + (temp).toString());

    let depositAmount = web3.utils.toWei("10");
    await depositToken.approve(staker.address, depositAmount, { from: accounts[1] });
    await staker.deposit(depositAmount, { from: accounts[1] });
    let bbefore = await staker.pendingRewards.call(accounts[1], { from: accounts[1] });
    console.log("pending rewards after init deposit: " + (bbefore).toString());

    /*await timeMachine.advanceTimeAndBlock(60*60*24*15);
    console.log("adv 15, current timestamp :" + (await staker.getTime.call()).toString());
    temp = await staker.pendingRewards.call(accounts[1], { from: accounts[0] });
    console.log("p account1 after 15 : " + web3.utils.toWei(temp));*/

    temp = await staker.withdraw.call(web3.utils.toWei("10"), { from: accounts[1] });
    temp = await rewardToken.balanceOf.call(accounts[1], { from: accounts[1] });
    console.log("account1 reward at end : " + (temp).toString());
    temp2 = await depositToken.balanceOf.call(accounts[1], { from: accounts[1] });
    console.log("account1 deposit at end : " + (temp2).toString());
    console.log("original :" + depositAmount);


    /*

    await depositToken.approve(staker.address, depositAmount, { from: accounts[2] });
    await staker.deposit(depositAmount, { from: accounts[2] });
    await timeMachine.advanceTimeAndBlock(60*60*24*15);
    console.log("adv 15, current timestamp :" + (await staker.getTime.call()).toString());
    temp = await staker.pendingRewards.call(accounts[1], { from: accounts[0] });
    console.log("p account1 after 30 : " + web3.utils.toWei(temp));
    temp = await staker.pendingRewards.call(accounts[2], { from: accounts[0] });
    console.log("p account2 after 30 : " + web3.utils.toWei(temp));

    await timeMachine.advanceTimeAndBlock(60*60*24*15);
    console.log("adv 15, current timestamp :" + (await staker.getTime.call()).toString());
    temp = await staker.pendingRewards.call(accounts[1], { from: accounts[0] });
    console.log("p account1 after 45 : " + web3.utils.toWei(temp));
    temp = await staker.pendingRewards.call(accounts[2], { from: accounts[0] });
    console.log("p account2 after 45 : " + web3.utils.toWei(temp));

    temp = await staker.withdraw.call(depositAmount, { from: accounts[1] });
    temp = await rewardToken.balanceOf.call(accounts[1], { from: accounts[1] });
    console.log("account1 at end : " + web3.utils.toWei(temp));
    temp = await staker.withdraw.call(depositAmount, { from: accounts[2] });
    temp = await rewardToken.balanceOf.call(accounts[2], { from: accounts[2] });
    console.log("account2 at end : " + web3.utils.toWei(temp));
    console.log("orig rewards: " + rewardAmount);*/


    });
});
