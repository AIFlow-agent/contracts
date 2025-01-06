// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AIOraclePayment {
    IERC20 public aiOracleToken;
    address public owner;

    mapping(address => uint256) public balances;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Payment(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _aiOracleToken) {
        aiOracleToken = IERC20(_aiOracleToken);
        owner = msg.sender;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than zero");
        aiOracleToken.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function pay(uint256 amount) external {
        require(amount > 0, "Payment amount must be greater than zero");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        emit Payment(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        aiOracleToken.transfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function withdrawAll() external onlyOwner {
        uint256 contractBalance = aiOracleToken.balanceOf(address(this));
        aiOracleToken.transfer(owner, contractBalance);
    }
}
