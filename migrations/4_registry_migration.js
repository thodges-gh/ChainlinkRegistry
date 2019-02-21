var Registry = artifacts.require("Registry");
var LinkToken = artifacts.require("LinkToken");
var Oracle = artifacts.require("Oracle");

module.exports = (deployer, network, accounts) => {
	deployer.deploy(Registry, LinkToken.address, Oracle.address, {from: accounts[0]});
};