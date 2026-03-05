import { useState, useEffect } from 'react';
import { History, Trash2, Clock, Calculator, Star, AlertCircle } from 'lucide-react';
import { historyService } from '../services/api';
import { useDevice } from '../hooks/useDevice';
import ConfirmModal from '../components/ConfirmModal';

export default function HistoryPage() {
    const { deviceKey } = useDevice();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'danger' | 'warning' }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger'
    });

    const loadHistory = async () => {
        if (!deviceKey) return;
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
    }, [deviceKey]);

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
                    {history.length > 0 && (
                        <button onClick={handleClear} className="filter-chip" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
                            <Trash2 size={14} style={{ marginRight: 6 }} /> Limpar
                        </button>
                    )}
                </div>
            </div>

            <div className="tools-list">
                {loading ? (
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
                    history.map((record: any) => (
                        <div key={record.id} className="tool-card" style={{ cursor: 'default' }}>
                            <div className="tool-card__icon" style={{ background: record.toolType === 'scale' ? 'rgba(250,204,21,0.1)' : 'rgba(56,189,248,0.1)' }}>
                                {record.toolType === 'scale' ? <Star size={16} color="#facc15" /> : <Calculator size={16} color="#38bdf8" />}
                            </div>
                            <div className="tool-card__content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 className="tool-card__title">{record.toolId.replace('_', ' ').toUpperCase()}</h4>
                                        <span style={{ fontSize: '0.65rem', color: '#475569' }}>{formatDate(record.calculatedAt)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        className="filter-chip"
                                        style={{ padding: '4px', minWidth: 'auto', border: 'none', background: 'transparent', color: '#64748b' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div style={{ marginTop: 4, fontWeight: 700, fontSize: '1rem', color: '#f0f9ff' }}>
                                    {record.resultValue} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>{record.resultUnit}</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>
                                    {record.interpretation}
                                </p>
                            </div>
                        </div>
                    ))
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
