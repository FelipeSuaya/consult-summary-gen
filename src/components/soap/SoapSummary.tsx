
import { SoapData } from "@/types/soap";
import HeaderBar from "./HeaderBar";
import PrintHeader from "./PrintHeader";
import SectionCard from "./SectionCard";
import KeyChips from "./KeyChips";
import LabTable from "./LabTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Stethoscope, 
  Brain, 
  ClipboardList, 
  Bot,
  Copy
} from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/utils/format";
import { useToast } from "@/components/ui/use-toast";

interface SoapSummaryProps {
  soapData: SoapData;
  className?: string;
}

const SoapSummary = ({ soapData, className = "" }: SoapSummaryProps) => {
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const { toast } = useToast();

  const handleCopySection = async (content: string, sectionName: string) => {
    const success = await copyToClipboard(content);
    toast({
      title: success ? "Copiado" : "Error",
      description: success 
        ? `${sectionName} copiado al portapapeles` 
        : "No se pudo copiar al portapapeles",
      variant: success ? "default" : "destructive",
    });
  };

  const renderSubjective = () => {
    const { subjective } = soapData;
    if (!subjective) return null;

    const isEmpty = !subjective.chiefComplaint && !subjective.hpi && 
                   !subjective.personalHistory && !subjective.familyHistory && 
                   !subjective.socialHistory;

    let copyContent = '';
    if (subjective.chiefComplaint) copyContent += `Motivo de consulta: ${subjective.chiefComplaint}\n`;
    if (subjective.hpi) copyContent += `Historia actual: ${subjective.hpi}\n`;
    if (subjective.personalHistory) copyContent += `Antecedentes personales: ${subjective.personalHistory}\n`;
    if (subjective.familyHistory) copyContent += `Antecedentes familiares: ${subjective.familyHistory}\n`;
    if (subjective.socialHistory) copyContent += `Historia social: ${subjective.socialHistory}\n`;

    return (
      <SectionCard
        title="Subjetivo"
        icon={<MessageSquare className="h-5 w-5" />}
        highlight={highlightEnabled}
        isEmpty={isEmpty}
        copyContent={copyContent}
        className="min-h-[280px]"
      >
        <div className="space-y-4">
          {subjective.chiefComplaint && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Motivo de consulta
              </h4>
              <p className="text-sm md:text-base leading-6 prose max-w-prose">
                {subjective.chiefComplaint}
              </p>
            </div>
          )}
          
          {subjective.hpi && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Historia de la enfermedad actual
              </h4>
              <p className="text-sm md:text-base leading-6 prose max-w-prose whitespace-pre-wrap break-words">
                {subjective.hpi}
              </p>
            </div>
          )}

          {subjective.personalHistory && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Antecedentes personales
              </h4>
              <p className="text-sm md:text-base leading-6 prose max-w-prose">
                {subjective.personalHistory}
              </p>
            </div>
          )}

          {subjective.familyHistory && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Antecedentes familiares
              </h4>
              <p className="text-sm md:text-base leading-6 prose max-w-prose">
                {subjective.familyHistory}
              </p>
            </div>
          )}

          {subjective.socialHistory && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Historia social / Hábitos
              </h4>
              <p className="text-sm md:text-base leading-6 prose max-w-prose">
                {subjective.socialHistory}
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    );
  };

  const renderObjective = () => {
    const { objective } = soapData;
    if (!objective) return null;

    const isEmpty = !objective.vitals?.length && !objective.physicalExam && 
                   !objective.studiesNarrative && !objective.labs?.length;

    let copyContent = '';
    if (objective.vitals?.length) {
      copyContent += 'Signos vitales: ' + objective.vitals.map(v => `${v.label}: ${v.value}${v.unit ? ` ${v.unit}` : ''}`).join(', ') + '\n';
    }
    if (objective.physicalExam) copyContent += `Examen físico: ${objective.physicalExam}\n`;
    if (objective.studiesNarrative) copyContent += `Estudios: ${objective.studiesNarrative}\n`;

    return (
      <SectionCard
        title="Objetivo"
        icon={<Stethoscope className="h-5 w-5" />}
        highlight={highlightEnabled}
        isEmpty={isEmpty}
        copyContent={copyContent}
        className="min-h-[280px]"
      >
        <div className="space-y-4">
          {objective.vitals && objective.vitals.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Signos vitales
              </h4>
              <KeyChips items={objective.vitals} />
            </div>
          )}

          {objective.physicalExam && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Examen físico
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {objective.physicalExam}
              </p>
            </div>
          )}

          {objective.studiesNarrative && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Estudios complementarios
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {objective.studiesNarrative}
              </p>
            </div>
          )}

          {objective.labs && objective.labs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Laboratorio
              </h4>
              <LabTable labs={objective.labs} />
            </div>
          )}
        </div>
      </SectionCard>
    );
  };

  const renderAssessment = () => {
    const { assessment } = soapData;
    if (!assessment) return null;

    const isEmpty = !assessment.impression && !assessment.differentials?.length && !assessment.notes;

    let copyContent = '';
    if (assessment.impression) copyContent += `Impresión: ${assessment.impression}\n`;
    if (assessment.differentials?.length) {
      copyContent += `Diagnósticos diferenciales:\n${assessment.differentials.map(d => `- ${d}`).join('\n')}\n`;
    }
    if (assessment.notes) copyContent += `Notas: ${assessment.notes}\n`;

    return (
      <SectionCard
        title="Evaluación"
        icon={<Brain className="h-5 w-5" />}
        highlight={highlightEnabled}
        isEmpty={isEmpty}
        copyContent={copyContent}
        className="min-h-[240px]"
      >
        <div className="space-y-4">
          {assessment.impression && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Impresión diagnóstica
              </h4>
              <p className="text-sm md:text-base leading-6 font-medium">
                {assessment.impression}
              </p>
            </div>
          )}

          {assessment.differentials && assessment.differentials.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Diagnósticos diferenciales
              </h4>
              <ul className="space-y-1">
                {assessment.differentials.map((diff, index) => (
                  <li key={index} className="text-sm md:text-base leading-6 flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Notas adicionales
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {assessment.notes}
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    );
  };

  const renderPlan = () => {
    const { plan } = soapData;
    if (!plan) return null;

    const isEmpty = !plan.treatment && !plan.recommendations && !plan.orders && 
                   !plan.referrals && !plan.followUp;

    let copyContent = '';
    if (plan.treatment) copyContent += `Tratamiento: ${plan.treatment}\n`;
    if (plan.recommendations) copyContent += `Recomendaciones: ${plan.recommendations}\n`;
    if (plan.orders) copyContent += `Estudios solicitados: ${plan.orders}\n`;
    if (plan.referrals) copyContent += `Interconsultas: ${plan.referrals}\n`;
    if (plan.followUp) copyContent += `Seguimiento: ${plan.followUp}\n`;

    const copyPrescription = async () => {
      if (plan.treatment) {
        await handleCopySection(plan.treatment, "Prescripción");
      }
    };

    return (
      <SectionCard
        title="Plan"
        icon={<ClipboardList className="h-5 w-5" />}
        highlight={highlightEnabled}
        isEmpty={isEmpty}
        copyContent={copyContent}
        className="min-h-[240px]"
        actions={
          plan.treatment ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={copyPrescription}
              className="h-8 px-2 text-xs print:hidden"
            >
              <Copy className="h-3 w-3 mr-1" />
              Rx
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {plan.treatment && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Tratamiento
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {plan.treatment}
              </p>
            </div>
          )}

          {plan.recommendations && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Recomendaciones
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {plan.recommendations}
              </p>
            </div>
          )}

          {plan.orders && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Estudios solicitados
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {plan.orders}
              </p>
            </div>
          )}

          {plan.referrals && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Interconsultas / Derivaciones
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {plan.referrals}
              </p>
            </div>
          )}

          {plan.followUp && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Seguimiento
              </h4>
              <p className="text-sm md:text-base leading-6 whitespace-pre-wrap break-words">
                {plan.followUp}
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    );
  };

  const renderAiDiagnosis = () => {
    if (!soapData.aiPresumptiveDx) return null;

    return (
      <SectionCard
        title="Diagnóstico Presuntivo IA"
        icon={<Bot className="h-5 w-5" />}
        highlight={highlightEnabled}
        copyContent={soapData.aiPresumptiveDx}
        className="col-span-12"
      >
        <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-xs text-sky-700 dark:text-sky-300 font-medium">
                Sugerido por el sistema, basado únicamente en los datos provistos
              </p>
              <p className="text-sm md:text-base leading-6">
                {soapData.aiPresumptiveDx}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    );
  };

  return (
    <div className={`max-w-screen-xl mx-auto px-6 md:px-8 pt-6 ${className}`}>
      <PrintHeader {...soapData.meta} />
      
      <HeaderBar
        {...soapData.meta}
        soapData={soapData}
        onToggleHighlight={() => setHighlightEnabled(!highlightEnabled)}
        highlightEnabled={highlightEnabled}
      />

      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Subjective */}
        <div className="col-span-12 lg:col-span-7">
          {renderSubjective()}
        </div>

        {/* Objective */}
        <div className="col-span-12 lg:col-span-5">
          {renderObjective()}
        </div>

        {/* Assessment */}
        <div className="col-span-12 lg:col-span-6">
          {renderAssessment()}
        </div>

        {/* Plan */}
        <div className="col-span-12 lg:col-span-6">
          {renderPlan()}
        </div>

        {/* AI Diagnosis */}
        {soapData.aiPresumptiveDx && renderAiDiagnosis()}
      </div>

      {/* Quick navigation anchors */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 print:hidden">
        <div className="bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-xs font-mono"
              onClick={() => document.querySelector('[aria-labelledby="section-subjetivo"]')?.scrollIntoView({ behavior: 'smooth' })}
            >
              S
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-xs font-mono"
              onClick={() => document.querySelector('[aria-labelledby="section-objetivo"]')?.scrollIntoView({ behavior: 'smooth' })}
            >
              O
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-xs font-mono"
              onClick={() => document.querySelector('[aria-labelledby="section-evaluación"]')?.scrollIntoView({ behavior: 'smooth' })}
            >
              A
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-xs font-mono"
              onClick={() => document.querySelector('[aria-labelledby="section-plan"]')?.scrollIntoView({ behavior: 'smooth' })}
            >
              P
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoapSummary;
