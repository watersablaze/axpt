// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {GoldPeggedStablecoin} from "../src/GoldPeggedStablecoin.sol";

/**
 * Deploys GoldPeggedStablecoin with 2 Chainlink feed addresses.
 *
 * Env (optional):
 *   GOLD_USD_FEED  // likely not available on Sepolia; defaults to ETH/USD here for smoke tests
 *   ETH_USD_FEED   // Sepolia ETH/USD default below
 *   FOUNDRY_USE_DEFAULTS=true  -> will use fallbacks if env unset
 *
 * Run:
 *   forge script contracts/script/DeployGold.s.sol:DeployGold \
 *     --rpc-url "$SEPOLIA_RPC_URL" \
 *     --private-key "$PRIVATE_KEY" \
 *     --broadcast -vv
 */
contract DeployGold is Script {
    function run() external {
        vm.startBroadcast();

        // NOTE: GOLD_USD_FEED fallback is ETH/USD for dev-only testing.
        address goldUsd = _envOrAddress("GOLD_USD_FEED", 0x694AA1769357215DE4FAC081bf1f309aDC325306);
        address ethUsd  = _envOrAddress("ETH_USD_FEED",  0x694AA1769357215DE4FAC081bf1f309aDC325306); // Sepolia ETH/USD

        GoldPeggedStablecoin g = new GoldPeggedStablecoin(goldUsd, ethUsd);

        console2.log("Deployed GLDUSD at:", address(g));
        console2.log("GOLD/USD feed:", goldUsd);
        console2.log("ETH/USD feed :", ethUsd);

        vm.stopBroadcast();
    }

    function _envOrAddress(string memory key, address fallbackAddr) internal view returns (address) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackAddr;
        try vm.envAddress(key) returns (address a) { return a; } catch { return fallbackAddr; }
    }
}