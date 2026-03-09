import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogIn, LogOut } from 'lucide-react';
import type { Page } from '../../App';

interface TopBarProps {
    title: string;
    subtitle?: string;
    tag?: string;
    onNavigate?: (page: Page) => void;
}

export default function TopBar({ title, subtitle, tag, onNavigate }: TopBarProps) {
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUserClick = () => {
        if (!user) {
            if (onNavigate) onNavigate('auth');
        } else {
            setShowMenu(!showMenu);
        }
    };

    const handleLogout = () => {
        logout();
        setShowMenu(false);
        if (onNavigate) onNavigate('home');
    };

    return (
        <header className="topbar">
            <div className="topbar__left">
                <div>
                    {subtitle && <div className="topbar__breadcrumb">{subtitle}</div>}
                    <div className="topbar__title">{title}</div>
                </div>
            </div>
            <div className="topbar__right">
                {tag && <span className="topbar__tag hide-on-mobile">{tag}</span>}
                <span className="topbar__tag hide-on-mobile" style={{
                    background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    borderColor: isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                    color: isOnline ? '#4ade80' : '#f87171'
                }}>
                    ● {isOnline ? 'Online' : 'Offline'}
                </span>

                {onNavigate && (
                    <div className="topbar-user-container" ref={menuRef}>
                        <button
                            onClick={handleUserClick}
                            className={`user-badge mobile-only ${user && showMenu ? 'active' : ''}`}
                        >
                            {user ? (
                                <>
                                    <span className="user-badge-text">{user.name?.split(' ')[0] || 'Usuário'}</span>
                                    <div className="user-badge-icon">
                                        <User size={14} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="user-badge-text">Entrar</span>
                                    <div className="user-badge-icon">
                                        <LogIn size={14} />
                                    </div>
                                </>
                            )}
                        </button>

                        {user && showMenu && (
                            <div className="topbar-dropdown mobile-only">
                                <div className="topbar-dropdown__header">
                                    <strong>{user.name}</strong>
                                    <span>{user.email}</span>
                                </div>
                                <button className="topbar-dropdown__item danger" onClick={handleLogout}>
                                    <LogOut size={16} /> Sair
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
