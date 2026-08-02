import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { OfflineQueueAction } from '@/lib/offline-queue'
import { enqueueOfflineItem } from '@/lib/offline-queue'
import { translateError } from '@/lib/utils'

export function createOfflineMutation<TVariables, TData>(
  action: OfflineQueueAction,
  mutationFn: (vars: TVariables) => Promise<TData>,
  options: {
    successMessage?: string | ((data: TData, variables: TVariables) => string)
    successDescription?: string | ((data: TData, variables: TVariables) => string)
    errorAction?: string
    onSuccess?: (
      data: TData,
      variables: TVariables,
      queryClient: ReturnType<typeof useQueryClient>,
    ) => void
    onError?: (
      error: unknown,
      variables: TVariables,
      queryClient: ReturnType<typeof useQueryClient>,
    ) => void
  },
) {
  return function useOfflineMutationHook() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (payload: TVariables) => {
        if (!navigator.onLine) {
          try {
            await enqueueOfflineItem(action, payload)
            return { offline: true } as any
          } catch (queueErr: any) {
            toast.error('Gagal Menyimpan Offline', {
              description: queueErr.message || 'Penyimpanan penuh atau bermasalah.',
            })
            throw queueErr
          }
        }

        try {
          return await mutationFn(payload)
        } catch (err: any) {
          const errMessage = (err?.message || '').toLowerCase()
          const isNetworkError =
            err instanceof TypeError ||
            errMessage.includes('fetch') ||
            errMessage.includes('network') ||
            errMessage.includes('failed to fetch')

          if (isNetworkError) {
            try {
              await enqueueOfflineItem(action, payload)
              return { offline: true } as any
            } catch (queueErr: any) {
              toast.error('Gagal Menyimpan Offline', {
                description: queueErr.message || 'Penyimpanan penuh atau bermasalah.',
              })
              throw queueErr
            }
          }
          throw err
        }
      },
      onSuccess: (data, variables) => {
        if (data && (data as any).offline) {
          // Additional onSuccess logic (like invalidating queries) is usually skipped for offline,
          // but we can let the caller handle it if they need to optimistically update the UI.
          if (options.onSuccess) {
            options.onSuccess(data, variables, queryClient)
          }
          toast.success('Disimpan secara offline!', {
            description: 'Tindakan ini akan disinkronkan saat koneksi tersedia.',
          })
        } else {
          if (options.onSuccess) {
            options.onSuccess(data, variables, queryClient)
          }
          if (options.successMessage) {
            const message =
              typeof options.successMessage === 'function'
                ? options.successMessage(data, variables)
                : options.successMessage
            const description =
              typeof options.successDescription === 'function'
                ? options.successDescription(data, variables)
                : options.successDescription
            toast.success(message, { description })
          }
        }
      },
      onError: (error, variables) => {
        if (options.onError) {
          options.onError(error, variables, queryClient)
        } else if (options.errorAction) {
          toast.error(`Gagal ${options.errorAction}`, { description: translateError(error) })
        }
      },
    })
  }
}
