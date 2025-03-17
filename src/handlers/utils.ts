// Import from @solana/kit instead of using mocks
import { address, Address } from "@solana/kit";
import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/kit";
import { ToolResultSchema } from "../types.js";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
/**
 * Utility function to handle address creation and error handling
 * @param addressString The address string to convert to an address
 * @returns An object containing either the address or an error message
 */
export const createAddress = (addressString: string): { addr?: Address<string>; error?: string } => {
  try {
    // Use Address from @solana/kit instead of the mock function
    const addr = address(addressString);
    return { addr };
  } catch (error) {
    return { error: `Invalid address: ${addressString}` };
  }
};

/**
 * Utility function to create an error response
 * @param message The error message
 * @returns A ToolResultSchema with the error message
 */
export const createErrorResponse = (message: string): ToolResultSchema => {
  return {
    content: [{
      type: "text",
      text: message
    }],
    isError: true
  };
};

/**
 * Utility function to create a success response
 * @param message The success message
 * @returns A ToolResultSchema with the success message
 */
export const createSuccessResponse = (message: string): ToolResultSchema => {
  return {
    content: [{
      type: "text",
      text: message
    }],
    isError: false
  };
};

/**
 * Utility function to validate an address and return an error response if invalid
 * @param addressString The address string to validate
 * @returns Either an address or a ToolResultSchema with an error message
 */
export const validateAddress = (addressString: string): Address<string> | ToolResultSchema => {
  const { addr, error } = createAddress(addressString);
  if (error) {
    return createErrorResponse(error);
  }
  return addr!;
};

/**
 * Utility function to create a keypair from a private key string
 * @param privateKeyString The private key as a base58 string
 * @returns A Keypair instance
 */
export const createKeyPairFromPrivateKey = async (privateKeyString: string): Promise<Keypair> => {
  // Decode the base58 private key to bytes
  const privateKeyBytes = bs58.decode(privateKeyString);
  
  if (privateKeyBytes.length === 64) {
    try { 
      return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      throw new Error(`Invalid private key. Private key must be 32 or 64 bytes long.
        Private key length: ${privateKeyBytes.length}
      `);
    }
  }
  if (privateKeyBytes.length === 32) {
    const signer = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);
    // Convert the base58 public key to bytes
    const publicKey = bs58.decode(signer.address);
    const fullKeyBytes = Buffer.concat([Buffer.from(privateKeyBytes), Buffer.from(publicKey)]);
    try {
      return Keypair.fromSecretKey(fullKeyBytes);
    } catch (error) {
      throw new Error(`Invalid private key. Private key must be 32 or 64 bytes long.
        Private key length: ${privateKeyBytes.length}
        Public key: ${signer.address}
        Public key length: ${publicKey.length}
        Full key length: ${fullKeyBytes.length}
        Error: ${error instanceof Error ? error.message : String(error)}
        `);
    }
  }
  throw new Error('Invalid private key. Private key must be 32 or 64 bytes long.');
};
