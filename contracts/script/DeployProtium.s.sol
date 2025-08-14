// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ProtiumToken} from "../contracts/ProtiumToken.sol";

/**
 * Foundry deploy script for ProtiumToken
 *
 * Reads env vars:
 *   SEPOLIA_RPC_URL          → used by forge (passed via CLI)
 *   PRIVATE_KEY              → deployer EOA private key
 *   PRT_OWNER                → owner address (defaults to deployer)
 *   PRT_RECEIVER             → initial receiver (defaults to deployer)
 *   PRT_INITIAL_SUPPLY       → initial supply in whole tokens (optional, default 0)
 *
 * Example:
 *   export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/KEY"
 *   export PRIVATE_KEY="0xabc123..."
 *   forge script script/DeployProtium.s.sol \
 *     --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast -vv
 */
contract DeployProtium is Script {
    function run() external {
        // Load deployer key
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        // Defaults: owner/receiver = deployer
        address owner = _envOrAddress("PRT_OWNER", address(0));
        address receiver = _envOrAddress("PRT_RECEIVER", address(0));
        uint256 initialWhole = _envOrUint("PRT_INITIAL_SUPPLY", 0);

        vm.startBroadcast(deployerKey);

        address deployer = vm.addr(deployerKey);
        if (owner == address(0)) owner = deployer;
        if (receiver == address(0)) receiver = deployer;

        // Convert whole tokens → wei units (18 decimals)
        uint256 initialSupply = initialWhole * 1e18;

        ProtiumToken token = new ProtiumToken(owner, receiver, initialSupply);

        console2.log("Deployed ProtiumToken (PRT) at:", address(token));
        console2.log("Owner:", owner);
        console2.log("Initial receiver:", receiver);
        console2.log("Initial supply (wei):", initialSupply);

        vm.stopBroadcast();
    }

    // Helpers — safe env reads with defaults
    function _envOrAddress(string memory key, address fallbackAddr) internal view returns (address) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackAddr;
        // Try/catch because vm.envAddress reverts if missing
        try vm.envAddress(key) returns (address a) {
            return a;
        } catch {
            return fallbackAddr;
        }
    }

    function _envOrUint(string memory key, uint256 fallbackVal) internal view returns (uint256) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackVal;
        try vm.envUint(key) returns (uint256 v) {
            return v;
        } catch {
            return fallbackVal;
        }
    }
}