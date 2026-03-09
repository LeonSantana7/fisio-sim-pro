import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/authApi';
import { UserPlus, LogIn, Lock, Mail, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';

export default function AuthPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('fisioterapeuta');
    const [rememberMe, setRememberMe] = useState(() => window.innerWidth < 768);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSlowResponse, setIsSlowResponse] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setIsSlowResponse(false);

        const slowTimeout = setTimeout(() => {
            setIsSlowResponse(true);
        }, 4000);

        try {
            if (isLogin) {
                const response = await authApi.post('/auth/login', { email, password });
                login(response.data.token, response.data.user, rememberMe);
                if (onNavigate) onNavigate('home');
            } else {
                const response = await authApi.post('/auth/register', { name, email, password, role });
                login(response.data.token, response.data.user, rememberMe);
                if (onNavigate) onNavigate('home');
            }
        } catch (err: any) {
            console.error('Erro na autenticação:', err);
            setError(err.response?.data?.error || 'Ocorreu um erro. Verifique seus dados e tente novamente.');
        } finally {
            clearTimeout(slowTimeout);
            setLoading(false);
            setIsSlowResponse(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '10px' }}>
            <div className="card card--elevated" style={{ width: '100%', maxWidth: '400px', position: 'relative', overflow: 'hidden', padding: '16px 20px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary-500), var(--primary-700))' }} />

                <div style={{ textAlign: 'center', marginBottom: '8px', marginTop: '0px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        marginBottom: '6px', boxShadow: 'var(--shadow-glow)'
                    }}>
                        {isLogin ? <LogIn size={20} color="var(--primary-400)" /> : <UserPlus size={20} color="var(--primary-400)" />}
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, var(--primary-400) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px', lineHeight: 1.2 }}>
                        {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>
                        {isLogin ? 'Faça login para acessar seu perfil.' : 'Junte-se ao FisioSim e salve seus cálculos.'}
                    </p>
                </div>

                {error && (
                    <div className="alert-badge red" style={{ marginBottom: '8px', padding: '6px 10px' }}>
                        <AlertCircle className="alert-badge__icon" size={14} />
                        <div>
                            <span className="alert-badge__msg" style={{ fontSize: '0.75rem' }}>{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Nome Completo</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        <UserIcon size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-field"
                                        style={{ padding: '6px 12px 6px 36px', fontSize: '0.85rem' }}
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Perfil</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="input-field"
                                    style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                                >
                                    <option value="fisioterapeuta">Fisioterapeuta</option>
                                    <option value="estudante">Estudante de Fisioterapia</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Mail size={16} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                style={{ padding: '6px 12px 6px 36px', fontSize: '0.85rem' }}
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Lock size={16} />
                            </div>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                style={{ padding: '6px 12px 6px 36px', fontSize: '0.85rem' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div style={{ display: window.innerWidth < 768 ? 'none' : 'flex', alignItems: 'center', gap: '8px', marginTop: '0px', marginBottom: '4px' }}>
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{
                                width: '14px', height: '14px', cursor: 'pointer',
                                accentColor: 'var(--primary-400)',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)', borderRadius: '4px'
                            }}
                        />
                        <label htmlFor="rememberMe" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                            Manter conectado
                        </label>
                    </div>

                    {isSlowResponse && (
                        <div style={{ padding: '8px 12px', background: 'rgba(234,179,8,0.1)', borderLeft: '3px solid #eab308', borderRadius: '0 8px 8px 0', fontSize: '0.75rem', color: '#fef08a', marginTop: 4 }}>
                            <strong>O servidor adormeceu.</strong><br />Isso ocorre por inatividade para poupar recursos. Ele já está acordando, por favor aguarde até 1 minuto.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="copy-btn"
                        style={{ marginTop: '0px', padding: '8px 16px', display: 'flex', justifyContent: 'center', opacity: loading ? 0.7 : 1, fontSize: '0.85rem' }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                {isSlowResponse ? 'Acordando servidor...' : 'Processando...'}
                            </span>
                        ) : (isLogin ? 'Entrar' : 'Criar Conta')}
                    </button>
                </form>

                <div style={{ marginTop: '12px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>
                        {isLogin ? 'Não tem uma conta?' : 'Já possui conta?'}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary-400)', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                        >
                            {isLogin ? 'Cadastre-se' : 'Faça login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
