import dotenv from 'dotenv';
dotenv.config();

export const config = {
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    deployerKey: process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`,
    issuerKey: process.env.ISSUER_PRIVATE_KEY as `0x${string}`,
    agentKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
  },
  contracts: {
    factory: process.env.TREX_FACTORY_ADDRESS as `0x${string}`,
    token: process.env.TOKEN_ADDRESS as `0x${string}`,
    identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
    compliance: process.env.COMPLIANCE_ADDRESS as `0x${string}`,
    claimIssuer: process.env.CLAIM_ISSUER_ADDRESS as `0x${string}`,
  }
};
