'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPatientAction, updatePatientAction, deletePatientAction } from '@/modules/patients/actions/patient-actions'

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Parameters<typeof createPatientAction>[0]) => {
      const result = await createPatientAction(data)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof updatePatientAction>[1] }) => {
      const result = await updatePatientAction(id, data)
      if ('error' in result && result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePatientAction(id)
      if ('error' in result && result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['consultations'] })
    },
  })
}
