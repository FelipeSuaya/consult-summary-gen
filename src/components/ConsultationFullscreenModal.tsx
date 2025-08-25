import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Printer } from "lucide-react";
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

      // Configurar el elemento para impresión
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

      // Si el contenido es muy largo, agregar páginas adicionales
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
      <DialogContent 
        className="max-w-none w-screen h-screen max-h-screen p-0 gap-0"
        style={{ margin: 0 }}
      >
        {/* Header con controles */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Consulta - {format(new Date(consultation.dateTime), "PPP", { locale: es })}
            </h2>
            <div className="text-sm text-gray-500">
              {format(new Date(consultation.dateTime), "p", { locale: es })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cerrar
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div id="consultation-print-content" className="max-w-4xl mx-auto p-6 bg-white min-h-full">
            {/* Header de impresión */}
            <PrintHeader
              patientName={patientName}
              age={patientAge}
              id={patientId}
              dateTime={consultation.dateTime}
              clinician={'No especificado'}
              version="1.0"
            />

            {/* Audio si existe */}
            {consultation.audioUrl && (
              <div className="mb-6 print:hidden">
                <h4 className="font-medium mb-2 text-gray-900 flex items-center gap-2">
                  Audio de la consulta:
                </h4>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <audio controls className="w-full">
                    <source src={consultation.audioUrl} type="audio/webm" />
                    Su navegador no soporta el elemento de audio.
                  </audio>
                </div>
              </div>
            )}

            {/* Contenido SOAP */}
            <div className="space-y-6">
              <MedicalSoapCards soapData={soapData} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationFullscreenModal;