import request from 'supertest';
import { app } from '../../src/app';

const BASE = '/api/v1';

describe('Investor Identity APIs', () => {

  // ─── POST /investors/register ──────────────────────────────────────

  describe('POST /investors/register', () => {
    it('should return 201 with investorId on valid registration', async () => {
      const res = await request(app).post(`${BASE}/investors/register`)
        .send({ wallet: '0xNewInvestorReg', country: 'GB', kycProviderId: 'sumsub_123', metadata: {} });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('investorId');
      expect(res.body).toHaveProperty('wallet', '0xNewInvestorReg');
    });

    it('should return 400 when wallet is missing', async () => {
      const res = await request(app).post(`${BASE}/investors/register`)
        .send({ country: 'GB' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('wallet');
    });

    it('should return 409 when wallet already registered', async () => {
      await request(app).post(`${BASE}/investors/register`)
        .send({ wallet: '0xDupe', country: 'US', kycProviderId: 'p1' });

      const res = await request(app).post(`${BASE}/investors/register`)
        .send({ wallet: '0xDupe', country: 'US', kycProviderId: 'p1' });

      expect(res.status).toBe(409);
    });
  });

  // ─── GET /investors/:wallet ────────────────────────────────────────

  describe('GET /investors/:wallet', () => {
    it('should return 200 with investor profile', async () => {
      const res = await request(app).get(`${BASE}/investors/0xInvestorA`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('wallet', '0xInvestorA');
      expect(res.body).toHaveProperty('identityRegistered');
      expect(res.body).toHaveProperty('claims');
      expect(res.body).toHaveProperty('frozen');
    });

    it('should return 404 for unknown wallet', async () => {
      const res = await request(app).get(`${BASE}/investors/0xNonExistent`);
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /investors/link-wallet ───────────────────────────────────

  describe('POST /investors/link-wallet', () => {
    it('should return 200 on successful wallet link', async () => {
      const res = await request(app).post(`${BASE}/investors/link-wallet`)
        .set('Authorization', 'Bearer jwt-issuer')
        .send({ identityWallet: '0xPrimary', newWallet: '0xSecondary' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'linked');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post(`${BASE}/investors/link-wallet`)
        .send({ identityWallet: '0xPrimary', newWallet: '0xSecondary' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /investors/unlink-wallet ─────────────────────────────────

  describe('POST /investors/unlink-wallet', () => {
    it('should return 200 on successful unlink', async () => {
      const res = await request(app).post(`${BASE}/investors/unlink-wallet`)
        .set('Authorization', 'Bearer jwt-issuer')
        .send({ wallet: '0xSecondary' });

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post(`${BASE}/investors/unlink-wallet`)
        .send({ wallet: '0xSecondary' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /investors/revoke ────────────────────────────────────────

  describe('POST /investors/revoke', () => {
    it('should return 200 on successful identity revocation by issuer', async () => {
      const res = await request(app).post(`${BASE}/investors/revoke`)
        .set('Authorization', 'Bearer jwt-issuer')
        .send({ wallet: '0xInvestorA' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'revoked');
    });

    it('should return 403 when investor tries to revoke', async () => {
      const res = await request(app).post(`${BASE}/investors/revoke`)
        .set('Authorization', 'Bearer jwt-investorA')
        .send({ wallet: '0xInvestorA' });

      expect(res.status).toBe(403);
    });
  });
});
