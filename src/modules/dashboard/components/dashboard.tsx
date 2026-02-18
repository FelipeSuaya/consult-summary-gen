'use client'

import { useState } from 'react'
import { Header } from '@/modules/dashboard/components/header'
import AudioRecorder from '@/components/AudioRecorder'
import ConsultationsList from '@/components/ConsultationsList'
import PatientsList from '@/components/PatientsList'
import { Patient } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Users, BarChart3 } from 'lucide-react'
import { useProcessingOrchestrator } from '@/modules/consultations/hooks/use-processing-orchestrator'
import { useConsultationUiStore } from '@/modules/consultations/stores/consultation-ui-store'
import { ProcessingIndicator } from '@/modules/consultations/components/processing-indicator'
import { ConsultationSheet } from '@/modules/consultations/components/consultation-sheet'

export function Dashboard({ userEmail }: { userEmail: string }) {
	const [activeTab, setActiveTab] = useState('consultas')
	const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<Patient | null>(null)

	const openConsultationSheet = useConsultationUiStore((s) => s.openConsultationSheet)

	// Mount orchestrator — processes jobs from the queue in background
	useProcessingOrchestrator()

	function handleConsultationSelect(consultation: { id: string }) {
		openConsultationSheet(consultation.id)
	}

	function handleStartConsultationForPatient(patient: Patient) {
		setSelectedPatientForConsultation(patient)
		setActiveTab('consultas')
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container py-6 max-w-6xl">
				<div className="space-y-6">
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h1 className="text-2xl font-extrabold text-foreground tracking-tight">
									{activeTab === 'consultas' ? 'Consultas' : activeTab === 'pacientes' ? 'Pacientes' : 'Estadísticas'}
								</h1>
								<p className="text-sm text-muted-foreground mt-0.5">
									{activeTab === 'consultas'
										? 'Graba y gestiona consultas médicas'
										: activeTab === 'pacientes'
											? 'Gestiona tu base de pacientes'
											: 'Análisis de datos clínicos'}
								</p>
							</div>
							<TabsList className="bg-secondary/60 border border-border/50 p-1 h-auto">
								<TabsTrigger
									value="consultas"
									className="flex items-center gap-1.5 px-3.5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-wuru rounded-md transition-all"
								>
									<Mic className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Consultas</span>
								</TabsTrigger>
								<TabsTrigger
									value="pacientes"
									className="flex items-center gap-1.5 px-3.5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-wuru rounded-md transition-all"
								>
									<Users className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Pacientes</span>
								</TabsTrigger>
								<TabsTrigger
									value="estadisticas"
									className="flex items-center gap-1.5 px-3.5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-wuru rounded-md transition-all"
								>
									<BarChart3 className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Estadísticas</span>
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="consultas" className="animate-fade-in mt-0">
							<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
								<div className="lg:col-span-2">
									<div className="rounded-2xl border border-border bg-card p-5 shadow-wuru hover:shadow-wuru-hover hover:-translate-y-1 transition-all duration-300">
										<div className="flex items-center justify-between mb-4">
											<div>
												<h2 className="text-base font-semibold text-foreground">
													Nueva Consulta
												</h2>
												{selectedPatientForConsultation && (
													<p className="text-xs text-primary font-medium mt-0.5">
														{selectedPatientForConsultation.name}
													</p>
												)}
											</div>
											<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
												<Mic className="h-4 w-4 text-primary" />
											</div>
										</div>

										<AudioRecorder
											preselectedPatient={selectedPatientForConsultation}
										/>

										{selectedPatientForConsultation && (
											<div className="mt-4 pt-3 border-t border-border/50">
												<button
													onClick={() => setSelectedPatientForConsultation(null)}
													className="text-xs text-muted-foreground hover:text-primary transition-colors"
												>
													Cambiar paciente
												</button>
											</div>
										)}
									</div>

									{/* Processing indicator below the recorder card */}
									<ProcessingIndicator />
								</div>

								<div className="lg:col-span-3">
									<div className="rounded-2xl border border-border bg-card p-5 shadow-wuru hover:shadow-wuru-hover hover:-translate-y-1 transition-all duration-300 h-full">
										<div className="flex items-center justify-between mb-4">
											<h2 className="text-base font-semibold text-foreground">
												Análisis por Paciente
											</h2>
											<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
												<BarChart3 className="h-4 w-4 text-primary" />
											</div>
										</div>
										<ConsultationsList onConsultationSelect={handleConsultationSelect} />
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="pacientes" className="animate-fade-in mt-0">
							<PatientsList onStartConsultation={handleStartConsultationForPatient} />
						</TabsContent>

						<TabsContent value="estadisticas" className="animate-fade-in mt-0">
							<div className="rounded-2xl border border-border bg-card p-5 shadow-wuru">
								<ConsultationsList onConsultationSelect={handleConsultationSelect} />
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</main>

			{/* Consultation detail sheet — always mounted, controlled by store */}
			<ConsultationSheet />
		</div>
	)
}
