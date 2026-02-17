import 'server-only'

const ASSEMBLY_API_KEY = process.env.ASSEMBLYAI_API_KEY!
const POLLING_INTERVAL = 3000 // 3 seconds between polls
const MAX_POLLING_TIME = 300000 // 5 minutes max

/**
 * Submits an audio URL to AssemblyAI for transcription and polls until complete.
 * Returns the final transcription text.
 */
export async function transcribeAudio(uploadUrl: string): Promise<string> {
  // 1. Submit transcription job
  const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      Authorization: ASSEMBLY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      language_code: 'es',
    }),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new Error(`Error al enviar transcripcion a AssemblyAI: ${submitResponse.status} - ${errorText}`)
  }

  const { id: transcriptId } = await submitResponse.json()

  if (!transcriptId) {
    throw new Error('No se recibio ID de transcripcion de AssemblyAI')
  }

  // 2. Poll until completed or error
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_POLLING_TIME) {
    const pollResponse = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: { Authorization: ASSEMBLY_API_KEY },
      }
    )

    if (!pollResponse.ok) {
      throw new Error(`Error al consultar estado de transcripcion: ${pollResponse.status}`)
    }

    const result = await pollResponse.json()

    if (result.status === 'completed') {
      if (!result.text) {
        throw new Error('La transcripcion esta vacia')
      }
      return result.text
    }

    if (result.status === 'error') {
      throw new Error(`Error de AssemblyAI: ${result.error || 'Error desconocido'}`)
    }

    // Still processing, wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL))
  }

  throw new Error('Timeout: la transcripcion tardo mas de 5 minutos')
}
