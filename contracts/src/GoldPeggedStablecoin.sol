// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title GoldPeggedStablecoin (AXG)
 * @notice Non-upgradeable ERC20 with collateralized mint:
 *         - Collateral ratio enforced in basis points (default 15000 = 150%).
 *         - Uses Chainlink feeds for ETH/USD and GOLD/USD.
 *         - Users deposit ETH, contract mints AXG at ETH/USD ÷ GOLD/USD (unit-consistent).
 */
contract GoldPeggedStablecoin is ERC20, Ownable, Pausable {
    AggregatorV3Interface public goldPriceFeed; // GOLD / USD
    AggregatorV3Interface public ethPriceFeed;  // ETH  / USD

    // e.g., 15000 = 150% collateral (contract ETH value ≥ 1.5× AXG liabilities by price)
    uint16 public collateralRatioBps = 15000;

    event DepositMint(address indexed sender, address indexed to, uint256 ethIn, uint256 axgOut);
    event CollateralRatioUpdated(uint16 oldBps, uint16 newBps);

    constructor(address _goldUsdFeed, address _ethUsdFeed)
        ERC20("AXPT Gold Stablecoin", "AXG")
        Ownable(msg.sender)
    {
        goldPriceFeed = AggregatorV3Interface(_goldUsdFeed);
        ethPriceFeed  = AggregatorV3Interface(_ethUsdFeed);
    }

    // --- Owner controls ---

    function setCollateralRatioBps(uint16 newBps) external onlyOwner {
        // sanity guard: 100%..300% is a reasonable operational band; tweak if needed
        require(newBps >= 10000 && newBps <= 30000, "ratio out of range");
        uint16 old = collateralRatioBps;
        collateralRatioBps = newBps;
        emit CollateralRatioUpdated(old, newBps);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // Bootstrap (owner-only) mint/burn if you still want this path for testing
    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }
    function burn(address from, uint256 amount) external onlyOwner { _burn(from, amount); }

    // --- Pricing helpers ---

    function _latest(AggregatorV3Interface feed) internal view returns (int256 answer, uint8 dec) {
        (, int256 a,,,) = feed.latestRoundData();
        require(a > 0, "bad price");
        dec = feed.decimals();
        return (a, dec);
    }

    /// @dev Return AXG output for a given wei of ETH at current prices.
    function previewMintOut(uint256 ethAmountWei) public view returns (uint256 axgOutWei) {
        require(ethAmountWei > 0, "no eth");
        (int256 goldAns, uint8 goldDec) = _latest(goldPriceFeed);
        (int256 ethAns,  uint8 ethDec)  = _latest(ethPriceFeed);

        // Convert: axgOut = ethAmount * ETH_USD / GOLD_USD (all in 1e18 AXG)
        // scale: ethAmountWei (1e18) * (ethAns / 1e{ethDec}) / (goldAns / 1e{goldDec})
        // => ethAmountWei * ethAns * 1e{goldDec} / (goldAns * 1e{ethDec})
        uint256 num = ethAmountWei * uint256(int256(ethAns)) * (10 ** goldDec);
        uint256 den = uint256(int256(goldAns)) * (10 ** ethDec);
        axgOutWei = num / den; // AXG has 18 decimals, so wei-like
    }

    /// @dev Collateral ratio after a hypothetical mint (bps).
    function previewPostMintRatioBps(uint256 ethInWei, uint256 axgOutWei) public view returns (uint256 bps) {
        (int256 goldAns, uint8 goldDec) = _latest(goldPriceFeed);
        (int256 ethAns,  uint8 ethDec)  = _latest(ethPriceFeed);

        // Post state (simulate):
        //  - ETH reserve increases by ethInWei
        //  - Liabilities (supply) increases by axgOutWei
        uint256 postEth = address(this).balance + ethInWei;
        uint256 postAxg = totalSupply() + axgOutWei;

        if (postAxg == 0) return type(uint256).max; // infinite if no liabilities

        // ratio = (ETH_value / AXG_value) in bps
        // ETH_value = postEth * ETH_USD / 1e{ethDec}
        // AXG_value = postAxg * GOLD_USD / 1e{goldDec}
        // bps = (ETH_value / AXG_value) * 1e4
        //     = postEth * ETH_USD * 1e{goldDec} * 1e4 / (postAxg * GOLD_USD * 1e{ethDec})
        uint256 num = postEth * uint256(int256(ethAns)) * (10 ** goldDec) * 10000;
        uint256 den = postAxg * uint256(int256(goldAns)) * (10 ** ethDec);
        bps = den == 0 ? type(uint256).max : num / den;
    }

    /// @dev Current collateral ratio (bps) for status UI.
    function reserveRatioBps() public view returns (uint256 bps) {
        (int256 goldAns, uint8 goldDec) = _latest(goldPriceFeed);
        (int256 ethAns,  uint8 ethDec)  = _latest(ethPriceFeed);

        uint256 axg = totalSupply();
        if (axg == 0) return type(uint256).max;

        uint256 num = address(this).balance * uint256(int256(ethAns)) * (10 ** goldDec) * 10000;
        uint256 den = axg * uint256(int256(goldAns)) * (10 ** ethDec);
        bps = den == 0 ? type(uint256).max : num / den;
    }

    /// @dev ETH required right now to reach target ratio (best-effort, for UI).
    function requiredEthForTarget() external view returns (uint256 weiNeeded) {
        uint256 axg = totalSupply();
        if (axg == 0) return 0;

        (int256 goldAns, uint8 goldDec) = _latest(goldPriceFeed);
        (int256 ethAns,  uint8 ethDec)  = _latest(ethPriceFeed);

        // Target: (ETH_value / AXG_value) >= collateralRatioBps/1e4
        // Solve for ETH_value:
        // ETH_value >= AXG_value * ratio
        // postEth * ETH_USD / 1e{ethDec} >= (axg * GOLD_USD / 1e{goldDec}) * ratio
        // postEth >= axg * GOLD_USD * 1e{ethDec} * ratio / (ETH_USD * 1e{goldDec})
        uint256 targetEth = (
            uint256(axg) *
            uint256(int256(goldAns)) *
            (10 ** ethDec) *
            uint256(collateralRatioBps)
        ) / (uint256(int256(ethAns)) * (10 ** goldDec) * 10000);

        if (address(this).balance >= targetEth) return 0;
        weiNeeded = targetEth - address(this).balance;
    }

    // --- User flow: deposit ETH, mint AXG if ratio stays healthy ---

    function depositAndMint(address to, uint256 minOut) external payable whenNotPaused returns (uint256 out) {
        require(to != address(0), "bad to");
        require(msg.value > 0, "no eth");

        out = previewMintOut(msg.value);
        require(out >= minOut, "slippage");

        uint256 postBps = previewPostMintRatioBps(msg.value, out);
        require(postBps >= collateralRatioBps, "collateral too low");

        _mint(to, out);
        emit DepositMint(msg.sender, to, msg.value, out);
    }

    receive() external payable {}
}