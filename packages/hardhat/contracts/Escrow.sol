/*
Vault

SPDX-License-Identifier: CC0-1.0
*/

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import {ECDSAUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "./IERC721Holder.sol";
import "./IEscrow.sol";


/**
 * @title Vault
 *
 * @notice this contract implements an example "holder" for the proposed
 * held token ERC standard.

 * This example vault contract allows a user to lock up an ERC721 token for
 * a specified period of time, while still reporting the functional owner
 */
contract Escrow is ERC165, IERC721Holder, IEscrow, EIP712Upgradeable {
    /* using EnumerableSet for EnumerableSet.UintSet; */

    mapping(bytes32 => address) public override owners;
    mapping(bytes32 => uint256) public override locks;
    mapping(bytes32 => uint256) public override balances;
    mapping(bytes32 => address) public override features;
    mapping(bytes32 => bytes) public timeLockSignature;
    uint256[] public times;

    //mapping(address => uint256) public override tokens;

    bytes32 public constant ESCROW_TYPEHASH = keccak256("EscrowToken(address feature,uint256 timeMax,bytes32 tokenID)");
    bytes32 public constant ESCROW_TYPEHASH2 =
        keccak256("EscrowToken(address feature,bytes32 timeMax,bytes32 tokenID)");
    string public constant name = "Escrow Signature";
    string public constant version = "1.0";

    function initialize() external initializer {
        __EIP712_init_unchained(name, version);
        times = [1, 7, 30, 60, 90, 180, 365];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721Holder).interfaceId || super.supportsInterface(interfaceId);
    }

    function heldOwnerOf(address tokenAddress, uint256 tokenId) external view override returns (address) {
        //require(tokenAddress == address(token), "ERC721Vault: invalid token address");
        bytes32 encodedTokenId = (keccak256(abi.encodePacked(tokenAddress, tokenId)));
        return owners[encodedTokenId];
    }

    function heldBalanceOf(address tokenAddress, address owner) external view override returns (uint256) {
        //require(tokenAddress == address(token), "ERC721Vault: invalid token address");
        //this has to be change to take in account the set of token addresses
        bytes32 encodedTokenAdd = (keccak256(abi.encodePacked(tokenAddress, owner)));
        return balances[encodedTokenAdd];
    }

    function deposit(
        address token,
        uint256 tokenId,
        bytes calldata signature //uint256 timelock
    ) public override {
        //verify if token is there
        //featuresSet.add(feature);
        bytes32 encodedTokenId = (keccak256(abi.encodePacked(token, tokenId)));
        bytes32 encodedTokenAdd = (keccak256(abi.encodePacked(token, msg.sender)));

        require(msg.sender == IERC721(token).ownerOf(tokenId), "ERC721Vault: sender does not own token");

        owners[encodedTokenId] = msg.sender;
        //locks[encodedTokenId] = block.timestamp + timelock;
        balances[encodedTokenAdd]++;

        emit Hold(msg.sender, address(token), tokenId);

        IERC721(token).transferFrom(msg.sender, address(this), tokenId);
    }

    function withdraw(address token, uint256 tokenId) public override {
        //check if token is in stored
        bytes32 encodedTokenId = (keccak256(abi.encodePacked(token, tokenId)));
        bytes32 encodedTokenAdd = (keccak256(abi.encodePacked(token, msg.sender)));

        require(msg.sender == owners[encodedTokenId], "ERC721Vault: sender does not own token");
        //require(block.timestamp > locks[encodedTokenId], "ERC721Vault: token is locked");

        delete owners[encodedTokenId];
        //delete locks[encodedTokenId];
        balances[encodedTokenAdd]--;

        emit Release(msg.sender, token, tokenId);

        IERC721(token).safeTransferFrom(address(this), msg.sender, tokenId);
    }

    /* function updateTime(
        address token,
        uint256 tokenId,
        uint256 newTime
    ) public override {
        bytes32 encodedTokenId = (keccak256(abi.encodePacked(token, tokenId)));
        request(_verify(v, r, s, encodedTokenId));
    } */

    
    function deposit3(
        address token,
        uint256 tokenId,
        uint256[] calldata timesAvaliable,
        uint256 timeRent,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        bytes32 encodedTokenId = (keccak256(abi.encodePacked(token, tokenId)));
        address originalOwner = IERC721(token).ownerOf(tokenId);
        require(_verify2(v, r, s, encodedTokenId, originalOwner, timesAvaliable), "signature fail verify 2");

        uint256 i = 0;
        for (i; i < timesAvaliable.length; i++) {
            if (timeRent == timesAvaliable[i]) {
                break;
            }
        }
        require(i < timesAvaliable.length, "time not comprised");
        require(timeRent == timesAvaliable[i], "time not comprised");
        owners[encodedTokenId] = originalOwner;
        locks[encodedTokenId] = block.timestamp + timeRent;
        bytes32 encodedTokenAdd = (keccak256(abi.encodePacked(token, originalOwner)));
        balances[encodedTokenAdd]++;
        features[encodedTokenAdd] = msg.sender;

        emit Hold(originalOwner, address(token), tokenId);

        IERC721(token).transferFrom(originalOwner, address(this), tokenId);
    }

    function getChainId() public view returns (uint256) {
        return block.chainid;
    }

    function _verify2(
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes32 tokenID,
        address originalOwner,
        uint256[] calldata timesAvaliable
    ) internal view returns (bool) {
        //bytes32 public constant ESCROW_TYPEHASH2 = keccak256("EscrowToken(bytes32 timeMax,bytes32 tokenID)");
        bytes32 timesPack = keccak256(abi.encodePacked(timesAvaliable));
        uint chainId = getChainId(); //31337
        address feature = msg.sender;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(ESCROW_TYPEHASH2 , feature, timesPack,  tokenID)));
        //bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(ESCROW_TYPEHASH2, timesPack, tokenID)));
        address recoveredSigner = ECDSAUpgradeable.recover(digest, v, r, s);
        return recoveredSigner == originalOwner;
    }
    

    function log2(uint256 x) internal returns (uint256) {
        uint256 z = 0;
        uint256 y = 0;
        if (x == 1) {
            return z;
        } else {
            while (y != x) {
                y = y * 2;
                z++;
            }
            return z;
        }
    }
}
