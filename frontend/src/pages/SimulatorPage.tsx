import { useState, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { AlertTriangle, CheckCircle, Info, Wind, Sliders, Activity } from 'lucide-react';
import type { VentilatorParams, PatientMechanics } from '../types/ventilator';
import {
    generateCurve, calcDerivedMetrics, calcAlerts,
} from '../engine/ventilatorEngine';
import { clinicalScenarios } from '../data/scenarios';

const DEFAULT_PARAMS: VentilatorParams = {
    mode: 'VCV', vt_ml: 450, fr: 14, flow_l_min: 40,
    peep: 5, p_insp: 15, t_insp: 1.0, fio2: 35,
    psv_cmh2o: 12, esens: 25,
};
const DEFAULT_MECH: PatientMechanics = {
    c_stat: 60, r_aw: 10, p_mus: 0,
    double_trigger: false, ineffective_effort: false
};

function SliderRow({
    label, unit, value, min, max, step, onChange,
}: {
    label: string; unit: string; value: number;
    min: number; max: number; step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="form-group">
            <label className="form-label">
                {label}
                <span className="form-label-value">{value} {unit}</span>
            </label>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(10,25,41,0.95)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
            <div style={{ color: '#64748b', marginBottom: 4 }}>t = {label}ms</div>
            {payload.map((p: any) => (
                <div key={p.name} style={{ color: p.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                    {p.value?.toFixed(2)} {p.unit}
                </div>
            ))}
        </div>
    );
};

export default function SimulatorPage() {
    const [params, setParams] = useState<VentilatorParams>(DEFAULT_PARAMS);
    const [mech, setMech] = useState<PatientMechanics>(DEFAULT_MECH);
    const [activeScenario, setActiveScenario] = useState('normal');

    const updateParam = useCallback((key: keyof VentilatorParams, val: number | string) => {
        setParams(prev => ({ ...prev, [key]: val }));
    }, []);
    const updateMech = useCallback((key: keyof PatientMechanics, val: number) => {
        setMech(prev => ({ ...prev, [key]: val }));
    }, []);

    const applyScenario = useCallback((id: string) => {
        const sc = clinicalScenarios.find(s => s.id === id);
        if (!sc) return;
        setActiveScenario(id);
        setMech(sc.mechanics);
        setParams(prev => ({ ...prev, ...sc.defaultParams }));
    }, []);

    // Calcular curvas e métricas
    const points = generateCurve(params, mech);
    const metrics = calcDerivedMetrics(params, mech);
    const alerts = calcAlerts(metrics, params, mech);

    const alertIcon = (level: string) => {
        if (level === 'red') return <AlertTriangle size={14} className="alert-badge__icon" />;
        if (level === 'yellow') return <Info size={14} className="alert-badge__icon" />;
        return <CheckCircle size={14} className="alert-badge__icon" />;
    };

    const metricColor = (val: number, danger: number, warning?: number) => {
        if (val >= danger) return 'danger';
        if (warning && val >= warning) return 'warning';
        return 'success';
    };

    // Downsample para performance no chart (max 400 pts)
    const stride = Math.max(1, Math.floor(points.length / 400));
    const chartData = points.filter((_, i) => i % stride === 0);


    return (
        <div className="simulator-grid">
            {/* ── COLUNA ESQUERDA: Controles ── */}
            <div className="simulator-left">
                {/* Modo Ventilatório */}
                <div className="card">
                    <div className="card__title"><Wind size={14} />Modo Ventilatório</div>
                    <div className="mode-switch">
                        {(['VCV', 'PCV', 'PSV'] as const).map(m => (
                            <button key={m} className={`mode-btn${params.mode === m ? ' active' : ''}`}
                                onClick={() => updateParam('mode', m)}>{m}</button>
                        ))}
                    </div>
                    {params.mode === 'VCV' && (
                        <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
                            Onda de Fluxo: Quadrada (constante)
                        </div>
                    )}
                    {params.mode === 'PCV' && (
                        <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
                            Pressão: Constante — Fluxo: Exponencial Decrescente
                        </div>
                    )}
                    {params.mode === 'PSV' && (
                        <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
                            Modo Espontâneo: Ciclado a Fluxo (% do Pico)
                        </div>
                    )}
                </div>

                {/* Cenários Rápidos */}
                <div className="card">
                    <div className="card__title"><Activity size={14} />Cenários Clínicos</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {clinicalScenarios.map(sc => (
                            <button key={sc.id}
                                className={`btn-scenario${activeScenario === sc.id ? ' active' : ''}`}
                                onClick={() => applyScenario(sc.id)}
                            >
                                {sc.condition === 'normal' && '🫁 '}
                                {sc.condition === 'sdra' && '🔴 '}
                                {sc.condition === 'dpoc' && '🟡 '}
                                {sc.name}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: 10, padding: '8px', background: 'rgba(14,165,233,0.06)', borderRadius: 8, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
                        {clinicalScenarios.find(s => s.id === activeScenario)?.expectedBehavior}
                    </div>
                </div>

                {/* Parâmetros do Ventilador */}
                <div className="card">
                    <div className="card__title"><Sliders size={14} />Painel do Ventilador</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {params.mode === 'VCV' && (
                            <>
                                <SliderRow label="Volume Corrente (VT)" unit="mL" value={params.vt_ml} min={200} max={800} step={10} onChange={v => updateParam('vt_ml', v)} />
                                <SliderRow label="Fluxo Inspiratório" unit="L/min" value={params.flow_l_min} min={20} max={80} step={5} onChange={v => updateParam('flow_l_min', v)} />
                            </>
                        )}
                        {params.mode === 'PCV' && (
                            <SliderRow label="ΔP Inspiratória" unit="cmH₂O" value={params.p_insp} min={5} max={40} step={1} onChange={v => updateParam('p_insp', v)} />
                        )}
                        {params.mode === 'PSV' && (
                            <>
                                <SliderRow label="P. Suporte (PS)" unit="cmH₂O" value={params.psv_cmh2o || 12} min={5} max={30} step={1} onChange={v => updateParam('psv_cmh2o', v)} />
                                <SliderRow label="Sensib. Expiratória (Esens)" unit="%" value={params.esens || 25} min={5} max={70} step={5} onChange={v => updateParam('esens', v)} />
                            </>
                        )}
                        <SliderRow label={params.mode === 'PSV' ? "FR Manual (Backup)" : "Frequência Respiratória"} unit="irpm" value={params.fr} min={8} max={35} step={1} onChange={v => updateParam('fr', v)} />
                        {params.mode !== 'PSV' && (
                            <SliderRow label="Tempo Inspiratório (Ti)" unit="s" value={params.t_insp} min={0.3} max={1.5} step={0.05} onChange={v => updateParam('t_insp', v)} />
                        )}
                        <SliderRow label="PEEP" unit="cmH₂O" value={params.peep} min={0} max={20} step={1} onChange={v => updateParam('peep', v)} />
                        <SliderRow label="FiO₂" unit="%" value={params.fio2} min={21} max={100} step={1} onChange={v => updateParam('fio2', v)} />
                    </div>
                </div>

                {/* Assincronias e Esforço */}
                <div className="card">
                    <div className="card__title">⚡ Assincronias e Esforço</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <SliderRow label="Esforço Muscular (P_mus)" unit="cmH₂O" value={mech.p_mus} min={0} max={20} step={1} onChange={v => updateMech('p_mus', v)} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(239,68,68,0.05)', borderRadius: 8 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171' }}>Duplo Disparo</span>
                            <input
                                type="checkbox"
                                checked={!!mech.double_trigger}
                                onChange={(e) => updateMech('double_trigger', e.target.checked ? 1 : 0)}
                                style={{ accentColor: '#ef4444' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(239,68,68,0.05)', borderRadius: 8 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171' }}>Esforço Ineficaz</span>
                            <input
                                type="checkbox"
                                checked={!!mech.ineffective_effort}
                                onChange={(e) => updateMech('ineffective_effort', e.target.checked ? 1 : 0)}
                                style={{ accentColor: '#f87171' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Mecânica Pulmonar */}
                <div className="card">
                    <div className="card__title">🫁 Mecânica Pulmonar (Paciente)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <SliderRow label="Complacência Estática (C_stat)" unit="mL/cmH₂O" value={mech.c_stat} min={10} max={100} step={5} onChange={v => updateMech('c_stat', v)} />
                        <SliderRow label="Resistência de VA (R_aw)" unit="cmH₂O/L/s" value={mech.r_aw} min={5} max={50} step={5} onChange={v => updateMech('r_aw', v)} />
                    </div>
                </div>
            </div>

            {/* ── COLUNA CENTRAL: Gráficos ── */}
            <div className="simulator-center">
                {/* Pressão × Tempo */}
                <div className="chart-container">
                    <div className="chart-header">
                        <div className="chart-title">
                            <span className="chart-color-dot" style={{ background: '#38bdf8' }} />
                            Pressão × Tempo
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#38bdf8' }}>
                            cmH₂O
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" />
                            <XAxis dataKey="t_ms" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}ms`} />
                            <YAxis tick={{ fill: '#475569', fontSize: 10 }} domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={30} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" label={{ value: 'P_plat limit', fill: '#ef4444', fontSize: 9 }} />
                            <Line type="monotone" dataKey="pressure" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Volume × Tempo */}
                <div className="chart-container">
                    <div className="chart-header">
                        <div className="chart-title">
                            <span className="chart-color-dot" style={{ background: '#4ade80' }} />
                            Volume × Tempo
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#4ade80' }}>mL</span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.08)" />
                            <XAxis dataKey="t_ms" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}ms`} />
                            <YAxis tick={{ fill: '#475569', fontSize: 10 }} domain={[0, 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="volume" stroke="#4ade80" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Fluxo × Tempo */}
                <div className="chart-container">
                    <div className="chart-header">
                        <div className="chart-title">
                            <span className="chart-color-dot" style={{ background: '#f59e0b' }} />
                            Fluxo × Tempo
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#f59e0b' }}>L/s</span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.08)" />
                            <XAxis dataKey="t_ms" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}ms`} />
                            <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                            <Line type="monotone" dataKey="flow" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Equação do Movimento */}
                <div className="card" style={{ background: 'rgba(14,165,233,0.04)' }}>
                    <div className="card__title">⚙️ Equação do Movimento</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.8 }}>
                        <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: 4 }}>P_aw(t) = V(t)/C_stat + R_aw × V̇(t) + PEEP − P_mus(t)</div>
                        <div>= {params.mode === 'VCV' ? `V(t)/${mech.c_stat}` : `${mech.c_stat} × ${params.p_insp} × (1 − e^(−t/τ))`} + {mech.r_aw} × V̇ + {params.peep} − {mech.p_mus}</div>
                        <div style={{ marginTop: 8, color: '#64748b', fontSize: '0.72rem' }}>τ (constante de tempo) = R_aw × C_stat = {mech.r_aw} × {(mech.c_stat / 1000).toFixed(3)} = <strong style={{ color: '#f59e0b' }}>{metrics.tau.toFixed(3)}s</strong></div>
                    </div>
                </div>
            </div>

            {/* ── COLUNA DIREITA: Métricas + Alertas ── */}
            <div className="simulator-right">
                {/* Métricas Derivadas */}
                <div className="card card--elevated">
                    <div className="card__title">📊 Métricas Calculadas</div>
                    <div className="metric-grid">
                        <div className={`metric-tile ${metricColor(metrics.p_pico, 40, 30)}`}>
                            <div className="metric-tile__label">P. Pico</div>
                            <div className="metric-tile__value">{metrics.p_pico.toFixed(1)}</div>
                            <div className="metric-tile__unit">cmH₂O</div>
                        </div>
                        <div className={`metric-tile ${metricColor(metrics.p_plat, 30, 25)}`}>
                            <div className="metric-tile__label">P. Platô</div>
                            <div className="metric-tile__value">{metrics.p_plat.toFixed(1)}</div>
                            <div className="metric-tile__unit">cmH₂O</div>
                        </div>
                        <div className={`metric-tile ${metricColor(metrics.driving_pressure, 15, 13)}`}>
                            <div className="metric-tile__label">Driving ΔP</div>
                            <div className="metric-tile__value">{metrics.driving_pressure.toFixed(1)}</div>
                            <div className="metric-tile__unit">cmH₂O</div>
                        </div>
                        <div className={`metric-tile ${metricColor(metrics.tau, 1.5, 0.9)}`}>
                            <div className="metric-tile__label">Tau (τ)</div>
                            <div className="metric-tile__value">{metrics.tau.toFixed(2)}</div>
                            <div className="metric-tile__unit">segundos</div>
                        </div>
                        <div className="metric-tile">
                            <div className="metric-tile__label">I:E Ratio</div>
                            <div className="metric-tile__value" style={{ fontSize: '1.1rem' }}>{metrics.ie_ratio}</div>
                            <div className="metric-tile__unit">s</div>
                        </div>
                        <div className="metric-tile">
                            <div className="metric-tile__label">Vol. Minuto</div>
                            <div className="metric-tile__value">{metrics.vol_minuto.toFixed(1)}</div>
                            <div className="metric-tile__unit">L/min</div>
                        </div>
                    </div>
                    {params.mode === 'PCV' && metrics.vt_achieved !== undefined && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(6,182,212,0.08)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: '0.82rem', color: '#67e8f9' }}>
                            VT (PCV atingido): <strong>{metrics.vt_achieved.toFixed(1)} mL</strong>
                        </div>
                    )}
                </div>

                {/* Alertas Clínicos */}
                <div className="card">
                    <div className="card__title">🚨 Alertas Clínicos</div>
                    {alerts.length === 0 ? (
                        <div className="alert-badge green">
                            <CheckCircle size={14} className="alert-badge__icon" />
                            <div>
                                <span className="alert-badge__param">Parâmetros Seguros</span>
                                <span className="alert-badge__msg">Todos os indicadores dentro das faixas protetoras</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {alerts.map((a, i) => (
                                <div key={i} className={`alert-badge ${a.level}`}>
                                    {alertIcon(a.level)}
                                    <div>
                                        <span className="alert-badge__param">{a.parameter}</span>
                                        <span className="alert-badge__msg">{a.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tabela PEEP/FiO2 ARDSNet */}
                <div className="card">
                    <div className="card__title">📋 Tabela ARDSNet PEEP/FiO₂</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                        <thead>
                            <tr>
                                <th style={{ color: '#64748b', textAlign: 'left', padding: '4px 6px', fontWeight: 700 }}>FiO₂</th>
                                <th style={{ color: '#64748b', textAlign: 'right', padding: '4px 6px', fontWeight: 700 }}>PEEP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { fio2: '0.30', peep: '5' }, { fio2: '0.40', peep: '5–8' },
                                { fio2: '0.50', peep: '8–10' }, { fio2: '0.60', peep: '10' },
                                { fio2: '0.70', peep: '10–14' }, { fio2: '0.80', peep: '14' },
                                { fio2: '0.90', peep: '14–16' }, { fio2: '1.00', peep: '18–24' },
                            ].map(row => {
                                const fVal = parseFloat(row.fio2) * 100;
                                const isActive = Math.abs(fVal - params.fio2) < 5;
                                return (
                                    <tr key={row.fio2} style={{ background: isActive ? 'rgba(14,165,233,0.1)' : 'transparent' }}>
                                        <td style={{ padding: '4px 6px', color: isActive ? '#38bdf8' : '#94a3b8', fontFamily: 'JetBrains Mono', fontWeight: isActive ? 700 : 400 }}>{row.fio2}</td>
                                        <td style={{ padding: '4px 6px', textAlign: 'right', color: isActive ? '#38bdf8' : '#94a3b8', fontFamily: 'JetBrains Mono', fontWeight: isActive ? 700 : 400 }}>{row.peep} cmH₂O</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#475569' }}>Linha em destaque = FiO₂ atual selecionada</div>
                </div>
            </div>
        </div>
    );
}
