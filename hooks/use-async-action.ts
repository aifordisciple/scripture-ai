"use client"

import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from '@/lib/i18n'

interface AsyncActionState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Hook for managing async actions with automatic loading/error states and toast feedback.
 * Replaces manual try/catch + alert/confirm patterns throughout the codebase.
 *
 * @example
 * const { execute, loading } = useAsyncAction(async () => {
 *   await deleteHighlight(id)
 * }, { successMessage: t('common.done') })
 */
export function useAsyncAction<T = unknown>(
  action: (...args: unknown[]) => Promise<T>,
  options: {
    successMessage?: string
    errorMessage?: string
    showSuccessToast?: boolean
    showErrorToast?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: unknown) => void
  } = {}
) {
  const {
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true,
    onSuccess,
    onError,
  } = options

  const { addToast } = useToast()
  const { t } = useTranslation()
  const [state, setState] = useState<AsyncActionState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const result = await action(...args)
        setState({ data: result, loading: false, error: null })

        if (showSuccessToast && successMessage) {
          addToast({ type: 'success', message: successMessage })
        }

        onSuccess?.(result)
        return result
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : errorMessage || t('common.error')

        setState((prev) => ({ ...prev, loading: false, error: message }))

        if (showErrorToast) {
          addToast({ type: 'error', message })
        }

        onError?.(err)
        return null
      }
    },
    [action, successMessage, errorMessage, showSuccessToast, showErrorToast, addToast, t, onSuccess, onError]
  )

  return {
    ...state,
    execute,
  }
}
