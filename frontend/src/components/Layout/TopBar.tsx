interface TopBarProps {
    title: string;
    subtitle?: string;
    tag?: string;
}

export default function TopBar({ title, subtitle, tag }: TopBarProps) {
    return (
        <header className="topbar">
            <div className="topbar__left">
                <div>
                    {subtitle && <div className="topbar__breadcrumb">{subtitle}</div>}
                    <div className="topbar__title">{title}</div>
                </div>
            </div>
            <div className="topbar__right">
                {tag && <span className="topbar__tag">{tag}</span>}
                <span className="topbar__tag" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80' }}>
                    ● Evidência Nível A
                </span>
            </div>
        </header>
    );
}
