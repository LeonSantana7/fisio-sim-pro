import type { FastifyReply, FastifyRequest } from 'fastify';
import { CalculatorService } from '../services/CalculatorService.js';

export class CalculatorController {
    static async listAll(req: FastifyRequest, reply: FastifyReply) {
        const calculators = await CalculatorService.listAll();
        return reply.send({ data: calculators, total: calculators.length });
    }

    static async listCategories(req: FastifyRequest, reply: FastifyReply) {
        const categories = await CalculatorService.listCategories();
        return reply.send({ data: categories });
    }

    static async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = req.params;
        const calc = await CalculatorService.getById(id);
        if (!calc) return reply.code(404).send({ error: 'Calculadora não encontrada' });
        return reply.send({ data: calc });
    }

    static async listScales(req: FastifyRequest, reply: FastifyReply) {
        const scales = await CalculatorService.listScales();
        return reply.send({ data: scales, total: scales.length });
    }
}
