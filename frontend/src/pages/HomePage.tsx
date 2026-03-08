import { useState, useEffect } from 'react';
import { Wind, Brain, ArrowRight, Activity, Shield, Zap, Calculator, History, Clock, Star, Lock } from 'lucide-react';
import { useDevice } from '../hooks/useDevice';
import { historyService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
    onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
    const { deviceKey } = useDevice();
    const { user } = useAuth();
    const [recentHistory, setRecentHistory] = useState<any[]>([]);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!deviceKey || !user) {
            setRecentHistory([]);
            return;
        }
        const loadRecent = async () => {
            try {
                const { data } = await historyService.list(deviceKey);
                setRecentHistory(data?.slice(0, 3) || []);
            } catch (err) {
                console.error('Error loading home history', err);
            }
        };
        loadRecent();
    }, [deviceKey, user]);

    return (
        <div>
            <div className="home-hero">
                <div className="home-hero__eyebrow">
                    <Activity size={14} />
                    Fisioterapia Intensivista
                </div>
                <h1 className="home-hero__title">FisioSim</h1>
                <p className="home-hero__sub">
                    Plataforma clínica unificada para fisioterapeutas. Simulação física de ventilação,
                    protocolos em UTI e calculadoras interativas — tudo com evidência nível A.
                </p>
            </div>

            <div className="module-cards">
                {/* Módulo 1: Simulador */}
                <div className="module-card blue" onClick={() => onNavigate('simulator')}>
                    <div className="module-card__icon">🫁</div>
                    <div className="module-card__tag">Simulação</div>
                    <div className="module-card__title">Simulador de Ventilação Mecânica</div>
                    <p className="module-card__desc">
                        Motor físico completo baseado na Equação do Movimento. Gráficos em tempo real
                        de Pressão, Volume e Fluxo com alertas clínicos automáticos.
                    </p>
                    <div className="module-card__features">
                        {['Modos VCV e PCV com física real', '3 cenários: Normal, SDRA, DPOC', 'Alertas Driving Pressure e Auto-PEEP', 'Tabela ARDSNet integrada'].map(f => (
                            <div key={f} className="module-card__feat">
                                <span className="module-card__feat-dot" />
                                {f}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary-400)', fontSize: '0.82rem', fontWeight: 700 }}>
                        <Wind size={16} /> Abrir Simulador <ArrowRight size={14} />
                    </div>
                </div>

                {/* Módulo 2: Protocolos */}
                <div className="module-card teal" onClick={() => onNavigate('protocols')}>
                    <div className="module-card__icon">🧠</div>
                    <div className="module-card__tag" style={{ background: 'rgba(6,182,212,0.15)', color: '#67e8f9', width: 'fit-content', padding: '2px 8px', borderRadius: '4px' }}>Protocolos</div>
                    <div className="module-card__title">Protocolos e Decisão Clínica</div>
                    <p className="module-card__desc">
                        SDRA e Desmame Ventilatório com critérios diagnósticos e algoritmo passo a passo.
                    </p>
                    <div className="module-card__features">
                        {['Critérios de Berlim 2012', 'Algoritmo de Desmame + TRE', 'Evidência Nível A'].map(f => (
                            <div key={f} className="module-card__feat">
                                <span className="module-card__feat-dot" style={{ background: '#06b6d4' }} />
                                {f}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: '#67e8f9', fontSize: '0.82rem', fontWeight: 700 }}>
                        <Brain size={16} /> Acessar Protocolos <ArrowRight size={14} />
                    </div>
                </div>

                {/* Módulo 3: Fisio Tools */}
                <div className="module-card purple" onClick={() => onNavigate('tools')}>
                    <div className="module-card__icon">🧮</div>
                    <div className="module-card__tag">Calculadoras</div>
                    <div className="module-card__title">Fisio Tools</div>
                    <p className="module-card__desc">
                        29 calculadoras e escalas clínicas interativas. Insira os dados do paciente
                        e obtenha o resultado instantaneamente.
                    </p>
                    <div className="module-card__features">
                        {['P/F Ratio, Tobin, Grad. A-a', 'Complacência e Driving Pressure', 'Escalas RASS, MRC, Glasgow'].map(f => (
                            <div key={f} className="module-card__feat">
                                <span className="module-card__feat-dot" />
                                {f}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: '#c4b5fd', fontSize: '0.82rem', fontWeight: 700 }}>
                        <Calculator size={16} /> Abrir Ferramentas <ArrowRight size={14} />
                    </div>
                </div>

                {/* Módulo 4: Histórico */}
                <div
                    className={`module-card orange ${!user ? 'disabled-card' : ''}`}
                    onClick={() => {
                        if (user) onNavigate('history');
                        else onNavigate('auth');
                    }}
                    style={!user ? { opacity: 0.7, filter: 'grayscale(0.5)' } : {}}
                >
                    <div className="module-card__icon">🕒</div>
                    <div className="module-card__tag" style={{ background: 'rgba(249,115,22,0.15)', color: '#fdba74' }}>Histórico</div>
                    <div className="module-card__title">Cálculos Recentes</div>
                    <p className="module-card__desc">
                        Acesse rapidamente seus últimos cálculos sincronizados em tempo real.
                    </p>
                    <div className="module-card__history-preview" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {!user ? (
                            <div style={{ padding: '16px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', border: '1px dashed rgba(249,115,22,0.2)', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                <Lock size={16} style={{ margin: '0 auto 6px', color: '#f97316' }} />
                                <div>Logue para salvar seu histórico na nuvem</div>
                            </div>
                        ) : isOffline ? (
                            <div style={{ padding: '16px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', border: '1px dashed rgba(249,115,22,0.2)', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                <Activity size={16} style={{ margin: '0 auto 6px', color: '#f97316' }} />
                                <div>Você está offline. Conecte-se para puxar seu histórico.</div>
                            </div>
                        ) : recentHistory.length > 0 ? (
                            recentHistory.map((h, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.72rem' }}>
                                    {h.toolType === 'scale' ? <Star size={12} color="#facc15" /> : <Calculator size={12} color="#38bdf8" />}
                                    <span style={{ flex: 1, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.toolId.replace('_', ' ').toUpperCase()}</span>
                                    <span style={{ color: '#4ade80', fontWeight: 700 }}>{h.resultValue}{h.resultUnit}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.72rem', border: '1px dashed rgba(56,189,248,0.1)', borderRadius: 8 }}>
                                <Clock size={14} style={{ marginBottom: 4, opacity: 0.5 }} />
                                <div>Nenhum cálculo recente</div>
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: '#fdba74', fontSize: '0.82rem', fontWeight: 700 }}>
                        {!user ? <><Lock size={16} /> Fazer Login para Acessar</> : <><History size={16} /> Ver Histórico Completo <ArrowRight size={14} /></>}
                    </div>
                </div>
            </div>

            <div className="technology-bar">
                {[
                    { value: '29', label: 'Ferramentas' },
                    { value: '20+', label: 'Fontes DOI' },
                    { value: '1A', label: 'Evidência' },
                ].map(t => (
                    <div key={t.label} className="tech-item">
                        <div className="tech-item__value">{t.value}</div>
                        <div className="tech-item__label">{t.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ maxWidth: 900, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {[
                    { icon: Shield, title: 'Baseado em Evidências', desc: 'ARDSNet, Berlim 2012, ERS Weaning TF' },
                    { icon: Zap, title: 'Motor Físico Real', desc: 'Equação do Movimento — 5ms por amostra' },
                    { icon: Activity, title: 'Tempo Real', desc: 'Curvas P×t, V×t, F×t dinâmicas e responsivas' },
                ].map(item => {
                    const Icon = item.icon;
                    return (
                        <div key={item.title} className="card" style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <Icon size={20} color="#38bdf8" />
                            </div>
                            <h4 style={{ marginBottom: 6 }}>{item.title}</h4>
                            <p style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>{item.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
