import { prisma } from '../lib/prisma.js';

export class CalculatorService {
    static async listAll() {
        return prisma.calculator.findMany({
            where: { isActive: true },
            include: { category: true },
            orderBy: { categoryId: 'asc' },
        });
    }

    static async listCategories() {
        return prisma.calculatorCategory.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }

    static async getById(id: string) {
        return prisma.calculator.findUnique({
            where: { id },
            include: { category: true },
        });
    }

    static async listScales() {
        return prisma.clinicalScale.findMany({
            where: { isActive: true },
            orderBy: { shortName: 'asc' },
        });
    }
}
