import type { Calculator, CalculatorResult } from '../types/calculators';

// ── AUXILIARES ────────────────────────────────────────────────────
function level(val: number, thresholds: [number, string][]): CalculatorResult['level'] {
    for (const [t, l] of thresholds) {
        if (val <= t) return l as CalculatorResult['level'];
    }
    return thresholds[thresholds.length - 1][1] as CalculatorResult['level'];
}

// ── CALCULADORAS ──────────────────────────────────────────────────
export const calculators: Calculator[] = [

    // ─ 1. P/F RATIO ────────────────────────────────────────────────
    {
        id: 'pf_ratio',
        name: 'Relação P/F (PaO₂/FiO₂)',
        shortName: 'P/F Ratio',
        category: 'oxigenacao',
        description: 'Índice de oxigenação para classificar hipoxemia e SDRA (Critérios de Berlim).',
        icon: '🫀',
        formula: 'P/F = PaO₂ ÷ FiO₂',
        fields: [
            { key: 'pao2', label: 'PaO₂', unit: 'mmHg', type: 'number', defaultValue: 80, min: 10, max: 600, step: 1, hint: 'Pressão parcial de O₂ — gasometria arterial' },
            { key: 'fio2', label: 'FiO₂', unit: '%', type: 'number', defaultValue: 40, min: 21, max: 100, step: 1, hint: 'Fração Inspirada de O₂ em porcentagem (ex: 40 = 0,40)' },
        ],
        calculate: (i) => {
            const pf = i.pao2 / (i.fio2 / 100);
            const interp =
                pf > 300 ? 'Normal (sem hipoxemia significativa)' :
                    pf > 200 ? 'SDRA Leve (PF 200–300)' :
                        pf > 100 ? 'SDRA Moderada (PF 100–200)' :
                            'SDRA Grave (PF ≤ 100)';
            return {
                value: Math.round(pf),
                unit: 'mmHg',
                interpretation: interp,
                level: pf > 300 ? 'normal' : pf > 200 ? 'mild' : pf > 100 ? 'moderate' : 'severe',
            };
        },
        references: ['ARDS Definition Task Force, JAMA 2012'],
    },

    // ─ 2. PaO₂ IDEAL ───────────────────────────────────────────────
    {
        id: 'pao2_ideal',
        name: 'PaO₂ Ideal / Esperada',
        shortName: 'PaO₂ Ideal',
        category: 'oxigenacao',
        description: 'Estima a PaO₂ esperada com base no FiO₂ e na pressão barométrica local.',
        icon: '💨',
        formula: 'PaO₂ ideal = (Pb − 47) × FiO₂ − PaCO₂ / 0,8',
        fields: [
            { key: 'fio2', label: 'FiO₂', unit: '%', type: 'number', defaultValue: 40, min: 21, max: 100, step: 1 },
            { key: 'paco2', label: 'PaCO₂', unit: 'mmHg', type: 'number', defaultValue: 40, min: 10, max: 120, step: 1 },
            { key: 'pb', label: 'Pressão barométrica', unit: 'mmHg', type: 'number', defaultValue: 760, min: 500, max: 800, step: 1, hint: 'Nível do mar ≈ 760 mmHg; São Paulo ≈ 706 mmHg' },
        ],
        calculate: (i) => {
            const pao2_ideal = (i.pb - 47) * (i.fio2 / 100) - i.paco2 / 0.8;
            return {
                value: Math.round(pao2_ideal * 10) / 10,
                unit: 'mmHg',
                interpretation: `PaO₂ esperada para FiO₂ ${i.fio2}% a ${i.pb} mmHg barométrica.`,
                level: 'normal',
            };
        },
    },

    // ─ 3. FiO₂ IDEAL ──────────────────────────────────────────────
    {
        id: 'fio2_ideal',
        name: 'FiO₂ Ideal para meta SpO₂',
        shortName: 'FiO₂ Ideal',
        category: 'oxigenacao',
        description: 'Estima o FiO₂ necessário para atingir uma PaO₂ alvo com base na relação P/F atual.',
        icon: '🎯',
        formula: 'FiO₂ alvo = PaO₂ alvo ÷ (P/F atual)',
        fields: [
            { key: 'pao2_atual', label: 'PaO₂ atual', unit: 'mmHg', type: 'number', defaultValue: 75, min: 20, max: 500, step: 1 },
            { key: 'fio2_atual', label: 'FiO₂ atual', unit: '%', type: 'number', defaultValue: 50, min: 21, max: 100, step: 1 },
            { key: 'pao2_alvo', label: 'PaO₂ alvo', unit: 'mmHg', type: 'number', defaultValue: 90, min: 50, max: 200, step: 1 },
        ],
        calculate: (i) => {
            const pf = i.pao2_atual / (i.fio2_atual / 100);
            const fio2_alvo_decimal = i.pao2_alvo / pf;
            const fio2_pct = Math.min(100, Math.round(fio2_alvo_decimal * 100));
            return {
                value: fio2_pct,
                unit: '%',
                interpretation: `Para atingir PaO₂ ${i.pao2_alvo} mmHg, ajustar FiO₂ para ${fio2_pct}%. P/F atual: ${Math.round(pf)}.`,
                level: fio2_pct <= 60 ? 'normal' : fio2_pct <= 80 ? 'moderate' : 'severe',
            };
        },
    },

    // ─ 4. PESO PREDITO (PBW) ─────────────────────────────────────
    {
        id: 'pbw',
        name: 'Peso Corporal Predito (PBW)',
        shortName: 'Peso Predito',
        category: 'ventilacao',
        description: 'Base para cálculo do Volume Corrente em Ventilação Protetora (6 mL/kg PBW).',
        icon: '⚖️',
        formula: '♂ PBW = 50 + 0,91 × (altura − 152,4)\n♀ PBW = 45,5 + 0,91 × (altura − 152,4)',
        fields: [
            { key: 'altura', label: 'Altura', unit: 'cm', type: 'number', defaultValue: 170, min: 140, max: 220, step: 1 },
            { key: 'sexo', label: 'Sexo', type: 'select', defaultValue: 1, options: [{ value: 1, label: '♂ Masculino' }, { value: 0, label: '♀ Feminino' }] },
        ],
        calculate: (i) => {
            const pbw = i.sexo === 1
                ? 50 + 0.91 * (i.altura - 152.4)
                : 45.5 + 0.91 * (i.altura - 152.4);
            const vt6 = Math.round(pbw * 6);
            const vt8 = Math.round(pbw * 8);
            return {
                value: Math.round(pbw * 10) / 10,
                unit: 'kg',
                interpretation: `VT protetor (6 mL/kg): ${vt6} mL | Máximo (8 mL/kg): ${vt8} mL`,
                level: 'normal',
                extra: { 'VT 6 mL/kg': `${vt6} mL`, 'VT 8 mL/kg': `${vt8} mL` },
            };
        },
        references: ['ARDSNet, NEJM 2000'],
    },

    // ─ 5. GRADIENTE ALVÉOLO-ARTERIAL ─────────────────────────────
    {
        id: 'gradiente_aa',
        name: 'Gradiente Alvéolo-Arterial (A-a)',
        shortName: 'Gradiente A-a O₂',
        category: 'oxigenacao',
        description: 'Diferença entre a pressão alveolar e arterial de O₂. Aumentado na SDRA, pneumonia, TEP.',
        icon: '📐',
        formula: 'PAO₂ = (Pb−47) × FiO₂ − PaCO₂/0,8\nGradiente A-a = PAO₂ − PaO₂',
        fields: [
            { key: 'pao2', label: 'PaO₂', unit: 'mmHg', type: 'number', defaultValue: 75, min: 20, max: 500, step: 1 },
            { key: 'paco2', label: 'PaCO₂', unit: 'mmHg', type: 'number', defaultValue: 40, min: 10, max: 120, step: 1 },
            { key: 'fio2', label: 'FiO₂', unit: '%', type: 'number', defaultValue: 21, min: 21, max: 100, step: 1 },
            { key: 'pb', label: 'Pressão barométrica', unit: 'mmHg', type: 'number', defaultValue: 760, min: 500, max: 800, step: 1 },
            { key: 'idade', label: 'Idade', unit: 'anos', type: 'number', defaultValue: 50, min: 18, max: 100, step: 1 },
        ],
        calculate: (i) => {
            const pao2_alv = (i.pb - 47) * (i.fio2 / 100) - i.paco2 / 0.8;
            const gradiente = pao2_alv - i.pao2;
            const normal_esperado = 2.5 + (0.21 * i.idade);
            const isAlterado = gradiente > normal_esperado;
            return {
                value: Math.round(gradiente * 10) / 10,
                unit: 'mmHg',
                interpretation: `${isAlterado ? '⚠️ Aumentado' : '✅ Normal'} para a idade. Normal esperado ≤ ${Math.round(normal_esperado)} mmHg (${i.idade} anos).`,
                level: gradiente <= normal_esperado ? 'normal' : gradiente < 30 ? 'mild' : gradiente < 60 ? 'moderate' : 'severe',
                extra: { 'PAO₂ alveolar': `${Math.round(pao2_alv)} mmHg`, 'Normal esperado': `≤ ${Math.round(normal_esperado)} mmHg` },
            };
        },
    },

    // ─ 6. ÍNDICE DE TOBIN (IRRS) ──────────────────────────────────
    {
        id: 'tobin',
        name: 'Índice de Tobin (IRRS)',
        shortName: 'Índice de Tobin',
        category: 'desmame',
        description: 'Índice de Respiração Rápida e Superficial. Preditor de sucesso/falha no desmame ventilatório.',
        icon: '📊',
        formula: 'IRRS = FR ÷ VT (em litros)',
        fields: [
            { key: 'fr', label: 'Frequência Respiratória', unit: 'irpm', type: 'number', defaultValue: 20, min: 5, max: 60, step: 1 },
            { key: 'vt_ml', label: 'Volume Corrente', unit: 'mL', type: 'number', defaultValue: 400, min: 50, max: 1200, step: 10 },
        ],
        calculate: (i) => {
            const irrs = i.fr / (i.vt_ml / 1000);
            return {
                value: Math.round(irrs * 10) / 10,
                unit: 'irpm/L',
                interpretation:
                    irrs < 80 ? '✅ Sucesso provável no desmame (IRRS < 80)' :
                        irrs < 105 ? '⚠️ Zona cinza — avaliar com cautela (80–105)' :
                            '❌ Falha provável no desmame (IRRS ≥ 105)',
                level: irrs < 80 ? 'normal' : irrs < 105 ? 'mild' : 'severe',
            };
        },
        references: ['Tobin & Yang, NEJM 1991'],
    },

    // ─ 7. COMPLACÊNCIA ESTÁTICA ──────────────────────────────────
    {
        id: 'complacencia',
        name: 'Complacência Estática (Cst)',
        shortName: 'Complacência',
        category: 'mecanica',
        description: 'Mede a distensibilidade do sistema respiratório. Reduzida na SDRA.',
        icon: '🔧',
        formula: 'Cst = VT ÷ (P_plat − PEEP)',
        fields: [
            { key: 'vt_ml', label: 'Volume Corrente', unit: 'mL', type: 'number', defaultValue: 450, min: 100, max: 1000, step: 10 },
            { key: 'p_plat', label: 'Pressão de Platô', unit: 'cmH₂O', type: 'number', defaultValue: 20, min: 5, max: 50, step: 1 },
            { key: 'peep', label: 'PEEP', unit: 'cmH₂O', type: 'number', defaultValue: 5, min: 0, max: 20, step: 1 },
        ],
        calculate: (i) => {
            const cst = i.vt_ml / (i.p_plat - i.peep);
            const interp =
                cst >= 60 ? '✅ Normal (≥ 60 mL/cmH₂O)' :
                    cst >= 40 ? '⚠️ Levemente reduzida (40–60)' :
                        cst >= 25 ? '⚠️ Moderadamente reduzida — atenção SDRA' :
                            '❌ Gravemente reduzida (< 25) — SDRA grave';
            return {
                value: Math.round(cst * 10) / 10,
                unit: 'mL/cmH₂O',
                interpretation: interp,
                level: cst >= 60 ? 'normal' : cst >= 40 ? 'mild' : cst >= 25 ? 'moderate' : 'severe',
            };
        },
    },

    // ─ 8. DRIVING PRESSURE ────────────────────────────────────────
    {
        id: 'driving',
        name: 'Driving Pressure (Pressão de Distensão)',
        shortName: 'Driving Pressure',
        category: 'mecanica',
        description: 'Pressão de distensão pulmonar. Associada independentemente à mortalidade na SDRA (Amato 2015).',
        icon: '💥',
        formula: 'ΔP = P_platô − PEEP',
        fields: [
            { key: 'p_plat', label: 'Pressão de Platô', unit: 'cmH₂O', type: 'number', defaultValue: 20, min: 5, max: 50, step: 1 },
            { key: 'peep', label: 'PEEP', unit: 'cmH₂O', type: 'number', defaultValue: 5, min: 0, max: 20, step: 1 },
        ],
        calculate: (i) => {
            const dp = i.p_plat - i.peep;
            return {
                value: dp,
                unit: 'cmH₂O',
                interpretation:
                    dp <= 13 ? '✅ Ótimo — baixo risco de dano (≤ 13 cmH₂O)' :
                        dp <= 15 ? '🟡 Aceitável, próximo ao limite (13–15)' :
                            '🔴 Elevado — associado a maior mortalidade em SDRA (> 15)',
                level: dp <= 13 ? 'normal' : dp <= 15 ? 'mild' : 'severe',
            };
        },
        references: ['Amato et al., NEJM 2015'],
    },

    // ─ 9. GASOMETRIA + ÂNION GAP ─────────────────────────────────
    {
        id: 'gasometria',
        name: 'Gasometria Arterial + Ânion Gap',
        shortName: 'Gasometria',
        category: 'gasometria',
        description: 'Interpretação de pH, PaO₂, PaCO₂ e cálculo do Ânion Gap para SDRA e acidose metabólica.',
        icon: '🩸',
        formula: 'Ânion Gap = Na⁺ − (Cl⁻ + HCO₃⁻)',
        fields: [
            { key: 'ph', label: 'pH', unit: '', type: 'number', defaultValue: 7.40, min: 6.8, max: 7.8, step: 0.01 },
            { key: 'pao2', label: 'PaO₂', unit: 'mmHg', type: 'number', defaultValue: 90, min: 20, max: 600, step: 1 },
            { key: 'paco2', label: 'PaCO₂', unit: 'mmHg', type: 'number', defaultValue: 40, min: 10, max: 120, step: 1 },
            { key: 'hco3', label: 'HCO₃⁻', unit: 'mEq/L', type: 'number', defaultValue: 24, min: 5, max: 50, step: 0.5 },
            { key: 'na', label: 'Na⁺', unit: 'mEq/L', type: 'number', defaultValue: 140, min: 110, max: 170, step: 1 },
            { key: 'cl', label: 'Cl⁻', unit: 'mEq/L', type: 'number', defaultValue: 105, min: 80, max: 140, step: 1 },
        ],
        calculate: (i) => {
            const ag = i.na - (i.cl + i.hco3);
            const phStatus = i.ph < 7.35 ? '🔴 Acidemia' : i.ph > 7.45 ? '🔵 Alcalemia' : '✅ Normal';
            const paco2Status = i.paco2 < 35 ? 'Hipocapnia' : i.paco2 > 45 ? 'Hipercapnia' : 'Normal';
            const hco3Status = i.hco3 < 22 ? 'Baixo' : i.hco3 > 26 ? 'Alto' : 'Normal';
            const agStatus = ag > 12 ? `🔴 Elevado (> 12) — Acidose c/ AG` : '✅ Normal (< 12)';
            const pao2Status = i.pao2 < 60 ? '🔴 Hipoxemia grave' : i.pao2 < 80 ? '🟡 Hipoxemia moderada' : '✅ Normal';
            const disturbio =
                i.ph < 7.35 && i.paco2 > 45 ? 'Acidose Respiratória' :
                    i.ph < 7.35 && i.hco3 < 22 ? 'Acidose Metabólica' :
                        i.ph > 7.45 && i.paco2 < 35 ? 'Alcalose Respiratória' :
                            i.ph > 7.45 && i.hco3 > 26 ? 'Alcalose Metabólica' :
                                'Gasometria normal / distúrbio misto';
            return {
                value: Math.round(ag * 10) / 10,
                unit: 'mEq/L (AG)',
                interpretation: `${disturbio} | pH: ${phStatus} | PaCO₂: ${paco2Status} | HCO₃: ${hco3Status} | Ânion Gap: ${agStatus} | PaO₂: ${pao2Status}`,
                level: i.ph >= 7.35 && i.ph <= 7.45 ? 'normal' : 'moderate',
                extra: {
                    'Distúrbio': disturbio, 'Ânion Gap': `${Math.round(ag)} mEq/L`,
                    'pH': `${i.ph} (${phStatus})`, 'PaO₂': `${i.pao2} mmHg (${pao2Status})`,
                },
            };
        },
    },

    // ─ 10. ÍNDICE ROX ─────────────────────────────────────────────
    {
        id: 'rox',
        name: 'Índice ROX',
        shortName: 'Índice ROX',
        category: 'desmame',
        description: 'Preditor de falha na terapia de alto fluxo nasal (HFNO). ROX < 4,88 = alto risco de intubação.',
        icon: '📉',
        formula: 'ROX = (SpO₂ / FiO₂) ÷ FR',
        fields: [
            { key: 'spo2', label: 'SpO₂', unit: '%', type: 'number', defaultValue: 95, min: 60, max: 100, step: 1 },
            { key: 'fio2', label: 'FiO₂', unit: '%', type: 'number', defaultValue: 40, min: 21, max: 100, step: 1 },
            { key: 'fr', label: 'Frequência Respiratória', unit: 'irpm', type: 'number', defaultValue: 22, min: 5, max: 60, step: 1 },
        ],
        calculate: (i) => {
            const rox = (i.spo2 / (i.fio2 / 100)) / i.fr;
            return {
                value: Math.round(rox * 100) / 100,
                unit: '',
                interpretation:
                    rox >= 4.88 ? '✅ Baixo risco de intubação (ROX ≥ 4,88 às 2h, 6h e 12h)' :
                        '🔴 ALTO RISCO de falha do HFNO + intubação (ROX < 4,88)',
                level: rox >= 4.88 ? 'normal' : rox >= 3.5 ? 'moderate' : 'critical',
            };
        },
        references: ['Roca et al., Am J Respir Crit Care Med 2019'],
    },

    // ─ 11. RECRUTABILIDADE PULMONAR ──────────────────────────────
    {
        id: 'recrutabilidade',
        name: 'Recrutabilidade Pulmonar',
        shortName: 'Recrutabilidade',
        category: 'mecanica',
        description: 'Avalia resposta ao aumento de PEEP pela melhora da complacência estática.',
        icon: '🔄',
        formula: 'ΔCst = Cst(PEEP alto) − Cst(PEEP baixo)\nRecrutabilidade se ΔCst > 0',
        fields: [
            { key: 'vt', label: 'Volume Corrente (fixo)', unit: 'mL', type: 'number', defaultValue: 450, min: 100, max: 1000, step: 10 },
            { key: 'pplat_baixo', label: 'P_platô com PEEP baixo', unit: 'cmH₂O', type: 'number', defaultValue: 24, min: 5, max: 50, step: 1 },
            { key: 'peep_baixo', label: 'PEEP baixo', unit: 'cmH₂O', type: 'number', defaultValue: 5, min: 0, max: 20, step: 1 },
            { key: 'pplat_alto', label: 'P_platô com PEEP alto', unit: 'cmH₂O', type: 'number', defaultValue: 28, min: 5, max: 50, step: 1 },
            { key: 'peep_alto', label: 'PEEP alto', unit: 'cmH₂O', type: 'number', defaultValue: 15, min: 0, max: 25, step: 1 },
        ],
        calculate: (i) => {
            const cst_baixo = i.vt / (i.pplat_baixo - i.peep_baixo);
            const cst_alto = i.vt / (i.pplat_alto - i.peep_alto);
            const delta = cst_alto - cst_baixo;
            return {
                value: Math.round(delta * 10) / 10,
                unit: 'mL/cmH₂O (ΔCst)',
                interpretation:
                    delta > 0 ? `✅ Recrutável (ΔCst = +${delta.toFixed(1)}) — Cst melhorou com PEEP alto` :
                        delta === 0 ? '⚠️ Sem recrutamento adicional' :
                            `❌ Não recrutável (ΔCst = ${delta.toFixed(1)}) — Cst piorou com PEEP alto, evitar PEEP elevado`,
                level: delta > 0 ? 'normal' : delta === 0 ? 'mild' : 'severe',
                extra: {
                    'Cst PEEP baixo': `${Math.round(cst_baixo * 10) / 10} mL/cmH₂O`,
                    'Cst PEEP alto': `${Math.round(cst_alto * 10) / 10} mL/cmH₂O`,
                },
            };
        },
    },
];

// ─ ESCALAS CLÍNICAS ────────────────────────────────────────────
export interface ClinicalScale {
    id: string;
    name: string;
    shortName: string;
    category: 'escalas';
    description: string;
    icon: string;
    groups: {
        name: string;
        key: string;
        items: { value: number; label: string; description?: string }[];
    }[];
    interpret: (total: number) => { text: string; level: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical' };
    scoringNote?: string;
}

export const clinicalScales: ClinicalScale[] = [
    // ─ GLASGOW ─────────────────────────────────────────────────────
    {
        id: 'glasgow',
        name: 'Escala de Coma de Glasgow (ECG)',
        shortName: 'Glasgow',
        category: 'escalas',
        description: 'Avalia nível de consciência. Pontuação de 3 a 15.',
        icon: '🧠',
        groups: [
            {
                name: 'Abertura Ocular (O)',
                key: 'ocular',
                items: [
                    { value: 4, label: 'Espontânea', description: 'Olhos abertos sem nenhum estímulo' },
                    { value: 3, label: 'À voz', description: 'Olhos abertos ao comando verbal' },
                    { value: 2, label: 'À dor', description: 'Olhos abertos apenas com estímulo doloroso' },
                    { value: 1, label: 'Nenhuma', description: 'Sem abertura ocular' },
                ],
            },
            {
                name: 'Resposta Verbal (V)',
                key: 'verbal',
                items: [
                    { value: 5, label: 'Orientado', description: 'Orientado em tempo, espaço e pessoa' },
                    { value: 4, label: 'Confuso', description: 'Confuso, mas com conversação' },
                    { value: 3, label: 'Palavras inapropriadas', description: 'Palavras aleatórias sem conversa' },
                    { value: 2, label: 'Sons incompreensíveis', description: 'Gemidos, gritos, sem palavras' },
                    { value: 1, label: 'Nenhuma', description: 'Sem resposta verbal' },
                ],
            },
            {
                name: 'Resposta Motora (M)',
                key: 'motora',
                items: [
                    { value: 6, label: 'Obedece ordens', description: 'Movimentos a comandos verbais' },
                    { value: 5, label: 'Localiza a dor', description: 'Tenta afastar o estímulo doloroso' },
                    { value: 4, label: 'Retirada inespecífica', description: 'Retirada ao estímulo sem localização' },
                    { value: 3, label: 'Flexão anormal', description: 'Decorticação — flexão estereotipada' },
                    { value: 2, label: 'Extensão anormal', description: 'Decerebração — extensão estereotipada' },
                    { value: 1, label: 'Nenhuma', description: 'Sem resposta motora' },
                ],
            },
        ],
        interpret: (total) => ({
            text: total >= 13 ? 'Leve (13–15)' : total >= 9 ? 'Moderado (9–12)' : `Grave (≤ 8) — intubação indicada se ≤ 8`,
            level: total >= 13 ? 'normal' : total >= 9 ? 'moderate' : 'critical',
        }),
    },
    // ─ RASS ────────────────────────────────────────────────────────
    {
        id: 'rass',
        name: 'Escala RASS (Richmond)',
        shortName: 'RASS',
        category: 'escalas',
        description: 'Avalia agitação e nível de sedação em UTI. Meta: RASS −1 a 0.',
        icon: '😴',
        groups: [
            {
                name: 'Nível de sedação/agitação',
                key: 'rass',
                items: [
                    { value: 4, label: '+4 Combativo', description: 'Violento, risco imediato à equipe' },
                    { value: 3, label: '+3 Muito agitado', description: 'Puxa ou remove tubos/cateteres' },
                    { value: 2, label: '+2 Agitado', description: 'Movimentos frequentes, luta com ventilador' },
                    { value: 1, label: '+1 Inquieto', description: 'Ansioso, movimentos não vigorosos' },
                    { value: 0, label: '0 Alerta e calmo', description: 'Alerta e calmo (Meta UTI habitual)' },
                    { value: -1, label: '−1 Sonolento', description: 'Não totalmente alerta, desperta à voz (> 10s)' },
                    { value: -2, label: '−2 Sedação leve', description: 'Abre olhos brevemente à voz (< 10s)' },
                    { value: -3, label: '−3 Sedação moderada', description: 'Movimento ou abertura ocular à voz, sem contato visual' },
                    { value: -4, label: '−4 Sedação profunda', description: 'Nenhuma resposta à voz, mas movimento à dor' },
                    { value: -5, label: '−5 Não despertável', description: 'Sem resposta à voz ou à dor' },
                ],
            },
        ],
        interpret: (total) => ({
            text:
                total >= 2 ? '🔴 Agitação — avaliar causa e ajustar sedação' :
                    total >= -1 ? '✅ Meta RASS atingida (0 a −1)' :
                        total >= -3 ? '🟡 Sedação — avaliar necessidade de redução' :
                            '🔴 Sedação profunda — alto risco de delirium e fraqueza',
            level: (total >= -1 && total <= 0) ? 'normal' : total < -3 ? 'critical' : 'moderate',
        }),
        scoringNote: 'Pontuação única (−5 a +4)',
    },
    // ─ mMRC ────────────────────────────────────────────────────────
    {
        id: 'mmrc',
        name: 'Escala mMRC de Dispneia',
        shortName: 'mMRC',
        category: 'escalas',
        description: 'Classifica a percepção de dispneia em graus de 0 a 4 (DPOC e doenças pulmonares).',
        icon: '🌬️',
        groups: [
            {
                name: 'Grau de dispneia',
                key: 'mmrc',
                items: [
                    { value: 0, label: 'Grau 0', description: 'Dispneia apenas com exercício extenuante' },
                    { value: 1, label: 'Grau 1', description: 'Dispneia ao subir escadas ou andar rápido' },
                    { value: 2, label: 'Grau 2', description: 'Anda mais devagar que pessoas da mesma idade por falta de ar' },
                    { value: 3, label: 'Grau 3', description: 'Para para respirar após andar ~100m ou poucos minutos' },
                    { value: 4, label: 'Grau 4', description: 'Dispneia intensa ao se vestir ou sair de casa' },
                ],
            },
        ],
        interpret: (total) => ({
            text: total <= 1 ? 'Leve' : total <= 2 ? 'Moderada' : 'Grave — indicativo para reabilitação pulmonar',
            level: total <= 1 ? 'normal' : total <= 2 ? 'moderate' : 'severe',
        }),
        scoringNote: 'Marcar o grau que melhor descreve o paciente',
    },
    // ─ MRC ─────────────────────────────────────────────────────────
    {
        id: 'mrc',
        name: 'Medical Research Council (MRC) — Força Muscular',
        shortName: 'MRC Força',
        category: 'escalas',
        description: 'Avalia força muscular nos 6 grupos musculares chave para diagnóstico de Fraqueza Adquirida na UTI.',
        icon: '💪',
        groups: [
            {
                name: 'Pontuação por grupo muscular (0–5 cada)',
                key: 'mrc',
                items: [
                    { value: 60, label: '60 — Força normal', description: 'Todos os grupos com força 5/5' },
                    { value: 48, label: '48 — Limite', description: 'Score limítrofe de fraqueza adquirida na UTI' },
                    { value: 36, label: '36 — Fraqueza moderada', description: 'Score médio de fraqueza adquirida' },
                    { value: 20, label: '20 — Fraqueza grave', description: 'Fraqueza muito grave, risco de desmame difícil' },
                ],
            },
        ],
        interpret: (total) => ({
            text: total >= 48 ? '✅ Sem fraqueza adquirida na UTI (≥ 48/60)' : `🔴 Fraqueza Adquirida na UTI (< 48/60) — total: ${total}/60`,
            level: total >= 48 ? 'normal' : total >= 36 ? 'moderate' : 'severe',
        }),
        scoringNote: 'Score total: 0–60 (6 grupos × 5). Insira o total diretamente.',
    },
];

export const calculatorCategories: Record<string, { label: string; color: string }> = {
    oxigenacao: { label: 'Oxigenação', color: '#38bdf8' },
    ventilacao: { label: 'Ventilação', color: '#4ade80' },
    mecanica: { label: 'Mecânica Pulmonar', color: '#f59e0b' },
    gasometria: { label: 'Gasometria', color: '#f87171' },
    desmame: { label: 'Desmame', color: '#a78bfa' },
    escalas: { label: 'Escalas Clínicas', color: '#fb923c' },
};
