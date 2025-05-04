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

// Esta clase ahora está simplificada ya que todo el procesamiento ocurre en n8n
export class GroqApiService {
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
