// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TestContract is Ownable {
    string public message = "OpenZeppelin is working!";

    function setMessage(string memory _message) public onlyOwner {
        message = _message;
    }
}