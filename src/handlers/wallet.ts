import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  sendAndConfirmTransaction, 
  clusterApiUrl 
} from "@solana/web3.js";
import { ToolResultSchema } from "../types.js";
import { createErrorResponse, createSuccessResponse, validatePublicKey, createPublicKey } from "./utils.js";
import { 
  GetBalanceInput, 
  GetTokenAccountsInput, 
  GetTokenBalanceInput, 
  CreateTransactionInput, 
  SignTransactionInput, 
  SendTransactionInput, 
  GenerateKeyPairInput, 
  ImportPrivateKeyInput, 
  ValidateAddressInput 
} from "./wallet.types.js";

// Create a connection to the Solana cluster
const connection = new Connection(clusterApiUrl("devnet"));

export const getBalanceHandler = async (input: GetBalanceInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the public key is a valid format
    const publicKey = validatePublicKey(input.publicKey);
    if (!(publicKey instanceof PublicKey)) {
      return publicKey;
    }

    const balance = await connection.getBalance(publicKey, input.commitment);
    return createSuccessResponse(`Balance: ${balance} lamports (${balance / LAMPORTS_PER_SOL} SOL)`);
  } catch (error) {
    return createErrorResponse(`Error getting balance: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getTokenAccountsHandler = async (input: GetTokenAccountsInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the public key is a valid format
    const publicKey = validatePublicKey(input.publicKey);
    if (!(publicKey instanceof PublicKey)) {
      return publicKey;
    }

    const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // Token program ID
    });

    return createSuccessResponse(`
    Token accounts: ${tokenAccounts.value.map((tokenAccount) => tokenAccount.pubkey.toString()).join("\n")}`);
  } catch (error) {
    return createErrorResponse(`Error getting token accounts: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getTokenBalanceHandler = async (input: GetTokenBalanceInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the token account address is a valid format
    const tokenAccountAddress = validatePublicKey(input.tokenAccountAddress);
    if (!(tokenAccountAddress instanceof PublicKey)) {
      return tokenAccountAddress;
    }

    const tokenBalance = await connection.getTokenAccountBalance(tokenAccountAddress, input.commitment);
    return createSuccessResponse(`Token balance: ${tokenBalance.value.uiAmount} ${tokenBalance.value.uiAmountString}`);
  } catch (error) {
    return createErrorResponse(`Error getting token balance: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createTransactionHandler = async (input: CreateTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the from public key is a valid format
    const fromPublicKey = validatePublicKey(input.fromPublicKey);
    if (!(fromPublicKey instanceof PublicKey)) {
      return fromPublicKey;
    }

    // Validate the to public key is a valid format
    const toPublicKey = validatePublicKey(input.toPublicKey);
    if (!(toPublicKey instanceof PublicKey)) {
      return toPublicKey;
    }

    // Create a new transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: input.amount * LAMPORTS_PER_SOL,
      })
    );

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash(input.commitment);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Serialize the transaction
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString("base64");
    return createSuccessResponse(`Transaction created: ${serializedTransaction}`);
  } catch (error) {
    return createErrorResponse(`Error creating transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const signTransactionHandler = async (input: SignTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Deserialize the transaction
    const transaction = Transaction.from(Buffer.from(input.transaction, "base64"));

    // Import the private key
    const privateKey = Buffer.from(input.privateKey, "base64");
    const keypair = Keypair.fromSecretKey(privateKey);

    // Sign the transaction
    transaction.sign(keypair);

    // Serialize the signed transaction
    const serializedTransaction = transaction.serialize().toString("base64");
    return createSuccessResponse(`Transaction signed: ${serializedTransaction}`);
  } catch (error) {
    return createErrorResponse(`Error signing transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const sendTransactionHandler = async (input: SendTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Deserialize the signed transaction
    const transaction = Transaction.from(Buffer.from(input.signedTransaction, "base64"));

    // Send the transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: input.skipPreflight,
    });

    // Confirm the transaction
    if (input.commitment) {
      await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: 100, // This is a placeholder, should be calculated based on the blockhash
      }, input.commitment);
    }

    return createSuccessResponse(`Transaction sent: ${signature}`);
  } catch (error) {
    return createErrorResponse(`Error sending transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateKeyPairHandler = async (_input: GenerateKeyPairInput): Promise<ToolResultSchema<any>> => {
  try {
    // Generate a new keypair
    const keypair = Keypair.generate();

    // Return the public key and private key
    return createSuccessResponse(`
    Public key: ${keypair.publicKey.toString()}
    Private key: ${Buffer.from(keypair.secretKey).toString("base64")}`);
  } catch (error) {
    return createErrorResponse(`Error generating keypair: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const importPrivateKeyHandler = async (input: ImportPrivateKeyInput): Promise<ToolResultSchema<any>> => {
  try {
    // Import the private key
    const privateKey = Buffer.from(input.privateKey, "base64");
    const keypair = Keypair.fromSecretKey(privateKey);

    // Return the public key
    return createSuccessResponse(`Public key: ${keypair.publicKey.toString()}`);
  } catch (error) {
    return createErrorResponse(`Error importing private key: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const validateAddressHandler = async (input: ValidateAddressInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the address is a valid format
    const { publicKey, error } = createPublicKey(input.address);
    if (error) {
      return createErrorResponse(error);
    }

    return createSuccessResponse(`Address is valid: ${publicKey!.toString()}`);
  } catch (error) {
    return createErrorResponse(`Error validating address: ${error instanceof Error ? error.message : String(error)}`);
  }
};
