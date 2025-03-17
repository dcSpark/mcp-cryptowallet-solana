// Import types from local files until we install @solana/kit
import { ToolResultSchema } from "../types.js";
import { createErrorResponse, createKeyPairFromPrivateKey, createSuccessResponse, validateAddress } from "./utils.js";
import {
  CheckTransactionInput,
  CreateTransactionInput,
  GenerateKeyPairInput,
  GetBalanceInput,
  GetTokenAccountsInput,
  GetTokenBalanceInput,
  ImportPrivateKeyInput,
  SendTransactionInput,
  SignTransactionInput,
  ValidateAddressInput
} from "./wallet.types.js";

import {
  address,
  createKeyPairSignerFromPrivateKeyBytes,
  createSolanaRpc,
} from "@solana/kit";

import { Connection, Keypair, Message, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

// Create configurable connections to Solana clusters
let currentNetwork: 'devnet' | 'mainnet' = 'devnet';
const RPC_URLS = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com'
};

// Initialize RPC with default network (devnet)
let rpc = createSolanaRpc(RPC_URLS[currentNetwork]);

// Function to switch networks
export const switchNetwork = (network: 'devnet' | 'mainnet'): void => {
  currentNetwork = network;
  rpc = createSolanaRpc(RPC_URLS[network]);
  console.log(`Switched to ${network} network`);
};

// Export function to get current network
export const getCurrentNetwork = (): string => {
  return currentNetwork;
};

// Define TOKEN_PROGRAM_ID constant
const TOKEN_PROGRAM_ID = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// Setup default keypair from environment variable if available
let defaultPublicKey: string | null = null;
let defaultPrivateKey: string | null = null;
const setDefaultKeyPair = async (privateKey: string) => {
  defaultPrivateKey = privateKey;
  defaultPublicKey = (await createKeyPairSignerFromPrivateKeyBytes(bs58.decode(privateKey))).address;
}

// Initialize default keypair if PRIVATE_KEY environment variable is set
if (process.env.PRIVATE_KEY) {
  try {
    await setDefaultKeyPair(process.env.PRIVATE_KEY);
  } catch (error) {
    console.error(`Error initializing default wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const nullPublicKeyError = createErrorResponse('No public key provided and no default wallet configured. Set up the PRIVATE_KEY environment variable to use the default wallet.');
const nullPrivateKeyError = createErrorResponse('No private key provided and no default wallet configured. Set up the PRIVATE_KEY environment variable to use the default wallet.');

export const getBalanceHandler = async (input: GetBalanceInput): Promise<ToolResultSchema> => {
  try {
    // Validate the public key is a valid format
    const publicKey = input.publicKey || defaultPublicKey;
    if (!publicKey) return nullPublicKeyError;
    const publicKeyAddr = validateAddress(publicKey);
    if (typeof publicKeyAddr !== 'string') return publicKeyAddr;

    const balance = await rpc.getBalance(publicKeyAddr, { 
      commitment: input.commitment ?? "confirmed",
    }).send();
    const balanceInSol = Number(balance.value) / 1_000_000_000; // Convert lamports to SOL
    return createSuccessResponse(`
      Balance: ${balance.value} lamports (${balanceInSol} SOL).
    `);
  } catch (error) {
    return createErrorResponse(`Error getting balance: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getTokenAccountsHandler = async (input: GetTokenAccountsInput): Promise<ToolResultSchema> => {
  try {
    // Validate the public key is a valid format
    const publicKey = input.publicKey || defaultPublicKey;
    if (!publicKey) return nullPublicKeyError;
    const publicKeyAddr = validateAddress(publicKey);
    if (typeof publicKeyAddr !== 'string') return publicKeyAddr;

    const tokenAccounts = await rpc.getTokenAccountsByOwner(publicKeyAddr, {
      programId: TOKEN_PROGRAM_ID, // Use constant from @solana/kit
    }).send();
    return createSuccessResponse(`
    Token accounts: ${tokenAccounts.value.map((tokenAccount) => tokenAccount.pubkey).join("\n")}`);
  } catch (error) {
    return createErrorResponse(`Error getting token accounts: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getTokenBalanceHandler = async (input: GetTokenBalanceInput): Promise<ToolResultSchema> => {
  try {
    // Validate the token account address is a valid format
    const tokenAccountAddr = validateAddress(input.tokenAccountAddress);
    if (typeof tokenAccountAddr !== 'string') {
      return tokenAccountAddr;
    }
    const tokenBalance = await rpc.getTokenAccountBalance(tokenAccountAddr, { 
      commitment: input.commitment ?? "confirmed",
    }).send();
    return createSuccessResponse(`
      Token balance: ${tokenBalance.value.uiAmount} ${tokenBalance.value.uiAmountString}
    `);
  } catch (error) {
    return createErrorResponse(`Error getting token balance: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createTransactionMessageHandler = async (input: CreateTransactionInput): Promise<ToolResultSchema> => {
  try {
    if (!BigInt(input.amount)) {
      return createErrorResponse('Invalid amount. Amount must be an integer number representing the amount of lamports to transfer.');
    }
    // Validate the from public key is a valid format
    const fromPublicKey = input.fromPublicKey || defaultPublicKey;
    if (!fromPublicKey) return nullPublicKeyError;
    const fromPublicKeyAddr = validateAddress(fromPublicKey);
    if (typeof fromPublicKeyAddr !== 'string') return fromPublicKeyAddr;

    // Validate the to public key is a valid format
    const toPublicKeyAddr = validateAddress(input.toPublicKey);
    if (typeof toPublicKeyAddr !== 'string') return toPublicKeyAddr;

    // Validate the transaction amount
    if (typeof input.amount !== 'number' || input.amount <= 0) {
      return createErrorResponse('Invalid amount. Amount must be greater than zero.');
    }

    // Get a recent blockhash
    const { value: { blockhash } } = await rpc.getLatestBlockhash().send();

    const transaction = new Transaction();
    transaction.add(SystemProgram.transfer({
      fromPubkey: new PublicKey(fromPublicKeyAddr),
      toPubkey: new PublicKey(toPublicKeyAddr),
      lamports: input.amount,
    }));
    transaction.feePayer = new PublicKey(fromPublicKeyAddr);
    transaction.recentBlockhash = blockhash;
    
    const message = transaction.compileMessage();
    const serializedMessage = bs58.encode(message.serialize());
    return createSuccessResponse(`Transaction Message created: ${serializedMessage}`);
  } catch (error) {
    return createErrorResponse(`Error creating transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const signTransactionMessageHandler = async (input: SignTransactionInput): Promise<ToolResultSchema> => {
  try {
    // Deserialize the message using base58 instead of base64
    const messageBuffer = Buffer.from(bs58.decode(input.transaction));
    const message = Message.from(messageBuffer);
    
    // Create a new transaction with this message
    const transaction = Transaction.populate(message);
    
    // Import the private key (assuming it's already in the correct format)
    const privateKey = input.privateKey || defaultPrivateKey;
    if (!privateKey) return nullPrivateKeyError;
    // Use the utility function to create a keypair from the private key
    const keypair = await createKeyPairFromPrivateKey(privateKey);
    // Sign the transaction
    transaction.sign(keypair);
    
    // Serialize the signed transaction using base58
    const serializedTransaction = bs58.encode(transaction.serialize());
    
    return createSuccessResponse(`Transaction signed: ${serializedTransaction}`);
  } catch (error) {
    return createErrorResponse(`Error signing transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const sendTransactionHandler = async (input: SendTransactionInput): Promise<ToolResultSchema> => {
  try {
    // Deserialize the signed transaction using base58
    const transactionBuffer = Buffer.from(bs58.decode(input.signedTransaction));
    const transaction = Transaction.from(transactionBuffer);

    // Use provided RPC URL or fall back to current network's URL
    const rpcUrl = input.rpcUrl || RPC_URLS[currentNetwork];
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // Send the transaction
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      { skipPreflight: input.skipPreflight || false }
    );
    return createSuccessResponse(`Transaction sent: ${signature}`);
  } catch (error) {
    return createErrorResponse(`Error sending transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const checkTransactionHandler = async (input: CheckTransactionInput): Promise<ToolResultSchema> => {
  try {
    const rpcUrl = input.rpcUrl || RPC_URLS[currentNetwork];
    const connection = new Connection(rpcUrl, 'confirmed');
    const signature = await connection.getTransaction(input.signature, {
      commitment: input.commitment || 'confirmed',
    });
    if (!signature) {
      return createErrorResponse('Transaction not found');
    }
    return createSuccessResponse(`Transaction confirmed:
      Slot: ${signature.slot}
      Blocktime: ${signature.blockTime}
      Status: ${signature.meta?.err ? 'Error' : 'Ok'}
      Fee: ${signature.meta?.fee}
      PreBalance: ${signature.meta?.preBalances}
      Post Balance: ${signature.meta?.postBalances}
    `);
  } catch (error) {
    return createErrorResponse(`Error checking transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateKeyPairHandler = async (input: GenerateKeyPairInput): Promise<ToolResultSchema> => {
  try {
    // Generate a new keypair
    const signer = Keypair.generate();
    // Extract the private key and encode with base58
    const privateKey = bs58.encode(Buffer.from(signer.secretKey.slice(0, 32)));
    // Return the public key and private key
    return createSuccessResponse(`
    Public key: ${signer.publicKey.toString()}
    Private key: ${privateKey}`);
  } catch (error) {
    return createErrorResponse(`Error generating keypair: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const importPrivateKeyHandler = async (input: ImportPrivateKeyInput): Promise<ToolResultSchema> => {
  try {
    // Import the private key using base58
    const privateKeyBytes = bs58.decode(input.privateKey);
    const signer = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    // Return the public key
    return createSuccessResponse(`Public key: ${signer.address}`);
  } catch (error) {
    return createErrorResponse(`Error importing private key: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const validateAddressHandler = async (input: ValidateAddressInput): Promise<ToolResultSchema> => {
  try {
    // Validate the address is a valid format
    const addressResult = validateAddress(input.address);
    if (typeof addressResult === 'string') {
      return createSuccessResponse(`Address is valid: ${input.address}`);
    } else {
      return addressResult;
    }
  } catch (error) {
    return createErrorResponse(`Error validating address: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const switchNetworkHandler = async (input: { network: 'devnet' | 'mainnet' }): Promise<ToolResultSchema> => {
  try {
    if (input.network !== 'devnet' && input.network !== 'mainnet') {
      return createErrorResponse('Invalid network. Must be "devnet" or "mainnet".');
    }
    
    switchNetwork(input.network);
    return createSuccessResponse(`Successfully switched to ${input.network} network.`);
  } catch (error) {
    return createErrorResponse(`Error switching network: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getCurrentNetworkHandler = async (): Promise<ToolResultSchema> => {
  try {
    const network = getCurrentNetwork();
    return createSuccessResponse(`Current network is ${network}.`);
  } catch (error) {
    return createErrorResponse(`Error getting current network: ${error instanceof Error ? error.message : String(error)}`);
  }
};