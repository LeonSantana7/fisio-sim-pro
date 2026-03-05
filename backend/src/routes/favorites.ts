import type { FastifyInstance } from 'fastify';
import { FavoriteController } from '../controllers/FavoriteController.js';

export async function favoritesRoutes(app: FastifyInstance) {
    app.get('/', FavoriteController.listByDevice);
    app.post('/', FavoriteController.add);
    app.delete('/:id', FavoriteController.removeById);
    app.delete('/by-tool', FavoriteController.removeByTool);
}
