'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useProcessingQueueStore } from '@/modules/consultations/stores/processing-queue-store'
import { uploadToAssemblyAI, transcribeAudio, generateSoapSummary, uploadAudioToStorage } from '@/lib/processing-pipeline'
import { createConsultationAction } from '@/modules/consultations/actions/consultation-actions'
import { groqApi } from '@/lib/api'
import { LoggingService } from '@/lib/logging'
import { toast } from '@/hooks/use-toast'
import type { ProcessingJob } from '@/modules/consultations/stores/processing-queue-store'

export function useProcessingOrchestrator() {
	const jobs = useProcessingQueueStore((s) => s.jobs)
	const setJobStep = useProcessingQueueStore((s) => s.setJobStep)
	const failJob = useProcessingQueueStore((s) => s.failJob)
	const updateJob = useProcessingQueueStore((s) => s.updateJob)
	const queryClient = useQueryClient()
	const processingRef = useRef(false)

	useEffect(() => {
		const nextJob = jobs.find((j) => j.step === 'queued')
		if (!nextJob || processingRef.current) return

		processingRef.current = true
		processJob(nextJob).finally(() => {
			processingRef.current = false
		})
	}, [jobs])

	async function processJob(job: ProcessingJob) {
		const { id, audioBlob, patientName, patientId, dateTime } = job

		try {
			// Step 1: Upload to AssemblyAI + Supabase Storage in parallel
			setJobStep(id, 'uploading')
			const consultationId = job.id
			const [assemblyUrl, audioUrl] = await Promise.all([
				uploadToAssemblyAI(audioBlob),
				uploadAudioToStorage(audioBlob, consultationId).catch((err) => {
					// Non-fatal: log but don't block the pipeline
					LoggingService.error('processing-orchestrator', 'Audio storage upload failed (non-fatal)', {
						jobId: id,
						error: err instanceof Error ? err.message : 'Unknown error',
					})
					return undefined
				}),
			])

			// Step 2: Transcribe
			setJobStep(id, 'transcribing')
			const transcription = await transcribeAudio(assemblyUrl)

			// Step 3: Generate SOAP
			setJobStep(id, 'generating_soap')
			const summary = await generateSoapSummary(transcription)

			// Step 4: Save
			setJobStep(id, 'saving')
			const patientData = groqApi.extractPatientData(summary)

			await createConsultationAction({
				id: consultationId,
				patientName: patientName.trim(),
				dateTime,
				transcription,
				summary,
				patientData,
				patientId,
				audioUrl,
			})

			// Invalidate TanStack Query cache
			await queryClient.invalidateQueries({ queryKey: ['consultations'] })
			await queryClient.invalidateQueries({ queryKey: ['patients'] })

			// Mark completed
			updateJob(id, { step: 'completed', progress: 100, resultId: consultationId })

			toast({
				title: 'Consulta lista',
				description: `${patientName} - procesada exitosamente`,
			})

			await LoggingService.info('processing-orchestrator', 'Job completed', {
				jobId: id,
				consultationId,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error desconocido'
			failJob(id, message)

			toast({
				title: 'Error al procesar consulta',
				description: `${patientName}: ${message}`,
				variant: 'destructive',
			})

			await LoggingService.error('processing-orchestrator', 'Job failed', {
				jobId: id,
				error: message,
			})
		}
	}
}
