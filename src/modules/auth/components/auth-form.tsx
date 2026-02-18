'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction, registerAction } from '@/modules/auth/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

export function AuthForm() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const { toast } = useToast()

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		const { error } = await loginAction(email, password)

		if (error) {
			toast({
				title: 'Error de inicio de sesión',
				description: error,
				variant: 'destructive',
			})
		} else {
			router.push('/')
			router.refresh()
		}

		setLoading(false)
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		if (password.length < 6) {
			toast({
				title: 'Error de registro',
				description: 'La contraseña debe tener al menos 6 caracteres',
				variant: 'destructive',
			})
			setLoading(false)
			return
		}

		const { error } = await registerAction(email, password)

		if (error) {
			toast({
				title: 'Error de registro',
				description: error,
				variant: 'destructive',
			})
		} else {
			toast({
				title: 'Registro exitoso',
				description: 'Por favor verifica tu correo electrónico para confirmar tu cuenta',
			})
		}

		setLoading(false)
	}

	return (
		<Card className="shadow-wuru border-border/40 bg-card">
			<CardHeader className="pb-4">
				<CardTitle className="text-xl">Acceso Profesional</CardTitle>
				<CardDescription>
					Inicia sesión o crea tu cuenta
				</CardDescription>
			</CardHeader>

			<Tabs defaultValue="login" className="w-full">
				<div className="px-6">
					<TabsList className="grid w-full grid-cols-2 mb-4">
						<TabsTrigger value="login">Ingresar</TabsTrigger>
						<TabsTrigger value="register">Registrarse</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="login">
					<form onSubmit={handleLogin}>
						<CardContent className="space-y-4 pt-0">
							<div className="space-y-2">
								<Label htmlFor="email" className="text-sm">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="doctor@ejemplo.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="h-10"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password" className="text-sm">Contraseña</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="h-10"
								/>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								type="submit"
								className="w-full h-10"
								disabled={loading}
							>
								{loading ? 'Ingresando...' : 'Iniciar Sesión'}
							</Button>
						</CardFooter>
					</form>
				</TabsContent>

				<TabsContent value="register">
					<form onSubmit={handleRegister}>
						<CardContent className="space-y-4 pt-0">
							<div className="space-y-2">
								<Label htmlFor="register-email" className="text-sm">Email</Label>
								<Input
									id="register-email"
									type="email"
									placeholder="doctor@ejemplo.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="h-10"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="register-password" className="text-sm">Contraseña</Label>
								<Input
									id="register-password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="h-10"
								/>
								<p className="text-xs text-muted-foreground">
									Mínimo 6 caracteres
								</p>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								type="submit"
								className="w-full h-10"
								disabled={loading}
							>
								{loading ? 'Registrando...' : 'Crear Cuenta'}
							</Button>
						</CardFooter>
					</form>
				</TabsContent>
			</Tabs>
		</Card>
	)
}
