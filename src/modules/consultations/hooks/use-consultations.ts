'use client'
import { useConsultations, useConsultationById, useConsultationsByPatient } from './use-consultation-queries'
import { useCreateConsultation, useUpdateConsultation, useDeleteConsultation } from './use-consultation-mutations'
import { useConsultationUiStore } from '@/modules/consultations/stores/consultation-ui-store'

export function useConsultationsModule() {
  const consultations = useConsultations()
  const createConsultation = useCreateConsultation()
  const updateConsultation = useUpdateConsultation()
  const deleteConsultation = useDeleteConsultation()
  const uiStore = useConsultationUiStore()

  return {
    // Queries
    consultations: consultations.data ?? [],
    isLoading: consultations.isLoading,
    error: consultations.error,
    refetch: consultations.refetch,
    // Mutations
    createConsultation,
    updateConsultation,
    deleteConsultation,
    // UI State
    ...uiStore,
    // Derived hooks (use when needed)
    useConsultationById,
    useConsultationsByPatient,
  }
}
