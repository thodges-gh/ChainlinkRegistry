var Oracle = artifacts.require("Oracle");
var LinkToken = artifacts.require("LinkToken");

module.exports = (deployer) => {
	deployer.deploy(Oracle, LinkToken.address);
};