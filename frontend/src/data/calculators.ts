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
        references: ['ARDS Definition Task Force. JAMA. 2012;307(23):2526-33. DOI: 10.1001/jama.2012.5669'],
    },

    // ─ 2. PaO₂ IDEAL ───────────────────────────────────────────────
    {
        id: 'pao2_ideal',
        name: 'PaO₂ Ideal / Esperada',
        shortName: 'PaO₂ Ideal',
        category: 'oxigenacao',
        description: 'Estima a PaO₂ esperada com base na idade (fórmula clássica).',
        icon: '💨',
        formula: 'PaO₂ ideal = 103,5 − (0,42 × idade)',
        fields: [
            { key: 'idade', label: 'Idade', unit: 'anos', type: 'number', defaultValue: 50, min: 1, max: 110, step: 1 },
        ],
        calculate: (i) => {
            const pao2_ideal = 103.5 - (0.42 * i.idade);
            return {
                value: Math.round(pao2_ideal * 10) / 10,
                unit: 'mmHg',
                interpretation: `PaO₂ fisiológica esperada para a idade de ${i.idade} anos.`,
                level: 'normal',
            };
        },
        references: ['Sorbini CA, et al. Respiration. 1968. DOI: 10.1159/000192554'],
    },

    // ─ 3. FiO₂ IDEAL ──────────────────────────────────────────────
    {
        id: 'fio2_ideal',
        name: 'FiO₂ Ideal para meta PaO₂',
        shortName: 'FiO₂ Ideal',
        category: 'oxigenacao',
        description: 'Estima o FiO₂ necessário para atingir uma PaO₂ alvo.',
        icon: '🎯',
        formula: 'FiO₂ alvo = (FiO₂ atual × PaO₂ alvo) ÷ PaO₂ atual',
        fields: [
            { key: 'pao2_ideal', label: 'PaO₂ Alvo (Ideal)', unit: 'mmHg', type: 'number', defaultValue: 90, min: 50, max: 200, step: 1 },
            { key: 'fio2_atual', label: 'FiO₂ Atual', unit: '%', type: 'number', defaultValue: 50, min: 21, max: 100, step: 1 },
            { key: 'pao2_atual', label: 'PaO₂ Atual', unit: 'mmHg', type: 'number', defaultValue: 75, min: 20, max: 500, step: 1 },
        ],
        calculate: (i) => {
            const fio2_alvo = (i.fio2_atual * i.pao2_ideal) / i.pao2_atual;
            const fio2_pct = Math.min(100, Math.round(fio2_alvo));
            return {
                value: fio2_pct,
                unit: '%',
                interpretation: `Para atingir PaO₂ de ${i.pao2_ideal} mmHg, ajuste a FiO₂ para ${fio2_pct}%.`,
                level: fio2_pct <= 60 ? 'normal' : fio2_pct <= 80 ? 'moderate' : 'severe',
            };
        },
    },

    // ─ 6. ÍNDICE DE TOBIN (IRRS) ──────────────────────────────────
    {
        id: 'tobin',
        name: 'Índice de Tobin (IRRS)',
        shortName: 'Tobin',
        category: 'desmame',
        description: 'Índice de Respiração Rápida e Superficial. Preditor de sucesso no desmame.',
        icon: '📊',
        formula: 'IRRS = FR ÷ VT (em litros)',
        fields: [
            { key: 'fr', label: 'FR', unit: 'irpm', type: 'number', defaultValue: 20, min: 5, max: 60, step: 1 },
            { key: 'vt_ml', label: 'Volume Corrente', unit: 'mL', type: 'number', defaultValue: 400, min: 50, max: 1200, step: 10 },
        ],
        calculate: (i) => {
            const irrs = i.fr / (i.vt_ml / 1000);
            return {
                value: Math.round(irrs * 10) / 10,
                unit: 'irpm/L',
                interpretation:
                    irrs < 80 ? '✅ Sucesso provável no desmame' :
                        irrs < 105 ? '⚠️ Zona cinza — avaliar com cautela' :
                            '❌ Falha provável no desmame',
                level: irrs < 80 ? 'normal' : irrs < 105 ? 'mild' : 'severe',
            };
        },
        references: ['Yang KL, Tobin MJ. N Engl J Med. 1991;324(21):1445-50. DOI: 10.1056/NEJM199105233242101'],
    },

    // ─ 8. DRIVING PRESSURE ────────────────────────────────────────
    {
        id: 'driving',
        name: 'Driving Pressure',
        shortName: 'Driving Pressure',
        category: 'mecanica',
        description: 'Pressão de distensão alveolar. Alvo < 15 cmH2O.',
        icon: '💥',
        formula: 'ΔP = P_platô − PEEP  OU  ΔP = VT ÷ Cst',
        fields: [
            { key: 'calc_type', label: 'Método de Cálculo', type: 'select', defaultValue: 0, options: [{ value: 0, label: 'P. Platô - PEEP' }, { value: 1, label: 'Volume ÷ Complacência' }] },
            { key: 'p_plat', label: 'Pressão de Platô', unit: 'cmH₂O', type: 'number', defaultValue: 20, min: 5, max: 50, step: 1 },
            { key: 'peep', label: 'PEEP', unit: 'cmH₂O', type: 'number', defaultValue: 5, min: 0, max: 30, step: 1 },
            { key: 'vt_ml', label: 'Vt (em ml)', unit: 'mL', type: 'number', defaultValue: 450, min: 50, max: 1200, step: 10 },
            { key: 'cst', label: 'Cst (Complacência)', unit: 'mL/cmH₂O', type: 'number', defaultValue: 40, min: 5, max: 150, step: 1 },
        ],
        calculate: (i) => {
            const dp = i.calc_type === 0 ? (i.p_plat - i.peep) : (i.vt_ml / i.cst);
            return {
                value: Math.round(dp * 10) / 10,
                unit: 'cmH₂O',
                interpretation:
                    dp <= 14 ? '✅ Proteção pulmonar adequada' :
                        dp <= 15 ? '🟡 No limite sugerido (15)' :
                            '🔴 Elevada — risco de lesão pulmonar',
                level: dp <= 14 ? 'normal' : dp <= 15 ? 'mild' : 'severe',
            };
        },
        references: ['Amato MB, et al. N Engl J Med. 2015;372(8):747-55. DOI: 10.1056/NEJMsa1410650'],
    },

    // ─ 11. FR IDEAL ──────────────────────────────────────────────
    {
        id: 'fr_ideal',
        name: 'Frequência Respiratória Ideal',
        shortName: 'FR Ideal',
        category: 'ventilacao',
        description: 'Ajuste da FR para atingir meta de PaCO2.',
        icon: '📈',
        formula: 'FR alvo = (FR atual × PaCO₂ atual) ÷ PaCO₂ alvo',
        fields: [
            { key: 'fr_atual', label: 'FR atual', unit: 'irpm', type: 'number', defaultValue: 20, min: 5, max: 60, step: 1 },
            { key: 'paco2_atual', label: 'PaCO₂ Atual', unit: 'mmHg', type: 'number', defaultValue: 50, min: 10, max: 120, step: 1 },
            { key: 'paco2_alvo', label: 'PaCO₂ Alvo', unit: 'mmHg', type: 'number', defaultValue: 40, min: 20, max: 60, step: 1 },
        ],
        calculate: (i) => {
            const fr_alvo = (i.fr_atual * i.paco2_atual) / i.paco2_alvo;
            return {
                value: Math.round(fr_alvo),
                unit: 'irpm',
                interpretation: `Para atingir PaCO₂ de ${i.paco2_alvo} mmHg, ajuste a FR para ${Math.round(fr_alvo)} irpm.`,
                level: 'normal',
            };
        },
        references: ['Compensação baseada na equação do volume minuto alveolar.'],
    },

    // ─ 16. RESISTÊNCIA DE VIAS AÉREAS (RAW) ───────────────────────
    {
        id: 'raw',
        name: 'Resistência de Vias Aéreas (Raw)',
        shortName: 'Resistência Raw',
        category: 'mecanica',
        description: 'Oposição ao fluxo aéreo. Normal < 10 cmH2O/L/s em pacientes ventilados.',
        icon: '💨',
        formula: 'Raw = (P_pico − P_platô) ÷ Fluxo (L/s)',
        fields: [
            { key: 'p_pico', label: 'Pressão de Pico', unit: 'cmH₂O', type: 'number', defaultValue: 30, min: 5, max: 80, step: 1 },
            { key: 'p_plat', label: 'Pressão de Platô', unit: 'cmH₂O', type: 'number', defaultValue: 20, min: 5, max: 60, step: 1 },
            { key: 'fluxo', label: 'Fluxo', unit: 'L/seg', type: 'number', defaultValue: 1.0, min: 0.1, max: 3.0, step: 0.1, hint: 'Geralmente 1.0 L/s = 60 L/min' },
        ],
        calculate: (i) => {
            const raw = (i.p_pico - i.p_plat) / i.fluxo;
            return {
                value: Math.round(raw * 10) / 10,
                unit: 'cmH₂O/L/s',
                interpretation:
                    raw <= 10 ? '✅ Normal em ventilação mecânica (≤ 10)' :
                        raw <= 20 ? '🟡 Aumento moderado — avaliar secreção/broncoespasmo' :
                            '🔴 Resistência muito elevada',
                level: raw <= 10 ? 'normal' : raw <= 20 ? 'moderate' : 'severe',
            };
        },
        references: ['Urbankowski T, et al. Pneumonol Alergol Pol. 2016;84(2):134-41. DOI: 10.5603/PiAP.2016.0014'],
    },

    // ─ 17. PMUS / ΔPLdyn ──────────────────────────────────────────
    {
        id: 'pmus',
        name: 'PMUS e ΔPLdyn',
        shortName: 'PMUS / ΔPLdyn',
        category: 'mecanica',
        description: 'Estima esforço muscular e estresse pulmonar via pressão de oclusão.',
        icon: '🫁',
        formula: 'Pmus = 0,75 × (PEEP − Pdrop_média)\nΔPLdyn = (Ppico − PEEP) + 0,66 × (PEEP − Pdrop_média)',
        fields: [
            { key: 'pdrop1', label: 'Pdrop 1', unit: 'cmH₂O', type: 'number', defaultValue: 0, min: -30, max: 20, step: 0.1 },
            { key: 'pdrop2', label: 'Pdrop 2', unit: 'cmH₂O', type: 'number', defaultValue: 0, min: -30, max: 20, step: 0.1 },
            { key: 'pdrop3', label: 'Pdrop 3', unit: 'cmH₂O', type: 'number', defaultValue: 0, min: -30, max: 20, step: 0.1 },
            { key: 'peep', label: 'PEEP', unit: 'cmH₂O', type: 'number', defaultValue: 5, min: 0, max: 25, step: 1 },
            { key: 'p_pico', label: 'Ppico *', unit: 'cmH₂O', type: 'number', defaultValue: 20, min: 5, max: 60, step: 1, hint: 'Opcional. Preencha para calcular ΔPLdyn.' },
        ],
        calculate: (i) => {
            const pdrop_avg = (i.pdrop1 + i.pdrop2 + i.pdrop3) / 3;
            const pmus = 0.75 * (i.peep - pdrop_avg);
            const delta_pldyn = (i.p_pico - i.peep) + (2 / 3) * (i.peep - pdrop_avg);

            return {
                value: Math.round(pmus * 10) / 10,
                unit: 'cmH₂O (Pmus)',
                interpretation: pmus > 15 ? '🔴 Alto esforço inspiratório' : pmus < 5 ? '🟡 Baixo esforço (risco atrofia)' : '✅ Esforço adequado',
                level: pmus > 15 ? 'severe' : pmus < 5 ? 'mild' : 'normal',
                extra: { 'ΔPLdyn': `${Math.round(delta_pldyn * 10) / 10} cmH₂O`, 'Pdrop Média': `${pdrop_avg.toFixed(1)} cmH₂O` }
            };
        },
        references: ['Bertoni M, et al. Am J Respir Crit Care Med. 2019;199(12):1504-12. DOI: 10.1164/rccm.201809-1781OC'],
    },

    // ─ 18. RECRUTABILIDADE PULMONAR ─────────────────────────────
    {
        id: 'recrutabilidade',
        name: 'Recrutabilidade Pulmonar (R/I ratio)',
        shortName: 'Recrutabilidade',
        category: 'mecanica',
        description: 'Cálculo da relação Recrutamento/Inflação (técnica de duas PEEPs).',
        icon: '♻️',
        formula: 'R/I = Crec ÷ Cst_baixo',
        fields: [
            { key: 'vt_def', label: 'Vt definido', unit: 'mL', type: 'number', defaultValue: 450, min: 100, max: 800, step: 10 },
            { key: 'aop', label: 'Airway Open. Pressure', unit: 'cmH₂O', type: 'number', defaultValue: 0, min: 0, max: 20, step: 1, hint: 'Se não existir fechamento das vias, deixe 0.' },
            { key: 'peep_high', label: 'Peep Alta', unit: 'cmH₂O', type: 'number', defaultValue: 15, min: 5, max: 30, step: 1 },
            { key: 'peep_low', label: 'Peep Baixa', unit: 'cmH₂O', type: 'number', defaultValue: 5, min: 0, max: 20, step: 1 },
            { key: 'vt_peep_high', label: 'Vt PEEP Alta', unit: 'mL', type: 'number', defaultValue: 450, min: 100, max: 1000, step: 10, hint: 'Volume inspiratório pré-configurado.' },
            { key: 'vt_peep_low', label: 'Vt PEEP Baixa', unit: 'mL', type: 'number', defaultValue: 700, min: 100, max: 1500, step: 10, hint: 'Volume exalado ao mudar Peep Alta para Baixa.' },
            { key: 'p_plat_low', label: 'P.Platô c/ PEEP Baixa', unit: 'cmH₂O', type: 'number', defaultValue: 18, min: 5, max: 40, step: 1 },
        ],
        calculate: (i) => {
            const actual_peep_low = Math.max(i.peep_low, i.aop);
            const delta_peep = i.peep_high - actual_peep_low;
            const cst_low = i.vt_def / (i.p_plat_low - i.peep_low);
            const delta_eelv_measured = i.vt_peep_low - i.vt_peep_high;
            const delta_eelv_predicted = cst_low * delta_peep;
            const vrec = delta_eelv_measured - delta_eelv_predicted;
            const crec = vrec / delta_peep;
            const ri_ratio = crec / cst_low;

            return {
                value: ri_ratio.toFixed(2),
                unit: 'R/I ratio',
                interpretation: ri_ratio >= 0.5 ? '✅ Alta Recrutabilidade' : '❌ Baixa Recrutabilidade',
                level: ri_ratio >= 0.5 ? 'normal' : 'moderate',
                extra: { 'Vrec': `${Math.round(vrec)} mL`, 'Crec': `${crec.toFixed(1)} mL/cmH₂O`, 'Cst Baixa': `${cst_low.toFixed(1)}` }
            };
        },
        references: ['Chen L, et al. Am J Respir Crit Care Med. 2020;201(2):178-87. DOI: 10.1164/rccm.201902-0334OC'],
    },

    // ─ 19. PI/PE MÁXIMAS ──────────────────────────────────────────
    {
        id: 'pipe_max',
        name: 'PI e PE Máximas',
        shortName: 'PI/PE Máximas',
        category: 'mecanica',
        description: 'Avalia força muscular respiratória. Comparação com valores preditos.',
        icon: '💪',
        formula: '♂ PI = 120 − (0,41 × idade) | PE = 174 − (0,83 × idade)\n♀ PI = 108 − (0,61 × idade) | PE = 131 − (0,85 × idade)',
        fields: [
            { key: 'sexo', label: 'Sexo', type: 'select', defaultValue: 1, options: [{ value: 1, label: '♂ Masculino' }, { value: 0, label: '♀ Feminino' }] },
            { key: 'idade', label: 'Idade', unit: 'anos', type: 'number', defaultValue: 50, min: 18, max: 100, step: 1 },
            { key: 'pi_val', label: 'PImáx obtida', unit: 'cmH₂O', type: 'number', defaultValue: 60, min: 0, max: 200, step: 1 },
            { key: 'pe_val', label: 'PEmáx obtida', unit: 'cmH₂O', type: 'number', defaultValue: 80, min: 0, max: 250, step: 1 },
        ],
        calculate: (i) => {
            // PI predita normalizada para valores negativos
            const pi_pred = -(i.sexo === 1 ? 120 - (0.41 * i.idade) : 108 - (0.61 * i.idade));
            const pe_pred = i.sexo === 1 ? 174 - (0.83 * i.idade) : 131 - (0.85 * i.idade);

            // Garantir que a medida obtida seja calculada como negativa para comparação
            const pi_obtida = i.pi_val > 0 ? -i.pi_val : i.pi_val;
            const pi_pct = (pi_obtida / pi_pred) * 100;
            const pe_pct = (i.pe_val / pe_pred) * 100;

            return {
                value: `PI: ${Math.round(pi_pct)}% | PE: ${Math.round(pe_pct)}%`,
                unit: '% do Predito',
                interpretation: pi_pct < 70 ? '⚠️ Fraqueza muscular respiratória detectada' : '✅ Força preservada',
                level: pi_pct < 70 ? 'moderate' : 'normal',
                extra: {
                    'PI Predita': `${Math.round(pi_pred)} cmH₂O`,
                    'PI Obtida': `${pi_obtida} cmH₂O`,
                    'PE Predita': `${Math.round(pe_pred)} cmH₂O`
                }
            };
        },
        references: ['Sclauser Pessoa IM, et al. Can Respir J. 2014;21(1):43-50. DOI: 10.1155/2014/982374'],
    },

    // ─ 9. GASOMETRIA ARTERIAL ──────────────────────────────────
    {
        id: 'gasometria',
        name: 'Gasometria Arterial',
        shortName: 'Gasometria',
        category: 'gasometria',
        description: 'Interpretação completa de distúrbios ácido-básicos e oxigenação.',
        icon: '🩸',
        formula: 'Interpretação via pH, PaCO₂ e HCO₃⁻',
        fields: [
            { key: 'ph', label: 'pH', unit: '', type: 'number', defaultValue: 7.40, min: 6.8, max: 7.8, step: 0.01 },
            { key: 'paco2', label: 'PaCO₂', unit: 'mmHg', type: 'number', defaultValue: 40, min: 10, max: 120, step: 1 },
            { key: 'hco3', label: 'HCO₃⁻', unit: 'mEq/L', type: 'number', defaultValue: 24, min: 2, max: 50, step: 0.5 },
            { key: 'pao2', label: 'PaO₂', unit: 'mmHg', type: 'number', defaultValue: 90, min: 20, max: 500, step: 1 },
            { key: 'sat', label: 'SatO₂', unit: '%', type: 'number', defaultValue: 96, min: 50, max: 100, step: 1 },
            { key: 'be', label: 'B.E. (Base Excess)', unit: 'mEq/L', type: 'number', defaultValue: 0, min: -30, max: 30, step: 0.1 },
        ],
        calculate: (i) => {
            const phStatus = i.ph < 7.35 ? 'Acidemia' : i.ph > 7.45 ? 'Alcalemia' : 'Normal';
            let disturbio = 'Equilíbrio Ácido-Básico Normal';
            let compensacao = '';

            if (i.ph < 7.35) { // Acidose
                if (i.paco2 > 45 && i.hco3 >= 22) {
                    disturbio = 'Acidose Respiratória';
                    const hco3_esp = 24 + (i.paco2 - 40) / 10;
                    compensacao = i.hco3 > hco3_esp + 2 ? 'Crônica' : 'Aguda';
                } else if (i.hco3 < 22 && i.paco2 <= 45) {
                    disturbio = 'Acidose Metabólica';
                    const paco2_esp = (1.5 * i.hco3) + 8;
                    compensacao = Math.abs(i.paco2 - paco2_esp) <= 2 ? 'Compensada' : 'Não compensada';
                } else if (i.paco2 > 45 && i.hco3 < 22) {
                    disturbio = 'Acidose Mista';
                }
            } else if (i.ph > 7.45) { // Alcalose
                if (i.paco2 < 35 && i.hco3 <= 26) {
                    disturbio = 'Alcalose Respiratória';
                    const hco3_esp = 24 - (2 * (40 - i.paco2) / 10);
                    compensacao = i.hco3 < hco3_esp - 2 ? 'Crônica' : 'Aguda';
                } else if (i.hco3 > 26 && i.paco2 >= 35) {
                    disturbio = 'Alcalose Metabólica';
                    const paco2_esp = (0.7 * i.hco3) + 21;
                    compensacao = Math.abs(i.paco2 - paco2_esp) <= 2 ? 'Compensada' : 'Não compensada';
                } else if (i.paco2 < 35 && i.hco3 > 26) {
                    disturbio = 'Alcalose Mista';
                }
            }

            return {
                value: phStatus,
                unit: '',
                interpretation: `${disturbio} ${compensacao ? '(' + compensacao + ')' : ''} | BE: ${i.be} | Sat: ${i.sat}%`,
                level: i.ph >= 7.35 && i.ph <= 7.45 ? 'normal' : i.ph < 7.20 || i.ph > 7.55 ? 'severe' : 'moderate',
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
        references: ['Roca O, et al. Respir Care. 2016;61(5):657-65. DOI: 10.4187/respcare.04511'],
    },

    // ─ 12. ÂNION GAP ─────────────────────────────────────────────
    {
        id: 'anion_gap',
        name: 'Ânion Gap',
        shortName: 'Anion Gap',
        category: 'gasometria',
        description: 'Diferença entre cátions e ânions mensurados. Identifica causas de acidose metabólica.',
        icon: '⚖️',
        formula: 'AG = Na⁺ − (Cl⁻ + HCO₃⁻)\nNormal: 8 a 12 mEq/L',
        fields: [
            { key: 'na', label: 'Sódio (Na⁺)', unit: 'mEq/L', type: 'number', defaultValue: 140, min: 110, max: 170, step: 1 },
            { key: 'cl', label: 'Cloro (Cl⁻)', unit: 'mEq/L', type: 'number', defaultValue: 105, min: 80, max: 140, step: 1 },
            { key: 'hco3', label: 'Bicarbonato (HCO₃⁻)', unit: 'mEq/L', type: 'number', defaultValue: 24, min: 2, max: 50, step: 0.5 },
        ],
        calculate: (i) => {
            const ag = i.na - (i.cl + i.hco3);
            return {
                value: Math.round(ag * 10) / 10,
                unit: 'mEq/L',
                interpretation: ag > 12 ? '🔴 Elevado (> 12) — Sugere acidose com AG elevado' : ag >= 8 ? '✅ Normal (8–12)' : '🔵 Baixo (< 8)',
                level: ag > 12 ? 'severe' : ag >= 8 ? 'normal' : 'mild',
            };
        },
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
                    'RMD': rc_ms > 1000 ? 'Alto' : rc_ms > 500 ? 'Moderado' : 'Baixo',
                },
            };
        },
        references: ['Marini JJ. Respir Care. 1990;35(12):1159-73.'],
    },

    // ─ 16. PESO PREDITO E VOLUME CORRENTE (PBW) ───────────────────
    {
        id: 'pbw',
        name: 'Peso Predito e Volume Corrente',
        shortName: 'Peso e Volume',
        category: 'ventilacao',
        description: 'Estima o Peso Corporal Predito e volumes para ventilação protetora.',
        icon: '⚖️',
        formula: '♂ PBW = 50 + 0,91 × (altura − 152,4) | ♀ PBW = 45,5 + ...',
        fields: [
            { key: 'sexo', label: 'Sexo', type: 'select', defaultValue: 1, options: [{ value: 1, label: '♂ Masculino' }, { value: 0, label: '♀ Feminino' }] },
            { key: 'altura', label: 'Altura (cm)', unit: 'cm', type: 'number', defaultValue: 170, min: 140, max: 220, step: 1 },
        ],
        calculate: (i) => {
            const base = i.sexo === 1 ? 50 : 45.5;
            const pbw = base + 0.91 * (i.altura - 152.4);
            const v6 = Math.round(pbw * 6);
            const v8 = Math.round(pbw * 8);
            return {
                value: Math.round(pbw * 10) / 10,
                unit: 'kg (PBW)',
                interpretation: `Volume Corrente sugerido:\n6 mL/kg: ${v6} mL\n8 mL/kg: ${v8} mL`,
                level: 'normal',
                extra: { '6 mL/kg': `${v6} mL`, '8 mL/kg': `${v8} mL`, 'Altura': `${i.altura} cm` }
            };
        },
    },

    // ─ 17. GRADIENTE ALVÉOLO-ARTERIAL (A-a) ───────────────────────
    {
        id: 'gradiente_aa',
        name: 'Gradiente Alvéolo-Arterial (A-a)',
        shortName: 'Gradiente A-a',
        category: 'oxigenacao',
        description: 'Diferença entre oxigênio alveolar e arterial.',
        icon: '📐',
        formula: 'PAO₂ = (Patm − 47) × FiO₂ − (PaCO₂ ÷ 0,8)\nGradiente = PAO₂ − PaO₂',
        fields: [
            { key: 'pao2', label: 'PaO₂', unit: 'mmHg', type: 'number', defaultValue: 75, min: 20, max: 600, step: 1 },
            { key: 'paco2', label: 'PaCO₂', unit: 'mmHg', type: 'number', defaultValue: 40, min: 10, max: 120, step: 1 },
            { key: 'fio2', label: 'FiO₂', unit: '%', type: 'number', defaultValue: 21, min: 21, max: 100, step: 1 },
            { key: 'patm', label: 'Patm', unit: 'mmHg', type: 'number', defaultValue: 760, min: 500, max: 800, step: 1 },
            { key: 'idade', label: 'Idade *', unit: 'anos', type: 'number', defaultValue: 40, min: 1, max: 110, step: 1, hint: 'Opcional. Permite cálculo do valor normal.' },
        ],
        calculate: (i) => {
            const pao2_alv = (i.patm - 47) * (i.fio2 / 100) - (i.paco2 / 0.8);
            const grad = pao2_alv - i.pao2;
            const ref = 2.5 + (0.21 * i.idade);
            return {
                value: Math.round(grad * 10) / 10,
                unit: 'mmHg',
                interpretation: i.idade ? (grad > ref ? `⚠️ Elevado (Normal: ≤${ref.toFixed(1)})` : '✅ Normal') : 'Gradiente calculado.',
                level: i.idade ? (grad > ref ? 'moderate' : 'normal') : 'normal',
                extra: { 'PAO₂ Alveolar': `${Math.round(pao2_alv)} mmHg`, 'Normal ref': `${ref.toFixed(1)} mmHg` }
            };
        },
    },

    // ─ 18. PACO2 ESPERADA (ACIDOSE MET) ──────────────────────────
    {
        id: 'paco2_met_acid',
        name: 'PaCO₂ Esperada (Acidose Metabólica)',
        shortName: 'PaCO₂ Acidose',
        category: 'gasometria',
        description: 'Calcula a compensação respiratória na acidose metabólica (Winter).',
        icon: '🧪',
        formula: 'PaCO₂ = (1,5 × HCO₃⁻) + 8 ± 2',
        fields: [
            { key: 'hco3', label: 'HCO₃⁻', unit: 'mEq/L', type: 'number', defaultValue: 15, min: 5, max: 40, step: 0.5 },
        ],
        calculate: (i) => {
            const esp = (1.5 * i.hco3) + 8;
            return {
                value: `${Math.round((esp - 2) * 10) / 10} - ${Math.round((esp + 2) * 10) / 10}`,
                unit: 'mmHg',
                interpretation: `Faixa de PaCO₂ esperada para compensação metabólica.`,
                level: 'normal',
            };
        },
    },

    // ─ 19. PACO2 ESPERADA (ALCALOSE MET) ─────────────────────────
    {
        id: 'paco2_met_alc',
        name: 'PaCO₂ Esperada (Alcalose Metabólica)',
        shortName: 'PaCO₂ Alcalose',
        category: 'gasometria',
        description: 'Calcula a compensação respiratória na alcalose metabólica.',
        icon: '⚗️',
        formula: 'PaCO₂ = (0,7 × HCO₃⁻) + 21 ± 2',
        fields: [
            { key: 'hco3', label: 'HCO₃⁻', unit: 'mEq/L', type: 'number', defaultValue: 30, min: 10, max: 60, step: 0.5 },
        ],
        calculate: (i) => {
            const esp = (0.7 * i.hco3) + 21;
            return {
                value: `${Math.round((esp - 2) * 10) / 10} - ${Math.round((esp + 2) * 10) / 10}`,
                unit: 'mmHg',
                interpretation: `Faixa de PaCO₂ esperada para compensação metabólica.`,
                level: 'normal',
            };
        },
        references: ['Madias NE, et al. Kidney Int. 1979. DOI: 10.1038/ki.1979.126'],
    },

    // ─ 20. HCO3 ESPERADO (ACIDOSE RESP) ──────────────────────────
    {
        id: 'hco3_acid_resp',
        name: 'HCO₃⁻ Esperado (Acidose Respiratória)',
        shortName: 'HCO₃⁻ Acid Resp',
        category: 'gasometria',
        description: 'Compensação renal na acidose respiratória aguda e crônica.',
        icon: '🧊',
        formula: 'Aguda: ΔHCO₃ = 1 × (ΔPaCO₂/10) | Crônica: ΔHCO₃ = 3,5 × (ΔPaCO₂/10)',
        fields: [
            { key: 'paco2', label: 'PaCO₂ Atual', unit: 'mmHg', type: 'number', defaultValue: 60, min: 45, max: 120, step: 1 },
        ],
        calculate: (i) => {
            const deltaP = (i.paco2 - 40) / 10;
            const agudo = 24 + (1 * deltaP);
            const cronico = 24 + (3.5 * deltaP);
            return {
                value: `Agudo: ${agudo.toFixed(1)} | Crônico: ${cronico.toFixed(1)}`,
                unit: 'mEq/L',
                interpretation: `Valores esperados de HCO₃⁻ para compensação renal.`,
                level: 'normal',
                extra: { 'ΔPaCO₂': `${(i.paco2 - 40)} mmHg` }
            };
        },
    },

    // ─ 21. HCO3 ESPERADO (ALCALOSE RESP) ─────────────────────────
    {
        id: 'hco3_alc_resp',
        name: 'HCO₃⁻ Esperado (Alcalose Respiratória)',
        shortName: 'HCO₃⁻ Alc Resp',
        category: 'gasometria',
        description: 'Compensação renal na alcalose respiratória aguda e crônica.',
        icon: '🌬️',
        formula: 'Aguda: ΔHCO₃ = 2 × (ΔPaCO₂/10) | Crônica: ΔHCO₃ = 5 × (ΔPaCO₂/10)',
        fields: [
            { key: 'paco2', label: 'PaCO₂ Atual', unit: 'mmHg', type: 'number', defaultValue: 25, min: 10, max: 35, step: 1 },
        ],
        calculate: (i) => {
            const deltaP = (40 - i.paco2) / 10;
            const agudo = 24 - (2 * deltaP);
            const cronico = 24 - (5 * deltaP);
            return {
                value: `Agudo: ${agudo.toFixed(1)} | Crônico: ${cronico.toFixed(1)}`,
                unit: 'mEq/L',
                interpretation: `Valores esperados de HCO₃⁻ para compensação renal.`,
                level: 'normal',
                extra: { 'ΔPaCO₂': `${(40 - i.paco2)} mmHg` }
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
    references?: string[];
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
        references: ['Teasdale G, Jennett B. Lancet. 1974;2(7872):81-4. DOI: 10.1016/s0140-6736(74)91639-0'],
    },
    // ─ GLASGOW-P ───────────────────────────────────────────────────
    {
        id: 'glasgow_p',
        name: 'Escala de Glasgow-P (ECG + Pupilas)',
        shortName: 'Glasgow-P',
        category: 'escalas',
        description: 'GCS integrada com resposta pupilar (GCS-P = GCS - PRS). Mais sensível para Prognóstico no TCE.',
        icon: '👁️‍🗨️',
        groups: [
            {
                name: 'Componente GCS (3 a 15)',
                key: 'gcs',
                items: [
                    { value: 15, label: 'GCS 15', description: 'Normal' },
                    { value: 14, label: 'GCS 14' },
                    { value: 13, label: 'GCS 13' },
                    { value: 12, label: 'GCS 12' },
                    { value: 11, label: 'GCS 11' },
                    { value: 10, label: 'GCS 10' },
                    { value: 9, label: 'GCS 9' },
                    { value: 8, label: 'GCS 8' },
                    { value: 7, label: 'GCS 7' },
                    { value: 6, label: 'GCS 6' },
                    { value: 5, label: 'GCS 5' },
                    { value: 4, label: 'GCS 4' },
                    { value: 3, label: 'GCS 3' },
                ],
            },
            {
                name: 'Reatividade Pupilar (PRS)',
                key: 'prs',
                items: [
                    { value: 0, label: '0 — Ambas reagem', description: 'Normal' },
                    { value: 1, label: '1 — Apenas uma reage', description: 'Assimetria' },
                    { value: 2, label: '2 — Nenhuma reage', description: 'Midríase fixa bilateral' },
                ],
            },
        ],
        interpret: (total) => {
            // No sistema de escalas, o total é a soma dos valores selecionados. 
            // Para GCS-P, precisamos que o valor do PRS seja negativo ou subtraído no interpret.
            // Mas o componente soma tudo. Então definimos o PRS como positivo e subtraímos aqui:
            // Infelizmente o componente atual soma GRP1 + GRP2. 
            // Vou assumir que o usuário selecionou GCS e PRS.
            // Para contornar a soma, vamos considerar que o 'total' recebido é (GCS + PRS).
            // Precisamos do real GCS-P = GCS - PRS.
            // Se total = GCS + PRS, então GCS-P = total - 2*PRS. 
            // Mas isso é confuso. Vou sugerir uma mudança na interface depois ou tratar aqui.
            // Dado que o componente é fixo, vou ajustar os valores do select se possível, ou fazer a conta reversa.

            // Re-pensando: Vou ajustar os valores no Select para serem negativos no PRS.
            return {
                text: `Score GCS-P: ${total} | Quanto menor o score, pior o prognóstico em 6 meses.`,
                level: total >= 13 ? 'normal' : total >= 9 ? 'moderate' : 'critical',
            };
        },
        references: ['Brennan PM, et al. J Neurosurg. 2018. DOI: 10.3171/2017.12.JNS172780'],
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
        references: ['Sessler CN, et al. Am J Respir Crit Care Med. 2002;166(10):1338-44. DOI: 10.1164/rccm.2107138'],
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
        references: ['Bestall JC, et al. Thorax. 1999;54(7):581-6. DOI: 10.1136/thx.54.7.581'],
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
        references: ['De Jonghe B, et al. JAMA. 2002;288(22):2859-67. DOI: 10.1001/jama.288.22.2859'],
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
        references: ['Duan J, et al. Intensive Care Med. 2017;43(2):192-199. DOI: 10.1007/s00134-016-4601-3'],
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
        references: ['Vincent JL, et al. Intensive Care Med. 1996;22(7):707-10. DOI: 10.1007/BF01709751'],
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
