import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [modal, setModal] = useState(null);

    const notify = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setModal({
                ...options,
                onConfirm: () => {
                    setModal(null);
                    resolve(true);
                },
                onCancel: () => {
                    setModal(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ notify, confirm }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
                                t.type === 'error' 
                                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}
                        >
                            <i className={`fas ${t.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`} />
                            <span className="text-sm font-bold uppercase tracking-tight">{t.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal Container */}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 ${modal.type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                    <i className={`fas ${modal.icon || 'fa-question-circle'} text-2xl`} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{modal.title || 'Are you sure?'}</h3>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">{modal.message}</p>
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <button
                                    onClick={modal.onCancel}
                                    className="px-6 py-3.5 bg-white text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                                >
                                    {modal.cancelText || 'Cancel'}
                                </button>
                                <button
                                    onClick={modal.onConfirm}
                                    className={`px-6 py-3.5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                                        modal.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-[#002147] hover:bg-slate-800 shadow-blue-900/20'
                                    }`}
                                >
                                    {modal.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
};
