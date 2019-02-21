"use strict";

const h = require("chainlink-test-helpers");

let Oracle = artifacts.require("Oracle.sol");
let LinkToken = artifacts.require("LinkToken.sol");
let Registry = artifacts.require("Registry.sol");

contract("Registry", (accounts) => {
	let owner = accounts[0];
	let oracleNode = accounts[1];
	let user1 = accounts[2];
	let oracleContract, linkTokenContract, registryContract;

	beforeEach(async () => {
		linkTokenContract = await LinkToken.new();
		oracleContract = await Oracle.new(
			linkTokenContract.address,
			{from: owner});
		registryContract = await Registry.new(
			linkTokenContract.address,
			oracleContract.address);
		await oracleContract.setFulfillmentPermission(
			oracleNode, true, {from: owner});
		await linkTokenContract.transfer(
			registryContract.address, 
			web3.utils.toWei("1", "ether"));
	});

	// The id is not important for testing. The contract will use a Job ID or Service Agreement ID
	const id = "0xabc123";

	context("when a response is valid", () => {
		const validRequest = "This request is valid";
		const validResponse = web3.utils.asciiToHex("Success!", 32);
		const expectedNumberOfLogs = 2;

		let request, log;

		beforeEach(async () => {
			let tx = await registryContract.register(id, validRequest, {from: user1});
			request = h.decodeRunRequest(tx.receipt.rawLogs[3]);
			log = await h.fulfillOracleRequest(oracleContract, request, validResponse, {from: oracleNode});
		});

		it("registers the caller with the oracle response", async () => {
			const reg = await registryContract.registry.call(user1);
			assert.equal(web3.utils.padRight(validResponse, 64), reg);
		});

		it("logs an event with the address of the requester", async () => {
			assert.equal(log.receipt.rawLogs.length, expectedNumberOfLogs);
			assert.equal(log.receipt.rawLogs[1].topics[0], web3.utils.keccak256("AddToRegistry(address,bytes32)"));
			assert.equal(log.receipt.rawLogs[1].topics[1], web3.utils.padLeft(user1, 64).toLowerCase());
		});
	});

	context("when a response is invalid", () => {
		const invalidRequest = "This request is invalid";
		const invalidResponse = web3.utils.toHex(0);
		const expectedNumberOfLogs = 1;

		let request, log;

		beforeEach(async () => {
			let tx = await registryContract.register(id, invalidRequest, {from: user1});
			request = h.decodeRunRequest(tx.receipt.rawLogs[3]);
			log = await h.fulfillOracleRequest(oracleContract, request, invalidResponse, {from: oracleNode});
		});

		it("does not register the caller", async () => {
			const reg = await registryContract.registry.call(user1);
			assert.equal(web3.utils.padRight(invalidResponse, 64), reg);
		});

		it("does not log an extra event", async () => {
			assert.equal(log.receipt.rawLogs.length, expectedNumberOfLogs);
		});
	});
});