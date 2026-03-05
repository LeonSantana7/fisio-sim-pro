import { PrismaClient } from '@prisma/client';

async function testConnection() {
    console.log('--- TESTE DE CONEXÃO SUPABASE ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':****@'));
    console.log('DIRECT_URL:  ', process.env.DIRECT_URL?.replace(/:[^:]+@/, ':****@'));

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DIRECT_URL
            }
        },
        log: ['query', 'error', 'warn']
    });

    try {
        console.log('Conectando ao banco direto...');
        const result = await prisma.$queryRaw`SELECT 1 as connected`;
        console.log('Resultado:', result);
        console.log('✅ Conexão Direta: OK');
    } catch (err: any) {
        console.error('❌ Erro na Conexão Direta:', err.message);
        console.error('Código:', err.code);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
