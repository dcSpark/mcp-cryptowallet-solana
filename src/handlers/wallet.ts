// Import types from local files until we install @solana/kit
import { ToolResultSchema } from "../types.js";
import { createErrorResponse, createSuccessResponse, validateAddress } from "./utils.js";
import { 
  GetBalanceInput, 
  GetTokenAccountsInput, 
  GetTokenBalanceInput, 
  CreateTransactionInput, 
  SignTransactionInput, 
  SendTransactionInput, 
  GenerateKeyPairInput, 
  ImportPrivateKeyInput, 
  ValidateAddressInput,
  Commitment
} from "./wallet.types.js";

// Mock functions until we install @solana/kit
const createSolanaRpc = (url: string) => {
  return {
    getBalance: ({ address }: { address: string }) => ({
      send: async () => ({ value: 1000000000n }) // 1 SOL
    }),
    getTokenAccountsByOwner: ({ ownerAddress, programId }: { ownerAddress: string, programId: string }) => ({
      send: async () => ({ value: [{ pubkey: "TokenAccount1" }, { pubkey: "TokenAccount2" }] })
    }),
    getTokenAccountBalance: ({ address }: { address: string }) => ({
      send: async () => ({ value: { uiAmount: 100, uiAmountString: "100" } })
    }),
    getLatestBlockhash: () => ({
      send: async () => ({ value: { blockhash: "mock-blockhash", lastValidBlockHeight: 100n } })
    })
  };
};

const createSolanaRpcSubscriptions = (url: string) => ({});

const sendAndConfirmTransactionFactory = ({ rpc, rpcSubscriptions }: any) => {
  return async (transaction: any, options?: { skipPreflight?: boolean, commitment?: Commitment }) => {
    return "mock-signature";
  };
};

const generateKeyPairSigner = async () => {
  return {
    address: "mock-address",
    getSecretKey: async () => new Uint8Array(32).fill(1)
  };
};

const createKeyPairSignerFromPrivateKeyBytes = async (privateKeyBytes: Uint8Array) => {
  return {
    address: "mock-address-from-private-key"
  };
};

const pipe = (initial: any, ...fns: Array<(arg: any) => any>) => {
  return fns.reduce((acc, fn) => fn(acc), initial);
};

const createTransactionMessage = ({ version }: { version: number }) => ({
  version
});

const setTransactionMessageFeePayer = (address: string, tx: any) => ({
  ...tx,
  feePayer: address
});

const setTransactionMessageLifetimeUsingBlockhash = (blockhash: any, tx: any) => ({
  ...tx,
  recentBlockhash: blockhash.blockhash
});

const appendTransactionMessageInstruction = (instruction: any, tx: any) => ({
  ...tx,
  instructions: [...(tx.instructions || []), instruction]
});

const getTransferSolInstruction = ({ amount, destination, source }: { amount: any, destination: string, source: string }) => ({
  programId: "11111111111111111111111111111111", // System program ID
  keys: [
    { pubkey: source, isSigner: true, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true }
  ],
  data: "mock-instruction-data"
});

const lamports = (amount: bigint) => amount;

const signTransactionMessageWithSigners = async (transactionMessage: any, signers?: any[]) => {
  return {
    ...transactionMessage,
    signatures: { "mock-address": "mock-signature" },
    serialize: () => new Uint8Array(64).fill(2)
  };
};

const compileTransaction = (transactionMessage: any) => {
  if (transactionMessage instanceof Uint8Array) {
    return {
      serialize: () => new Uint8Array(64).fill(3)
    };
  }
  return {
    ...transactionMessage,
    serialize: () => new Uint8Array(64).fill(3)
  };
};

// Create a connection to the Solana cluster
const rpc = createSolanaRpc("https://api.devnet.solana.com");
const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

export const getBalanceHandler = async (input: GetBalanceInput): Promise<ToolResultSchema<any>> => {
  try {
    // Validate the public key is a valid format
    const publicKeyAddr = validateAddress(input.publicKey);
    if (typeof publicKeyAddr !== 'string') {
      return publicKeyAddr;
    }

    const balance = await rpc.getBalance({ address: publicKeyAddr }).send();
    const balanceInSol = Number(balance.value) / 1_000_000_000; // Convert lamports to SOL
    return createSuccessResponse(`Balance: ${balance.value} lamports (${balanceInSol} SOL)`);
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

    const tokenAccounts = await rpc.getTokenAccountsByOwner({
      ownerAddress: publicKeyAddr,
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Token program ID
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

    const tokenBalance = await rpc.getTokenAccountBalance({ address: tokenAccountAddr }).send();
    return createSuccessResponse(`Token balance: ${tokenBalance.value.uiAmount} ${tokenBalance.value.uiAmountString}`);
  } catch (error) {
    return createErrorResponse(`Error getting token balance: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createTransactionHandler = async (input: CreateTransactionInput): Promise<ToolResultSchema<any>> => {
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

    // Get the latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Create a new transaction
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayer(fromPublicKeyAddr, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          amount: lamports(BigInt(input.amount * 1_000_000_000)), // Convert SOL to lamports
          destination: toPublicKeyAddr,
          source: fromPublicKeyAddr,
        }),
        tx
      )
    );

    // Serialize the transaction
    const transaction = compileTransaction(transactionMessage);
    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
    return createSuccessResponse(`Transaction created: ${serializedTransaction}`);
  } catch (error) {
    return createErrorResponse(`Error creating transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const signTransactionHandler = async (input: SignTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Deserialize the transaction
    const transactionBuffer = Buffer.from(input.transaction, 'base64');
    const transaction = compileTransaction(transactionBuffer);

    // Import the private key
    const privateKeyBytes = Buffer.from(input.privateKey, 'base64');
    const signer = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    // Sign the transaction
    const signedTransaction = await signTransactionMessageWithSigners(transaction, [signer]);

    // Serialize the signed transaction
    const serializedTransaction = Buffer.from(signedTransaction.serialize()).toString('base64');
    return createSuccessResponse(`Transaction signed: ${serializedTransaction}`);
  } catch (error) {
    return createErrorResponse(`Error signing transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const sendTransactionHandler = async (input: SendTransactionInput): Promise<ToolResultSchema<any>> => {
  try {
    // Deserialize the signed transaction
    const transactionBuffer = Buffer.from(input.signedTransaction, 'base64');
    const transaction = compileTransaction(transactionBuffer);

    // Send the transaction
    const signature = await sendAndConfirmTransaction(transaction, {
      skipPreflight: input.skipPreflight,
      commitment: input.commitment,
    });

    return createSuccessResponse(`Transaction sent: ${signature}`);
  } catch (error) {
    return createErrorResponse(`Error sending transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateKeyPairHandler = async (_input: GenerateKeyPairInput): Promise<ToolResultSchema<any>> => {
  try {
    // Generate a new keypair
    const signer = await generateKeyPairSigner();

    // Extract the private key
    const privateKeyBytes = await signer.getSecretKey();
    const privateKeyBase64 = Buffer.from(privateKeyBytes).toString('base64');

    // Return the public key and private key
    return createSuccessResponse(`
    Public key: ${signer.address}
    Private key: ${privateKeyBase64}`);
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
