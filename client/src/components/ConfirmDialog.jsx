import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  isDeleting = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            {message}
          </p>
        </div>
      </div>

      <div className="modal-footer" style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-color)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
