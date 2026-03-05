import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'info'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const colors = {
        danger: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', icon: <AlertTriangle color="#ef4444" size={24} />, btn: '#ef4444' },
        warning: { bg: 'rgba(234,179,8,0.1)', border: '#eab308', icon: <AlertTriangle color="#eab308" size={24} />, btn: '#eab308' },
        success: { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', icon: <CheckCircle color="#22c55e" size={24} />, btn: '#22c55e' },
        info: { bg: 'rgba(14,165,233,0.1)', border: '#0ea5e9', icon: <Info color="#0ea5e9" size={24} />, btn: '#0ea5e9' },
    };

    const config = colors[type];

    return (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onCancel}>
            <div
                className="modal-sheet"
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: '24px',
                    borderRadius: '20px',
                    animation: 'fadeInSlide 0.3s ease'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '12px',
                        background: config.bg, display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        {config.icon}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: 4 }}>{title}</h3>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{message}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button
                        className="btn btn-ghost"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="btn"
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            background: config.btn,
                            color: '#fff',
                            border: 'none'
                        }}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
