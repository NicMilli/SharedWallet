var SharedWallet = artifacts.require("./SharedWallet.sol");

module.exports = function(deployer) {
  deployer.deploy(SharedWallet);
};
