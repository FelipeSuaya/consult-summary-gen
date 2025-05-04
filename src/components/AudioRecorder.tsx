
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { groqApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveConsultation } from "@/lib/storage";
import { ConsultationRecord, Patient } from "@/types";
import PatientSelector from "./PatientSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sendToWebhook } from "@/lib/webhooks";

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const MAX_RECORDING_TIME = 30 * 60; // 30 minutes in seconds

  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setPatientName(preselectedPatient.name);
    }
  }, [preselectedPatient]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (selectedPatient) {
      setPatientName(selectedPatient.name);
    }
  }, [selectedPatient]);

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

  const setupMediaRecorderErrorHandling = (mediaRecorder: MediaRecorder) => {
    mediaRecorder.onerror = (event: Event & { error?: Error }) => {
      const error = event.error || new Error("Error desconocido en la grabación");
      console.error("MediaRecorder error:", error);
      setRecordingError(`Error en la grabación: ${error.message}`);
      
      toast({
        title: "Error de Grabación",
        description: `Se ha producido un error durante la grabación: ${error.message}`,
        variant: "destructive",
      });
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
      
      try {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } catch (stopError) {
        console.error("Error stopping media recorder:", stopError);
      }
    };
  };

  const startRecording = async () => {
    setRecordingError(null);
    
    if (!patientName.trim()) {
      toast({
        title: "Nombre del paciente requerido",
        description: "Por favor ingrese el nombre del paciente antes de grabar",
        variant: "destructive",
      });
      return;
    }

    if (!groqApi.hasApiKey()) {
      toast({
        title: "API Key Requerida",
        description: "Por favor configure la API key de Groq primero",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        audioChunksRef.current = [];
        
        setupMediaRecorderErrorHandling(mediaRecorder);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            console.log(`Chunk collected: ${event.data.size} bytes. Total chunks: ${audioChunksRef.current.length}`);
          }
        };
        
        mediaRecorder.onstop = async () => {
          if (recordingError) {
            console.log("Recording stopped due to an error");
            return;
          }
          
          if (audioChunksRef.current.length === 0) {
            setRecordingError("No se registraron datos de audio. Verifique que su micrófono está funcionando correctamente.");
            toast({
              title: "Error de Grabación",
              description: "No se registraron datos de audio. Verifique que su micrófono está funcionando correctamente.",
              variant: "destructive",
            });
            return;
          }
          
          try {
            // Usar el mismo tipo MIME para el Blob que se usó para grabar
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            console.log(`Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
            
            if (audioBlob.size === 0) {
              throw new Error("El archivo de audio está vacío");
            }
            
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            
            await processRecording(audioBlob);
          } catch (error) {
            console.error("Error processing recording:", error);
            setRecordingError(`Error al procesar la grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            toast({
              title: "Error de Procesamiento",
              description: `Error al procesar la grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              variant: "destructive",
            });
          }
        };
        
        mediaRecorder.start(1000);
        setIsRecording(true);
        setRecordingTime(0);
        
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
            setRecordingError("La grabación se detuvo inesperadamente. Por favor intente nuevamente.");
            
            toast({
              title: "Error de Grabación",
              description: "La grabación se detuvo inesperadamente. Por favor intente nuevamente.",
              variant: "destructive",
            });
            
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setIsRecording(false);
          }
        }, 1000);
        
        toast({
          title: "Grabación Iniciada",
          description: "La consulta está siendo grabada",
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        toast({
          title: "Grabación Detenida",
          description: "Procesando su consulta...",
        });
      } catch (error) {
        console.error("Error al detener la grabación:", error);
        setRecordingError(`Error al detener la grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        toast({
          title: "Error al Detener",
          description: `No se pudo detener la grabación correctamente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          variant: "destructive",
        });
      }
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
        patientId: selectedPatient?.id
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
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse-recording"></div>
                  <span className="text-red-600 font-medium">Grabando: {formatTime(recordingTime)}</span>
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
                onClick={startRecording} 
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
