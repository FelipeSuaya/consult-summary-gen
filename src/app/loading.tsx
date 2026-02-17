import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<div className="min-h-screen bg-background">
			<div className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
				<div className="container flex h-14 items-center justify-between">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-8 w-24" />
				</div>
			</div>
			<main className="container py-6 max-w-6xl">
				<div className="space-y-6">
					<Skeleton className="h-10 w-64" />
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
						<div className="lg:col-span-2">
							<Skeleton className="h-64 rounded-xl" />
						</div>
						<div className="lg:col-span-3">
							<Skeleton className="h-64 rounded-xl" />
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
