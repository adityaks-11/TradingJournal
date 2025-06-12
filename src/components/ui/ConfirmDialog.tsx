import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: any) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  data?: any; // Data to pass to onConfirm
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  data
}) => {
  const handleConfirm = () => {
    // Call onConfirm with the data
    onConfirm(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
          <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <p className="mb-6 text-slate-700 dark:text-slate-300">{message}</p>
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
