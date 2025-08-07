
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
    console.log("🚀 Enviando consulta de análisis médico a N8N");
    console.log("📊 Datos del payload:", {
      question,
      patientId: selectedPatientId,
      consultationsCount: consultations.length,
      symptomsCount: symptomsData.length,
      diagnosisCount: diagnosisData.length
    });

    // Preparar datos del paciente seleccionado
    const patientData = {
      id: selectedPatientId,
      totalConsultations: consultations.length,
      lastConsultationDate: consultations.length > 0 ? consultations[0].dateTime : null,
      firstConsultationDate: consultations.length > 0 ? consultations[consultations.length - 1].dateTime : null
    };

    // Preparar TODOS los resúmenes y transcripciones del paciente para análisis IA
    const consultationSummaries = consultations.map(consultation => ({
      id: consultation.id,
      date: consultation.dateTime,
      patientName: consultation.patientName,
      // DATOS CLAVE PARA IA: Resúmenes médicos y transcripciones completas
      summary: consultation.summary || '',
      transcription: consultation.transcription || '',
      // Datos adicionales del paciente si están disponibles
      patientData: consultation.patientData || {}
    }));

    // Contexto enriquecido con estadísticas para análisis inteligente
    const context = {
      // Frecuencias de síntomas extraídos de resúmenes
      symptomsFrequency: symptomsData.reduce((acc, item) => {
        acc[item.name] = item.value;
        return acc;
      }, {} as Record<string, number>),
      
      // Frecuencias de diagnósticos extraídos de resúmenes  
      diagnosisFrequency: diagnosisData.reduce((acc, item) => {
        acc[item.name] = item.value;
        return acc;
      }, {} as Record<string, number>),
      
      // Patrones temporales mensuales
      monthlyPattern: chartData.map(item => ({
        month: item.month,
        consultations: item.consultas
      })),

      // Metadatos para análisis temporal
      totalConsultations: consultations.length,
      dateRange: {
        from: consultations.length > 0 ? consultations[consultations.length - 1].dateTime : null,
        to: consultations.length > 0 ? consultations[0].dateTime : null
      },

      // Estadísticas adicionales para contexto IA
      averageConsultationsPerMonth: consultations.length > 0 ? 
        chartData.reduce((sum, item) => sum + item.consultas, 0) / chartData.length : 0,
      mostFrequentSymptom: symptomsData.length > 0 ? symptomsData[0].name : null,
      mostFrequentDiagnosis: diagnosisData.length > 0 ? diagnosisData[0].name : null
    };

    // Estructura optimizada para el webhook N8N
    const requestPayload = {
      question,
      patient: patientData,
      consultations: consultationSummaries,
      context,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `medical_analytics_${Date.now()}`,
        version: "1.0",
        language: "es"
      }
    };

    console.log("📤 Payload completo para N8N:", JSON.stringify(requestPayload, null, 2));

    // Configurar timeout de 45 segundos para dar tiempo a la IA
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Lovable-Medical-Analytics/1.0'
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("📥 Respuesta del webhook N8N:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error del servidor N8N:", errorText);
      throw new Error(`Error del webhook N8N: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Respuesta completa de N8N:', responseData);

    // Manejar la estructura de respuesta de N8N: {"mensaje": "contenido"}
    let aiResponse = '';
    
    if (responseData.mensaje) {
      // Respuesta en el formato esperado de N8N
      aiResponse = responseData.mensaje;
    } else if (responseData.data?.response) {
      // Formato alternativo por compatibilidad
      aiResponse = responseData.data.response;
    } else if (typeof responseData === 'string') {
      // Respuesta directa como string
      aiResponse = responseData;
    } else {
      throw new Error('Formato de respuesta no reconocido del webhook N8N');
    }

    if (!aiResponse || aiResponse.trim() === '') {
      throw new Error('El webhook N8N devolvió una respuesta vacía');
    }

    return {
      success: true,
      data: {
        response: aiResponse,
        analysis: responseData.analysis || null
      }
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Timeout: El análisis médico tardó más de 45 segundos');
      return {
        success: false,
        error: 'El análisis médico está tardando más de lo esperado. La IA está procesando muchos datos históricos. Intenta de nuevo en unos momentos.'
      };
    }

    console.error('💥 Error en sendMedicalAnalyticsQuery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar la consulta médica'
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
