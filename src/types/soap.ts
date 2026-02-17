// Internal SoapData interface (detailed structure for UI)
export interface SoapData {
  meta?: {
    patientName?: string;
    age?: string;
    id?: string;
    dateTime?: string;
    clinician?: string;
    source?: "AI" | "MD";
    version?: string;
  };
  transcripcion?: string;
  subjective?: {
    chiefComplaint?: string;
    hpi?: string;
    personalHistory?: string;
    familyHistory?: string;
    socialHistory?: string;
  };
  objective?: {
    vitals?: Array<{label: string; value: string; unit?: string; flagged?: "high" | "low" | "abnormal" | null}>;
    physicalExam?: string;
    studiesNarrative?: string;
    labs?: Array<{ parameter: string; result: string; reference?: string; unit?: string; flagged?: "high"|"low"|"abnormal"|null }>;
  };
  assessment?: {
    impression?: string;
    differentials?: string[];
    notes?: string;
  };
  plan?: {
    treatment?: string;
    recommendations?: string;
    orders?: string;
    referrals?: string;
    followUp?: string;
  };
  diagnosticoPresuntivo?: string;
  aiPresumptiveDx?: string; // backward compatibility
  laboratorio?: string;
  alerts?: Array<{
    type: "warning" | "critical" | "info";
    message: string;
  }>;
}

// Generate formatted summary from SOAP data (without transcription)
export const generateFormattedSummary = (soapData: SoapData): string => {
  const sections = [];
  
  if (soapData.subjective?.chiefComplaint) {
    sections.push("SUBJETIVO:");
    sections.push(soapData.subjective.chiefComplaint);
    sections.push("");
  }
  
  if (soapData.objective?.physicalExam) {
    sections.push("OBJETIVO:");
    sections.push(soapData.objective.physicalExam);
    sections.push("");
  }
  
  if (soapData.assessment?.impression) {
    sections.push("EVALUACIÓN:");
    sections.push(soapData.assessment.impression);
    sections.push("");
  }
  
  if (soapData.plan?.treatment) {
    sections.push("PLAN:");
    sections.push(soapData.plan.treatment);
    sections.push("");
  }
  
  if (soapData.diagnosticoPresuntivo) {
    sections.push("DIAGNÓSTICO PRESUNTIVO:");
    sections.push(soapData.diagnosticoPresuntivo);
    sections.push("");
  }
  
  if (soapData.laboratorio) {
    sections.push("LABORATORIO:");
    sections.push(soapData.laboratorio);
    sections.push("");
  }
  
  return sections.join('\n');
};
