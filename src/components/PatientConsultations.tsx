import { useState } from "react";
import { ConsultationRecord } from "@/types";
import { useConsultationsByPatient } from '@/modules/consultations/hooks/use-consultation-queries';
import { useUpdateConsultation } from '@/modules/consultations/hooks/use-consultation-mutations';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, FileText, Clock, PencilLine, Save, X, HeartPulse, Users, TestTube } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import React from "react";
import MedicalSoapCards from "@/components/soap/MedicalSoapCards";
import { parseTextToSoapData } from "@/lib/utils";
import ConsultationFullscreenModal from "@/components/ConsultationFullscreenModal";

interface PatientConsultationsProps {
  patientId: string;
  patientName?: string;
  patientAge?: string;
}

const LAB_NAMES = [
  "hematocrito", "hemoglobina", "orina", "glucosa", "colesterol",
  "trigliceridos", "leucocitos", "eritrocitos", "plaquetas", "urea",
  "creatinina", "transaminasas", "bilirrubina", "proteinas", "albumina",
  "sodio", "potasio", "cloro", "calcio", "fosforo", "vsg", "hgb", "hb"
];

const getLabRowData = (rowArr: string[]) => {
  let resultIndex = -1;
  let studyIndex = -1;
  let estudio = "";
  let resultado = "";

  // Busca la columna que tenga un nombre de estudio común:
  for (let i = 0; i < rowArr.length; i++) {
    const val = rowArr[i].toLowerCase();
    if (LAB_NAMES.some(lab => val.includes(lab))) {
      studyIndex = i;
      break;
    }
  }
  // fallback: si no se detecta texto reconocible, asume el primero es el estudio
  if (studyIndex === -1) studyIndex = 0;

  // Busca resultado: número, negativo, positivo, o texto significativo
  for (let i = 0; i < rowArr.length; i++) {
    const val = rowArr[i].toLowerCase();
    if (
      (/\d/.test(rowArr[i]) && i !== studyIndex) ||
      val.includes("negativo") ||
      val.includes("positivo") ||
      val.match(/[\d\.,]+/)
    ) {
      resultIndex = i;
      break;
    }
  }
  // fallback: siguiente celda
  if (resultIndex === -1) resultIndex = studyIndex === 0 ? 1 : 0;

  estudio = rowArr[studyIndex]?.charAt(0).toUpperCase() + rowArr[studyIndex]?.slice(1);
  resultado = rowArr[resultIndex] || "-";
  return { estudio, resultado };
};

const renderMarkdownTable = (markdownTable: string) => {
  if (!markdownTable.includes('|')) return markdownTable;

  try {
    const isLabTable = /par[aá]metro|estudio|laboratorio/i.test(markdownTable) && /resultado/i.test(markdownTable);

    const rows = markdownTable.trim().split('\n');
    if (rows.length < 2) return markdownTable;

    const isSeparator = rows[1].trim().replace(/[^|\-\s]/g, '') === rows[1].trim();
    const dataStartIndex = isSeparator ? 2 : 1;
    const dataRows = rows.slice(dataStartIndex)
      .map(row => row.trim().split('|').map(cell => cell.trim()).filter(Boolean))
      .filter(row => row.length > 0);

    // Cuando es tabla de laboratorio, analizar filas
    if (isLabTable) {
      return (
        <Table className="mt-2 mb-4 border border-border">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-medium text-foreground">Estudio</TableHead>
              <TableHead className="font-medium text-foreground">Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((rowArr, idx) => {
              const { estudio, resultado } = getLabRowData(rowArr);
              return (
                <TableRow key={`lab-row-${idx}`} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                  <TableCell>{estudio || "-"}</TableCell>
                  <TableCell>{resultado || "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }

    const headerRow = rows[0].trim();
    const headers = headerRow
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '');

    const dataRowsGeneric = dataRows;

    return (
      <Table className="mt-2 mb-4 border border-border">
        <TableHeader className="bg-muted/30">
          <TableRow>
            {headers.map((header, i) => (
              <TableHead key={`header-${i}`} className="font-medium text-foreground">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataRowsGeneric.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-card" : "bg-muted/30"}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`cell-${rowIndex}-${cellIndex}`}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } catch (error) {
    console.error("Error parsing markdown table:", error);
    return markdownTable;
  }
};

const processTextWithTables = (text: string) => {
  if (!text) return null;
  
  const tablePattern = /(\|\s*[\w\s]+\s*\|\s*[\w\s]+\s*\|[\s\S]*?\n\s*\|[\s\-]+\|[\s\-]+\|[\s\S]*?(?=\n\s*\n|\n\s*[A-ZÁÉÍÓÚÑ]|$))/g;
  const sectionPattern = /\n([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+):\s*\n/g;
  
  const sectionsWithTables = text.split(sectionPattern);
  
  if (sectionsWithTables.length <= 1) {
    const tablesMatch = text?.match(tablePattern);
    if (tablesMatch) {
      let processedText = text;
      tablesMatch.forEach(tableText => {
        processedText = processedText.replace(tableText, `<table-placeholder-${Math.random()}>`);
      });
      
      return <div className="whitespace-pre-line">
        {processedText.split(/<table-placeholder-[^>]+>/).map((textPart, i) => (
          <React.Fragment key={`text-${i}`}>
            {textPart}
            {i < tablesMatch.length && renderMarkdownTable(tablesMatch[i])}
          </React.Fragment>
        ))}
      </div>;
    } else {
      return <div className="whitespace-pre-line">{text}</div>;
    }
  }
  
  let result: React.ReactNode[] = [];
  if (sectionsWithTables[0].trim()) {
    result.push(<div key="intro" className="mb-3">{sectionsWithTables[0]}</div>);
  }
  
  for (let i = 1; i < sectionsWithTables.length; i += 2) {
    if (i + 1 < sectionsWithTables.length) {
      const sectionTitle = sectionsWithTables[i].trim();
      const sectionContent = sectionsWithTables[i + 1].trim();
      
      let icon;
      switch (sectionTitle.toLowerCase().replace(/[áéíóúñ]/g, char => {
        return {á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n'}[char] || char;
      })) {
        case "datos personales":
          icon = <Users className="h-4 w-4" />;
          break;
        case "laboratorio":
          icon = <TestTube className="h-4 w-4" />;
          break;
        default:
          icon = <FileText className="h-4 w-4" />;
      }
      
      const tablesInSection = sectionContent?.match(tablePattern);
      
      if (tablesInSection) {
        let processedContent = sectionContent;
        tablesInSection.forEach(tableText => {
          processedContent = processedContent.replace(tableText, `<table-placeholder-${Math.random()}>`);
        });
        
        const contentParts = processedContent.split(/<table-placeholder-[^>]+>/);
        
        result.push(
          <div key={`section-${i}`} className="mb-4">
            <div className="mb-2 flex items-center gap-2 bg-muted/20 p-2 rounded-md">
              <div className="p-1.5 rounded-full bg-primary/20">
                {icon}
              </div>
              <h3 className="font-semibold text-foreground">{sectionTitle}</h3>
            </div>
            <div className="pl-2">
              {contentParts.map((textPart, j) => (
                <React.Fragment key={`part-${i}-${j}`}>
                  {textPart && <div className="whitespace-pre-line mb-2">{textPart}</div>}
                  {j < tablesInSection.length && renderMarkdownTable(tablesInSection[j])}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      } else {
        result.push(
          <div key={`section-${i}`} className="mb-4">
            <div className="mb-2 flex items-center gap-2 bg-muted/20 p-2 rounded-md">
              <div className="p-1.5 rounded-full bg-primary/20">
                {icon}
              </div>
              <h3 className="font-semibold text-foreground">{sectionTitle}</h3>
            </div>
            <div className="pl-2 whitespace-pre-line">{sectionContent}</div>
          </div>
        );
      }
    }
  }
  
  return <div className="space-y-2">{result}</div>;
};

const PatientConsultations = ({
  patientId,
  patientName,
  patientAge
}: PatientConsultationsProps) => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editedSummary, setEditedSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const { toast } = useToast();
  const updateConsultationMutation = useUpdateConsultation();

  const {
    data: consultations = [],
    isLoading,
    error,
    refetch
  } = useConsultationsByPatient(patientId);

  const handleEditSummary = (consultation: ConsultationRecord) => {
    setEditedSummary(consultation.summary || "");
    setEditMode(consultation.id);
    setSelectedConsultation(consultation);
    setShowEditDialog(true);
  };

  const handleSaveSummary = async (consultation: ConsultationRecord) => {
    if (!editedSummary.trim()) {
      toast({
        title: "Error",
        description: "El resumen no puede estar vacío",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      await updateConsultationMutation.mutateAsync({ id: consultation.id, data: { summary: editedSummary } });

      refetch();
      setEditMode(null);
      setShowEditDialog(false);
      toast({
        title: "Resumen actualizado",
        description: "El resumen ha sido actualizado correctamente"
      });
    } catch (error) {
      console.error("Error al guardar el resumen:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo actualizar el resumen",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setShowEditDialog(false);
  };

  if (isLoading) {
    return <div className="text-center py-6 bg-muted/30 rounded-lg animate-pulse">
      <div className="inline-block p-3 rounded-full bg-primary/20">
        <Clock className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-2 text-muted-foreground">Cargando historial de consultas...</p>
    </div>;
  }

  if (error) {
    console.error("Error fetching consultations:", error);
    return <div className="text-center py-6 bg-destructive/10 rounded-lg border border-destructive/30">
      <p className="text-destructive">Error al cargar historial: {String(error)}</p>
    </div>;
  }

  if (consultations.length === 0) {
    return <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
      <FileText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
      <p className="text-muted-foreground">No hay consultas registradas para este paciente.</p>
    </div>;
  }

  return <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
        <HeartPulse className="h-5 w-5 text-primary" />
        Historial de Consultas
      </h3>
      
      <Accordion type="single" collapsible className="w-full">
        {consultations.map(consultation => <AccordionItem key={consultation.id} value={consultation.id} className="mb-3 border-none">
            <AccordionTrigger className="px-4 py-3 rounded-md bg-primary/80 hover:bg-primary/90 shadow-sm transition-all">
              <div className="flex items-center gap-3 text-left">
                <div className="p-1.5 rounded-full bg-card/20">
                  <Calendar className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-medium text-primary-foreground">
                    {format(new Date(consultation.dateTime), "PPP", {
                  locale: es
                })}
                  </span>
                  <span className="text-sm ml-2 text-primary-foreground/80">
                    {format(new Date(consultation.dateTime), "p", {
                  locale: es
                })}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-3 pb-4 mt-2 bg-card rounded-md shadow-sm border border-border/50">
              <div className="space-y-3">
                {consultation.summary ? <>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-primary" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium mb-1 text-foreground">Resumen:</h4>
                          {editMode !== consultation.id && <Button variant="ghost" size="sm" onClick={() => handleEditSummary(consultation)} className="h-7 px-2 text-primary-foreground bg-primary hover:bg-primary/80 shadow-sm">
                              <PencilLine className="h-3.5 w-3.5" />
                              <span className="ml-1 text-xs text-primary-foreground">Editar</span>
                            </Button>}
                        </div>
                        
                        <p className="text-sm whitespace-pre-line line-clamp-3 text-foreground bg-muted/20 p-2 rounded-md">
                          {consultation.summary}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 border-border text-primary hover:bg-muted/30" 
                      onClick={() => {
                        setSelectedConsultation(consultation);
                        setShowFullscreenModal(true);
                      }}
                    >
                      Ver consulta completa
                    </Button>
                  </> : <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-md border border-dashed border-border">No hay resumen disponible para esta consulta.</p>}
              </div>
            </AccordionContent>
          </AccordionItem>)}
      </Accordion>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent 
          fullWidth 
          className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-6" 
          aria-describedby="consultation-edit"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <PencilLine className="h-5 w-5 text-primary" />
              Editar Resumen - {selectedConsultation && format(new Date(selectedConsultation.dateTime), "PPP", {
              locale: es
            })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-4" id="consultation-edit">
            {selectedConsultation?.audioUrl && <div>
                <h4 className="font-medium mb-2 text-foreground flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  Audio de la consulta:
                </h4>
                <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                  <audio controls className="w-full">
                    <source src={selectedConsultation.audioUrl} type="audio/webm" />
                    Su navegador no soporta el elemento de audio.
                  </audio>
                </div>
              </div>}
            
            <div>
              <h4 className="font-medium mb-2 text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resumen:
              </h4>
              <Textarea value={editedSummary} onChange={e => setEditedSummary(e.target.value)} className="min-h-[300px] text-sm font-mono border-border focus-visible:ring-primary" placeholder="Edite el resumen aquí..." />
            </div>
            
            {selectedConsultation?.transcription && <div>
                <h4 className="font-medium mb-2 text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Transcripción completa:
                </h4>
                <div className="bg-muted/30 p-4 rounded-md whitespace-pre-line text-sm text-foreground/70 max-h-[400px] overflow-y-auto border border-border">
                  {selectedConsultation.transcription}
                </div>
              </div>}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving} className="h-10 border-destructive/30 text-destructive hover:bg-destructive/20">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="default" onClick={() => selectedConsultation && handleSaveSummary(selectedConsultation)} disabled={isSaving} className="h-10 bg-primary hover:bg-primary/80">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de pantalla completa */}
      <ConsultationFullscreenModal
        consultation={selectedConsultation}
        isOpen={showFullscreenModal}
        onClose={() => {
          setShowFullscreenModal(false);
          setSelectedConsultation(null);
        }}
        patientName={patientName}
        patientAge={patientAge}
        patientId={patientId}
      />
    </div>;
};

export default PatientConsultations;
