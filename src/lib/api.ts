
import { ApiResponse } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Define the Prompt interface to match the database schema
interface Prompt {
  id: string;
  name: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Esta clase usará la API key compartida desde Supabase
export class GroqApiService {
  private apiKey: string | null = null;
  private baseUrl = "https://api.groq.com/openai/v1";
  private cachedSystemPrompt: string | null = null;
  
  // Dictionary of common medical term corrections
  private medicalTermCorrections: Record<string, string> = {
    // Body fluids and tests
    "olina": "orina",
    "orinario": "urinario",
    "urina": "orina",
    "meado": "orina",
    "eses": "heces",
    "defecasion": "defecación",
    "defecasión": "defecación",
    "ematocrito": "hematocrito",
    "emoglobina": "hemoglobina",
    "emograma": "hemograma",
    "leucositos": "leucocitos",
    "eritrosito": "eritrocito",
    "eritrositos": "eritrocitos",
    "plaketas": "plaquetas",
    
    // Conditions and symptoms
    "fievre": "fiebre",
    "artralgia": "artralgia",
    "artraljas": "artralgias",
    "mialgia": "mialgia",
    "mialjas": "mialgias",
    "diplopia": "diplopía",
    "gastralgia": "gastralgia",
    "epigastrio": "epigastrio",
    "epigastrica": "epigástrica",
    "ipogastrio": "hipogastrio",
    "mesogastrio": "mesogastrio",
    "neusea": "náusea",
    "nauseas": "náuseas",
    "vomito": "vómito",
    "vomitos": "vómitos",
    "sifalgia": "cefalea",
    "cefalgia": "cefalea",
    "ronkido": "ronquido",
    "ronkidos": "ronquidos",
    
    // Systems and organs
    "epato": "hepato",
    "igado": "hígado",
    "reñon": "riñón",
    "reñones": "riñones",
    "riñons": "riñones",
    "pulmon": "pulmón",
    "pulmones": "pulmones",
    "intestinales": "intestinales",
    "estomago": "estómago",
    "corasón": "corazón",
    "corazon": "corazón",
    "kreatinina": "creatinina",
    
    // Medications and treatments
    "paracetamols": "paracetamol",
    "ibuprofeno": "ibuprofeno",
    "haspirin": "aspirina",
    "aspirina": "aspirina",
    "inyecsión": "inyección",
    "inyeccion": "inyección",
    "cirujía": "cirugía",
    "sirujia": "cirugía",
    "cirugia": "cirugía",
    "antibiotico": "antibiótico",
    "antibioticos": "antibióticos",
    
    // Other common medical terms
    "sintoma": "síntoma",
    "sintomas": "síntomas",
    "diagnostico": "diagnóstico",
    "diagnotico": "diagnóstico",
    "pronostico": "pronóstico",
    "analisis": "análisis",
    "radiografía": "radiografía",
    "radiografia": "radiografía"
  };

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  // Correct medical terms in a text
  correctMedicalTerms(text: string): string {
    if (!text) return text;
    
    // Convert to lowercase for comparison
    let correctedText = text;
    
    // Replace each incorrect term with the correct one
    Object.entries(this.medicalTermCorrections).forEach(([incorrect, correct]) => {
      // Create a regex that matches the word with word boundaries
      // The 'gi' flags make it global and case-insensitive
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correct);
    });
    
    return correctedText;
  }

  // Get the system prompt from the database
  async getSystemPrompt(): Promise<string> {
    // Return cached prompt if available
    if (this.cachedSystemPrompt) {
      return this.cachedSystemPrompt;
    }
    
    try {
      // Using type assertion to tell TypeScript about the structure
      const { data, error } = await supabase
        .from('prompts')
        .select('content')
        .eq('name', 'transcription_summary')
        .eq('active', true)
        .single();

      if (error) {
        console.error("Error al obtener el prompt:", error);
        throw error;
      }

      if (data?.content) {
        this.cachedSystemPrompt = data.content;
        return data.content;
      } else {
        // If no prompt is found, set up the standardized prompt
        await this.setupStandardizedPrompt();
        return this.getSystemPrompt(); // Try again after setting up
      }
    } catch (error) {
      console.error("Error al cargar el prompt de sistema:", error);
      
      // If there's an error, try to set up the standardized prompt
      try {
        await this.setupStandardizedPrompt();
        
        // Try to get the prompt again
        return this.getSystemPrompt();
      } catch (setupError) {
        console.error("Error al configurar el prompt estándar:", setupError);
        
        // Use the default standardized prompt as fallback
        const standardizedPrompt = `Eres un asistente médico especializado en documentación clínica. A partir de la siguiente transcripción de una consulta médica, extrae y resume la información clínica relevante utilizando terminología médica técnica y profesional, siguiendo una estructura estandarizada.

⚠️ IMPORTANTE: Si en la transcripción se mencionan datos personales del paciente, deben ser incluidos en su totalidad y sin omisiones:

Nombre completo
DNI
Teléfono
Correo electrónico
Edad
Domicilio
Género
Nivel educativo (escolaridad)
Ocupación
Obra social
Procedencia

🧾 ESTRUCTURA DEL RESUMEN (usa estos títulos en este orden exacto):

DATOS PERSONALES: Todos los datos identificatorios mencionados.

MOTIVO DE CONSULTA: Razón principal de la consulta expresada en términos técnicos y precisos.

ANTECEDENTES PERSONALES: Enfermedades crónicas del adulto, internaciones previas, cirugías, alergias, antecedentes traumáticos, medicación habitual, y esquema de vacunación si se menciona.

ANTECEDENTES FAMILIARES: Enfermedades relevantes en familiares de primer o segundo grado (ej. hipertensión, diabetes, cáncer, enfermedades hereditarias).

HÁBITOS: Consumo de tabaco (indicar en paq/año), alcohol (indicar en g/día), otras sustancias si se mencionan.

EXÁMENES COMPLEMENTARIOS PREVIOS:

Laboratorio: Presentar valores relevantes en una tabla clara con las siguientes columnas:
| Parámetro | Resultado | Valor de referencia |

Otros estudios: Incluir resultados de imágenes (radiografías, ecografías, TAC, RMN, etc.) o procedimientos (endoscopías, EKG, etc.) si se mencionan.

DIAGNÓSTICO PRESUNTIVO: Hipótesis diagnóstica basada en la anamnesis y examen físico, con términos médicos adecuados.

INDICACIONES: Detalle del plan terapéutico (medicación, dosis, frecuencia), medidas no farmacológicas y otras recomendaciones.

EXÁMENES SOLICITADOS: Estudios complementarios solicitados durante la consulta.

✅ Sé conciso pero completo. Evita redundancias, pero no omitas datos clínicamente significativos. Siempre que se reporten valores de laboratorio, preséntalos en formato de tabla. Usa nomenclatura médica estandarizada en todo el resumen.`;
        
        this.cachedSystemPrompt = standardizedPrompt;
        return standardizedPrompt;
      }
    }
  }

  // Set up the standardized prompt in the database
  private async setupStandardizedPrompt(): Promise<void> {
    const standardizedPrompt = `Eres un asistente médico especializado en documentación clínica. A partir de la siguiente transcripción de una consulta médica, extrae y resume la información clínica relevante utilizando terminología médica técnica y profesional, siguiendo una estructura estandarizada.

⚠️ IMPORTANTE: Si en la transcripción se mencionan datos personales del paciente, deben ser incluidos en su totalidad y sin omisiones:

Nombre completo
DNI
Teléfono
Correo electrónico
Edad
Domicilio
Género
Nivel educativo (escolaridad)
Ocupación
Obra social
Procedencia

🧾 ESTRUCTURA DEL RESUMEN (usa estos títulos en este orden exacto):

DATOS PERSONALES: Todos los datos identificatorios mencionados.

MOTIVO DE CONSULTA: Razón principal de la consulta expresada en términos técnicos y precisos.

ANTECEDENTES PERSONALES: Enfermedades crónicas del adulto, internaciones previas, cirugías, alergias, antecedentes traumáticos, medicación habitual, y esquema de vacunación si se menciona.

ANTECEDENTES FAMILIARES: Enfermedades relevantes en familiares de primer o segundo grado (ej. hipertensión, diabetes, cáncer, enfermedades hereditarias).

HÁBITOS: Consumo de tabaco (indicar en paq/año), alcohol (indicar en g/día), otras sustancias si se mencionan.

EXÁMENES COMPLEMENTARIOS PREVIOS:

Laboratorio: Presentar valores relevantes en una tabla clara con las siguientes columnas:
| Parámetro | Resultado | Valor de referencia |

Otros estudios: Incluir resultados de imágenes (radiografías, ecografías, TAC, RMN, etc.) o procedimientos (endoscopías, EKG, etc.) si se mencionan.

DIAGNÓSTICO PRESUNTIVO: Hipótesis diagnóstica basada en la anamnesis y examen físico, con términos médicos adecuados.

INDICACIONES: Detalle del plan terapéutico (medicación, dosis, frecuencia), medidas no farmacológicas y otras recomendaciones.

EXÁMENES SOLICITADOS: Estudios complementarios solicitados durante la consulta.

✅ Sé conciso pero completo. Evita redundancias, pero no omitas datos clínicamente significativos. Siempre que se reporten valores de laboratorio, preséntalos en formato de tabla. Usa nomenclatura médica estandarizada en todo el resumen.`;

    try {
      // Check if there's already a prompt with the same name
      const { data, error: selectError } = await supabase
        .from('prompts')
        .select('id')
        .eq('name', 'transcription_summary')
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error("Error al verificar si existe el prompt:", selectError);
        throw selectError;
      }

      if (data) {
        // Update the existing prompt
        const { error: updateError } = await supabase
          .from('prompts')
          .update({ content: standardizedPrompt, active: true, updated_at: new Date().toISOString() })
          .eq('id', data.id);

        if (updateError) {
          console.error("Error al actualizar el prompt existente:", updateError);
          throw updateError;
        }

        console.log("Prompt existente actualizado con éxito");
      } else {
        // Create a new prompt
        const { error: insertError } = await supabase
          .from('prompts')
          .insert({
            name: 'transcription_summary',
            content: standardizedPrompt,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error("Error al crear el nuevo prompt:", insertError);
          throw insertError;
        }

        console.log("Nuevo prompt creado con éxito");
      }
    } catch (error) {
      console.error("Error al configurar el prompt estandarizado:", error);
      throw error;
    }
  }

  async fetchSharedApiKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('shared_api_keys')
        .select('api_key')
        .eq('service_name', 'groq')
        .single();

      if (error) {
        console.error("Error al obtener la clave API compartida:", error);
        return null;
      }

      return data?.api_key || null;
    } catch (error) {
      console.error("Error en fetchSharedApiKey:", error);
      return null;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.trim() !== '';
  }

  // Enhanced transcribe audio method with improved error handling and better file format support
  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse> {
    console.log("Starting audio transcription, blob size:", audioBlob.size, "bytes, type:", audioBlob.type);
    
    // Si no hay API key, intentar obtenerla de Supabase
    if (!this.hasApiKey()) {
      const sharedKey = await this.fetchSharedApiKey();
      if (sharedKey) {
        this.setApiKey(sharedKey);
        console.log("Using shared API key from Supabase");
      } else {
        console.error("No API key available for transcription");
        return { success: false, error: "No se pudo obtener la clave API" };
      }
    }

    try {
      // Ensure we have a valid audio blob
      if (!audioBlob || audioBlob.size === 0) {
        console.error("Empty audio blob provided");
        return { success: false, error: "No hay datos de audio para transcribir" };
      }
      
      // Check if the blob type is supported
      const supportedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
      let processingBlob = audioBlob;
      
      if (!supportedTypes.includes(audioBlob.type)) {
        console.warn(`Audio type ${audioBlob.type} may not be supported, proceeding anyway`);
      }
      
      // Create a filename that includes the type for better mime type detection
      const fileName = `recording.${audioBlob.type.split('/')[1] || 'webm'}`;
      console.log("Using filename:", fileName);
      
      const formData = new FormData();
      formData.append("file", processingBlob, fileName);
      formData.append("model", "whisper-large-v3");

      console.log("Sending transcription request to Groq API...");
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // No Content-Type header for FormData
        },
        body: formData,
      });

      console.log("Transcription response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "La transcripción falló";
        
        try {
          // Try to parse error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // If not JSON, use the text directly
          errorMessage = errorText || errorMessage;
        }
        
        console.error("Transcription failed:", errorMessage);
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      console.log("Transcription successful, text length:", data.text?.length || 0);
      
      // Apply comprehensive medical term correction to the transcription
      if (data.text) {
        data.text = this.correctMedicalTerms(data.text);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Exception during transcription:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      return { 
        success: false, 
        error: `No se pudo transcribir el audio: ${errorMessage}` 
      };
    }
  }

  // Enhanced generate summary method that ensures proper structured format
  async generateSummary(transcription: string): Promise<ApiResponse> {
    // Si no hay API key, intentar obtenerla de Supabase
    if (!this.hasApiKey()) {
      const sharedKey = await this.fetchSharedApiKey();
      if (sharedKey) {
        this.setApiKey(sharedKey);
      } else {
        return { success: false, error: "No se pudo obtener la clave API" };
      }
    }

    try {
      // Apply medical term correction to the transcription before sending to LLM
      const correctedTranscription = this.correctMedicalTerms(transcription);
      
      // Get the system prompt from the database - this now ensures the standardized format
      const systemPrompt = await this.getSystemPrompt();
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: correctedTranscription
            }
          ],
          temperature: 0.2, // Lower temperature for more consistent and structured output
          max_tokens: 1500 // Increased for more comprehensive summaries
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || "La generación del resumen falló" };
      }

      const data = await response.json();
      
      // Apply any additional corrections to the summary response and ensure lab tables are formatted correctly
      if (data.choices && data.choices[0]?.message?.content) {
        let summarizedContent = data.choices[0].message.content;
        
        // First correct any medical terms
        summarizedContent = this.correctMedicalTerms(summarizedContent);
        
        // Ensure laboratory values are properly formatted as tables
        summarizedContent = this.ensureLabResultsInTables(summarizedContent);
        
        data.choices[0].message.content = summarizedContent;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Error en la generación del resumen:", error);
      return { success: false, error: "No se pudo generar el resumen" };
    }
  }
  
  // Helper method to ensure laboratory results are properly formatted as tables
  private ensureLabResultsInTables(text: string): string {
    // Find sections that might contain laboratory results
    const labSections = text.match(/Laboratorio:[\s\S]*?((?=\n\n)|$)/g) || [];
    
    for (const section of labSections) {
      // Skip if section already contains a table
      if (section.includes('|')) continue;
      
      // Extract potential laboratory values (e.g., "Glucose: 120 mg/dl")
      const labLines = section.split('\n').filter(line => 
        line.match(/[a-zA-Z]+:?\s+\d+\.?\d*\s*[a-zA-Z\/]+/i)
      );
      
      if (labLines.length) {
        // Create table header
        let tableText = '\n| Parámetro | Resultado | Valor de referencia |\n';
        tableText += '| --------- | --------- | ------------------ |\n';
        
        // Add each lab result as a row
        for (const line of labLines) {
          const match = line.match(/([a-zA-Z\s]+):?\s+(\d+\.?\d*\s*[a-zA-Z\/]+)/i);
          if (match) {
            const parameter = match[1].trim();
            const result = match[2].trim();
            // We don't have reference values from the raw text, so leaving it empty
            tableText += `| ${parameter} | ${result} | - |\n`;
          }
        }
        
        // Replace the lab section with the new table
        text = text.replace(section, `Laboratorio:\n${tableText}`);
      }
    }
    
    return text;
  }

  // Extract patient data from the summary
  extractPatientData(summary: string): {
    dni?: string;
    phone?: string;
    age?: string;
    email?: string;
  } {
    const data: {
      dni?: string;
      phone?: string;
      age?: string;
      email?: string;
    } = {};
    
    // Extract DNI (assuming formats like "DNI: 12345678" or similar)
    const dniMatch = summary.match(/DNI:?\s*(\d{7,9}[A-Za-z]?)/i);
    if (dniMatch) data.dni = dniMatch[1];
    
    // Extract phone number (assuming formats like "phone/teléfono: 123456789" or similar)
    const phoneMatch = summary.match(/tel[eé]fono:?\s*(\+?[\d\s\-]{6,15})/i);
    if (phoneMatch) data.phone = phoneMatch[1];
    
    // Extract age (assuming formats like "age/edad: 30" or similar)
    const ageMatch = summary.match(/edad:?\s*(\d{1,3})/i);
    if (ageMatch) data.age = ageMatch[1];
    
    // Extract email (assuming standard email format)
    const emailMatch = summary.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i);
    if (emailMatch) data.email = emailMatch[0];
    
    return data;
  }
  
  // Reset the cached prompt to force a refresh from the database
  resetCachedPrompt(): void {
    this.cachedSystemPrompt = null;
  }
}

// Create and export a singleton instance
export const groqApi = new GroqApiService();
