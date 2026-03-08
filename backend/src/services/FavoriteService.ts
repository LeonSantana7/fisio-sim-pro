import { prisma } from '../lib/prisma.js';
import { getOrCreateDevice } from '../lib/device.js';

export class FavoriteService {
    static async listByUserOrDevice(deviceKey: string, userId?: string) {
        let whereClause: any = {};

        if (userId) {
            whereClause = { userId };
        } else {
            const device = await prisma.device.findUnique({ where: { deviceKey } });
            if (!device) return [];
            whereClause = { deviceId: device.id, userId: null };
        }

        return prisma.favorite.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
    }

    static async addByUserOrDevice(deviceKey: string, toolId: string, toolType: 'calculator' | 'scale', userAgent?: string, userId?: string) {
        const device = await getOrCreateDevice(deviceKey, userAgent);
        let whereClause: any = userId ? { userId, toolId, toolType } : { deviceId: device.id, userId: null, toolId, toolType };

        const existing = await prisma.favorite.findFirst({
            where: whereClause,
        });

        if (existing) return { data: existing, created: false };

        const favorite = await prisma.favorite.create({
            data: {
                deviceId: device.id,
                userId: userId ?? null,
                toolId,
                toolType
            },
        });

        return { data: favorite, created: true };
    }

    static async removeById(id: string) {
        return prisma.favorite.delete({ where: { id } });
    }

    static async removeByToolAndUserOrDevice(deviceKey: string, toolId: string, toolType: string, userId?: string) {
        let whereClause: any = {};

        if (userId) {
            whereClause = { userId, toolId, toolType };
        } else {
            const device = await prisma.device.findUnique({ where: { deviceKey } });
            if (!device) throw new Error('Device not found');
            whereClause = { deviceId: device.id, userId: null, toolId, toolType };
        }

        return prisma.favorite.deleteMany({
            where: whereClause,
        });
    }
}
