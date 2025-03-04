// Import types from local files until we install @solana/kit
import { ToolResultSchema } from "../types.js";

// Mock address function until we install @solana/kit
const address = (addressString: string): string => {
  // Simple validation for Solana addresses (base58 encoded, 32-44 characters)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addressString)) {
    throw new Error(`Invalid address: ${addressString}`);
  }
  return addressString;
};

/**
 * Utility function to handle address creation and error handling
 * @param addressString The address string to convert to an address
 * @returns An object containing either the address or an error message
 */
export const createAddress = (addressString: string): { addr?: string; error?: string } => {
  try {
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
export const createErrorResponse = <T>(message: string): ToolResultSchema<T> => {
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
export const createSuccessResponse = <T>(message: string): ToolResultSchema<T> => {
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
export const validateAddress = <T>(addressString: string): string | ToolResultSchema<T> => {
  const { addr, error } = createAddress(addressString);
  if (error) {
    return createErrorResponse<T>(error);
  }
  return addr!;
};
