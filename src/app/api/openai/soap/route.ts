import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODEL = 'gpt-4o-mini'

const SYSTEM_PROMPT = `Eres un asistente médico especializado en documentación clínica. A partir de la siguiente transcripción de una consulta médica, extrae y resume la información clínica relevante utilizando terminología médica técnica y profesional, siguiendo una estructura estandarizada.

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

✅ Sé conciso pero completo. Evita redundancias, pero no omitas datos clínicamente significativos. Siempre que se reporten valores de laboratorio, preséntalos en formato de tabla. Usa nomenclatura médica estandarizada en todo el resumen.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcription } = await request.json()

    if (!transcription) {
      return NextResponse.json({ error: 'Transcription is required' }, { status: 400 })
    }

    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcription },
      ],
    })

    const content = response.choices[0]?.message?.content || ''

    return NextResponse.json({ summary: content })
  } catch (error) {
    console.error('SOAP generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
