import type { FastifyInstance } from 'fastify';
import { CalculatorController } from '../controllers/CalculatorController.js';

export async function calculatorsRoutes(app: FastifyInstance) {
    app.get('/', CalculatorController.listAll);
    app.get('/categories', CalculatorController.listCategories);
    app.get('/:id', CalculatorController.getById);
    app.get('/scales/all', CalculatorController.listScales);
}
