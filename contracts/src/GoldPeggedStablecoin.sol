// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "chainlink-contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "chainlink-contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "chainlink-contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract GoldPeggedStablecoin is ERC20, Ownable, VRFConsumerBaseV2 {
    AggregatorV3Interface internal goldPriceFeed;
    VRFCoordinatorV2Interface internal vrfCoordinator;

    uint256 public constant GOLD_DECIMALS = 18;
    uint256 public constant COLLATERALIZATION_RATIO = 150;

    bytes32 public keyHash;
    uint64 public subscriptionId;
    uint256 public randomValue;

    mapping(address => uint256) public depositedETH;

    event RequestedRandomness(uint256 requestId);
    event ReceivedRandomness(uint256 randomValue);

    constructor(
        address _goldPriceFeed,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) ERC20("Gold Stablecoin", "GLDUSD") VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        goldPriceFeed = AggregatorV3Interface(_goldPriceFeed);
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
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

    function requestRandomWords() external onlyOwner {
        uint32 numWords = 1;
        uint16 minConfirmations = 3;
        uint32 callbackGasLimit = 100000;

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            minConfirmations,
            callbackGasLimit,
            numWords
        );

        emit RequestedRandomness(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        randomValue = randomWords[0];

        emit ReceivedRandomness(randomValue);
    }

    receive() external payable {}
}