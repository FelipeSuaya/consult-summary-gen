
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
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Users, BarChart3, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-medical-50/30">
      <Header />
      
      <main className="container py-8">
        {selectedConsultation ? (
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
            <ConsultationDetail consultation={selectedConsultation} onBack={handleBack} />
          </div>
        ) : showNewConsultation && newConsultation ? (
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <ConsultationDetail consultation={newConsultation} onBack={handleBack} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 bg-medical-50 text-medical-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Plataforma de Documentación Médica IA
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-medical-700 via-medical-600 to-medical-800 bg-clip-text text-transparent">
                Consultas Médicas Inteligentes
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Transcribe, resume y organiza tus consultas médicas de forma automática con tecnología de inteligencia artificial
              </p>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid grid-cols-2 bg-card shadow-sm border p-1.5 h-auto">
                  <TabsTrigger 
                    value="consultas" 
                    className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-medical-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-md"
                  >
                    <Stethoscope className="h-4 w-4" />
                    <span className="font-medium">Consultas</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="pacientes" 
                    className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-medical-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-md"
                  >
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Pacientes</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="consultas" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                  {/* Recording Section */}
                  <div className="xl:col-span-2">
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-medical-100 rounded-lg">
                            <Stethoscope className="h-5 w-5 text-medical-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-foreground">
                              {selectedPatientForConsultation ? `Nueva Consulta` : "Nueva Consulta"}
                            </h2>
                            {selectedPatientForConsultation && (
                              <p className="text-sm text-medical-600 font-medium">
                                Paciente: {selectedPatientForConsultation.name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <AudioRecorder 
                          onRecordingComplete={handleRecordingComplete} 
                          preselectedPatient={selectedPatientForConsultation} 
                        />
                        
                        {selectedPatientForConsultation && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <button 
                              onClick={() => setSelectedPatientForConsultation(null)} 
                              className="text-sm text-medical-600 hover:text-medical-700 hover:underline transition-colors"
                            >
                              Cambiar paciente
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Statistics Section */}
                  <div className="xl:col-span-3">
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/50 h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-medical-100 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-medical-600" />
                          </div>
                          <h2 className="text-xl font-bold text-foreground">Estadísticas</h2>
                        </div>
                        <ConsultationsList onConsultationSelect={setSelectedConsultation} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pacientes" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-medical-100 rounded-lg">
                        <Users className="h-5 w-5 text-medical-600" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Gestión de Pacientes</h2>
                    </div>
                    <PatientsList onStartConsultation={handleStartConsultationForPatient} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm mt-16">
        <div className="container py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 ConsultSummary — Plataforma de Documentación Médica con IA
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Desarrollado para profesionales de la salud
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
