// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GoldPeggedStablecoin.sol"; // Ensure this path is correct!

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // Option 1: Hardcoded Address (Make sure it's correct!)
        new GoldPeggedStablecoin(0x694AA1769357215DE4FAC081bf1f309aDC325306); 
        
        // Option 2: Use ENV Variable (Preferred for flexibility)
        // new GoldPeggedStablecoin(vm.envAddress("CHAINLINK_PRICE_FEED")); 

        vm.stopBroadcast();
    }
}