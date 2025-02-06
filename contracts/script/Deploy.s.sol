// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/YourContract.sol";

contract DeployYourContract is Script {
    function run() external {
        vm.startBroadcast();
        YourContract contractInstance = new YourContract();
        vm.stopBroadcast();
    }
}