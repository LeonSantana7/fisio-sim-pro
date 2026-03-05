import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

async function seedSupabase() {
    console.log('🌱 Iniciando Seed no Supabase...');
    const sqlPath = path.join(process.cwd(), '..', 'database', 'init.sql');

    if (!fs.existsSync(sqlPath)) {
        console.error('❌ init.sql não encontrado em:', sqlPath);
        return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Divide o SQL em comandos individuais para evitar problemas de execução em lote
    // O script init.sql usa ";" como terminador
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

    console.log(`📑 Executando ${commands.length} comandos SQL...`);

    let count = 0;
    for (const cmd of commands) {
        try {
            await prisma.$executeRawUnsafe(cmd);
            count++;
            if (count % 10 === 0) console.log(`  ✅ ${count} comandos executados...`);
        } catch (err: any) {
            // Ignora erros de "already exists" se o seed rodar mais de uma vez
            if (!err.message.includes('already exists')) {
                console.warn(`  ⚠️ Aviso no comando ${count + 1}:`, err.message.substring(0, 100));
            }
        }
    }

    console.log('✨ Seed concluído com sucesso!');
    await prisma.$disconnect();
}

seedSupabase();
