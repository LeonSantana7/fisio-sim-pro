import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { FavoriteService } from '../services/FavoriteService.js';

const AddFavoriteBody = z.object({
    deviceKey: z.string().min(1),
    toolId: z.string().min(1),
    toolType: z.enum(['calculator', 'scale']),
});

const RemoveFavoriteParams = z.object({
    id: z.string().uuid(),
});

export class FavoriteController {
    static async listByUserOrDevice(req: FastifyRequest<{ Querystring: { deviceKey: string } }>, reply: FastifyReply) {
        const { deviceKey } = req.query;
        if (!deviceKey) return reply.code(400).send({ error: 'deviceKey é obrigatório' });

        let userId: string | undefined;
        try {
            await req.jwtVerify();
            userId = (req.user as any)?.sub;
        } catch {
            // Not authenticated, fallback
        }

        const favorites = await FavoriteService.listByUserOrDevice(deviceKey, userId);
        return reply.send({ data: favorites, total: favorites.length });
    }

    static async add(req: FastifyRequest, reply: FastifyReply) {
        const parsed = AddFavoriteBody.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

        let userId: string | undefined;
        try {
            await req.jwtVerify();
            userId = (req.user as any)?.sub;
        } catch { }

        const { deviceKey, toolId, toolType } = parsed.data;
        const userAgent = req.headers['user-agent'];

        const result = await FavoriteService.addByUserOrDevice(deviceKey, toolId, toolType, userAgent, userId);
        return reply.code(result.created ? 201 : 200).send(result);
    }

    static async removeById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const parsed = RemoveFavoriteParams.safeParse(req.params);
        if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });

        try {
            await FavoriteService.removeById(parsed.data.id);
            return reply.code(204).send();
        } catch {
            return reply.code(404).send({ error: 'Favorito não encontrado' });
        }
    }

    static async removeByToolAndUserOrDevice(req: FastifyRequest<{ Querystring: { deviceKey: string; toolId: string; toolType: string } }>, reply: FastifyReply) {
        const { deviceKey, toolId, toolType } = req.query;
        if (!deviceKey || !toolId || !toolType)
            return reply.code(400).send({ error: 'deviceKey, toolId e toolType são obrigatórios' });

        let userId: string | undefined;
        try {
            await req.jwtVerify();
            userId = (req.user as any)?.sub;
        } catch { }

        try {
            await FavoriteService.removeByToolAndUserOrDevice(deviceKey, toolId, toolType, userId);
            return reply.code(204).send();
        } catch {
            return reply.code(404).send({ error: 'Dispositivo ou favorito não encontrado' });
        }
    }

    static async toggle(req: FastifyRequest, reply: FastifyReply) {
        const parsed = AddFavoriteBody.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

        let userId: string | undefined;
        try {
            await req.jwtVerify();
            userId = (req.user as any)?.sub;
        } catch { }

        const { deviceKey, toolId, toolType } = parsed.data;
        const favorites = await FavoriteService.listByUserOrDevice(deviceKey, userId);
        const existing = favorites.find(f => f.toolId === toolId);

        if (existing) {
            await FavoriteService.removeById(existing.id);
            return reply.send({ data: { removed: true, toolId } });
        } else {
            const userAgent = req.headers['user-agent'];
            const record = await FavoriteService.addByUserOrDevice(deviceKey, toolId, toolType, userAgent, userId);
            return reply.code(201).send({ data: { ...record, success: true } });
        }
    }
}
