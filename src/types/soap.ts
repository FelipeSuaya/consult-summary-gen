
// n8n response format - actual structure from n8n (supports both formats)
export interface N8nResponse {
  transcripcion?: string;
  Subjective?: string;
  Objective?: string;
  Assessment?: string;
  Plan?: string;
  "Diagnostico Presuntivo"?: string;
  DiagnosticoPresuntivo?: string;
  Laboratorio?: string;
  output?: {
    Subjective: string;
    Objective: string;
    Assessment: string;
    Plan: string;
    "Diagnostico Presuntivo": string;
    Laboratorio: string;
  };
}

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

// Converter function from n8n format to internal format
export const convertN8nToSoapData = (n8nData: N8nResponse | N8nResponse[], meta?: SoapData['meta']): SoapData => {
  // Handle array response (first item) or direct response
  let data: any;
  
  if (Array.isArray(n8nData)) {
    data = n8nData[0];
  } else {
    data = n8nData;
  }
  
  // Handle nested output format or direct format
  const soapFields = data.output || data;
  
  if (!soapFields) {
    throw new Error('Invalid n8n response format');
  }

  // Handle both "Diagnostico Presuntivo" and "DiagnosticoPresuntivo" formats
  const diagnostico = soapFields["Diagnostico Presuntivo"] || 
                     soapFields["DiagnosticoPresuntivo"] || 
                     '';

  return {
    meta,
    transcripcion: data.transcripcion || '',
    subjective: {
      chiefComplaint: soapFields.Subjective || '',
    },
    objective: {
      physicalExam: soapFields.Objective || '',
    },
    assessment: {
      impression: soapFields.Assessment || '',
    },
    plan: {
      treatment: soapFields.Plan || '',
    },
    diagnosticoPresuntivo: diagnostico,
    laboratorio: soapFields.Laboratorio || '',
  };
};

// Generate formatted summary from SOAP data
export const generateFormattedSummary = (soapData: SoapData): string => {
  const sections = [];
  
  if (soapData.transcripcion) {
    sections.push("TRANSCRIPCIÓN:");
    sections.push(soapData.transcripcion);
    sections.push("");
  }
  
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
