import { prisma } from '../lib/prisma.js';

export class ScenarioService {
    static async listAll() {
        return prisma.ventScenario.findMany({
            where: { isActive: true },
        });
    }

    static async getById(id: string) {
        return prisma.ventScenario.findUnique({
            where: { id },
        });
    }
}
