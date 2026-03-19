import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import '../components/WebToast.css';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  title: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface WebNotificationContextType {
  notify: (title: string, message: string, type?: ToastType) => void;
}

const WebNotificationContext = createContext<WebNotificationContextType | undefined>(undefined);

export const WebNotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dedupeRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((toast) => toast.id === id ? { ...toast, exiting: true } : toast));
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 220);
  }, []);

  const notify = useCallback((title: string, message: string, type: ToastType = 'success') => {
    const key = `${type}:${title}:${message}`;
    const now = Date.now();
    const lastTime = dedupeRef.current.get(key);

    if (lastTime && now - lastTime < 1200) {
      return;
    }

    dedupeRef.current.set(key, now);

    const id = now + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <WebNotificationContext.Provider value={value}>
      {children}
      <div className="web-toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`web-toast web-toast-${toast.type} ${toast.exiting ? 'exiting' : ''}`}>
            <div className="web-toast-icon">
              {toast.type === 'success' ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-circle-exclamation"></i>}
            </div>
            <div className="web-toast-content">
              <span className="web-toast-title">{toast.title}</span>
              <span className="web-toast-message">{toast.message}</span>
            </div>
            <button className="web-toast-close" onClick={() => removeToast(toast.id)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="web-toast-progress" />
          </div>
        ))}
      </div>
    </WebNotificationContext.Provider>
  );
};

export const useWebNotification = () => {
  const context = useContext(WebNotificationContext);
  if (!context) {
    throw new Error('useWebNotification must be used within WebNotificationProvider');
  }
  return context;
};
