// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GoldPeggedStablecoin.sol";

contract DeployGoldPeggedStablecoin is Script {
    function run() external {
        vm.startBroadcast();

        // Replace this with the actual Chainlink gold price feed address
        address goldPriceFeed = vm.envAddress("CHAINLINK_PRICE_FEED");

        // Deploy the contract
        GoldPeggedStablecoin stablecoin = new GoldPeggedStablecoin(goldPriceFeed);

        console.log("✅ GoldPeggedStablecoin deployed at:", address(stablecoin));

        vm.stopBroadcast();
    }
}