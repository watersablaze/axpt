// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ProtiumToken} from "../src/ProtiumToken.sol";

/**
 * Mint PRT to a target account (defaults to deployer).
 *
 * Env vars:
 *   PROTIUM_TOKEN_ADDRESS   = deployed token contract
 *   MINT_TO                 = (optional) recipient address (defaults to deployer)
 *   MINT_AMOUNT             = (optional) whole tokens to mint (default = 1000)
 *   PRIVATE_KEY             = deployer private key
 */
contract MintProtium is Script {
    function run() external {
        // Load env
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address tokenAddr = vm.envAddress("PROTIUM_TOKEN_ADDRESS");

        // Connect
        ProtiumToken token = ProtiumToken(tokenAddr);

        // Defaults
        address deployer = vm.addr(deployerKey);
        address mintTo = _envOrAddress("MINT_TO", deployer);
        uint256 whole = _envOrUint("MINT_AMOUNT", 1000);

        // Convert whole → wei units
        uint256 amt = whole * 1e18;

        vm.startBroadcast(deployerKey);
        token.mint(mintTo, amt);
        vm.stopBroadcast();

        console2.log("Minted", amt, "PRT to", mintTo);
    }

    function _envOrAddress(string memory key, address fallbackAddr) internal view returns (address) {
        try vm.envAddress(key) returns (address a) {
            return a;
        } catch {
            return fallbackAddr;
        }
    }

    function _envOrUint(string memory key, uint256 fallbackVal) internal view returns (uint256) {
        try vm.envUint(key) returns (uint256 v) {
            return v;
        } catch {
            return fallbackVal;
        }
    }
}