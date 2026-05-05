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
  // --- Minting ---
  {
    inputs: [{ internalType: 'address', name: '_to', type: 'address' }, { internalType: 'uint256', name: '_amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // --- Burning ---
  {
    inputs: [{ internalType: 'address', name: '_userAddress', type: 'address' }, { internalType: 'uint256', name: '_amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // --- Balance ---
  {
    inputs: [{ internalType: 'address', name: '_userAddress', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // --- Transfer Simulation ---
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
  // --- Forced Transfer (Regulatory) ---
  {
    inputs: [
      { internalType: 'address', name: '_from', type: 'address' },
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'forcedTransfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // --- Freeze / Unfreeze ---
  {
    inputs: [
      { internalType: 'address', name: '_userAddress', type: 'address' },
      { internalType: 'bool', name: '_freeze', type: 'bool' }
    ],
    name: 'setAddressFrozen',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_userAddress', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'freezePartialTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_userAddress', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'unfreezePartialTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_userAddress', type: 'address' }],
    name: 'isFrozen',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_userAddress', type: 'address' }],
    name: 'getFrozenTokens',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // --- Pause / Unpause ---
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  // --- Events ---
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_userAddress', type: 'address' },
      { indexed: false, internalType: 'bool', name: '_isFrozen', type: 'bool' },
      { indexed: true, internalType: 'address', name: '_owner', type: 'address' }
    ],
    name: 'AddressFrozen',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_userAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'TokensFrozen',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_userAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'TokensUnfrozen',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_addr', type: 'address' }
    ],
    name: 'Paused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_addr', type: 'address' }
    ],
    name: 'Unpaused',
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
    inputs: [{ internalType: 'address', name: '_userAddress', type: 'address' }],
    name: 'contains',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
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

export const IdentityABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'claimId', type: 'bytes32' },
      { indexed: true, internalType: 'uint256', name: 'topic', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'scheme', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'issuer', type: 'address' },
      { indexed: false, internalType: 'bytes', name: 'signature', type: 'bytes' },
      { indexed: false, internalType: 'bytes', name: 'data', type: 'bytes' },
      { indexed: false, internalType: 'string', name: 'uri', type: 'string' }
    ],
    name: 'ClaimAdded',
    type: 'event'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_topic', type: 'uint256' },
      { internalType: 'uint256', name: '_scheme', type: 'uint256' },
      { internalType: 'address', name: '_issuer', type: 'address' },
      { internalType: 'bytes', name: '_signature', type: 'bytes' },
      { internalType: 'bytes', name: '_data', type: 'bytes' },
      { internalType: 'string', name: '_uri', type: 'string' }
    ],
    name: 'addClaim',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;
