import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  FileText, 
  History,
  MoreHorizontal,
  User,
  Calendar,
  Clock,
  MapPin
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/utils/format";

interface ClinicalHeaderProps {
  patientName?: string;
  age?: string;
  gender?: string;
  id?: string;
  dateTime?: string;
  duration?: string;
  clinician?: string;
  location?: string;
  status?: "borrador" | "completo" | "revisado";
  summary?: string;
  onCopyAll?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
  onToggleHistory?: () => void;
  className?: string;
}

const ClinicalHeader = ({
  patientName,
  age,
  gender,
  id,
  dateTime,
  duration,
  clinician,
  location,
  status = "borrador",
  summary,
  onCopyAll,
  onExportPDF,
  onPrint,
  onToggleHistory,
  className = ""
}: ClinicalHeaderProps) => {
  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(",")[0]
      .trim()
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completo":
        return "default";
      case "revisado":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completo":
        return "text-green-700 bg-green-50 border-green-200";
      case "revisado":
        return "text-blue-700 bg-blue-50 border-blue-200";
      default:
        return "text-amber-700 bg-amber-50 border-amber-200";
    }
  };

  return (
    <div className={`sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm print:hidden ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 lg:gap-2">
          {/* Primera línea: Paciente + Resumen + Acciones */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Avatar con iniciales */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <span className="text-sm font-semibold text-primary">
                  {getInitials(patientName)}
                </span>
              </div>
              
              {/* Info del paciente */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="font-medium text-foreground">
                    {patientName || "Paciente sin identificar"}
                  </span>
                  {age && <span>• {age}</span>}
                  {gender && <span>• {gender}</span>}
                  {id && <span>• HC {id}</span>}
                </div>
                
                {/* Resumen breve */}
                {summary && (
                  <div className="hidden sm:block flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {summary}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <Badge className={getStatusColor(status)}>
                {status}
              </Badge>
              
              <Button variant="outline" size="sm" onClick={onToggleHistory}>
                <History className="h-4 w-4 mr-1" />
                Historial
              </Button>
              
              <Button variant="outline" size="sm" onClick={onCopyAll}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
              
              <Button variant="outline" size="sm" onClick={onExportPDF}>
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>

            {/* Acciones mobile - menú kebab */}
            <div className="lg:hidden flex items-center gap-2">
              <Badge className={getStatusColor(status)} variant="outline">
                {status}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onToggleHistory}>
                    <History className="h-4 w-4 mr-2" />
                    Historial
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onCopyAll}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar todo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Segunda línea: Metadata + Resumen mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {dateTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(dateTime)}</span>
                </div>
              )}
              
              {duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{duration}</span>
                </div>
              )}
              
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              )}
              
              {clinician && (
                <span className="font-medium">
                  {clinician}
                </span>
              )}
            </div>

            {/* Resumen mobile */}
            {summary && (
              <div className="sm:hidden">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalHeader;