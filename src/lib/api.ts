
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
        throw new Error("No se encontró el prompt en la base de datos");
      }
    } catch (error) {
      console.error("Error al cargar el prompt de sistema:", error);
      // Fallback to default prompt if there's an error
      return "Eres un asistente médico especializado. Extrae y resume la información clave de la consulta médica.";
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

  // Transcribe audio using Whisper
  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse> {
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
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model", "whisper-large-v3");

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // No Content-Type header for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || "La transcripción falló" };
      }

      const data = await response.json();
      
      // Apply medical term correction to the transcription
      if (data.text) {
        data.text = this.correctMedicalTerms(data.text);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Error de transcripción:", error);
      return { success: false, error: "No se pudo transcribir el audio" };
    }
  }

  // Generate summary using Groq's LLM
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
      
      // Get the system prompt from the database
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
          temperature: 0.3,
          max_tokens: 1024
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || "La generación del resumen falló" };
      }

      const data = await response.json();
      
      // Apply any additional corrections to the summary response if needed
      if (data.choices && data.choices[0]?.message?.content) {
        data.choices[0].message.content = this.correctMedicalTerms(data.choices[0].message.content);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Error en la generación del resumen:", error);
      return { success: false, error: "No se pudo generar el resumen" };
    }
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
