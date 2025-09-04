import React, { createContext, useContext, useState, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const notify = useCallback((message, type = 'info', timeout = 3500) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    if (timeout) {
      setTimeout(() => remove(id), timeout);
    }
    return id;
  }, [remove]);

  const value = { notify, remove };

  const tone = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-600/90 border-emerald-400/50 text-white';
      case 'error': return 'bg-rose-600/90 border-rose-400/50 text-white';
      case 'warning': return 'bg-amber-600/90 border-amber-400/50 text-white';
      default: return 'bg-slate-800/90 border-white/10 text-white';
    }
  };

  const Icon = ({ type }) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="w-4 h-4" />;
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border ${tone(t.type)}`}>
            <Icon type={t.type} />
            <span className="text-sm">{t.message}</span>
            <button onClick={() => remove(t.id)} className="ml-2 opacity-80 hover:opacity-100">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};