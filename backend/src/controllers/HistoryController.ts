import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { HistoryService } from '../services/HistoryService.js';

const AddHistoryBody = z.object({
    deviceKey: z.string().min(1),
    toolId: z.string().min(1),
    toolType: z.enum(['calculator', 'scale']),
    inputValues: z.record(z.unknown()),
    resultValue: z.string(),
    resultUnit: z.string().optional(),
    resultLevel: z.string().optional(),
    interpretation: z.string().optional(),
});

export class HistoryController {
    static async listByUserOrDevice(req: FastifyRequest<{ Querystring: { deviceKey: string; limit?: string } }>, reply: FastifyReply) {
        const { deviceKey, limit } = req.query;
        if (!deviceKey) return reply.code(400).send({ error: 'deviceKey é obrigatório' });

        let userId: string | undefined;
        try {
            await req.jwtVerify();
            userId = (req.user as any)?.sub;
        } catch {
            // Not authenticated, fallback to deviceKey
        }

        const limitValue = limit ? parseInt(limit, 10) : 50;
        const { history, total } = await HistoryService.listByUserOrDevice(deviceKey, userId, limitValue);
        return reply.send({ data: history, total });
    }

    static async add(req: FastifyRequest, reply: FastifyReply) {
        const parsed = AddHistoryBody.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

        let userId: string | undefined;
        try {
            await req.jwtVerify();
            userId = (req.user as any).sub;
        } catch {
            // Not authenticated, proceed anonymously
        }

        const userAgent = req.headers['user-agent'];
        const record = await HistoryService.add(parsed.data, userAgent, userId);
        return reply.code(201).send({ data: record });
    }

    static async getTopUsed(req: FastifyRequest, reply: FastifyReply) {
        const top = await HistoryService.getTopUsed();
        return reply.send({ data: top });
    }

    static async clearByUserOrDevice(req: FastifyRequest<{ Querystring: { deviceKey: string } }>, reply: FastifyReply) {
        const { deviceKey } = req.query;
        if (!deviceKey) return reply.code(400).send({ error: 'deviceKey é obrigatório' });

        let userId: string | undefined;
        try {
            await req.jwtVerify();
            userId = (req.user as any)?.sub;
        } catch {
            // Not authenticated, fallback to deviceKey
        }

        try {
            const deleted = await HistoryService.clearByUserOrDevice(deviceKey, userId);
            return reply.send({ deleted });
        } catch {
            return reply.code(404).send({ error: 'Falha ao limpar histórico' });
        }
    }

    static async deleteById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = req.params;
        if (!id) return reply.code(400).send({ error: 'ID é obrigatório' });

        try {
            await HistoryService.deleteById(id);
            return reply.code(204).send();
        } catch {
            return reply.code(404).send({ error: 'Registro não encontrado' });
        }
    }
}
