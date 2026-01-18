'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-white',
};

const typeIcons: Record<ToastType, string> = {
  success: 'OK',
  error: 'X',
  info: 'i',
  warning: '!',
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
        typeStyles[toast.type]
      } animate-slide-in`}
    >
      <span className="text-lg">{typeIcons[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Track recent messages to prevent duplicates
  const recentMessages = useRef<Map<string, number>>(new Map());

  const showToast = useCallback(
    (message: string, type: ToastType, duration = 5000) => {
      const key = `${message}-${type}`;
      const now = Date.now();
      const lastShown = recentMessages.current.get(key);

      // Prevent duplicate toasts within 2 seconds
      if (lastShown && now - lastShown < 2000) {
        return;
      }

      recentMessages.current.set(key, now);

      // Clean old entries after 5 seconds
      setTimeout(() => {
        recentMessages.current.delete(key);
      }, 5000);

      const id = now;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
