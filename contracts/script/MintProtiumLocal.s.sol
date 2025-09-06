// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ProtiumToken} from "../src/ProtiumToken.sol";

/**
 * MintProtiumLocal
 *
 * Mints PRT to a target account using the owner key (PRIVATE_KEY / COUNCIL_SIGNER_PRIVATE_KEY).
 *
 * Env it reads:
 *   - PROTIUM_TOKEN_ADDRESS (required)
 *   - MINT_TO (optional; defaults to deployer EOA)
 *   - MINT_AMOUNT_TOKENS (optional; default "1000" whole tokens)
 *   - PRIVATE_KEY or COUNCIL_SIGNER_PRIVATE_KEY (required; owner of token)
 *
 * Usage:
 *   forge script contracts/script/MintProtiumLocal.s.sol:MintProtiumLocal \
 *     --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv
 */
contract MintProtiumLocal is Script {
    function run() external {
        // owner key (must be token owner)
        uint256 pk = _envOrPk();

        // required token address
        address tokenAddr = vm.envAddress("PROTIUM_TOKEN_ADDRESS");

        // defaults: mint to deployer if not provided
        address deployer = vm.addr(pk);
        address mintTo = _envOrAddress("MINT_TO", deployer);

        // default amount = 1000 PRT (18 decimals)
        uint256 whole = _envOrUint("MINT_AMOUNT_TOKENS", 1000);
        uint256 amount = whole * 1e18;

        vm.startBroadcast(pk);

        ProtiumToken token = ProtiumToken(tokenAddr);
        token.mint(mintTo, amount);

        console2.log("Minted", amount, "wei PRT to", mintTo);
        console2.log("Token:", tokenAddr);
        console2.log("Owner (tx sender):", deployer);

        vm.stopBroadcast();
    }

    // ---------- helpers ----------
    function _envOrPk() internal view returns (uint256) {
        // try COUNCIL_SIGNER_PRIVATE_KEY first, then PRIVATE_KEY
        try vm.envUint("COUNCIL_SIGNER_PRIVATE_KEY") returns (uint256 v1) { return v1; } catch {}
        try vm.envUint("PRIVATE_KEY") returns (uint256 v2) { return v2; } catch {}
        revert("Missing COUNCIL_SIGNER_PRIVATE_KEY or PRIVATE_KEY");
    }

    function _envOrAddress(string memory key, address fallbackAddr) internal view returns (address) {
        try vm.envAddress(key) returns (address a) { return a; } catch { return fallbackAddr; }
    }

    function _envOrUint(string memory key, uint256 fallbackVal) internal view returns (uint256) {
        try vm.envUint(key) returns (uint256 v) { return v; } catch { return fallbackVal; }
    }
}