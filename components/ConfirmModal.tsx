
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-['Vazirmatn']" style={{ direction: 'rtl' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onCancel}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] p-6 w-full max-w-[320px] shadow-2xl relative z-10 border border-gray-200 dark:border-white/10 transform scale-100 transition-all animate-slide-up">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-1 shadow-inner">
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>
          
          <div>
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
          </div>
          
          <div className="flex gap-3 w-full mt-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold text-sm transition-colors hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95"
            >
              انصراف
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600 active:scale-95"
            >
              بله، حذف شود
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
