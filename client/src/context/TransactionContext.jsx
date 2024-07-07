import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

const { ethereum } = window;

export const TransactionContext = createContext();

const createEthereumContract = async (ethereum) => {
  if (!ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask.");
  }

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    return transactionsContract;
  } catch (error) {
    console.error("Error creating Ethereum contract:", error);
    throw new Error("Failed to create Ethereum contract.");
  }
};

const TransactionProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = await createEthereumContract(ethereum);

        const availableTransactions =
          await transactionsContract.getAllTransactions();

        const structuredTransactions = availableTransactions.map(
          (transaction) => ({
            addressTo: transaction.receiver,
            addressFrom: transaction.sender,
            timestamp: new Date(
              transaction.timestamp.toNumber() * 1000
            ).toLocaleString(),
            message: transaction.message,
            keyword: transaction.keyword,
            amount: parseInt(transaction.amount._hex) / 10 ** 18,
          })
        );

        console.log(structuredTransactions);

        setTransactions(structuredTransactions);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfTransactionsExist = async () => {
    try {
      if (ethereum) {
        const transactionsContract = await createEthereumContract(ethereum);
        const currentTransactionCount =
          await transactionsContract.getTransactionCount();

        window.localStorage.setItem(
          "transactionCount",
          currentTransactionCount
        );
      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        throw new Error(
          "Ethereum object not found. Make sure MetaMask or another Ethereum provider is installed and active."
        );
      }

      const { addressTo, amount, keyword, message } = formData;
      const transactionsContract = await createEthereumContract(ethereum);
      console.log("ethers:", ethers); // Check if ethers is defined
      const parsedAmount = ethers.parseEther(amount); // Ensure ethers.utils is accessible

      // Send transaction to Ethereum network
      const txParams = {
        from: currentAccount,
        to: addressTo,
        gas: "0x5208", // Example gas limit
        value: parsedAmount._hex,
      };

      const transactionHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      setIsLoading(true);
      console.log(`Transaction sent - ${transactionHash}`);

      // Wait for transaction to be mined
      const receipt = await transactionHash.wait();
      console.log(`Transaction confirmed - ${transactionHash}`);

      setIsLoading(false);

      // Call contract method to add transaction details
      const txResponse = await transactionsContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      console.log("Transaction details added to contract:", txResponse);

      // Update transaction count
      const transactionsCount =
        await transactionsContract.getTransactionCount();
      setTransactionCount(transactionsCount.toNumber());

      // Optionally, notify user or update UI on successful transaction
    } catch (error) {
      console.error("Error sending transaction:", error.message);
      // Handle error state or notify the user
      // Example: setErrorMessage(error.message);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, [transactionCount]);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionProvider;
