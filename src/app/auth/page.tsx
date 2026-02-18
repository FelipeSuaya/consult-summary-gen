import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AuthForm } from '@/modules/auth/components/auth-form'
import { Activity, Mic, Sparkles, Shield } from 'lucide-react'

export default async function AuthPage() {
	const supabase = await createServerSupabaseClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (user) {
		redirect('/')
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
				<div className="container flex h-14 items-center">
					<div className="flex items-center gap-2.5">
						<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-wuru">
							<Activity className="h-4 w-4" strokeWidth={2.5} />
						</div>
						<span className="text-base font-bold tracking-tight text-foreground">
							ConsultSummary
						</span>
					</div>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center p-6">
				<div className="w-full max-w-4xl mx-auto">
					<div className="grid md:grid-cols-2 gap-12 items-center">
						<div className="space-y-8 animate-fade-in">
							<div>
								<h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">
									Documentación médica
									<br />
									<span className="text-primary">inteligente</span>
								</h1>
								<p className="text-muted-foreground leading-relaxed">
									Transcribe, resume y organiza consultas médicas automáticamente con IA.
								</p>
							</div>

							<div className="space-y-4">
								{[
									{ icon: Mic, title: 'Transcripción automática', desc: 'Audio a texto estructurado en tiempo real' },
									{ icon: Sparkles, title: 'Resúmenes con IA', desc: 'Notas SOAP generadas automáticamente' },
									{ icon: Shield, title: 'Datos seguros', desc: 'Encriptación y cumplimiento normativo' },
								].map(({ icon: Icon, title, desc }) => (
									<div key={title} className="flex items-start gap-3">
										<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary shrink-0 mt-0.5">
											<Icon className="h-4 w-4" />
										</div>
										<div>
											<h3 className="text-sm font-semibold text-foreground">{title}</h3>
											<p className="text-xs text-muted-foreground">{desc}</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="animate-slide-up">
							<AuthForm />
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
