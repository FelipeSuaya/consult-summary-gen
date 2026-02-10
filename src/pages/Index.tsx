
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
import { Mic, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [newConsultation, setNewConsultation] = useState<ConsultationRecord | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [activeTab, setActiveTab] = useState("consultas");
  const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<Patient | null>(null);
  const { toast } = useToast();

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 max-w-6xl">
        {selectedConsultation ? (
          <div className="animate-fade-in">
            <ConsultationDetail consultation={selectedConsultation} onBack={handleBack} />
          </div>
        ) : showNewConsultation && newConsultation ? (
          <div className="animate-fade-in">
            <ConsultationDetail consultation={newConsultation} onBack={handleBack} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {activeTab === "consultas" ? "Consultas" : activeTab === "pacientes" ? "Pacientes" : "Estadísticas"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activeTab === "consultas" 
                      ? "Graba y gestiona consultas médicas" 
                      : activeTab === "pacientes"
                      ? "Gestiona tu base de pacientes"
                      : "Análisis de datos clínicos"}
                  </p>
                </div>
                <TabsList className="bg-muted/60 border border-border/50 p-1 h-auto">
                  <TabsTrigger 
                    value="consultas" 
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Consultas</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pacientes" 
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Pacientes</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="estadisticas" 
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Estadísticas</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="consultas" className="animate-fade-in mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Recording Section */}
                  <div className="lg:col-span-2">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-semibold text-foreground">
                            Nueva Consulta
                          </h2>
                          {selectedPatientForConsultation && (
                            <p className="text-xs text-primary font-medium mt-0.5">
                              {selectedPatientForConsultation.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <Mic className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      
                      <AudioRecorder 
                        onRecordingComplete={handleRecordingComplete} 
                        preselectedPatient={selectedPatientForConsultation} 
                      />
                      
                      {selectedPatientForConsultation && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                          <button 
                            onClick={() => setSelectedPatientForConsultation(null)} 
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            Cambiar paciente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Stats / Recent */}
                  <div className="lg:col-span-3">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-foreground">
                          Análisis por Paciente
                        </h2>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <BarChart3 className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <ConsultationsList onConsultationSelect={setSelectedConsultation} />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pacientes" className="animate-fade-in mt-0">
                <PatientsList onStartConsultation={handleStartConsultationForPatient} />
              </TabsContent>

              <TabsContent value="estadisticas" className="animate-fade-in mt-0">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <ConsultationsList onConsultationSelect={setSelectedConsultation} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
