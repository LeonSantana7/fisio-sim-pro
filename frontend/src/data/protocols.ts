export interface DiagnosticCriterion {
    id: string;
    type: 'required' | 'optional' | 'exclusion';
    domain: string;
    description: string;
    threshold?: number;
    operator?: '<' | '>' | '<=' | '>=' | '=';
    unit?: string;
}

export interface DecisionNode {
    id: string;
    type: 'condition' | 'action' | 'alert' | 'calc';
    content: string;
    children?: string[]; // IDs dos filhos
    trueBranch?: string;  // ID do nó para condição verdadeira
    falseBranch?: string; // ID do nó para condição falsa
    level?: 'info' | 'warning' | 'danger' | 'success';
}

export interface TargetParameter {
    id: string;
    name: string;
    formula?: string;
    thresholdMin?: number;
    thresholdMax?: number;
    unit: string;
    alertLevel: 'green' | 'yellow' | 'red';
    description: string;
}

export interface ScientificSource {
    id: string;
    authors: string;
    year: number;
    title: string;
    journal: string;
    doi?: string;
    type: 'guideline' | 'rct' | 'meta-analysis' | 'review' | 'consensus';
}

export interface ClinicalProtocol {
    id: string;
    slug: string;
    name: string;
    fullName: string;
    category: string;
    icd10: string;
    icf?: string;
    evidenceLevel: string;
    definition: string;
    diagnosticCriteria: DiagnosticCriterion[];
    decisionFlow: string[]; // Passos ordenados em texto
    decisionNodes: Record<string, DecisionNode>;
    targetParameters: TargetParameter[];
    sources: ScientificSource[];
}

export const protocols: ClinicalProtocol[] = [
    {
        id: 'sdra',
        slug: 'sdra',
        name: 'SDRA',
        fullName: 'Síndrome do Desconforto Respiratório Agudo',
        category: 'Ventilação Mecânica Invasiva',
        icd10: 'J80',
        icf: 'b4401',
        evidenceLevel: '1A',
        definition:
            'Insuficiência respiratória aguda hipoxêmica causada por edema pulmonar inflamatório não cardiogênico, caracterizada por hipoxemia refratária, opacidades bilaterais na imagem e redução da complacência pulmonar. Definida pelos Critérios de Berlim (2012).',
        diagnosticCriteria: [
            { id: 'dc1', type: 'required', domain: 'Tempo', description: 'Início agudo dentro de 1 semana do insulto clínico identificável' },
            { id: 'dc2', type: 'required', domain: 'Imagem', description: 'Opacidades bilaterais no RX/TC não totalmente explicadas por derrame, colapso ou nódulos' },
            { id: 'dc3', type: 'required', domain: 'Origem do Edema', description: 'Edema não explicado totalmente por insuficiência cardíaca ou sobrecarga de fluidos' },
            { id: 'dc4', type: 'required', domain: 'Oxigenação — Leve', description: 'PaO₂/FiO₂: 200–300 mmHg com PEEP ≥ 5 cmH₂O', threshold: 300, operator: '<=', unit: 'mmHg' },
            { id: 'dc5', type: 'required', domain: 'Oxigenação — Moderada', description: 'PaO₂/FiO₂: 100–200 mmHg com PEEP ≥ 5 cmH₂O', threshold: 200, operator: '<=', unit: 'mmHg' },
            { id: 'dc6', type: 'required', domain: 'Oxigenação — Grave', description: 'PaO₂/FiO₂ ≤ 100 mmHg com PEEP ≥ 5 cmH₂O', threshold: 100, operator: '<=', unit: 'mmHg' },
        ],
        decisionFlow: [
            'Confirmar Critérios de Berlim (tempo + imagem + origem + oxigenação)',
            'Calcular Peso Corporal Previsto (PBW): ♂ PBW = 50 + 0.91×(altura_cm − 152.4) | ♀ PBW = 45.5 + 0.91×(altura_cm − 152.4)',
            'Ajustar VT = 6 mL/kg PBW (máximo 8 mL/kg em hipoxemia grave)',
            'Verificar Pressão de Platô: se P_plat > 30 cmH₂O → reduzir VT em 1 mL/kg até mínimo 4 mL/kg',
            'Verificar Driving Pressure: se ΔP > 15 cmH₂O → reduzir VT ou aumentar PEEP',
            'Calcular relação P/F atual e titular PEEP conforme tabela ARDSNet',
            'Se P/F ≤ 150: INDICAR POSIÇÃO PRONA (mínimo 16h/dia) + Bloqueio Neuromuscular (cisatracúrio 48h)',
            'Monitorar diariamente: P/F, Driving Pressure, Complacência. Se P/F > 150 → programar reversão de prona',
            'Ausência de melhora após 72h de manejo máximo → Avaliar ECMO (centros de referência)',
        ],
        decisionNodes: {},
        targetParameters: [
            { id: 'tp1', name: 'Driving Pressure', formula: 'ΔP = P_plat − PEEP', thresholdMax: 15, unit: 'cmH₂O', alertLevel: 'red', description: 'Associado independentemente à mortalidade no estudo AMATO 2015 (NEJM)' },
            { id: 'tp2', name: 'Pressão de Platô', thresholdMax: 30, unit: 'cmH₂O', alertLevel: 'red', description: 'Limite de segurança para prevenção de volutrauma — ARDSNet 2000' },
            { id: 'tp3', name: 'SpO₂', thresholdMin: 88, thresholdMax: 95, unit: '%', alertLevel: 'yellow', description: 'Hipoxemia permissiva — evitar FiO₂ elevada desnecessariamente' },
            { id: 'tp4', name: 'pH Arterial', thresholdMin: 7.25, unit: '', alertLevel: 'red', description: 'Hipercapnia permissiva — aceitar PaCO₂ elevada se pH ≥ 7.25' },
            { id: 'tp5', name: 'PaCO₂', thresholdMin: 45, thresholdMax: 60, unit: 'mmHg', alertLevel: 'yellow', description: 'Aceitável em ventilação protetora. Acima de 60 monitorar pH cuidadosamente' },
            { id: 'tp6', name: 'Frequência Respiratória', thresholdMax: 35, unit: 'irpm', alertLevel: 'red', description: 'Assincronia paciente-ventilador se FR > 35 irpm' },
        ],
        sources: [
            { id: 's1', authors: 'ARDS Definition Task Force, Ranieri VM et al.', year: 2012, title: 'Acute Respiratory Distress Syndrome: The Berlin Definition', journal: 'JAMA', doi: '10.1001/jama.2012.5669', type: 'guideline' },
            { id: 's2', authors: 'The Acute Respiratory Distress Syndrome Network (ARDSNet)', year: 2000, title: 'Ventilation with Lower Tidal Volumes as Compared with Traditional Tidal Volumes for ALI and ARDS', journal: 'NEJM', doi: '10.1056/NEJM200005043421801', type: 'rct' },
            { id: 's3', authors: 'Guérin C et al. (PROSEVA Trial)', year: 2013, title: 'Prone Positioning in Severe Acute Respiratory Distress Syndrome', journal: 'NEJM', doi: '10.1056/NEJMoa1214103', type: 'rct' },
            { id: 's4', authors: 'Amato MBP et al.', year: 2015, title: 'Driving Pressure and Survival in the Acute Respiratory Distress Syndrome', journal: 'NEJM', doi: '10.1056/NEJMsa1410639', type: 'rct' },
            { id: 's5', authors: 'Papazian L et al. (ACURASYS)', year: 2010, title: 'Neuromuscular Blockers in Early Acute Respiratory Distress Syndrome', journal: 'NEJM', doi: '10.1056/NEJMoa1005372', type: 'rct' },
            { id: 's6', authors: 'AMIB', year: 2013, title: 'Diretrizes Brasileiras de Ventilação Mecânica', journal: 'Associação de Medicina Intensiva Brasileira', type: 'guideline' },
        ],
    },
    {
        id: 'desmame',
        slug: 'desmame',
        name: 'Desmame',
        fullName: 'Desmame Ventilatório e Extubação',
        category: 'Ventilação Mecânica Invasiva',
        icd10: 'Z99.1',
        icf: 'b4401, e1151',
        evidenceLevel: '1B',
        definition:
            'Processo gradual ou abrupto de transferência do suporte ventilatório artificial para a ventilação espontânea, com objetivo final de extubação segura. Representa 40–50% do tempo total de ventilação mecânica.',
        diagnosticCriteria: [
            { id: 'dc1', type: 'required', domain: 'Causa Base', description: 'Resolução ou controle adequado da causa que motivou a intubação' },
            { id: 'dc2', type: 'required', domain: 'Hemodinâmica', description: 'Estabilidade hemodinâmica sem vasopressores (ou dopamina ≤ 5 mcg/kg/min)' },
            { id: 'dc3', type: 'required', domain: 'Oxigenação', description: 'SpO₂ ≥ 90% com FiO₂ ≤ 0.40 e PEEP ≤ 8 cmH₂O', threshold: 150, operator: '>=', unit: 'mmHg (P/F)' },
            { id: 'dc4', type: 'required', domain: 'Drive Respiratório', description: 'Paciente com drive respiratório ativo e esforço espontâneo identificável' },
            { id: 'dc5', type: 'required', domain: 'Nível de Sedação', description: 'RASS ≥ −1 (paciente acordado ou facilmente despertável)', },
            { id: 'dc6', type: 'required', domain: 'Metabolismo', description: 'Equilíbrio metabólico: pH ≥ 7.25, eletrólitos normais (K⁺, Na⁺, Mg²⁺)' },
            { id: 'dc7', type: 'optional', domain: 'Tosse', description: 'Tosse eficaz capaz de mobilizar secreções' },
            { id: 'dc8', type: 'optional', domain: 'Temperatura', description: 'Afebril (temperatura < 38.5°C)' },
        ],
        decisionFlow: [
            'Verificar Checklist de Prontidão completo (todos os critérios obrigatórios)',
            'Se checklist REPROVADO: otimizar fatores reversíveis e reavaliar em 24 horas',
            'Se checklist APROVADO: escolher modo do Teste de Respiração Espontânea (TRE)',
            'Modos do TRE: (A) Tubo T — fluxo livre, PEEP = 0, FiO₂ mantida | (B) PSV 5–7 cmH₂O + PEEP 0–5 cmH₂O',
            'Realizar TRE por 30 a 120 minutos com monitoração contínua',
            'Critérios de FALHA do TRE: FC > 140 bpm | PA sistólica < 90 ou > 180 mmHg | SpO₂ < 90% | FR > 35 irpm por > 5 min | uso de musculatura acessória / paradoxo abdominal | agitação, diaforese, alteração de consciência',
            'Se FALHA no TRE: retornar aos parâmetros ventilatórios prévios + investigar causa + aguardar 24h para nova tentativa',
            'Se SUCESSO no TRE: calcular Índice de Tobin (IRRS = FR / VT_L). Meta: IRRS < 105',
            'Medir PiMax (Pressão Inspiratória Máxima por oclusão 20–25s). Meta: PiMax ≤ −30 cmH₂O',
            'Avaliar proteção de via aérea: tosse efetiva + secreções manejáveis + nível de consciência',
            'Se proteção ADEQUADA: INDICAR EXTUBAÇÃO',
            'Se proteção INADEQUADA: considerar traqueostomia ou extubação com VNI imediata',
            'Pós-extubação: monitorar SpO₂ e FR por 2–4h. Considerar OAF (Oxigênio de Alto Fluxo) preventivo',
            'Se > 65 anos / DPOC / PaCO₂ pré-extubação > 45 mmHg: VNI pós-extubação por 24–48h',
        ],
        decisionNodes: {},
        targetParameters: [
            { id: 'tp1', name: 'IRRS (Índice de Tobin)', formula: 'IRRS = FR / VT(L)', thresholdMax: 105, unit: 'irpm/L', alertLevel: 'red', description: 'IRRS < 80 = sucesso provável | > 105 = falha provável | Tobin & Yang, NEJM 1991' },
            { id: 'tp2', name: 'PiMax (Pressão Inspir. Máxima)', thresholdMin: -30, unit: 'cmH₂O', alertLevel: 'yellow', description: 'Mais negativo que −30 cmH₂O indica força inspiratória adequada. Oclusão de via aérea por 20–25s.' },
            { id: 'tp3', name: 'SpO₂ durante TRE', thresholdMin: 90, unit: '%', alertLevel: 'red', description: 'SpO₂ < 90% por > 1 min = critério imediato de falha do TRE' },
            { id: 'tp4', name: 'Frequência Cardíaca', thresholdMax: 140, unit: 'bpm', alertLevel: 'yellow', description: 'FC > 140 bpm ou variação > 20% do basal = possível falha por sobrecarga cardiovascular' },
            { id: 'tp5', name: 'Frequência Respiratória', thresholdMax: 35, unit: 'irpm', alertLevel: 'red', description: 'FR > 35 irpm por > 5 minutos = critério de falha do TRE' },
            { id: 'tp6', name: 'Relação P/F (pré-TRE)', thresholdMin: 150, unit: 'mmHg', alertLevel: 'yellow', description: 'Pré-requisito para oferecer TRE — SpO₂ adequada com parâmetros reduzidos' },
        ],
        sources: [
            { id: 's1', authors: 'Boles JM et al., 6th International Consensus Conference', year: 2007, title: 'Weaning from mechanical ventilation', journal: 'European Respiratory Journal', doi: '10.1183/09031936.00010206', type: 'consensus' },
            { id: 's2', authors: 'Tobin MJ, Yang K', year: 1991, title: 'Role of the Respiratory Muscles in Acute Respiratory Failure', journal: 'NEJM', doi: '10.1056/NEJM199102073240606', type: 'review' },
            { id: 's3', authors: 'Esteban A et al.', year: 1995, title: 'A Comparison of Four Methods of Weaning Patients from Mechanical Ventilation', journal: 'NEJM', doi: '10.1056/NEJM199502093320501', type: 'rct' },
            { id: 's4', authors: 'AMIB', year: 2013, title: 'Diretrizes Brasileiras de Ventilação Mecânica', journal: 'Associação de Medicina Intensiva Brasileira', type: 'guideline' },
            { id: 's5', authors: 'Maggiore SM et al.', year: 2014, title: 'Noninvasive Ventilation after Failure of Prophylactic High-Flow Nasal Cannula Oxygen', journal: 'American Journal of Respiratory and Critical Care Medicine', doi: '10.1164/rccm.201312-2219OC', type: 'rct' },
        ],
    },
    {
        id: 'mobilizacao',
        slug: 'mobilizacao',
        name: 'Mobilização',
        fullName: 'Protocolo de Mobilização Precoce (FisioMobilize)',
        category: 'Fisioterapia Motora',
        icd10: 'Z51.8',
        icf: 'b710-b789',
        evidenceLevel: '1A',
        definition:
            'Conjunto de intervenções terapêuticas iniciadas nas primeiras 48h de admissão na UTI, visando reduzir as complicações da imobilidade, como fraqueza muscular adquirida (ICU-AW) e delírio, através de exercícios e progressão de carga funcional.',
        diagnosticCriteria: [
            { id: 'dc1', type: 'exclusion', domain: 'Hemodinâmica', description: 'PAM < 65 ou > 110 mmHg | Uso de DVA em doses crescentes/altas' },
            { id: 'dc2', type: 'exclusion', domain: 'Respiratório', description: 'SpO₂ < 88% | FR > 35 irpm | FiO₂ > 60% | PEEP > 12 cmH₂O' },
            { id: 'dc3', type: 'exclusion', domain: 'Neurológico', description: 'RASS < −2 ou > +2 | ECG < 8 | Hipertensão Intracraniana (HIC) não controlada' },
            { id: 'dc4', type: 'exclusion', domain: 'Outros', description: 'Frequência Cardíaca < 40 ou > 130 bpm | Arritmias graves instáveis' },
        ],
        decisionFlow: [
            'Verificar Critérios de Segurança (Sem critérios de exclusão ativos)',
            'Se critério de exclusão ativo: realizar APENAS Mobilização Passiva (cuidado: monitorar sinais vitais)',
            'Nível 1 (Acamado): Exercícios passivos / ativos assistidos no leito + posicionamento',
            'Nível 2 (Sentar no leito): Transferência para sedestação com apoio + exercícios de tronco',
            'Nível 3 (Sedestação fora do leito): Poltrona (mínimo 30 min) + exercícios ativos de MMSS/MMII',
            'Nível 4 (Ortostase): Ficar em pé (com ou sem auxílio de guincho/andador)',
            'Nível 5 (Deambulação): Caminhar (beira-leito ou corredor) + treino de marcha',
            'Monitorar durante a sessão: Borg (Cansaço) e Sinais Vitais. Interromper se queda de SpO₂ ou instabilidade.',
        ],
        decisionNodes: {},
        targetParameters: [
            { id: 'tp1', name: 'Escala RASS', thresholdMin: -2, thresholdMax: 1, unit: '', alertLevel: 'yellow', description: 'Janela ideal para cooperação e exercícios ativos' },
            { id: 'tp2', name: 'Escala de Borg', thresholdMax: 6, unit: '', alertLevel: 'yellow', description: 'Manter percepção de esforço moderada (4 a 6 na escala de 10)' },
            { id: 'tp3', name: 'SpO₂ durante exercício', thresholdMin: 88, unit: '%', alertLevel: 'red', description: 'Queda > 4% do basal ou < 88% indica necessidade de pausa' },
            { id: 'tp4', name: 'Frequência Cardíaca', thresholdMax: 130, unit: 'bpm', alertLevel: 'red', description: 'Evitar taquicardia excessiva durante mobilização ativa' },
        ],
        sources: [
            { id: 's1', authors: 'Hodgson CL et al.', year: 2014, title: 'Expert consensus and recommendations on safety criteria for active mobilization of mechanically ventilated critically ill adults', journal: 'Critical Care', type: 'consensus' },
            { id: 's2', authors: 'Schaller SJ et al.', year: 2016, title: 'Early, goal-directed mobilisation in the surgical intensive care unit', journal: 'The Lancet', type: 'rct' },
            { id: 's3', authors: 'Schweickert WD et al.', year: 2009, title: 'Early physical and occupational therapy in mechanically ventilated, critically ill patients', journal: 'The Lancet', type: 'rct' },
        ],
    },
];

