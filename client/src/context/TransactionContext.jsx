import React, { createContext, useState, useEffect } from "react";
import Web3 from 'web3';
import { contractABI, contractAddress } from "../utils/constants";

const { ethereum } = window;

export const TransactionContext = createContext();

let web3;
if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  web3 = new Web3(window.ethereum);
} else {
  const provider = new Web3.providers.HttpProvider(
    'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'
  );
  web3 = new Web3(provider);
}

const createEthereumContract = async () => {
  if (!ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask.");
  }

  try {
    const provider = new Web3(ethereum);
    const contract = new provider.eth.Contract(contractABI, contractAddress);
    return { transactionsContract: contract, web3: provider };
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
        const { transactionsContract } = await createEthereumContract();

        const availableTransactions = await transactionsContract.methods.getAllTransactions().call();

        const structuredTransactions = availableTransactions.map((transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(transaction.timestamp * 1000).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: web3.utils.fromWei(transaction.amount, "ether"),
        }));

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
        const { transactionsContract } = await createEthereumContract();
        const currentTransactionCount = await transactionsContract.methods.getTransactionCount().call();

        window.localStorage.setItem("transactionCount", currentTransactionCount);
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
      const { addressTo, amount, keyword, message } = formData;

      if (!addressTo || !amount || !keyword || !message) {
        throw new Error("Please fill in all fields.");
      }

      const parsedAmount = web3.utils.toWei(amount.toString(), "ether");

      const { transactionsContract } = await createEthereumContract();

      const txParams = {
        from: currentAccount,
        to: addressTo,
        gas: "21000",
        value: parsedAmount,
      };

      console.log("Transaction parameters:", txParams);

      setIsLoading(true);

      web3.eth.sendTransaction(txParams)
        .on('transactionHash', function (hash) {
          console.log(`Transaction sent - ${hash}`);
        })
        .on('receipt', async function (receipt) {
          console.log(`Transaction confirmed - ${receipt.transactionHash}`);
          setIsLoading(false);

          const txResponse = await transactionsContract.methods.addToBlockchain(
            addressTo,
            parsedAmount,
            message,
            keyword
          ).send({ from: currentAccount });

          console.log("Transaction details added to contract:", txResponse);

          const transactionsCount = await transactionsContract.methods.getTransactionCount().call();
          setTransactionCount(parseInt(transactionsCount));
        })
        .on('error', function (error) {
          console.error("Error sending transaction:", error.message);
          setIsLoading(false);
        });
    } catch (error) {
      console.error("Error sending transaction:", error.message);
      setIsLoading(false);
      // Handle error state or notify the user
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