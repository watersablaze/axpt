// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import { GoldPeggedStablecoin } from "../src/GoldPeggedStablecoin.sol";

contract DeployGoldPeggedStablecoin is Script {
    function run() external {
        vm.startBroadcast();

        // ✅ Deploying the contract with the Chainlink Price Feed
        GoldPeggedStablecoin stablecoin = new GoldPeggedStablecoin(vm.envAddress("CHAINLINK_PRICE_FEED"));

        console.log("✅ Contract deployed at:", address(stablecoin));

        vm.stopBroadcast();
    }
}