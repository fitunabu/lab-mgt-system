'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error';

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

export function showToast(type: ToastType, message: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('lab-toast', {
      detail: { type, message },
    }),
  );
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ type: ToastType; message: string }>).detail;
      if (!detail) return;

      const id = Date.now() + Math.random();
      const nextToast = { id, type: detail.type, message: detail.message };
      setToasts((current) => [...current, nextToast]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3000);
    };

    window.addEventListener('lab-toast', handler);
    return () => window.removeEventListener('lab-toast', handler);
  }, []);

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-[200] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'pointer-events-auto min-w-[260px] rounded-lg border px-4 py-3 shadow-lg',
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800',
          ].join(' ')}
        >
          <div className="text-sm font-medium">{toast.message}</div>
        </div>
      ))}
    </div>
  );
}
