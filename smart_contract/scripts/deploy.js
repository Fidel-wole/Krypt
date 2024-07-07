const main = async () => {
  console.log("Starting deployment...");
  
  const transactionsFactory = await hre.ethers.getContractFactory("Transactions");
  console.log("Contract factory created...");

  const transactionsContract = await transactionsFactory.deploy();
  console.log("Contract deployment transaction created...");

  await transactionsContract.deployed();
  console.log("Contract deployed and mined!");

  console.log("Transactions address: ", transactionsContract.address);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
};

runMain();
