import { prisma } from '../lib/prisma.js';
import { getOrCreateDevice } from '../lib/device.js';

export class HistoryService {
    static async listByUserOrDevice(deviceKey: string, userId?: string, limit: number = 20) {
        let whereClause: any = {};

        if (userId) {
            whereClause = { userId };
        } else {
            const device = await prisma.device.findUnique({ where: { deviceKey } });
            if (!device) return { history: [], total: 0 };
            whereClause = { deviceId: device.id, userId: null };
        }

        const [history, total] = await Promise.all([
            prisma.calculationHistory.findMany({
                where: whereClause,
                orderBy: { calculatedAt: 'desc' },
                take: limit,
            }),
            prisma.calculationHistory.count({ where: whereClause }),
        ]);

        return { history, total };
    }

    static async add(data: any, userAgent?: string, userId?: string) {
        const { deviceKey, toolId, toolType, inputValues, resultValue, resultUnit, resultLevel, interpretation } = data;
        const device = await getOrCreateDevice(deviceKey, userAgent);

        return prisma.calculationHistory.create({
            data: {
                deviceId: device.id,
                userId: userId ?? null,
                toolId,
                toolType,
                inputValues: inputValues as object,
                resultValue,
                resultUnit: resultUnit ?? null,
                resultLevel: resultLevel ?? null,
                interpretation: interpretation ?? null,
            },
        });
    }

    static async getTopUsed() {
        return prisma.calculationHistory.groupBy({
            by: ['toolId', 'toolType'],
            _count: { _all: true },
            orderBy: { _count: { toolId: 'desc' } },
            take: 10,
        });
    }

    static async clearByUserOrDevice(deviceKey: string, userId?: string) {
        let whereClause: any = {};

        if (userId) {
            whereClause = { userId };
        } else {
            const device = await prisma.device.findUnique({ where: { deviceKey } });
            if (!device) throw new Error('Device not found');
            whereClause = { deviceId: device.id, userId: null };
        }

        const { count } = await prisma.calculationHistory.deleteMany({
            where: whereClause,
        });
        return count;
    }

    static async deleteById(id: string) {
        return prisma.calculationHistory.delete({
            where: { id },
        });
    }
}
