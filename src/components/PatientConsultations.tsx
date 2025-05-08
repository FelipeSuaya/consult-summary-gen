import { useState, useEffect } from "react";
import { ConsultationRecord } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getConsultationsByPatient } from "@/lib/storage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, FileText, Clock, PencilLine, Save, X, HeartPulse, Users, TestTube } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { updateConsultation } from "@/lib/storage";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import React from "react";

interface PatientConsultationsProps {
  patientId: string;
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
        <Table className="mt-2 mb-4 border border-gray-200">
          <TableHeader className="bg-medical-50">
            <TableRow>
              <TableHead className="font-medium text-medical-800">Estudio</TableHead>
              <TableHead className="font-medium text-medical-800">Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((rowArr, idx) => {
              const { estudio, resultado } = getLabRowData(rowArr);
              return (
                <TableRow key={`lab-row-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
      <Table className="mt-2 mb-4 border border-gray-200">
        <TableHeader className="bg-medical-50">
          <TableRow>
            {headers.map((header, i) => (
              <TableHead key={`header-${i}`} className="font-medium text-medical-800">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataRowsGeneric.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
    const tablesMatch = text.match(tablePattern);
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
      
      const tablesInSection = sectionContent.match(tablePattern);
      
      if (tablesInSection) {
        let processedContent = sectionContent;
        tablesInSection.forEach(tableText => {
          processedContent = processedContent.replace(tableText, `<table-placeholder-${Math.random()}>`);
        });
        
        const contentParts = processedContent.split(/<table-placeholder-[^>]+>/);
        
        result.push(
          <div key={`section-${i}`} className="mb-4">
            <div className="mb-2 flex items-center gap-2 bg-medical-100/50 p-2 rounded-md">
              <div className="p-1.5 rounded-full bg-medical-200/70">
                {icon}
              </div>
              <h3 className="font-semibold text-medical-800">{sectionTitle}</h3>
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
            <div className="mb-2 flex items-center gap-2 bg-medical-100/50 p-2 rounded-md">
              <div className="p-1.5 rounded-full bg-medical-200/70">
                {icon}
              </div>
              <h3 className="font-semibold text-medical-800">{sectionTitle}</h3>
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
  patientId
}: PatientConsultationsProps) => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editedSummary, setEditedSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const {
    toast
  } = useToast();

  console.log("PatientConsultations - Patient ID:", patientId);
  const {
    data: consultations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['consultations', patientId],
    queryFn: () => getConsultationsByPatient(patientId),
    enabled: !!patientId
  });

  useEffect(() => {
    if (patientId) {
      refetch();
    }
  }, [patientId, refetch]);

  useEffect(() => {
    console.log("Consultations fetched:", consultations);
  }, [consultations]);

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
      const updatedConsultation: ConsultationRecord = {
        ...consultation,
        summary: editedSummary
      };

      const error = await updateConsultation(updatedConsultation);
      if (error) {
        throw new Error(error);
      }

      const updatedConsultations = consultations.map(c => c.id === consultation.id ? {
        ...c,
        summary: editedSummary
      } : c);

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
    return <div className="text-center py-6 bg-gray-50 rounded-lg animate-pulse">
      <div className="inline-block p-3 rounded-full bg-medical-100">
        <Clock className="h-5 w-5 text-medical-500" />
      </div>
      <p className="mt-2 text-medical-600">Cargando historial de consultas...</p>
    </div>;
  }

  if (error) {
    console.error("Error fetching consultations:", error);
    return <div className="text-center py-6 bg-red-50 rounded-lg border border-red-100">
      <p className="text-red-600">Error al cargar historial: {String(error)}</p>
    </div>;
  }

  if (consultations.length === 0) {
    return <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
      <p className="text-gray-500">No hay consultas registradas para este paciente.</p>
    </div>;
  }

  return <div className="space-y-4">
      <h3 className="text-lg font-medium text-cyan-900 flex items-center gap-2">
        <HeartPulse className="h-5 w-5 text-cyan-700" />
        Historial de Consultas
      </h3>
      
      <Accordion type="single" collapsible className="w-full">
        {consultations.map(consultation => <AccordionItem key={consultation.id} value={consultation.id} className="mb-3 border-none">
            <AccordionTrigger className="px-4 py-3 rounded-md bg-gradient-to-r from-cyan-800 to-cyan-900 hover:from-cyan-700 hover:to-cyan-800 shadow-sm transition-all">
              <div className="flex items-center gap-3 text-left">
                <div className="p-1.5 rounded-full bg-white/20">
                  <Calendar className="h-4 w-4 text-cyan-50" />
                </div>
                <div>
                  <span className="font-medium text-slate-50">
                    {format(new Date(consultation.dateTime), "PPP", {
                  locale: es
                })}
                  </span>
                  <span className="text-sm ml-2 text-slate-50/80">
                    {format(new Date(consultation.dateTime), "p", {
                  locale: es
                })}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-3 pb-4 mt-2 bg-white rounded-md shadow-sm border border-gray-100">
              <div className="space-y-3">
                {consultation.summary ? <>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-cyan-600" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium mb-1 text-cyan-900">Resumen:</h4>
                          {editMode !== consultation.id && <Button variant="ghost" size="sm" onClick={() => handleEditSummary(consultation)} className="h-7 px-2 text-cyan-50 bg-cyan-700 hover:bg-cyan-600 shadow-sm">
                              <PencilLine className="h-3.5 w-3.5" />
                              <span className="ml-1 text-xs text-slate-50">Editar</span>
                            </Button>}
                        </div>
                        
                        <p className="text-sm whitespace-pre-line line-clamp-3 text-cyan-900 bg-cyan-50/50 p-2 rounded-md">
                          {consultation.summary}
                        </p>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={() => setSelectedConsultation(consultation)}>
                          Ver consulta completa
                        </Button>
                      </DialogTrigger>
                      <DialogContent 
                        className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-6"
                        fullWidth
                        aria-describedby="consultation-details"
                      >
                        <DialogHeader>
                          <DialogTitle className="text-xl text-cyan-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-cyan-700" />
                            Consulta del {format(new Date(consultation.dateTime), "PPP", {
                        locale: es
                      })}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4" id="consultation-details">
                          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(consultation.dateTime), "p", {
                          locale: es
                        })}</span>
                          </div>
                          
                          {consultation.audioUrl && <div className="mt-4">
                              <h4 className="font-medium mb-2 text-cyan-900 flex items-center gap-2">
                                <HeartPulse className="h-4 w-4 text-cyan-700" />
                                Audio de la consulta:
                              </h4>
                              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                <audio controls className="w-full">
                                  <source src={consultation.audioUrl} type="audio/webm" />
                                  Su navegador no soporta el elemento de audio.
                                </audio>
                              </div>
                            </div>}
                          
                          <div className="mt-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium mb-2 text-cyan-900 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-cyan-700" />
                                Resumen:
                              </h4>
                              <Button variant="outline" size="sm" onClick={() => handleEditSummary(consultation)} className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                                <PencilLine className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </div>
                            <div className="bg-white p-4 rounded-md border border-cyan-100 overflow-x-auto">
                              {processTextWithTables(consultation.summary)}
                            </div>
                          </div>
                          
                          {consultation.transcription && <div className="mt-4">
                              <h4 className="font-medium mb-2 text-cyan-900 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-cyan-700" />
                                Transcripción completa:
                              </h4>
                              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line text-sm text-gray-700 max-h-[300px] overflow-y-auto border border-gray-200">
                                {consultation.transcription}
                              </div>
                            </div>}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </> : <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md border border-dashed border-gray-200">No hay resumen disponible para esta consulta.</p>}
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
            <DialogTitle className="flex items-center gap-2 text-cyan-900">
              <PencilLine className="h-5 w-5 text-cyan-700" />
              Editar Resumen - {selectedConsultation && format(new Date(selectedConsultation.dateTime), "PPP", {
              locale: es
            })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-4" id="consultation-edit">
            {selectedConsultation?.audioUrl && <div>
                <h4 className="font-medium mb-2 text-cyan-900 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-cyan-700" />
                  Audio de la consulta:
                </h4>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <audio controls className="w-full">
                    <source src={selectedConsultation.audioUrl} type="audio/webm" />
                    Su navegador no soporta el elemento de audio.
                  </audio>
                </div>
              </div>}
            
            <div>
              <h4 className="font-medium mb-2 text-cyan-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-700" />
                Resumen:
              </h4>
              <Textarea value={editedSummary} onChange={e => setEditedSummary(e.target.value)} className="min-h-[300px] text-sm font-mono border-cyan-200 focus-visible:ring-cyan-500" placeholder="Edite el resumen aquí..." />
            </div>
            
            {selectedConsultation?.transcription && <div>
                <h4 className="font-medium mb-2 text-cyan-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-700" />
                  Transcripción completa:
                </h4>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line text-sm text-gray-700 max-h-[400px] overflow-y-auto border border-gray-200">
                  {selectedConsultation.transcription}
                </div>
              </div>}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving} className="h-10 border-red-200 text-red-600 hover:bg-red-50">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="default" onClick={() => selectedConsultation && handleSaveSummary(selectedConsultation)} disabled={isSaving} className="h-10 bg-cyan-700 hover:bg-cyan-600">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};

export default PatientConsultations;
