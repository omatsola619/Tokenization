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
import { resolveAddress } from '../common/address';
import { config } from '../config';
import { TREXFactoryABI, TokenABI, IdentityRegistryABI, IdentityABI } from '../config/abis';

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

  private getWalletClient(account: Account): WalletClient {
    return createWalletClient({
      account,
      chain: hardhat,
      transport: http(config.blockchain.rpcUrl),
    });
  }

  async registerInvestor(walletAddress: string, identityAddress: string, country: number) {
    const client = this.getWalletClient(this.agentAccount);
    const resolvedWallet = resolveAddress(walletAddress);
    const resolvedIdentity = resolveAddress(identityAddress);
    
    try {
      const { request } = await this.publicClient.simulateContract({
        address: config.contracts.identityRegistry as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'registerIdentity',
        args: [resolvedWallet, resolvedIdentity, country],
        account: this.agentAccount,
      });

      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain registerInvestor failed:`, error.message);
      throw error;
    }
  }

  async addClaim(
    identityAddress: string, 
    topic: bigint, 
    scheme: bigint, 
    issuer: string, 
    signature: `0x${string}`, 
    data: `0x${string}`, 
    uri: string
  ) {
    const client = this.getWalletClient(this.issuerAccount);
    const resolvedIdentity = resolveAddress(identityAddress);
    const resolvedIssuer = resolveAddress(issuer);
    
    try {
      const { request } = await this.publicClient.simulateContract({
        address: resolvedIdentity as `0x${string}`,
        abi: IdentityABI,
        functionName: 'addClaim',
        args: [topic, scheme, resolvedIssuer, signature, data, uri],
        account: this.issuerAccount,
      });

      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain addClaim failed:`, error.message);
      throw error;
    }
  }

  async mintTokens(to: string, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);
    const resolvedTo = resolveAddress(to);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: config.contracts.token as `0x${string}`,
        abi: TokenABI,
        functionName: 'mint',
        args: [resolvedTo, amount],
        account: this.agentAccount,
      });

      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain mintTokens failed:`, error.message);
      throw error;
    }
  }

  async canTransfer(from: string, to: string, amount: bigint): Promise<[boolean, number]> {
    const resolvedFrom = resolveAddress(from);
    const resolvedTo = resolveAddress(to);
    try {
      const result = await this.publicClient.readContract({
        address: config.contracts.token as `0x${string}`,
        abi: TokenABI,
        functionName: 'canTransfer',
        args: [resolvedFrom, resolvedTo, amount],
      });
      return result as [boolean, number];
    } catch (error: any) {
      console.error(`Blockchain canTransfer revert:`, error.message);
      return [false, 1];
    }
  }

  async burnTokens(from: string, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);
    const resolvedFrom = resolveAddress(from);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: config.contracts.token as `0x${string}`,
        abi: TokenABI,
        functionName: 'burn',
        args: [resolvedFrom, amount],
        account: this.agentAccount,
      });

      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain burnTokens failed:`, error.message);
      throw error;
    }
  }

  async freezeAddress(wallet: string, freeze: boolean) {
    const client = this.getWalletClient(this.agentAccount);
    const resolvedWallet = resolveAddress(wallet);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: config.contracts.token as `0x${string}`,
        abi: TokenABI,
        functionName: 'setAddressFrozen',
        args: [resolvedWallet, freeze],
        account: this.agentAccount,
      });

      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain freezeAddress failed:`, error.message);
      throw error;
    }
  }

  async freezePartialTokens(wallet: string, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);
    const resolvedWallet = resolveAddress(wallet);
    try {
      const { request } = await this.publicClient.simulateContract({
        address: config.contracts.token as `0x${string}`,
        abi: TokenABI,
        functionName: 'freezePartialTokens',
        args: [resolvedWallet, amount],
        account: this.agentAccount,
      });
      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain freezePartialTokens failed:`, error.message);
      throw error;
    }
  }

  async unfreezePartialTokens(wallet: string, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);
    const resolvedWallet = resolveAddress(wallet);
    try {
      const { request } = await this.publicClient.simulateContract({
        address: config.contracts.token as `0x${string}`,
        abi: TokenABI,
        functionName: 'unfreezePartialTokens',
        args: [resolvedWallet, amount],
        account: this.agentAccount,
      });
      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain unfreezePartialTokens failed:`, error.message);
      throw error;
    }
  }

  async forceTransfer(from: string, to: string, amount: bigint) {
    const client = this.getWalletClient(this.agentAccount);
    const resolvedFrom = resolveAddress(from);
    const resolvedTo = resolveAddress(to);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: config.contracts.token as `0x${string}`,
        abi: TokenABI,
        functionName: 'forcedTransfer',
        args: [resolvedFrom, resolvedTo, amount],
        account: this.agentAccount,
      });

      const hash = await client.writeContract(request);
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error(`Blockchain forceTransfer failed:`, error.message);
      throw error;
    }
  }

  async pauseToken() {
    const client = this.getWalletClient(this.agentAccount);
    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token as `0x${string}`,
      abi: TokenABI,
      functionName: 'pause',
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  async unpauseToken() {
    const client = this.getWalletClient(this.agentAccount);
    const { request } = await this.publicClient.simulateContract({
      address: config.contracts.token as `0x${string}`,
      abi: TokenABI,
      functionName: 'unpause',
      account: this.agentAccount,
    });

    const hash = await client.writeContract(request);
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  async isPaused(): Promise<boolean> {
    return await this.publicClient.readContract({
      address: config.contracts.token as `0x${string}`,
      abi: TokenABI,
      functionName: 'paused',
    }) as boolean;
  }

  async isIdentityRegistered(walletAddress: string): Promise<boolean> {
    const resolvedWallet = resolveAddress(walletAddress);
    try {
      return await this.publicClient.readContract({
        address: config.contracts.identityRegistry as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'contains',
        args: [resolvedWallet],
      }) as boolean;
    } catch {
      return false;
    }
  }

  async isFrozen(wallet: string): Promise<boolean> {
    const resolvedWallet = resolveAddress(wallet);
    return await this.publicClient.readContract({
      address: config.contracts.token as `0x${string}`,
      abi: TokenABI,
      functionName: 'isFrozen',
      args: [resolvedWallet],
    }) as boolean;
  }

  async getFrozenTokens(wallet: string): Promise<bigint> {
    const resolvedWallet = resolveAddress(wallet);
    return await this.publicClient.readContract({
      address: config.contracts.token as `0x${string}`,
      abi: TokenABI,
      functionName: 'getFrozenTokens',
      args: [resolvedWallet],
    }) as bigint;
  }

  getPublicClient() {
    return this.publicClient;
  }
}

export const blockchainService = new BlockchainService();
