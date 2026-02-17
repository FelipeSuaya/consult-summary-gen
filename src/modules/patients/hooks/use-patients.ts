'use client'
import { usePatients, usePatientById, useSearchPatients } from './use-patient-queries'
import { useCreatePatient, useUpdatePatient, useDeletePatient } from './use-patient-mutations'
import { usePatientUiStore } from '@/modules/patients/stores/patient-ui-store'

export function usePatientsModule() {
  const patients = usePatients()
  const createPatient = useCreatePatient()
  const updatePatient = useUpdatePatient()
  const deletePatient = useDeletePatient()
  const uiStore = usePatientUiStore()

  return {
    patients: patients.data ?? [],
    isLoading: patients.isLoading,
    error: patients.error,
    refetch: patients.refetch,
    createPatient,
    updatePatient,
    deletePatient,
    ...uiStore,
    usePatientById,
    useSearchPatients,
  }
}
