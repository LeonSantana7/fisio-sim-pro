import { Wind, Brain, ArrowRight, Activity, Shield, Zap, Calculator } from 'lucide-react';

interface HomePageProps {
    onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
    return (
        <div>
            <div className="home-hero">
                <div className="home-hero__eyebrow">
                    <Activity size={14} />
                    Fisioterapia Intensivista
                </div>
                <h1 className="home-hero__title">FisioSim Pro</h1>
                <p className="home-hero__sub">
                    Plataforma clínica unificada para fisioterapeutas. Simulação física de ventilação,
                    protocolos em UTI e calculadoras interativas — tudo com evidência nível A.
                </p>
            </div>

            <div className="module-cards">
                {/* Módulo 1: Simulador */}
                <div className="module-card blue" onClick={() => onNavigate('simulator')}>
                    <div className="module-card__icon">🫁</div>
                    <div className="module-card__tag">Módulo 1 · Simulação</div>
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
                    <div className="module-card__tag" style={{ background: 'rgba(6,182,212,0.15)', color: '#67e8f9', width: 'fit-content', padding: '2px 8px', borderRadius: '4px' }}>Módulo 2 · Protocolos</div>
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
                    <div className="module-card__tag">Módulo 3 · Calculadoras</div>
                    <div className="module-card__title">Fisio Tools</div>
                    <p className="module-card__desc">
                        15 calculadoras e escalas clínicas interativas. Insira os dados do paciente
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
            </div>

            <div className="technology-bar">
                {[
                    { value: '3', label: 'Módulos' },
                    { value: '15', label: 'Ferramentas' },
                    { value: '11', label: 'Fontes DOI' },
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
