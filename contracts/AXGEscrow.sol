// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AXGEscrow {

    enum Status {
        NONE,
        LOCKED,
        RELEASED,
        DISPUTED,
        CANCELLED
    }

    struct Escrow {
        address from;
        address to;
        uint256 amount;
        Status status;
        uint256 timestamp;
    }

    mapping(bytes32 => Escrow) public escrows;

    event EscrowLocked(bytes32 indexed caseId, address indexed from, address indexed to, uint256 amount);
    event EscrowReleased(bytes32 indexed caseId);
    event EscrowDisputed(bytes32 indexed caseId);

    function lockEscrow(
        bytes32 caseId,
        address from,
        address to,
        uint256 amount
    ) external {

        require(escrows[caseId].status == Status.NONE, "ESCROW_EXISTS");

        escrows[caseId] = Escrow({
            from: from,
            to: to,
            amount: amount,
            status: Status.LOCKED,
            timestamp: block.timestamp
        });

        emit EscrowLocked(caseId, from, to, amount);
    }

    function releaseEscrow(bytes32 caseId) external {
        Escrow storage e = escrows[caseId];
        require(e.status == Status.LOCKED, "INVALID_STATE");

        e.status = Status.RELEASED;

        emit EscrowReleased(caseId);
    }

    function disputeEscrow(bytes32 caseId) external {
        Escrow storage e = escrows[caseId];
        require(e.status == Status.LOCKED, "INVALID_STATE");

        e.status = Status.DISPUTED;

        emit EscrowDisputed(caseId);
    }
}