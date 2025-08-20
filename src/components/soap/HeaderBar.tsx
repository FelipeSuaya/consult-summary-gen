
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Copy, 
  Eye, 
  Download,
  User,
  Calendar,
  FileText
} from "lucide-react";
import { formatDate, copyToClipboard, generatePlainTextSummary } from "@/utils/format";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface HeaderBarProps {
  patientName?: string;
  age?: string;
  id?: string;
  dateTime?: string;
  clinician?: string;
  version?: string;
  source?: "AI" | "MD";
  soapData: any;
  onToggleHighlight?: () => void;
  highlightEnabled?: boolean;
}

const HeaderBar = ({ 
  patientName, 
  age, 
  id, 
  dateTime, 
  clinician, 
  version, 
  source,
  soapData,
  onToggleHighlight,
  highlightEnabled = false
}: HeaderBarProps) => {
  const { toast } = useToast();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleCopyAll = async () => {
    const plainText = generatePlainTextSummary(soapData);
    const success = await copyToClipboard(plainText);
    
    toast({
      title: success ? "Copiado" : "Error",
      description: success ? "Resumen copiado al portapapeles" : "No se pudo copiar al portapapeles",
      variant: success ? "default" : "destructive",
    });
  };

  const handlePrint = () => {
    window.print();
    setExportDialogOpen(false);
  };

  const getSourceBadge = () => {
    if (source === "AI") {
      return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">IA</Badge>;
    }
    if (source === "MD") {
      return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Médico</Badge>;
    }
    return null;
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b print:hidden">
      <div className="flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold truncate">
                {patientName || 'Sin nombre'}
              </h1>
              {(age || id) && (
                <p className="text-sm text-muted-foreground">
                  {age && <span>{age}</span>}
                  {age && id && <span> • </span>}
                  {id && <span>ID: {id}</span>}
                </p>
              )}
            </div>
          </div>
          
          {dateTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(dateTime)}</span>
            </div>
          )}

          {clinician && (
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{clinician}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {getSourceBadge()}
            {version && (
              <Badge variant="outline" className="text-xs">
                {version}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleHighlight && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleHighlight}
              className={highlightEnabled ? "bg-blue-50 text-blue-700" : ""}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">
                {highlightEnabled ? "Ocultar" : "Resaltar"}
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Copiar</span>
          </Button>

          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Exportar</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar resumen</DialogTitle>
                <DialogDescription>
                  Selecciona el formato de exportación
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button onClick={handlePrint} className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Imprimir / Guardar como PDF
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
