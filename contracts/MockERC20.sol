// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.7.6;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract MockERC20 is ERC20PresetMinterPauser {

    constructor(string memory name, string memory symbol) ERC20PresetMinterPauser(name, symbol) {

    }
}