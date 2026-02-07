// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MirrorBridge.sol";

contract MirrorBridgeTest is Test {
    MirrorBridge bridge;
    address treasury = address(0xBEEF);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    bytes32 idKey = keccak256("idemp-1");
    bytes32 walletEventId = keccak256("event-1");
    bytes32 tokenType = keccak256("AXG");

    function setUp() public {
        bridge = new MirrorBridge(treasury);
    }

    function test_ownerCanMirrorTransfer() public {
        vm.prank(treasury);
        bridge.mirrorTransfer(idKey, walletEventId, tokenType, alice, bob, 123);

        bool consumed = bridge.consumed(idKey);
        assertTrue(consumed);
    }

    function test_nonOwnerReverts() public {
        vm.expectRevert(); // Ownable: caller is not the owner
        bridge.mirrorTransfer(idKey, walletEventId, tokenType, alice, bob, 123);
    }

    function test_idempotencyPreventsDoubleSpend() public {
        vm.prank(treasury);
        bridge.mirrorTransfer(idKey, walletEventId, tokenType, alice, bob, 123);

        vm.prank(treasury);
        vm.expectRevert(bytes("MIRROR_ALREADY_CONSUMED"));
        bridge.mirrorTransfer(idKey, walletEventId, tokenType, alice, bob, 123);
    }
}