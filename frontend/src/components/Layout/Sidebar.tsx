import { Activity, Brain, Home, Wind, Calculator, Stethoscope, Accessibility } from 'lucide-react';

interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
}

const navItems = [
    { id: 'home', icon: Home, label: 'Início', badge: null },
    { id: 'simulator', icon: Wind, label: 'Simulador VM', badge: 'Beta' },
    { id: 'protocols', icon: Brain, label: 'Protocolos UTI', badge: 'Mod. 2' },
    { id: 'tools', icon: Calculator, label: 'Fisio Tools', badge: 'Mod. 3' },
    { id: 'history', icon: Activity, label: 'Histórico', badge: 'Sync' },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
    const toggleAccessibility = () => {
        // @ts-ignore
        if (window.accessibilityInstance && typeof window.accessibilityInstance.toggleMenu === 'function') {
            // @ts-ignore
            window.accessibilityInstance.toggleMenu();
        } else {
            // Fallback
            const btn = document.querySelector('._access-button') as HTMLElement || document.querySelector('.accessibility-icon') as HTMLElement;
            if (btn) btn.click();
        }
    };

    return (
        <>
            {/* ── SIDEBAR DESKTOP ── */}
            <aside className="sidebar">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-mark">
                        <div className="sidebar__logo-icon">
                            <Stethoscope size={20} color="#fff" />
                        </div>
                        <div>
                            <div className="sidebar__logo-title">FisioSim Pro</div>
                            <div className="sidebar__logo-sub">Fisioterapia Intensivista</div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0 12px 4px' }} className="sidebar__section-label">
                    <div className="sidebar__section-title">Navegação</div>
                </div>

                <nav className="sidebar__nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={`nav-item${activePage === item.id ? ' active' : ''}`}
                                onClick={() => onNavigate(item.id)}
                                data-label={item.label}
                            >
                                <Icon className="nav-item__icon" size={18} />
                                <span className="sidebar__nav-label">{item.label}</span>
                                {item.badge && <span className="nav-item__badge">{item.badge}</span>}
                            </button>
                        );
                    })}
                    <button
                        className="nav-item"
                        onClick={toggleAccessibility}
                        data-label="Acessibilidade"
                        title="Acessibilidade"
                    >
                        <Accessibility className="nav-item__icon" size={18} />
                        <span className="sidebar__nav-label">Acessibilidade</span>
                    </button>
                </nav>

                <div className="sidebar__status" style={{ margin: '24px 12px 0', padding: '14px', background: 'rgba(14,165,233,0.06)', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Activity size={14} color="#38bdf8" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>STATUS</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Engine Física</span><span style={{ color: '#4ade80' }}>● Online</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Ferramentas</span><span style={{ color: '#4ade80' }}>● 15 ativas</span>
                        </div>
                    </div>
                </div>

                <div className="sidebar__footer">
                    <div style={{ marginTop: 16 }}>
                        <strong style={{ color: '#94a3b8' }}>FisioSim Pro</strong> v0.1.0
                    </div>
                    <div>AMIB · ARDSNet · ERS 2013</div>
                </div>
            </aside>

            {/* ── BOTTOM NAV MOBILE ── */}
            <nav className="bottom-nav">
                <div className="bottom-nav__items">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        return (
                            <button key={item.id} className={`bottom-nav__item${isActive ? ' active' : ''}`} onClick={() => onNavigate(item.id)}>
                                <div className="bn-icon">
                                    <Icon size={20} />
                                </div>
                                {item.label.split(' ')[0]}
                            </button>
                        );
                    })}
                    <button className="bottom-nav__item" onClick={toggleAccessibility}>
                        <div className="bn-icon">
                            <Accessibility size={20} />
                        </div>
                        Acesso
                    </button>
                </div>
            </nav>
        </>
    );
}
