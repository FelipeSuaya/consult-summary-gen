
interface MedicalAnalyticsPayload {
  question: string;
  selectedPatientId: string;
  consultations: any[];
  symptomsData: any[];
  diagnosisData: any[];
  chartData: any[];
  webhookUrl: string;
}

interface AnalyticsResponse {
  success: boolean;
  data?: {
    response: string;
    analysis?: any;
  };
  error?: string;
}

export const sendMedicalAnalyticsQuery = async (payload: MedicalAnalyticsPayload): Promise<AnalyticsResponse> => {
  const { webhookUrl, selectedPatientId, consultations, symptomsData, diagnosisData, chartData, question } = payload;

  try {
    console.log("Enviando consulta de análisis médico a N8N");

    // Preparar datos del paciente
    const patientData = {
      id: selectedPatientId,
      totalConsultations: consultations.length,
      lastConsultationDate: consultations.length > 0 ? consultations[0].dateTime : null
    };

    // Preparar resúmenes de consultas con datos estructurados
    const consultationSummaries = consultations.map(consultation => ({
      id: consultation.id,
      date: consultation.dateTime,
      summary: consultation.summary || '',
      transcription: consultation.transcription || '',
      patientName: consultation.patientName
    }));

    // Preparar contexto con patrones y frecuencias
    const context = {
      symptomsFrequency: symptomsData.reduce((acc, item) => {
        acc[item.name] = item.value;
        return acc;
      }, {} as Record<string, number>),
      
      diagnosisFrequency: diagnosisData.reduce((acc, item) => {
        acc[item.name] = item.value;
        return acc;
      }, {} as Record<string, number>),
      
      monthlyPattern: chartData.map(item => ({
        month: item.month,
        consultations: item.consultas
      })),

      totalConsultations: consultations.length,
      dateRange: {
        from: consultations.length > 0 ? consultations[consultations.length - 1].dateTime : null,
        to: consultations.length > 0 ? consultations[0].dateTime : null
      }
    };

    // Estructura de datos que se enviará a N8N
    const requestPayload = {
      question,
      patient: patientData,
      consultations: consultationSummaries,
      context,
      timestamp: new Date().toISOString(),
      requestId: `analytics_${Date.now()}`
    };

    // Configurar timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("Respuesta del webhook N8N:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error del servidor N8N:", errorText);
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Datos recibidos del análisis médico:', responseData);

    return {
      success: true,
      data: responseData
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('La consulta de análisis tardó más de lo esperado');
      return {
        success: false,
        error: 'La consulta tardó más de lo esperado. Intenta de nuevo.'
      };
    }

    console.error('Error enviando consulta de análisis médico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar la consulta'
    };
  }
};

// Función auxiliar para extraer síntomas de un texto
export const extractSymptomsFromText = (text: string): string[] => {
  if (!text) return [];

  const commonSymptoms = [
    "dolor", "fiebre", "cefalea", "tos", "disnea", "náuseas", "vómitos",
    "diarrea", "astenia", "fatiga", "mareo", "vértigo", "disuria",
    "poliuria", "odinofagia", "disfonía", "prurito", "edema", "diaforesis",
    "palpitaciones", "sudoración", "escalofríos", "dolor de cabeza",
    "dolor abdominal", "dolor torácico", "dificultad respiratoria"
  ];

  const lowerText = text.toLowerCase();
  return commonSymptoms.filter(symptom => lowerText.includes(symptom));
};

// Función auxiliar para extraer diagnósticos de un texto
export const extractDiagnosisFromText = (text: string): string[] => {
  if (!text) return [];

  const commonDiagnosis = [
    "hipertensión", "diabetes", "neumonía", "bronquitis", "gastritis",
    "migraña", "infección", "artrosis", "artritis", "hipotiroidismo",
    "hipertiroidismo", "anemia", "colitis", "faringitis", "dermatitis",
    "hipercolesterolemia", "depresión", "ansiedad", "insuficiencia",
    "otitis", "sinusitis", "cistitis", "gripe", "resfriado"
  ];

  const lowerText = text.toLowerCase();
  return commonDiagnosis.filter(diagnosis => lowerText.includes(diagnosis));
};
