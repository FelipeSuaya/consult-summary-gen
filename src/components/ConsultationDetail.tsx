import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultationRecord, Patient } from "@/types";
import { Download, Clipboard, CheckCircle2, User, PencilLine, Save, X, AlertCircle, Stethoscope, HeartPulse, Activity, Tablet, FileText, ClipboardList, FilePlus2, Users, TestTube } from "lucide-react";
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
        <Table wrapperClassName="w-full overflow-x-auto border border-gray-200 rounded-md">
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
      <Table wrapperClassName="w-full overflow-x-auto border border-gray-200 rounded-md">
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

const renderMedicalSection = (title: string, content: string | React.ReactNode, icon: React.ReactNode) => {
  if (!content) return null;
  
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-medical-50 to-white">
        <div className="p-1.5 rounded-full bg-medical-100 text-medical-600">
          {icon}
        </div>
        <h3 className="font-semibold text-medical-800">{title}</h3>
      </div>
      <div className="px-4 py-3">
        {typeof content === 'string' ? (
          <p className="text-gray-700">{content}</p>
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
        case "datos personales":
          icon = <Users className="h-4 w-4" />;
          break;
        case "motivo de consulta":
          icon = <AlertCircle className="h-4 w-4" />;
          break;
        case "antecedentes personales":
          icon = <FileText className="h-4 w-4" />;
          break;
        case "antecedentes familiares":
          icon = <Users className="h-4 w-4" />;
          break;
        case "habitos":
          icon = <Activity className="h-4 w-4" />;
          break;
        case "examenes complementarios previos":
          icon = <ClipboardList className="h-4 w-4" />;
          break;
        case "diagnostico presuntivo":
          icon = <Stethoscope className="h-4 w-4" />;
          break;
        case "indicaciones":
          icon = <Tablet className="h-4 w-4" />;
          break;
        case "examenes solicitados":
          icon = <FilePlus2 className="h-4 w-4" />;
          break;
        case "laboratorio":
          icon = <TestTube className="h-4 w-4" />;
          break;
        default:
          icon = <FileText className="h-4 w-4" />;
      }
      
      const processedContent = processTextContent(sectionContent);
      
      result.push(
        <div key={`section-${i}`} className="mb-4">
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
        <div key={`subsection-${i}`} className="mt-3 mb-2">
          <h4 className="font-medium text-medical-700 mb-1">{subtitle}:</h4>
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
          <div key={`lab-${index}`} className="my-3">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="h-4 w-4 text-amber-500" />
              <h4 className="font-medium text-amber-700">Laboratorio:</h4>
            </div>
            <div className="w-full overflow-x-auto rounded-md">
              {renderMarkdownTable(segment.replace(/laboratorio:?\s*/i, ''))}
            </div>
          </div>
        );
      }
      return (
        <div key={`table-${index}`} className="w-full overflow-x-auto rounded-md">
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
        <ul key={`list-${index}`} className="list-disc list-inside my-2 text-gray-700">
          {listItems}
        </ul>
      );
    }
    
    return <p key={`section-${index}`} className="py-1 text-gray-700">{segment}</p>;
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
        if (patientData) {
          setPatient(patientData);
        }
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
      
      toast({
        title: "Copiado al portapapeles",
        description: `El ${type === 'transcription' ? 'transcripción' : 'resumen'} ha sido copiado al portapapeles`,
      });
      
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Error al copiar:", error);
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "El resumen no puede estar vacío",
        variant: "destructive",
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

      consultation.summary = editedSummary;
      setEditMode(null);
      
      toast({
        title: "Resumen actualizado",
        description: "El resumen ha sido actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al guardar el resumen:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo actualizar el resumen",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedSummary(consultation.summary || "");
    setEditMode(null);
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
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2 hover:bg-medical-50">
        ← Volver a todas las consultas
      </Button>
      
      <Card className="mb-6 overflow-hidden border-medical-100">
        <CardHeader className="bg-gradient-to-r from-medical-50 to-white border-b border-medical-100">
          <CardTitle className="text-xl text-medical-800 flex items-center gap-2">
            <User className="h-5 w-5 text-medical-500" />
            {consultation.patientName}
          </CardTitle>
          <CardDescription>
            Consulta el {format(new Date(consultation.dateTime), 'PPP', { locale: es })} a las {format(new Date(consultation.dateTime), 'p')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2 rounded-md bg-medical-50/50 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4 text-medical-600" />
              <span className="font-medium">Datos Personales:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patientData.dni && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                  <span className="font-medium text-medical-700">DNI:</span>
                  <span className="text-gray-700">{patientData.dni}</span>
                </div>
              )}
              {patientData.phone && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                  <span className="font-medium text-medical-700">Teléfono:</span>
                  <span className="text-gray-700">{patientData.phone}</span>
                </div>
              )}
              {patientData.age && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                  <span className="font-medium text-medical-700">Edad:</span>
                  <span className="text-gray-700">{patientData.age}</span>
                </div>
              )}
              {patientData.email && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                  <span className="font-medium text-medical-700">Email:</span>
                  <span className="text-gray-700">{patientData.email}</span>
                </div>
              )}
              {patient?.notes && (
                <div className="col-span-2 flex items-start gap-2 bg-white p-2 rounded-md shadow-sm">
                  <span className="font-medium text-medical-700">Notas:</span>
                  <span className="text-gray-700">{patient.notes}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {consultation.audioUrl && (
          <CardContent>
            <div className="my-2 bg-gray-50 p-3 rounded-md border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <HeartPulse className="h-4 w-4 text-medical-600" />
                <h4 className="font-medium text-medical-700">Audio de la consulta:</h4>
              </div>
              <audio controls className="w-full">
                <source src={consultation.audioUrl} type="audio/webm" />
                Su navegador no soporta el elemento de audio.
              </audio>
            </div>
            <Button variant="outline" onClick={downloadAudio} className="mt-2 border-medical-200 hover:bg-medical-50">
              <Download className="mr-2 h-4 w-4 text-medical-600" />
              Descargar Audio
            </Button>
          </CardContent>
        )}
      </Card>
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-medical-50 rounded-full p-1 border border-medical-100">
          <TabsTrigger 
            value="summary" 
            className="data-[state=active]:bg-medical-600 data-[state=active]:text-white text-medical-700 rounded-full transition-all duration-300"
          >
            Resumen
          </TabsTrigger>
          <TabsTrigger 
            value="transcription"
            className="data-[state=active]:bg-medical-600 data-[state=active]:text-white text-medical-700 rounded-full transition-all duration-300"
          >
            Transcripción Completa
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader className="bg-gradient-to-r from-medical-50 to-white border-b border-medical-100">
              <CardTitle className="text-lg text-medical-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-medical-600" />
                  <span>Resumen de la Consulta</span>
                </div>
                <div className="flex gap-2">
                  {editMode === 'summary' ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="border-red-200 hover:bg-red-50 text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleSaveSummary}
                        disabled={isSaving}
                        className="bg-medical-600 hover:bg-medical-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? "Guardando..." : "Guardar"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => consultation.summary && copyToClipboard(consultation.summary, 'summary')}
                        className="hover:bg-medical-50"
                      >
                        {copied === 'summary' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clipboard className="h-4 w-4 text-medical-600" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditMode('summary')}
                        className="hover:bg-medical-50"
                      >
                        <PencilLine className="h-4 w-4 text-medical-600" />
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                {editMode === 'summary' ? (
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Edite el resumen aquí..."
                  />
                ) : (
                  <div className="bg-white rounded-lg">
                    <MedicalSoapCards 
                      soapData={parseTextToSoapData(consultation.summary || "", consultation.patientName)}
                      className="space-y-4"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transcription">
          <Card>
            <CardHeader className="bg-gradient-to-r from-medical-50 to-white border-b border-medical-100">
              <CardTitle className="text-lg text-medical-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-medical-600" />
                  <span>Transcripción Completa</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => consultation.transcription && copyToClipboard(consultation.transcription, 'transcription')}
                  className="hover:bg-medical-50"
                >
                  {copied === 'transcription' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4 text-medical-600" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100 whitespace-pre-line text-gray-700">
                  {consultation.transcription || "No hay transcripción disponible"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationDetail;
