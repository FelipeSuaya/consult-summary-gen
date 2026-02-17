'use client'
import { useQuery } from '@tanstack/react-query'
import { getConsultationsAction, getConsultationByIdAction, getConsultationsByPatientAction } from '@/modules/consultations/actions/consultation-actions'

export function useConsultations() {
  return useQuery({
    queryKey: ['consultations'],
    queryFn: () => getConsultationsAction(),
  })
}

export function useConsultationById(id: string | null) {
  return useQuery({
    queryKey: ['consultations', id],
    queryFn: () => getConsultationByIdAction(id!),
    enabled: !!id,
  })
}

export function useConsultationsByPatient(patientId: string | null) {
  return useQuery({
    queryKey: ['consultations', 'patient', patientId],
    queryFn: () => getConsultationsByPatientAction(patientId!),
    enabled: !!patientId,
  })
}
