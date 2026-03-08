import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export async function authRoutes(app: FastifyInstance) {
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
        const registerBodySchema = z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6),
            role: z.enum(['fisioterapeuta', 'estudante']).default('fisioterapeuta'),
        });

        const { name, email, password, role } = registerBodySchema.parse(request.body);

        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return reply.status(409).send({ error: 'E-mail já está em uso.' });
        }

        const passwordHash = await bcrypt.hash(password, 6);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
            },
        });

        const token = app.jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role });

        return reply.status(201).send({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    });

    app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
        const loginBodySchema = z.object({
            email: z.string().email(),
            password: z.string(),
        });

        const { email, password } = loginBodySchema.parse(request.body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.passwordHash) {
            return reply.status(401).send({ error: 'Credenciais inválidas.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return reply.status(401).send({ error: 'Credenciais inválidas.' });
        }

        const token = app.jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role });

        return reply.status(200).send({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    });

    app.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();

            // @ts-ignore
            const userId = request.user.sub;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, email: true, role: true, isActive: true },
            });

            if (!user) {
                return reply.status(404).send({ error: 'Usuário não encontrado.' });
            }

            return reply.send({ user });
        } catch (err) {
            return reply.status(401).send({ error: 'Não autenticado.' });
        }
    });
}
