// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ProtiumToken} from "../contracts/ProtiumToken.sol";

/**
 * Foundry deploy script for ProtiumToken
 *
 * Pass the key via CLI only:
 *   forge script contracts/script/DeployProtium.s.sol:DeployProtium \
 *     --rpc-url $SEPOLIA_RPC_URL \
 *     --private-key $COUNCIL_SIGNER_PRIVATE_KEY \
 *     --broadcast -vv
 *
 * Optional env:
 *   PRT_OWNER, PRT_RECEIVER (default to deployer)
 *   PRT_INITIAL_SUPPLY (whole tokens, default 0)
 *   FOUNDRY_USE_DEFAULTS=true  → use defaults if the above are unset
 */
contract DeployProtium is Script {
    function run() external {
        // Use the broadcaster from the CLI (--private-key), no env read here
        vm.startBroadcast();

        address deployer = msg.sender; // broadcaster address
        address owner = _envOrAddress("PRT_OWNER", deployer);
        address receiver = _envOrAddress("PRT_RECEIVER", deployer);
        uint256 initialWhole = _envOrUint("PRT_INITIAL_SUPPLY", 0);
        uint256 initialSupply = initialWhole * 1e18; // 18 decimals

        ProtiumToken token = new ProtiumToken(owner, receiver, initialSupply);

        console2.log("Deployed ProtiumToken (PRT) at:", address(token));
        console2.log("Owner:", owner);
        console2.log("Initial receiver:", receiver);
        console2.log("Initial supply (wei):", initialSupply);

        vm.stopBroadcast();
    }

    // Helpers — not view; they use vm.env*()
    function _envOrAddress(string memory key, address fallbackAddr) internal returns (address) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackAddr;
        try vm.envAddress(key) returns (address a) { return a; } catch { return fallbackAddr; }
    }

    function _envOrUint(string memory key, uint256 fallbackVal) internal returns (uint256) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackVal;
        try vm.envUint(key) returns (uint256 v) { return v; } catch { return fallbackVal; }
    }
}