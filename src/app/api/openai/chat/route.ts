import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODEL = 'gpt-4o-mini'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, consultations } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const systemContent = buildPatientSystemMessage(consultations || [])

    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
    })

    const content = response.choices[0]?.message?.content || ''

    return NextResponse.json({ response: content })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
