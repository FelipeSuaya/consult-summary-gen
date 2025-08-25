import { SoapData } from "@/types/soap";
import { Card } from "@/components/ui/card";
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

const MedicalSoapCards = ({ soapData, className = "" }: MedicalSoapCardsProps) => {
  // Helper function to create gradient backgrounds
  const getCardStyles = (color: string) => {
    const styles = {
      blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-blue-100/50",
      green: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-emerald-100/50", 
      amber: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-amber-100/50",
      teal: "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 shadow-teal-100/50",
      purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-purple-100/50",
      slate: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-slate-100/50"
    };
    return styles[color as keyof typeof styles];
  };

  const renderSubjectiveCard = () => {
    const { subjective } = soapData;
    const content = subjective?.chiefComplaint || subjective?.hpi;
    
    return (
      <Card className={`${getCardStyles('blue')} border-2 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
        <div className="space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-900">Subjetivo</h3>
              <p className="text-blue-700 font-medium">Motivo de consulta</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            {content ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
                <p className="text-blue-900 leading-relaxed font-medium text-lg">
                  {content}
                </p>
              </div>
            ) : (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 text-center">
                <p className="text-blue-600 italic text-lg">Sin datos subjetivos registrados</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderObjectiveCard = () => {
    const { objective } = soapData;
    const content = objective?.physicalExam || objective?.studiesNarrative;
    const hasVitals = objective?.vitals && objective.vitals.length > 0;
    
    return (
      <Card className={`${getCardStyles('green')} border-2 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
        <div className="space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-emerald-900">Objetivo</h3>
              <p className="text-emerald-700 font-medium">Hallazgos clínicos</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            {hasVitals && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50">
                <h4 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Signos Vitales
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {objective.vitals.map((vital, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold text-center ${
                        vital.flagged 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {vital.label}: {vital.value}{vital.unit ? ` ${vital.unit}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {content ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50">
                <p className="text-emerald-900 leading-relaxed font-medium text-lg">
                  {content}
                </p>
              </div>
            ) : !hasVitals ? (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50 text-center">
                <p className="text-emerald-600 italic text-lg">Sin datos objetivos registrados</p>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    );
  };

  const renderAssessmentCard = () => {
    const { assessment } = soapData;
    const content = assessment?.impression;
    
    return (
      <Card className={`${getCardStyles('amber')} border-2 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
        <div className="space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-amber-900">Evaluación</h3>
              <p className="text-amber-700 font-medium">Análisis clínico</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            {content ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50">
                <p className="text-amber-900 leading-relaxed font-medium text-lg">
                  {content}
                </p>
              </div>
            ) : (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 text-center">
                <p className="text-amber-600 italic text-lg">Sin evaluación registrada</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderPlanCard = () => {
    const { plan } = soapData;
    const content = plan?.treatment;
    
    return (
      <Card className={`${getCardStyles('teal')} border-2 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
        <div className="space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg">
              <ClipboardList className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-teal-900">Plan</h3>
              <p className="text-teal-700 font-medium">Tratamiento y seguimiento</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            {content ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-teal-200/50">
                <p className="text-teal-900 leading-relaxed font-medium text-lg">
                  {content}
                </p>
              </div>
            ) : (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-teal-200/50 text-center">
                <p className="text-teal-600 italic text-lg">Sin plan de tratamiento registrado</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderDiagnosisCard = () => {
    const diagnosis = soapData.diagnosticoPresuntivo || soapData.aiPresumptiveDx;
    if (!diagnosis) return null;

    return (
      <Card className={`${getCardStyles('purple')} border-2 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
        <div className="space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-purple-900">Diagnóstico Presuntivo</h3>
              <p className="text-purple-700 font-medium">Impresión diagnóstica</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50">
              <p className="text-purple-900 leading-relaxed font-medium text-lg">
                {diagnosis}
              </p>
            </div>
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
      <Card className={`${getCardStyles('slate')} border-2 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
        <div className="space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-500 flex items-center justify-center shadow-lg">
              <TestTube className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Laboratorio</h3>
              <p className="text-slate-700 font-medium">Estudios complementarios</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            {labs?.length ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
                <LabTable labs={labs} />
              </div>
            ) : laboratorio ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
                <p className="text-slate-900 leading-relaxed font-medium text-lg">{laboratorio}</p>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className={`max-w-7xl mx-auto p-8 space-y-10 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Resumen Clínico – Formato SOAP
        </h1>
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 max-w-2xl mx-auto">
          <p className="text-gray-700 text-lg font-medium">
            {soapData.meta?.patientName && (
              <span className="text-blue-700 font-bold">{soapData.meta.patientName}</span>
            )}
            {soapData.meta?.dateTime && (
              <>
                {soapData.meta.patientName && " • "}
                <span className="text-gray-600">{new Date(soapData.meta.dateTime).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })}</span>
              </>
            )}
          </p>
          {soapData.subjective?.chiefComplaint && (
            <p className="text-gray-600 mt-2 text-base">
              {soapData.subjective.chiefComplaint.length > 80 
                ? `${soapData.subjective.chiefComplaint.slice(0, 80)}...` 
                : soapData.subjective.chiefComplaint}
            </p>
          )}
        </div>
      </div>

      {/* Alerts if any */}
      {soapData.alerts && soapData.alerts.length > 0 && (
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {soapData.alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-6 py-3 bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg"
            >
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <span className="text-base font-semibold text-red-800">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* SOAP Cards - Vertical Layout */}
      <div className="space-y-8">
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