import { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, AlertTriangle, ExternalLink, FileText, Star } from 'lucide-react';
import { protocols } from '../data/protocols';
import type { ClinicalProtocol } from '../data/protocols';

export default function ProtocolsPage() {
    const [activeId, setActiveId] = useState('sdra');
    const [activeTab, setActiveTab] = useState<'criteria' | 'flow' | 'targets' | 'sources'>('criteria');

    useEffect(() => {
        const main = document.querySelector('.main-content');
        if (main) main.scrollTop = 0;
        window.scrollTo(0, 0);
    }, [activeId]);

    const protocol = protocols.find(p => p.id === activeId) as ClinicalProtocol;

    const tabItems = [
        { id: 'criteria', label: 'Diagnóstico', icon: '🔍' },
        { id: 'flow', label: 'Fluxo Conduta', icon: '🔀' },
        { id: 'targets', label: 'Parâmetros-Alvo', icon: '🎯' },
        { id: 'sources', label: 'Fontes', icon: '📚' },
    ] as const;

    const typeLabel = (t: string) =>
        t === 'required' ? '★ Obrig.' : t === 'optional' ? '◉ Opcion.' : '✕ Exclusão';
    const typeClass = (t: string) =>
        t === 'required' ? 'required' : t === 'optional' ? 'optional' : 'exclusion';

    return (
        <div className="protocols-page">

            {/* ── Seletor de protocolo (linha scrollável) ── */}
            <div className="proto-selector">
                {protocols.map(p => (
                    <button
                        key={p.id}
                        className={`proto-selector__btn${activeId === p.id ? ' active' : ''}`}
                        onClick={() => { setActiveId(p.id); setActiveTab('criteria'); }}
                    >
                        {p.id === 'sdra' ? '🫁' : '💨'}
                        <span>{p.name}</span>
                    </button>
                ))}
            </div>

            {/* ── Header ── */}
            <div className="card proto-header">
                <div className="proto-header__badges">
                    <span className="evidence-badge">Nível {protocol.evidenceLevel}</span>
                    <span className="proto-tag">CID-10: {protocol.icd10}</span>
                    {protocol.icf && <span className="proto-tag">CIF: {protocol.icf}</span>}
                    <span className="proto-tag proto-tag--blue">{protocol.category}</span>
                </div>
                <h2 className="proto-header__title">{protocol.fullName}</h2>
                <p className="proto-header__def">{protocol.definition}</p>
            </div>

            {/* ── Tabs ── */}
            <div className="proto-tabs">
                {tabItems.map(t => (
                    <button
                        key={t.id}
                        className={`proto-tab-btn${activeTab === t.id ? ' active' : ''}`}
                        onClick={() => setActiveTab(t.id)}
                    >
                        <span className="proto-tab-btn__icon">{t.icon}</span>
                        <span className="proto-tab-btn__label">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* ── CRITÉRIOS DIAGNÓSTICOS ── */}
            {activeTab === 'criteria' && (
                <div className="card">
                    <div className="card__title"><BookOpen size={14} />Critérios Diagnósticos</div>

                    {/* Cards em vez de tabela no mobile */}
                    <div className="criteria-cards">
                        {protocol.diagnosticCriteria.map(c => (
                            <div key={c.id} className="criteria-card">
                                <div className="criteria-card__top">
                                    <span className={`criteria-type-badge ${typeClass(c.type)}`}>
                                        {typeLabel(c.type)}
                                    </span>
                                    <span className="criteria-card__domain">{c.domain}</span>
                                </div>
                                <div className="criteria-card__desc">
                                    {c.description}
                                    {c.unit && (
                                        <span className="criteria-card__value">
                                            {' '}{c.operator} {c.threshold} {c.unit}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Classificação Berlim — P/F */}
                    {protocol.id === 'sdra' && (
                        <div style={{ marginTop: 20 }}>
                            <div className="section-divider">Classificação de Berlim — P/F Ratio</div>
                            <div className="berlin-grid">
                                {[
                                    { label: 'Leve', range: '200–300', color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)' },
                                    { label: 'Moderada', range: '100–200', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
                                    { label: 'Grave', range: '≤ 100', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
                                ].map(s => (
                                    <div key={s.label} className="berlin-card" style={{ background: s.bg, borderColor: s.border }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: s.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 800, color: s.color }}>P/F {s.range}</div>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 4 }}>mmHg (PEEP≥5)</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── FLUXO DE CONDUTA ── */}
            {activeTab === 'flow' && (
                <div className="card">
                    <div className="card__title"><ChevronRight size={14} />Algoritmo de Conduta Fisioterapêutica</div>
                    <div className="proto-source-note">
                        <AlertTriangle size={12} color="#f59e0b" />
                        Baseado em: {protocol.sources.filter(s => s.type === 'guideline').map(s => `${s.authors.split(',')[0]} ${s.year}`).join(', ')}
                    </div>
                    <div className="decision-flow">
                        {protocol.decisionFlow.map((step, i) => {
                            const isDanger = /falha|retornar|grave/i.test(step);
                            const isSuccess = /extubação|indica|sucesso/i.test(step);
                            const isWarning = /atenção|peep|se p\/f/i.test(step);
                            return (
                                <div key={i} className={`decision-step ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
                                    <div className="decision-step__number">{i + 1}</div>
                                    <div className="decision-step__content">
                                        {step}
                                        {isSuccess && <div className="decision-step__tag tag-success">✓ Ação Recomendada</div>}
                                        {isDanger && <div className="decision-step__tag tag-danger">⚠ Critério Crítico</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── PARÂMETROS-ALVO ── */}
            {activeTab === 'targets' && (
                <div className="card">
                    <div className="card__title">🎯 Parâmetros-Alvo e Metas Clínicas</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {protocol.targetParameters.map(tp => (
                            <div key={tp.id} className="param-row">
                                <div className="param-row__left">
                                    <div className="param-row__name">{tp.name}</div>
                                    {tp.formula && <div className="param-row__formula">{tp.formula}</div>}
                                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4, lineHeight: 1.5 }}>{tp.description}</div>
                                </div>
                                <div style={{ textAlign: 'right', marginLeft: 16, flexShrink: 0 }}>
                                    <div className="param-row__value" style={{ color: tp.alertLevel === 'red' ? '#fca5a5' : tp.alertLevel === 'yellow' ? '#fde047' : '#86efac' }}>
                                        {tp.thresholdMin !== undefined && tp.thresholdMax !== undefined
                                            ? `${tp.thresholdMin}–${tp.thresholdMax}`
                                            : tp.thresholdMax !== undefined
                                                ? `≤ ${tp.thresholdMax}`
                                                : `≥ ${tp.thresholdMin}`
                                        } {tp.unit}
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                        <span className={`param-row__indicator ${tp.alertLevel}`} style={{ display: 'inline-block' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── FONTES CIENTÍFICAS ── */}
            {activeTab === 'sources' && (
                <div className="card">
                    <div className="card__title"><Star size={14} />Fontes Científicas e Guidelines</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {protocol.sources.map(s => (
                            <div key={s.id} className="source-card">
                                <div>
                                    <span className={`source-type-badge ${s.type}`}>
                                        {s.type === 'guideline' ? 'Diretriz' : s.type === 'rct' ? 'RCT' : s.type === 'meta-analysis' ? 'Meta-Análise' : s.type === 'consensus' ? 'Consenso' : 'Revisão'}
                                    </span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="source-card__title">{s.title}</div>
                                    <div className="source-card__meta">{s.authors} — <em>{s.journal}</em>, {s.year}</div>
                                    {s.doi && <div className="source-card__doi">DOI: {s.doi}</div>}
                                </div>
                                {s.doi && (
                                    <a href={`https://doi.org/${s.doi}`} target="_blank" rel="noopener noreferrer"
                                        style={{ color: '#38bdf8', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="proto-disclaimer">
                        <FileText size={12} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>As condutas são baseadas nas evidências mais robustas. Adapte ao contexto clínico individual. Este app não substitui o julgamento clínico profissional.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
