// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title GoldPeggedStablecoin (GLDUSD)
 * @dev A gold-backed stablecoin pegged to 1 gram of gold.
 *      Uses Chainlink oracles for both GOLD/USD and ETH/USD prices.
 *      Implements over-collateralization, liquidity protection, and upgradability.
 */
contract GoldPeggedStablecoin is
    ERC20,
    Ownable,
    Pausable,
    UUPSUpgradeable,
    Initializable
{
    AggregatorV3Interface internal goldPriceFeed; // Chainlink Oracle: Gold/USD
    AggregatorV3Interface internal ethPriceFeed; // Chainlink Oracle: ETH/USD

    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150% collateral requirement
    uint256 public constant MIN_REDEMPTION_AMOUNT = 0.01 ether; // Min ETH amount to prevent draining
    uint256 public constant GOLD_DECIMALS = 8; // Chainlink gold price decimals
    uint256 public constant ETH_DECIMALS = 8; // Chainlink ETH price decimals

    mapping(address => uint256) public depositedETH; // Track ETH deposits

    event Mint(address indexed user, uint256 ethAmount, uint256 stablecoinAmount);
    event Redeem(address indexed user, uint256 stablecoinAmount, uint256 ethAmount);
    event CollateralWithdrawn(address indexed owner, uint256 amount);
    event GoldPriceFeedUpdated(address indexed newPriceFeed);
    event EthPriceFeedUpdated(address indexed newPriceFeed);
    event FiatDepositProcessed(address indexed user, uint256 usdAmount, uint256 stablecoinAmount);

    /// @dev Initialize the contract (for upgradeable structure)
    function initialize(
        address _goldPriceFeed,
        address _ethPriceFeed
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        _mint(msg.sender, 1000 * 10**decimals()); // Mint initial supply for liquidity

        goldPriceFeed = AggregatorV3Interface(_goldPriceFeed);
        ethPriceFeed = AggregatorV3Interface(_ethPriceFeed);
    }

    /**
     * @dev Get latest gold price in USD (8 decimals)
     */
    function getGoldPrice() public view returns (uint256) {
        (, int256 price, , , ) = goldPriceFeed.latestRoundData();
        require(price > 0, "Invalid gold price data");
        return uint256(price);
    }

    /**
     * @dev Get latest ETH price in USD (8 decimals)
     */
    function getEthPrice() public view returns (uint256) {
        (, int256 price, , , ) = ethPriceFeed.latestRoundData();
        require(price > 0, "Invalid ETH price data");
        return uint256(price);
    }

    /**
     * @dev Allows users to deposit ETH and mint GLDUSD stablecoins.
     */
    function mintStablecoin() external payable whenNotPaused {
        require(msg.value > 0, "Must deposit ETH");

        uint256 ethPriceUSD = getEthPrice();
        uint256 goldPriceUSD = getGoldPrice();

        uint256 stablecoinAmount = (msg.value * ethPriceUSD) / goldPriceUSD;

        uint256 requiredCollateral = (stablecoinAmount * COLLATERALIZATION_RATIO) / 100;
        require(
            (depositedETH[msg.sender] + msg.value) * ethPriceUSD / goldPriceUSD >= requiredCollateral,
            "Insufficient collateral"
        );

        depositedETH[msg.sender] += msg.value;
        _mint(msg.sender, stablecoinAmount);

        emit Mint(msg.sender, msg.value, stablecoinAmount);
    }

    /**
     * @dev Allows users to redeem GLDUSD stablecoins back into ETH.
     */
    function redeemStablecoin(uint256 stablecoinAmount) external whenNotPaused {
        require(balanceOf(msg.sender) >= stablecoinAmount, "Insufficient balance");

        uint256 ethPriceUSD = getEthPrice();
        uint256 goldPriceUSD = getGoldPrice();
        uint256 ethAmount = (stablecoinAmount * goldPriceUSD) / ethPriceUSD;

        require(address(this).balance >= ethAmount, "Not enough ETH reserves");
        require(ethAmount >= MIN_REDEMPTION_AMOUNT, "Redemption amount too small");

        _burn(msg.sender, stablecoinAmount);
        payable(msg.sender).transfer(ethAmount);

        emit Redeem(msg.sender, stablecoinAmount, ethAmount);
    }

    /**
     * @dev Allows the contract owner to update the Chainlink price feeds.
     */
    function updateGoldPriceFeed(address newPriceFeed) external onlyOwner {
        goldPriceFeed = AggregatorV3Interface(newPriceFeed);
        emit GoldPriceFeedUpdated(newPriceFeed);
    }

    function updateEthPriceFeed(address newPriceFeed) external onlyOwner {
        ethPriceFeed = AggregatorV3Interface(newPriceFeed);
        emit EthPriceFeedUpdated(newPriceFeed);
    }

    /**
     * @dev Handles fiat deposits from MoonPay and mints stablecoins.
     */
    function processFiatDeposit(address user, uint256 usdAmount) external onlyOwner whenNotPaused {
        uint256 goldPriceUSD = getGoldPrice();
        uint256 stablecoinAmount = (usdAmount * (10**GOLD_DECIMALS)) / goldPriceUSD;

        _mint(user, stablecoinAmount);
        emit FiatDepositProcessed(user, usdAmount, stablecoinAmount);
    }

    /// @dev Pauses contract in case of emergency
    function pause() external onlyOwner {
        _pause();
    }

    /// @dev Unpauses contract
    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}