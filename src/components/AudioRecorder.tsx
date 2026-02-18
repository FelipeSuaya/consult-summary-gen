import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2, AlertTriangle, Save, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Patient } from "@/types";
import PatientSelector from "./PatientSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoggingService } from "@/lib/logging";
import { useRealtimeTranscription } from "@/hooks/use-realtime-transcription";
import LiveTranscript from "./LiveTranscript";
import { useProcessingQueueStore } from "@/modules/consultations/stores/processing-queue-store";
import { createPatientAction } from "@/modules/patients/actions/patient-actions";

interface AudioRecorderProps {
  preselectedPatient?: Patient | null;
}

const AudioRecorder = ({ preselectedPatient }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [patientName, setPatientName] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [backupAudios, setBackupAudios] = useState<Blob[]>([]);
  const [isBackupSaving, setIsBackupSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastBackupTime, setLastBackupTime] = useState(0);
  const [transcriptionMode, setTranscriptionMode] = useState<'realtime' | 'batch'>('realtime');

  const {
    isConnected: rtConnected,
    isConnecting: rtConnecting,
    transcript: rtTranscript,
    turnText: rtTurnText,
    error: rtError,
    startStreaming,
    stopStreaming,
    cleanup: rtCleanup,
  } = useRealtimeTranscription();

  const addJob = useProcessingQueueStore((s) => s.addJob);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const backupTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaStreamCheckerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const MAX_RECORDING_TIME = 30 * 60;
  const BACKUP_INTERVAL = 30;
  const MAX_RETRY_ATTEMPTS = 3;
  const MEDIA_STREAM_CHECK_INTERVAL = 5000;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
  };

  const manualBackup = () => {
    if (!isRecording) return;
    createBackup();
  };

  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setPatientName(preselectedPatient.name);
    }
  }, [preselectedPatient]);

  useEffect(() => {
    LoggingService.info('audio-recorder', 'Componente AudioRecorder inicializado', {
      preselectedPatient: preselectedPatient ? { id: preselectedPatient.id, name: preselectedPatient.name } : null
    }).catch(err => console.error('Error al registrar inicialización:', err));

    return () => {
      cleanupResources();
      LoggingService.info('audio-recorder', 'Componente AudioRecorder desmontado')
        .catch(err => console.error('Error al registrar desmontaje:', err));
    };
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      setPatientName(selectedPatient.name);
    }
  }, [selectedPatient]);

  // Fallback to batch mode if realtime connection drops mid-recording
  useEffect(() => {
    if (rtError && isRecording && transcriptionMode === 'realtime') {
      setTranscriptionMode('batch');
      toast({
        title: "Transcripción en vivo interrumpida",
        description: "Se transcribirá al finalizar la grabación",
        variant: "default",
      });
    }
  }, [rtError, isRecording, transcriptionMode]);

  const cleanupResources = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (backupTimerRef.current) {
      clearInterval(backupTimerRef.current);
      backupTimerRef.current = null;
    }

    if (mediaStreamCheckerRef.current) {
      clearInterval(mediaStreamCheckerRef.current);
      mediaStreamCheckerRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      } catch (err) {
        console.error("Error al detener pistas de audio:", err);
        LoggingService.error('audio-recorder', 'Error al detener pistas de audio', {
          error: err instanceof Error ? err.message : String(err)
        }).catch(console.error);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error al detener mediaRecorder:", err);
      }
    }
  };

  const getSupportedMimeTypes = () => {
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/mp4;codecs=opus',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/wav;codecs=1'
    ];

    return mimeTypes.filter(mimeType => {
      try {
        return MediaRecorder.isTypeSupported(mimeType);
      } catch (e) {
        return false;
      }
    });
  };

  const getBestMimeType = (): string | null => {
    const supported = getSupportedMimeTypes();

    if (supported.length === 0) {
      console.error("No se encontraron formatos de audio compatibles");
      return null;
    }

    const webmType = supported.find(type => type.includes('webm'));
    if (webmType) return webmType;

    return supported[0];
  };

  const checkMediaStreamStatus = () => {
    if (!streamRef.current) return;

    try {
      const tracks = streamRef.current.getAudioTracks();
      if (!tracks || tracks.length === 0) {
        handleStreamError(new Error("No se detectan pistas de audio en el stream"));
        return;
      }

      const track = tracks[0];
      if (!track.enabled || !track.readyState || track.readyState === 'ended') {
        handleStreamError(new Error("La pista de audio se ha detenido o deshabilitado"));
        return;
      }
    } catch (err) {
      console.error("Error al verificar el estado del stream:", err);
      LoggingService.error('audio-recorder', 'Error al verificar estado del stream', {
        error: err instanceof Error ? err.message : String(err),
        recordingTime
      }).catch(console.error);
    }
  };

  const handleStreamError = (error: Error) => {
    console.error("Error en el stream de audio:", error);

    LoggingService.logAudioRecorderError(error, {
      recordingTime,
      retryCount,
      audioChunksCount: audioChunksRef.current.length,
      backupAudiosCount: backupAudios.length,
      lastBackupTime,
      mediaRecorderState: mediaRecorderRef.current?.state || 'no-recorder'
    }).catch(console.error);

    if (isRecording && retryCount < MAX_RETRY_ATTEMPTS) {
      attemptRecovery();
    } else if (isRecording) {
      handleRecordingFailure(error, true);
    }
  };

  const attemptRecovery = async () => {
    await LoggingService.warning('audio-recorder', `Intento de recuperación de grabación ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}`, {
      recordingTime,
      chunksBeforeRecovery: audioChunksRef.current.length,
      backupsBeforeRecovery: backupAudios.length
    });

    setRetryCount(prevCount => prevCount + 1);

    try {
      if (audioChunksRef.current.length > 0) {
        const currentAudioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        setBackupAudios(prev => [...prev, currentAudioBlob]);

        try {
          if (currentAudioBlob.size < 5 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              try {
                localStorage.setItem('audio_backup', base64data);
                localStorage.setItem('audio_backup_time', new Date().toISOString());
              } catch (e) {
                console.error("Error al guardar en localStorage:", e);
              }
            };
            reader.readAsDataURL(currentAudioBlob);
          }
        } catch (e) {
          console.error("Error al procesar backup para localStorage:", e);
        }
      }

      cleanupResources();

      toast({
        title: "Recuperando grabación",
        description: `Reintento ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}. Mantenga la ventana abierta.`,
        variant: "default"
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      startRecording(true);
    } catch (error) {
      console.error("Error al intentar recuperar la grabación:", error);
      LoggingService.error('audio-recorder', 'Error en intento de recuperación', {
        error: error instanceof Error ? error.message : String(error),
        recoveryAttempt: retryCount + 1,
        totalAttempts: MAX_RETRY_ATTEMPTS
      }).catch(console.error);

      handleRecordingFailure(error instanceof Error ? error : new Error(String(error)), true);
    }
  };

  const setupMediaRecorderErrorHandling = (mediaRecorder: MediaRecorder) => {
    mediaRecorder.onerror = (event: Event & { error?: Error }) => {
      const error = event.error || new Error("Error desconocido en la grabación");
      console.error("MediaRecorder error:", error);

      if (retryCount < MAX_RETRY_ATTEMPTS) {
        attemptRecovery();
      } else {
        handleRecordingFailure(error, false);
      }
    };
  };

  const createBackup = () => {
    if (!mediaRecorderRef.current || audioChunksRef.current.length === 0) return;

    try {
      setIsBackupSaving(true);

      const backupBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
      setBackupAudios(prev => [...prev, backupBlob]);
      setLastBackupTime(recordingTime);

      toast({
        title: "Respaldo creado",
        description: `Respaldo de ${formatTime(recordingTime)} guardado localmente`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error al crear backup:", error);
    } finally {
      setIsBackupSaving(false);
    }
  };

  const setupBackupTimer = () => {
    if (backupTimerRef.current) {
      clearInterval(backupTimerRef.current);
    }

    backupTimerRef.current = window.setInterval(() => {
      if (recordingTime % BACKUP_INTERVAL === 0 && recordingTime > lastBackupTime) {
        createBackup();
      }
    }, 1000);
  };

  const requestMicrophonePermission = async (): Promise<MediaStream> => {
    try {
      await LoggingService.info('audio-recorder', 'Solicitando permisos de micrófono');

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      await LoggingService.info('audio-recorder', 'Permisos de micrófono concedidos', {
        tracks: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings()
      });

      setHasPermission(true);
      return stream;
    } catch (error) {
      setHasPermission(false);
      console.error("Error al solicitar permisos de micrófono:", error);

      await LoggingService.error('audio-recorder', 'Error al solicitar permisos de micrófono', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  };

  const startRecording = async (isRetry = false) => {
    setRecordingError(null);

    if (!patientName.trim()) {
      toast({
        title: "Nombre del paciente requerido",
        description: "Por favor ingrese el nombre del paciente antes de grabar",
        variant: "destructive",
      });
      return;
    }

    if (!isRetry) {
      setRetryCount(0);
      setBackupAudios([]);
      setLastBackupTime(0);
    }

    try {
      const stream = await requestMicrophonePermission();
      streamRef.current = stream;

      const mimeType = getBestMimeType();
      if (!mimeType) {
        throw new Error("No se encontró un formato de audio compatible con este dispositivo");
      }

      const options: MediaRecorderOptions = {
        mimeType: mimeType
      };

      try {
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        if (!isRetry) {
          audioChunksRef.current = [];
        }

        setupMediaRecorderErrorHandling(mediaRecorder);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (recordingError && !isRetry) {
            console.log("Recording stopped due to an error");
          }
        };

        mediaRecorder.start(500);
        setIsRecording(true);

        const shouldStream = !isRetry;
        if (!isRetry) {
          setRecordingTime(0);
          setTranscriptionMode('realtime');
        }

        setupRecordingTimer();
        setupBackupTimer();

        if (mediaStreamCheckerRef.current) {
          clearInterval(mediaStreamCheckerRef.current);
        }
        mediaStreamCheckerRef.current = window.setInterval(checkMediaStreamStatus, MEDIA_STREAM_CHECK_INTERVAL);

        if (shouldStream) {
          startStreaming(stream).catch((err) => {
            console.warn('Real-time streaming failed, falling back to batch:', err);
            setTranscriptionMode('batch');
            toast({
              title: "Transcripción en vivo no disponible",
              description: "Se transcribirá al finalizar la grabación",
              variant: "default",
            });
          });
        }

        toast({
          title: "Grabación Iniciada",
          description: isRetry ? "Se ha reanudado la grabación" : "La consulta está siendo grabada",
        });
      } catch (mimeError) {
        console.error("Error al inicializar el MediaRecorder con el formato seleccionado:", mimeError);
        throw new Error(`Formato de audio no compatible: ${mimeType}. Por favor intente con otro navegador.`);
      }
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      setRecordingError(`Error al acceder al micrófono: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast({
        title: "Error de Micrófono",
        description: `No se pudo acceder al micrófono. ${error instanceof Error ? error.message : 'Por favor verifique los permisos.'}`,
        variant: "destructive",
      });
    }
  };

  const setupRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        if (prev + 1 >= MAX_RECORDING_TIME) {
          stopRecording();
          toast({
            title: "Límite de Tiempo Alcanzado",
            description: "Se ha alcanzado el límite máximo de grabación de 30 minutos.",
            variant: "default"
          });
          return prev;
        }
        return prev + 1;
      });

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
        console.warn("MediaRecorder is no longer recording");

        if (retryCount < MAX_RETRY_ATTEMPTS) {
          attemptRecovery();
        } else {
          handleRecordingFailure(new Error("La grabación se detuvo inesperadamente"), false);
        }
      }
    }, 1000);
  };

  const enqueueAudioForProcessing = (audioBlob: Blob, overrides?: { patientId?: string; isNewPatient?: boolean }) => {
    addJob({
      id: crypto.randomUUID(),
      patientName: patientName.trim(),
      patientId: overrides?.patientId ?? selectedPatient?.id,
      isNewPatient: overrides?.isNewPatient,
      audioBlob,
      realtimeTranscript: rtTranscript || undefined,
      dateTime: new Date().toISOString(),
    });
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        LoggingService.info('audio-recorder', 'Deteniendo grabación', {
          recordingTime,
          chunksCollected: audioChunksRef.current.length,
          backupsCreated: backupAudios.length,
          mediaRecorderState: mediaRecorderRef.current.state,
        }).catch(console.error);

        // Stop MediaRecorder to collect final chunks
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }

        setIsRecording(false);

        // Stop realtime streaming
        if (rtConnected) {
          stopStreaming().catch(() => {});
        } else {
          rtCleanup();
        }

        cleanupResources();

        // Auto-create patient if none selected
        let overrides: { patientId?: string; isNewPatient?: boolean } | undefined;
        if (!selectedPatient && patientName.trim()) {
          try {
            const result = await createPatientAction({ name: patientName.trim() });
            if (result.id) {
              overrides = { patientId: result.id, isNewPatient: true };
            }
          } catch (err) {
            console.error('Error auto-creating patient:', err);
            // Continue without linking — consultation will still save with patient_name
          }
        }

        // Build audio blob and enqueue for background processing
        const allChunks = [...audioChunksRef.current];
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = allChunks.length > 0
          ? new Blob(allChunks, { type: mimeType })
          : null;

        if (audioBlob && audioBlob.size > 0) {
          enqueueAudioForProcessing(audioBlob, overrides);

          toast({
            title: "Grabación detenida",
            description: "Procesando en segundo plano",
          });

          resetRecorder();
        } else {
          setRecordingError("No se registraron datos de audio");
          toast({
            title: "Error",
            description: "No se registraron datos de audio",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error al detener la grabación:", error);
        LoggingService.error('audio-recorder', 'Error al detener grabación', {
          error: error instanceof Error ? error.message : String(error),
          recordingTime,
          mediaRecorderState: mediaRecorderRef.current?.state || 'unknown'
        }).catch(console.error);

        handleRecordingFailure(error instanceof Error ? error : new Error(String(error)), true);
      }
    }
  };

  const handleRecordingFailure = (error: Error, tryUseBackup: boolean) => {
    console.error("Fallo en la grabación:", error);
    setRecordingError(`Error en la grabación: ${error.message}`);

    cleanupResources();
    setIsRecording(false);

    if (tryUseBackup && backupAudios.length > 0) {
      // Enqueue backup audio for background processing
      const combinedBlob = new Blob(backupAudios, { type: backupAudios[0].type });
      if (combinedBlob.size > 0) {
        enqueueAudioForProcessing(combinedBlob);
        toast({
          title: "Recuperando grabación",
          description: "Procesando respaldo en segundo plano",
        });
        resetRecorder();
      }
    } else {
      toast({
        title: "Error de Grabación",
        description: error.message || "La grabación se detuvo inesperadamente. Por favor intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!patientName.trim()) {
      toast({
        title: "Nombre del paciente requerido",
        description: "Por favor ingrese el nombre del paciente antes de subir audio",
        variant: "destructive",
      });
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Auto-create patient if none selected
    let overrides: { patientId?: string; isNewPatient?: boolean } | undefined;
    if (!selectedPatient && patientName.trim()) {
      try {
        const result = await createPatientAction({ name: patientName.trim() });
        if (result.id) {
          overrides = { patientId: result.id, isNewPatient: true };
        }
      } catch (err) {
        console.error('Error auto-creating patient:', err);
      }
    }

    enqueueAudioForProcessing(file, overrides);

    toast({
      title: "Audio subido",
      description: "Procesando en segundo plano",
    });

    resetRecorder();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetRecorder = () => {
    setPatientName("");
    setSelectedPatient(null);
    setRecordingError(null);
    setBackupAudios([]);
    setTranscriptionMode('realtime');
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Nombre del Paciente</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="patientName"
                placeholder="Ingrese el nombre del paciente"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={isRecording}
                className="w-full"
              />
              <Button
                variant="outline"
                onClick={() => setShowPatientSelector(!showPatientSelector)}
                disabled={isRecording}
              >
                {selectedPatient ? "Cambiar" : "Buscar"}
              </Button>
            </div>
          </div>

          {showPatientSelector && (
            <div className="mt-2 border border-border rounded-md p-4 bg-secondary">
              <PatientSelector
                onPatientSelect={handlePatientSelect}
                selectedPatientId={selectedPatient?.id}
                initialPatientName={patientName}
              />
            </div>
          )}

          {recordingError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error en la grabación</AlertTitle>
              <AlertDescription>{recordingError}</AlertDescription>
            </Alert>
          )}

          {isRecording && (
            <div className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse-recording"></div>
                  <span className="text-red-400 font-medium">Grabando: {formatTime(recordingTime)}</span>
                </div>
                <LiveTranscript
                  transcript={rtTranscript}
                  turnText={rtTurnText}
                  isConnected={rtConnected}
                  isConnecting={rtConnecting}
                  error={rtError}
                />
                {backupAudios.length > 0 && (
                  <div className="text-xs text-green-400 text-center">
                    {backupAudios.length} respaldos guardados
                  </div>
                )}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={manualBackup}
                    disabled={isBackupSaving}
                    className="text-xs"
                  >
                    {isBackupSaving ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1 h-3 w-3" />
                        Crear respaldo manual
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="waveform mt-2"></div>
            </div>
          )}

          <div className="flex justify-center gap-3 pt-4">
            {isRecording ? (
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Square className="mr-2 h-4 w-4" />
                Detener Grabación
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => startRecording(false)}
                  variant="default"
                  size="lg"
                  disabled={!patientName.trim()}
                  className="flex-1 sm:flex-initial"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Iniciar Grabación
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={!patientName.trim()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Audio
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
