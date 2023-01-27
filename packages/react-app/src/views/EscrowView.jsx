import { useBlockNumber, useContractReader } from "eth-hooks";
import { Button, Card, Divider, Input, List, Progress } from "antd";
import React, { useEffect, useState } from "react";
import { Address } from "../components";

const { ethers } = require("ethers");
//const { ethers } = require("hardhat");

// https://www.npmjs.com/package/ipfs-http-client

function EscrowView({ readContracts, signer, tx, writeContracts, blockExplorer, mainnetProvider, address }) {
  // you can also use hooks locally in your component of choice
  // in this case, let's keep track of 'purpose' variable from our contract

  const [signatures, setSignatures] = useState("");

  const [userAdd, setUserAdd] = useState();
  const [time, setTime] = useState();
  const [timeLock, setTimeLock] = useState();

  const [yourCollectibles, setYourCollectibles] = useState();
  const [escrowCollectibles, setEscrowCollectibles] = useState();

  //const tokenSignatures = new Map();
  const [tokenSignatures, setTokenSignatures] = useState("");
  const [proposals, setProposals] = useState("");

  const [EscrowAdd, setEscrowAdd] = useState("");
  const [RentAdd, setRentAdd] = useState("");

  const escrowBalance = useContractReader(readContracts, "ERC721Mintable", "balanceOf", [EscrowAdd]);
  const userBalance = useContractReader(readContracts, "ERC721Mintable", "balanceOf", [address]);

  useEffect(() => {
    async function getEscrowAddress() {
      if (readContracts.Escrow) {
        const escrowAddress = await readContracts.Escrow.address;
        setEscrowAdd(escrowAddress);
      }
    }
    getEscrowAddress();
  }, [EscrowAdd, readContracts]);

  useEffect(() => {
    async function getRentAddress() {
      if (readContracts.Renting) {
        const rentAddress = await readContracts.Renting.address;
        setRentAdd(rentAddress);
      }
    }
    getRentAddress();
  }, [RentAdd, readContracts]);

  useEffect(() => {
    const updateEscrowCollectibles = async () => {
      const escrowCollectibleUpdate = [];
      for (let tokenIndex = 0; tokenIndex < escrowBalance; tokenIndex++) {
        try {
          console.log("Getting escrow token index", tokenIndex);
          const tokenId = await readContracts.ERC721Mintable.tokenOfOwnerByIndex(
            readContracts.Escrow.address,
            tokenIndex,
          );

          //get user
          const tokenAdd = await readContracts.ERC721Mintable.address;
          const hashedTokenId = ethers.utils.solidityKeccak256(
            ["bytes"],
            [ethers.utils.solidityPack(["address", "uint"], [tokenAdd, tokenId])],
          );

          const user = await readContracts.Renting.users(hashedTokenId);
          const timeLock = await readContracts.Renting.locks(hashedTokenId);
          const date = new Date(timeLock * 1000);
          const formattedDate = date.toLocaleString();
          try {
            escrowCollectibleUpdate.push({
              id: tokenId,
              owner: readContracts.Escrow.address /* , uri: tokenURI, owner: address, ...jsonManifest */,
              user: user,
              timeLock: formattedDate,
            });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setEscrowCollectibles(escrowCollectibleUpdate);
    };
    updateEscrowCollectibles();
  }, [escrowBalance, readContracts]);

  useEffect(() => {
    const updateYourCollectibles = async () => {
      const collectibleUpdate = [];
      for (let tokenIndex = 0; tokenIndex < userBalance; tokenIndex++) {
        try {
          console.log("Getting token index", tokenIndex);
          const tokenId = await readContracts.ERC721Mintable.tokenOfOwnerByIndex(address, tokenIndex);

          try {
            collectibleUpdate.push({
              id: tokenId,
              owner: address /* , uri: tokenURI, owner: address, ...jsonManifest */,
            });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourCollectibles(collectibleUpdate);
    };
    updateYourCollectibles();
  }, [userBalance, readContracts, address]);

  return (
    <div>
      {!userBalance ? (
        <div style={{ margin: 32 }}>
          <h2>No Tokens</h2>
        </div>
      ) : (
        <div style={{ margin: 32 }}>
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            {"User Tokens: " + userBalance.toNumber()}
          </span>
          <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
            <List
              bordered
              dataSource={yourCollectibles}
              renderItem={item => {
                const id = item.id.toNumber();
                return (
                  <List.Item key={id /*+ "_" + item.uri + "_" + item.owner */}>
                    {
                      <div
                        style={{
                          border: "1px solid #cccccc",
                          padding: 16,
                          width: 400,
                          margin: "auto",
                          marginTop: 64,
                        }}
                      >
                        Owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        {
                          <Button
                            onClick={async () => {
                              const result = await tx(
                                writeContracts.ERC721Mintable.approve(readContracts.Escrow.address, id),
                              );
                              console.log(result);
                            }}
                          >
                            Escrow Approve
                          </Button>
                        }
                        <h2>
                          {"Token #"}
                          {id}
                        </h2>
                        <h2>Sign proposal for rental contract</h2>
                        <Divider />
                        <h4>Feature:</h4>
                        <h4>{RentAdd}</h4>
                        <h4>Set Timelock</h4>
                        <Input
                          onChange={e => {
                            setTimeLock(e.target.value);
                          }}
                        />
                        <Button
                          style={{ marginTop: 8 }}
                          onClick={async () => {
                            const escrowContract = await readContracts.Escrow.address;
                            const rentingContract = await readContracts.Renting.address;
                            const chainId = await signer.getChainId();
                            const tokenAdd = await readContracts.ERC721Mintable.address;

                            const timeLock_string = timeLock.split(",");
                            let timeLock_number = [];
                            for (let i = 0; i < timeLock_string.length; i++) {
                              timeLock_number[i] = Number(timeLock_string[i]);
                            }

                            console.log("hashed values");
                            console.log(tokenAdd);
                            console.log(id);
                            const hashedTokenId = ethers.utils.solidityKeccak256(
                              ["bytes"],
                              [ethers.utils.solidityPack(["address", "uint"], [tokenAdd, id])],
                            );
                            const hashedTimes = ethers.utils.solidityKeccak256(
                              ["bytes"],
                              [ethers.utils.solidityPack(["uint[]"], [timeLock_number /* [1, 2, 3] */])],
                            );

                            const domain = {
                              name: "Escrow Signature",
                              version: "1.0",
                              chainId: chainId,
                              verifyingContract: escrowContract,
                            };
                            const types = {
                              EscrowToken: [
                                { name: "feature", type: "address" },
                                { name: "timeMax", type: "bytes32" },
                                { name: "tokenID", type: "bytes32" },
                              ],
                            };
                            const value = {
                              feature: rentingContract,
                              timeMax: hashedTimes,
                              tokenID: hashedTokenId,
                            };

                            //signTypedData_v4
                            const signature = await signer._signTypedData(domain, types, value);
                            console.log(signature);
                            setTokenSignatures(signature);
                            const newList = [...proposals];
                            let prop = {
                              id: hashedTokenId,
                              owner: item.owner,
                              times: timeLock_string,
                              tokenId: id,
                              contract: tokenAdd,
                              signature: signature,
                            };
                            newList.push(prop);
                            setProposals(newList);
                          }}
                        >
                          Sign
                        </Button>
                        {!tokenSignatures ? (
                          <div style={{ margin: 32 }}></div>
                        ) : (
                          <div style={{ margin: 32 }}>
                            <h2>📝</h2>
                          </div>
                        )}
                      </div>
                    }
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      )}
      {!proposals ? (
        <div style={{ margin: 32 }}>
          <h2>No Signed Proposals</h2>
        </div>
      ) : (
        <div style={{ margin: 32 }}>
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            {"Signed proposals: " + proposals.length}
          </span>
          <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
            <List
              bordered
              dataSource={proposals}
              renderItem={item => {
                const id = item.id;
                const owner = item.owner;
                const token = item.contract;
                const times = item.times;
                const signature = item.signature;
                const tokenId = item.tokenId;
                return (
                  <List.Item key={id /*+ "_" + item.uri + "_" + item.owner */}>
                    {
                      <div
                        style={{
                          border: "1px solid #cccccc",
                          padding: 16,
                          width: 400,
                          margin: "auto",
                          marginTop: 64,
                        }}
                      >
                        {/* <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Proposal: "}</h1> {id} */}
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Token: "}</h1> {token}
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>
                          {"Id: #"}
                          {tokenId}
                        </h1>
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Owner: "}</h1> {owner}
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Contract: "}</h1> {token}
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Possible times: "}</h1> {times}
                        <Divider />
                        <label>User Address</label>
                        <Input
                          onChange={e => {
                            setUserAdd(e.target.value);
                          }}
                        />
                        <label>Time of loan</label>
                        <Input
                          onChange={e => {
                            setTime(e.target.value);
                          }}
                        />
                        <Button
                          style={{ marginTop: 8 }}
                          onClick={async () => {
                            const sig = ethers.utils.splitSignature(signature);
                            const tokenAdd = await readContracts.ERC721Mintable.address;
                            console.log(typeof timeLock);
                            const timeLock_string = [1, 7, 30];
                            let result;
                            try {
                              result = await tx(
                                writeContracts.Renting.rent2(
                                  tokenAdd,
                                  userAdd,
                                  tokenId,
                                  timeLock_string,
                                  Number(time),
                                  sig.v,
                                  sig.r,
                                  sig.s,
                                ),
                              );
                            } catch (error) {
                              console.log("something failed");
                            }
                            console.log(result);
                            //if result succesfull erase
                            const newList = [];
                            for (let i = 0; i < proposals.length; i++) {
                              if (proposals[i].id != id) {
                                newList.push(proposals[i]);
                              }
                            }
                            setProposals(newList);
                          }}
                        >
                          Rent
                        </Button>
                        <p>{signatures}</p>
                      </div>
                    }
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      )}

      {/* trying to list the tokens belonging to escrow */}
      {!escrowBalance ? (
        <div style={{ margin: 32 }}>
          <h2>{EscrowAdd}</h2>
        </div>
      ) : (
        <div style={{ margin: 32 }}>
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            {"Tokens In Escrow: " + escrowBalance.toNumber()}
          </span>
          <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
            <List
              bordered
              dataSource={escrowCollectibles}
              renderItem={item => {
                const id = item.id.toNumber();
                return (
                  <List.Item key={id /*+ "_" + item.uri + "_" + item.owner */}>
                    {
                      <div
                        style={{
                          border: "1px solid #cccccc",
                          padding: 16,
                          width: 400,
                          margin: "auto",
                          marginTop: 64,
                        }}
                      >
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>
                          {"Token #"}
                          {id}
                        </h1>
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Owner: "}</h1>
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"User: "}</h1>
                        <Address
                          address={item.user}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <Divider />
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>
                          {"Locked until: "}
                          {item.timeLock}
                        </h1>
                      </div>
                    }
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EscrowView;
