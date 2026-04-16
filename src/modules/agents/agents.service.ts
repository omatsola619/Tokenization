import { prisma } from '../../database/database.service';

const VALID_ROLES = ['MINT_AGENT', 'IDENTITY_AGENT', 'CLAIM_AGENT'];

export class AgentsService {
  async addAgent(wallet: string, role: string) {
    if (!VALID_ROLES.includes(role)) {
      throw { status: 400, message: 'invalid role' };
    }

    const agent = await prisma.agent.upsert({
      where: { wallet },
      update: { role },
      create: { wallet, role },
    });

    return { wallet: agent.wallet, role: agent.role };
  }

  async removeAgent(wallet: string) {
    await prisma.agent.delete({ where: { wallet } });
    return { status: 'removed', wallet };
  }

  async getAllAgents() {
    const agents = await prisma.agent.findMany();
    return agents.map(a => ({ wallet: a.wallet, role: a.role }));
  }
}

export const agentsService = new AgentsService();
