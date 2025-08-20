
import SoapSummary from "@/components/soap/SoapSummary";
import { SoapData } from "@/types/soap";

const SoapSummaryPage = () => {
  // Datos de ejemplo basados en la captura proporcionada
  const sampleSoapData: SoapData = {
    meta: {
      patientName: "GONZÁLEZ, María Elena",
      age: "45 años",
      id: "DNI: 12.345.678",
      dateTime: "2024-01-15T14:30:00.000Z",
      clinician: "Dra. Rodríguez",
      source: "MD",
      version: "v1.2"
    },
    subjective: {
      chiefComplaint: "Cefalea de una semana de evolución.",
      hpi: "Inicio hace aproximadamente una semana. Dolor de cabeza de intensidad referida como severa, acompañado de mareos persistentes. El paciente refiere estrés significativo relacionado con problemas financieros. La cefalea se presenta principalmente en región temporal bilateral, de características opresivas, que empeora con el estrés y mejora parcialmente con el reposo. No refiere náuseas ni vómitos. No presenta fotofobia ni fonofobia. Niega antecedentes de traumatismo craneal reciente.",
      personalHistory: "Hipertensión arterial en tratamiento con enalapril 10mg/día. No refiere antecedentes quirúrgicos de relevancia.",
      familyHistory: "Madre con antecedentes de migrañas. Padre fallecido por infarto agudo de miocardio a los 65 años.",
      socialHistory: "No fumadora. Consumo ocasional de alcohol (1-2 copas de vino por semana). Trabaja como contadora, actividad sedentaria con alto nivel de estrés."
    },
    objective: {
      vitals: [
        { label: "PA", value: "140/90", unit: "mmHg", flagged: "high" },
        { label: "FC", value: "78", unit: "lpm" },
        { label: "T°", value: "36.5", unit: "°C" },
        { label: "FR", value: "16", unit: "rpm" },
        { label: "SatO2", value: "98", unit: "%" }
      ],
      physicalExam: "Paciente consciente, orientada en tiempo y espacio. Examen neurológico: pupilas isocóricas reactivas, pares craneales sin alteraciones, fuerza muscular conservada, reflejos osteotendinosos presentes y simétricos. No se observan signos meníngeos. Examen cardiovascular: ruidos cardíacos rítmicos, sin soplos. Examen pulmonar: murmullo vesicular conservado bilateralmente.",
      studiesNarrative: "No se realizaron estudios complementarios en la consulta actual.",
      labs: []
    },
    assessment: {
      impression: "Cefalea de una semana de evolución asociada a mareos. Se considera la necesidad de descartar causas orgánicas mediante estudios por imágenes.",
      differentials: [
        "Cefalea tensional secundaria a estrés",
        "Hipertensión arterial descompensada",
        "Cefalea secundaria a causa orgánica por determinar"
      ],
      notes: "Paciente presenta factores de riesgo cardiovascular (hipertensión, estrés, antecedentes familiares). Se recomienda control estricto de presión arterial y manejo del estrés."
    },
    plan: {
      treatment: "1. Paracetamol 500mg cada 8 horas por 5 días para manejo sintomático del dolor\n2. Ajuste de medicación antihipertensiva: aumentar enalapril a 20mg/día\n3. Técnicas de relajación y manejo del estrés\n4. Dieta hiposódica",
      recommendations: "Evitar factores desencadenantes de estrés en lo posible. Mantener horarios regulares de sueño (7-8 horas diarias). Realizar ejercicio moderado 30 minutos, 3 veces por semana.",
      orders: "Solicitar radiografía de cráneo AP y lateral. Considerar tomografía computada de cerebro sin contraste si persisten los síntomas.",
      referrals: "Interconsulta con neurología si no hay mejoría en 7-10 días.",
      followUp: "Control y seguimiento en 1 semana posterior a la realización del estudio. Control de presión arterial en 3 días."
    },
    aiPresumptiveDx: "Cefalea tensional versus cefalea secundaria a causa orgánica no especificada. Hipertensión arterial descompensada como factor contribuyente."
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Resumen Clínico - Formato SOAP
          </h1>
          <p className="text-muted-foreground">
            Demostración del componente de visualización de resúmenes médicos
          </p>
        </div>
        
        <SoapSummary soapData={sampleSoapData} />
      </div>
    </div>
  );
};

export default SoapSummaryPage;
