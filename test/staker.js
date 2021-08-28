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


    it("should init the values", async () => {
    const staker = await Staker.deployed();
    const depositTokenAddr = await staker.depositToken.call();
    const rewardTokenAddr = await staker.rewardToken.call();
    console.log(depositTokenAddr);
    console.log(rewardTokenAddr);

    let rewardAmount = web3.utils.toWei("300");

    const depositToken = await MockERC20.at(depositTokenAddr);
    const rewardToken = await MockERC20.at(rewardTokenAddr);

    await rewardToken.approve(staker.address, rewardAmount, { from: accounts[0] });

    await staker.addRewards(rewardAmount, 30);

    console.log(await staker.rewardPerSecond.call());

    console.log((await staker.getTime.call()).toString());

    await timeMachine.advanceTimeAndBlock(60*60*24*30);
    console.log((await staker.getTime.call()).toString());
    /*
    // Set value of 89
    await staker.set(89, { from: accounts[0] });

    // Get stored value
    const storedData = await staker.get.call();

    assert.equal(storedData, 89, "The value 89 was not stored.");*/
    });
});
