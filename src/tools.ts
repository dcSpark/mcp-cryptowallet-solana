import { 
  getBalanceHandler, 
  getTokenAccountsHandler, 
  getTokenBalanceHandler, 
  createTransactionMessageHandler,
  signTransactionMessageHandler,
  sendTransactionHandler, 
  generateKeyPairHandler, 
  importPrivateKeyHandler, 
  validateAddressHandler,
  checkTransactionHandler,
  switchNetworkHandler,
  getCurrentNetworkHandler
} from "./handlers/wallet.js";

export const tools = [
  {
    name: "wallet_get_balance",
    description: "Get the balance of a Solana address (uses default wallet if no publicKey provided)",
    inputSchema: {
      type: "object",
      properties: {
        publicKey: { type: "string" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
      },
      required: []
    }
  },
  {
    name: "wallet_get_token_accounts",
    description: "Get the token accounts owned by a Solana address (uses default wallet if no publicKey provided)",
    inputSchema: {
      type: "object",
      properties: {
        publicKey: { type: "string" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
      },
      required: []
    }
  },
  {
    name: "wallet_get_token_balance",
    description: "Get the balance of a token account",
    inputSchema: {
      type: "object",
      properties: {
        tokenAccountAddress: { type: "string" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
      },
      required: ["tokenAccountAddress"]
    }
  },
  {
    name: "wallet_create_transaction",
    description: "Create a transaction to transfer SOL (uses default wallet if no fromPublicKey provided)",
    inputSchema: {
      type: "object",
      properties: {
        fromPublicKey: { type: "string" },
        toPublicKey: { type: "string" },
        amount: { type: "number" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
      },
      required: ["toPublicKey", "amount"]
    }
  },
  {
    name: "wallet_sign_transaction",
    description: "Sign a transaction with a private key (uses default wallet if no privateKey provided)",
    inputSchema: {
      type: "object",
      properties: {
        transaction: { type: "string" },
        privateKey: { type: "string" }
      },
      required: ["transaction"]
    }
  },
  {
    name: "wallet_send_transaction",
    description: "Send a signed transaction",
    inputSchema: {
      type: "object",
      properties: {
        signedTransaction: { type: "string" },
        skipPreflight: { type: "boolean" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] },
        rpcUrl: { type: "string", description: "The RPC URL to use for the transaction, if not provided, the current network will be used" }
      },
      required: ["signedTransaction"]
    }
  },
  {
    name: "wallet_generate_keypair",
    description: "Generate a new keypair",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "wallet_import_private_key",
    description: "Import a private key and get the corresponding public key",
    inputSchema: {
      type: "object",
      properties: {
        privateKey: { type: "string" }
      },
      required: ["privateKey"]
    }
  },
  {
    name: "wallet_validate_address",
    description: "Validate a Solana address",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string" }
      },
      required: ["address"]
    }
  },
  {
    name: "wallet_check_transaction",
    description: "Check the status of a transaction",
    inputSchema: {
      type: "object",
      properties: {
        signature: { type: "string" },
        rpcUrl: { type: "string", description: "The RPC URL to use for the transaction, if not provided, the current network will be used" },
        commitment: { type: "string", enum: ["confirmed", "finalized"] }
      },
      required: ["signature"]
    }
  },
  {
    name: "wallet_switch_network",
    description: "Switch between Solana networks (devnet or mainnet)",
    inputSchema: {
      type: "object",
      properties: {
        network: { type: "string", enum: ["devnet", "mainnet"] }
      },
      required: ["network"]
    }
  },
  {
    name: "wallet_get_current_network",
    description: "Get the currently active Solana network",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

export const handlers: Record<string, (input: any) => Promise<any>> = {
  wallet_get_balance: getBalanceHandler,
  wallet_get_token_accounts: getTokenAccountsHandler,
  wallet_get_token_balance: getTokenBalanceHandler,
  wallet_create_transaction: createTransactionMessageHandler,
  wallet_sign_transaction: signTransactionMessageHandler,
  wallet_send_transaction: sendTransactionHandler,
  wallet_generate_keypair: generateKeyPairHandler,
  wallet_import_private_key: importPrivateKeyHandler,
  wallet_validate_address: validateAddressHandler,
  wallet_check_transaction: checkTransactionHandler,
  wallet_switch_network: switchNetworkHandler,
  wallet_get_current_network: getCurrentNetworkHandler
};
