// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {MockV3AggregatorV8} from "../src/mocks/MockV3AggregatorV8.sol";

/// Deploys a Mock ETH/USD feed (default 8 decimals, 3000.00 = 300000000000)
/// Env (optional):
///   MOCK_FEED_DECIMALS   (default 8)
///   MOCK_FEED_PRICE      (scaled, default 300000000000 = 3000.00000000)
contract DeployMockEthFeed is Script {
    function run() external {
        vm.startBroadcast();

        uint8 dec = uint8(vm.envOr("MOCK_FEED_DECIMALS", uint256(8)));
        int256 price = int256(vm.envOr("MOCK_FEED_PRICE", uint256(300000000000))); // 3000.00000000

        MockV3AggregatorV8 feed = new MockV3AggregatorV8(dec, price, "ETH / USD");
        console2.log("Mock ETH/USD feed deployed at:", address(feed));

        vm.stopBroadcast();
    }
}