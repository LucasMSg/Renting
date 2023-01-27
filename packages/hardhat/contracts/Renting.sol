/*
Vault

SPDX-License-Identifier: CC0-1.0
*/

pragma solidity ^0.8.0;
import "hardhat/console.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IEscrow} from "./IEscrow.sol";

/**
 * @title Renting
 *
 * @notice this contract implements an example "holder" for the proposed
 * held token ERC standard.

 * This example vault contract allows a user to lock up an ERC721 token for
 * a specified period of time, while still reporting the functional owner
 */
contract Renting {
    struct LeaseData {
        uint256 tokenId;
        IERC721 tokenContract;
        //ILeaseImpl impl;
    }

    address public vault;
    address public land;

    //lock for each rented token
    mapping(bytes32 => uint256) public locks;
    mapping(bytes32 => address) public users;

    constructor(address vault_, address land_) {
        vault = vault_;
        land = land_;
    }

    /* function rent(
        address user,
        uint256 tokenId,
        uint256 timeMax,
        uint256 timeRent,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        IEscrow(vault).deposit2(land, tokenId, timeMax, timeRent, v, r, s);
        bytes32 encodedTokenId = (keccak256(abi.encodePacked(land, tokenId)));
        users[encodedTokenId] = user;
    } */

    function rent2(
        address token,
        address user,
        uint256 tokenId,
        uint256[] calldata timesAvaliable,
        uint256 timeRent,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        IEscrow(vault).deposit3(token, tokenId, timesAvaliable, timeRent, v, r, s);
        bytes32 encodedTokenId = (keccak256(abi.encodePacked(token, tokenId)));
        users[encodedTokenId] = user;
        locks[encodedTokenId] = block.timestamp + (timeRent * 1 days);
    }

    /* function getOwner(uint256 tokenId) external view returns (address) {
        // get raw owner
        address owner = land.ownerOf(tokenId);

        // if owner is not contract, return
        if (!owner.isContract()) {
            return owner;
        }

        // check for token holder interface support
        try IERC165(owner).supportsInterface(0x16b900ff) returns (bool ret) {
            if (!ret) return owner;
        } catch {
            return owner;
        }

        // check for held owner
        try IERC721Holder(owner).heldOwnerOf(address(land), tokenId) returns (address user) {
            if (user != address(0)) return user;
        } catch {}

        return owner;
    } */
}
