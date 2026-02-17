'use client'
import { useQuery } from '@tanstack/react-query'
import { getPatientsAction, getPatientByIdAction, searchPatientsAction } from '@/modules/patients/actions/patient-actions'

export function usePatients(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['patients', startDate, endDate],
    queryFn: async () => {
      const result = await getPatientsAction(startDate, endDate)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })
}

export function usePatientById(id: string | null) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const result = await getPatientByIdAction(id!)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    enabled: !!id,
  })
}

export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: async () => {
      const result = await searchPatientsAction(query)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
    enabled: query.length >= 2,
  })
}
