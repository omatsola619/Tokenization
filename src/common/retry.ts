/**
 * Retry a function with exponential backoff.
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) break;

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Maps ERC-3643 canTransfer reason codes to human-readable messages.
 * These codes are returned as the second value from token.canTransfer().
 */
const TRANSFER_REASON_CODES: Record<number, string> = {
  0: 'Transfer is compliant',
  1: 'Identity of sender is not registered',
  2: 'Identity of recipient is not registered',
  3: 'Sender wallet is frozen',
  4: 'Recipient wallet is frozen',
  5: 'Insufficient balance',
  6: 'Token is paused',
  7: 'Compliance module rejected the transfer',
};

/**
 * Parse a canTransfer reason code into a human-readable message.
 */
export function parseTransferReasonCode(code: number): string {
  return TRANSFER_REASON_CODES[code] || `Unknown reason code: ${code}`;
}
