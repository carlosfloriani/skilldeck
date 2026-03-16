import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} })

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
      }}>
        {toasts.map(toast => {
          const c = colors[toast.type]
          return (
            <div key={toast.id} style={{
              padding: '10px 16px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              color: c.text,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.2s ease-out',
              minWidth: 200,
            }}>
              {toast.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
