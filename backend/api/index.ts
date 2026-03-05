import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

import { calculatorsRoutes } from '../src/routes/calculators.js';
import { protocolsRoutes } from '../src/routes/protocols.js';
import { scenariosRoutes } from '../src/routes/scenarios.js';
import { favoritesRoutes } from '../src/routes/favorites.js';
import { historyRoutes } from '../src/routes/history.js';
import { prisma } from '../src/lib/prisma.js';

const app = Fastify({
    logger: true,
});

// ─── Plugins ─────────────────────────────────────────────────────
const origins = (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map(s => s.trim());

await app.register(cors, {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-key'],
    credentials: true,
});

await app.register(sensible);

// ─── Health check ─────────────────────────────────────────────────
app.get('/health', async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', db: 'connected', timestamp: new Date().toISOString() };
    } catch {
        return { status: 'degraded', db: 'disconnected', timestamp: new Date().toISOString() };
    }
});

// ─── Rotas da API ─────────────────────────────────────────────────
await app.register(calculatorsRoutes, { prefix: '/api/calculators' });
await app.register(protocolsRoutes, { prefix: '/api/protocols' });
await app.register(scenariosRoutes, { prefix: '/api/scenarios' });
await app.register(favoritesRoutes, { prefix: '/api/favorites' });
await app.register(historyRoutes, { prefix: '/api/history' });

export default async (req: any, res: any) => {
    await app.ready();
    app.server.emit('request', req, res);
};
