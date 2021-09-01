// // SPDX-License-Identifier: UNLICENSED

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract ERC20Factory {
    IERC20[] public tokens;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function createToken(string calldata name, string calldata symbol) public {
        ERC20PresetMinterPauser token = new ERC20PresetMinterPauser(name, symbol);
        token.grantRole(token.MINTER_ROLE(), owner);
        token.mint(owner, 10000 ether);
        tokens.push(token);
    }

    function getTokens() public view returns (IERC20[] memory _tokens) {
        _tokens = tokens;
    }
}