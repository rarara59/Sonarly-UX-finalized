// src/services/apis/solana.ts
import { 
  Connection, 
  PublicKey, 
  ParsedInstruction,
  GetProgramAccountsFilter
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

interface SolanaConfig {
  rpcEndpoint: string;
  usdcMint: string;
  usdtMint: string;
}

interface TokenTransaction {
  hash: string;
  decimals: number;
  value: string | number;
  timeStamp: number;
  from: string;
  to: string;
  contractAddress: PublicKey;
  tokenSymbol: string;
  programId: string;
}

export class SolanaAPI {
  private connection: Connection;
  private usdcMint: PublicKey;
  private usdtMint: PublicKey;
  private readonly scanLimit = 100;  // Configurable limit for transactions to scan

  constructor(config: SolanaConfig) {
    console.log('Initializing Solana API connection...');
    this.connection = new Connection(config.rpcEndpoint, 'confirmed');
    this.usdcMint = new PublicKey(config.usdcMint);
    this.usdtMint = new PublicKey(config.usdtMint);
  }

  async getWalletTransactions(walletAddress: string): Promise<TokenTransaction[]> {
    try {
      console.log(`Fetching transactions for wallet: ${walletAddress}`);
      const pubkey = new PublicKey(walletAddress);

      // Get associated token accounts for USDC and USDT
      const usdcTokenAccount = getAssociatedTokenAddressSync(this.usdcMint, pubkey);
      const usdtTokenAccount = getAssociatedTokenAddressSync(this.usdtMint, pubkey);

      // Fetch signatures in parallel
      const [signaturesUSDC, signaturesUSDT, signaturesTokens] = await Promise.all([
        this.connection.getSignaturesForAddress(usdcTokenAccount, { limit: this.scanLimit }),
        this.connection.getSignaturesForAddress(usdtTokenAccount, { limit: this.scanLimit }),
        this.connection.getSignaturesForAddress(pubkey, { limit: this.scanLimit })
      ]);

      // Combine all signatures
      const signatures = [...signaturesUSDC, ...signaturesUSDT, ...signaturesTokens];
      console.log(`Fetched ${signatures.length} total signatures`);

      // Get parsed transactions
      const parsedTransactions = await this.connection.getParsedTransactions(
        signatures.map(sig => sig.signature),
        { maxSupportedTransactionVersion: 0 }
      );

      // Process and normalize transactions
      const transactions = parsedTransactions
        .filter(tx => tx?.meta?.err === null && tx.transaction.message?.instructions?.length)
        .map(tx => {
          const instructions = tx.transaction.message.instructions as ParsedInstruction[];
          return instructions
            .filter(instruction => {
              // Filter for relevant instruction types
              return (
                instruction === instructions.findLast(i => 
                  i.parsed?.type === 'transfer' && i.parsed?.info.lamports) ||
                instruction === instructions.findLast(i => 
                  i.parsed?.type === 'transferChecked') ||
                instruction === instructions.findLast(i => 
                  i.program === 'spl-token' && i.parsed?.info?.tokenAmount)
              );
            })
            .map(instruction => ({
              hash: tx.transaction.signatures[0] || "",
              decimals: instruction.parsed?.info.tokenAmount?.decimals || 9,
              value: instruction.parsed.info.lamports || instruction.parsed.info.tokenAmount.amount,
              timeStamp: tx.blockTime || 0,
              from: instruction.parsed.info.source,
              to: instruction.parsed.info.destination,
              contractAddress: new PublicKey(instruction.parsed.info.mint || 0),
              tokenSymbol: instruction.parsed?.type === 'transfer' ? 'SOL' : '',
              programId: instruction.programId
            }));
        })
        .flat()
        .reverse();

      console.log(`Processed ${transactions.length} relevant transactions`);
      return transactions;

    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }

  async getTokenHolders(tokenAddress: string): Promise<{ address: string, balance: string }[]> {
    try {
      const filters: GetProgramAccountsFilter[] = [
        {
          dataSize: 165,  // size of token account
        },
        {
          memcmp: {
            offset: 0,
            bytes: tokenAddress,
          },
        },
      ];

      const accounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),  // Token program ID
        { filters }
      );

      return accounts.map(account => ({
        address: account.pubkey.toString(),
        balance: account.account.data.toString()
      }));

    } catch (error) {
      console.error('Error fetching token holders:', error);
      throw error;
    }
  }
}

// Export factory function
export const createSolanaAPI = (config: SolanaConfig) => {
  return new SolanaAPI(config);
};