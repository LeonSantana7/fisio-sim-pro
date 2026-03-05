import { prisma } from '../src/lib/prisma.js';

async function inspectDb() {
    try {
        const info: any = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
        console.log('Contexto:', info);

        const tables: any = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('Tabelas no schema public:');
        console.table(tables);

    } catch (err: any) {
        console.error('Erro na inspeção:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

inspectDb();
