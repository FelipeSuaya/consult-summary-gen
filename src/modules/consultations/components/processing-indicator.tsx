'use client'

import { useEffect, useState } from 'react'
import { useProcessingQueueStore, STEP_LABELS } from '@/modules/consultations/stores/processing-queue-store'
import { useConsultationUiStore } from '@/modules/consultations/stores/consultation-ui-store'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2, Eye, RotateCcw, X } from 'lucide-react'
import type { ProcessingJob } from '@/modules/consultations/stores/processing-queue-store'

export function ProcessingIndicator() {
	const jobs = useProcessingQueueStore((s) => s.jobs)
	const removeJob = useProcessingQueueStore((s) => s.removeJob)
	const updateJob = useProcessingQueueStore((s) => s.updateJob)
	const openConsultationSheet = useConsultationUiStore((s) => s.openConsultationSheet)

	const activeJobs = jobs.filter((j) => j.step !== 'completed' && j.step !== 'failed')
	const completedJobs = jobs.filter((j) => j.step === 'completed')
	const failedJobs = jobs.filter((j) => j.step === 'failed')

	if (jobs.length === 0) return null

	const currentJob = activeJobs[0]
	const queuedCount = jobs.filter((j) => j.step === 'queued').length

	return (
		<div className="mt-4 space-y-2">
			{/* Active processing */}
			{currentJob && (
				<ActiveJobCard job={currentJob} queuedCount={queuedCount} />
			)}

			{/* Completed jobs */}
			{completedJobs.map((job) => (
				<CompletedJobCard
					key={job.id}
					job={job}
					onView={() => job.resultId && openConsultationSheet(job.resultId)}
					onDismiss={() => removeJob(job.id)}
				/>
			))}

			{/* Failed jobs */}
			{failedJobs.map((job) => (
				<FailedJobCard
					key={job.id}
					job={job}
					onRetry={() => updateJob(job.id, { step: 'queued', progress: 0, error: undefined })}
					onDismiss={() => removeJob(job.id)}
				/>
			))}
		</div>
	)
}

function ActiveJobCard({ job, queuedCount }: { job: ProcessingJob; queuedCount: number }) {
	return (
		<div className="rounded-lg border border-border bg-card p-3 shadow-sm">
			<div className="flex items-center gap-2.5">
				<div className="relative flex h-5 w-5 items-center justify-center">
					<Loader2 className="h-4 w-4 animate-spin text-primary" />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-foreground truncate">
							{job.patientName}
						</span>
						{queuedCount > 0 && (
							<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
								+{queuedCount} en cola
							</span>
						)}
					</div>
					<p className="text-xs text-muted-foreground">{STEP_LABELS[job.step]}</p>
				</div>
			</div>
			{/* Progress bar */}
			<div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
				<div
					className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
					style={{ width: `${job.progress}%` }}
				/>
			</div>
		</div>
	)
}

function CompletedJobCard({
	job,
	onView,
	onDismiss,
}: {
	job: ProcessingJob
	onView: () => void
	onDismiss: () => void
}) {
	// Auto-dismiss after 8 seconds
	useEffect(() => {
		const timer = setTimeout(onDismiss, 8000)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 p-3 shadow-sm">
			<div className="flex items-center gap-2.5">
				<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
				<div className="flex-1 min-w-0">
					<span className="text-sm font-medium text-foreground truncate block">
						{job.patientName}
					</span>
					<p className="text-xs text-green-700 dark:text-green-400">Consulta lista</p>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={onView}
						className="h-7 px-2 text-xs text-green-700 hover:text-green-900 dark:text-green-400"
					>
						<Eye className="h-3 w-3 mr-1" />
						Ver
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onDismiss}
						className="h-7 w-7 p-0 text-muted-foreground"
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</div>
	)
}

function FailedJobCard({
	job,
	onRetry,
	onDismiss,
}: {
	job: ProcessingJob
	onRetry: () => void
	onDismiss: () => void
}) {
	return (
		<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 shadow-sm">
			<div className="flex items-center gap-2.5">
				<AlertCircle className="h-4 w-4 text-destructive shrink-0" />
				<div className="flex-1 min-w-0">
					<span className="text-sm font-medium text-foreground truncate block">
						{job.patientName}
					</span>
					<p className="text-xs text-destructive/80 truncate">{job.error || 'Error desconocido'}</p>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={onRetry}
						className="h-7 px-2 text-xs text-destructive hover:text-destructive"
					>
						<RotateCcw className="h-3 w-3 mr-1" />
						Reintentar
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onDismiss}
						className="h-7 w-7 p-0 text-muted-foreground"
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</div>
	)
}
