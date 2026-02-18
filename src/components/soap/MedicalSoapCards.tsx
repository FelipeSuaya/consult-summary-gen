import { SoapData } from "@/types/soap";
import LabTable from "@/components/soap/LabTable";
import {
  MessageSquare,
  Stethoscope,
  Brain,
  ClipboardList,
  TestTube,
  AlertTriangle,
  FileText,
  Activity
} from "lucide-react";

interface MedicalSoapCardsProps {
  soapData: SoapData;
  className?: string;
}

const SECTION_STYLES = {
  subjective: { border: "border-l-blue-500", icon: "text-blue-400", bg: "bg-blue-950/30" },
  objective: { border: "border-l-emerald-500", icon: "text-emerald-400", bg: "bg-emerald-950/30" },
  assessment: { border: "border-l-amber-500", icon: "text-amber-400", bg: "bg-amber-950/30" },
  plan: { border: "border-l-teal-500", icon: "text-teal-400", bg: "bg-teal-950/30" },
  diagnosis: { border: "border-l-purple-500", icon: "text-purple-400", bg: "bg-purple-950/30" },
  lab: { border: "border-l-slate-400", icon: "text-slate-400", bg: "bg-slate-950/30" },
} as const;

function SectionCard({
  style,
  icon,
  label,
  children,
}: {
  style: (typeof SECTION_STYLES)[keyof typeof SECTION_STYLES];
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`border-l-[3px] ${style.border} rounded-r-lg border border-l-[3px] border-border bg-card`}>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 border-b border-border/60 ${style.bg}`}>
        <span className={style.icon}>{icon}</span>
        <span className="text-xs font-semibold tracking-wide uppercase text-foreground/70">{label}</span>
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

function ContentText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n').filter(Boolean);
  const hasBullets = lines.some(l => /^[\-•\*]\s/.test(l.trim()));

  if (hasBullets) {
    return (
      <ul className="space-y-0.5">
        {lines.map((line, i) => {
          const bullet = line.trim().match(/^[\-•\*]\s+(.*)/);
          if (bullet) {
            return (
              <li key={i} className="text-sm text-foreground/80 leading-snug flex gap-1.5">
                <span className="text-muted-foreground/50 select-none shrink-0">&#8226;</span>
                <span>{bullet[1]}</span>
              </li>
            );
          }
          return <p key={i} className="text-sm text-foreground/80 leading-snug">{line}</p>;
        })}
      </ul>
    );
  }

  return <p className="text-sm text-foreground/80 leading-snug whitespace-pre-line">{text}</p>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground/60 italic">{text}</p>;
}

const MedicalSoapCards = ({ soapData, className = "" }: MedicalSoapCardsProps) => {
  const subjectiveContent = soapData.subjective?.chiefComplaint || soapData.subjective?.hpi;
  const objectiveContent = soapData.objective?.physicalExam || soapData.objective?.studiesNarrative;
  const hasVitals = soapData.objective?.vitals && soapData.objective.vitals.length > 0;
  const assessmentContent = soapData.assessment?.impression;
  const planContent = soapData.plan?.treatment;
  const diagnosis = soapData.diagnosticoPresuntivo || soapData.aiPresumptiveDx;
  const labs = soapData.objective?.labs;
  const hasLab = !!(soapData.laboratorio || labs?.length);

  return (
    <div className={className}>
      {/* Alerts — compact banner */}
      {soapData.alerts && soapData.alerts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {soapData.alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-red-950/40 text-red-400 border border-red-800/50"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Main SOAP grid: 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* S — Subjetivo */}
        <SectionCard
          style={SECTION_STYLES.subjective}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Subjetivo"
        >
          {subjectiveContent
            ? <ContentText text={subjectiveContent} />
            : <EmptyState text="Sin datos subjetivos" />}
        </SectionCard>

        {/* O — Objetivo */}
        <SectionCard
          style={SECTION_STYLES.objective}
          icon={<Stethoscope className="h-3.5 w-3.5" />}
          label="Objetivo"
        >
          <div className="space-y-2">
            {hasVitals && (
              <div className="flex flex-wrap gap-1.5">
                {soapData.objective!.vitals!.map((vital, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      vital.flagged
                        ? 'bg-red-950/40 text-red-400'
                        : 'bg-muted text-foreground/70'
                    }`}
                  >
                    {vital.flagged && <Activity className="h-2.5 w-2.5" />}
                    {vital.label} {vital.value}{vital.unit ? ` ${vital.unit}` : ''}
                  </span>
                ))}
              </div>
            )}
            {objectiveContent
              ? <ContentText text={objectiveContent} />
              : !hasVitals && <EmptyState text="Sin datos objetivos" />}
          </div>
        </SectionCard>

        {/* A — Evaluación */}
        <SectionCard
          style={SECTION_STYLES.assessment}
          icon={<Brain className="h-3.5 w-3.5" />}
          label="Evaluación"
        >
          {assessmentContent
            ? <ContentText text={assessmentContent} />
            : <EmptyState text="Sin evaluación" />}
        </SectionCard>

        {/* P — Plan */}
        <SectionCard
          style={SECTION_STYLES.plan}
          icon={<ClipboardList className="h-3.5 w-3.5" />}
          label="Plan"
        >
          {planContent
            ? <ContentText text={planContent} />
            : <EmptyState text="Sin plan de tratamiento" />}
        </SectionCard>

        {/* Dx — Diagnóstico Presuntivo */}
        {diagnosis && (
          <SectionCard
            style={SECTION_STYLES.diagnosis}
            icon={<FileText className="h-3.5 w-3.5" />}
            label="Diagnóstico Presuntivo"
          >
            <ContentText text={diagnosis} />
          </SectionCard>
        )}

        {/* Lab — Laboratorio */}
        {hasLab && (
          <SectionCard
            style={SECTION_STYLES.lab}
            icon={<TestTube className="h-3.5 w-3.5" />}
            label="Laboratorio"
          >
            {labs?.length ? (
              <LabTable labs={labs} />
            ) : (
              <ContentText text={soapData.laboratorio!} />
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default MedicalSoapCards;
