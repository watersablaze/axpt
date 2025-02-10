// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GoldPeggedStablecoin.sol";

contract InteractWithStablecoin is Script {
    function run() external {
        vm.startBroadcast();

        address stablecoinAddress = vm.envAddress("DEPLOYED_CONTRACT_ADDRESS");
        GoldPeggedStablecoin stablecoin = GoldPeggedStablecoin(stablecoinAddress);

        uint256 mintAmount = 1 ether;
        stablecoin.mintStablecoin{value: mintAmount}();

        console.log("✅ Minted stablecoin successfully!");

        vm.stopBroadcast();
    }
}