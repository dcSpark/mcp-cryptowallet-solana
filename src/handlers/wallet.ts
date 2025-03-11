// Import types from local files until we install @solana/kit
import { ToolResultSchema } from "../types.js";
import { createErrorResponse, createSuccessResponse, validateAddress } from "./utils.js";
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
  createSolanaRpcSubscriptions,
} from "@solana/kit";

import { Connection, Keypair, Message, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

// Create a connection to the Solana cluster
const rpc = createSolanaRpc("https://api.devnet.solana.com");
const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

// Define TOKEN_PROGRAM_ID constant
const TOKEN_PROGRAM_ID = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");


export const getBalanceHandler = async (input: GetBalanceInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the public key is a valid format
    const publicKeyAddr = validateAddress(input.publicKey);
    if (typeof publicKeyAddr !== 'string') {
      return publicKeyAddr;
    }

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

export const getTokenAccountsHandler = async (input: GetTokenAccountsInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the public key is a valid format
    const publicKeyAddr = validateAddress(input.publicKey);
    if (typeof publicKeyAddr !== 'string') {
      return publicKeyAddr;
    }

    const tokenAccounts = await rpc.getTokenAccountsByOwner(publicKeyAddr, {
      programId: TOKEN_PROGRAM_ID, // Use constant from @solana/kit
    }).send();

    return createSuccessResponse(`
    Token accounts: ${tokenAccounts.value.map((tokenAccount) => tokenAccount.pubkey).join("\n")}`);
  } catch (error) {
    return createErrorResponse(`Error getting token accounts: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getTokenBalanceHandler = async (input: GetTokenBalanceInput): Promise<ToolResultSchema<any>> => {
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

export const createTransactionMessageHandler = async (input: CreateTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the from public key is a valid format
    const fromPublicKeyAddr = validateAddress(input.fromPublicKey);
    if (typeof fromPublicKeyAddr !== 'string') {
      return fromPublicKeyAddr;
    }

    // Validate the to public key is a valid format
    const toPublicKeyAddr = validateAddress(input.toPublicKey);
    if (typeof toPublicKeyAddr !== 'string') {
      return toPublicKeyAddr;
    }

    // Validate the transaction amount
    if (typeof input.amount !== 'number' || input.amount <= 0) {
      return createErrorResponse('Invalid amount. Amount must be greater than zero.');
    }
    const transaction = new Transaction();
    transaction.add(SystemProgram.transfer({
      fromPubkey: new PublicKey(fromPublicKeyAddr),
      toPubkey: new PublicKey(toPublicKeyAddr),
      lamports: input.amount, // Amount in lamports (0.001 SOL)
    }));
    transaction.feePayer = new PublicKey(fromPublicKeyAddr);
    const message = transaction.compileMessage();
    const serializedMessage = message.serialize().toString('base64');
    return createSuccessResponse(`Transaction Message created: ${serializedMessage}`);
  } catch (error) {
    return createErrorResponse(`Error creating transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const signTransactionMessageHandler = async (input: SignTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Deserialize the message, not a full transaction
    const messageBuffer = Buffer.from(input.transaction, 'base64');
    const message = Message.from(messageBuffer);
    
    // Create a new transaction with this message
    const transaction = Transaction.populate(message);
    
    // Import the private key (assuming it's already in the correct format)
    const signer = Keypair.fromSecretKey(
      Buffer.from(input.privateKey, 'base64')
    );
    
    // Sign the transaction
    transaction.sign(signer);
    
    // Serialize the signed transaction
    const serializedTransaction = transaction.serialize().toString('base64');
    
    return createSuccessResponse(`Transaction signed: ${serializedTransaction}`);
  } catch (error) {
    return createErrorResponse(`Error signing transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const sendTransactionHandler = async (input: SendTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Deserialize the signed transaction
    const transactionBuffer = Buffer.from(input.signedTransaction, 'base64');
    const transaction = Transaction.from(transactionBuffer);

    // Send the transaction
    const connection = new Connection(input.rpcUrl || 'https://api.mainnet-beta.solana.com', 'confirmed');
    
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

export const checkTransactionHandler = async (input: CheckTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    const connection = new Connection(input.rpcUrl || 'https://api.mainnet-beta.solana.com', 'confirmed');
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

export const generateKeyPairHandler = async (input: GenerateKeyPairInput): Promise<ToolResultSchema<any>> => {
  try {
    // Generate a new keypair
    const signer = Keypair.generate();
    // Extract the private key
    const privateKey = signer.secretKey.toString();
    // Return the public key and private key
    return createSuccessResponse(`
    Public key: ${signer.publicKey.toString()}
    Private key: ${privateKey}`);
  } catch (error) {
    return createErrorResponse(`Error generating keypair: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const importPrivateKeyHandler = async (input: ImportPrivateKeyInput): Promise<ToolResultSchema<any>> => {
  try {
    // Import the private key
    const privateKeyBytes = Buffer.from(input.privateKey, 'base64');
    const signer = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    // Return the public key
    return createSuccessResponse(`Public key: ${signer.address}`);
  } catch (error) {
    return createErrorResponse(`Error importing private key: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const validateAddressHandler = async (input: ValidateAddressInput): Promise<ToolResultSchema<any>> => {
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
