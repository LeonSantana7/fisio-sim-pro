import { prisma } from '../lib/prisma.js';
import { getOrCreateDevice } from '../lib/device.js';

export class FavoriteService {
    static async listByDevice(deviceKey: string) {
        const device = await prisma.device.findUnique({
            where: { deviceKey },
        });
        if (!device) return [];

        return prisma.favorite.findMany({
            where: { deviceId: device.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async add(deviceKey: string, toolId: string, toolType: 'calculator' | 'scale', userAgent?: string) {
        const device = await getOrCreateDevice(deviceKey, userAgent);

        const existing = await prisma.favorite.findFirst({
            where: { deviceId: device.id, toolId, toolType },
        });

        if (existing) return { data: existing, created: false };

        const favorite = await prisma.favorite.create({
            data: { deviceId: device.id, toolId, toolType },
        });

        return { data: favorite, created: true };
    }

    static async removeById(id: string) {
        return prisma.favorite.delete({ where: { id } });
    }

    static async removeByTool(deviceKey: string, toolId: string, toolType: string) {
        const device = await prisma.device.findUnique({ where: { deviceKey } });
        if (!device) throw new Error('Device not found');

        return prisma.favorite.deleteMany({
            where: { deviceId: device.id, toolId, toolType },
        });
    }
}
