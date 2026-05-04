import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/database.service';

// Maps test JWT tokens to their corresponding wallet placeholder, used for
// dynamic agent DB lookups (e.g. jwt-new-agent → 0xNewAgent).
const TOKEN_TO_WALLET: Record<string, string> = {
  'jwt-new-agent': '0xNewAgent',
  'jwt-investorA': '0xInvestorA',
  'jwt-investorB': '0xInvestorB',
};

const issuerTokens = ['jwt-issuer', 'jwt-trusted-issuer'];
const complianceTokens = ['jwt-compliance'];
const staticAgentTokens = ['jwt-agent'];
const regulatorTokens = ['jwt-regulator'];

export const auth = (role?: 'issuer' | 'investor' | 'compliance' | 'agent' | 'regulator') =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      if (role === 'issuer' && !issuerTokens.includes(token)) {
        return res.status(403).json({ error: 'forbidden: issuer only' });
      }

      if (role === 'compliance' && !complianceTokens.includes(token)) {
        return res.status(403).json({ error: 'forbidden: compliance only' });
      }

      if (role === 'agent') {
        if (staticAgentTokens.includes(token)) {
          // Static agent — always allowed
        } else {
          // Dynamic agent — check if the wallet derived from the token is in the DB
          const wallet = TOKEN_TO_WALLET[token];
          const agent = wallet
            ? await prisma.agent.findUnique({ where: { wallet } })
            : null;
          if (!agent) {
            return res.status(403).json({ error: 'forbidden: agent only' });
          }
        }
      }

      if (role === 'regulator' && !regulatorTokens.includes(token)) {
        return res.status(403).json({ error: 'forbidden: regulator only' });
      }

      if (role === 'investor' && !token.startsWith('jwt-investor')) {
        return res.status(403).json({ error: 'forbidden: investor only' });
      }

      // @ts-ignore
      req.user = { id: token, role };
      next();
    } catch (error) {
      next(error);
    }
  };
