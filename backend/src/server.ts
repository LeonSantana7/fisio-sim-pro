import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

import { calculatorsRoutes } from './routes/calculators.js';
import { protocolsRoutes } from './routes/protocols.js';
import { scenariosRoutes } from './routes/scenarios.js';
import { favoritesRoutes } from './routes/favorites.js';
import { historyRoutes } from './routes/history.js';
import { prisma } from './lib/prisma.js';

const app = Fastify({
    logger: {
        level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
        transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    },
});

// ─── Plugins ─────────────────────────────────────────────────────
const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
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

// ─── 404 global ──────────────────────────────────────────────────
app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ error: 'Rota não encontrada' });
});

// ─── Erro global ─────────────────────────────────────────────────
app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    reply.code(err.statusCode ?? 500).send({
        error: err.message ?? 'Erro interno do servidor',
    });
});

// ─── Start ────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';

try {
    await app.listen({ port, host });
    console.log(`\n🚀 FisioSim API rodando em http://localhost:${port}`);
    console.log(`❤️  Health: http://localhost:${port}/health`);
    console.log(`📊 Calculadoras: http://localhost:${port}/api/calculators`);
    console.log(`📋 Protocolos: http://localhost:${port}/api/protocols`);
    console.log(`🫁 Cenários: http://localhost:${port}/api/scenarios\n`);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}
