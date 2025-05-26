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
import { Activity, User, Stethoscope, Brain, Mic, Shield, Sparkles } from "lucide-react";
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
  return <div className="flex min-h-screen flex-col relative">
      {/* Elementos médicos decorativos modernizados */}
      <div className="medical-bg-elements"></div>
      
      {/* Patrón médico sutil modernizado */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-medical-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-blue-400/20 rounded-full animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute bottom-32 left-32 w-5 h-5 bg-medical-300/15 rounded-full animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute top-60 left-1/2 w-3 h-3 bg-blue-300/15 rounded-full animate-pulse" style={{
        animationDelay: '3s'
      }}></div>
        <div className="absolute bottom-20 right-40 w-4 h-4 bg-medical-400/10 rounded-full animate-pulse" style={{
        animationDelay: '4s'
      }}></div>
        
        {/* Nuevos elementos decorativos */}
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-gradient-to-br from-medical-300/10 to-blue-300/10 rounded-full animate-pulse" style={{
        animationDelay: '5s'
      }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-gradient-to-br from-blue-400/15 to-medical-400/15 rounded-full animate-pulse" style={{
        animationDelay: '6s'
      }}></div>
      </div>
      
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Ondas médicas decorativas ultra-modernizadas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-medical-200/8 via-medical-300/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-blue-200/6 via-blue-300/4 to-transparent rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '2s'
        }}></div>
          <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-gradient-to-r from-medical-100/6 to-transparent rounded-full blur-2xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
          <div className="absolute top-1/4 -right-20 w-[350px] h-[350px] bg-gradient-to-l from-blue-100/5 to-transparent rounded-full blur-2xl animate-pulse" style={{
          animationDelay: '3s'
        }}></div>
        </div>

        <div className="container relative py-12 md:py-16">
          {selectedConsultation ? <div className="animate-fade-in">
              <ConsultationDetail consultation={selectedConsultation} onBack={handleBack} />
            </div> : showNewConsultation && newConsultation ? <div className="animate-fade-in">
              <ConsultationDetail consultation={newConsultation} onBack={handleBack} />
            </div> : <div className="space-y-12 animate-fade-in">
              {/* Header de bienvenida ultra-modernizado */}
              <div className="text-center space-y-8 mb-16 relative">
                <div className="relative inline-block">
                  <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-r from-medical-700 via-medical-600 to-blue-600 bg-clip-text text-transparent relative z-10">
                    ConsultSummary
                  </h1>
                  <div className="absolute inset-0 bg-gradient-to-r from-medical-200/30 via-medical-300/30 to-blue-200/30 blur-3xl -z-10 scale-110 animate-pulse"></div>
                </div>
                
                <p className="text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                  Revoluciona tu práctica médica con{" "}
                  <span className="font-bold text-medical-700 relative">
                    transcripción inteligente
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-medical-400 to-medical-600 rounded-full"></div>
                  </span>{" "}
                  y{" "}
                  <span className="font-bold text-blue-700 relative">
                    resúmenes automáticos
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                  </span>{" "}
                  impulsados por inteligencia artificial
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="medical-badge">
                    <Brain className="w-4 h-4" />
                    <span>IA Médica Avanzada</span>
                  </div>
                  <div className="blue-badge">
                    <Mic className="w-4 h-4" />
                    <span>Transcripción en Tiempo Real</span>
                  </div>
                  <div className="medical-badge">
                    <Shield className="w-4 h-4" />
                    <span>Datos Seguros</span>
                  </div>
                  <div className="blue-badge">
                    <Sparkles className="w-4 h-4" />
                    <span>Análisis Inteligente</span>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-16">
                  <TabsList className="grid w-fit grid-cols-2 bg-white/80 backdrop-blur-2xl rounded-3xl p-3 shadow-2xl border-2 border-white/60">
                    <TabsTrigger value="consultas" className={`medical-tab ${activeTab === 'consultas' ? 'active' : ''}`}>
                      <span className="relative z-10 flex items-center gap-3 text-slate-950">
                        <Activity className="h-5 w-5" />
                        Consultas Médicas
                      </span>
                    </TabsTrigger>
                    
                    <TabsTrigger value="pacientes" className={`blue-tab ${activeTab === 'pacientes' ? 'active' : ''}`}>
                      <span className="relative z-10 flex items-center gap-3 text-gray-950">
                        <User className="h-5 w-5" />
                        Gestión de Pacientes
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="consultas">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    <div className="xl:col-span-5 space-y-8">
                      <div className="medical-card border-2 border-white/50">
                        <div className="text-center mb-10">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-medical-500 to-medical-600 flex items-center justify-center shadow-2xl">
                            <Stethoscope className="h-10 w-10 text-white" />
                          </div>
                          <h2 className="text-4xl font-bold text-medical-800 mb-4">
                            {selectedPatientForConsultation ? `Nueva Consulta` : "Iniciar Consulta"}
                          </h2>
                          {selectedPatientForConsultation && <div className="medical-gradient-subtle px-8 py-4 rounded-3xl inline-block border-2 border-medical-200/50">
                              <p className="text-xl font-semibold text-medical-700">
                                Paciente: {selectedPatientForConsultation.name}
                              </p>
                            </div>}
                          <p className="text-slate-600 mt-6 text-xl leading-relaxed">
                            Graba y transcribe automáticamente tu consulta médica con IA de última generación
                          </p>
                        </div>
                        
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} preselectedPatient={selectedPatientForConsultation} />
                        
                        {selectedPatientForConsultation && <div className="mt-10 text-center">
                            <button onClick={() => setSelectedPatientForConsultation(null)} className="text-medical-600 hover:text-medical-800 font-semibold hover:underline transition-all duration-300 text-xl hover:scale-105 transform">
                              Cambiar paciente
                            </button>
                          </div>}
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
            </div>}
        </div>
      </main>
      
      <footer className="border-t border-white/40 bg-white/90 backdrop-blur-2xl py-12 md:py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-medical-500/2 via-transparent to-blue-500/2"></div>
        <div className="container relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-2xl font-medium">
                <span className="font-bold bg-gradient-to-r from-medical-600 to-blue-600 bg-clip-text text-transparent">
                  ConsultSummary
                </span>{" "}
                <span className="text-slate-600">— Inteligencia Artificial Médica Profesional</span>
              </p>
              <p className="text-lg text-slate-500 mt-2">
                Optimizando la práctica médica con tecnología de vanguardia
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="blue-badge">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Sistema Operativo</span>
              </div>
              <div className="medical-badge">
                <div className="w-3 h-3 bg-medical-500 rounded-full animate-pulse" style={{
                animationDelay: '0.5s'
              }}></div>
                <span>IA Activa</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;