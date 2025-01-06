const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIOraclePayment", function () {
  let owner, user1, user2;
  let AIOracleToken, aiOracleToken;
  let AIOraclePayment, aiOraclePayment;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

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

    // Mint tokens for testing
    await aiOracleToken.transfer(user1.address, ethers.parseEther("1000"));
  });

  it("Should allow users to deposit tokens", async function () {
    await aiOracleToken
      .connect(user1)
      .approve(aiOraclePayment.address, ethers.parseEther("100"));
    await aiOraclePayment.connect(user1).deposit(ethers.parseEther("100"));

    const balance = await aiOraclePayment.balances(user1.address);
    expect(balance).to.equal(ethers.parseEther("100"));
  });

  it("Should allow users to withdraw tokens", async function () {
    await aiOracleToken
      .connect(user1)
      .approve(aiOraclePayment.address, ethers.parseEther("100"));
    await aiOraclePayment.connect(user1).deposit(ethers.parseEther("100"));
    await aiOraclePayment.connect(user1).withdraw(ethers.parseEther("50"));

    const balance = await aiOraclePayment.balances(user1.address);
    expect(balance).to.equal(ethers.parseEther("50"));
  });

  it("Should handle payments correctly", async function () {
    await aiOracleToken
      .connect(user1)
      .approve(aiOraclePayment.address, ethers.parseEther("100"));
    await aiOraclePayment.connect(user1).deposit(ethers.parseEther("100"));
    await aiOraclePayment.connect(user1).pay(ethers.parseEther("10"));

    const balance = await aiOraclePayment.balances(user1.address);
    expect(balance).to.equal(ethers.parseEther("90"));
  });
});
