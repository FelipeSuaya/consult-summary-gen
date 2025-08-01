
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bot, User, Settings, Trash2, Send, Loader2 } from "lucide-react";
import { sendMedicalAnalyticsQuery } from "@/lib/medicalAnalytics";

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
  "¿Cuál es el síntoma más frecuente y su evolución?",
  "¿Hay tendencias en los diagnósticos a lo largo del tiempo?"
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
    localStorage.getItem('n8n_webhook_url') || ""
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

  const handleSendQuestion = async (question: string = currentQuestion) => {
    if (!question.trim() || !selectedPatientId || !webhookUrl) {
      if (!webhookUrl) {
        addMessage('bot', 'Por favor configura la URL del webhook de N8N primero.');
      }
      if (!selectedPatientId) {
        addMessage('bot', 'Por favor selecciona un paciente para analizar.');
      }
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
        addMessage('bot', response.data?.response || 'Análisis completado exitosamente.');
      } else {
        addMessage('bot', `Error: ${response.error || 'No se pudo procesar la consulta.'}`);
      }
    } catch (error) {
      addMessage('bot', 'Error de conexión. Verifica la configuración del webhook.');
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

  if (!selectedPatientId) {
    return (
      <div className="text-center py-8">
        <div className="p-4 rounded-lg bg-muted/30">
          <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Selecciona un paciente para comenzar el análisis con IA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Configuration Section */}
      <Card className="border-medical-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-medical-600" />
              Análisis IA - Asistente Médico
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
        </CardHeader>
        
        {showSettings && (
          <CardContent className="pt-0">
            <div className="space-y-3 p-4 bg-medical-50/30 rounded-lg">
              <Label htmlFor="webhook-url" className="text-sm font-medium">
                URL del Webhook N8N
              </Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-n8n-instance.com/webhook/medical-analytics"
                  className="flex-1"
                />
                <Button onClick={handleSaveWebhookUrl} size="sm">
                  Guardar
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Suggested Questions */}
      <Card className="border-medical-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-medical-700 mb-3">
            Preguntas sugeridas:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-left h-auto p-3 text-xs text-medical-600 border-medical-300 hover:bg-medical-50 whitespace-normal"
                onClick={() => handleSendQuestion(question)}
                disabled={isLoading}
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
            <CardTitle className="text-base">Conversación</CardTitle>
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
                <p className="text-sm">Haz una pregunta para comenzar el análisis.</p>
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
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analizando datos...
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
              placeholder="Escribe tu pregunta sobre el paciente..."
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
              disabled={!currentQuestion.trim() || isLoading}
              className="bg-medical-500 hover:bg-medical-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalAnalyticsChat;
