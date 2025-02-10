// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GoldPeggedStablecoin.sol";

contract DeployGoldPeggedStablecoin is Script {
    function run() external {
        vm.startBroadcast();

        // ✅ Replace with actual Chainlink Price Feed address
        address goldPriceFeed = vm.envAddress("CHAINLINK_PRICE_FEED");

        // ✅ Deploy contract
        GoldPeggedStablecoin stablecoin = new GoldPeggedStablecoin(goldPriceFeed);

        console.log("✅ GoldPeggedStablecoin deployed at:", address(stablecoin));

        vm.stopBroadcast();
    }
}