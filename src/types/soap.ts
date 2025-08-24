
// n8n response format
export interface N8nResponse {
  transcripcion: string;
  Subjective: string;
  Objective: string;
  Assessment: string;
  Plan: string;
  "Diagnostico Presuntivo": string;
  Laboratorio: string;
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
export const convertN8nToSoapData = (n8nData: N8nResponse, meta?: SoapData['meta']): SoapData => {
  return {
    meta,
    transcripcion: n8nData.transcripcion,
    subjective: {
      chiefComplaint: n8nData.Subjective,
    },
    objective: {
      physicalExam: n8nData.Objective,
    },
    assessment: {
      impression: n8nData.Assessment,
    },
    plan: {
      treatment: n8nData.Plan,
    },
    diagnosticoPresuntivo: n8nData["Diagnostico Presuntivo"],
    laboratorio: n8nData.Laboratorio,
  };
};
