
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import AudioRecorder from "@/components/AudioRecorder";
import ConsultationsList from "@/components/ConsultationsList";
import ConsultationDetail from "@/components/ConsultationDetail";
import PatientsList from "@/components/PatientsList";
import { ConsultationRecord, Patient } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ensureConsultationAudiosBucket } from "@/lib/ensureStorageBucket";
import { useToast } from "@/components/ui/use-toast";
import { Activity, User } from "lucide-react";

const Index = () => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [newConsultation, setNewConsultation] = useState<ConsultationRecord | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [activeTab, setActiveTab] = useState("consultas");
  const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<Patient | null>(null);
  const {
    toast
  } = useToast();

  useEffect(() => {
    ensureConsultationAudiosBucket().then(() => {
      console.log("Storage bucket check completed successfully");
    }).catch(error => {
      console.error("Error setting up storage bucket:", error);
      if (error && typeof error === 'object' && 'message' in error) {
        toast({
          title: "Error de configuración",
          description: "No se pudo inicializar completamente el almacenamiento.",
          variant: "destructive"
        });
      }
    });
  }, [toast]);

  const handleRecordingComplete = (consultation: ConsultationRecord) => {
    console.log("Recording complete, displaying consultation:", consultation.id);
    setNewConsultation(consultation);
    setShowNewConsultation(true);
  };

  const handleBack = () => {
    setSelectedConsultation(null);
    setShowNewConsultation(false);
    setSelectedPatientForConsultation(null);
  };

  const handleStartConsultationForPatient = (patient: Patient) => {
    console.log("Starting consultation for patient:", patient.id, patient.name);
    setSelectedPatientForConsultation(patient);
    setActiveTab("consultas");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-medical-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container relative py-8 md:py-12">
          {selectedConsultation ? (
            <div className="animate-fade-in">
              <ConsultationDetail consultation={selectedConsultation} onBack={handleBack} />
            </div>
          ) : showNewConsultation && newConsultation ? (
            <div className="animate-fade-in">
              <ConsultationDetail consultation={newConsultation} onBack={handleBack} />
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Header de bienvenida */}
              <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-medical-700 via-medical-600 to-emerald-600 bg-clip-text text-transparent">
                  Bienvenido a ConsultSummary
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Optimiza tu práctica médica con transcripción inteligente y resúmenes automáticos de consultas
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="grid w-fit grid-cols-2 bg-white/60 backdrop-blur-md rounded-2xl p-2 shadow-soft border border-white/20">
                    <TabsTrigger 
                      value="consultas" 
                      className="
                        data-[state=active]:bg-gradient-to-r data-[state=active]:from-medical-500 data-[state=active]:to-medical-600 
                        data-[state=active]:text-white data-[state=active]:shadow-medical
                        text-medical-700 
                        rounded-xl 
                        transition-all 
                        duration-500 
                        ease-out
                        hover:bg-medical-50
                        px-8 py-3
                        font-semibold
                        relative
                        overflow-hidden
                      "
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Consultas
                      </span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="pacientes" 
                      className="
                        data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 
                        data-[state=active]:text-white data-[state=active]:shadow-emerald
                        text-emerald-700 
                        rounded-xl 
                        transition-all 
                        duration-500 
                        ease-out
                        hover:bg-emerald-50
                        px-8 py-3
                        font-semibold
                        relative
                        overflow-hidden
                      "
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Pacientes
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="consultas">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-5 space-y-6">
                      <div className="glass-card rounded-3xl p-8 hover-lift">
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-bold text-medical-800 mb-2">
                            {selectedPatientForConsultation ? `Nueva Consulta para` : "Nueva Consulta"}
                          </h2>
                          {selectedPatientForConsultation && (
                            <p className="text-lg font-semibold text-medical-600 bg-medical-50 px-4 py-2 rounded-xl inline-block">
                              {selectedPatientForConsultation.name}
                            </p>
                          )}
                          <p className="text-muted-foreground mt-2">
                            Graba y transcribe automáticamente tu consulta médica
                          </p>
                        </div>
                        
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} preselectedPatient={selectedPatientForConsultation} />
                        
                        {selectedPatientForConsultation && (
                          <div className="mt-6 text-center">
                            <button 
                              onClick={() => setSelectedPatientForConsultation(null)} 
                              className="text-sm text-medical-600 hover:text-medical-800 font-medium hover:underline transition-colors"
                            >
                              Cambiar paciente
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="xl:col-span-7 space-y-6">
                      <div className="animate-slide-in-right">
                        <ConsultationsList onConsultationSelect={setSelectedConsultation} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pacientes">
                  <div className="animate-slide-up">
                    <PatientsList onStartConsultation={handleStartConsultationForPatient} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t border-white/20 bg-white/50 backdrop-blur-md py-6 md:py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-semibold bg-gradient-to-r from-medical-600 to-emerald-600 bg-clip-text text-transparent">
                ConsultSummary
              </span> — Herramienta de Transcripción y Resumen Médico Inteligente
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Sistema operativo
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
