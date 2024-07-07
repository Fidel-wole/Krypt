
import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";
import "./index.css";
import TransactionProvider from "./context/TransactionContext.jsx"; // Ensure correct import path

ReactDOM.createRoot(document.getElementById("root")).render(
  <TransactionProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </TransactionProvider>
);
