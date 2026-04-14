// Basic ABIs for the core ERC-3643 components
// In a real project, these are imported from @erc-3643/core or generated via TypeChain/Wagmi

export const TREXFactoryABI = [
  {
    inputs: [
      { internalType: 'string', name: '_salt', type: 'string' },
      { internalType: 'struct ITREXFactory.TokenDetails', name: '_tokenDetails', type: 'tuple' },
      { internalType: 'struct ITREXFactory.ClaimDetails', name: '_claimDetails', type: 'tuple' }
    ],
    name: 'deployTREXSuite',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: '_token', type: 'address' },
      { indexed: false, internalType: 'address', name: '_ir', type: 'address' },
      { indexed: false, internalType: 'address', name: '_irs', type: 'address' },
      { indexed: false, internalType: 'address', name: '_ctr', type: 'address' },
      { indexed: false, internalType: 'address', name: '_tir', type: 'address' },
      { indexed: false, internalType: 'address', name: '_compliance', type: 'address' }
    ],
    name: 'TREXSuiteDeployed',
    type: 'event'
  }
] as const;

export const TokenABI = [
  {
    inputs: [{ internalType: 'address', name: '_to', type: 'address' }, { internalType: 'uint256', name: '_amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_userAddress', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_from', type: 'address' },
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'canTransfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }, { internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
] as const;

export const IdentityRegistryABI = [
  {
    inputs: [
      { internalType: 'address', name: '_userAddress', type: 'address' },
      { internalType: 'address', name: '_identity', type: 'address' },
      { internalType: 'uint16', name: '_country', type: 'uint16' }
    ],
    name: 'registerIdentity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'investor', type: 'address' },
      { indexed: true, internalType: 'address', name: 'identity', type: 'address' },
      { indexed: false, internalType: 'uint16', name: 'country', type: 'uint16' }
    ],
    name: 'IdentityRegistered',
    type: 'event'
  }
] as const;
