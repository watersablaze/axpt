// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract GoldPeggedStablecoin is ERC20, Ownable {
    AggregatorV3Interface internal immutable goldPriceFeed; // 🔹 Marked immutable for gas efficiency
    uint256 public constant GOLD_DECIMALS = 18;
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150% collateral ratio

    mapping(address => uint256) public depositedETH;

    event Minted(address indexed user, uint256 ethDeposited, uint256 stablecoinMinted);
    event Redeemed(address indexed user, uint256 stablecoinBurned, uint256 ethWithdrawn);
    event PriceFeedUpdated(address indexed oldPriceFeed, address indexed newPriceFeed);
    event CollateralWithdrawn(address indexed owner, uint256 amount);

    constructor(address _goldPriceFeed) ERC20("Gold Stablecoin", "GLDUSD") {
        require(_goldPriceFeed != address(0), "Invalid price feed address");
        goldPriceFeed = AggregatorV3Interface(_goldPriceFeed);
    }

    function getGoldPrice() public view returns (uint256) {
        (, int256 price, , , ) = goldPriceFeed.latestRoundData();
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

        emit Minted(msg.sender, msg.value, stablecoinAmount);
    }

    function redeemStablecoin(uint256 stablecoinAmount) external {
        require(balanceOf(msg.sender) >= stablecoinAmount, "Insufficient balance");

        uint256 goldPriceUSD = getGoldPrice();
        uint256 ethAmount = (stablecoinAmount * (10 ** GOLD_DECIMALS)) / goldPriceUSD;

        require(address(this).balance >= ethAmount, "Insufficient ETH reserves");

        _burn(msg.sender, stablecoinAmount);
        payable(msg.sender).transfer(ethAmount);

        emit Redeemed(msg.sender, stablecoinAmount, ethAmount);
    }

    function updateGoldPriceFeed(address newPriceFeed) external onlyOwner {
        require(newPriceFeed != address(0), "Invalid price feed address");

        address oldPriceFeed = address(goldPriceFeed);
        goldPriceFeed = AggregatorV3Interface(newPriceFeed);

        emit PriceFeedUpdated(oldPriceFeed, newPriceFeed);
    }

    function withdrawExcessCollateral(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Not enough collateral");

        payable(owner()).transfer(amount);

        emit CollateralWithdrawn(owner(), amount);
    }

    receive() external payable {}
}