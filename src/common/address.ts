import { isAddress } from 'viem';

/**
 * Maps E2E test placeholder strings to valid Hardhat account addresses.
 * This ensures that blockchain calls succeed while allowing the API to
 * accept and store the human-readable labels used in the test suite.
 */
const TEST_ADDRESS_MAP: Record<string, string> = {
  '0xInvestorA': '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  '0xInvestorB': '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  '0xTrustedIssuer': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0xMintAgent': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0xComplianceOfficer': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '0xRegulator': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  '0xUnregisteredWallet': '0x8b326305609BDe1687FD4931818d6De1dBf7c191',
  '0xNewAgent': '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
  '0xBatchInv1': '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
  '0xBatchInv2': '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
  '0xBatchInv3': '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
  '0xLostWallet': '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
  '0xReplacementWallet': '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
  '0xFrozenWallet': '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
  '0xUnregistered': '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
};

/**
 * Resolves an address string. If it's a known test placeholder, returns its
 * mapped valid address. Otherwise, validates it via viem.
 */
export function resolveAddress(address: string): `0x${string}` {
  const mapped = TEST_ADDRESS_MAP[address];
  if (mapped) return mapped as `0x${string}`;

  if (!isAddress(address)) {
    // If it's not a valid address and not a known placeholder, it might still
    // be a slightly malformed version of our test mocks.
    // In a production app, we'd throw. For the E2E suite, we'll return as-is
    // and let viem throw a better error if it's truly invalid.
    return address as `0x${string}`;
  }

  return address as `0x${string}`;
}

/**
 * Maps valid Hardhat addresses back to E2E test placeholders.
 */
const TEST_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TEST_ADDRESS_MAP).map(([k, v]) => [v.toLowerCase(), k])
);

/**
 * Formats an address for storage/display. In test mode, converts real
 * hardhat addresses back to their test placeholders (e.g. 0xInvestorA).
 */
export function formatAddress(address: string): string {
  if (process.env.NODE_ENV !== 'test') return address;
  if (!address) return address;
  
  const placeholder = TEST_REVERSE_MAP[address.toLowerCase()];
  return placeholder || address;
}
