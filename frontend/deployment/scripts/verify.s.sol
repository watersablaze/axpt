// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";

contract VerifyContract is Script {
    function run() external {
        string memory contractAddress = vm.envString("CONTRACT_ADDRESS");

        console.log("⏳ Verifying contract at:", contractAddress);

        // ✅ Use Etherscan API to verify
        vm.verify(contractAddress, vm.envString("ETHERSCAN_API_KEY"));

        console.log("✅ Contract verified!");
    }
}