import { prisma } from './prisma.js';

/**
 * Obtém ou cria um Device pelo device_key (gerado no browser).
 * Atualiza o last_seen sempre que o dispositivo acessa a API.
 */
export async function getOrCreateDevice(deviceKey: string, userAgent?: string) {
    const device = await prisma.device.upsert({
        where: { deviceKey },
        update: { lastSeen: new Date(), userAgent: userAgent ?? undefined },
        create: { deviceKey, userAgent: userAgent ?? undefined },
    });
    return device;
}
