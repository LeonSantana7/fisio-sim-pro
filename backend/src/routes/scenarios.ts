import type { FastifyInstance } from 'fastify';
import { ScenarioController } from '../controllers/ScenarioController.js';

export async function scenariosRoutes(app: FastifyInstance) {
    app.get('/', ScenarioController.listAll);
    app.get('/:id', ScenarioController.getById);
}
