"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    // Return a no-op implementation to avoid crashes when used outside provider
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
    }
  }
  return context
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: "bg-white dark:bg-[#272729] border-[#e0e0e0] dark:border-[#3a3a3c]",
  error: "bg-white dark:bg-[#272729] border-[#e0e0e0] dark:border-[#3a3a3c]",
  info: "bg-white dark:bg-[#272729] border-[#e0e0e0] dark:border-[#3a3a3c]",
  warning: "bg-white dark:bg-[#272729] border-[#e0e0e0] dark:border-[#3a3a3c]",
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  React.useEffect(() => {
    const duration = toast.duration ?? 3000
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border",
        "min-w-[280px] max-w-[400px]",
        TOAST_STYLES[toast.type]
      )}
    >
      {TOAST_ICONS[toast.type]}
      <p className="flex-1 text-sm font-medium text-[#1d1d1f] dark:text-white">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#7a7a7a] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  className?: string
}

export function ToastContainer({ className }: ToastContainerProps) {
  const { toasts, removeToast } = useToast()

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[100] flex flex-col gap-2",
        className
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastProviderProps {
  children: React.ReactNode
}

let toastId = 0

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastId}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}
