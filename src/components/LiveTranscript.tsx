import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LiveTranscriptProps {
  transcript: string
  turnText: string
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

function LiveTranscript({ transcript, turnText, isConnected, isConnecting, error }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, turnText])

  const hasText = transcript || turnText

  return (
    <div className="w-full space-y-2">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`h-2 w-2 rounded-full ${
            error
              ? 'bg-red-500'
              : isConnected
                ? 'bg-green-500'
                : isConnecting
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-400'
          }`}
        />
        <span className="text-muted-foreground">
          {error
            ? 'Error en transcripción'
            : isConnected
              ? 'Transcribiendo en vivo'
              : isConnecting
                ? 'Conectando...'
                : 'Desconectado'}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}. Se usará transcripción por lotes al finalizar.
        </div>
      )}

      {/* Transcript area */}
      <ScrollArea className="h-32 w-full rounded-md border bg-gray-50 p-3">
        <div className="text-sm leading-relaxed">
          {hasText ? (
            <>
              {transcript && <span>{transcript}</span>}
              {turnText && (
                <span className="text-gray-400 italic">
                  {transcript ? ' ' : ''}{turnText}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 italic">
              {isConnected
                ? 'Esperando audio...'
                : isConnecting
                  ? 'Conectando al servicio de transcripción...'
                  : 'La transcripción aparecerá aquí'}
            </span>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}

export default LiveTranscript
