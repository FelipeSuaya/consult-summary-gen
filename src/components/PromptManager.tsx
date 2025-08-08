import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groqApi } from "@/lib/api";
import { BookOpen, Save, RotateCcw, Check, RefreshCw } from "lucide-react";
import ConsultationTransformer from "./ConsultationTransformer";

// Define the Prompt interface to match the database schema
interface Prompt {
  id: string;
  name: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const PromptManager = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    if (selectedPrompt) {
      setEditedContent(selectedPrompt.content);
    }
  }, [selectedPrompt]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      // Cast the result to the Prompt type to satisfy TypeScript
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (data) {
        setPrompts(data as Prompt[]);
        if (data.length > 0 && !selectedPrompt) {
          setSelectedPrompt(data[0] as Prompt);
          setEditedContent((data[0] as Prompt).content);
        }
      }
    } catch (error) {
      console.error("Error al cargar los prompts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los prompts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt || !editedContent.trim()) {
      toast({
        title: "Error",
        description: "El contenido del prompt no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPrompt.id);

      if (error) {
        throw error;
      }

      // Reset cached prompt in the API service
      groqApi.resetCachedPrompt();
      
      toast({
        title: "Éxito",
        description: "Prompt actualizado correctamente",
        variant: "default"
      });
      
      // Refresh the prompts
      fetchPrompts();
    } catch (error) {
      console.error("Error al guardar el prompt:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el prompt",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!selectedPrompt) return;
    
    // Nuevo prompt con formato SOAP mejorado visualmente
    const soapPrompt = `Eres un asistente médico especializado en documentación clínica. Genera resúmenes médicos profesionales siguiendo el formato SOAP (Subjetivo, Objetivo, Análisis, Plan) con una presentación visual moderna y atractiva.

⚠️ **DATOS PERSONALES OBLIGATORIOS**
Si se mencionan en la transcripción, incluye SIEMPRE estos datos en la sección correspondiente:
- Nombre completo, DNI, Teléfono, Correo electrónico, Edad
- Domicilio, Género, Escolaridad, Ocupación, Obra social, Procedencia

---

## 📋 **DATOS DEL PACIENTE**

> **Información Personal**
> 
> | Campo | Valor |
> |-------|--------|
> | **Nombre** | [Nombre completo del paciente] |
> | **DNI** | [Documento de identidad] |
> | **Edad** | [Edad] años |
> | **Género** | [Género] |
> | **Teléfono** | [Número de contacto] |
> | **Email** | [Correo electrónico] |
> | **Domicilio** | [Dirección] |
> | **Ocupación** | [Trabajo/Profesión] |
> | **Obra Social** | [Cobertura médica] |
> | **Procedencia** | [Lugar de origen] |

---

## 🗣️ **S - SUBJETIVO**

### **Motivo de Consulta Principal**
- 🎯 **Razón de consulta**: [Motivo principal expresado por el paciente]

### **Historia de la Enfermedad Actual**
- 📅 **Inicio**: [Tiempo de evolución de los síntomas]
- 🔄 **Evolución**: [Cómo han progresado los síntomas]
- ⚡ **Características**: [Descripción detallada de síntomas]

### **Antecedentes Relevantes**

#### 🏥 **Antecedentes Personales**
- **Enfermedades crónicas**: [Patologías conocidas]
- **Cirugías previas**: [Procedimientos quirúrgicos]
- **Alergias conocidas**: [Reacciones alérgicas]
- **Medicación habitual**: [Fármacos que toma regularmente]
- **Vacunación**: [Estado vacunal si se menciona]

#### 👨‍👩‍👧‍👦 **Antecedentes Familiares**
- **Primer grado**: [Padres, hermanos, hijos]
- **Segundo grado**: [Abuelos, tíos, primos]

#### 🚬 **Hábitos**
- **Tabaquismo**: [Cantidad en paq/año]
- **Alcohol**: [Consumo en g/día]
- **Otras sustancias**: [Si aplica]

---

## 🔍 **O - OBJETIVO**

### **Signos Vitales**
| Parámetro | Valor | Rango Normal |
|-----------|--------|--------------|
| **Presión Arterial** | [Sistólica/Diastólica] mmHg | 120/80 mmHg |
| **Frecuencia Cardíaca** | [X] lpm | 60-100 lpm |
| **Temperatura** | [X]°C | 36.5-37°C |
| **Frecuencia Respiratoria** | [X] rpm | 12-20 rpm |
| **Saturación O2** | [X]% | >95% |
| **Peso** | [X] kg | - |
| **Talla** | [X] cm | - |

### **Examen Físico**
- 👀 **Aspecto general**: [Estado general del paciente]
- 🫁 **Aparato respiratorio**: [Hallazgos pulmonares]
- ❤️ **Aparato cardiovascular**: [Hallazgos cardíacos]
- 🍽️ **Aparato digestivo**: [Hallazgos abdominales]
- 🧠 **Sistema nervioso**: [Hallazgos neurológicos]
- 🦴 **Sistema músculo-esquelético**: [Hallazgos ortopédicos]

### **Estudios Complementarios Previos**

#### 🧪 **Laboratorio**
| Parámetro | Resultado | Valor de Referencia | Estado |
|-----------|-----------|---------------------|--------|
| Glucemia | [X] mg/dl | 70-110 mg/dl | ✅/⚠️/🚨 |
| Hemoglobina | [X] g/dl | 12-16 g/dl | ✅/⚠️/🚨 |
| Creatinina | [X] mg/dl | 0.6-1.2 mg/dl | ✅/⚠️/🚨 |

#### 📷 **Imágenes y Otros Estudios**
- **Radiografías**: [Hallazgos radiológicos]
- **Ecografías**: [Resultados ecográficos]
- **TAC/RMN**: [Hallazgos tomográficos]
- **EKG**: [Hallazgos electrocardiográficos]
- **Otros**: [Estudios adicionales]

---

## 🧠 **A - ANÁLISIS**

### **Diagnóstico Presuntivo**
1. 🎯 **Diagnóstico Principal**: [Impresión diagnóstica más probable]
2. 🔄 **Diagnósticos Diferenciales**: [Otras posibilidades diagnósticas]

### **Evaluación del Cuadro**
- **Gravedad**: 🟢 Leve / 🟡 Moderado / 🔴 Grave
- **Evolución esperada**: [Pronóstico estimado]
- **Factores de riesgo**: [Elementos que complican el cuadro]

---

## 📝 **P - PLAN**

### **🏥 Manejo Inmediato**
- **Medidas generales**: [Cuidados básicos]
- **Monitoreo**: [Parámetros a vigilar]

### **💊 Tratamiento Farmacológico**
| Medicamento | Dosis | Frecuencia | Duración | Vía |
|-------------|--------|------------|----------|-----|
| [Fármaco 1] | [X] mg | [Cada X horas] | [X días] | [VO/IM/IV] |
| [Fármaco 2] | [X] mg | [Cada X horas] | [X días] | [VO/IM/IV] |

### **🔬 Estudios Solicitados**
- ✅ **Laboratorio**: [Análisis solicitados]
- ✅ **Imágenes**: [Estudios radiológicos pedidos]
- ✅ **Interconsultas**: [Especialistas a consultar]

### **📅 Seguimiento**
- **Control médico**: [Fecha del próximo control]
- **Signos de alarma**: [Síntomas que requieren consulta urgente]
- **Recomendaciones**: [Cuidados y precauciones]

---

**📊 Resumen generado el**: [Fecha y hora actual]
**👨‍⚕️ Sistema de documentación médica**

---

**INSTRUCCIONES TÉCNICAS**:
- Usa terminología médica precisa y profesional
- Si no hay datos para una sección, indica "No reportado" o "No evaluado"
- Para valores de laboratorio, usa: ✅ (normal), ⚠️ (alterado leve), 🚨 (crítico)
- Mantén el formato de tablas y emojis para facilitar la lectura
- Prioriza la claridad y organización visual
- Incluye todos los datos personales mencionados en la transcripción`;
    
    setEditedContent(soapPrompt);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="animate-spin h-6 w-6 border-t-2 border-medical-600 rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-medical-600" />
            Administrador de Prompts
          </CardTitle>
          <CardDescription>
            Modifica los prompts que se utilizan para generar los resúmenes de las consultas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={selectedPrompt?.id || ""} 
            onValueChange={(value) => {
              const prompt = prompts.find(p => p.id === value);
              if (prompt) setSelectedPrompt(prompt);
            }}
          >
            <TabsList className="mb-4">
              {prompts.map(prompt => (
                <TabsTrigger key={prompt.id} value={prompt.id} className="data-[state=active]:bg-medical-600 data-[state=active]:text-white">
                  {prompt.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {prompts.map(prompt => (
              <TabsContent key={prompt.id} value={prompt.id} className="space-y-4">
                <div>
                  <Textarea 
                    value={selectedPrompt?.id === prompt.id ? editedContent : prompt.content} 
                    onChange={(e) => selectedPrompt?.id === prompt.id && setEditedContent(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    onClick={resetToDefault}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restablecer a valores predeterminados
                  </Button>
                  <Button 
                    onClick={handleSavePrompt}
                    disabled={isSaving || !selectedPrompt || selectedPrompt.content === editedContent}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-white rounded-full"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  <p>Última actualización: {new Date(prompt.updated_at).toLocaleString()}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <p className="text-sm text-gray-500">
            Los cambios se aplicarán a las nuevas consultas que se generen.
          </p>
          {selectedPrompt?.active && (
            <div className="flex items-center text-sm text-green-600">
              <Check className="h-4 w-4 mr-1" /> Activo
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Componente para transformar consultas existentes */}
      <ConsultationTransformer />
    </div>
  );
};

export default PromptManager;
