import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, ChevronRight, Star, Search, Calculator as CalcIcon, Copy, Check, StarOff } from 'lucide-react';
import { calculators, clinicalScales, calculatorCategories } from '../data/calculators';
import type { Calculator } from '../types/calculators';
import type { ClinicalScale } from '../data/calculators';
import { useDevice } from '../hooks/useDevice';
import { historyService, favoriteService } from '../services/api';

// ─── COMPONENTE COPIAR ───────────────────────────────────────────
function CopyButton({ label, onCopy }: { label: string; onCopy?: () => void }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(`[FisioSim] ${label}`);
        setCopied(true);
        if (onCopy) onCopy();
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button className="copy-btn" onClick={handleCopy}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copiado!' : 'Copiar Resultado'}
        </button>
    );
}

// ─── MODAL DE CALCULADORA ────────────────────────────────────────
function CalculatorModal({ calc, onClose, onShowToast }: { calc: Calculator; onClose: () => void; onShowToast: (msg: string) => void }) {
    const { deviceKey } = useDevice();
    const [values, setValues] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {};
        calc.fields.forEach(f => { init[f.key] = Number(f.defaultValue ?? 0); });
        return init;
    });

    const result = useMemo(() => {
        try { return calc.calculate(values); } catch { return null; }
    }, [values, calc]);

    const saveToHistory = useCallback(async () => {
        if (!result || !deviceKey) return;
        if (!navigator.onLine) {
            onShowToast('Sem internet: o cálculo não foi salvo.');
            return;
        }
        try {
            await historyService.add({
                deviceKey,
                toolId: calc.id,
                toolType: 'calculator',
                inputValues: values,
                resultValue: String(result.value),
                resultUnit: result.unit,
                resultLevel: result.level,
                interpretation: result.interpretation,
            });
        } catch (e) { console.error('History error', e); }
    }, [result, deviceKey, calc.id, values, onShowToast]);

    const levelColors: Record<string, string> = {
        normal: '#4ade80', mild: '#facc15', moderate: '#fb923c',
        severe: '#f87171', critical: '#e11d48',
    };
    const levelBg: Record<string, string> = {
        normal: 'rgba(74,222,128,0.1)', mild: 'rgba(250,204,21,0.1)',
        moderate: 'rgba(251,146,60,0.1)', severe: 'rgba(248,113,113,0.1)',
        critical: 'rgba(225,29,72,0.1)',
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                        <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{calc.icon}</span>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38bdf8', marginBottom: 2 }}>Calculadora</div>
                            <h3 style={{ lineHeight: 1.3 }}>{calc.name}</h3>
                            <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#64748b' }}>{calc.description}</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body">
                    <div className="modal-formula">
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 6 }}>Fórmula</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: '#38bdf8', whiteSpace: 'pre-line', lineHeight: 1.8 }}>{calc.formula}</div>
                    </div>

                    <div className="modal-inputs">
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 12 }}>Inserir Dados Clínicos</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {calc.fields.map(f => (
                                <div key={f.key} className="form-group">
                                    <label className="form-label">
                                        {f.label} {f.unit && <span style={{ color: '#64748b' }}>({f.unit})</span>}
                                        <span className="form-label-value">
                                            {f.type === 'select'
                                                ? f.options?.find(o => o.value === values[f.key])?.label
                                                : `${values[f.key]} ${f.unit ?? ''}`}
                                        </span>
                                    </label>
                                    {f.type === 'select' ? (
                                        <select
                                            className="select"
                                            value={values[f.key]}
                                            onChange={e => setValues(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                                        >
                                            {f.options?.map(o => (
                                                <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="range"
                                            min={f.min} max={f.max} step={f.step ?? 1}
                                            value={values[f.key]}
                                            onChange={e => setValues(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                                        />
                                    )}
                                </div>
                            ))}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {calc.fields.map(f => f.type === 'number' && (
                                    <div key={`num_${f.key}`}>
                                        <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: 4 }}>{f.label}</label>
                                        <input
                                            type="number" min={f.min} max={f.max} step={f.step}
                                            value={values[f.key]}
                                            onChange={e => setValues(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                                            style={{
                                                width: '100%', background: 'var(--bg-input)',
                                                border: '1px solid var(--border-light)', borderRadius: 8,
                                                color: '#f0f9ff', padding: '8px 10px',
                                                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', outline: 'none',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {result && (
                        <div className="modal-result" style={{
                            background: levelBg[result.level ?? 'normal'],
                            borderColor: levelColors[result.level ?? 'normal'] + '50',
                        }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 8 }}>Resultado</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                                <span style={{
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '2.5rem', fontWeight: 800,
                                    color: levelColors[result.level ?? 'normal'],
                                    lineHeight: 1,
                                }}>{result.value}</span>
                                {result.unit && <span style={{ color: '#94a3b8', fontSize: '1rem' }}>{result.unit}</span>}
                            </div>
                            {result.interpretation && (
                                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                                    {result.interpretation}
                                </div>
                            )}
                            {result.extra && Object.keys(result.extra).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                    {Object.entries(result.extra).map(([k, v]) => (
                                        <div key={k} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px', fontSize: '0.78rem' }}>
                                            <span style={{ color: '#64748b' }}>{k}: </span>
                                            <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {calc.references && (
                        <div style={{ padding: '0 20px 12px', fontSize: '0.72rem', color: '#475569' }}>
                            📚 {calc.references.join(' | ')}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {result ? (
                        <CopyButton
                            label={`${calc.name}: ${result.value} ${result.unit ?? ''} — ${result.interpretation ?? ''}`}
                            onCopy={saveToHistory}
                        />
                    ) : (
                        <div style={{ height: 16 }} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── MODAL DE ESCALA CLÍNICA ─────────────────────────────────────
function ScaleModal({ scale, onClose, onShowToast }: { scale: ClinicalScale; onClose: () => void; onShowToast: (msg: string) => void }) {
    const { deviceKey } = useDevice();
    const [selected, setSelected] = useState<Record<string, number>>({});
    const total = Object.values(selected).reduce((a, b: any) => a + b, 0);
    const hasAll = scale.groups.every(g => selected[g.key] !== undefined);
    const result = hasAll ? scale.interpret(total) : null;

    const saveToHistory = useCallback(async () => {
        if (!result || !deviceKey) return;
        if (!navigator.onLine) {
            onShowToast('Sem internet: o cálculo não foi salvo.');
            return;
        }
        try {
            await historyService.add({
                deviceKey,
                toolId: scale.id,
                toolType: 'scale',
                inputValues: selected,
                resultValue: String(total),
                resultUnit: 'pts',
                resultLevel: result.level,
                interpretation: result.text,
            });
        } catch (e) { console.error('History error', e); }
    }, [result, deviceKey, scale.id, selected, total, onShowToast]);

    const levelColors: Record<string, string> = {
        normal: '#4ade80', mild: '#facc15', moderate: '#fb923c', severe: '#f87171', critical: '#e11d48',
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                        <span style={{ fontSize: '1.8rem' }}>{scale.icon}</span>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fb923c', marginBottom: 2 }}>Escala Clínica</div>
                            <h3>{scale.name}</h3>
                            <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#64748b' }}>{scale.description}</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body">
                    <div className="modal-inputs">
                        {scale.scoringNote && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12, padding: '8px 10px', background: 'rgba(251,146,60,0.08)', borderRadius: 8 }}>
                                ℹ️ {scale.scoringNote}
                            </div>
                        )}
                        {scale.groups.map(group => (
                            <div key={group.key} style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>{group.name}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {group.items.map(item => {
                                        const isActive = selected[group.key] === item.value;
                                        return (
                                            <button
                                                key={item.value}
                                                onClick={() => setSelected(prev => ({ ...prev, [group.key]: item.value }))}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 12,
                                                    padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                                                    border: `1px solid ${isActive ? '#38bdf8' : 'rgba(56,189,248,0.15)'}`,
                                                    background: isActive ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.02)',
                                                    cursor: 'pointer', width: '100%', fontFamily: 'Inter, sans-serif',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div style={{
                                                    width: 26, height: 26, minWidth: 26, borderRadius: '50%',
                                                    background: isActive ? '#0ea5e9' : 'rgba(56,189,248,0.1)',
                                                    border: `2px solid ${isActive ? '#38bdf8' : 'rgba(56,189,248,0.2)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
                                                    fontWeight: 800, color: isActive ? '#fff' : '#64748b',
                                                }}>{item.value}</div>
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isActive ? '#e2e8f0' : '#94a3b8' }}>{item.label}</div>
                                                    {item.description && <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>{item.description}</div>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasAll && result && (
                        <div className="modal-result" style={{ borderColor: levelColors[result.level] + '60', background: `${levelColors[result.level]}15` }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>Score Total</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2.5rem', fontWeight: 800, color: levelColors[result.level], lineHeight: 1 }}>{total}</span>
                                <span style={{ color: '#94a3b8' }}>pontos</span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>{result.text}</div>
                        </div>
                    )}
                    {!hasAll && (
                        <div style={{ padding: '0 20px 16px', fontSize: '0.78rem', color: '#475569', textAlign: 'center' }}>
                            Selecione uma opção em cada grupo para calcular o escore
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {hasAll && result ? (
                        <CopyButton
                            label={`${scale.name}: ${total} pts — ${result.text}`}
                            onCopy={saveToHistory}
                        />
                    ) : (
                        <div style={{ height: 16 }} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── CARD DE FERRAMENTA ──────────────────────────────────────────
function ToolCard({ id, icon, name, description, category, onOpen, isFav, onToggleFav }: any) {
    const cat = calculatorCategories[category];
    return (
        <div className="tool-card" style={{ display: 'flex', alignItems: 'center', gap: 0, padding: 0 }}>
            <button onClick={onOpen} style={{
                display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0,
                padding: '14px 0 14px 16px', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
                <div className="tool-card__icon">{icon}</div>
                <div className="tool-card__body" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color, marginBottom: 4 }}>{cat.label}</div>
                    <div className="tool-card__name">{name}</div>
                    <div className="tool-card__desc">{description}</div>
                </div>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px 0 8px', flexShrink: 0 }}>
                <button className={`fav-btn${isFav ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); onToggleFav(id, category === 'escalas' ? 'scale' : 'calculator'); }}
                    title={isFav ? 'Remover favorito' : 'Favoritar'}>
                    {isFav ? <Star size={14} fill="#facc15" /> : <StarOff size={14} />}
                </button>
                <ChevronRight size={16} color="#475569" onClick={onOpen} style={{ cursor: 'pointer' }} />
            </div>
        </div>
    );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────
export default function ToolsPage() {
    const { deviceKey } = useDevice();
    const [activeCalc, setActiveCalc] = useState<Calculator | null>(null);
    const [activeScale, setActiveScale] = useState<ClinicalScale | null>(null);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<string>('all');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        const main = document.querySelector('.main-content');
        if (main) main.scrollTop = 0;
        window.scrollTo(0, 0);
    }, [filterCat, search]);

    useEffect(() => {
        if (!deviceKey) return;
        const loadFavs = async () => {
            try {
                const { data } = await favoriteService.list(deviceKey);
                setFavorites(new Set(data.map((f: any) => f.toolId)));
            } catch {
                const local = JSON.parse(localStorage.getItem('fisio_favs') ?? '[]');
                setFavorites(new Set(local));
            }
        };
        loadFavs();
    }, [deviceKey]);

    const toggleFav = useCallback(async (id: string, toolType: 'calculator' | 'scale') => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); setToast('Removido dos favoritos'); }
            else { next.add(id); setToast('Adicionado aos favoritos ⭐'); }
            localStorage.setItem('fisio_favs', JSON.stringify([...next]));
            return next;
        });

        if (deviceKey) {
            try { await favoriteService.toggle(deviceKey, id, toolType); }
            catch (e) { console.error('Fav sync error', e); }
        }
    }, [deviceKey]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(t);
    }, [toast]);

    const showFavsOnly = filterCat === 'favs';

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return calculators.filter(c =>
            (filterCat === 'all' || filterCat === c.category || (filterCat === 'favs' && favorites.has(c.id))) &&
            (c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
        );
    }, [search, filterCat, favorites]);

    const filteredScales = useMemo(() => {
        const q = search.toLowerCase();
        return clinicalScales.filter(s =>
            (filterCat === 'all' || filterCat === 'escalas' || (filterCat === 'favs' && favorites.has(s.id))) &&
            (s.name.toLowerCase().includes(q) || s.shortName.toLowerCase().includes(q))
        );
    }, [search, filterCat, favorites]);

    return (
        <div className="tools-page">
            <div className="tools-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(56,189,248,0.2),rgba(14,165,233,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(56,189,248,0.2)', flexShrink: 0 }}>🧮</div>
                    <div>
                        <h2 style={{ marginBottom: 2 }}>Fisio Tools</h2>
                        <p style={{ fontSize: '0.82rem' }}>{calculators.length + clinicalScales.length} ferramentas clínicas</p>
                    </div>
                </div>

                <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                        type="text" placeholder="Buscar calculadora..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 38px',
                            background: 'var(--bg-input)', border: '1px solid var(--border-light)',
                            borderRadius: 10, color: '#f0f9ff', fontFamily: 'Inter, sans-serif',
                            fontSize: '0.875rem', outline: 'none',
                        }}
                    />
                </div>

                <div className="tools-filter">
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'favs', label: `⭐ Favoritos${favorites.size > 0 ? ` (${favorites.size})` : ''}` },
                        ...Object.entries(calculatorCategories).map(([id, c]) => ({ id, label: c.label }))
                    ].map(cat => (
                        <button key={cat.id}
                            className={`filter-chip${filterCat === cat.id ? ' active' : ''}`}
                            onClick={() => setFilterCat(cat.id)}
                        >{cat.label}</button>
                    ))}
                </div>
            </div>

            <div className="tools-list">
                {showFavsOnly && filtered.length === 0 && filteredScales.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#475569' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⭐</div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum favorito ainda</div>
                        <div style={{ fontSize: '0.8rem' }}>Toque na estrela ☆ em qualquer calculadora para salvar aqui</div>
                    </div>
                )}

                {filtered.length > 0 && (
                    <>
                        <div className="section-divider" style={{ marginBottom: 10 }}>
                            <CalcIcon size={12} />Calculadoras
                        </div>
                        {filtered.map(c => (
                            <ToolCard key={c.id} id={c.id} icon={c.icon} name={c.shortName} description={c.description} category={c.category} isFav={favorites.has(c.id)} onToggleFav={toggleFav} onOpen={() => setActiveCalc(c)} />
                        ))}
                    </>
                )}

                {filteredScales.length > 0 && (
                    <>
                        <div className="section-divider" style={{ margin: '16px 0 10px' }}>
                            <Star size={12} />Escalas Clínicas
                        </div>
                        {filteredScales.map(s => (
                            <ToolCard key={s.id} id={s.id} icon={s.icon} name={s.shortName} description={s.description} category="escalas" isFav={favorites.has(s.id)} onToggleFav={toggleFav} onOpen={() => setActiveScale(s)} />
                        ))}
                    </>
                )}

                {filtered.length === 0 && filteredScales.length === 0 && !showFavsOnly && (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#475569' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                        <div>Nenhuma ferramenta encontrada para "{search}"</div>
                    </div>
                )}
            </div>

            {activeCalc && <CalculatorModal calc={activeCalc} onClose={() => setActiveCalc(null)} onShowToast={setToast} />}
            {activeScale && <ScaleModal scale={activeScale} onClose={() => setActiveScale(null)} onShowToast={setToast} />}
            {toast && <div className="copy-toast">{toast}</div>}
        </div>
    );
}
