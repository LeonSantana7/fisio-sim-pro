import { useState, useEffect } from 'react';
import { History, Trash2, Clock, Calculator, Star, AlertCircle, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { historyService } from '../services/api';
import { useDevice } from '../hooks/useDevice';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

export default function HistoryPage() {
    const { deviceKey } = useDevice();
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'danger' | 'warning' }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger'
    });

    const loadHistory = async () => {
        if (!deviceKey || !user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const { data } = await historyService.list(deviceKey);
            setHistory(data || []);
            setError(false);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [deviceKey, user]);

    const handleClear = () => {
        setModal({
            isOpen: true,
            title: 'Limpar Histórico',
            message: 'Tem certeza que deseja apagar todos os registros? Esta ação não pode ser desfeita.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await historyService.clear(deviceKey);
                    setHistory([]);
                    setModal(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    setModal({
                        isOpen: true,
                        title: 'Erro',
                        message: 'Não foi possível limpar o histórico. Tente novamente.',
                        type: 'danger',
                        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };

    const handleDelete = (id: string) => {
        setModal({
            isOpen: true,
            title: 'Excluir Registro',
            message: 'Deseja remover este cálculo permanentemente?',
            type: 'warning',
            onConfirm: async () => {
                try {
                    await historyService.deleteById(id);
                    setHistory(prev => prev.filter(item => item.id !== id));
                    setModal(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    setModal({
                        isOpen: true,
                        title: 'Erro',
                        message: 'Não foi possível excluir o registro.',
                        type: 'danger',
                        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="tools-page">
            <div className="tools-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <History size={24} color="#38bdf8" />
                        </div>
                        <div>
                            <h2 style={{ marginBottom: 2 }}>Histórico</h2>
                            <p style={{ fontSize: '0.82rem' }}>Cálculos sincronizados com a nuvem</p>
                        </div>
                    </div>
                    {user && history.length > 0 && (
                        <button onClick={handleClear} className="filter-chip" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
                            <Trash2 size={14} style={{ marginRight: 6 }} /> Limpar
                        </button>
                    )}
                </div>
            </div>

            <div className="tools-list">
                {!user ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                        <Lock size={32} style={{ margin: '0 auto 16px', color: '#f97316' }} />
                        <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>Login Necessário</h3>
                        <p style={{ fontSize: '0.85rem' }}>Efetue login ou crie uma conta gratuitamente para salvar e acessar seus cálculos e simulações na nuvem.</p>
                    </div>
                ) : loading ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>Carregando histórico...</div>
                ) : error ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#f87171' }}>
                        <AlertCircle size={32} style={{ marginBottom: 12 }} />
                        <div>Erro ao conectar com o servidor. Verifique sua rede.</div>
                    </div>
                ) : history.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                        <Clock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <div>Nenhum cálculo recente encontrado.</div>
                    </div>
                ) : (
                    history.map((record: any) => {
                        const isExpanded = expandedId === record.id;
                        return (
                            <div
                                key={record.id}
                                className={`tool-card ${isExpanded ? 'expanded' : ''}`}
                                style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch' }}
                                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                            >
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <div className="tool-card__icon" style={{ background: record.toolType === 'scale' ? 'rgba(250,204,21,0.1)' : 'rgba(56,189,248,0.1)' }}>
                                        {record.toolType === 'scale' ? <Star size={16} color="#facc15" /> : <Calculator size={16} color="#38bdf8" />}
                                    </div>
                                    <div className="tool-card__content" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 className="tool-card__title">{record.toolId.replace(/_/g, ' ').toUpperCase()}</h4>
                                                <span style={{ fontSize: '0.65rem', color: '#475569' }}>{formatDate(record.calculatedAt)}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                                                    className="filter-chip"
                                                    style={{ padding: '4px', minWidth: 'auto', border: 'none', background: 'transparent', color: '#64748b' }}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 4, fontWeight: 700, fontSize: '1rem', color: '#f0f9ff' }}>
                                            {record.resultValue} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>{record.resultUnit}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', margin: 0, opacity: 0.8 }}>
                                                {record.interpretation}
                                            </p>
                                            <div style={{ color: '#38bdf8', opacity: 0.5, transition: 'all 0.2s', transform: isExpanded ? 'translateY(2px)' : 'translateY(0)' }}>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && record.inputValues && Object.keys(record.inputValues).length > 0 && (
                                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s ease-out' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valores Inseridos</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                                            {Object.entries(record.inputValues).map(([key, value]) => (
                                                <div key={key} style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.65rem', display: 'block', marginBottom: 2, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                                    <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.7rem', color: '#475569' }}>
                ID do Dispositivo: <span style={{ fontFamily: 'monospace' }}>{deviceKey}</span>
            </div>

            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
