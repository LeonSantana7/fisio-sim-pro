import type { Calculator } from '../types/calculators';



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
            const phStatus = i.ph < 7.35 ? 'Acidemia' : i.ph > 7.45 ? 'Alcalemia' : 'Normal';

            let disturbio = 'Normal';
            let compensacao = '';

            if (i.ph < 7.35) { // Acidose
                if (i.paco2 > 45 && i.hco3 >= 22) {
                    disturbio = 'Acidose Respiratória';
                    const hco3_esperado = 24 + (i.paco2 - 40) / 10;
                    compensacao = i.hco3 > hco3_esperado + 3 ? 'Parcialmente compensada (Crônica?)' : 'Aguda / Não compensada';
                } else if (i.hco3 < 22 && i.paco2 <= 45) {
                    disturbio = 'Acidose Metabólica';
                    const paco2_esperado = (1.5 * i.hco3) + 8;
                    const margem = 2;
                    if (i.paco2 < paco2_esperado - margem) compensacao = 'Alcalose Respiratória Associada';
                    else if (i.paco2 > paco2_esperado + margem) compensacao = 'Acidose Respiratória Associada';
                    else compensacao = 'Compensada';
                } else if (i.paco2 > 45 && i.hco3 < 22) {
                    disturbio = 'Acidose Mista (Respiratória + Metabólica)';
                }
            } else if (i.ph > 7.45) { // Alcalose
                if (i.paco2 < 35 && i.hco3 <= 26) {
                    disturbio = 'Alcalose Respiratória';
                    const hco3_esperado = 24 - (2 * (40 - i.paco2) / 10);
                    compensacao = i.hco3 < hco3_esperado - 3 ? 'Parcialmente compensada' : 'Aguda';
                } else if (i.hco3 > 26 && i.paco2 >= 35) {
                    disturbio = 'Alcalose Metabólica';
                    const paco2_esperado = (0.7 * i.hco3) + 21;
                    if (Math.abs(i.paco2 - paco2_esperado) <= 2) compensacao = 'Compensada';
                    else compensacao = 'Não compensada';
                } else if (i.paco2 < 35 && i.hco3 > 26) {
                    disturbio = 'Alcalose Mista';
                }
            }

            const agStatus = ag > 12 ? `Elevado (> 12)` : 'Normal';
            const pao2Status = i.pao2 < 60 ? 'Hipoxemia Grave' : i.pao2 < 80 ? 'Hipoxemia Leve/Mod' : 'Normal';

            return {
                value: Math.round(ag * 10) / 10,
                unit: 'mEq/L (AG)',
                interpretation: `${phStatus} | ${disturbio} ${compensacao ? '(' + compensacao + ')' : ''} | AG: ${agStatus} | PaO₂: ${pao2Status}`,
                level: i.ph >= 7.35 && i.ph <= 7.45 ? 'normal' : i.ph < 7.20 || i.ph > 7.55 ? 'severe' : 'moderate',
                extra: {
                    'Distúrbio Primário': disturbio,
                    'Compensação': compensacao || 'N/A',
                    'Ânion Gap': `${Math.round(ag)} mEq/L`,
                    'PaO₂ status': pao2Status
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

    // ─ 12. ÂNION GAP ESTENDIDO (DELTA-DELTA) ─────────────────────
    {
        id: 'anion_gap_delta',
        name: 'Ânion Gap + Delta Gap + Delta Relação',
        shortName: 'Ânion Gap Avançado',
        category: 'gasometria',
        description: 'Cálculo do AG corrigido pela albumina e avaliação de distúrbios mistos com Delta-Delta e Delta Relação.',
        icon: '⚗️',
        formula: 'AG = Na⁺ − (Cl⁻ + HCO₃⁻)\nAG corrigido = AG + 2,5 × (4 − Alb)\nΔ-Δ = (AG − 12) − (24 − HCO₃⁻)',
        fields: [
            { key: 'na', label: 'Na⁺', unit: 'mEq/L', type: 'number', defaultValue: 140, min: 110, max: 170, step: 1 },
            { key: 'cl', label: 'Cl⁻', unit: 'mEq/L', type: 'number', defaultValue: 105, min: 80, max: 140, step: 1 },
            { key: 'hco3', label: 'HCO₃⁻', unit: 'mEq/L', type: 'number', defaultValue: 24, min: 5, max: 50, step: 0.5 },
            { key: 'albumina', label: 'Albumina', unit: 'g/dL', type: 'number', defaultValue: 4.0, min: 1.0, max: 6.0, step: 0.1, hint: 'Normal: 3,5–4,5 g/dL. Hipoalbuminemia subestima o AG real.' },
        ],
        calculate: (i) => {
            const ag = i.na - (i.cl + i.hco3);
            const ag_corrigido = ag + 2.5 * (4 - i.albumina);
            const delta_delta = (ag - 12) - (24 - i.hco3);
            const delta_relacao = (ag - 12) / (24 - i.hco3);
            const interpretacao_delta =
                delta_delta < -6 ? 'Acidose metabólica normal (hiperclorêmica) concomitante' :
                    delta_delta > 6 ? 'Alcalose metabólica concomitante' :
                        'Sem distúrbio misto detectado';
            const ag_status = ag_corrigido > 16 ? '🔴 AG elevado — acidose com AG' : ag_corrigido > 12 ? '🟡 Limítrofe' : '✅ Normal';
            return {
                value: Math.round(ag_corrigido * 10) / 10,
                unit: 'mEq/L (AG corrigido)',
                interpretation: `AG: ${Math.round(ag)} | AG corrigido (Alb): ${Math.round(ag_corrigido * 10) / 10} — ${ag_status} | ΔΔ = ${delta_delta.toFixed(1)} → ${interpretacao_delta}`,
                level: ag_corrigido > 16 ? 'severe' : ag_corrigido > 12 ? 'mild' : 'normal',
                extra: {
                    'AG bruto': `${Math.round(ag)} mEq/L`,
                    'AG corrigido': `${Math.round(ag_corrigido * 10) / 10} mEq/L`,
                    'Delta-Delta': delta_delta.toFixed(1),
                    'Delta Relação': delta_relacao.toFixed(2),
                    'Interpretação ΔΔ': interpretacao_delta,
                },
            };
        },
        references: ['Kaplan LJ, Kellum JA. Crit Care 2004'],
    },

    // ─ 13. VOLUME MINUTO ─────────────────────────────────────────
    {
        id: 'volume_minuto',
        name: 'Volume Minuto e Ventilação Alveolar',
        shortName: 'Volume Minuto',
        category: 'ventilacao',
        description: 'Calcula o Volume Minuto total e a Ventilação Alveolar real (descontando espaço morto).',
        icon: '🌀',
        formula: 'VM = VT × FR\nVA = (VT − Vd) × FR\nVd/VT normal ≈ 0,3',
        fields: [
            { key: 'vt_ml', label: 'Volume Corrente (VT)', unit: 'mL', type: 'number', defaultValue: 500, min: 100, max: 1500, step: 10 },
            { key: 'fr', label: 'Frequência Respiratória', unit: 'irpm', type: 'number', defaultValue: 16, min: 5, max: 60, step: 1 },
            { key: 'peso_kg', label: 'Peso (kg)', unit: 'kg', type: 'number', defaultValue: 70, min: 30, max: 200, step: 1, hint: 'Usado para calcular espaço morto anatômico (≈ 2–2,2 mL/kg)' },
        ],
        calculate: (i) => {
            const vm = (i.vt_ml * i.fr) / 1000;
            const vd_anatomico = i.peso_kg * 2.2;
            const va = ((i.vt_ml - vd_anatomico) * i.fr) / 1000;
            const vd_vt_ratio = vd_anatomico / i.vt_ml;
            const vm_normal = vm >= 5 && vm <= 10;
            return {
                value: Math.round(vm * 100) / 100,
                unit: 'L/min (VM)',
                interpretation: `VM: ${vm.toFixed(1)} L/min (${vm_normal ? '✅ Normal 5–10 L/min' : vm < 5 ? '⚠️ Hipoventilação' : '⚠️ Hiperventilação'}) | VA: ${va.toFixed(1)} L/min | Vd/VT: ${(vd_vt_ratio * 100).toFixed(0)}%`,
                level: vm_normal ? 'normal' : vm < 3 ? 'severe' : 'mild',
                extra: {
                    'VM total': `${vm.toFixed(1)} L/min`,
                    'Ventilação Alveolar': `${va.toFixed(1)} L/min`,
                    'Vd anatômico': `${Math.round(vd_anatomico)} mL`,
                    'Vd/VT %': `${(vd_vt_ratio * 100).toFixed(0)}%`,
                },
            };
        },
    },

    // ─ 14. COMPLACÊNCIA DINÂMICA ─────────────────────────────────
    {
        id: 'complacencia_dinamica',
        name: 'Complacência Dinâmica (Cdyn)',
        shortName: 'Complacência Dinâmica',
        category: 'mecanica',
        description: 'Reflete resistência de vias aéreas + distensibilidade. Reduzida em broncoespasmo e secreção.',
        icon: '🔩',
        formula: 'Cdyn = VT ÷ (P_pico − PEEP)',
        fields: [
            { key: 'vt_ml', label: 'Volume Corrente', unit: 'mL', type: 'number', defaultValue: 450, min: 100, max: 1000, step: 10 },
            { key: 'p_pico', label: 'Pressão de Pico', unit: 'cmH₂O', type: 'number', defaultValue: 25, min: 5, max: 60, step: 1 },
            { key: 'peep', label: 'PEEP', unit: 'cmH₂O', type: 'number', defaultValue: 5, min: 0, max: 20, step: 1 },
            { key: 'p_plat', label: 'Pressão de Platô', unit: 'cmH₂O', type: 'number', defaultValue: 20, min: 5, max: 50, step: 1, hint: 'Opcional: fornece resistência automática' },
        ],
        calculate: (i) => {
            const cdyn = i.vt_ml / (i.p_pico - i.peep);
            const cst = i.vt_ml / (i.p_plat - i.peep);
            const diff = cst - cdyn;
            return {
                value: Math.round(cdyn * 10) / 10,
                unit: 'mL/cmH₂O',
                interpretation:
                    cdyn >= 50 ? '✅ Normal (≥ 50)' :
                        cdyn >= 35 ? '🟡 Levemente reduzida — atenção a vias aéreas' :
                            '🔴 Muito reduzida — broncoespasmo ou secreção?',
                level: cdyn >= 50 ? 'normal' : cdyn >= 35 ? 'mild' : 'severe',
                extra: {
                    'Cdyn': `${Math.round(cdyn * 10) / 10} mL/cmH₂O`,
                    'Cst': `${Math.round(cst * 10) / 10} mL/cmH₂O`,
                    'ΔCdyn–Cst': `${Math.round(diff * 10) / 10} (ΔP resistivo)`,
                },
            };
        },
    },

    // ─ 15. CONSTANTE DE TEMPO ────────────────────────────────────
    {
        id: 'constante_tempo',
        name: 'Constante de Tempo (RC)',
        shortName: 'Constante de Tempo',
        category: 'mecanica',
        description: 'Tempo necessário para equilibrar pressão e volume. Importante para ajuste de relação I:E.',
        icon: '⏱️',
        formula: 'RC = Complacência × Resistência (em unidades SI)',
        fields: [
            { key: 'complacencia', label: 'Complacência Estática', unit: 'mL/cmH₂O', type: 'number', defaultValue: 50, min: 5, max: 200, step: 1 },
            { key: 'resistencia', label: 'Resistência de VA', unit: 'cmH₂O/L/s', type: 'number', defaultValue: 10, min: 2, max: 50, step: 1, hint: 'Normal ≤ 5; Doença obstrutiva pode ser 15–30+' },
        ],
        calculate: (i) => {
            const cst_L = i.complacencia / 1000;
            const rc = cst_L * i.resistencia;
            const rc_ms = Math.round(rc * 1000);
            return {
                value: rc_ms,
                unit: 'ms',
                interpretation:
                    rc_ms < 500 ? '✅ Normal (< 500 ms) — tempo expiratório adequado' :
                        rc_ms < 1000 ? '🟡 Moderadamente aumentada — prolongar tempo expiratório' :
                            '🔴 Muito aumentada (> 1000 ms) — risco de armadilha de ar (auto-PEEP)',
                level: rc_ms < 500 ? 'normal' : rc_ms < 1000 ? 'mild' : 'severe',
                extra: {
                    'RC': `${rc_ms} ms (${(rc).toFixed(2)} s)`,
                    'T_exp recomendado': `≥ ${(rc * 3).toFixed(1)}s (3×RC)`,
                    'Risco auto-PEEP': rc_ms > 1000 ? 'Alto' : rc_ms > 500 ? 'Moderado' : 'Baixo',
                },
            };
        },
        references: ['Marini JJ. Respir Care 1990'],
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
    // ─ HACOR ───────────────────────────────────────────────────────
    {
        id: 'hacor',
        name: 'Escala HACOR — Risco de Falha da VNI',
        shortName: 'HACOR',
        category: 'escalas',
        description: 'Prediz falha da VNI em 1h após início. Score ≥ 5 = alto risco de intubação.',
        icon: '🫁',
        groups: [
            {
                name: 'pH arterial',
                key: 'ph',
                items: [
                    { value: 0, label: 'pH ≥ 7,35', description: 'Normal ou levemente acidêmico' },
                    { value: 2, label: 'pH 7,30–7,34', description: 'Acidemia moderada' },
                    { value: 3, label: 'pH < 7,30', description: 'Acidemia grave' },
                ],
            },
            {
                name: 'Escala de Glasgow (ECG)',
                key: 'glasgow',
                items: [
                    { value: 0, label: 'ECG ≥ 13', description: 'Leve' },
                    { value: 2, label: 'ECG 10–12', description: 'Moderado' },
                    { value: 4, label: 'ECG ≤ 9', description: 'Grave' },
                ],
            },
            {
                name: 'Frequência Respiratória',
                key: 'fr',
                items: [
                    { value: 0, label: 'FR ≤ 30 irpm', description: 'Normal' },
                    { value: 1, label: 'FR 31–35 irpm', description: 'Moderada' },
                    { value: 2, label: 'FR > 35 irpm', description: 'Grave' },
                ],
            },
            {
                name: 'SpO₂/FiO₂ (Índice SF)',
                key: 'sf',
                items: [
                    { value: 0, label: 'SF ≥ 235', description: 'Boa oxigenação (SpO₂/FiO₂ ≥ 235)' },
                    { value: 1, label: 'SF 188–234', description: 'Oxigenação moderada' },
                    { value: 2, label: 'SF < 188', description: 'Hipoxemia grave' },
                ],
            },
            {
                name: 'Encefalopatia',
                key: 'encefalop',
                items: [
                    { value: 0, label: 'Ausente', description: 'Sem confusão ou agitação' },
                    { value: 1, label: 'Presente', description: 'Confusão, agitação ou estado mental alterado' },
                ],
            },
        ],
        interpret: (total) => ({
            text:
                total < 2 ? '✅ Baixo risco de falha da VNI (HACOR < 2)' :
                    total < 5 ? '🟡 Risco intermediário — monitorar de perto' :
                        '🔴 ALTO RISCO de falha da VNI (≥ 5) — considerar intubação precoce',
            level: total < 2 ? 'normal' : total < 5 ? 'moderate' : 'critical',
        }),
        scoringNote: 'Avaliar 1h após início da VNI. Score ≥ 5 = 45% de chance de falha.',
    },
    // ─ SOFA ────────────────────────────────────────────────────────
    {
        id: 'sofa',
        name: 'SOFA Score — Avaliação de Falência Orgânica',
        shortName: 'SOFA',
        category: 'escalas',
        description: 'Sequential Organ Failure Assessment. Avalia 6 sistemas para predizer mortalidade em UTI.',
        icon: '🏥',
        groups: [
            {
                name: 'Oxigenação (Relação P/F)',
                key: 'resp',
                items: [
                    { value: 0, label: 'P/F > 400', description: 'Normal' },
                    { value: 1, label: 'P/F ≤ 400', description: 'Disfunção leve' },
                    { value: 2, label: 'P/F ≤ 300', description: 'Disfunção moderada' },
                    { value: 3, label: 'P/F ≤ 200 (c/ suporte)', description: 'SDRA grave' },
                    { value: 4, label: 'P/F ≤ 100 (c/ suporte)', description: 'Insuficiência respiratória grave' },
                ],
            },
            {
                name: 'Coagulação (Plaquetas)',
                key: 'coag',
                items: [
                    { value: 0, label: '≥ 150 mil', description: 'Normal' },
                    { value: 1, label: '< 150 mil', description: 'Trombocitopenia leve' },
                    { value: 2, label: '< 100 mil', description: 'Trombocitopenia moderada' },
                    { value: 3, label: '< 50 mil', description: 'Trombocitopenia grave' },
                    { value: 4, label: '< 20 mil', description: 'Alto risco de sangramento' },
                ],
            },
            {
                name: 'Fígado (Bilirrubina)',
                key: 'liv',
                items: [
                    { value: 0, label: '< 1,2 mg/dL', description: 'Normal' },
                    { value: 1, label: '1,2–1,9 mg/dL', description: 'Aumento leve' },
                    { value: 2, label: '2,0–5,9 mg/dL', description: 'Disfunção hepática moderada' },
                    { value: 3, label: '6,0–11,9 mg/dL', description: 'Icterícia grave' },
                    { value: 4, label: '> 12,0 mg/dL', description: 'Falência hepática' },
                ],
            },
            {
                name: 'Cardiovascular (PAM / Drotrop.)',
                key: 'cv',
                items: [
                    { value: 0, label: 'PAM ≥ 70 mmHg', description: 'Normal' },
                    { value: 1, label: 'PAM < 70 mmHg', description: 'Hipotensão' },
                    { value: 2, label: 'Dopamina ≤ 5 ou Dobutamina', description: 'Uso de drogas vasoativas (DVA)' },
                    { value: 3, label: 'Dopamina > 5 ou Noradrenalina ≤ 0,1', description: 'DVA doses moderadas' },
                    { value: 4, label: 'Dopamina > 15 ou Noradrenalina > 0,1', description: 'Choque refratário' },
                ],
            },
            {
                name: 'Neurológico (Glasgow)',
                key: 'glas',
                items: [
                    { value: 0, label: 'ECG 15', description: 'Normal' },
                    { value: 1, label: 'ECG 13–14', description: 'Disfunção leve' },
                    { value: 2, label: 'ECG 10–12', description: 'Disfunção moderada' },
                    { value: 3, label: 'ECG 6–9', description: 'Disfunção grave' },
                    { value: 4, label: 'ECG < 6', description: 'Coma profundo' },
                ],
            },
            {
                name: 'Renal (Creatinina / Diurese)',
                key: 'ren',
                items: [
                    { value: 0, label: '< 1,2 mg/dL', description: 'Normal' },
                    { value: 1, label: '1,2–1,9 mg/dL', description: 'Aumento leve' },
                    { value: 2, label: '2,0–3,4 mg/dL', description: 'Disfunção renal moderada' },
                    { value: 3, label: '3,5–4,9 mg/dL ou < 500 mL/dia', description: 'Oligúria' },
                    { value: 4, label: '> 5,0 mg/dL ou < 200 mL/dia', description: 'Anúria / Falência renal' },
                ],
            },
        ],
        interpret: (total) => {
            const mortality =
                total <= 1 ? '< 10%' :
                    total <= 3 ? '10-20%' :
                        total <= 9 ? '20-30%' :
                            total <= 12 ? '40-50%' : '> 80%';
            return {
                text: `Score Total: ${total} | Mortalidade estimada: ${mortality}`,
                level: total <= 3 ? 'normal' : total <= 9 ? 'moderate' : 'critical',
            };
        },
        scoringNote: 'Score de 0 a 24. Pontuação maior indica pior prognóstico.',
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
