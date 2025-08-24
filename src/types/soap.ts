
// n8n response format - actual structure from n8n
export interface N8nResponse {
  output: {
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
  const data = Array.isArray(n8nData) ? n8nData[0]?.output : n8nData.output;
  
  if (!data) {
    throw new Error('Invalid n8n response format');
  }

  return {
    meta,
    subjective: {
      chiefComplaint: data.Subjective || '',
    },
    objective: {
      physicalExam: data.Objective || '',
    },
    assessment: {
      impression: data.Assessment || '',
    },
    plan: {
      treatment: data.Plan || '',
    },
    diagnosticoPresuntivo: data["Diagnostico Presuntivo"] || '',
    laboratorio: data.Laboratorio || '',
  };
};
