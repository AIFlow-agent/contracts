// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AIFlowAgent.sol";
import "./AIFlowAgentToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AIFlowOracle is Ownable {
    struct Agent {
        uint256 agentId;
        address tokenAddress;
    }

    event AgentCreated(uint256 indexed agentId, address tokenAddress);

    AIFlowAgent private immutable _agentNft;
    /**
     * @dev `agentId` or `nft token Id` ==> Agent
     */
    mapping(uint256 => Agent) private _agentOf;

    uint256 _nextQueryId = 1;

    /**
     * @dev `token address` => `agent id`
     */
    mapping(address => uint256) private _tokenOf;

    constructor(
        address _agentNftAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        _agentNft = AIFlowAgent(_agentNftAddress);
    }

    modifier onlyAgentOwner(uint256 agentId) {
        address agentOwner = _agentNft.ownerOf(agentId);
        require(
            msg.sender == agentOwner,
            "The caller must be the owner of this agent"
        );
        _;
    }

    function createAgent(
        address to,
        string memory tokenUri,
        string calldata tokenName,
        string calldata tokenSymbol
    ) external onlyOwner returns (uint256 agentId, address tokenAddress) {
        agentId = _agentNft.safeMint(to, tokenUri);
        AIFlowAgentToken agentToken = new AIFlowAgentToken(
            address(this),
            tokenName,
            tokenSymbol
        );

        tokenAddress = address(agentToken);

        _agentOf[agentId] = Agent({
            agentId: agentId,
            tokenAddress: tokenAddress
        });

        emit AgentCreated(agentId, tokenAddress);
    }

    function mintToken(
        uint256 agentId,
        address to,
        uint256 amount
    ) external onlyAgentOwner(agentId) {
        Agent memory agent = _agentOf[agentId];
        address tokenAddress = agent.tokenAddress;
        AIFlowAgentToken token = AIFlowAgentToken(tokenAddress);
        token.mint(to, amount);
    }

    function updateAgentURI(
        uint256 agentId,
        string calldata newAgentURI
    ) external onlyAgentOwner(agentId) {
        _agentNft.updateTokenURI(agentId, newAgentURI);
    }

    function getAgentIdBy(
        address tokenAddress
    ) external view returns (uint256 agentId) {
        agentId = _tokenOf[tokenAddress];
    }

    function getAgentBy(
        uint256 agentId
    ) external view returns (Agent memory agent) {
        agent = _agentOf[agentId];
    }
}
