import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'emergency' | 'dispatch' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const borderClass =
          toast.type === 'emergency' ? 'border-red-500/80 bg-red-950/90 text-red-100' :
          toast.type === 'dispatch' ? 'border-amber-500/80 bg-slate-900/95 text-amber-200' :
          toast.type === 'success' ? 'border-emerald-500/80 bg-slate-900/95 text-emerald-200' :
          'border-slate-700 bg-slate-900/95 text-slate-200';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
                  {toast.type === 'emergency' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                  {toast.type === 'dispatch' && <span>⚡</span>}
                  {toast.type === 'success' && <span>✓</span>}
                  <span>{toast.title}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-snug">{toast.message}</p>
                <span className="text-[10px] text-slate-500 block mt-1 font-mono">{toast.timestamp}</span>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-white text-sm leading-none p-1 cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
