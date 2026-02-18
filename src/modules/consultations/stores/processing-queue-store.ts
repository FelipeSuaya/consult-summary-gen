import { create } from 'zustand'

export type ProcessingStep =
	| 'queued'
	| 'uploading'
	| 'transcribing'
	| 'generating_soap'
	| 'correcting'
	| 'saving'
	| 'completed'
	| 'failed'

export interface ProcessingJob {
	id: string
	patientName: string
	patientId?: string
	isNewPatient?: boolean
	audioBlob: Blob
	audioUrl?: string
	realtimeTranscript?: string
	dateTime: string
	step: ProcessingStep
	progress: number
	error?: string
	resultId?: string
}

const STEP_PROGRESS: Record<ProcessingStep, number> = {
	queued: 0,
	uploading: 15,
	transcribing: 40,
	generating_soap: 70,
	correcting: 85,
	saving: 95,
	completed: 100,
	failed: 0,
}

interface ProcessingQueueState {
	jobs: ProcessingJob[]
	addJob: (job: Omit<ProcessingJob, 'step' | 'progress'>) => void
	updateJob: (id: string, updates: Partial<ProcessingJob>) => void
	setJobStep: (id: string, step: ProcessingStep) => void
	failJob: (id: string, error: string) => void
	removeJob: (id: string) => void
	clearCompleted: () => void
}

export const useProcessingQueueStore = create<ProcessingQueueState>((set) => ({
	jobs: [],

	addJob: (job) =>
		set((state) => ({
			jobs: [...state.jobs, { ...job, step: 'queued' as const, progress: 0 }],
		})),

	updateJob: (id, updates) =>
		set((state) => ({
			jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
		})),

	setJobStep: (id, step) =>
		set((state) => ({
			jobs: state.jobs.map((j) =>
				j.id === id ? { ...j, step, progress: STEP_PROGRESS[step] } : j
			),
		})),

	failJob: (id, error) =>
		set((state) => ({
			jobs: state.jobs.map((j) =>
				j.id === id ? { ...j, step: 'failed' as const, error } : j
			),
		})),

	removeJob: (id) =>
		set((state) => ({
			jobs: state.jobs.filter((j) => j.id !== id),
		})),

	clearCompleted: () =>
		set((state) => ({
			jobs: state.jobs.filter((j) => j.step !== 'completed'),
		})),
}))

export const STEP_LABELS: Record<ProcessingStep, string> = {
	queued: 'En cola',
	uploading: 'Subiendo audio...',
	transcribing: 'Transcribiendo...',
	generating_soap: 'Generando resumen SOAP...',
	correcting: 'Corrigiendo términos...',
	saving: 'Guardando consulta...',
	completed: 'Consulta lista',
	failed: 'Error en procesamiento',
}
