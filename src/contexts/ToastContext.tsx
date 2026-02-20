import { createContext } from 'preact'
import { useContext, useState, useCallback, useEffect } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ComponentChildren }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [nextId, setNextId] = useState(0)

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId
    setNextId((n) => n + 1)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [nextId])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const bg = item.type === 'success' ? 'bg-emerald-600 dark:bg-emerald-700' : item.type === 'error' ? 'bg-red-600 dark:bg-red-700' : 'bg-neutral-700 dark:bg-neutral-600'
  return (
    <div className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-white text-[13px] ${bg} transition-opacity duration-200`}>
      {item.message}
    </div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) return { toast: () => {} }
  return ctx
}
