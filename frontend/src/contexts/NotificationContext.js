import React, { createContext, useContext, useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border 
            ${t.type === 'success' ? 'bg-green-600/90 border-green-400/50 text-white' : ''}
            ${t.type === 'error' ? 'bg-red-600/90 border-red-400/50 text-white' : ''}
            ${t.type === 'info' ? 'bg-slate-800/90 border-white/10 text-white' : ''}
            ${t.type === 'warning' ? 'bg-yellow-600/90 border-yellow-400/50 text-white' : ''}`}
          >
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