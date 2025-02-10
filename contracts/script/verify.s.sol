// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";

contract VerifyContract is Script {
    function run() external {
        vm.startBroadcast();

        // ✅ Replace with actual contract address
        string memory contractAddress = vm.envString("DEPLOYED_CONTRACT_ADDRESS");

        console.log("🔍 Verifying contract on Etherscan...");
        
        string;
        cmds[0] = "forge";
        cmds[1] = "verify-contract";
        cmds[2] = contractAddress;
        cmds[3] = "contracts/src/GoldPeggedStablecoin.sol:GoldPeggedStablecoin";
        cmds[4] = "--etherscan-api-key";
        cmds[5] = vm.envString("ETHERSCAN_API_KEY");

        vm.ffi(cmds);
        
        console.log("✅ Verification complete!");

        vm.stopBroadcast();
    }
}