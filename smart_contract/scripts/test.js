async function main() {
    const { ethers } = require("hardhat");
    const provider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/RP6ESRxtP35-Bn2-6vZXMSURkOJF-LBR");
    const network = await provider.getNetwork();
    console.log("Connected to network:", network);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  