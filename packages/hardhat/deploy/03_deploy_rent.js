/* await deployments.deploy('Renting', {
  from: deployer,
  args: [Escrow.address, mintableERC721.address],
}); */
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
  const Escrow = await deployments.get("Escrow");
  const ERC721Mintable = await deployments.get("ERC721Mintable");

  await deploy("Renting", {
    from: deployer,
    args: [Escrow.address, ERC721Mintable.address],
    log: true,
    waitConfirmations: 3,
  });

  // Getting a previously deployed contract
  const Renting = await ethers.getContract("Renting", deployer);
  
};
module.exports.tags = ["Renting"];
