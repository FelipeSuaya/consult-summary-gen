import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2, AlertTriangle, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { groqApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveConsultation } from "@/lib/storage";
import { ConsultationRecord, Patient } from "@/types";
import PatientSelector from "./PatientSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sendToWebhook } from "@/lib/webhooks";
import { LoggingService } from "@/lib/logging";

interface AudioRecorderProps {
  onRecordingComplete: (consultation: ConsultationRecord) => void;
  preselectedPatient?: Patient | null;
}

const AudioRecorder = ({ onRecordingComplete, preselectedPatient }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [patientName, setPatientName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [backupAudios, setBackupAudios] = useState<Blob[]>([]);
  const [isBackupSaving, setIsBackupSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastBackupTime, setLastBackupTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const backupTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaStreamCheckerRef = useRef<number | null>(null);
  const { toast } = useToast();

  const MAX_RECORDING_TIME = 30 * 60; // 30 minutos en segundos
  const BACKUP_INTERVAL = 30; // Guardar segmentos cada 30 segundos
  const MAX_RETRY_ATTEMPTS = 3; // Máximo número de reintentos
  const MEDIA_STREAM_CHECK_INTERVAL = 5000; // Verificar el estado del stream cada 5 segundos

  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setPatientName(preselectedPatient.name);
    }
  }, [preselectedPatient]);

  useEffect(() => {
    // Log when component mounts
    LoggingService.info('audio-recorder', 'Componente AudioRecorder inicializado', {
      preselectedPatient: preselectedPatient ? { id: preselectedPatient.id, name: preselectedPatient.name } : null
    }).catch(err => console.error('Error al registrar inicialización:', err));

    return () => {
      cleanupResources();
      // Log when component unmounts
      LoggingService.info('audio-recorder', 'Componente AudioRecorder desmontado')
        .catch(err => console.error('Error al registrar desmontaje:', err));
    };
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      setPatientName(selectedPatient.name);
    }
  }, [selectedPatient]);

  // Limpieza de recursos
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
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`Pista de audio detenida. Estado: ${track.readyState}`);
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
    // Tipos de MIME comunes para audio
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

    // Verificar cuál es soportado
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
    console.log("Formatos de audio compatibles:", supported);
    
    if (supported.length === 0) {
      console.error("No se encontraron formatos de audio compatibles");
      return null;
    }
    
    // Preferir webm si está disponible
    const webmType = supported.find(type => type.includes('webm'));
    if (webmType) return webmType;
    
    // De lo contrario, usar el primer formato compatible
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
      
      console.log("Estado del stream de audio:", track.readyState, "Habilitado:", track.enabled);
      
      // Verificar si hay sonido detectado
      if (mediaRecorderRef.current && typeof (mediaRecorderRef.current as any).getAudioLevels === 'function') {
        const audioLevel = (mediaRecorderRef.current as any).getAudioLevels();
        if (audioLevel < 0.01) {  // umbral muy bajo
          console.warn("Nivel de audio muy bajo, posible problema con el micrófono");
          LoggingService.warning('audio-recorder', 'Nivel de audio muy bajo', {
            audioLevel,
            recordingTime,
            mediaRecorderState: mediaRecorderRef.current.state
          }).catch(console.error);
        }
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
    
    // Log the error to Supabase
    LoggingService.logAudioRecorderError(error, {
      recordingTime,
      retryCount,
      audioChunksCount: audioChunksRef.current.length,
      backupAudiosCount: backupAudios.length,
      lastBackupTime,
      mediaRecorderState: mediaRecorderRef.current?.state || 'no-recorder'
    }).catch(console.error);
    
    // Si todavía estamos grabando, intentar recuperarnos
    if (isRecording && retryCount < MAX_RETRY_ATTEMPTS) {
      attemptRecovery();
    } else if (isRecording) {
      // Si ya agotamos los reintentos, guardar lo que tengamos
      handleRecordingFailure(error, true);
    }
  };

  const attemptRecovery = async () => {
    // Log recovery attempt
    await LoggingService.warning('audio-recorder', `Intento de recuperación de grabación ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}`, {
      recordingTime,
      chunksBeforeRecovery: audioChunksRef.current.length,
      backupsBeforeRecovery: backupAudios.length
    });
    
    setRetryCount(prevCount => prevCount + 1);
    
    try {
      // Guardar los chunks actuales antes de reintentar
      if (audioChunksRef.current.length > 0) {
        const currentAudioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        setBackupAudios(prev => [...prev, currentAudioBlob]);
        
        // También intentamos guardar un backup en localStorage por si el navegador se cierra
        try {
          // Solo guardaremos el último backup y solo si es pequeño
          if (currentAudioBlob.size < 5 * 1024 * 1024) { // límite de 5MB
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              try {
                localStorage.setItem('audio_backup', base64data);
                localStorage.setItem('audio_backup_time', new Date().toISOString());
                console.log("Backup guardado en localStorage");
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
      
      // Limpiar y reiniciar la grabación
      cleanupResources();
      
      toast({
        title: "Recuperando grabación",
        description: `Reintento ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}. Mantenga la ventana abierta.`,
        variant: "default"
      });
      
      // Pequeña pausa antes de reintentar
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
      
      // Solo manejamos el error aquí si no estamos intentando una recuperación
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
      console.log("Creando backup de seguridad...");
      setIsBackupSaving(true);
      
      // Crear un blob con los datos actuales para backup
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
      // Log permission request
      await LoggingService.info('audio-recorder', 'Solicitando permisos de micrófono');
      
      const constraints = { 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Intentar con una configuración más compatible
          sampleRate: 44100,
          channelCount: 1
        } 
      };
      
      console.log("Solicitando acceso al micrófono con constraints:", JSON.stringify(constraints));
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Log successful permission
      await LoggingService.info('audio-recorder', 'Permisos de micrófono concedidos', {
        tracks: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings()
      });
      
      setHasPermission(true);
      return stream;
    } catch (error) {
      setHasPermission(false);
      console.error("Error al solicitar permisos de micrófono:", error);
      
      // Log permission error
      await LoggingService.error('audio-recorder', 'Error al solicitar permisos de micrófono', {
        error: error instanceof Error ? error.message : String(error),
        constraintsUsed: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
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

    // Si no es un reintento, reiniciamos el contador
    if (!isRetry) {
      setRetryCount(0);
      setBackupAudios([]);
      setLastBackupTime(0);
    }

    try {
      const stream = await requestMicrophonePermission();
      streamRef.current = stream;
      
      // Determinar el formato MIME compatible
      const mimeType = getBestMimeType();
      if (!mimeType) {
        throw new Error("No se encontró un formato de audio compatible con este dispositivo");
      }
      
      console.log(`Usando formato de audio: ${mimeType}`);
      
      // Configuración de opciones para MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: mimeType
      };
      
      try {
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        
        // Si es un reintento, mantenemos los chunks anteriores
        if (!isRetry) {
          audioChunksRef.current = [];
        }
        
        setupMediaRecorderErrorHandling(mediaRecorder);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            console.log(`Chunk collected: ${event.data.size} bytes. Total chunks: ${audioChunksRef.current.length}`);
          }
        };
        
        mediaRecorder.onstop = async () => {
          if (recordingError && !isRetry) {
            console.log("Recording stopped due to an error");
            return;
          }
          
          try {
            await finalizeRecording();
          } catch (error) {
            console.error("Error finalizando grabación:", error);
            handleRecordingFailure(error instanceof Error ? error : new Error(String(error)), true);
          }
        };
        
        // Comenzar la grabación pidiendo chunks cada 500ms para tener fragmentos más pequeños
        // y reducir la pérdida de datos en caso de error
        mediaRecorder.start(500);
        setIsRecording(true);
        
        // Solo reiniciamos el tiempo si no es un reintento
        if (!isRetry) {
          setRecordingTime(0);
        }
        
        // Configurar el timer para actualizar el tiempo
        setupRecordingTimer();
        
        // Configurar timer de backup
        setupBackupTimer();
        
        // Configurar verificación periódica del stream
        if (mediaStreamCheckerRef.current) {
          clearInterval(mediaStreamCheckerRef.current);
        }
        mediaStreamCheckerRef.current = window.setInterval(checkMediaStreamStatus, MEDIA_STREAM_CHECK_INTERVAL);
        
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
        
        // Intentar recuperar si estamos por debajo del límite de intentos
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          console.log("Intentando recuperar grabación interrumpida...");
          attemptRecovery();
        } else {
          handleRecordingFailure(new Error("La grabación se detuvo inesperadamente"), false);
        }
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Log stopping recording
        LoggingService.info('audio-recorder', 'Deteniendo grabación manualmente', {
          recordingTime,
          chunksCollected: audioChunksRef.current.length,
          backupsCreated: backupAudios.length,
          mediaRecorderState: mediaRecorderRef.current.state
        }).catch(console.error);
        
        // ... keep existing code (stopping recording)
        
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        
        setIsRecording(false);
        cleanupResources();
        
        toast({
          title: "Grabación Detenida",
          description: "Procesando su consulta...",
        });
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
    
    // Detener timers y recursos
    cleanupResources();
    setIsRecording(false);
    
    // Si tenemos backups y debemos intentar usarlos
    if (tryUseBackup && backupAudios.length > 0) {
      toast({
        title: "Recuperando grabación",
        description: "Intentando recuperar datos desde la copia de seguridad",
      });
      
      // Intentar usar el backup más reciente
      processBackupRecording();
    } else {
      toast({
        title: "Error de Grabación",
        description: error.message || "La grabación se detuvo inesperadamente. Por favor intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const finalizeRecording = async () => {
    // Combinamos todos los chunks de audio (incluyendo backups si es necesario)
    const allChunks = [...audioChunksRef.current];
    
    if (allChunks.length === 0) {
      throw new Error("No se registraron datos de audio. Verifique que su micrófono está funcionando correctamente.");
    }
    
    // Crear el blob final con el tipo MIME adecuado
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(allChunks, { type: mimeType });
    
    if (audioBlob.size === 0) {
      throw new Error("El archivo de audio está vacío");
    }
    
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    
    await processRecording(audioBlob);
  };

  const processBackupRecording = async () => {
    if (backupAudios.length === 0) {
      toast({
        title: "Sin datos de respaldo",
        description: "No hay datos de respaldo disponibles para recuperar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Combinar todos los blobs de backup
      const combinedBlob = new Blob(backupAudios, { type: backupAudios[0].type });
      
      if (combinedBlob.size === 0) {
        throw new Error("Los datos de respaldo están vacíos");
      }
      
      const url = URL.createObjectURL(combinedBlob);
      setAudioUrl(url);
      
      toast({
        title: "Usando datos de respaldo",
        description: `Procesando ${backupAudios.length} segmentos de respaldo`,
      });
      
      await processRecording(combinedBlob);
    } catch (error) {
      console.error("Error al procesar respaldo:", error);
      toast({
        title: "Error en el respaldo",
        description: `No se pudo procesar el audio de respaldo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("El archivo de audio está vacío");
      }
      
      console.log("Processing audio blob:", {
        size: audioBlob.size,
        type: audioBlob.type,
        patientName,
        selectedPatientId: selectedPatient?.id
      });
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64WithoutPrefix = base64String.split(',')[1];
          resolve(base64WithoutPrefix);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      const webhookResponse = await sendToWebhook({
        audio_url: audioUrl || "",
        audio_base64: base64Audio,
        transcripcion: "",
        resumen: ""
      });
      
      if (!webhookResponse.success) {
        if (webhookResponse.pending) {
          toast({
            title: "Procesamiento en curso",
            description: webhookResponse.message || "El audio se está procesando en segundo plano, puede tomar unos minutos.",
            variant: "default",
            duration: 10000,
          });
          
          // Aún consideramos esto un éxito ya que se está procesando
          const consultationId = crypto.randomUUID();
          
          const pendingConsultation: ConsultationRecord = {
            id: consultationId,
            patientName: patientName.trim(),
            dateTime: new Date().toISOString(),
            audioUrl: audioUrl || undefined,
            transcription: "Procesando transcripción...",
            summary: "Procesando resumen...",
            patientData: {},
            patientId: selectedPatient?.id,
            status: "processing"
          };
          
          // Guardamos la consulta como "en proceso"
          const saveError = await saveConsultation(pendingConsultation);
          
          if (saveError) {
            console.error("Error guardando consulta en proceso:", saveError);
          } else {
            onRecordingComplete(pendingConsultation);
          }
          
          setPatientName("");
          setAudioUrl(null);
          setSelectedPatient(null);
          setRecordingError(null);
          setBackupAudios([]);
          return;
        }
        
        throw new Error(webhookResponse.error || "Error en el procesamiento del audio");
      }
      
      const { transcripcion, resumen } = webhookResponse.data;
      console.log("Webhook response processed:", { transcripcion, resumen });
      
      const patientData = groqApi.extractPatientData(resumen);
      
      const consultationId = crypto.randomUUID();
      
      const newConsultation: ConsultationRecord = {
        id: consultationId,
        patientName: patientName.trim(),
        dateTime: new Date().toISOString(),
        audioUrl: audioUrl || undefined,
        transcription: transcripcion,
        summary: resumen,
        patientData,
        patientId: selectedPatient?.id,
        status: "completed"
      };
      
      const saveError = await saveConsultation(newConsultation);
      
      if (saveError) {
        throw new Error(saveError);
      }
      
      console.log("Consultation saved successfully:", consultationId);
      
      onRecordingComplete(newConsultation);
      
      toast({
        title: "Consulta Procesada",
        description: "La transcripción y el resumen están listos",
      });
      
      setPatientName("");
      setAudioUrl(null);
      setSelectedPatient(null);
      setRecordingError(null);
      setBackupAudios([]);
    } catch (error) {
      console.error("Error de procesamiento:", error);
      setRecordingError(`Error de procesamiento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast({
        title: "Error de Procesamiento",
        description: error instanceof Error ? error.message : "No se pudo procesar la grabación",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
  };

  const manualBackup = () => {
    if (isRecording && !isBackupSaving) {
      createBackup();
    }
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
                disabled={isRecording || isProcessing}
                className="w-full"
              />
              <Button 
                variant="outline" 
                onClick={() => setShowPatientSelector(!showPatientSelector)}
                disabled={isRecording || isProcessing}
              >
                {selectedPatient ? "Cambiar" : "Buscar"}
              </Button>
            </div>
          </div>
          
          {showPatientSelector && (
            <div className="mt-2 border rounded-md p-4 bg-gray-50">
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
          
          {(isRecording || isProcessing) && (
            <div className="mt-4">
              {isRecording ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse-recording"></div>
                    <span className="text-red-600 font-medium">Grabando: {formatTime(recordingTime)}</span>
                  </div>
                  {backupAudios.length > 0 && (
                    <div className="text-xs text-green-600 text-center">
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
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-medical-600" />
                  <span className="text-medical-600 font-medium">Procesando consulta...</span>
                </div>
              )}
              <div className="waveform mt-2"></div>
            </div>
          )}
          
          <div className="flex justify-center pt-4">
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
              <Button 
                onClick={() => startRecording(false)} 
                variant="default"
                size="lg"
                disabled={isProcessing || !patientName.trim()}
                className="w-full sm:w-auto bg-medical-600 hover:bg-medical-700"
              >
                <Mic className="mr-2 h-4 w-4" />
                Iniciar Grabación
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
