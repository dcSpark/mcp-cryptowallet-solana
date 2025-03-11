// Define Commitment type until we install @solana/kit
export type Commitment = 'processed' | 'confirmed' | 'finalized';

export interface GetBalanceInput {
  publicKey: string;
  commitment?: Commitment;
}

export interface GetTokenAccountsInput {
  publicKey: string;
  commitment?: Commitment;
}

export interface GetTokenBalanceInput {
  tokenAccountAddress: string;
  commitment?: Commitment;
}

export interface CreateTransactionInput {
  fromPublicKey: string;
  toPublicKey: string;
  amount: number;
  privateKey: string;
  commitment?: Commitment;
  skipPreflight?: boolean;
}

export interface SignTransactionInput {
  transaction: string;
  privateKey: string;
}

export interface SendTransactionInput {
  signedTransaction: string;
  rpcUrl?: string;
  skipPreflight?: boolean;
  commitment?: Commitment;
}

export interface GenerateKeyPairInput {
  // No input parameters needed
}

export interface ImportPrivateKeyInput {
  privateKey: string;
}

export interface ValidateAddressInput {
  address: string;
}

export interface CheckTransactionInput {
  signature: string;
  rpcUrl?: string;
  commitment?: "confirmed" | "finalized";
}
