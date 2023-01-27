/*
IERC721Holder

SPDX-License-Identifier: CC0-1.0
*/

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface IEscrow {
    function owners(bytes32) external returns (address);

    function locks(bytes32) external returns (uint256);

    function balances(bytes32) external returns (uint256);

    function features(bytes32) external returns (address);

    //function tokens(address) external returns (uint256);

    function deposit(
        address,
        uint256,
        bytes calldata
    ) external;

    function deposit3(
        address token,
        uint256 tokenId,
        uint256[] calldata timesAvaliable,
        uint256 timeRent,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function withdraw(address, uint256) external;

    /* function updateTime(uint256, uint256) external; */
}
