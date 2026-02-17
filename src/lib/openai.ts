import 'server-only'
import OpenAI from 'openai'
import type { SoapData } from '@/types/soap'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODEL = 'gpt-4o-mini'

/**
 * Genera un resumen SOAP estructurado a partir de una transcripcion medica.
 */
export async function generateSoapSummary(
  transcription: string,
  systemPrompt: string
): Promise<SoapData> {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: transcription },
    ],
  })

  const content = response.choices[0]?.message?.content || ''

  // The system prompt asks for structured text with sections, not JSON.
  // We parse the plain-text SOAP response into our SoapData shape.
  return parseSoapText(content)
}

/**
 * Chat con contexto del paciente. Recibe historial de mensajes y las consultas del paciente.
 */
export async function chatWithPatientContext(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  consultations: Array<{
    date: string
    patientName: string
    summary: string
    transcription: string
  }>
): Promise<string> {
  const systemContent = buildPatientSystemMessage(consultations)

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemContent },
      ...messages,
    ],
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * Regenera un resumen a partir de una transcripcion (usado por ConsultationTransformer).
 */
export async function regenerateSummary(
  transcription: string,
  systemPrompt: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: transcription },
    ],
  })

  return response.choices[0]?.message?.content || ''
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPatientSystemMessage(
  consultations: Array<{
    date: string
    patientName: string
    summary: string
    transcription: string
  }>
): string {
  const header = `Eres un asistente medico especializado en analisis de historiales clinicos. Tienes acceso al historial completo del paciente. Responde en espanol con terminologia medica profesional. Puedes generar graficos, diagramas anatomicos y lineas de tiempo usando la sintaxis \`\`\`canvas cuando sea apropiado.`

  if (consultations.length === 0) {
    return `${header}\n\nNo hay consultas registradas para este paciente.`
  }

  const consultationBlocks = consultations.map((c, i) => {
    const parts = [`--- Consulta ${i + 1} (${c.date}) ---`]
    if (c.summary) parts.push(`Resumen:\n${c.summary}`)
    if (c.transcription) parts.push(`Transcripcion:\n${c.transcription}`)
    return parts.join('\n')
  })

  return `${header}\n\nHistorial del paciente (${consultations.length} consultas):\n\n${consultationBlocks.join('\n\n')}`
}

/**
 * Parses the plain-text SOAP output from the LLM into a SoapData object.
 * The LLM returns sections like DATOS PERSONALES, MOTIVO DE CONSULTA, etc.
 * We map those into SoapData's subjective/objective/assessment/plan fields.
 */
function parseSoapText(text: string): SoapData {
  // Extract the full text as the subjective chief complaint for simplicity,
  // and also try to extract known sections.
  const getSection = (label: string): string => {
    // Match "LABEL:" or "**LABEL:**" followed by content until the next section header
    const regex = new RegExp(
      `(?:^|\\n)\\**${label}:?\\**\\s*\\n?([\\s\\S]*?)(?=\\n\\**[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\\s]+:?\\**\\s*\\n|$)`,
      'i'
    )
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }

  const subjective = [
    getSection('DATOS PERSONALES'),
    getSection('MOTIVO DE CONSULTA'),
    getSection('ANTECEDENTES PERSONALES'),
    getSection('ANTECEDENTES FAMILIARES'),
    getSection('HÁBITOS'),
    getSection('HABITOS'),
  ].filter(Boolean).join('\n\n')

  const objective = [
    getSection('EXÁMENES COMPLEMENTARIOS PREVIOS'),
    getSection('EXAMENES COMPLEMENTARIOS PREVIOS'),
    getSection('EXAMEN FÍSICO'),
    getSection('EXAMEN FISICO'),
  ].filter(Boolean).join('\n\n')

  const diagnostico = getSection('DIAGNÓSTICO PRESUNTIVO') || getSection('DIAGNOSTICO PRESUNTIVO')
  const plan = [
    getSection('INDICACIONES'),
    getSection('EXÁMENES SOLICITADOS'),
    getSection('EXAMENES SOLICITADOS'),
  ].filter(Boolean).join('\n\n')

  const laboratorio = getSection('LABORATORIO') || getSection('Laboratorio')

  return {
    transcripcion: '',
    subjective: {
      chiefComplaint: subjective || text,
    },
    objective: {
      physicalExam: objective || '',
    },
    assessment: {
      impression: diagnostico || '',
    },
    plan: {
      treatment: plan || '',
    },
    diagnosticoPresuntivo: diagnostico || '',
    laboratorio: laboratorio || '',
  }
}
