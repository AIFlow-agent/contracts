// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AIOraclePayment.sol";

contract AIOracle {
    address public owner;
    address public paymentContract;

    struct Request {
        address requester;
        string query;
        string ipfsHash;
        bool fulfilled;
    }

    uint256 public requestFee = 10; 
    uint256 public requestCounter;
    mapping(uint256 => Request) public requests;

    event RequestCreated(
        uint256 indexed requestId,
        address indexed requester,
        string query
    );
    event RequestFulfilled(uint256 indexed requestId, string ipfsHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _paymentContract) {
        owner = msg.sender;
        paymentContract = _paymentContract;
    }

    function createRequest(string calldata query) external returns (uint256) {
        AIOraclePayment(paymentContract).pay(requestFee);

        requestCounter++;
        requests[requestCounter] = Request({
            requester: msg.sender,
            query: query,
            ipfsHash: "",
            fulfilled: false
        });

        emit RequestCreated(requestCounter, msg.sender, query);
        return requestCounter;
    }

    function fulfillRequest(
        uint256 requestId,
        string calldata ipfsHash
    ) external onlyOwner {
        Request storage request = requests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        request.ipfsHash = ipfsHash;
        request.fulfilled = true;

        emit RequestFulfilled(requestId, ipfsHash);
    }

    function getRequest(
        uint256 requestId
    ) external view returns (Request memory) {
        return requests[requestId];
    }
}
