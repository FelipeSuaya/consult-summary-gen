
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groqApi } from "@/lib/api";
import { BookOpen, Save, RotateCcw, Check } from "lucide-react";

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
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (data) {
        setPrompts(data);
        if (data.length > 0 && !selectedPrompt) {
          setSelectedPrompt(data[0]);
          setEditedContent(data[0].content);
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
    
    // Esto es solo un ejemplo, puedes definir valores predeterminados para cada tipo de prompt
    const defaultPrompt = `Eres un asistente médico especializado. Extrae y resume la información clave de la siguiente transcripción de consulta médica, utilizando terminología médica técnica y profesional. IMPORTANTE: Incluye SIEMPRE los siguientes datos personales del paciente si están mencionados: nombre completo, DNI, teléfono, correo electrónico, edad, domicilio, género, escolaridad, ocupación, obra social y procedencia.\n\nEstructura el resumen con las siguientes secciones EXACTAMENTE en este orden:\n\n1. DATOS PERSONALES: Todos los datos de identificación mencionados.\n\n2. MOTIVO DE CONSULTA: Razón principal por la que el paciente acude a la consulta médica, expresada de forma concisa y técnica.\n\n3. ANTECEDENTES PERSONALES: Incluye enfermedades del adulto, internaciones previas, antecedentes traumáticos, quirúrgicos, alérgicos, medicación habitual y vacunación.\n\n4. ANTECEDENTES FAMILIARES: Patologías relevantes en familiares de primer y segundo grado.\n\n5. HÁBITOS: Tabaquismo (paq/año), alcoholismo (g/día), otras sustancias si se mencionan.\n\n6. EXÁMENES COMPLEMENTARIOS PREVIOS: Resultados de estudios anteriores que el paciente mencione, incluyendo:\n   - Laboratorio: Presenta los valores de análisis de sangre, orina u otros estudios de laboratorio en formato de tabla cuando sea posible, por ejemplo:\n     | Parámetro | Resultado | Valor referencia |\n     | --------- | --------- | --------------- |\n     | Glucemia | 100 mg/dl | 70-110 mg/dl |\n   - Otros estudios: Radiografías, ecografías, tomografías, resonancias, etc.\n\n7. DIAGNÓSTICO PRESUNTIVO: Impresión diagnóstica basada en la anamnesis y examen físico, utilizando nomenclatura médica precisa.\n\n8. INDICACIONES: Plan terapéutico detallado, incluyendo medicación, posología y recomendaciones.\n\n9. EXÁMENES SOLICITADOS: Estudios complementarios indicados durante la consulta.\n\nUsa terminología médica técnica en todo el resumen. Sé preciso y conciso, evitando redundancias, pero asegurando que toda la información clínica relevante quede documentada. Siempre que menciones resultados de laboratorio, preséntalo en formato de tabla.`;
    
    setEditedContent(defaultPrompt);
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
  );
};

export default PromptManager;
