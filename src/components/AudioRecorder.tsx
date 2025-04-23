
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

      // Clean up media stream when component unmounts
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

  const setupMediaRecorderErrorHandling = (mediaRecorder: MediaRecorder) => {
    mediaRecorder.onerror = (event: Event & { error?: Error }) => {
      // Use the specific error from the event
      const error = event.error || new Error("Error desconocido en la grabación");
      console.error("MediaRecorder error:", error);
      setRecordingError(`Error en la grabación: ${error.message}`);
      
      toast({
        title: "Error de Grabación",
        description: `Se ha producido un error durante la grabación: ${error.message}`,
        variant: "destructive",
      });
      
      // Clean up recording state
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
      
      // Try to stop the recorder if it's active
      try {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } catch (stopError) {
        console.error("Error stopping media recorder:", stopError);
      }
    };
  };

  // Helper function to get the best supported audio format
  const getBestSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`Using supported audio mime type: ${type}`);
        return type;
      }
    }
    
    console.warn("No preferred mime types supported, using default");
    return '';  // Let the browser choose the default
  };

  const startRecording = async () => {
    setRecordingError(null);
    setAudioChunksEmpty();
    
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
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;
      
      const mimeType = getBestSupportedMimeType();
      console.log(`Creating MediaRecorder with mime type: ${mimeType || 'default'}`);
      
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, {mimeType})
        : new MediaRecorder(stream);
        
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      setupMediaRecorderErrorHandling(mediaRecorder);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Monitor data collection
          console.log(`Chunk collected: ${event.data.size} bytes. Total chunks: ${audioChunksRef.current.length}`);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (recordingError) {
          console.log("Recording stopped due to an error");
          return; // Don't process if there was an error
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
          console.log(`Creating audio blob from ${audioChunksRef.current.length} chunks`);
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          console.log(`Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
          
          if (audioBlob.size === 0) {
            throw new Error("El archivo de audio está vacío");
          }
          
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            console.log("Audio tracks stopped");
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
      
      // Start with more frequent data collection for better reliability
      mediaRecorder.start(500); // Collect data every 500ms
      console.log("Recording started successfully");
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev + 1 >= MAX_RECORDING_TIME) {
            stopRecording(); // Automatically stop recording at max time
            toast({
              title: "Límite de Tiempo Alcanzado",
              description: "Se ha alcanzado el límite máximo de grabación de 30 minutos.",
              variant: "default"
            });
            return prev;
          }
          return prev + 1;
        });
        
        // Check that recorder is still active
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

  // Function to clear audio chunks
  const setAudioChunksEmpty = () => {
    if (audioChunksRef.current) {
      audioChunksRef.current = [];
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        console.log("Stopping recording...");
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
      
      const transcriptionResponse = await groqApi.transcribeAudio(audioBlob);
      
      if (!transcriptionResponse.success) {
        throw new Error(transcriptionResponse.error || "La transcripción falló");
      }
      
      const transcription = transcriptionResponse.data.text;
      console.log("Transcription completed successfully, length:", transcription.length);
      
      const summaryResponse = await groqApi.generateSummary(transcription);
      
      if (!summaryResponse.success) {
        throw new Error(summaryResponse.error || "La generación del resumen falló");
      }
      
      const summary = summaryResponse.data.choices[0].message.content;
      console.log("Summary generated successfully, length:", summary.length);
      
      const patientData = groqApi.extractPatientData(summary);
      
      console.log("Creating consultation with patient info:", {
        patientName: patientName.trim(),
        patientId: selectedPatient?.id || "NO_PATIENT_SELECTED"
      });
      
      const consultationId = crypto.randomUUID();
      
      const newConsultation: ConsultationRecord = {
        id: consultationId,
        patientName: patientName.trim(),
        dateTime: new Date().toISOString(),
        audioUrl: audioUrl || undefined,
        transcription,
        summary,
        patientData,
        patientId: selectedPatient?.id
      };
      
      console.log("Saving consultation with data:", {
        id: newConsultation.id,
        patientName: newConsultation.patientName,
        hasPatientId: !!newConsultation.patientId,
        audioUrlType: typeof newConsultation.audioUrl
      });
      
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
