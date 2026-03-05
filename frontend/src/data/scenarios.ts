import type { ClinicalScenario } from '../types/ventilator';

export const clinicalScenarios: ClinicalScenario[] = [
    {
        id: 'normal',
        name: 'Pulmão Normal',
        description: 'Pós-operatório / Paciente sem patologia pulmonar significativa',
        condition: 'normal',
        mechanics: { c_stat: 60, r_aw: 10, p_mus: 0 },
        defaultParams: { mode: 'VCV', vt_ml: 450, fr: 14, flow_l_min: 40, peep: 5, p_insp: 15, t_insp: 1.0, fio2: 35 },
        expectedBehavior: 'Pressão de pico baixa (~20 cmH₂O). Fluxo expiratório retorna à base rapidamente (τ = 0.6s). Curvas simétricas e estáveis.',
    },
    {
        id: 'sdra',
        name: 'SDRA Grave',
        description: 'Síndrome do Desconforto Respiratório Agudo - Pulmão "duro" com baixa complacência',
        condition: 'sdra',
        mechanics: { c_stat: 25, r_aw: 15, p_mus: 0 },
        defaultParams: { mode: 'VCV', vt_ml: 380, fr: 20, flow_l_min: 40, peep: 10, p_insp: 18, t_insp: 0.8, fio2: 60 },
        expectedBehavior: 'Pressão de pico elevada em VCV (>35 cmH₂O). Driving Pressure alta. Alertas de volutrauma ativos. Complacência muito reduzida (25 mL/cmH₂O).',
    },
    {
        id: 'dpoc',
        name: 'DPOC / Obstrução',
        description: 'Doença Pulmonar Obstrutiva Crônica exacerbada - Alta resistência de vias aéreas',
        condition: 'dpoc',
        mechanics: { c_stat: 65, r_aw: 30, p_mus: 0 },
        defaultParams: { mode: 'VCV', vt_ml: 480, fr: 14, flow_l_min: 40, peep: 5, p_insp: 15, t_insp: 0.9, fio2: 28 },
        expectedBehavior: 'Fluxo expiratório muito prolongado (τ = 1.95s). Risco de Auto-PEEP evidente — expiração incompleta antes do próximo ciclo. Pressão de pico alta por R_aw elevada.',
    },
];
