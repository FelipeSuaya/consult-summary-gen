
import { SoapData } from "@/types/soap";
import ClinicalHeader from "./ClinicalHeader";
import AlertsPanel from "./AlertsPanel";
import HistoryPanel from "./HistoryPanel";
import LabCard from "./LabCard";
import PrintHeader from "./PrintHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Stethoscope, 
  Brain, 
  ClipboardList, 
  Bot,
  Copy,
  Pill
} from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/utils/format";
import { useToast } from "@/components/ui/use-toast";

interface SoapSummaryProps {
  soapData: SoapData;
  alerts?: Array<{
    type: "warning" | "danger" | "info";
    text: string;
    priority?: "high" | "medium" | "low";
  }>;
  historyEntries?: Array<{
    id: string;
    date: string;
    summary: string;
    diagnosis?: string;
    clinician?: string;
    type: "consulta" | "emergencia" | "control" | "interconsulta";
    status: "completo" | "borrador";
  }>;
  className?: string;
}

const SoapSummary = ({ soapData, alerts = [], historyEntries = [], className = "" }: SoapSummaryProps) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { toast } = useToast();

  const handleCopyAll = async () => {
    const sections = [];
    
    if (soapData.subjective) {
      sections.push("SUBJETIVO:");
      if (soapData.subjective.chiefComplaint) sections.push(`Motivo: ${soapData.subjective.chiefComplaint}`);
      if (soapData.subjective.hpi) sections.push(`HEA: ${soapData.subjective.hpi}`);
      sections.push("");
    }
    
    if (soapData.objective) {
      sections.push("OBJETIVO:");
      if (soapData.objective.vitals?.length) {
        sections.push(`Vitales: ${soapData.objective.vitals.map(v => `${v.label}: ${v.value}${v.unit ? ` ${v.unit}` : ''}`).join(', ')}`);
      }
      if (soapData.objective.physicalExam) sections.push(`Examen: ${soapData.objective.physicalExam}`);
      sections.push("");
    }
    
    if (soapData.assessment) {
      sections.push("EVALUACIÓN:");
      if (soapData.assessment.impression) sections.push(`Impresión: ${soapData.assessment.impression}`);
      sections.push("");
    }
    
    if (soapData.plan) {
      sections.push("PLAN:");
      if (soapData.plan.treatment) sections.push(`Tratamiento: ${soapData.plan.treatment}`);
      if (soapData.plan.followUp) sections.push(`Seguimiento: ${soapData.plan.followUp}`);
    }
    
    const success = await copyToClipboard(sections.join('\n'));
    toast({
      title: success ? "Copiado" : "Error",
      description: success ? "Resumen completo copiado" : "No se pudo copiar",
      variant: success ? "default" : "destructive",
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleSelectHistoryEntry = (entryId: string) => {
    // Aquí se cargaría la consulta seleccionada
    toast({
      title: "Cargando consulta",
      description: `Cargando consulta ${entryId}...`,
    });
  };

  const renderSubjective = () => {
    const { subjective } = soapData;
    if (!subjective) return null;

    const isEmpty = !subjective.chiefComplaint && !subjective.hpi && 
                   !subjective.personalHistory && !subjective.familyHistory && 
                   !subjective.socialHistory;

    if (isEmpty) {
      return (
        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">S · Subjetivo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos subjetivos consignados
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">S · Subjetivo</CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {subjective.chiefComplaint && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">Motivo:</span>
                <span className="text-sm text-foreground">{subjective.chiefComplaint}</span>
              </div>
            </div>
          )}
          
          {subjective.hpi && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Historia:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {subjective.hpi}
              </p>
            </div>
          )}

          {subjective.personalHistory && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Antecedentes personales:</span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {subjective.personalHistory}
              </p>
            </div>
          )}

          {subjective.familyHistory && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Antecedentes familiares:</span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {subjective.familyHistory}
              </p>
            </div>
          )}

          {subjective.socialHistory && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Historia social:</span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {subjective.socialHistory}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderObjective = () => {
    const { objective } = soapData;
    if (!objective) return null;

    const isEmpty = !objective.vitals?.length && !objective.physicalExam && 
                   !objective.studiesNarrative;

    if (isEmpty) {
      return (
        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">O · Objetivo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos objetivos consignados
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">O · Objetivo</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {objective.vitals && objective.vitals.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-3">Signos vitales:</span>
              <div className="grid grid-cols-2 gap-2">
                {objective.vitals.map((vital, index) => (
                  <Badge
                    key={index}
                    variant={vital.flagged ? "destructive" : "secondary"}
                    className="justify-center font-mono text-sm py-2"
                  >
                    {vital.label}: {vital.value}{vital.unit ? ` ${vital.unit}` : ''}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {objective.physicalExam && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Examen físico:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {objective.physicalExam}
              </p>
            </div>
          )}

          {objective.studiesNarrative && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Estudios:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {objective.studiesNarrative}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAssessment = () => {
    const { assessment } = soapData;
    if (!assessment) return null;

    const isEmpty = !assessment.impression && !assessment.differentials?.length && !assessment.notes;

    if (isEmpty) {
      return (
        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">A · Evaluación</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin evaluación consignada
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">A · Evaluación</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {assessment.impression && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Impresión diagnóstica:</span>
              <p className="text-sm leading-relaxed font-medium text-foreground">
                {assessment.impression}
              </p>
            </div>
          )}

          {assessment.differentials && assessment.differentials.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Diagnósticos diferenciales:</span>
              <ol className="space-y-1 list-decimal list-inside">
                {assessment.differentials.map((diff, index) => (
                  <li key={index} className="text-sm leading-relaxed text-muted-foreground">
                    {diff}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {assessment.notes && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Notas:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {assessment.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPlan = () => {
    const { plan } = soapData;
    if (!plan) return null;

    const isEmpty = !plan.treatment && !plan.recommendations && !plan.orders && 
                   !plan.referrals && !plan.followUp;

    if (isEmpty) {
      return (
        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">P · Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin plan de tratamiento consignado
            </p>
          </CardContent>
        </Card>
      );
    }

    const copyPrescription = async () => {
      if (plan.treatment) {
        const success = await copyToClipboard(plan.treatment);
        toast({
          title: success ? "Copiado" : "Error",
          description: success ? "Prescripción copiada" : "No se pudo copiar",
          variant: success ? "default" : "destructive",
        });
      }
    };

    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">P · Plan</CardTitle>
            </div>
            
            {plan.treatment && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyPrescription}
                className="h-8 px-3 text-xs print:hidden"
              >
                <Pill className="h-3 w-3 mr-1" />
                Rx
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {plan.treatment && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Fármacos:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {plan.treatment}
              </p>
            </div>
          )}

          {plan.recommendations && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Indicaciones no farmacológicas:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {plan.recommendations}
              </p>
            </div>
          )}

          {plan.orders && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Estudios:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {plan.orders}
              </p>
            </div>
          )}

          {plan.referrals && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Interconsultas:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {plan.referrals}
              </p>
            </div>
          )}

          {plan.followUp && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">Seguimiento:</span>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {plan.followUp}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAiDiagnosis = () => {
    if (!soapData.aiPresumptiveDx) return null;

    return (
      <Card className="bg-gradient-to-br from-blue-50/50 to-sky-50/50 dark:from-blue-950/20 dark:to-sky-950/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg font-semibold">Diagnóstico Presuntivo IA</CardTitle>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            Sugerido por el sistema, basado únicamente en los datos provistos
          </p>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
            {soapData.aiPresumptiveDx}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`min-h-screen ${className}`}>
      <PrintHeader {...soapData.meta} />
      
      {/* Clinical Header */}
      <ClinicalHeader
        patientName={soapData.meta?.patientName}
        age={soapData.meta?.age}
        gender="F" // TODO: Add to schema
        id={soapData.meta?.id}
        dateTime={soapData.meta?.dateTime}
        duration="45 min" // TODO: Add to schema
        clinician={soapData.meta?.clinician}
        location="Consultorio 3" // TODO: Add to schema
        status="borrador" // TODO: Add to schema
        summary={soapData.subjective?.chiefComplaint}
        onCopyAll={handleCopyAll}
        onExportPDF={handleExportPDF}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
      />

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="container mx-auto px-4 py-2">
          <AlertsPanel alerts={alerts} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 xl:pr-80">
          {/* S · Subjetivo */}
          <div className="md:col-span-1">
            {renderSubjective()}
          </div>

          {/* O · Objetivo */}
          <div className="md:col-span-1">
            {renderObjective()}
          </div>

          {/* A · Evaluación */}
          <div className="md:col-span-1">
            {renderAssessment()}
          </div>

          {/* P · Plan */}
          <div className="md:col-span-1">
            {renderPlan()}
          </div>

          {/* Laboratorio (if exists) */}
          {soapData.objective?.labs && soapData.objective.labs.length > 0 && (
            <div className="md:col-span-2">
              <LabCard 
                labs={soapData.objective.labs}
                title="Laboratorio"
                subtitle="Resultados de análisis clínicos"
              />
            </div>
          )}

          {/* AI Diagnosis */}
          {soapData.aiPresumptiveDx && (
            <div className="md:col-span-2">
              {renderAiDiagnosis()}
            </div>
          )}
        </div>
      </div>

      {/* History Panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={historyEntries}
        onSelectEntry={handleSelectHistoryEntry}
      />

      {/* Quick navigation */}
      <div className="fixed bottom-4 right-4 flex gap-2 print:hidden xl:right-80 transition-all duration-200">
        <div className="bg-card/95 backdrop-blur-sm border rounded-xl p-2 shadow-lg">
          <div className="flex gap-1">
            {["S", "O", "A", "P"].map((letter) => (
              <Button
                key={letter}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoapSummary;
