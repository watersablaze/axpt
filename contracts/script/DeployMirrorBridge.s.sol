// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MirrorBridge.sol";

contract DeployMirrorBridge is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY"); // fallback-safe
        address owner = vm.addr(pk);

        vm.startBroadcast(pk);
        MirrorBridge bridge = new MirrorBridge(owner);
        vm.stopBroadcast();

        console2.log("MirrorBridge deployed at:", address(bridge));
        console2.log("Treasury / Owner:", owner);
    }
}