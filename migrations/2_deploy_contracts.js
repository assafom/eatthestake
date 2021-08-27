var Prisale = artifacts.require("./Prisale.sol");
var ERC20Factory = artifacts.require("./ERC20Factory.sol");

module.exports = async function(deployer, network) {
  deployer.deploy(Prisale);
  if (network == "develop")
    deployer.deploy(ERC20Factory);
};
