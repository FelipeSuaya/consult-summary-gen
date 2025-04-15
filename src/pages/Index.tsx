
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import AudioRecorder from "@/components/AudioRecorder";
import ConsultationsList from "@/components/ConsultationsList";
import ConsultationDetail from "@/components/ConsultationDetail";
import PatientsList from "@/components/PatientsList";
import { ConsultationRecord, Patient } from "@/types";
import { groqApi } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ensureConsultationAudiosBucket } from "@/lib/ensureStorageBucket";
import { ensureSharedApiKeysTable, setupGroqApiKey } from "@/lib/ensureSharedApiKeys";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [newConsultation, setNewConsultation] = useState<ConsultationRecord | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [activeTab, setActiveTab] = useState("consultas");
  const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<Patient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure the shared API keys table exists
        const apiKeysResult = await ensureSharedApiKeysTable();
        if (apiKeysResult.error) {
          console.error("Error ensuring shared API keys table:", apiKeysResult.error);
        }
        
        // Configure Groq API key automatically
        const setupResult = await setupGroqApiKey();
        if (setupResult.error) {
          console.error("Error setting up Groq API key:", setupResult.error);
          toast({
            title: "Error de configuración",
            description: "No se pudo configurar automáticamente la API de Groq.",
            variant: "destructive"
          });
        } else {
          console.log("Groq API configured automatically");
        }
        
        // Ensure the storage bucket exists
        const bucketResult = await ensureConsultationAudiosBucket();
        if (bucketResult.error) {
          console.error("Error setting up storage bucket:", bucketResult.error);
          toast({
            title: "Error de configuración",
            description: "No se pudo inicializar completamente el almacenamiento.",
            variant: "destructive"
          });
        }
        
        // Try to get shared API key and set it in the groqApi service
        const sharedKey = await groqApi.fetchSharedApiKey();
        if (sharedKey) {
          groqApi.setApiKey(sharedKey);
          console.log("Using shared Groq API key automatically");
        } else {
          console.error("No shared API key found");
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };
    
    initializeApp();
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
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-6 md:py-8 bg-transparent">
          {selectedConsultation ? (
            <ConsultationDetail consultation={selectedConsultation} onBack={handleBack} />
          ) : showNewConsultation && newConsultation ? (
            <ConsultationDetail consultation={newConsultation} onBack={handleBack} />
          ) : (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-medical-100 rounded-full p-1">
                  <TabsTrigger 
                    value="consultas" 
                    className="
                      data-[state=active]:bg-medical-600 data-[state=active]:text-white 
                      text-medical-700 
                      rounded-full 
                      transition-all 
                      duration-300 
                      ease-in-out 
                      hover:bg-medical-500/20
                      py-2 
                      font-medium
                      data-[state=active]:shadow-md
                    "
                  >
                    Consultas
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="pacientes" 
                    className="
                      data-[state=active]:bg-medical-600 data-[state=active]:text-white 
                      text-medical-700 
                      rounded-full 
                      transition-all 
                      duration-300 
                      ease-in-out 
                      hover:bg-medical-500/20
                      py-2 
                      font-medium
                      data-[state=active]:shadow-md
                    "
                  >
                    Pacientes
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="consultas">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
                    <div className="md:col-span-5 space-y-6">
                      <div>
                        <h2 className="text-xl font-medium text-medical-900 mb-4">
                          {selectedPatientForConsultation ? `Nueva Consulta para ${selectedPatientForConsultation.name}` : "Nueva Consulta"}
                        </h2>
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} preselectedPatient={selectedPatientForConsultation} />
                        {selectedPatientForConsultation && <div className="mt-4">
                            <button onClick={() => setSelectedPatientForConsultation(null)} className="text-sm text-blue-600 hover:text-blue-800">
                              Cambiar paciente
                            </button>
                          </div>}
                      </div>
                    </div>
                    
                    <div className="md:col-span-7 space-y-6">
                      <ConsultationsList onConsultationSelect={setSelectedConsultation} />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pacientes">
                  <div className="mt-6">
                    <PatientsList onStartConsultation={handleStartConsultationForPatient} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t py-4 md:py-6">
        <div className="container">
          <p className="text-center text-sm text-gray-500">
            ConsultSummary — Herramienta de Transcripción y Resumen Médico
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
