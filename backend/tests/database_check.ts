import { prisma } from '../src/lib/prisma.js';

async function runDatabaseCheck() {
    console.log('🔍 [TEST] Iniciando diagnóstico de Banco de Dados...');
    try {
        const dbInfo: any = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
        console.log('✅ Conexão estabelecida:', dbInfo);

        console.log('\n📊 Verificando contagem de registros:');

        // Removendo aspas e schema explícito para deixar o search_path do PostgreSQL resolver (padrão public)
        const calculators = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) FROM calculator`);
        console.log(`  - Calculadoras         : ${calculators[0].count} registros`);

        const protocols = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) FROM protocol`);
        console.log(`  - Protocolos          : ${protocols[0].count} registros`);

        const scenarios = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) FROM ventscenario`);
        console.log(`  - Cenários Simulador  : ${scenarios[0].count} registros`);

        console.log('\n✨ Diagnóstico concluído com sucesso!');
    } catch (err) {
        console.error('\n❌ ERRO NO DIAGNÓSTICO:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runDatabaseCheck();
