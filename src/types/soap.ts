
export interface SoapData {
  meta?: {
    patientName?: string;  // "APELLIDO, Nombre" si se dispone
    age?: string;          // "45 años"
    id?: string;           // DNI/HC
    dateTime?: string;     // ISO
    clinician?: string;    // "Dr./Dra. Apellido"
    source?: "AI" | "MD";  // Procedencia del resumen
    version?: string;      // p.ej. "v1.2"
  };
  subjective?: {
    chiefComplaint?: string;
    hpi?: string; // Historia de enfermedad actual (OPQRST/OLDCARTS si aplica)
    personalHistory?: string; // antecedentes personales y quirúrgicos relevantes si surgen
    familyHistory?: string;
    socialHistory?: string; // hábitos / tóxicos si surgen
  };
  objective?: {
    vitals?: Array<{label: string; value: string; unit?: string}>;
    physicalExam?: string;
    studiesNarrative?: string; // descripción breve de imágenes/otros
    labs?: Array<{ parameter: string; result: string; reference?: string; flagged?: "high"|"low"|"abnormal"|null }>;
  };
  assessment?: {
    impression?: string; // impresión diagnóstica del médico
    differentials?: string[]; // opcional
    notes?: string; // aclaraciones del profesional
  };
  plan?: {
    treatment?: string;     // plan terapéutico + posología si figura
    recommendations?: string;
    orders?: string;        // estudios solicitados
    referrals?: string;     // interconsultas/derivaciones
    followUp?: string;      // control/seguimiento
  };
  aiPresumptiveDx?: string; // diagnóstico presuntivo IA (si provisto)
}
