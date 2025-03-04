import { 
  getBalanceHandler, 
  getTokenAccountsHandler, 
  getTokenBalanceHandler, 
  createTransactionHandler, 
  signTransactionHandler, 
  sendTransactionHandler, 
  generateKeyPairHandler, 
  importPrivateKeyHandler, 
  validateAddressHandler 
} from "./handlers/wallet.js";

export const tools = [
  {
    name: "wallet_get_balance",
    description: "Get the balance of a Solana address",
    inputSchema: {
      type: "object",
      properties: {
        publicKey: { type: "string" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
      },
      required: ["publicKey"]
    }
  },
  {
    name: "wallet_get_token_accounts",
    description: "Get the token accounts owned by a Solana address",
    inputSchema: {
      type: "object",
      properties: {
        publicKey: { type: "string" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
      },
      required: ["publicKey"]
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
    description: "Create a transaction to transfer SOL",
    inputSchema: {
      type: "object",
      properties: {
        fromPublicKey: { type: "string" },
        toPublicKey: { type: "string" },
        amount: { type: "number" },
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
      },
      required: ["fromPublicKey", "toPublicKey", "amount"]
    }
  },
  {
    name: "wallet_sign_transaction",
    description: "Sign a transaction with a private key",
    inputSchema: {
      type: "object",
      properties: {
        transaction: { type: "string" },
        privateKey: { type: "string" }
      },
      required: ["transaction", "privateKey"]
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
        commitment: { type: "string", enum: ["confirmed", "finalized", "processed"] }
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
  }
];

export const handlers: Record<string, (input: any) => Promise<any>> = {
  wallet_get_balance: getBalanceHandler,
  wallet_get_token_accounts: getTokenAccountsHandler,
  wallet_get_token_balance: getTokenBalanceHandler,
  wallet_create_transaction: createTransactionHandler,
  wallet_sign_transaction: signTransactionHandler,
  wallet_send_transaction: sendTransactionHandler,
  wallet_generate_keypair: generateKeyPairHandler,
  wallet_import_private_key: importPrivateKeyHandler,
  wallet_validate_address: validateAddressHandler
};
