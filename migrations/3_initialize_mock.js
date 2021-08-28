var Staker = artifacts.require("./Staker.sol");
var ERC20Factory = artifacts.require("./ERC20Factory.sol");
var MockERC20 = artifacts.require("./MockERC20.sol");
const Web3=require('Web3');

module.exports = async function(deployer, network, accounts) {
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

  /*const prisale = await Prisale.deployed();
  console.log("prisale address " + prisale.address);
  console.log("prisale owner " + await prisale.owner());

  await prisale.addCampaign("TigerDEX", (10**17).toString());
  await prisale.addCampaign("Kom Finance", (2 * 10**18).toString());

  const erc20factory = await ERC20Factory.deployed();
  await erc20factory.createToken("Tether", "USDT");
  await erc20factory.createToken("Presale Token 1", "PRE1");
  await erc20factory.createToken("Presale Token 2", "PRE2");
  const tokens = await erc20factory.getTokens()
  console.log(tokens);
  const tether = await MockERC20.at(tokens[0]);
  await tether.mint(accounts[1], Web3.utils.toWei("10000"));
  await tether.mint(accounts[2], Web3.utils.toWei("10000"));
  await prisale.setUSDTToken(tokens[0]);*/
};
