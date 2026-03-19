import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import '../components/SystemToast.css';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  title: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface SystemNotificationContextType {
  notify: (title: string, message: string, type?: ToastType) => void;
}

const SystemNotificationContext = createContext<SystemNotificationContextType | undefined>(undefined);

export const SystemNotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const notify = useCallback((title: string, message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <SystemNotificationContext.Provider value={{ notify }}>
      {children}
      <div className="system-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`system-toast toast-${toast.type} ${toast.exiting ? 'exiting' : ''}`}>
            <div className="system-toast-icon">
              {toast.type === 'success' && <i className="fa-solid fa-check-circle"></i>}
              {toast.type === 'error' && <i className="fa-solid fa-circle-exclamation"></i>}
            </div>
            <div className="system-toast-content">
              <span className="system-toast-title">{toast.title}</span>
              <span className="system-toast-message">{toast.message}</span>
            </div>
            <button className="system-toast-close" onClick={() => removeToast(toast.id)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="system-toast-progress" />
          </div>
        ))}
      </div>
    </SystemNotificationContext.Provider>
  );
};

export const useSystemNotification = () => {
  const context = useContext(SystemNotificationContext);
  if (!context) {
    throw new Error('useSystemNotification must be used within a SystemNotificationProvider');
  }
  return context;
};