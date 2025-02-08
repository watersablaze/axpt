// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import { GoldPeggedStablecoin } from "../src/GoldPeggedStablecoin.sol";

contract InteractWithStablecoin is Script {
    function run() external {
        vm.startBroadcast();

        address stablecoinAddress = vm.envAddress("CONTRACT_ADDRESS");
        GoldPeggedStablecoin stablecoin = GoldPeggedStablecoin(stablecoinAddress);

        uint256 goldPrice = stablecoin.getGoldPrice();
        console.log("🏆 Gold Price:", goldPrice);

        vm.stopBroadcast();
    }
}