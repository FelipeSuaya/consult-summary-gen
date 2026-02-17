import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import '@/index.css'

export const metadata: Metadata = {
	title: 'ConsultSummary',
	description: 'Documentación médica inteligente - Transcribe, resume y organiza consultas médicas automáticamente con IA.',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="es" suppressHydrationWarning>
			<head>
				<link
					href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="min-h-screen bg-background text-foreground antialiased">
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	)
}
