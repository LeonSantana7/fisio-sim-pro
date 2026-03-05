import type { FastifyInstance } from 'fastify';
import { HistoryController } from '../controllers/HistoryController.js';

export async function historyRoutes(app: FastifyInstance) {
    app.get('/', HistoryController.listByDevice);
    app.get('/top', HistoryController.getTopUsed);
    app.post('/', HistoryController.add);
    app.delete('/', HistoryController.clearDeviceHistory);
    app.delete('/:id', HistoryController.deleteById);
}
