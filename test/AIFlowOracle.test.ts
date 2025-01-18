import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

describe("AIFlowOracle", () => {
  async function deployContracts() {
    const aiAgents = await hre.ethers.deployContract("AIFlowAgent");
    const aiAgentsAddress = await aiAgents.getAddress();
    const [owner] = await ethers.getSigners();
    const aiOracle = await hre.ethers.deployContract("AIFlowOracle", [
      aiAgentsAddress,
      owner.address,
    ]);
    const aiOracleAddress = await aiOracle.getAddress();
    await aiAgents.transferOwnership(aiOracleAddress);

    return { aiAgents, aiOracle };
  }

  it("should have ownership", async () => {
    const { aiAgents, aiOracle } = await loadFixture(deployContracts);
    const [deployer] = await hre.ethers.getSigners();
    const aiOracleOwner = await aiOracle.owner();
    expect(deployer.address).to.be.equals(aiOracleOwner);

    const aiAgentsOwner = await aiAgents.owner();
    const aiOracleAddress = await aiOracle.getAddress();
    expect(aiAgentsOwner).to.be.equals(aiOracleAddress);
  });

  it("should successfully create the AI Agent.", async () => {
    const { aiAgents, aiOracle } = await loadFixture(deployContracts);
    const [deployer, signer] = await hre.ethers.getSigners();

    const agentOwner = signer.address;
    const testTokenUri = "Test Token URI";
    const testTokenName = "Test Token Name";
    const testTokenSymbol = "TTN";
    const response = await aiOracle.createAgent(
      agentOwner,
      testTokenUri,
      testTokenName,
      testTokenSymbol
    );
    const receipt = await response.wait();
    const agent = await aiOracle.getAgentBy(1);
    const agentTokenAddress = agent.tokenAddress;

    await expect(receipt)
      .to.emit(aiOracle, "AgentCreated")
      .withArgs(1, agentTokenAddress);

    const balance = await aiAgents.balanceOf(signer.address);
    expect(balance).to.be.equals(1);
    const queriedAgentOwner = await aiAgents.ownerOf(1);
    expect(queriedAgentOwner).to.be.equals(agentOwner);
  });

  it("should successfully create & fullfill the Query.", async () => {
    const { aiAgents, aiOracle } = await loadFixture(deployContracts);
    const [deployer, agentOwner, querier] = await ethers.getSigners();

    const testTokenUri = "Test token URI.";
    const testTokenName = "Test Token Name";
    const testTokenSymbol = "TTN";
    const createAgentResponse = await aiOracle.createAgent(
      agentOwner.address,
      testTokenUri,
      testTokenName,
      testTokenSymbol
    );
    await createAgentResponse.wait();
    const querierAiOracle = aiOracle.connect(querier);
    const testRequestS3 = "Test Request S3";
    const queryResponse = await querierAiOracle.createQuery(1, testRequestS3);
    const queryReceipt = await queryResponse.wait();
    await expect(queryReceipt)
      .to.emit(aiOracle, "QueryCreated")
      .withArgs(1, testRequestS3);

    const agent = await aiOracle.getAgentBy(1);
    const agentToken = await ethers.getContractAt(
      "AIFlowAgentToken",
      agent.tokenAddress
    );

    const mintTokenResponse = await aiOracle
      .connect(agentOwner)
      .mintToken(1, querier.address, 300);
    await mintTokenResponse.wait();

    const querierAgentTokenBalance = await agentToken.balanceOf(
      querier.address
    );
    expect(querierAgentTokenBalance).to.be.equals(300);

    const aiOracleAddress = await aiOracle.getAddress();
    const approveResponse = await agentToken
      .connect(querier)
      .approve(aiOracleAddress, 200);
    await approveResponse.wait();

    const testResponseS3 = "Test Response S3";
    const consumedToken = 113;
    const fullfillQueryResponse = await aiOracle
      .connect(agentOwner)
      .fullfillQuery(1, 1, testResponseS3, consumedToken);
    const fullfillQueryReceipt = await fullfillQueryResponse.wait();
    await expect(fullfillQueryReceipt).to.emit(aiOracle, "QueryFulfilled");
  });
});
