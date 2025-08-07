import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bot, User, Settings, Trash2, Send, Loader2, Database, AlertCircle } from "lucide-react";
import { sendMedicalAnalyticsQuery } from "@/lib/medicalAnalytics";
import MarkdownRenderer from "./MarkdownRenderer";

interface MedicalAnalyticsChatProps {
  selectedPatientId: string | null;
  consultations: any[];
  symptomsData: any[];
  diagnosisData: any[];
  chartData: any[];
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "¿Cuántas veces vino por dolor de cabeza en los últimos 6 meses?",
  "¿Qué patrones de síntomas detectas en este paciente?",
  "¿Hay correlación entre diagnósticos y época del año?",
  "Resumen del historial clínico completo de este paciente",
  "¿Cuál es el síntoma más frecuente y su evolución temporal?",
  "¿Hay tendencias preocupantes en los diagnósticos recientes?",
  "¿Qué recomendaciones darías basado en el historial médico?",
  "¿Cuándo fue la última vez que presentó este síntoma específico?"
];

const MedicalAnalyticsChat = ({ 
  selectedPatientId, 
  consultations, 
  symptomsData, 
  diagnosisData, 
  chartData 
}: MedicalAnalyticsChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    localStorage.getItem('n8n_webhook_url') || "https://n8nwebhook.botec.tech/webhook/lovable-bot"
  );
  const [showSettings, setShowSettings] = useState(false);

  const handleSaveWebhookUrl = () => {
    localStorage.setItem('n8n_webhook_url', webhookUrl);
    setShowSettings(false);
  };

  const addMessage = (type: 'user' | 'bot', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const validateDataSufficiency = () => {
    if (!selectedPatientId) {
      addMessage('bot', '⚠️ Por favor selecciona un paciente para analizar su historial médico.');
      return false;
    }

    if (!webhookUrl.trim()) {
      addMessage('bot', '⚠️ Por favor configura la URL del webhook de N8N en los ajustes.');
      return false;
    }

    if (consultations.length === 0) {
      addMessage('bot', '📋 Este paciente no tiene consultas médicas registradas aún. Necesito datos históricos para poder analizar.');
      return false;
    }

    // Verificar que las consultas tienen resúmenes o transcripciones
    const consultationsWithContent = consultations.filter(c => c.summary || c.transcription);
    if (consultationsWithContent.length === 0) {
      addMessage('bot', '📄 Las consultas de este paciente no tienen resúmenes médicos procesados. Necesito contenido médico para analizar.');
      return false;
    }

    return true;
  };

  // Función para limpiar la respuesta de la IA
  const cleanAIResponse = (response: string): string => {
    if (!response) return '';
    
    // Remover caracteres problemáticos y normalizar saltos de línea
    return response
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea de Windows
      .replace(/\r/g, '\n')   // Normalizar saltos de línea de Mac clásico
      .trim(); // Eliminar espacios en blanco al inicio y final
  };

  const handleSendQuestion = async (question: string = currentQuestion) => {
    if (!question.trim()) {
      return;
    }

    if (!validateDataSufficiency()) {
      return;
    }

    addMessage('user', question);
    setCurrentQuestion("");
    setIsLoading(true);

    try {
      const response = await sendMedicalAnalyticsQuery({
        question,
        selectedPatientId,
        consultations,
        symptomsData,
        diagnosisData,
        chartData,
        webhookUrl
      });

      if (response.success) {
        const rawResponse = response.data?.response || 'Análisis completado exitosamente.';
        const cleanedResponse = cleanAIResponse(rawResponse);
        
        // Mostrar solo la respuesta limpia, sin prefijos adicionales
        addMessage('bot', cleanedResponse);
      } else {
        const errorMsg = response.error || 'No se pudo procesar la consulta médica.';
        addMessage('bot', `❌ **Error en el Análisis**\n\n${errorMsg}\n\n💡 **Sugerencias:**\n• Verifica que el webhook N8N esté funcionando\n• Revisa la configuración de la URL\n• Intenta con una pregunta más específica`);
      }
    } catch (error) {
      addMessage('bot', `🚫 **Error de Conexión**\n\nNo se pudo conectar con el sistema de análisis médico.\n\n**Posibles causas:**\n• Problema de conectividad de red\n• El webhook N8N no está disponible\n• Timeout del servidor\n\n💡 Intenta nuevamente en unos minutos.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calcular estadísticas del paciente para mostrar contexto
  const patientStats = selectedPatientId ? {
    totalConsultations: consultations.length,
    consultationsWithSummary: consultations.filter(c => c.summary).length,
    consultationsWithTranscription: consultations.filter(c => c.transcription).length,
    dateRange: consultations.length > 0 ? {
      from: consultations[consultations.length - 1]?.dateTime,
      to: consultations[0]?.dateTime
    } : null
  } : null;

  if (!selectedPatientId) {
    return (
      <div className="text-center py-8">
        <div className="p-6 rounded-lg bg-muted/30">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Análisis Médico con IA
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Selecciona un paciente para analizar su historial médico completo con inteligencia artificial.
          </p>
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border">
            <Database className="h-4 w-4 inline mr-1" />
            El sistema analizará automáticamente transcripciones, resúmenes y patrones históricos.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Patient Context & Configuration */}
      <Card className="border-medical-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-medical-600" />
              Análisis IA - Asistente Médico
              {patientStats && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({patientStats.totalConsultations} consultas disponibles)
                </span>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-medical-600 border-medical-300 hover:bg-medical-50"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {patientStats && (
            <div className="text-xs text-muted-foreground bg-green-50 p-3 rounded border flex items-center gap-4">
              <div>📊 {patientStats.consultationsWithSummary} resúmenes médicos</div>
              <div>📝 {patientStats.consultationsWithTranscription} transcripciones</div>
              <div>📅 Desde {patientStats.dateRange?.from ? new Date(patientStats.dateRange.from).toLocaleDateString('es-ES') : 'N/A'}</div>
            </div>
          )}
        </CardHeader>
        
        {showSettings && (
          <CardContent className="pt-0">
            <div className="space-y-3 p-4 bg-medical-50/30 rounded-lg">
              <Label htmlFor="webhook-url" className="text-sm font-medium">
                URL del Webhook N8N para Análisis Médico
              </Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://n8nwebhook.botec.tech/webhook/lovable-bot"
                  className="flex-1"
                />
                <Button onClick={handleSaveWebhookUrl} size="sm">
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Este webhook procesa los datos médicos con IA especializada para análisis inteligente.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Suggested Questions */}
      <Card className="border-medical-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-medical-700 mb-3 flex items-center gap-2">
            💡 Preguntas inteligentes sugeridas:
            {patientStats && patientStats.totalConsultations === 0 && (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-left h-auto p-3 text-xs text-medical-600 border-medical-300 hover:bg-medical-50 whitespace-normal"
                onClick={() => handleSendQuestion(question)}
                disabled={isLoading || !patientStats || patientStats.totalConsultations === 0}
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="border-medical-200 h-96">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Conversación con IA Médica</CardTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <Separator />
        </CardHeader>
        
        <CardContent className="flex-1 p-4">
          <ScrollArea className="h-64 pr-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Haz una pregunta para comenzar el análisis médico inteligente.</p>
                {patientStats && (
                  <p className="text-xs mt-2 text-green-600">
                    ✅ Datos listos: {patientStats.totalConsultations} consultas médicas disponibles
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-medical-500 text-white' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`inline-block p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-medical-500 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                      }`}>
                        {message.type === 'bot' ? (
                          <MarkdownRenderer 
                            content={message.content} 
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-3 bg-slate-100 rounded-lg rounded-bl-sm">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          </div>
                          <span>Analizando con IA médica...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card className="border-medical-200">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Pregunta sobre el historial médico del paciente..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSendQuestion();
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendQuestion()}
              disabled={!currentQuestion.trim() || isLoading || !patientStats || patientStats.totalConsultations === 0}
              className="bg-medical-500 hover:bg-medical-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {patientStats && patientStats.totalConsultations === 0 && (
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ Este paciente necesita consultas médicas registradas para poder analizar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalAnalyticsChat;
