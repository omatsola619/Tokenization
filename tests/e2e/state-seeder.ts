/**
 * State seeder — runs before each test file (via setupFilesAfterEnv).
 *
 * Since flows share accumulated state, some wallets must be pre-registered
 * in specific windows between flows. This file handles cross-flow setup that
 * cannot live in any single test file.
 *
 * Requires --runInBand (enforced in jest.e2e.json) so the module-level
 * flags persist across all test suites within the same process.
 */
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/database/database.service';

const BASE = '/api/v1';

// Module-level flags — persist across files when running in-band
let investorBRegistered = false;
let lostWalletSeeded = false;
let complianceSimSeeded = false;

beforeAll(async () => {
  const tokenConfig = await prisma.tokenConfig.findFirst();
  if (!tokenConfig) return; // Bootstrap hasn't run yet — nothing to seed

  // Register InvestorB (needed before transfer flow, Flow 4)
  if (!investorBRegistered) {
    await request(app).post(`${BASE}/investors/register`)
      .send({ wallet: '0xInvestorB', country: 'NG', kycProviderId: 'sumsub_b', metadata: {} });
    await request(app).post(`${BASE}/claims/issue`)
      .set('Authorization', 'Bearer jwt-trusted-issuer')
      .send({ wallet: '0xInvestorB', topic: 'KYC', issuer: '0xTrustedIssuer' });
    investorBRegistered = true;
  }

  // Seed 0xLostWallet with 500 tokens (needed before forced-transfer flow, Flow 6)
  if (!lostWalletSeeded) {
    const existingInvestor = await prisma.investor.findUnique({
      where: { walletAddress: '0xLostWallet' }
    });
    if (!existingInvestor) {
      await request(app).post(`${BASE}/investors/register`)
        .send({ wallet: '0xLostWallet', country: 'NG', kycProviderId: 'kyc_lost', metadata: {} });
      await request(app).post(`${BASE}/claims/issue`)
        .set('Authorization', 'Bearer jwt-trusted-issuer')
        .send({ wallet: '0xLostWallet', topic: 'KYC', issuer: '0xTrustedIssuer' });
      await request(app).post(`${BASE}/tokens/mint`)
        .set('Authorization', 'Bearer jwt-agent')
        .send({ wallet: '0xLostWallet', amount: '500' });
    }
    lostWalletSeeded = true; // always mark done after first check to skip repeated DB queries
  }

  // Seed compliance-sim state (needed before Flow 11):
  //   - Re-issue KYC to InvestorA (revoked in Flow 7/claims)
  //   - Register and freeze 0xFrozenWallet
  if (!complianceSimSeeded) {
    const claimsFlow = await prisma.claim.findFirst({
      where: { wallet: '0xFrozenWallet' }
    });
    // Only seed once the claims-revocation flow has run (InvestorA's KYC will be revoked)
    const investorAKyc = await prisma.claim.findFirst({
      where: { wallet: '0xInvestorA', topic: '1', status: 'active' }
    });
    const pauseFlowDone = await prisma.tokenConfig.findFirst().then(c => !c?.isPaused);

    if (!investorAKyc && pauseFlowDone && !claimsFlow) {
      // Re-issue KYC to InvestorA so compliance-sim "eligible pair" passes
      await request(app).post(`${BASE}/claims/issue`)
        .set('Authorization', 'Bearer jwt-trusted-issuer')
        .send({ wallet: '0xInvestorA', topic: 'KYC', issuer: '0xTrustedIssuer' });

      // Register and freeze 0xFrozenWallet for the "frozen sender" simulation test
      await request(app).post(`${BASE}/investors/register`)
        .send({ wallet: '0xFrozenWallet', country: 'NG', kycProviderId: 'kyc_frozen', metadata: {} });
      await request(app).post(`${BASE}/claims/issue`)
        .set('Authorization', 'Bearer jwt-trusted-issuer')
        .send({ wallet: '0xFrozenWallet', topic: 'KYC', issuer: '0xTrustedIssuer' });
      await request(app).post(`${BASE}/compliance/freeze`)
        .set('Authorization', 'Bearer jwt-compliance')
        .send({ wallet: '0xFrozenWallet' });

      complianceSimSeeded = true;
    }
  }
});
