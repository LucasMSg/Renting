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
  const chainId = await getChainId();

  await deploy("ERC721Mintable", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ "SOMETOKEN", "SOMETOKEN" ],
    log: true,
    waitConfirmations: 3,
  });

  // Getting a previously deployed contract
  const ERC721Mintable = await ethers.getContract("ERC721Mintable", deployer);
  
};
module.exports.tags = ["ERC721Mintable"];
