var Staker = artifacts.require("./Staker.sol");
var ERC20Factory = artifacts.require("./ERC20Factory.sol");
var MockERC20 = artifacts.require("./MockERC20.sol");
const Web3=require('Web3');

module.exports = async function(deployer, network, accounts) {
  return;
  if (network != "develop") {
    return;
  }

  const staker = await Staker.deployed();
  const depositTokenAddr = await staker.depositToken.call();
  const rewardTokenAddr = await staker.rewardToken.call();

  let rewardAmount = web3.utils.toWei("300");

  const rewardToken = await MockERC20.at(rewardTokenAddr);

  await rewardToken.approve(staker.address, rewardAmount, { from: accounts[0] });

  await staker.addRewards(rewardAmount, 30, { from: accounts[0] });

};
