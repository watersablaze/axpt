// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Protium Token (PRT)
 * Minimal ERC-20 with owner-only mint, using OpenZeppelin v5.x
 *
 * Dependencies:
 *   forge install OpenZeppelin/openzeppelin-contracts@v5.0.2
 */

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract ProtiumToken is ERC20, Ownable {
    /**
     * @param _owner           Owner address (can be council multisig or deployer)
     * @param _initialReceiver Address to receive initial supply (can equal owner)
     * @param _initialSupply   Initial mint (in wei units of the token, i.e., 18 decimals)
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

    /// @notice Owner can mint additional supply (optional).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}