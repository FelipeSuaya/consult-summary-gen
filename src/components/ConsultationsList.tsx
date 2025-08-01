import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getConsultationsByPatient } from "@/lib/storage";
import { getPatients } from "@/lib/patients";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, Calendar, Stethoscope, User, BarChart3, Bot } from "lucide-react";
import MedicalAnalyticsChat from "@/components/MedicalAnalyticsChat";

interface ConsultationsListProps {
  onConsultationSelect: (consultation: any) => void;
}

const COLORS = ['#0588F0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ConsultationsList = ({ onConsultationSelect }: ConsultationsListProps) => {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [symptomsData, setSymptomsData] = useState<any[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<any[]>([]);
  
  const { 
    data: patients = [],
    isLoading: isLoadingPatients
  } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: () => getPatients(),
    enabled: !!user,
  });

  const { 
    data: consultations = [],
    isLoading: isLoadingConsultations,
    error,
    refetch 
  } = useQuery({
    queryKey: ['consultationsByPatient', selectedPatientId],
    queryFn: () => selectedPatientId ? getConsultationsByPatient(selectedPatientId) : Promise.resolve([]),
    enabled: !!selectedPatientId,
  });

  useEffect(() => {
    if (consultations && consultations.length > 0) {
      const consultationsByMonth: Record<number, number> = {};
      const currentYear = new Date().getFullYear();
      
      for (let i = 0; i < 12; i++) {
        consultationsByMonth[i] = 0;
      }
      
      consultations.forEach(consultation => {
        const date = new Date(consultation.dateTime);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          consultationsByMonth[month] = (consultationsByMonth[month] || 0) + 1;
        }
      });
      
      const monthlyData = Object.keys(consultationsByMonth).map(month => ({
        month: MONTHS[parseInt(month)],
        consultas: consultationsByMonth[parseInt(month)],
      }));
      
      setChartData(monthlyData);
      
      const symptomsMap: Record<string, number> = {};
      const diagnosisMap: Record<string, number> = {};
      
      const keySymptoms = [
        "dolor", "fiebre", "cefalea", "tos", "disnea", "náuseas", "vómitos", 
        "diarrea", "astenia", "fatiga", "mareo", "vértigo", "disuria", 
        "poliuria", "odinofagia", "disfonía", "prurito", "edema", "diaforesis"
      ];
      
      const keyDiagnosis = [
        "hipertensión", "diabetes", "neumonía", "bronquitis", "gastritis", 
        "migraña", "infección", "artrosis", "artritis", "hipotiroidismo", 
        "hipertiroidismo", "anemia", "colitis", "faringitis", "dermatitis",
        "hipercolesterolemia", "depresión", "ansiedad", "insuficiencia"
      ];
      
      consultations.forEach(consultation => {
        if (consultation.summary) {
          const lowerSummary = consultation.summary.toLowerCase();
          
          const motivoSection = lowerSummary.includes("motivo de consulta") ? 
            lowerSummary.split("motivo de consulta:")[1]?.split(/diagnóstico|antecedentes|exámenes/i)[0] || "" : "";
            
          const diagnosticoSection = lowerSummary.includes("diagnóstico presuntivo") ? 
            lowerSummary.split("diagnóstico presuntivo:")[1]?.split(/indicaciones|exámenes solicitados/i)[0] || "" : "";
          
          keySymptoms.forEach(symptom => {
            if ((motivoSection && motivoSection.includes(symptom)) || lowerSummary.includes(symptom)) {
              symptomsMap[symptom] = (symptomsMap[symptom] || 0) + 1;
            }
          });
          
          keyDiagnosis.forEach(diagnosis => {
            if ((diagnosticoSection && diagnosticoSection.includes(diagnosis)) || lowerSummary.includes(diagnosis)) {
              diagnosisMap[diagnosis] = (diagnosisMap[diagnosis] || 0) + 1;
            }
          });
        }
      });
      
      const symptomsChartData = Object.keys(symptomsMap)
        .map(symptom => ({
          name: symptom.charAt(0).toUpperCase() + symptom.slice(1),
          value: symptomsMap[symptom]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setSymptomsData(symptomsChartData);
      
      const diagnosisChartData = Object.keys(diagnosisMap)
        .map(diagnosis => ({
          name: diagnosis.charAt(0).toUpperCase() + diagnosis.slice(1),
          value: diagnosisMap[diagnosis]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setDiagnosisData(diagnosisChartData);
    } else {
      setChartData([]);
      setSymptomsData([]);
      setDiagnosisData([]);
    }
  }, [consultations]);

  const handlePatientChange = (value: string) => {
    setSelectedPatientId(value);
  };

  if (isLoadingPatients) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4 animate-spin" />
          Cargando información...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="patient-select" className="text-sm font-medium">
          Seleccionar Paciente para Análisis
        </Label>
        <Select value={selectedPatientId || ""} onValueChange={handlePatientChange}>
          <SelectTrigger id="patient-select" className="bg-background">
            <SelectValue placeholder="Seleccionar paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient: Patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {patient.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoadingConsultations && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4 animate-spin" />
            Cargando datos estadísticos...
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <Stethoscope className="h-4 w-4" />
            Error al cargar los datos. Por favor, intente de nuevo.
          </div>
        </div>
      )}

      {selectedPatientId && !isLoadingConsultations && consultations.length === 0 && (
        <div className="text-center py-8">
          <div className="p-4 rounded-lg bg-muted/30">
            <Stethoscope className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay consultas registradas para este paciente.
            </p>
          </div>
        </div>
      )}

      {consultations.length > 0 && (
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Análisis IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-medical-50 to-medical-100/50 border border-medical-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-medical-600" />
                  <span className="text-sm font-medium text-medical-700">Total Consultas</span>
                </div>
                <p className="text-2xl font-bold text-medical-900">{consultations.length}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Última Consulta</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {format(new Date(consultations[0].dateTime), "dd MMM", { locale: es })}
                </p>
              </div>
            </div>

            {/* Monthly Consultations Chart */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-medical-600" />
                Consultas Mensuales - {new Date().getFullYear()}
              </h3>
              <div className="h-64 bg-background rounded-lg border p-4">
                <ChartContainer
                  config={{
                    consultas: {
                      label: "Consultas",
                      color: "#0588F0"
                    }
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="month" 
                        fontSize={12}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        allowDecimals={false}
                        fontSize={12}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="consultas" 
                        fill="#0588F0" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>

            {/* Symptoms and Diagnosis Charts */}
            {(symptomsData.length > 0 || diagnosisData.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {symptomsData.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Síntomas Frecuentes
                    </h3>
                    <div className="h-64 bg-background rounded-lg border p-4">
                      <ChartContainer
                        config={{
                          value: {
                            label: "Frecuencia"
                          }
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={symptomsData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {symptomsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                )}

                {diagnosisData.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Diagnósticos Frecuentes
                    </h3>
                    <div className="h-64 bg-background rounded-lg border p-4">
                      <ChartContainer
                        config={{
                          value: {
                            label: "Frecuencia"
                          }
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={diagnosisData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {diagnosisData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-analysis">
            <MedicalAnalyticsChat
              selectedPatientId={selectedPatientId}
              consultations={consultations}
              symptomsData={symptomsData}
              diagnosisData={diagnosisData}
              chartData={chartData}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ConsultationsList;
