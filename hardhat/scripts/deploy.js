const {ethers} = require("hardhat");
require("dotenv").config({path: ".env"});

const{NFT_CONTRACT_ADDRESS} = require("../constants");

async function main() {

  const builderNFTContract = NFT_CONTRACT_ADDRESS;

    /*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so cryptoDevsTokenContract here is a factory for instances of our CryptoDevToken contract.
    */

  const devTokenContract = await ethers.getContractFactory("CryptoDevToken");

  const deployedDevTokenContract = await devTokenContract.deploy(builderNFTContract);

  await deployedDevTokenContract.deployed();

  console.log("DevToken Contract Address: ", deployedDevTokenContract.address);

}

main()
.then(() => process.exit(0))
.catch((err) => {
console.error("error occured:", err);
process.exit(1);
});