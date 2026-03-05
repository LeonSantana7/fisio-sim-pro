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
    static async listByDevice(req: FastifyRequest<{ Querystring: { deviceKey: string } }>, reply: FastifyReply) {
        const { deviceKey } = req.query;
        if (!deviceKey) return reply.code(400).send({ error: 'deviceKey é obrigatório' });

        const favorites = await FavoriteService.listByDevice(deviceKey);
        return reply.send({ data: favorites, total: favorites.length });
    }

    static async add(req: FastifyRequest, reply: FastifyReply) {
        const parsed = AddFavoriteBody.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

        const { deviceKey, toolId, toolType } = parsed.data;
        const userAgent = req.headers['user-agent'];

        const result = await FavoriteService.add(deviceKey, toolId, toolType, userAgent);
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

    static async removeByTool(req: FastifyRequest<{ Querystring: { deviceKey: string; toolId: string; toolType: string } }>, reply: FastifyReply) {
        const { deviceKey, toolId, toolType } = req.query;
        if (!deviceKey || !toolId || !toolType)
            return reply.code(400).send({ error: 'deviceKey, toolId e toolType são obrigatórios' });

        try {
            await FavoriteService.removeByTool(deviceKey, toolId, toolType);
            return reply.code(204).send();
        } catch {
            return reply.code(404).send({ error: 'Dispositivo não encontrado' });
        }
    }
}
