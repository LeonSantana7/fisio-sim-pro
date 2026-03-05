import { prisma } from '../lib/prisma.js';

export class ProtocolService {
    static async listAll() {
        return prisma.protocol.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    static async getById(id: string) {
        return prisma.protocol.findUnique({
            where: { id },
            include: {
                criteria: { orderBy: { sortOrder: 'asc' } },
                targets: { orderBy: { sortOrder: 'asc' } },
                sources: { orderBy: { sortOrder: 'asc' } },
                decisionFlow: { orderBy: { stepNumber: 'asc' } },
            },
        });
    }
}
