import { prisma } from '../lib/prisma.js';
import { getOrCreateDevice } from '../lib/device.js';

export class HistoryService {
    static async listByDevice(deviceKey: string, limit: number = 20) {
        const device = await prisma.device.findUnique({ where: { deviceKey } });
        if (!device) return { history: [], total: 0 };

        const pageSize = Math.min(limit, 100);
        const [history, total] = await Promise.all([
            prisma.calculationHistory.findMany({
                where: { deviceId: device.id },
                orderBy: { calculatedAt: 'desc' },
                take: pageSize,
            }),
            prisma.calculationHistory.count({ where: { deviceId: device.id } }),
        ]);

        return { history, total };
    }

    static async add(data: any, userAgent?: string) {
        const { deviceKey, toolId, toolType, inputValues, resultValue, resultUnit, resultLevel, interpretation } = data;
        const device = await getOrCreateDevice(deviceKey, userAgent);

        return prisma.calculationHistory.create({
            data: {
                deviceId: device.id,
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

    static async clearDeviceHistory(deviceKey: string) {
        const device = await prisma.device.findUnique({ where: { deviceKey } });
        if (!device) throw new Error('Device not found');

        const { count } = await prisma.calculationHistory.deleteMany({
            where: { deviceId: device.id },
        });
        return count;
    }

    static async deleteById(id: string) {
        return prisma.calculationHistory.delete({
            where: { id },
        });
    }
}
