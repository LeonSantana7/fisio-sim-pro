import type { FastifyInstance } from 'fastify';
import { ProtocolController } from '../controllers/ProtocolController.js';

export async function protocolsRoutes(app: FastifyInstance) {
    app.get('/', ProtocolController.listAll);
    app.get('/:id', ProtocolController.getById);
}
