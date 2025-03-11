// Import from @solana/kit instead of using mocks
import { address, Address } from "@solana/kit";
import { ToolResultSchema } from "../types.js";

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
export const validateAddress = <T>(addressString: string): Address<string> | ToolResultSchema<T> => {
  const { addr, error } = createAddress(addressString);
  if (error) {
    return createErrorResponse<T>(error);
  }
  return addr!;
};
