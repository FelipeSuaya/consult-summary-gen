
import SoapSummary from "@/components/soap/SoapSummary";
import { SoapData } from "@/types/soap";

// Sample alerts and history data
const sampleAlerts = [
  { type: "warning" as const, text: "TA elevada", priority: "high" as const },
  { type: "info" as const, text: "Requiere seguimiento", priority: "medium" as const }
];

const sampleHistory = [
  {
    id: "1",
    date: "2024-01-08T10:00:00Z",
    summary: "Control de HTA. Paciente refiere adherencia al tratamiento.",
    diagnosis: "Hipertensión arterial controlada",
    clinician: "Dra. Rodríguez",
    type: "control" as const,
    status: "completo" as const
  },
  {
    id: "2", 
    date: "2023-12-15T15:30:00Z",
    summary: "Consulta por cefalea ocasional. Se ajusta medicación antihipertensiva.",
    diagnosis: "Cefalea tensional, HTA",
    clinician: "Dr. López",
    type: "consulta" as const,
    status: "completo" as const
  }
];

const sampleSoapData: SoapData = {
  meta: {
    patientName: "GARCÍA, María Elena",
    age: "42 años",
    id: "DNI 23456789",
    dateTime: "2024-01-15T14:30:00Z",
    clinician: "Dra. Rodríguez",
    source: "MD",
    version: "v1.0"
  },
  subjective: {
    chiefComplaint: "Cefalea de una semana de evolución.",
    hpi: "Inicio hace ~7 días. Dolor referido como severo, con mareos persistentes. Refiere estrés significativo por problemas financieros.",
    personalHistory: "HTA controlada con enalapril. Migrañas ocasionales.",
    familyHistory: "Padre con ACV a los 65 años.",
    socialHistory: "No fuma. Alcohol ocasional. Trabaja como contadora."
  },
  objective: {
    vitals: [
      { label: "PA", value: "140/90", unit: "mmHg", flagged: "high" },
      { label: "FC", value: "78", unit: "lpm" },
      { label: "FR", value: "18", unit: "rpm" },
      { label: "Temp", value: "36.8", unit: "°C" },
      { label: "SatO₂", value: "98", unit: "%" }
    ],
    physicalExam: "Paciente consciente, orientada. Examen neurológico sin alteraciones focales. Fondo de ojo normal. No rigidez de nuca.",
    studiesNarrative: "Radiografía de cráneo solicitada para descartar patología orgánica.",
    labs: [
      { parameter: "Glucemia", result: "95", reference: "70-110", unit: "mg/dl" },
      { parameter: "Hemoglobina", result: "11.8", reference: "12-15", unit: "g/dl", flagged: "low" },
      { parameter: "Leucocitos", result: "7200", reference: "4000-11000", unit: "/μl" },
      { parameter: "Plaquetas", result: "280000", reference: "150000-450000", unit: "/μl" }
    ]
  },
  assessment: {
    impression: "Cefalea de una semana asociada a mareos. Considerar descartar causas orgánicas mediante estudios por imágenes.",
    differentials: [
      "Cefalea tensional",
      "Hipertensión arterial descompensada",
      "Cefalea secundaria a causa orgánica"
    ],
    notes: "Factores de riesgo cardiovascular presentes. Control estricto de TA."
  },
  plan: {
    treatment: "Sumatriptán 50mg vía oral al inicio de la cefalea (máx. 2 dosis en 24hs). Paracetamol 500mg c/8hs por dolor.",
    recommendations: "Descanso en ambiente oscuro y silencioso. Técnicas de relajación. Evitar triggers conocidos.",
    orders: "Radiografía de cráneo AP y lateral. Laboratorio de rutina si no mejora.",
    referrals: "Interconsulta con neurología si persisten síntomas tras tratamiento.",
    followUp: "Control en 1 semana. Consulta urgente si empeora o aparecen síntomas neurológicos."
  },
  aiPresumptiveDx: "Cefalea tensional vs cefalea secundaria a causa orgánica no especificada."
};

const SoapSummaryPage = () => {
  return (
    <div className="min-h-screen">
      <SoapSummary 
        soapData={sampleSoapData}
        alerts={sampleAlerts}
        historyEntries={sampleHistory}
      />
    </div>
  );
};

export default SoapSummaryPage;
