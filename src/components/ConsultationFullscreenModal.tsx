import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Printer, Volume2, Calendar, User } from "lucide-react";
import { ConsultationRecord } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MedicalSoapCards from "@/components/soap/MedicalSoapCards";
import PrintHeader from "@/components/soap/PrintHeader";
import { parseTextToSoapData } from "@/lib/utils";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from "@/components/ui/use-toast";

interface ConsultationFullscreenModalProps {
  consultation: ConsultationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientAge?: string;
  patientId?: string;
}

const ConsultationFullscreenModal = ({
  consultation,
  isOpen,
  onClose,
  patientName,
  patientAge,
  patientId
}: ConsultationFullscreenModalProps) => {
  const { toast } = useToast();

  const handleExportPDF = async () => {
    if (!consultation) return;

    try {
      toast({
        title: "Generando PDF",
        description: "Por favor espera mientras se genera el documento..."
      });

      const element = document.getElementById('consultation-print-content');
      if (!element) return;

      element.style.width = '210mm';
      element.style.minHeight = 'auto';
      element.style.padding = '20px';
      element.style.backgroundColor = 'white';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      if (imgHeight * ratio > pdfHeight) {
        const totalPages = Math.ceil((imgHeight * ratio) / pdfHeight);
        for (let i = 1; i < totalPages; i++) {
          pdf.addPage();
          const yOffset = -pdfHeight * i;
          pdf.addImage(imgData, 'PNG', imgX, imgY + yOffset, imgWidth * ratio, imgHeight * ratio);
        }
      }

      const fileName = `consulta_${patientName?.replace(/\s+/g, '_') || 'paciente'}_${format(new Date(consultation.dateTime), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      // Reset styles
      element.style.width = '';
      element.style.minHeight = '';
      element.style.padding = '';
      element.style.backgroundColor = '';

      toast({
        title: "PDF generado",
        description: "El documento se ha descargado correctamente"
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!consultation) return null;

  const soapData = parseTextToSoapData(consultation.summary || '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          {/* Floating toolbar */}
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-border/60 print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="text-sm font-medium text-foreground">
                  {patientName || consultation.patientName}
                </span>
              </div>
              <span className="text-border">·</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-sm">
                  {format(new Date(consultation.dateTime), "d MMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
              {patientAge && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-sm text-muted-foreground">{patientAge} años</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={handleExportPDF}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                PDF
              </Button>
              <Button
                onClick={handlePrint}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Imprimir
              </Button>
              <div className="w-px h-5 bg-border/60 mx-1" />
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div id="consultation-print-content" className="max-w-4xl mx-auto px-6 py-8 print:bg-white">
              {/* Print header (hidden on screen) */}
              <PrintHeader
                patientName={patientName}
                age={patientAge}
                id={patientId}
                dateTime={consultation.dateTime}
                clinician={'No especificado'}
                version="1.0"
              />

              {/* Audio player */}
              {consultation.audioUrl && (
                <div className="mb-8 print:hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="h-4 w-4 text-primary/70" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Audio de la consulta
                    </span>
                  </div>
                  <audio controls className="w-full h-10 rounded-lg [&::-webkit-media-controls-panel]:bg-muted/50">
                    <source src={consultation.audioUrl} type="audio/webm" />
                    Su navegador no soporta el elemento de audio.
                  </audio>
                </div>
              )}

              {/* SOAP content */}
              <MedicalSoapCards soapData={soapData} />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ConsultationFullscreenModal;
