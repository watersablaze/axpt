// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GoldPeggedStablecoin.sol";

contract DeployGoldStablecoin is Script {
    function run() external {
        vm.startBroadcast();

        // Replace with your Chainlink Gold Price Feed address
        address goldPriceFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
        new GoldPeggedStablecoin(goldPriceFeed);

        vm.stopBroadcast();
    }
}