import { SoapData } from "@/types/soap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Stethoscope, 
  Brain, 
  ClipboardList, 
  TestTube,
  AlertTriangle,
  FileText
} from "lucide-react";

interface MedicalSoapCardsProps {
  soapData: SoapData;
  className?: string;
}

const MedicalSoapCards = ({ soapData, className = "" }: MedicalSoapCardsProps) => {
  const renderSubjectiveCard = () => {
    const { subjective } = soapData;
    
    const bullets = [];
    if (subjective?.chiefComplaint) bullets.push(subjective.chiefComplaint);
    if (subjective?.hpi) bullets.push("Historia de enfermedad actual documentada");
    if (subjective?.personalHistory) bullets.push("Antecedentes personales relevantes");
    if (subjective?.familyHistory) bullets.push("Antecedentes familiares");

    return (
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Subjetivo</h3>
            {bullets.length > 0 ? (
              <ul className="space-y-2">
                {bullets.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-1 text-xs">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin datos subjetivos</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderObjectiveCard = () => {
    const { objective } = soapData;
    
    const bullets = [];
    if (objective?.vitals?.length) {
      bullets.push(`TA, FC, FR normales (${objective.vitals.length} mediciones)`);
    }
    if (objective?.physicalExam) bullets.push("Exploración física documentada");
    if (objective?.studiesNarrative) bullets.push("Estudios complementarios");
    if (objective?.labs?.length) bullets.push(`Laboratorio sin alteraciones`);

    return (
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Objetivo</h3>
            {bullets.length > 0 ? (
              <ul className="space-y-2">
                {bullets.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-1 text-xs">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin datos objetivos</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderAssessmentCard = () => {
    const { assessment } = soapData;
    
    const bullets = [];
    if (assessment?.impression) bullets.push(assessment.impression);
    if (assessment?.differentials?.length) {
      bullets.push(`Diagnóstico diferencial considerado`);
    }
    if (assessment?.notes) bullets.push("Notas adicionales documentadas");

    return (
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Evaluación</h3>
            {bullets.length > 0 ? (
              <ul className="space-y-2">
                {bullets.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-1 text-xs">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin evaluación</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderPlanCard = () => {
    const { plan } = soapData;
    
    const bullets = [];
    if (plan?.treatment) bullets.push(plan.treatment);
    if (plan?.recommendations) bullets.push(plan.recommendations);
    if (plan?.orders) bullets.push(plan.orders);
    if (plan?.referrals) bullets.push(plan.referrals);
    if (plan?.followUp) bullets.push("Seguimiento programado");

    return (
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan</h3>
            {bullets.length > 0 ? (
              <ul className="space-y-2">
                {bullets.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-1 text-xs">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin plan definido</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderLabCard = () => {
    const { laboratorio } = soapData;
    const labs = soapData.objective?.labs;
    
    if (!laboratorio && !labs?.length) return null;

    return (
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
            <TestTube className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Laboratorio</h3>
            {labs?.length ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                  <span>Parámetro</span>
                  <span>Resultado</span>
                </div>
                {labs.slice(0, 4).map((lab, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <span className="font-medium">{lab.parameter}</span>
                    <span className={lab.flagged ? "text-red-600 font-medium" : ""}>{lab.result || "Normal"}</span>
                  </div>
                ))}
                {labs.length > 4 && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    +{labs.length - 4} parámetros adicionales
                  </div>
                )}
              </div>
            ) : laboratorio ? (
              <p className="text-sm text-gray-700 leading-relaxed">{laboratorio}</p>
            ) : null}
          </div>
        </div>
      </Card>
    );
  };

  const renderDiagnosisCard = () => {
    const diagnosis = soapData.diagnosticoPresuntivo || soapData.aiPresumptiveDx;
    if (!diagnosis) return null;

    return (
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnóstico Presuntivo</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{diagnosis}</p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Resumen Clínico – Formato SOAP</h1>
        <p className="text-gray-600 text-lg">
          {soapData.meta?.patientName && `${soapData.meta.patientName} • `}
          {soapData.meta?.dateTime && new Date(soapData.meta.dateTime).toLocaleDateString()}
          {soapData.subjective?.chiefComplaint && ` • ${soapData.subjective.chiefComplaint.slice(0, 50)}...`}
        </p>
      </div>

      {/* Alerts if any */}
      {soapData.alerts && soapData.alerts.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {soapData.alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-800">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* SOAP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderSubjectiveCard()}
        {renderObjectiveCard()}
        {renderAssessmentCard()}
        {renderPlanCard()}
        {renderDiagnosisCard()}
        {renderLabCard()}
      </div>
    </div>
  );
};

export default MedicalSoapCards;