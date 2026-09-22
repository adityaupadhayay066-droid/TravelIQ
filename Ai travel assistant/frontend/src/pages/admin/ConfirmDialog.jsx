import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed with this destructive action? This cannot be undone.',
    confirmText = 'Delete',
    confirmVariant = 'danger',
    loading = false
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn-ghost text-sm !h-9 !px-4"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={confirmVariant === 'danger' ? 'btn-danger text-sm !h-9 !px-4' : 'btn-primary text-sm !h-9 !px-4'}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </>
            }
        >
            <div className="flex items-start gap-4 py-2">
                <div className={`p-3 rounded-xl shrink-0 ${confirmVariant === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-[var(--color-text)]">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
}
