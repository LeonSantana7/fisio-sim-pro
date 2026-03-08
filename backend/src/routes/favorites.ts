import type { FastifyInstance } from 'fastify';
import { FavoriteController } from '../controllers/FavoriteController.js';

export async function favoritesRoutes(app: FastifyInstance) {
    app.get('/', FavoriteController.listByUserOrDevice);
    app.post('/', FavoriteController.add);
    app.post('/toggle', FavoriteController.toggle);
    app.delete('/:id', FavoriteController.removeById);
    app.delete('/by-tool', FavoriteController.removeByToolAndUserOrDevice);
}
