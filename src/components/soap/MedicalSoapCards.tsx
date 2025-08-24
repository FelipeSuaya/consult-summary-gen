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
      <Card className="h-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500 text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold text-blue-900">Subjetivo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {bullets.length > 0 ? (
            <ul className="space-y-2">
              {bullets.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
              {bullets.length > 3 && (
                <li className="text-xs text-blue-600 font-medium">
                  +{bullets.length - 3} elementos más...
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-blue-600/70 italic">Sin datos subjetivos</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderObjectiveCard = () => {
    const { objective } = soapData;
    
    const bullets = [];
    if (objective?.vitals?.length) {
      bullets.push(`Signos vitales: ${objective.vitals.length} mediciones`);
    }
    if (objective?.physicalExam) bullets.push("Examen físico completo");
    if (objective?.studiesNarrative) bullets.push("Estudios complementarios");
    if (objective?.labs?.length) bullets.push(`Laboratorio: ${objective.labs.length} parámetros`);

    return (
      <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold text-green-900">Objetivo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {bullets.length > 0 ? (
            <ul className="space-y-2">
              {bullets.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
              {objective?.vitals && objective.vitals.length > 0 && (
                <li className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {objective.vitals.slice(0, 2).map((vital, idx) => (
                      <Badge 
                        key={idx}
                        variant={vital.flagged ? "destructive" : "secondary"}
                        className="text-xs font-mono bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        {vital.label}: {vital.value}
                      </Badge>
                    ))}
                    {objective.vitals.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{objective.vitals.length - 2}
                      </Badge>
                    )}
                  </div>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-green-600/70 italic">Sin datos objetivos</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAssessmentCard = () => {
    const { assessment } = soapData;
    
    const bullets = [];
    if (assessment?.impression) bullets.push(assessment.impression);
    if (assessment?.differentials?.length) {
      bullets.push(`${assessment.differentials.length} diagnósticos diferenciales`);
    }
    if (assessment?.notes) bullets.push("Notas adicionales documentadas");

    return (
      <Card className="h-full bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold text-amber-900">Evaluación</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {bullets.length > 0 ? (
            <ul className="space-y-2">
              {bullets.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                  <span className="text-amber-500 mt-1">•</span>
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-amber-600/70 italic">Sin evaluación</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPlanCard = () => {
    const { plan } = soapData;
    
    const bullets = [];
    if (plan?.treatment) bullets.push("Tratamiento farmacológico");
    if (plan?.recommendations) bullets.push("Indicaciones no farmacológicas");
    if (plan?.orders) bullets.push("Estudios solicitados");
    if (plan?.referrals) bullets.push("Interconsultas");
    if (plan?.followUp) bullets.push("Seguimiento programado");

    return (
      <Card className="h-full bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-teal-600 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold text-teal-900">Plan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {bullets.length > 0 ? (
            <ul className="space-y-2">
              {bullets.slice(0, 4).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-teal-800">
                  <span className="text-teal-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-teal-600/70 italic">Sin plan definido</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLabCard = () => {
    const { laboratorio } = soapData;
    const labs = soapData.objective?.labs;
    
    if (!laboratorio && !labs?.length) return null;

    return (
      <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-slate-500 text-white">
              <TestTube className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">Laboratorio</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {labs?.length ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-700 mb-2">Resultados disponibles:</p>
              <div className="flex flex-wrap gap-1">
                {labs.slice(0, 4).map((lab, idx) => (
                  <Badge 
                    key={idx}
                    variant={lab.flagged ? "destructive" : "secondary"}
                    className="text-xs font-mono bg-slate-100 text-slate-800"
                  >
                    {lab.parameter}
                  </Badge>
                ))}
                {labs.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{labs.length - 4} más
                  </Badge>
                )}
              </div>
            </div>
          ) : laboratorio ? (
            <p className="text-sm text-slate-700 line-clamp-3">{laboratorio}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const renderDiagnosisCard = () => {
    const diagnosis = soapData.diagnosticoPresuntivo || soapData.aiPresumptiveDx;
    if (!diagnosis) return null;

    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold text-blue-900">Diagnóstico Presuntivo</CardTitle>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">IA</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-blue-800 leading-relaxed">{diagnosis}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Resumen Clínico – Formato SOAP</h1>
        <p className="text-slate-600">
          {soapData.meta?.patientName && `${soapData.meta.patientName} • `}
          {soapData.meta?.dateTime && new Date(soapData.meta.dateTime).toLocaleDateString()}
          {soapData.subjective?.chiefComplaint && ` • ${soapData.subjective.chiefComplaint.slice(0, 50)}...`}
        </p>
      </div>

      {/* Alerts if any */}
      {soapData.alerts && soapData.alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {soapData.alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-800">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* SOAP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {renderSubjectiveCard()}
        {renderObjectiveCard()}
        {renderAssessmentCard()}
        {renderPlanCard()}
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderLabCard()}
        {renderDiagnosisCard()}
      </div>
    </div>
  );
};

export default MedicalSoapCards;