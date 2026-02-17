import { useState, useRef, useCallback } from 'react'

const ASSEMBLYAI_WS_BASE = 'wss://streaming.assemblyai.com/v3/ws'
const SAMPLE_RATE = 16000
const BUFFER_INTERVAL_MS = 100
const TOKEN_REFRESH_SECONDS = 540 // Refresh at 9 min (token lasts 10 min)
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 2000
const TOKEN_FETCH_TIMEOUT_MS = 8000
const WS_CONNECT_TIMEOUT_MS = 10000
const AUDIO_CONTEXT_RESUME_TIMEOUT_MS = 3000
// AssemblyAI v3 streaming requires each WS message to be 50–1000ms of audio.
// At 16kHz 16-bit mono: 1000ms = 32,000 bytes. Use 800ms for safety margin.
const MAX_AUDIO_BYTES_PER_MESSAGE = 25600 // 800ms at 16kHz 16-bit mono

// Medical keyterms for AssemblyAI streaming (max 100 terms, max 50 chars each).
// Biases the model towards recognizing these terms accurately.
const MEDICAL_KEYTERMS = [
  // Signos vitales y mediciones
  "presion arterial", "frecuencia cardiaca", "frecuencia respiratoria",
  "saturacion de oxigeno", "temperatura corporal", "indice de masa corporal",
  "tension arterial", "presion sistolica", "presion diastolica",
  // Estudios y analisis
  "hemograma completo", "glucemia", "hemoglobina glicosilada",
  "colesterol total", "trigliceridos", "creatinina", "urea",
  "acido urico", "transaminasas", "bilirrubina",
  "electrocardiograma", "ecocardiograma", "radiografia",
  "tomografia", "resonancia magnetica", "ecografia",
  "analisis de orina", "hepatograma", "coagulograma",
  "eritrosedimentacion", "proteina C reactiva",
  // Patologias comunes
  "diabetes mellitus", "hipertension arterial", "hipotension",
  "insuficiencia cardiaca", "fibrilacion auricular",
  "hipotiroidismo", "hipertiroidismo",
  "dislipidemia", "hipercolesterolemia",
  "gastritis", "reflujo gastroesofagico",
  "infeccion urinaria", "neumonia", "bronquitis",
  "anemia ferropenica", "osteoporosis", "artrosis",
  "lumbalgia", "cervicalgia", "cefalea tensional",
  "sindrome metabolico", "enfermedad renal cronica",
  // Medicamentos frecuentes
  "metformina", "enalapril", "losartan", "atorvastatina",
  "levotiroxina", "omeprazol", "ibuprofeno", "paracetamol",
  "amoxicilina", "azitromicina", "ciprofloxacina",
  "amlodipina", "hidroclorotiazida", "aspirina",
  "clonazepam", "alprazolam", "sertralina", "fluoxetina",
  "insulina", "metoprolol", "furosemida", "espironolactona",
  // Examen fisico
  "auscultacion", "palpacion", "percusion",
  "murmullo vesicular", "ruidos cardiacos",
  "abdomen blando", "abdomen depresible",
  "edema", "cianosis", "disnea", "taquicardia", "bradicardia",
  // Terminologia clinica
  "diagnostico diferencial", "antecedentes patologicos",
  "antecedentes familiares", "motivo de consulta",
  "enfermedad actual", "examen fisico",
  "plan terapeutico", "interconsulta",
]

// AudioWorklet processor code as inline string (runs on audio thread)
const WORKLET_CODE = `
class PCM16Processor extends AudioWorkletProcessor {
  constructor() {
    super()
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const float32 = input[0]
    const int16 = new Int16Array(float32.length)
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]))
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }

    this.port.postMessage(int16.buffer, [int16.buffer])
    return true
  }
}

registerProcessor('pcm16-processor', PCM16Processor)
`

interface RealtimeTranscriptionState {
  isConnected: boolean
  isConnecting: boolean
  transcript: string
  turnText: string
  error: string | null
}

async function fetchToken(): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TOKEN_FETCH_TIMEOUT_MS)

  try {
    const res = await fetch('/api/assemblyai/token', {
      method: 'POST',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error obteniendo token de streaming')
    }
    const { token } = await res.json()
    return token
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Timeout obteniendo token de streaming')
    }
    throw error
  }
}

/** Promise.race with a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ])
}

export function useRealtimeTranscription() {
  const [state, setState] = useState<RealtimeTranscriptionState>({
    isConnected: false,
    isConnecting: false,
    transcript: '',
    turnText: '',
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const bufferRef = useRef<ArrayBuffer[]>([])
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef('')
  const turnTextRef = useRef('')
  const workletBlobUrlRef = useRef<string | null>(null)

  // Reconnection state
  const isStoppingRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stabilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isReconnectingRef = useRef(false)

  const cleanupWsOnly = useCallback(() => {
    // Only clean up WebSocket + send interval, keep audio pipeline alive
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current)
      sendIntervalRef.current = null
    }

    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current)
      tokenRefreshTimerRef.current = null
    }

    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current)
      stabilityTimerRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.onclose = null // prevent triggering reconnect
      wsRef.current.onerror = null
      wsRef.current.onmessage = null
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try { wsRef.current.send(JSON.stringify({ type: 'Terminate' })) } catch {}
      }
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    isStoppingRef.current = true
    reconnectAttemptsRef.current = 0
    isReconnectingRef.current = false
    streamRef.current = null

    cleanupWsOnly()

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    if (workletBlobUrlRef.current) {
      URL.revokeObjectURL(workletBlobUrlRef.current)
      workletBlobUrlRef.current = null
    }

    bufferRef.current = []
  }, [cleanupWsOnly])

  const sendBufferedAudio = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || bufferRef.current.length === 0) return

    const totalLength = bufferRef.current.reduce((sum, buf) => sum + buf.byteLength, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0
    for (const buf of bufferRef.current) {
      merged.set(new Uint8Array(buf), offset)
      offset += buf.byteLength
    }
    bufferRef.current = []

    // Split into chunks that respect AssemblyAI's max duration per message (50–1000ms).
    // Each ws.send() must be ≤ MAX_AUDIO_BYTES_PER_MESSAGE.
    for (let i = 0; i < merged.byteLength; i += MAX_AUDIO_BYTES_PER_MESSAGE) {
      if (ws.readyState !== WebSocket.OPEN) break
      const end = Math.min(i + MAX_AUDIO_BYTES_PER_MESSAGE, merged.byteLength)
      const chunk = merged.slice(i, end)
      ws.send(chunk.buffer)
    }
  }, [])

  const handleTurnMessage = useCallback((msg: any) => {
    const turnTranscript = msg.transcript || ''

    if (msg.end_of_turn && msg.turn_is_formatted) {
      if (turnTranscript.trim()) {
        transcriptRef.current = transcriptRef.current
          ? `${transcriptRef.current} ${turnTranscript.trim()}`
          : turnTranscript.trim()
      }
      turnTextRef.current = ''
      setState(prev => ({
        ...prev,
        transcript: transcriptRef.current,
        turnText: '',
      }))
    } else {
      turnTextRef.current = turnTranscript
      setState(prev => ({
        ...prev,
        transcript: transcriptRef.current,
        turnText: turnTranscript,
      }))
    }
  }, [])

  const connectWebSocket = useCallback(async (): Promise<void> => {
    console.log('[RT] Fetching token...')
    const token = await fetchToken()
    console.log('[RT] Token obtained, connecting WebSocket...')

    const params = new URLSearchParams({
      sample_rate: String(SAMPLE_RATE),
      encoding: 'pcm_s16le',
      speech_model: 'universal-streaming-multilingual',
      format_turns: 'true',
      token,
      keyterms_prompt: JSON.stringify(MEDICAL_KEYTERMS),
    })
    const wsUrl = `${ASSEMBLYAI_WS_BASE}?${params.toString()}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    await new Promise<void>((resolve, reject) => {
      let resolved = false
      let connectionEstablished = false
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          reject(new Error('Timeout conectando a AssemblyAI streaming'))
        }
      }, WS_CONNECT_TIMEOUT_MS)

      ws.onopen = () => {
        console.log('[RT] WebSocket open, waiting for Begin...')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'Begin') {
            console.log('[RT] Begin received, session active')
            clearTimeout(timeout)
            connectionEstablished = true
            if (!resolved) {
              resolved = true
              resolve()
            }
            return
          }

          if (msg.type === 'Turn') {
            handleTurnMessage(msg)
          }

          if (msg.type === 'Termination') {
            console.log('[RT] AssemblyAI streaming session ended')
          }
        } catch (e) {
          console.error('Error parsing AssemblyAI message:', e)
        }
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        if (!resolved) {
          resolved = true
          reject(new Error('Error en conexión WebSocket con AssemblyAI'))
        }
      }

      ws.onclose = (event) => {
        console.log(`[RT] WebSocket closed — code: ${event.code}, reason: "${event.reason}", wasClean: ${event.wasClean}`)
        clearTimeout(timeout)
        if (!resolved) {
          resolved = true
          reject(new Error(`WebSocket cerrado antes de recibir Begin (code: ${event.code}, reason: ${event.reason})`))
          return
        }
        // Only reconnect if the connection was fully established, this WS is still
        // the active one, and we haven't been told to stop
        if (connectionEstablished && wsRef.current === ws && !isStoppingRef.current) {
          console.log('[RT] Attempting reconnect...')
          setState(prev => ({ ...prev, isConnected: false, isConnecting: true }))
          attemptReconnect()
        }
      }
    })

    // Connected — schedule proactive token refresh
    scheduleTokenRefresh()

    // Reset reconnect counter only after connection is stable for 10 seconds.
    // This prevents infinite loops when WS connects (Begin) but closes immediately.
    if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current)
    stabilityTimerRef.current = setTimeout(() => {
      if (wsRef.current === ws && !isStoppingRef.current) {
        reconnectAttemptsRef.current = 0
      }
    }, 10_000)

    // Discard stale audio that accumulated during WS handshake — keep only the
    // most recent ~500ms to avoid sending a huge backlog that triggers duration violations.
    const maxBufferedBytes = SAMPLE_RATE * 2 // 500ms at 16kHz 16-bit mono = 16,000 bytes
    const totalBuffered = bufferRef.current.reduce((sum, buf) => sum + buf.byteLength, 0)
    if (totalBuffered > maxBufferedBytes) {
      let bytesToDrop = totalBuffered - maxBufferedBytes
      while (bytesToDrop > 0 && bufferRef.current.length > 0) {
        const first = bufferRef.current[0]
        if (first.byteLength <= bytesToDrop) {
          bytesToDrop -= first.byteLength
          bufferRef.current.shift()
        } else {
          break
        }
      }
    }
    // Flush retained audio immediately
    sendBufferedAudio()

    // Start/restart send interval
    if (sendIntervalRef.current) clearInterval(sendIntervalRef.current)
    sendIntervalRef.current = setInterval(sendBufferedAudio, BUFFER_INTERVAL_MS)

    setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }))
  }, [handleTurnMessage, sendBufferedAudio])

  const attemptReconnect = useCallback(async () => {
    if (isStoppingRef.current) return
    if (isReconnectingRef.current) return // prevent concurrent reconnect cycles
    // Audio pipeline must still be alive — if not, reconnecting is pointless
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      console.log('[RT] Audio pipeline dead, skipping reconnect')
      return
    }

    isReconnectingRef.current = true

    reconnectAttemptsRef.current += 1
    if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
      console.error(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`)
      isReconnectingRef.current = false
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: 'Se perdió la conexión de transcripción en vivo',
      }))
      return
    }

    console.log(`Reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`)

    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS))
    if (isStoppingRef.current) {
      isReconnectingRef.current = false
      return
    }

    try {
      cleanupWsOnly()
      await connectWebSocket()
      isReconnectingRef.current = false
    } catch (err) {
      console.warn('Reconnect failed:', err)
      isReconnectingRef.current = false
      if (!isStoppingRef.current) {
        attemptReconnect()
      }
    }
  }, [cleanupWsOnly, connectWebSocket])

  const scheduleTokenRefresh = useCallback(() => {
    if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current)

    tokenRefreshTimerRef.current = setTimeout(async () => {
      if (isStoppingRef.current) return

      console.log('Proactive token refresh — reconnecting WebSocket')
      try {
        cleanupWsOnly()
        await connectWebSocket()
      } catch (err) {
        console.warn('Proactive refresh failed:', err)
        if (!isStoppingRef.current) attemptReconnect()
      }
    }, TOKEN_REFRESH_SECONDS * 1000)
  }, [cleanupWsOnly, connectWebSocket, attemptReconnect])

  const startStreaming = useCallback(async (stream: MediaStream): Promise<void> => {
    setState(prev => ({ ...prev, isConnecting: true, error: null, transcript: '', turnText: '' }))
    transcriptRef.current = ''
    turnTextRef.current = ''
    isStoppingRef.current = false
    reconnectAttemptsRef.current = 0
    streamRef.current = stream

    try {
      // Setup AudioContext at 16kHz for automatic resampling
      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioContextRef.current = audioContext

      // CRITICAL: After an await (getUserMedia), Chrome starts AudioContext
      // in "suspended" state. The AudioWorklet silently produces no data
      // unless we explicitly resume. Add timeout to prevent hanging.
      if (audioContext.state === 'suspended') {
        console.log('[RT] AudioContext suspended, resuming...')
        await withTimeout(
          audioContext.resume(),
          AUDIO_CONTEXT_RESUME_TIMEOUT_MS,
          'Timeout resumiendo AudioContext'
        )
      }
      console.log('[RT] AudioContext state:', audioContext.state)

      // Auto-resume if browser suspends (e.g. tab hidden on mobile)
      audioContext.addEventListener('statechange', () => {
        if (audioContext.state === 'suspended' && !isStoppingRef.current) {
          console.log('[RT] AudioContext re-suspended, resuming...')
          audioContext.resume().catch(() => {})
        }
      })

      // Create worklet from inline Blob URL
      const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' })
      const blobUrl = URL.createObjectURL(blob)
      workletBlobUrlRef.current = blobUrl

      await audioContext.audioWorklet.addModule(blobUrl)

      const workletNode = new AudioWorkletNode(audioContext, 'pcm16-processor')
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        bufferRef.current.push(event.data)
      }

      const source = audioContext.createMediaStreamSource(stream)
      sourceNodeRef.current = source
      source.connect(workletNode)
      // Don't connect to destination — we only need the PCM data, not playback

      // Connect WebSocket (with auto-reconnect wired in)
      await connectWebSocket()
    } catch (error) {
      cleanup()
      const message = error instanceof Error ? error.message : 'Error desconocido en streaming'
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: message,
      }))
      throw error
    }
  }, [cleanup, connectWebSocket])

  const stopStreaming = useCallback(async (): Promise<string> => {
    isStoppingRef.current = true

    sendBufferedAudio()
    await new Promise(resolve => setTimeout(resolve, 500))

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify({ type: 'Terminate' })) } catch {}
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    let finalTranscript = transcriptRef.current
    if (turnTextRef.current.trim()) {
      finalTranscript = finalTranscript
        ? `${finalTranscript} ${turnTextRef.current.trim()}`
        : turnTextRef.current.trim()
    }

    cleanup()
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      transcript: finalTranscript,
      turnText: '',
    }))

    return finalTranscript
  }, [cleanup, sendBufferedAudio])

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    transcript: state.transcript,
    turnText: state.turnText,
    error: state.error,
    startStreaming,
    stopStreaming,
    cleanup,
  }
}
