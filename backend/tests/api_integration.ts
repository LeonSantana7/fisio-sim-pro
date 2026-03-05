import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function runApiIntegrationTests() {
    console.log('🚀 [TEST] Iniciando testes de integração da API...');

    const endpoints = [
        { path: '/health', name: 'Health Check' },
        { path: '/api/calculators', name: 'Calculadoras' },
        { path: '/api/calculators/categories', name: 'Categorias de Calculadoras' },
        { path: '/api/protocols', name: 'Protocolos' },
        { path: '/api/scenarios', name: 'Cenários do Simulador' },
    ];

    let successCount = 0;

    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 Testando: ${endpoint.name} (${endpoint.path})`);
            const response = await axios.get(`${API_URL}${endpoint.path}`);

            if (response.status === 200) {
                console.log(`  ✅ Status 200 OK`);
                const data = response.data;
                const count = data.total ?? data.data?.length ?? 'N/A';
                console.log(`  📦 Dados recebidos: ${count} itens`);
                successCount++;
            } else {
                console.error(`  ❌ Status inesperado: ${response.status}`);
            }
        } catch (err: any) {
            console.error(`  ❌ Erro ao acessar ${endpoint.path}: ${err.message}`);
        }
    }

    console.log(`\n🏁 Resultado Final: ${successCount}/${endpoints.length} testes passaram.`);

    if (successCount < endpoints.length) {
        console.error('⚠️ Alguns testes falharam. Verifique se o servidor está rodando (npm run dev).');
        process.exit(1);
    } else {
        console.log('🎊 Todos os testes de integração passaram!');
    }
}

runApiIntegrationTests();
