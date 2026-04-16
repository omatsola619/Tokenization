import request from 'supertest';
import { app } from '../../src/app';

const BASE = '/api/v1';

describe('Transfer APIs', () => {

  // ─── POST /tokens/transfer ─────────────────────────────────────────

  describe('POST /tokens/transfer', () => {
    it('should return 200 with txHash on successful transfer', async () => {
      const res = await request(app).post(`${BASE}/tokens/transfer`)
        .set('Authorization', 'Bearer jwt-investorA')
        .send({ from: '0xAAA', to: '0xBBB', amount: '50' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('txHash');
      expect(res.body.txHash).toMatch(/^0x/);
    });

    it('should return 422 when compliance pre-check fails', async () => {
      const { blockchainService } = require('../../src/services/blockchain.service');
      (blockchainService.canTransfer as jest.Mock).mockResolvedValueOnce([false, 1]);
      
      const res = await request(app).post(`${BASE}/tokens/transfer`)
        .set('Authorization', 'Bearer jwt-investorA')
        .send({ from: '0xAAA', to: '0xUnregistered', amount: '50' });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post(`${BASE}/tokens/transfer`)
        .set('Authorization', 'Bearer jwt-investorA')
        .send({ amount: '50' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post(`${BASE}/tokens/transfer`)
        .send({ from: '0xAAA', to: '0xBBB', amount: '50' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /tokens/batch-transfer ───────────────────────────────────

  describe('POST /tokens/batch-transfer', () => {
    it('should return 202 with batch job on valid request', async () => {
      const res = await request(app).post(`${BASE}/tokens/batch-transfer`)
        .set('Authorization', 'Bearer jwt-agent')
        .send({ transfers: [{ from: '0xA', to: '0xB', amount: '10' }] });

      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty('jobId');
    });
  });

  // ─── POST /tokens/simulate-transfer ────────────────────────────────

  describe('POST /tokens/simulate-transfer', () => {
    it('should return 200 with canTransfer boolean', async () => {
      const res = await request(app).post(`${BASE}/tokens/simulate-transfer`)
        .set('Authorization', 'Bearer jwt-investorA')
        .send({ from: '0xAAA', to: '0xBBB', amount: '100' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('canTransfer');
      expect(typeof res.body.canTransfer).toBe('boolean');
      expect(res.body).toHaveProperty('reason');
    });
  });
});
