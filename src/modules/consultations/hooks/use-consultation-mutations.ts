'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createConsultationAction, updateConsultationAction, deleteConsultationAction } from '@/modules/consultations/actions/consultation-actions'

export function useCreateConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createConsultationAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateConsultationAction>[1] }) =>
      updateConsultationAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] })
    },
  })
}

export function useDeleteConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteConsultationAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
