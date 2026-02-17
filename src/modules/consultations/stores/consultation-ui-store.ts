import { create } from 'zustand'

interface ConsultationUiState {
  activeTab: string
  selectedConsultationId: string | null
  showNewConsultation: boolean
  sheetOpen: boolean
  setActiveTab: (tab: string) => void
  setSelectedConsultationId: (id: string | null) => void
  setShowNewConsultation: (show: boolean) => void
  openConsultationSheet: (id: string) => void
  closeConsultationSheet: () => void
}

export const useConsultationUiStore = create<ConsultationUiState>((set) => ({
  activeTab: 'consultas',
  selectedConsultationId: null,
  showNewConsultation: false,
  sheetOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedConsultationId: (id) => set({ selectedConsultationId: id }),
  setShowNewConsultation: (show) => set({ showNewConsultation: show }),
  openConsultationSheet: (id) => set({ selectedConsultationId: id, sheetOpen: true }),
  closeConsultationSheet: () => set({ sheetOpen: false, selectedConsultationId: null }),
}))
