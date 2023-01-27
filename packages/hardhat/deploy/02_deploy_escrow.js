// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

// const sleep = (ms) =>
//   new Promise((r) =>
//     setTimeout(() => {
//       console.log(`waited for ${(ms / 1000).toFixed(3)} seconds`);
//       r();
//     }, ms)
//   );

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  //const chainId = await getChainId();

  await deploy("Escrow", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [],
      },
      upgradeIndex: 0,
    },
    //args: [ "SOMETOKEN", "SOMETOKEN" ],
    log: true,
    waitConfirmations: 3,
  });

  // Getting a previously deployed contract
  const Escrow = await ethers.getContract("Escrow", deployer);
};
module.exports.tags = ["Escrow"];
