import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Trash2, Send, Loader2, Sparkles } from "lucide-react";
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
  "Resumen del historial clínico completo",
  "¿Qué patrones de síntomas detectas?",
  "¿Hay tendencias preocupantes recientes?",
  "¿Qué recomendaciones darías basado en el historial?",
  "Evolución temporal de los síntomas principales",
  "Correlación entre diagnósticos y época del año",
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
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
      addMessage('bot', 'Por favor selecciona un paciente para analizar su historial médico.');
      return false;
    }

    if (consultations.length === 0) {
      addMessage('bot', 'Este paciente no tiene consultas médicas registradas aún. Necesito datos históricos para poder analizar.');
      return false;
    }

    const consultationsWithContent = consultations.filter(c => c.summary || c.transcription);
    if (consultationsWithContent.length === 0) {
      addMessage('bot', 'Las consultas de este paciente no tienen resúmenes médicos procesados. Necesito contenido médico para analizar.');
      return false;
    }

    return true;
  };

  const cleanAIResponse = (response: string): string => {
    if (!response) return '';
    return response
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  };

  const handleSendQuestion = async (question: string = currentQuestion) => {
    if (!question.trim()) return;
    if (!validateDataSufficiency()) return;

    addMessage('user', question);
    setCurrentQuestion("");
    setIsLoading(true);

    const updatedHistory = [...conversationHistory, { role: 'user' as const, content: question }];

    try {
      const consultationData = consultations.map(c => ({
        date: c.dateTime || '',
        patientName: c.patientName || '',
        summary: c.summary || '',
        transcription: c.transcription || '',
      }));

      const chatResponse = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedHistory, consultations: consultationData }),
      });

      if (!chatResponse.ok) {
        const err = await chatResponse.json();
        throw new Error(err.error || 'Error en el chat médico');
      }

      const aiResponse = (await chatResponse.json()).response as string;
      const cleanedResponse = cleanAIResponse(aiResponse);

      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: cleanedResponse },
      ]);

      addMessage('bot', cleanedResponse);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      addMessage('bot', `**Error en el Análisis**\n\n${errorMsg}\n\n**Sugerencias:**\n- Verifica que la API key de OpenAI esté configurada\n- Intenta con una pregunta más específica`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">
          Análisis con IA
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Selecciona un paciente para analizar su historial médico con inteligencia artificial.
        </p>
      </div>
    );
  }

  const hasData = patientStats && patientStats.totalConsultations > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground leading-tight">Asistente IA</h3>
              {patientStats && (
                <p className="text-xs text-muted-foreground">
                  {patientStats.totalConsultations} consulta{patientStats.totalConsultations !== 1 ? 's' : ''} disponible{patientStats.totalConsultations !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Empty state with suggestions */}
                <div className="text-center py-6">
                  <Bot className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    {hasData
                      ? 'Hacé una pregunta o elegí una sugerencia'
                      : 'Este paciente no tiene consultas registradas'
                    }
                  </p>
                </div>

                {hasData && (
                  <div className="space-y-1.5">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 text-xs text-muted-foreground rounded-lg border border-border/60 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => handleSendQuestion(question)}
                        disabled={isLoading}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2.5 ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[85%] ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`inline-block px-3 py-2 rounded-xl ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted/60 text-foreground rounded-bl-md'
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
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
                      <Bot className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="inline-block px-3 py-2 bg-muted/60 rounded-xl rounded-bl-md">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Analizando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border/60">
        {!hasData && (
          <p className="text-xs text-muted-foreground mb-2">
            Este paciente necesita consultas registradas para analizar.
          </p>
        )}
        <div className="flex gap-2">
          <Input
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Pregunta sobre el historial..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSendQuestion();
              }
            }}
            disabled={isLoading || !hasData}
            className="flex-1 h-9 text-sm bg-muted/30 border-border/60 placeholder:text-muted-foreground/50"
          />
          <Button
            onClick={() => handleSendQuestion()}
            disabled={!currentQuestion.trim() || isLoading || !hasData}
            size="sm"
            className="h-9 w-9 p-0 bg-primary hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MedicalAnalyticsChat;
