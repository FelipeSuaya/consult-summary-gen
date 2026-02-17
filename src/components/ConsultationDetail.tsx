import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultationRecord, Patient } from "@/types";
import { Download, Clipboard, CheckCircle2, PencilLine, Save, X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { usePatientById } from '@/modules/patients/hooks/use-patient-queries';
import { useUpdateConsultation } from '@/modules/consultations/hooks/use-consultation-mutations';
import { Textarea } from "@/components/ui/textarea";
import MedicalSoapCards from "@/components/soap/MedicalSoapCards";
import { parseTextToSoapData } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ConsultationDetailProps {
  consultation: ConsultationRecord;
  onBack: () => void;
  variant?: 'page' | 'sheet';
}

const ConsultationDetail = ({ consultation, onBack, variant = 'page' }: ConsultationDetailProps) => {
  const [copied, setCopied] = useState<'transcription' | 'summary' | null>(null);
  const [editMode, setEditMode] = useState<'summary' | null>(null);
  const [editedSummary, setEditedSummary] = useState(consultation.summary || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { data: patient } = usePatientById(consultation.patientId ?? null);
  const updateConsultationMutation = useUpdateConsultation();

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
      await updateConsultationMutation.mutateAsync({ id: consultation.id, data: { summary: editedSummary } });
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
      {/* Back button — only in page mode */}
      {variant === 'page' && (
        <Button variant="ghost" onClick={onBack} size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Button>
      )}

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
          {/* Summary toolbar */}
          <div className="flex items-center justify-end gap-1 mb-2">
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
            />
          )}
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
