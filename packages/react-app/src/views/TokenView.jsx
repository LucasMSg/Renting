import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { Address, Balance, AddressInput } from "../components";

export default function TokenView({
  purpose,
  setPurposeEvents,
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  yourCollectibles,
  yourBalance,
  blockExplorer,
}) {
  const [transferToAddresses, setTransferToAddresses] = useState({});
  const [signatures, setSignatures] = useState("");
  const [userAdd, setUserAdd] = useState();
  const [tokenId, setTokenId] = useState();

  return (
    <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
      <h2>{yourBalance + " Tokens"}</h2>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Mint</h2>
        <Divider />
        <label>Mint to:</label>
        <Input
          onChange={e => {
            setUserAdd(e.target.value);
          }}
        />
        <label>Token Id:</label>
        <Input
          onChange={e => {
            setTokenId(e.target.value);
          }}
        />
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            const result = await tx(writeContracts.ERC721Mintable.mint(userAdd, tokenId));
            console.log(result);
          }}
        >
          Mint new token
        </Button>
        <p>{signatures}</p>
      </div>
      <List
        bordered
        dataSource={yourCollectibles}
        renderItem={item => {
          const id = item.id.toNumber();
          return (
            <List.Item key={id /*+ "_" + item.uri + "_" + item.owner */}>
              <Card
                title={
                  <div>
                    <span style={{ fontSize: 16, marginRight: 8 }}>{"Token"}</span> #{id /* item.name */}
                  </div>
                }
              ></Card>
              {
                <div>
                  Owner:{" "}
                  <Address
                    address={item.owner}
                    ensProvider={mainnetProvider}
                    blockExplorer={blockExplorer}
                    fontSize={16}
                  />
                  <label>Transfer to address:</label>
                  <Input
                    onChange={e => {
                      setUserAdd(e.target.value);
                    }}
                  />
                  {/* <AddressInput
                    ensProvider={mainnetProvider}
                    placeholder="transfer to address"
                    value={transferToAddresses[id]}
                    onChange={newValue => {
                      const update = {};
                      update[id] = newValue;
                      setTransferToAddresses({ ...transferToAddresses, ...update });
                    }}
                  /> */}
                  <Button
                    onClick={() => {
                      console.log("writeContracts", writeContracts);
                      tx(writeContracts.ERC721Mintable.transferFrom(address, userAdd, id));
                    }}
                  >
                    Transfer
                  </Button>
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
                </div>
              }
            </List.Item>
          );
        }}
      />
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Add feature to Escrow</h2>
        <Divider />
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            const result = await tx(writeContracts.Escrow.addFeature(readContracts.ERC721Mintable.address));
            console.log(result);
          }}
        >
          Add token to escrow
        </Button>
        <p>{signatures}</p>
      </div>
    </div>
  );
}
