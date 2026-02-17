'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useConsultationUiStore } from '@/modules/consultations/stores/consultation-ui-store'
import { useConsultationById } from '@/modules/consultations/hooks/use-consultation-queries'
import ConsultationDetail from '@/components/ConsultationDetail'
import { Loader2 } from 'lucide-react'

export function ConsultationSheet() {
	const sheetOpen = useConsultationUiStore((s) => s.sheetOpen)
	const selectedConsultationId = useConsultationUiStore((s) => s.selectedConsultationId)
	const closeConsultationSheet = useConsultationUiStore((s) => s.closeConsultationSheet)

	const { data: consultation, isLoading } = useConsultationById(selectedConsultationId)

	return (
		<Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeConsultationSheet() }}>
			<SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
				<SheetHeader className="sr-only">
					<SheetTitle>Detalle de Consulta</SheetTitle>
					<SheetDescription>Información completa de la consulta médica</SheetDescription>
				</SheetHeader>

				{isLoading && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				)}

				{consultation && (
					<ConsultationDetail
						consultation={consultation}
						onBack={closeConsultationSheet}
						variant="sheet"
					/>
				)}

				{!isLoading && !consultation && selectedConsultationId && (
					<div className="text-center py-12 text-muted-foreground text-sm">
						No se encontró la consulta
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}
