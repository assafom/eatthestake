var Staker = artifacts.require("./Staker.sol");
var ERC20Factory = artifacts.require("./ERC20Factory.sol");
var MockERC20 = artifacts.require("./MockERC20.sol");
var Web3=require('Web3');
require('dotenv').config()


module.exports = async function(deployer, network, accounts) {
  // Sokol
  let depositToken = '0xaa32bb2aded2a2c1a0213bd5aaa84332ae59344e'; // honeyswap MDZA-xDAI Pair
  let rewardToken = '0x4BB2C33e0093bFCA1C3E22f9A0D97af42c8568cB'; // TMDZA on sokol
  /*  // BSC addresses
    let depositToken = '0xdb44c35cd6c378eb9e593d4c7243118064172fb2'; // PancakeSwap V2: ETB
    let rewardToken = '0x7ac64008fa000bfdc4494e0bfcc9f4eff3d51d2a'; // ETB
    */
  // If deploying to dev network, create mock tokens and use them for staking contract.
  if (network == "development" || network == "ganache") {
    await deployer.deploy(ERC20Factory);
    const erc20factory = await ERC20Factory.deployed();
    await erc20factory.createToken("Medooza Eccosystem", "MDZA");
    await erc20factory.createToken("LP MDZA-XDAI", "LPToken");
    const tokens = await erc20factory.getTokens()
    console.log(tokens);
    const lpToken = await MockERC20.at(tokens[1]);
    await lpToken.mint(accounts[1], Web3.utils.toWei("1000000"));
    await lpToken.mint(accounts[2], Web3.utils.toWei("1000000"));

    depositToken = tokens[1];
    rewardToken = tokens[0];
  } else if (network == "sokol") {
    await deployer.deploy(ERC20Factory);
    const erc20factory = await ERC20Factory.deployed();
    await erc20factory.createToken("LP MDZA-XDAI", "LPToken");
    const tokens = await erc20factory.getTokens()
    console.log(tokens);
    await lpToken.mint(process.env.account, Web3.utils.toWei("1000000")); // mint to admin account
    depositToken = tokens
  } else {
    await deployer.deploy(Staker, depositToken, rewardToken);
  }
  
    
};
