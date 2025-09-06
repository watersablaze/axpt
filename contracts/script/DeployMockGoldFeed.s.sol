// contracts/script/DeployMockGoldFeed.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@chainlink/contracts/src/v0.8/tests/MockV3Aggregator.sol";

contract DeployMockGoldFeed is Script {
    function run() external {
        vm.startBroadcast();

        // XAU/USD, 8 decimals, price = $2400.00000000
        MockV3Aggregator goldFeed = new MockV3Aggregator(
            8,                // decimals
            2400e8            // initial answer (2400 * 10^8)
        );

        console2.log("Mock GOLD/USD feed deployed at:", address(goldFeed));

        vm.stopBroadcast();
    }
}