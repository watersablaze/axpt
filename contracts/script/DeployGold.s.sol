// contracts/script/DeployGold.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {GoldPeggedStablecoin} from "../src/GoldPeggedStablecoin.sol";

/**
 * Env (optional):
 *   GOLD_USD_FEED, ETH_USD_FEED
 *   FOUNDRY_USE_DEFAULTS=true → use Sepolia ETH/USD for both (smoke)
 *
 * Run (broadcast):
 *   forge script contracts/script/DeployGold.s.sol:DeployGold \
 *     --rpc-url $SEPOLIA_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast -vv
 */
contract DeployGold is Script {
    function run() external {
        vm.startBroadcast();

        // For quick smoke: use the Sepolia ETH/USD feed for both when defaults enabled
        address fallbackFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // Sepolia ETH/USD
        address goldUsd = _envOrAddress("GOLD_USD_FEED", fallbackFeed);
        address ethUsd  = _envOrAddress("ETH_USD_FEED",  fallbackFeed);

        GoldPeggedStablecoin axg = new GoldPeggedStablecoin(goldUsd, ethUsd);

        console2.log("Deployed AXG at:", address(axg));
        console2.log("GOLD/USD feed:", goldUsd);
        console2.log("ETH/USD  feed:", ethUsd);

        vm.stopBroadcast();
    }

    function _envOrAddress(string memory key, address fallbackAddr) internal view returns (address) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackAddr;
        try vm.envAddress(key) returns (address a) { return a; } catch { return fallbackAddr; }
    }
}