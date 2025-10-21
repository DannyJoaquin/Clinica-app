"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Toast = { id: number; type: 'success' | 'error' | 'info'; message: string };

const ToastCtx = createContext<{
  push: (t: Omit<Toast, 'id'>) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { ...t, id }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Toaster toasts={list} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    success: (message: string) => ctx.push({ type: 'success', message }),
    error: (message: string) => ctx.push({ type: 'error', message }),
    info: (message: string) => ctx.push({ type: 'info', message }),
  };
}

function Toaster({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            'rounded-md px-3 py-2 shadow text-sm text-white ' +
            (t.type === 'success'
              ? 'bg-emerald-600'
              : t.type === 'error'
              ? 'bg-red-600'
              : 'bg-gray-800')
          }
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
