const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIOracle", function () {
  let owner, user1;
  let AIOracleToken, aiOracleToken;
  let AIOraclePayment, aiOraclePayment;
  let AIOracle, aiOracle;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy AIOracleToken
    AIOracleToken = await ethers.getContractFactory("AIOracleToken");
    aiOracleToken = await AIOracleToken.deploy(
      "AI Oracle Token",
      "AIO",
      18,
      ethers.parseEther("1000000")
    );
    await aiOracleToken.deployed();

    // Deploy AIOraclePayment
    AIOraclePayment = await ethers.getContractFactory("AIOraclePayment");
    aiOraclePayment = await AIOraclePayment.deploy(aiOracleToken.address);
    await aiOraclePayment.deployed();

    // Deploy AIOracle
    AIOracle = await ethers.getContractFactory("AIOracle");
    aiOracle = await AIOracle.deploy(aiOraclePayment.address);
    await aiOracle.deployed();

    // Mint tokens and deposit for testing
    await aiOracleToken.transfer(user1.address, ethers.parseEther("1000"));
    await aiOracleToken
      .connect(user1)
      .approve(aiOraclePayment.address, ethers.parseEther("100"));
    await aiOraclePayment.connect(user1).deposit(ethers.parseEther("100"));
  });

  it("Should create a request and deduct payment", async function () {
    const tx = await aiOracle
      .connect(user1)
      .createRequest("Query: AI Prediction");
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "RequestCreated");
    const requestId = event.args.requestId;

    const balance = await aiOraclePayment.balances(user1.address);
    expect(balance).to.equal(ethers.parseEther("90"));

    const request = await aiOracle.getRequest(requestId);
    expect(request.query).to.equal("Query: AI Prediction");
    expect(request.fulfilled).to.be.false;
  });

  it("Should allow the owner to fulfill a request", async function () {
    const tx = await aiOracle
      .connect(user1)
      .createRequest("Query: AI Prediction");
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "RequestCreated");
    const requestId = event.args.requestId;

    await aiOracle.fulfillRequest(requestId, "QmIPFSHash123456");
    const request = await aiOracle.getRequest(requestId);

    expect(request.ipfsHash).to.equal("QmIPFSHash123456");
    expect(request.fulfilled).to.be.true;
  });

  it("Should revert if non-owner tries to fulfill a request", async function () {
    const tx = await aiOracle
      .connect(user1)
      .createRequest("Query: AI Prediction");
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "RequestCreated");
    const requestId = event.args.requestId;

    await expect(
      aiOracle.connect(user1).fulfillRequest(requestId, "QmIPFSHash123456")
    ).to.be.revertedWith("Only owner can call this function");
  });
});
