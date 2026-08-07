import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 transform transition-all scale-100">
        <div className="space-y-2">
          <h3 className={`text-lg font-bold ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>
            {title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition shadow-sm ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
