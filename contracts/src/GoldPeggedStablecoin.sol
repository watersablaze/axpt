// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title GoldPeggedStablecoin
 * @dev A stablecoin pegged to real-world gold prices using Chainlink oracles.
 *      1 GLDUSD = 1 gram of gold (price derived from ETH/USD oracle)
 */
contract GoldPeggedStablecoin is ERC20, Ownable {
    AggregatorV3Interface internal goldPriceFeed; // Chainlink Oracle
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150% over-collateralization
    uint256 public constant GOLD_DECIMALS = 8; // Chainlink price feed decimals

    mapping(address => uint256) public depositedETH; // Track ETH deposits

    event Mint(address indexed user, uint256 ethAmount, uint256 stablecoinAmount);
    event Redeem(address indexed user, uint256 stablecoinAmount, uint256 ethAmount);
    event CollateralWithdrawn(address indexed owner, uint256 amount);
    event GoldPriceFeedUpdated(address indexed newPriceFeed);

    constructor(address _goldPriceFeed) ERC20("Gold Stablecoin", "GLDUSD") Ownable(msg.sender) {
        goldPriceFeed = AggregatorV3Interface(_goldPriceFeed);
    }

    /**
     * @dev Returns the latest gold price in USD (8 decimal places).
     */
    function getGoldPrice() public view returns (uint256) {
        (, int256 price, , , ) = goldPriceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
        return uint256(price); // Price is returned with 8 decimals
    }

    /**
     * @dev Allows users to deposit ETH and mint GLDUSD stablecoins.
     */
    function mintStablecoin() external payable {
        require(msg.value > 0, "Must deposit ETH");

        uint256 goldPriceUSD = getGoldPrice();
        uint256 stablecoinAmount = (msg.value * goldPriceUSD) / (10 ** GOLD_DECIMALS);

        uint256 requiredCollateral = (stablecoinAmount * COLLATERALIZATION_RATIO) / 100;
        require(
            (depositedETH[msg.sender] + msg.value) * goldPriceUSD / (10 ** GOLD_DECIMALS) >= requiredCollateral,
            "Insufficient collateral"
        );

        depositedETH[msg.sender] += msg.value;
        _mint(msg.sender, stablecoinAmount);

        emit Mint(msg.sender, msg.value, stablecoinAmount);
    }

    /**
     * @dev Allows users to redeem GLDUSD stablecoins back into ETH.
     */
    function redeemStablecoin(uint256 stablecoinAmount) external {
        require(balanceOf(msg.sender) >= stablecoinAmount, "Insufficient balance");

        uint256 goldPriceUSD = getGoldPrice();
        uint256 ethAmount = (stablecoinAmount * (10 ** GOLD_DECIMALS)) / goldPriceUSD;

        require(address(this).balance >= ethAmount, "Insufficient ETH reserves");

        _burn(msg.sender, stablecoinAmount);
        payable(msg.sender).transfer(ethAmount);

        emit Redeem(msg.sender, stablecoinAmount, ethAmount);
    }

    /**
     * @dev Allows the owner to update the Chainlink gold price oracle.
     */
    function updateGoldPriceFeed(address newPriceFeed) external onlyOwner {
        goldPriceFeed = AggregatorV3Interface(newPriceFeed);
        emit GoldPriceFeedUpdated(newPriceFeed);
    }

    /**
     * @dev Allows the contract owner to withdraw excess ETH collateral.
     */
    function withdrawExcessCollateral(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Not enough collateral");
        payable(owner()).transfer(amount);

        emit CollateralWithdrawn(owner(), amount);
    }

    /**
     * @dev Fallback function to receive ETH.
     */
    receive() external payable {}
}