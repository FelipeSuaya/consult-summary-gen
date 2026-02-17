'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error('App error:', error)
	}, [error])

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="text-center space-y-4 max-w-md px-6">
				<div className="flex justify-center">
					<div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
						<AlertCircle className="h-6 w-6 text-destructive" />
					</div>
				</div>
				<h2 className="text-xl font-semibold text-foreground">
					Algo salió mal
				</h2>
				<p className="text-sm text-muted-foreground">
					Ocurrió un error inesperado. Por favor intenta de nuevo.
				</p>
				<Button onClick={reset} variant="outline">
					Reintentar
				</Button>
			</div>
		</div>
	)
}
