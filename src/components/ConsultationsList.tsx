
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getConsultationsByPatient } from "@/lib/storage";
import { getPatients } from "@/lib/patients";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Activity, User, AlertCircle, FileText, Stethoscope } from "lucide-react";

interface ConsultationsListProps {
  onConsultationSelect: (consultation: any) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ConsultationsList = ({ onConsultationSelect }: ConsultationsListProps) => {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [symptomsData, setSymptomsData] = useState<any[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<any[]>([]);
  
  // Get patients list - Fixed the query function to properly handle the context parameter
  const { 
    data: patients = [],
    isLoading: isLoadingPatients
  } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: () => getPatients(),
    enabled: !!user,
  });

  // Get consultations for selected patient
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

  // Process consultation data for charts when consultations change
  useEffect(() => {
    if (consultations && consultations.length > 0) {
      // Process monthly consultations data
      const consultationsByMonth: Record<number, number> = {};
      const currentYear = new Date().getFullYear();
      
      // Initialize all months with zero
      for (let i = 0; i < 12; i++) {
        consultationsByMonth[i] = 0;
      }
      
      // Count consultations by month for current year
      consultations.forEach(consultation => {
        const date = new Date(consultation.dateTime);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          consultationsByMonth[month] = (consultationsByMonth[month] || 0) + 1;
        }
      });
      
      // Transform to chart format
      const monthlyData = Object.keys(consultationsByMonth).map(month => ({
        month: MONTHS[parseInt(month)],
        consultas: consultationsByMonth[parseInt(month)],
      }));
      
      setChartData(monthlyData);
      
      // Extract clinical data for pie charts
      const symptomsMap: Record<string, number> = {};
      const diagnosisMap: Record<string, number> = {};
      
      // Key clinical terms to look for
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
          
          // Extract motivo de consulta and diagnóstico presuntivo sections
          const motivoSection = lowerSummary.includes("motivo de consulta") ? 
            lowerSummary.split("motivo de consulta:")[1]?.split(/diagnóstico|antecedentes|exámenes/i)[0] || "" : "";
            
          const diagnosticoSection = lowerSummary.includes("diagnóstico presuntivo") ? 
            lowerSummary.split("diagnóstico presuntivo:")[1]?.split(/indicaciones|exámenes solicitados/i)[0] || "" : "";
          
          // Check for symptoms in motivo de consulta
          keySymptoms.forEach(symptom => {
            // Prioriza búsqueda en sección de motivo de consulta
            if ((motivoSection && motivoSection.includes(symptom)) || lowerSummary.includes(symptom)) {
              symptomsMap[symptom] = (symptomsMap[symptom] || 0) + 1;
            }
          });
          
          // Check for diagnosis in diagnóstico presuntivo
          keyDiagnosis.forEach(diagnosis => {
            // Prioriza búsqueda en sección de diagnóstico
            if ((diagnosticoSection && diagnosticoSection.includes(diagnosis)) || lowerSummary.includes(diagnosis)) {
              diagnosisMap[diagnosis] = (diagnosisMap[diagnosis] || 0) + 1;
            }
          });
        }
      });
      
      // Transform symptoms to chart data
      const symptomsChartData = Object.keys(symptomsMap)
        .map(symptom => ({
          name: symptom.charAt(0).toUpperCase() + symptom.slice(1),
          value: symptomsMap[symptom]
        }))
        .sort((a, b) => b.value - a.value) // Sort by frequency
        .slice(0, 5); // Get top 5 symptoms
      
      setSymptomsData(symptomsChartData);
      
      // Transform diagnosis to chart data
      const diagnosisChartData = Object.keys(diagnosisMap)
        .map(diagnosis => ({
          name: diagnosis.charAt(0).toUpperCase() + diagnosis.slice(1),
          value: diagnosisMap[diagnosis]
        }))
        .sort((a, b) => b.value - a.value) // Sort by frequency
        .slice(0, 5); // Get top 5 diagnoses
      
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
      <div className="glass-card rounded-3xl p-8 animate-pulse">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-medical-100 rounded-2xl mx-auto flex items-center justify-center">
            <Activity className="h-8 w-8 text-medical-400 animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-medical-100 rounded-lg w-48 mx-auto"></div>
            <div className="h-4 bg-slate-100 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl overflow-hidden border-2 border-white/20 shadow-medical-lg hover-lift">
      {/* Header con gradiente */}
      <div className="relative bg-gradient-to-br from-medical-500 via-medical-600 to-medical-700 p-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Estadísticas de Paciente
                </h2>
                <p className="text-white/80 font-medium">
                  Análisis y métricas de consultas médicas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white/80 backdrop-blur-sm">
        <div className="space-y-8">
          <div className="space-y-4">
            <label htmlFor="patient-select" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-medical-500" />
              Seleccionar Paciente
            </label>
            <Select
              value={selectedPatientId || ""}
              onValueChange={handlePatientChange}
            >
              <SelectTrigger 
                id="patient-select" 
                className="h-12 bg-white border-2 border-slate-200 hover:border-medical-300 focus:border-medical-500 rounded-xl transition-colors shadow-soft"
              >
                <SelectValue placeholder="Seleccionar paciente para análisis" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md border-white/20 shadow-glass rounded-xl">
                {patients.map((patient: Patient) => (
                  <SelectItem 
                    key={patient.id} 
                    value={patient.id}
                    className="hover:bg-medical-50 focus:bg-medical-50 rounded-lg mx-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-medical-400 to-medical-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      {patient.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingConsultations && (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 bg-medical-100 rounded-2xl mx-auto flex items-center justify-center">
                <Activity className="h-6 w-6 text-medical-500 animate-spin" />
              </div>
              <p className="text-slate-600 font-medium">Analizando datos médicos...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 px-6 bg-red-50 border border-red-200 rounded-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">Error al cargar los datos</p>
              <p className="text-red-500 text-sm mt-1">Por favor, intente de nuevo</p>
            </div>
          )}

          {selectedPatientId && !isLoadingConsultations && consultations.length === 0 && (
            <div className="text-center py-12 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-2">Sin consultas registradas</p>
              <p className="text-slate-500 text-sm">Este paciente aún no tiene consultas en el sistema</p>
            </div>
          )}

          {consultations.length > 0 && (
            <div className="space-y-10 stagger-animation">
              {/* Gráfico de consultas mensuales */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-medical-100 rounded-xl">
                    <Activity className="h-5 w-5 text-medical-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Consultas por Mes</h3>
                  <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Año Actual</span>
                </div>
                <div className="h-80 bg-white rounded-xl p-4 border border-slate-100">
                  <ChartContainer
                    config={{
                      consultas: {
                        label: "Consultas",
                        color: "hsl(var(--medical-500))"
                      }
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          allowDecimals={false} 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={{ stroke: '#cbd5e1' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar 
                          dataKey="consultas" 
                          fill="url(#medicalGradient)" 
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="medicalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--medical-400))" />
                            <stop offset="100%" stopColor="hsl(var(--medical-600))" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              {/* Gráfico de síntomas frecuentes */}
              {symptomsData.length > 0 && (
                <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-soft">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Motivos de Consulta Frecuentes</h3>
                  </div>
                  <div className="h-80 bg-white rounded-xl p-4 border border-emerald-100">
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
                            labelLine
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
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

              {/* Gráfico de diagnósticos */}
              {diagnosisData.length > 0 && (
                <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 border border-purple-200 shadow-soft">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Stethoscope className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Diagnósticos Presuntivos Frecuentes</h3>
                  </div>
                  <div className="h-80 bg-white rounded-xl p-4 border border-purple-100">
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
                            labelLine
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
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

              {/* Resumen estadístico */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-200 shadow-soft">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Resumen del Paciente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Total de consultas</p>
                    <p className="text-2xl font-bold text-medical-600">{consultations.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Última consulta</p>
                    <p className="text-lg font-semibold text-slate-700">
                      {format(
                        new Date(consultations[0].dateTime), 
                        "PPpp", 
                        { locale: es }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationsList;
