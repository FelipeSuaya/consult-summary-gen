
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { getConsultations, updateConsultation } from "@/lib/storage";
import { groqApi } from "@/lib/api";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { ConsultationRecord } from "@/types";

interface TransformationStatus {
  total: number;
  processed: number;
  success: number;
  errors: number;
  isRunning: boolean;
}

const ConsultationTransformer = () => {
  const [status, setStatus] = useState<TransformationStatus>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    isRunning: false
  });
  const [currentConsultation, setCurrentConsultation] = useState<string>("");
  const { toast } = useToast();

  const transformConsultations = async () => {
    try {
      setStatus(prev => ({ ...prev, isRunning: true, processed: 0, success: 0, errors: 0 }));
      
      // Obtener todas las consultas
      const consultations = await getConsultations();
      console.log(`Encontradas ${consultations.length} consultas para transformar`);
      
      setStatus(prev => ({ ...prev, total: consultations.length }));

      // Obtener el prompt actualizado
      const systemPrompt = await groqApi.getSystemPrompt();
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < consultations.length; i++) {
        const consultation = consultations[i];
        setCurrentConsultation(consultation.patientName);
        
        try {
          console.log(`Transformando consulta ${i + 1}/${consultations.length}: ${consultation.patientName}`);
          
          // Solo transformar si hay transcripción disponible
          if (!consultation.transcription) {
            console.warn(`Consulta ${consultation.id} no tiene transcripción, saltando...`);
            errorCount++;
            setStatus(prev => ({ 
              ...prev, 
              processed: prev.processed + 1, 
              errors: prev.errors + 1 
            }));
            continue;
          }

          // Llamar al webhook de N8N para generar nuevo resumen
          const webhookUrl = "https://n8ndrcarlosllera.labredd.com/webhook/medical-summary";
          
          const requestBody = {
            transcription: consultation.transcription,
            patientName: consultation.patientName,
            systemPrompt: systemPrompt
          };

          console.log(`Enviando transcripción a N8N para ${consultation.patientName}`);
          
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            throw new Error(`Error del webhook N8N: ${response.status}`);
          }

          const result = await response.json();
          let newSummary = '';

          // Extraer el resumen de la respuesta
          if (result.summary) {
            newSummary = result.summary;
          } else if (result.mensaje) {
            newSummary = result.mensaje;
          } else if (typeof result === 'string') {
            newSummary = result;
          } else {
            throw new Error('No se pudo extraer el resumen de la respuesta');
          }

          // Aplicar correcciones médicas
          newSummary = groqApi.correctMedicalTerms(newSummary);

          // Extraer datos del paciente del nuevo resumen
          const patientData = groqApi.extractPatientData(newSummary);

          // Actualizar la consulta con el nuevo resumen
          const updatedConsultation: ConsultationRecord = {
            ...consultation,
            summary: newSummary,
            patientData: { ...consultation.patientData, ...patientData }
          };

          const updateError = await updateConsultation(updatedConsultation);
          
          if (updateError) {
            throw new Error(updateError);
          }

          successCount++;
          console.log(`✅ Consulta ${consultation.patientName} transformada exitosamente`);
          
        } catch (error) {
          console.error(`❌ Error transformando consulta ${consultation.patientName}:`, error);
          errorCount++;
        }

        // Actualizar progreso
        setStatus(prev => ({ 
          ...prev, 
          processed: prev.processed + 1,
          success: successCount,
          errors: errorCount
        }));

        // Pausa pequeña entre consultas para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setCurrentConsultation("");
      
      toast({
        title: "Transformación completada",
        description: `${successCount} consultas transformadas exitosamente. ${errorCount} errores.`,
        variant: successCount > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error("Error en transformación masiva:", error);
      toast({
        title: "Error en transformación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setStatus(prev => ({ ...prev, isRunning: false }));
      setCurrentConsultation("");
    }
  };

  const progressPercentage = status.total > 0 ? (status.processed / status.total) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-medical-600" />
          Transformar Consultas Existentes
        </CardTitle>
        <CardDescription>
          Convierte todas las consultas anteriores al nuevo formato SOAP mejorado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isRunning ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-medical-600" />
              <span className="text-sm text-gray-600">
                Transformando consultas... {status.processed}/{status.total}
              </span>
            </div>
            
            <Progress value={progressPercentage} className="w-full" />
            
            {currentConsultation && (
              <p className="text-sm text-gray-500">
                Procesando: <span className="font-medium">{currentConsultation}</span>
              </p>
            )}
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{status.processed}</div>
                <div className="text-sm text-blue-700">Procesadas</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{status.success}</div>
                <div className="text-sm text-green-700">Exitosas</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{status.errors}</div>
                <div className="text-sm text-red-700">Errores</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">¿Qué hace esta transformación?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Procesa todas las consultas existentes con el nuevo prompt SOAP</li>
                    <li>• Mejora la estructura visual y organización del contenido</li>
                    <li>• Mantiene toda la información médica original</li>
                    <li>• Actualiza los resúmenes para mayor legibilidad</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Importante</h4>
                  <p className="text-sm text-amber-700">
                    Este proceso puede tardar varios minutos dependiendo del número de consultas. 
                    Solo se procesarán consultas que tengan transcripción disponible.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={transformConsultations}
              className="w-full bg-medical-600 hover:bg-medical-700"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Iniciar Transformación
            </Button>
          </div>
        )}

        {status.total > 0 && !status.isRunning && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Última transformación completada</h4>
                <p className="text-sm text-green-700">
                  {status.success} consultas transformadas exitosamente de {status.total} total
                  {status.errors > 0 && ` (${status.errors} errores)`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsultationTransformer;
