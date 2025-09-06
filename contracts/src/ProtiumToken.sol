// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Protium Token (PRT)
 * Minimal ERC-20 with owner-only minting
 *
 * Built on OpenZeppelin v5.x
 *   forge install OpenZeppelin/openzeppelin-contracts@v5.0.2
 */

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract ProtiumToken is ERC20, Ownable {
    /**
     * @param _owner           Contract owner (council multisig or deployer)
     * @param _initialReceiver Address to receive initial supply (can equal owner)
     * @param _initialSupply   Initial supply in wei units (18 decimals)
     */
    constructor(
        address _owner,
        address _initialReceiver,
        uint256 _initialSupply
    ) ERC20("Protium Token", "PRT") Ownable(_owner) {
        if (_initialSupply > 0) {
            _mint(_initialReceiver, _initialSupply);
        }
    }

    /**
     * @notice Mint new tokens (restricted to owner).
     * @param to Recipient address
     * @param amount Token amount in wei units (use 1e18 for "1 PRT")
     *
     * ⚠️ This is guarded by `onlyOwner`.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}