import type { FastifyReply, FastifyRequest } from 'fastify';
import { ProtocolService } from '../services/ProtocolService.js';

export class ProtocolController {
    static async listAll(req: FastifyRequest, reply: FastifyReply) {
        const protocols = await ProtocolService.listAll();
        return reply.send({ data: protocols, total: protocols.length });
    }

    static async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = req.params;
        const protocol = await ProtocolService.getById(id);
        if (!protocol) return reply.code(404).send({ error: 'Protocolo não encontrado' });
        return reply.send({ data: protocol });
    }
}
