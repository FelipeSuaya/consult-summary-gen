'use client'

import { useEffect, useState } from 'react'
import { useProcessingQueueStore, STEP_LABELS } from '@/modules/consultations/stores/processing-queue-store'
import { useConsultationUiStore } from '@/modules/consultations/stores/consultation-ui-store'
import { useUpdatePatient } from '@/modules/patients/hooks/use-patient-mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, AlertCircle, Loader2, Eye, RotateCcw, X, UserPlus } from 'lucide-react'
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
	const [showPatientDialog, setShowPatientDialog] = useState(false)

	// Auto-dismiss after 8 seconds (only if not a new patient needing data)
	useEffect(() => {
		if (job.isNewPatient) return
		const timer = setTimeout(onDismiss, 8000)
		return () => clearTimeout(timer)
	}, [])

	return (
		<>
			<div className="rounded-lg border border-green-900 bg-green-950/20 p-3 shadow-sm">
				<div className="flex items-center gap-2.5">
					<CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
					<div className="flex-1 min-w-0">
						<span className="text-sm font-medium text-foreground truncate block">
							{job.patientName}
						</span>
						<p className="text-xs text-green-400">Consulta lista</p>
					</div>
					<div className="flex items-center gap-1">
						{job.isNewPatient && job.patientId && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowPatientDialog(true)}
								className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300"
							>
								<UserPlus className="h-3 w-3 mr-1" />
								Completar datos
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={onView}
							className="h-7 px-2 text-xs text-green-400 hover:text-green-300"
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
			{job.patientId && (
				<PatientDataDialog
					open={showPatientDialog}
					onOpenChange={setShowPatientDialog}
					patientId={job.patientId}
					patientName={job.patientName}
				/>
			)}
		</>
	)
}

function PatientDataDialog({
	open,
	onOpenChange,
	patientId,
	patientName,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	patientId: string
	patientName: string
}) {
	const [dni, setDni] = useState('')
	const [phone, setPhone] = useState('')
	const [age, setAge] = useState('')
	const [email, setEmail] = useState('')
	const [notes, setNotes] = useState('')
	const { toast } = useToast()
	const updatePatient = useUpdatePatient()

	const handleSave = () => {
		updatePatient.mutate(
			{ id: patientId, data: { dni, phone, age, email, notes } },
			{
				onSuccess: () => {
					toast({ title: 'Datos guardados', description: `Paciente ${patientName} actualizado` })
					onOpenChange(false)
				},
				onError: (err) => {
					toast({ title: 'Error', description: err.message, variant: 'destructive' })
				},
			}
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Completar datos de {patientName}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<div>
						<Label htmlFor="pd-dni">DNI</Label>
						<Input id="pd-dni" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678" />
					</div>
					<div>
						<Label htmlFor="pd-phone">Teléfono</Label>
						<Input id="pd-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
					</div>
					<div>
						<Label htmlFor="pd-age">Edad</Label>
						<Input id="pd-age" value={age} onChange={(e) => setAge(e.target.value)} placeholder="35" />
					</div>
					<div>
						<Label htmlFor="pd-email">Email</Label>
						<Input id="pd-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="paciente@email.com" />
					</div>
					<div>
						<Label htmlFor="pd-notes">Notas</Label>
						<Input id="pd-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones generales" />
					</div>
					<Button onClick={handleSave} disabled={updatePatient.isPending} className="w-full">
						{updatePatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
						Guardar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
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
