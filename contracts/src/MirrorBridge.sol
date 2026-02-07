// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MirrorBridge is Ownable {
    mapping(bytes32 => bool) public consumed;

    event MirrorTransfer(
        bytes32 indexed idempotencyKey,
        bytes32 indexed walletEventId,
        bytes32 tokenType,
        address from,
        address to,
        uint256 amount
    );

    constructor(address treasury) Ownable(treasury) {}

    function mirrorTransfer(
        bytes32 idempotencyKey,
        bytes32 walletEventId,
        bytes32 tokenType,
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(!consumed[idempotencyKey], "MIRROR_ALREADY_CONSUMED");

        consumed[idempotencyKey] = true;

        emit MirrorTransfer(
            idempotencyKey,
            walletEventId,
            tokenType,
            from,
            to,
            amount
        );
    }
}