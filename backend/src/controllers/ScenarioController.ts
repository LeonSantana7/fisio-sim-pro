import type { FastifyReply, FastifyRequest } from 'fastify';
import { ScenarioService } from '../services/ScenarioService.js';

export class ScenarioController {
    static async listAll(req: FastifyRequest, reply: FastifyReply) {
        const scenarios = await ScenarioService.listAll();
        return reply.send({ data: scenarios, total: scenarios.length });
    }

    static async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = req.params;
        const scenario = await ScenarioService.getById(id);
        if (!scenario) return reply.code(404).send({ error: 'Cenário não encontrado' });
        return reply.send({ data: scenario });
    }
}
