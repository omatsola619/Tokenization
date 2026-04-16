import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEventLogs,
  PublicClient,
  WalletClient,
  Account
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { config } from '../config';
import { TREXFactoryABI, TokenABI, IdentityRegistryABI } from '../config/abis';

export class BlockchainService {
  private publicClient: PublicClient;
  private issuerAccount: Account;
  private agentAccount: Account;

  constructor() {
    this.publicClient = createPublicClient({
      chain: hardhat,
      transport: http(config.blockchain.rpcUrl),
    });

    this.issuerAccount = privateKeyToAccount(config.blockchain.issuerKey);
    this.agentAccount = privateKeyToAccount(config.blockchain.agentKey);
  }

  /**
   * Get the wallet client for a specific role (Issuer or Agent)
   */
  private getWalletClient(account: Account): WalletClient {
    return createWalletClient({
      account,
      chain: hardhat,
      transport: http(config.blockchain.rpcUrl),
    });
  }

  /**
   * Register an investor on-chain
   */
  async registerInvestor(walletAddress: `0x${string}`, identityAddress: `0x${string}`, country: number) {
    const client = this.getWalletClient(this.agentAccount);
    
    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.identityRegistry,
      abi: IdentityRegistryABI,
      functionName: 'registerIdentity',
      args: [walletAddress, identityAddress, country],
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Mint tokens to an investor
   */
  async mintTokens(to: `0x${string}`, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'mint',
      args: [to, amount],
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Check if a transfer is compliant
   */
  async canTransfer(from: `0x${string}`, to: `0x${string}`, amount: bigint) {
    return await this.publicClient.readContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'canTransfer',
      args: [from, to, amount],
    });
  }

  /**
   * Burn tokens from an address
   */
  async burnTokens(from: `0x${string}`, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'burn',
      args: [from, amount],
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Freeze or unfreeze an address
   */
  async freezeAddress(wallet: `0x${string}`, freeze: boolean) {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'setAddressFrozen',
      args: [wallet, freeze],
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Freeze partial tokens for an address
   */
  async freezePartialTokens(wallet: `0x${string}`, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'freezePartialTokens',
      args: [wallet, amount],
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Unfreeze partial tokens for an address
   */
  async unfreezePartialTokens(wallet: `0x${string}`, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'unfreezePartialTokens',
      args: [wallet, amount],
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Check if an address is frozen
   */
  async isFrozen(wallet: `0x${string}`): Promise<boolean> {
    return await this.publicClient.readContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'isFrozen',
      args: [wallet],
    }) as boolean;
  }

  /**
   * Get frozen token amount for an address
   */
  async getFrozenTokens(wallet: `0x${string}`): Promise<bigint> {
    return await this.publicClient.readContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'getFrozenTokens',
      args: [wallet],
    }) as bigint;
  }

  /**
   * Force transfer tokens (regulatory action)
   */
  async forceTransfer(from: `0x${string}`, to: `0x${string}`, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'forcedTransfer',
      args: [from, to, amount],
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Pause the token
   */
  async pauseToken() {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'pause',
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Unpause the token
   */
  async unpauseToken() {
    const client = this.getWalletClient(this.agentAccount);

    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'unpause',
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Check if token is paused
   */
  async isPaused(): Promise<boolean> {
    return await this.publicClient.readContract({
      address: config.contracts.token,
      abi: TokenABI,
      functionName: 'paused',
    }) as boolean;
  }

  /**
   * Get public client for custom operations
   */
  getPublicClient() {
    return this.publicClient;
  }
}

export const blockchainService = new BlockchainService();
