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
    static async listByDevice(req: FastifyRequest<{ Querystring: { deviceKey: string; limit?: string } }>, reply: FastifyReply) {
        const { deviceKey, limit } = req.query;
        if (!deviceKey) return reply.code(400).send({ error: 'deviceKey é obrigatório' });

        const { history, total } = await HistoryService.listByDevice(deviceKey, Number(limit));
        return reply.send({ data: history, total });
    }

    static async add(req: FastifyRequest, reply: FastifyReply) {
        const parsed = AddHistoryBody.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

        const userAgent = req.headers['user-agent'];
        const record = await HistoryService.add(parsed.data, userAgent);
        return reply.code(201).send({ data: record });
    }

    static async getTopUsed(req: FastifyRequest, reply: FastifyReply) {
        const top = await HistoryService.getTopUsed();
        return reply.send({ data: top });
    }

    static async clearDeviceHistory(req: FastifyRequest<{ Querystring: { deviceKey: string } }>, reply: FastifyReply) {
        const { deviceKey } = req.query;
        if (!deviceKey) return reply.code(400).send({ error: 'deviceKey é obrigatório' });

        try {
            const deleted = await HistoryService.clearDeviceHistory(deviceKey);
            return reply.send({ deleted });
        } catch {
            return reply.code(404).send({ error: 'Dispositivo não encontrado' });
        }
    }
}
