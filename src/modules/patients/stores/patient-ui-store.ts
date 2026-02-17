import { create } from 'zustand'

interface PatientUiState {
  searchTerm: string
  sortDirection: 'asc' | 'desc'
  expandedPatientId: string | null
  setSearchTerm: (term: string) => void
  setSortDirection: (dir: 'asc' | 'desc') => void
  setExpandedPatientId: (id: string | null) => void
}

export const usePatientUiStore = create<PatientUiState>((set) => ({
  searchTerm: '',
  sortDirection: 'asc',
  expandedPatientId: null,
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSortDirection: (dir) => set({ sortDirection: dir }),
  setExpandedPatientId: (id) => set({ expandedPatientId: id }),
}))
