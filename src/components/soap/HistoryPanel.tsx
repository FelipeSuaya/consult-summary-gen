import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Calendar, 
  FileText, 
  X, 
  ChevronRight,
  Clock
} from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/utils/format";

interface HistoryEntry {
  id: string;
  date: string;
  summary: string;
  diagnosis?: string;
  clinician?: string;
  type: "consulta" | "emergencia" | "control" | "interconsulta";
  status: "completo" | "borrador";
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelectEntry?: (entryId: string) => void;
  className?: string;
}

const HistoryPanel = ({ 
  isOpen, 
  onClose, 
  entries, 
  onSelectEntry, 
  className = "" 
}: HistoryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const getTypeConfig = (type: HistoryEntry["type"]) => {
    switch (type) {
      case "emergencia":
        return { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300", label: "Emergencia" };
      case "interconsulta":
        return { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300", label: "Interconsulta" };
      case "control":
        return { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300", label: "Control" };
      default:
        return { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300", label: "Consulta" };
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.clinician?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <Card className={`fixed top-0 right-0 h-full w-80 xl:w-96 shadow-2xl z-40 bg-card/95 backdrop-blur-sm border-l ${className} transition-transform duration-200`}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Historial reciente</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en historial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? "No se encontraron resultados" : "Sin historial previo"}
                </p>
              </div>
            ) : (
              filteredEntries.map((entry, index) => {
                const typeConfig = getTypeConfig(entry.type);
                
                return (
                  <div key={entry.id}>
                    <Button
                      variant="ghost"
                      className="w-full p-4 h-auto text-left justify-start hover:bg-muted/50 group"
                      onClick={() => onSelectEntry?.(entry.id)}
                    >
                      <div className="flex-1 space-y-2">
                        {/* Fecha y tipo */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(entry.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${typeConfig.color} text-xs px-2 py-0`}
                            >
                              {typeConfig.label}
                            </Badge>
                            {entry.status === "borrador" && (
                              <Badge variant="outline" className="text-xs px-2 py-0">
                                Borrador
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Resumen */}
                        <p className="text-sm font-medium line-clamp-2 text-left">
                          {entry.summary}
                        </p>
                        
                        {/* Diagnóstico si existe */}
                        {entry.diagnosis && (
                          <p className="text-xs text-muted-foreground line-clamp-1 text-left">
                            Dx: {entry.diagnosis}
                          </p>
                        )}
                        
                        {/* Médico */}
                        {entry.clinician && (
                          <p className="text-xs text-muted-foreground text-left">
                            {entry.clinician}
                          </p>
                        )}
                      </div>
                      
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors ml-2" />
                    </Button>
                    
                    {index < filteredEntries.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HistoryPanel;