// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract GoldPeggedStablecoin is ERC20, Ownable {
    AggregatorV3Interface internal goldPriceFeed;
    uint256 public constant GOLD_DECIMALS = 18;
    uint256 public constant COLLATERALIZATION_RATIO = 150;

    mapping(address => uint256) public depositedETH;

    // ✅ Fix: Pass required parameters to ERC20 and Ownable
    constructor(address _goldPriceFeed) ERC20("Gold Stablecoin", "GLDUSD") Ownable(msg.sender) {
        goldPriceFeed = AggregatorV3Interface(_goldPriceFeed);
    }

    function getGoldPrice() public view returns (uint256) {
        (, int price, , , ) = goldPriceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
        return uint256(price);
    }

    function mintStablecoin() external payable {
        require(msg.value > 0, "Must deposit ETH");

        uint256 goldPriceUSD = getGoldPrice();
        uint256 stablecoinAmount = (msg.value * goldPriceUSD) / (10 ** GOLD_DECIMALS);

        require(
            address(this).balance >= (stablecoinAmount * COLLATERALIZATION_RATIO) / 100,
            "Insufficient collateralization"
        );

        depositedETH[msg.sender] += msg.value;
        _mint(msg.sender, stablecoinAmount);
    }

    function redeemStablecoin(uint256 stablecoinAmount) external {
        require(balanceOf(msg.sender) >= stablecoinAmount, "Insufficient balance");

        uint256 goldPriceUSD = getGoldPrice();
        uint256 ethAmount = (stablecoinAmount * (10 ** GOLD_DECIMALS)) / goldPriceUSD;

        require(address(this).balance >= ethAmount, "Insufficient ETH reserves");

        _burn(msg.sender, stablecoinAmount);
        payable(msg.sender).transfer(ethAmount);
    }

    function updateGoldPriceFeed(address newPriceFeed) external onlyOwner {
        goldPriceFeed = AggregatorV3Interface(newPriceFeed);
    }

    function withdrawExcessCollateral(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Not enough collateral");
        payable(owner()).transfer(amount);
    }

    receive() external payable {}
}