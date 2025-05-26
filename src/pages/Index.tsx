

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
    <div className="flex min-h-screen flex-col relative">
      {/* Elementos médicos decorativos en el fondo */}
      <div className="medical-bg-elements"></div>
      
      {/* Patrón médico sutil */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-medical-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-emerald-400/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-32 w-4 h-4 bg-medical-300/15 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-60 left-1/2 w-2 h-2 bg-emerald-300/15 rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-20 right-40 w-3 h-3 bg-medical-400/10 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Ondas médicas decorativas mejoradas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-medical-200/15 via-medical-300/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tl from-emerald-200/12 via-emerald-300/8 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-r from-medical-100/10 to-transparent rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 right-0 w-48 h-48 bg-gradient-to-l from-emerald-100/8 to-transparent rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
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
              {/* Header de bienvenida mejorado */}
              <div className="text-center space-y-6 mb-12 relative">
                <div className="relative inline-block">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-medical-700 via-medical-600 to-emerald-600 bg-clip-text text-transparent relative z-10">
                    ConsultSummary
                  </h1>
                  <div className="absolute inset-0 bg-gradient-to-r from-medical-200/20 via-medical-300/20 to-emerald-200/20 blur-2xl -z-10 scale-110"></div>
                </div>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  Transforma tu práctica médica con{" "}
                  <span className="font-semibold text-medical-700">transcripción inteligente</span>{" "}
                  y{" "}
                  <span className="font-semibold text-emerald-700">resúmenes automáticos</span>{" "}
                  de consultas profesionales
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-medical-500 rounded-full animate-pulse"></div>
                  <span>IA Médica Avanzada</span>
                  <div className="w-1 h-1 bg-slate-400 rounded-full mx-2"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span>Transcripción en Tiempo Real</span>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-12">
                  <TabsList className="grid w-fit grid-cols-2 bg-white/70 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/40">
                    <TabsTrigger 
                      value="consultas" 
                      className="
                        data-[state=active]:bg-gradient-to-r data-[state=active]:from-medical-500 data-[state=active]:to-medical-600 
                        data-[state=active]:text-white data-[state=active]:shadow-xl
                        text-medical-700 
                        rounded-xl 
                        transition-all 
                        duration-500 
                        ease-out
                        hover:bg-medical-50
                        px-10 py-4
                        font-semibold
                        relative
                        overflow-hidden
                        group
                      "
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        <Activity className="h-5 w-5 group-data-[state=active]:animate-pulse" />
                        Consultas Médicas
                      </span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="pacientes" 
                      className="
                        data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 
                        data-[state=active]:text-white data-[state=active]:shadow-xl
                        text-emerald-700 
                        rounded-xl 
                        transition-all 
                        duration-500 
                        ease-out
                        hover:bg-emerald-50
                        px-10 py-4
                        font-semibold
                        relative
                        overflow-hidden
                        group
                      "
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        <User className="h-5 w-5 group-data-[state=active]:animate-pulse" />
                        Gestión de Pacientes
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="consultas">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div className="xl:col-span-5 space-y-8">
                      <div className="glass-card rounded-3xl p-10 hover-lift shadow-2xl border-2 border-white/40">
                        <div className="text-center mb-8">
                          <h2 className="text-3xl font-bold text-medical-800 mb-4">
                            {selectedPatientForConsultation ? `Nueva Consulta` : "Iniciar Consulta"}
                          </h2>
                          {selectedPatientForConsultation && (
                            <div className="bg-gradient-to-r from-medical-50 to-emerald-50 px-6 py-3 rounded-2xl inline-block border border-medical-200/50">
                              <p className="text-lg font-semibold text-medical-700">
                                Paciente: {selectedPatientForConsultation.name}
                              </p>
                            </div>
                          )}
                          <p className="text-slate-600 mt-4 text-lg leading-relaxed">
                            Graba y transcribe automáticamente tu consulta médica con IA avanzada
                          </p>
                        </div>
                        
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} preselectedPatient={selectedPatientForConsultation} />
                        
                        {selectedPatientForConsultation && (
                          <div className="mt-8 text-center">
                            <button 
                              onClick={() => setSelectedPatientForConsultation(null)} 
                              className="text-medical-600 hover:text-medical-800 font-medium hover:underline transition-all duration-300 text-lg hover:scale-105 transform"
                            >
                              Cambiar paciente
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="xl:col-span-7 space-y-8">
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
      
      <footer className="border-t border-white/30 bg-white/60 backdrop-blur-xl py-8 md:py-10 relative">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-lg font-medium">
                <span className="font-bold bg-gradient-to-r from-medical-600 to-emerald-600 bg-clip-text text-transparent">
                  ConsultSummary
                </span>{" "}
                <span className="text-slate-600">— Inteligencia Artificial Médica Profesional</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Optimizando la práctica médica con tecnología de vanguardia
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-700 font-medium">Sistema Operativo</span>
              </div>
              <div className="flex items-center gap-2 bg-medical-50 px-4 py-2 rounded-full border border-medical-200">
                <div className="w-3 h-3 bg-medical-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span className="text-medical-700 font-medium">IA Activa</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
