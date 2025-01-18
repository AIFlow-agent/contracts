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

    struct Query {
        uint256 queryId;
        uint256 agentId;
        address querier;
        bool fullfilled;
        uint256 consumedToken;
        string requestS3;
        string responseS3;
    }

    event AgentCreated(uint256 indexed agentId, address tokenAddress);

    event QueryCreated(uint256 indexed queryId, string requestS3);

    event QueryFulfilled(
        uint256 indexed queryId,
        string responseS3,
        uint256 consumedToken
    );

    AIFlowAgent private immutable _agentNft;
    /**
     * @dev `agentId` or `nft token Id` ==> Agent
     */
    mapping(uint256 => Agent) private _agentOf;

    uint256 _nextQueryId = 1;
    /**
     * @dev `queryId` => Query
     */
    mapping(uint256 => Query) private _queryOf;

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

    function createQuery(uint256 agentId, string calldata requestS3) external {
        Agent memory agent = _agentOf[agentId];
        require(agent.agentId != 0);
        uint256 queryId = _nextQueryId++;

        Query memory query = _queryOf[queryId];
        query.queryId = queryId;
        query.agentId = agent.agentId;
        query.querier = msg.sender;
        query.requestS3 = requestS3;
        _queryOf[queryId] = query;

        emit QueryCreated(queryId, requestS3);
    }

    function fullfillQuery(
        uint256 agentId,
        uint256 queryId,
        string calldata responseS3,
        uint256 consumedToken
    ) external onlyAgentOwner(agentId) {
        Query memory query = _queryOf[queryId];
        require(agentId == query.agentId);
        query.fullfilled = true;
        query.responseS3 = responseS3;
        query.consumedToken = consumedToken;
        _queryOf[queryId] = query;

        address querier = query.querier;
        Agent memory agent = _agentOf[agentId];
        address tokenAddress = agent.tokenAddress;
        AIFlowAgentToken token = AIFlowAgentToken(tokenAddress);
        token.burnFrom(querier, consumedToken);

        emit QueryFulfilled(queryId, responseS3, consumedToken);
    }

    function getQuery(
        uint256 queryId
    ) external view returns (Query memory query) {
        query = _queryOf[queryId];
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
