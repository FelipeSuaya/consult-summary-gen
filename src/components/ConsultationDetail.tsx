import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultationRecord, Patient } from "@/types";
import { Download, Clipboard, CheckCircle2, User, PencilLine, Save, X, Stethoscope, HeartPulse, Activity, Tablet, FileText, ClipboardList, FilePlus2, Users, TestTube, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { getPatientById } from "@/lib/patients";
import { Textarea } from "@/components/ui/textarea";
import { updateConsultation } from "@/lib/storage";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import MedicalSoapCards from "@/components/soap/MedicalSoapCards";
import { parseTextToSoapData } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ConsultationDetailProps {
  consultation: ConsultationRecord;
  onBack: () => void;
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

  for (let i = 0; i < rowArr.length; i++) {
    const val = rowArr[i].toLowerCase();
    if (LAB_NAMES.some(lab => val.includes(lab))) {
      studyIndex = i;
      break;
    }
  }
  if (studyIndex === -1) studyIndex = 0;

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

    if (isLabTable) {
      return (
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-xs font-semibold text-muted-foreground">Estudio</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((rowArr, idx) => {
              const { estudio, resultado } = getLabRowData(rowArr);
              return (
                <TableRow key={`lab-row-${idx}`} className="border-border/50">
                  <TableCell className="text-sm">{estudio || "-"}</TableCell>
                  <TableCell className="text-sm">{resultado || "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }

    const headerRow = rows[0].trim();
    const headers = headerRow.split('|').map(cell => cell.trim()).filter(cell => cell !== '');

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            {headers.map((header, i) => (
              <TableHead key={`header-${i}`} className="text-xs font-semibold text-muted-foreground">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataRows.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`} className="border-border/50">
              {row.map((cell, cellIndex) => (
                <TableCell key={`cell-${rowIndex}-${cellIndex}`} className="text-sm">{cell}</TableCell>
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

const renderMedicalSection = (title: string, content: string | React.ReactNode, icon: React.ReactNode) => {
  if (!content) return null;
  
  return (
    <div className="mb-4 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="px-4 py-3">
        {typeof content === 'string' ? (
          <p className="text-sm text-foreground/80 leading-relaxed">{content}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

const processTextWithTables = (text: string) => {
  if (!text) return null;
  
  const sectionPattern = /\n([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+):\s*\n/g;
  const sections = text.split(sectionPattern);
  
  if (sections.length <= 1) {
    return processTextContent(text);
  }
  
  let result: React.ReactNode[] = [];
  if (sections[0].trim()) {
    result.push(<div key="intro">{processTextContent(sections[0])}</div>);
  }
  
  for (let i = 1; i < sections.length; i += 2) {
    if (i + 1 < sections.length) {
      const sectionTitle = sections[i].trim();
      const sectionContent = sections[i + 1].trim();
      
      let icon;
      switch (sectionTitle.toLowerCase().replace(/[áéíóúñ]/g, char => {
        return {á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n'}[char] || char;
      })) {
        case "datos personales": icon = <Users className="h-4 w-4" />; break;
        case "motivo de consulta": icon = <Activity className="h-4 w-4" />; break;
        case "antecedentes personales": icon = <FileText className="h-4 w-4" />; break;
        case "antecedentes familiares": icon = <Users className="h-4 w-4" />; break;
        case "habitos": icon = <Activity className="h-4 w-4" />; break;
        case "examenes complementarios previos": icon = <ClipboardList className="h-4 w-4" />; break;
        case "diagnostico presuntivo": icon = <Stethoscope className="h-4 w-4" />; break;
        case "indicaciones": icon = <Tablet className="h-4 w-4" />; break;
        case "examenes solicitados": icon = <FilePlus2 className="h-4 w-4" />; break;
        case "laboratorio": icon = <TestTube className="h-4 w-4" />; break;
        default: icon = <FileText className="h-4 w-4" />;
      }
      
      const processedContent = processTextContent(sectionContent);
      
      result.push(
        <div key={`section-${i}`}>
          {renderMedicalSection(sectionTitle, processedContent, icon)}
        </div>
      );
    }
  }
  
  return result;
};

const processTextContent = (content: string) => {
  if (!content) return null;
  
  const parts = content.split(/\n([A-Z][a-zÁ-Úá-ú\s]+):\s*/);
  
  if (parts.length <= 1) {
    return processTextParts(content);
  }
  
  let result: React.ReactNode[] = [];
  if (parts[0].trim()) {
    result.push(...processTextParts(parts[0]));
  }
  
  for (let i = 1; i < parts.length; i += 2) {
    if (i + 1 < parts.length) {
      const subtitle = parts[i].trim();
      const subcontent = parts[i + 1].trim();
      
      result.push(
        <div key={`subsection-${i}`} className="mt-2 mb-1">
          <h4 className="text-sm font-medium text-foreground mb-1">{subtitle}:</h4>
          {processTextParts(subcontent)}
        </div>
      );
    }
  }
  
  return result;
};

const processTextParts = (text: string) => {
  const segments = text.split(/\n\n+/);
  
  return segments.map((segment, index) => {
    if (segment.includes('|') && segment.split('\n').filter(line => line.includes('|')).length >= 2) {
      if (segment.toLowerCase().includes("laboratorio")) {
        return (
          <div key={`lab-${index}`} className="my-2">
            <div className="flex items-center gap-2 mb-1.5">
              <TestTube className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Laboratorio:</h4>
            </div>
            <div className="w-full overflow-x-auto rounded-md border border-border">
              {renderMarkdownTable(segment.replace(/laboratorio:?\s*/i, ''))}
            </div>
          </div>
        );
      }
      return (
        <div key={`table-${index}`} className="w-full overflow-x-auto rounded-md border border-border">
          {renderMarkdownTable(segment)}
        </div>
      );
    }
    
    if (segment.split('\n').some(line => line.trim().match(/^[•\-\*]\s/))) {
      const listItems = segment.split('\n')
        .filter(line => line.trim())
        .map((line, i) => {
          const bulletMatch = line.trim().match(/^[•\-\*]\s+(.*)/);
          if (bulletMatch) {
            return <li key={`item-${i}`} className="ml-2 py-0.5">{bulletMatch[1]}</li>;
          }
          return <p key={`text-${i}`} className="py-0.5">{line}</p>;
        });
      
      return (
        <ul key={`list-${index}`} className="list-disc list-inside my-1.5 text-sm text-foreground/80">
          {listItems}
        </ul>
      );
    }
    
    return <p key={`section-${index}`} className="py-0.5 text-sm text-foreground/80 leading-relaxed">{segment}</p>;
  });
};

const ConsultationDetail = ({ consultation, onBack }: ConsultationDetailProps) => {
  const [copied, setCopied] = useState<'transcription' | 'summary' | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editMode, setEditMode] = useState<'summary' | null>(null);
  const [editedSummary, setEditedSummary] = useState(consultation.summary || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadPatient = async () => {
      if (consultation.patientId) {
        const patientData = await getPatientById(consultation.patientId);
        if (patientData) setPatient(patientData);
      }
    };
    loadPatient();
  }, [consultation.patientId]);

  useEffect(() => {
    setEditedSummary(consultation.summary || "");
    setEditMode(null);
  }, [consultation]);
  
  const copyToClipboard = async (text: string, type: 'transcription' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({ title: "Copiado al portapapeles" });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };
  
  const downloadAudio = () => {
    if (consultation.audioUrl) {
      const a = document.createElement('a');
      a.href = consultation.audioUrl;
      a.download = `consulta_${consultation.patientName.replace(/\s+/g, '_')}_${format(new Date(consultation.dateTime), 'yyyy-MM-dd')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSaveSummary = async () => {
    if (!editedSummary.trim()) {
      toast({ title: "Error", description: "El resumen no puede estar vacío", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const updatedConsultation: ConsultationRecord = { ...consultation, summary: editedSummary };
      const error = await updateConsultation(updatedConsultation);
      if (error) throw new Error(error);
      consultation.summary = editedSummary;
      setEditMode(null);
      toast({ title: "Resumen actualizado" });
    } catch (error) {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const patientData = patient || {
    id: consultation.patientId || '',
    name: consultation.patientName,
    dni: consultation.patientData?.dni,
    phone: consultation.patientData?.phone,
    age: consultation.patientData?.age,
    email: consultation.patientData?.email
  };
  
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver
      </Button>
      
      {/* Patient Header Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
              {consultation.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">{consultation.patientName}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(consultation.dateTime), "EEEE d 'de' MMMM, yyyy · HH:mm", { locale: es })}
            </p>
            
            {/* Patient details chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {patientData.dni && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">DNI: {patientData.dni}</span>
              )}
              {patientData.age && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{patientData.age} años</span>
              )}
              {patientData.phone && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{patientData.phone}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Audio player */}
        {consultation.audioUrl && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <audio controls className="flex-1 h-8" style={{ minWidth: 0 }}>
                <source src={consultation.audioUrl} type="audio/webm" />
              </audio>
              <Button variant="ghost" size="sm" onClick={downloadAudio} className="shrink-0 h-8 px-2.5 text-muted-foreground">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Content Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-muted/60 border border-border/50 p-1 h-auto">
          <TabsTrigger 
            value="summary" 
            className="text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
          >
            Resumen
          </TabsTrigger>
          <TabsTrigger 
            value="transcription"
            className="text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md"
          >
            Transcripción
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
              <span className="text-sm font-semibold text-foreground">Resumen Clínico</span>
              <div className="flex gap-1">
                {editMode === 'summary' ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { setEditedSummary(consultation.summary || ""); setEditMode(null); }} disabled={isSaving} className="h-7 px-2 text-xs text-muted-foreground">
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveSummary} disabled={isSaving} className="h-7 px-2.5 text-xs">
                      <Save className="h-3 w-3 mr-1" /> {isSaving ? "..." : "Guardar"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => consultation.summary && copyToClipboard(consultation.summary, 'summary')} className="h-7 px-2 text-muted-foreground">
                      {copied === 'summary' ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Clipboard className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditMode('summary')} className="h-7 px-2 text-muted-foreground">
                      <PencilLine className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="p-5">
              {editMode === 'summary' ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Edite el resumen aquí..."
                />
              ) : (
                <MedicalSoapCards 
                  soapData={parseTextToSoapData(consultation.summary || "", consultation.patientName)}
                  className="space-y-4"
                />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transcription" className="mt-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
              <span className="text-sm font-semibold text-foreground">Transcripción Completa</span>
              <Button variant="ghost" size="sm" onClick={() => consultation.transcription && copyToClipboard(consultation.transcription, 'transcription')} className="h-7 px-2 text-muted-foreground">
                {copied === 'transcription' ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Clipboard className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="p-5">
              <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                {consultation.transcription || "No hay transcripción disponible"}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationDetail;
