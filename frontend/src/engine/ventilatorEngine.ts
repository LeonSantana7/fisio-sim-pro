import type {
    VentilatorParams,
    PatientMechanics,
    SimPoint,
    AlertItem,
    DerivedMetrics,
} from '../types/ventilator';

const DT_MS = 5; // Resolução temporal: 5ms por amostra

/**
 * Gera as curvas de Pressão, Volume e Fluxo para o modo VCV
 * Equação do Movimento: P_aw(t) = V(t)/C_stat + R_aw * V̇(t) + PEEP - P_mus(t)
 */
export function generateVCVCurve(
    p: VentilatorParams,
    m: PatientMechanics,
    dt_ms: number = DT_MS
): SimPoint[] {
    const flow_l_s = p.flow_l_min / 60;
    const c_l = m.c_stat / 1000;           // Converter mL/cmH2O → L/cmH2O
    const tau = m.r_aw * c_l;              // Constante de tempo em segundos
    const t_cycle = 60 / p.fr;             // Duração do ciclo respiratório em s
    const t_pause = 0.1;                   // Pausa inspiratória fixa para platô
    const t_exp_start = p.t_insp + t_pause;
    const points: SimPoint[] = [];

    for (let t_ms = 0; t_ms <= t_cycle * 1000; t_ms += dt_ms) {
        const t = t_ms / 1000;
        let pressure: number, volume: number, flow: number;

        if (t <= p.t_insp) {
            // Fase inspiratória — fluxo constante (onda quadrada)
            volume = flow_l_s * t * 1000;      // mL
            flow = flow_l_s;
            pressure = (volume / m.c_stat) + m.r_aw * flow_l_s + p.peep - m.p_mus;
        } else if (t <= t_exp_start) {
            // Pausa inspiratória — fluxo zero, pressão = platô
            volume = p.vt_ml;
            flow = 0;
            pressure = (p.vt_ml / m.c_stat) + p.peep - m.p_mus;
        } else {
            // Fase expiratória — decaimento exponencial
            const te = t - t_exp_start;
            volume = p.vt_ml * Math.exp(-te / tau);        // mL
            flow = -(p.vt_ml / 1000) / tau * Math.exp(-te / tau); // L/s (negativo)
            pressure = p.peep;
        }

        points.push({
            t_ms: Math.round(t_ms),
            pressure: Math.round(pressure * 10) / 10,
            volume: Math.round(volume * 10) / 10,
            flow: Math.round(flow * 1000) / 1000,
        });
    }
    return points;
}

/**
 * Gera as curvas para o modo PCV
 * V(t) = C_stat * ΔP * (1 - e^(-t/τ))
 * V̇(t) = (ΔP/R_aw) * e^(-t/τ)
 */
export function generatePCVCurve(
    p: VentilatorParams,
    m: PatientMechanics,
    dt_ms: number = DT_MS
): SimPoint[] {
    const delta_p = p.p_insp;
    const c_l = m.c_stat / 1000;
    const tau = m.r_aw * c_l;
    const t_cycle = 60 / p.fr;
    const t_exp_start = p.t_insp;
    // Volume corrente atingido no modo PCV
    const vt_achieved_ml = m.c_stat * delta_p * (1 - Math.exp(-p.t_insp / tau));
    const points: SimPoint[] = [];

    for (let t_ms = 0; t_ms <= t_cycle * 1000; t_ms += dt_ms) {
        const t = t_ms / 1000;
        let pressure: number, volume: number, flow: number;

        if (t <= t_exp_start) {
            // Fase inspiratória — pressão constante, fluxo e volume em curva
            volume = m.c_stat * delta_p * (1 - Math.exp(-t / tau));
            flow = (delta_p / m.r_aw) * Math.exp(-t / tau);
            pressure = p.peep + delta_p;
        } else {
            // Fase expiratória — decaimento exponencial
            const te = t - t_exp_start;
            volume = vt_achieved_ml * Math.exp(-te / tau);
            flow = -(vt_achieved_ml / 1000) / tau * Math.exp(-te / tau);
            pressure = p.peep;
        }

        points.push({
            t_ms: Math.round(t_ms),
            pressure: Math.round(pressure * 10) / 10,
            volume: Math.round(volume * 10) / 10,
            flow: Math.round(flow * 1000) / 1000,
        });
    }
    return points;
}

/**
 * Calcula métricas derivadas — Pressão de Pico, Platô, Driving Pressure, τ
 */
export function calcDerivedMetrics(
    p: VentilatorParams,
    m: PatientMechanics
): DerivedMetrics {
    const flow_l_s = p.flow_l_min / 60;
    const c_l = m.c_stat / 1000;
    const tau = m.r_aw * c_l;
    const t_exp = 60 / p.fr - p.t_insp;
    const ie_insp = Math.round(p.t_insp * 10) / 10;
    const ie_exp = Math.round(t_exp * 10) / 10;
    const ie_ratio = `${ie_insp}:${ie_exp}`;

    if (p.mode === 'VCV') {
        const p_pico = p.vt_ml / m.c_stat + m.r_aw * flow_l_s + p.peep;
        const p_plat = p.vt_ml / m.c_stat + p.peep;
        const driving_pressure = p_plat - p.peep;
        return {
            p_pico: Math.round(p_pico * 10) / 10,
            p_plat: Math.round(p_plat * 10) / 10,
            driving_pressure: Math.round(driving_pressure * 10) / 10,
            tau: Math.round(tau * 1000) / 1000,
            ie_ratio,
            vol_minuto: Math.round((p.vt_ml * p.fr / 1000) * 10) / 10,
        };
    } else {
        // PCV — Volume Corrente calculado pela exponencial
        const vt_pcv = m.c_stat * p.p_insp * (1 - Math.exp(-p.t_insp / tau));
        const p_pico = p.peep + p.p_insp;
        const p_plat = vt_pcv / m.c_stat + p.peep;
        const driving_pressure = p.p_insp;
        return {
            p_pico: Math.round(p_pico * 10) / 10,
            p_plat: Math.round(p_plat * 10) / 10,
            driving_pressure: Math.round(driving_pressure * 10) / 10,
            tau: Math.round(tau * 1000) / 1000,
            ie_ratio,
            vol_minuto: Math.round((vt_pcv * p.fr / 1000) * 10) / 10,
            vt_achieved: Math.round(vt_pcv * 10) / 10,
        };
    }
}

/**
 * Gera alertas clínicos com base nas métricas calculadas
 */
export function calcAlerts(
    metrics: DerivedMetrics,
    p: VentilatorParams,
    m: PatientMechanics
): AlertItem[] {
    const alerts: AlertItem[] = [];

    if (metrics.p_plat > 30) {
        alerts.push({
            level: 'red',
            parameter: 'Pressão de Platô',
            message: 'P_plat > 30 cmH₂O — Risco elevado de Volutrauma',
            value: metrics.p_plat,
            threshold: 30,
        });
    } else if (metrics.p_plat > 25) {
        alerts.push({
            level: 'yellow',
            parameter: 'Pressão de Platô',
            message: 'P_plat > 25 cmH₂O — Atenção ao límite de segurança',
            value: metrics.p_plat,
            threshold: 25,
        });
    }

    if (metrics.driving_pressure > 15) {
        alerts.push({
            level: 'red',
            parameter: 'Driving Pressure',
            message: 'ΔP > 15 cmH₂O — Associado a maior mortalidade na SDRA',
            value: metrics.driving_pressure,
            threshold: 15,
        });
    } else if (metrics.driving_pressure > 13) {
        alerts.push({
            level: 'yellow',
            parameter: 'Driving Pressure',
            message: 'ΔP > 13 cmH₂O — Próximo ao limite de segurança',
            value: metrics.driving_pressure,
            threshold: 13,
        });
    }

    if (metrics.p_pico > 40) {
        alerts.push({
            level: 'red',
            parameter: 'Pressão de Pico',
            message: 'P_pico > 40 cmH₂O — Verificar obstrução ou broncoespasmo',
            value: metrics.p_pico,
            threshold: 40,
        });
    }

    if (metrics.tau > 0.9) {
        alerts.push({
            level: 'yellow',
            parameter: 'Constante de Tempo (τ)',
            message: `τ = ${metrics.tau}s — Risco de Auto-PEEP (expiração incompleta)`,
            value: metrics.tau,
            threshold: 0.9,
        });
    }

    const t_exp = 60 / p.fr - p.t_insp;
    if (t_exp < 2 * metrics.tau) {
        alerts.push({
            level: 'red',
            parameter: 'Auto-PEEP',
            message: `T_exp (${t_exp.toFixed(2)}s) < 2τ (${(2 * metrics.tau).toFixed(2)}s) — Auto-PEEP confirmado!`,
            value: t_exp,
            threshold: 2 * metrics.tau,
        });
    }

    if (metrics.vol_minuto < 4) {
        alerts.push({
            level: 'yellow',
            parameter: 'Volume Minuto',
            message: 'V̇E < 4 L/min — Hipoventilação potencial',
            value: metrics.vol_minuto,
            threshold: 4,
        });
    } else if (metrics.vol_minuto > 15) {
        alerts.push({
            level: 'yellow',
            parameter: 'Volume Minuto',
            message: 'V̇E > 15 L/min — Hiperventilação potencial',
            value: metrics.vol_minuto,
            threshold: 15,
        });
    }

    const vt_pcv = metrics.vt_achieved ?? p.vt_ml;
    if (vt_pcv / m.c_stat < 2) {
        alerts.push({
            level: 'green',
            parameter: 'Estado Ventilatório',
            message: 'Parâmetros dentro da faixa protetora de ventilação',
            value: 0,
            threshold: 0,
        });
    }

    return alerts;
}

export function generateCurve(p: VentilatorParams, m: PatientMechanics): SimPoint[] {
    return p.mode === 'VCV' ? generateVCVCurve(p, m) : generatePCVCurve(p, m);
}
