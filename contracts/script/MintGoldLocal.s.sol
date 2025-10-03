// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {GoldPeggedStablecoin} from "../src/GoldPeggedStablecoin.sol";

/**
 * Deposit ETH and mint AXG via production flow.
 *
 * Env:
 *   AXG_TOKEN_ADDRESS  (required)
 *   PRIVATE_KEY or COUNCIL_SIGNER_PRIVATE_KEY (broadcaster)
 *   MINT_TO            (defaults to broadcaster)
 *   DEPOSIT_ETH        (default "0.01")
 *   FOUNDRY_USE_DEFAULTS=true  (use fallbacks if unset)
 */
contract MintGoldLocal is Script {
    function run() external {
        address payable axg = payable(vm.envAddress("AXG_TOKEN_ADDRESS"));

        vm.startBroadcast();
        address to = _envOrAddress("MINT_TO", msg.sender);

        string memory depositEthStr = _envOrString("DEPOSIT_ETH", "0.01");
        uint256 depositWei = _parseEth(depositEthStr);

        GoldPeggedStablecoin token = GoldPeggedStablecoin(axg);

        // Use new Phase 4 previewMintOut helper
        uint256 previewOut = token.previewMintOut(depositWei);
        uint256 minOut = (previewOut * 9950) / 10_000; // 0.5% slippage protection

        uint256 outWei = token.depositAndMint{value: depositWei}(to, minOut);

        console2.log("Deposited (wei):", depositWei);
        console2.log("Minted AXG (wei):", outWei);
        console2.log("Token:", address(token));
        console2.log("Recipient:", to);
        vm.stopBroadcast();
    }

    // --- helpers ---
    function _parseEth(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 i; uint256 dec; uint256 decCount; bool seenDot;
        for (uint256 p=0; p<b.length; p++) {
            bytes1 c = b[p];
            if (c == ".") { require(!seenDot, "bad decimal"); seenDot = true; continue; }
            require(c >= "0" && c <= "9", "bad char");
            i = i * 10 + (uint8(c) - 48);
            if (seenDot) decCount++;
        }
        if (decCount > 18) { for (uint256 k=0; k<decCount-18; k++) i/=10; decCount = 18; }
        for (uint256 k=decCount; k<18; k++) i *= 10;
        return i;
    }

    function _envOrAddress(string memory key, address fallbackAddr) internal returns (address) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackAddr;
        try vm.envAddress(key) returns (address a) { return a; } catch { return fallbackAddr; }
    }

    function _envOrString(string memory key, string memory fallbackVal) internal returns (string memory) {
        if (vm.envOr("FOUNDRY_USE_DEFAULTS", false)) return fallbackVal;
        try vm.envString(key) returns (string memory v) { return v; } catch { return fallbackVal; }
    }
}