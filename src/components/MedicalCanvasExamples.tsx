
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MedicalCanvas from './MedicalCanvas';
import { BarChart3, Heart, Activity, TrendingUp } from 'lucide-react';

const MedicalCanvasExamples = () => {
  const [selectedExample, setSelectedExample] = useState<string>('');

  const examples = {
    diagram: {
      title: "Diagrama de Sistema Cardiovascular",
      data: {
        type: "diagram",
        title: "Sistema Cardiovascular",
        elements: [
          { text: "Corazón", color: "#ffcdd2", connectTo: [1, 2] },
          { text: "Arterias", color: "#f8bbd9", connectTo: [3] },
          { text: "Venas", color: "#e1bee7", connectTo: [3] },
          { text: "Capilares", color: "#c5cae9" }
        ]
      }
    },
    chart: {
      title: "Gráfico de Presión Arterial",
      data: {
        type: "chart",
        title: "Presión Arterial (últimos 7 días)",
        values: [120, 125, 118, 122, 119, 116, 121],
        labels: ["L", "M", "X", "J", "V", "S", "D"]
      }
    },
    anatomy: {
      title: "Diagrama Anatómico",
      data: {
        type: "anatomy",
        parts: [
          { type: "circle", x: 200, y: 150, radius: 40, color: "#ffcdd2", label: "Cabeza" },
          { type: "rect", x: 170, y: 200, width: 60, height: 80, color: "#f8bbd9", label: "Torso" },
          { type: "rect", x: 160, y: 290, width: 25, height: 60, color: "#e1bee7", label: "Brazo" },
          { type: "rect", x: 215, y: 290, width: 25, height: 60, color: "#e1bee7", label: "Brazo" }
        ],
        annotations: [
          { x: 300, y: 150, text: "Dolor localizado aquí" },
          { x: 300, y: 250, text: "Área afectada" }
        ]
      }
    },
    timeline: {
      title: "Línea de Tiempo de Síntomas",
      data: {
        type: "timeline",
        title: "Evolución de Síntomas",
        events: [
          { text: "Inicio dolor", date: "01/10", color: "#f44336" },
          { text: "Fiebre", date: "03/10", color: "#ff9800" },
          { text: "Mejora", date: "05/10", color: "#4caf50" },
          { text: "Control médico", date: "07/10", color: "#2196f3" }
        ]
      }
    }
  };

  const exampleCode = `\`\`\`canvas
{
  "type": "chart",
  "title": "Evolución de Glucosa",
  "values": [95, 102, 98, 105, 92, 88, 94],
  "labels": ["L", "M", "X", "J", "V", "S", "D"]
}
\`\`\``;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-medical-600" />
            Capacidades Gráficas del ChatBot Médico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            La IA médica ahora puede crear gráficos, diagramas y esquemas visuales usando la sintaxis:
          </p>
          <div className="bg-gray-50 p-3 rounded-lg border text-sm font-mono">
            {exampleCode}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="examples" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="examples">Ejemplos Visuales</TabsTrigger>
          <TabsTrigger value="syntax">Sintaxis y Tipos</TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(examples).map(([key, example]) => (
              <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {key === 'chart' && <Activity className="h-4 w-4 text-medical-600" />}
                    {key === 'anatomy' && <Heart className="h-4 w-4 text-medical-600" />}
                    {key === 'timeline' && <TrendingUp className="h-4 w-4 text-medical-600" />}
                    {key === 'diagram' && <BarChart3 className="h-4 w-4 text-medical-600" />}
                    <span className="text-sm font-medium">{example.title}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <MedicalCanvas canvasData={example.data} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="syntax" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipos de Gráficos Disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">1. Gráficos de Barras/Líneas</h4>
                    <p className="text-xs text-muted-foreground">Para mostrar evolución de síntomas, valores de laboratorio, etc.</p>
                    <code className="text-xs bg-gray-50 p-1 rounded">type: "chart"</code>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm">2. Diagramas de Flujo</h4>
                    <p className="text-xs text-muted-foreground">Para algoritmos diagnósticos, procesos médicos, etc.</p>
                    <code className="text-xs bg-gray-50 p-1 rounded">type: "diagram"</code>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm">3. Esquemas Anatómicos</h4>
                    <p className="text-xs text-muted-foreground">Para localizar síntomas, lesiones, áreas afectadas, etc.</p>
                    <code className="text-xs bg-gray-50 p-1 rounded">type: "anatomy"</code>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm">4. Líneas de Tiempo</h4>
                    <p className="text-xs text-muted-foreground">Para mostrar evolución temporal de eventos médicos.</p>
                    <code className="text-xs bg-gray-50 p-1 rounded">type: "timeline"</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ejemplo Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
{````canvas
{
  "type": "anatomy",
  "parts": [
    {
      "type": "circle",
      "x": 200,
      "y": 150,
      "radius": 30,
      "color": "#ffcdd2",
      "label": "Área de dolor"
    }
  ],
  "annotations": [
    {
      "x": 250,
      "y": 130,
      "text": "Dolor severo 8/10"
    }
  ]
}
\`\`\``}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MedicalCanvasExamples;
