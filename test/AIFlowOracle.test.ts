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

  it("should successfully update the agent URI", async () => {
    const { aiAgents, aiOracle } = await loadFixture(deployContracts);
    const [owner, oeprator] = await ethers.getSigners();
    const testTokenUriV1 = "Test Token URI V1";
    const testTokenName = "Test Token Name";
    const testTokenSymbol = "TTT";

    await aiOracle.createAgent(
      owner,
      testTokenUriV1,
      testTokenName,
      testTokenSymbol
    );

    let tokenUri = await aiAgents.tokenURI(1);
    expect(tokenUri).to.be.equals(testTokenUriV1);

    const testTokenUriV2 = "Test Token URI V2";
    await aiOracle.updateAgentURI(1, testTokenUriV2);
    tokenUri = await aiAgents.tokenURI(1);
    expect(tokenUri).to.be.equals(testTokenUriV2);

    await expect(aiOracle.connect(oeprator).updateAgentURI(1, testTokenUriV2))
      .to.be.rejected;
  });
});
