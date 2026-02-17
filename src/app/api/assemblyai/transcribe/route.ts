import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const maxDuration = 300

const POLLING_INTERVAL = 3000
const MAX_POLLING_TIME = 300000

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { audio_url } = await request.json()

    if (!audio_url) {
      return NextResponse.json({ error: 'audio_url is required' }, { status: 400 })
    }

    // Submit transcription job
    const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        Authorization: process.env.ASSEMBLYAI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url,
        language_code: 'es',
        speaker_labels: true,
      }),
    })

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text()
      return NextResponse.json(
        { error: `AssemblyAI submit error: ${submitResponse.status} - ${errorText}` },
        { status: submitResponse.status }
      )
    }

    const { id: transcriptId } = await submitResponse.json()

    if (!transcriptId) {
      return NextResponse.json({ error: 'No transcript ID received' }, { status: 500 })
    }

    // Poll until completed
    const startTime = Date.now()

    while (Date.now() - startTime < MAX_POLLING_TIME) {
      const pollResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { Authorization: process.env.ASSEMBLYAI_API_KEY! },
        }
      )

      if (!pollResponse.ok) {
        return NextResponse.json(
          { error: `Poll error: ${pollResponse.status}` },
          { status: pollResponse.status }
        )
      }

      const result = await pollResponse.json()

      if (result.status === 'completed') {
        if (!result.text) {
          return NextResponse.json({ error: 'Empty transcription' }, { status: 500 })
        }

        // Build speaker-labeled text if utterances are available
        let text = result.text
        if (result.utterances && result.utterances.length > 0) {
          text = result.utterances
            .map((u: { speaker: string; text: string }) => `Speaker ${u.speaker}: ${u.text}`)
            .join('\n')
        }

        return NextResponse.json({ text })
      }

      if (result.status === 'error') {
        return NextResponse.json(
          { error: `AssemblyAI error: ${result.error || 'Unknown'}` },
          { status: 500 }
        )
      }

      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL))
    }

    return NextResponse.json({ error: 'Transcription timeout (5 min)' }, { status: 504 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
