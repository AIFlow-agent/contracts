const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIOracleToken", function () {
  let owner, user1, user2;
  let AIOracleToken, aiOracleToken;

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

    // Mint tokens for testing
    await aiOracleToken.transfer(user1.address, ethers.parseEther("1000"));
    await aiOracleToken.transfer(user2.address, ethers.parseEther("1000"));
  });

  it("Should mint and transfer tokens correctly", async function () {
    const user1Balance = await aiOracleToken.balanceOf(user1.address);
    expect(user1Balance).to.equal(ethers.parseEther("1000"));
  });

  it("Should allow transfers between users", async function () {
    await aiOracleToken
      .connect(user1)
      .transfer(user2.address, ethers.parseEther("100"));
    const user2Balance = await aiOracleToken.balanceOf(user2.address);
    expect(user2Balance).to.equal(ethers.parseEther("1100"));
  });
});
