
import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Line, Text, Path } from 'fabric';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MedicalCanvasProps {
  canvasData: any;
  title?: string;
  className?: string;
}

const MedicalCanvas = ({ canvasData, title, className = "" }: MedicalCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    // Renderizar el contenido del canvas basado en los datos
    if (canvasData) {
      renderCanvasContent(canvas, canvasData);
    }

    return () => {
      canvas.dispose();
    };
  }, [canvasData]);

  const renderCanvasContent = (canvas: FabricCanvas, data: any) => {
    canvas.clear();
    canvas.backgroundColor = "#ffffff";

    if (data.type === 'diagram') {
      renderDiagram(canvas, data);
    } else if (data.type === 'chart') {
      renderChart(canvas, data);
    } else if (data.type === 'anatomy') {
      renderAnatomyDiagram(canvas, data);
    } else if (data.type === 'timeline') {
      renderTimeline(canvas, data);
    }

    canvas.renderAll();
  };

  const renderDiagram = (canvas: FabricCanvas, data: any) => {
    const { elements = [] } = data;
    
    elements.forEach((element: any, index: number) => {
      const baseX = 50 + (index % 3) * 180;
      const baseY = 50 + Math.floor(index / 3) * 120;

      // Crear rectángulo para cada elemento
      const rect = new Rect({
        left: baseX,
        top: baseY,
        width: 150,
        height: 80,
        fill: element.color || '#e3f2fd',
        stroke: '#1976d2',
        strokeWidth: 2,
        rx: 10,
        ry: 10,
      });

      // Añadir texto
      const text = new Text(element.text || `Elemento ${index + 1}`, {
        left: baseX + 75,
        top: baseY + 40,
        fontSize: 12,
        fill: '#1976d2',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        fontFamily: 'Arial, sans-serif',
      });

      canvas.add(rect);
      canvas.add(text);

      // Añadir conexiones si existen
      if (element.connectTo && element.connectTo.length > 0) {
        element.connectTo.forEach((targetIndex: number) => {
          if (targetIndex < elements.length) {
            const targetX = 50 + (targetIndex % 3) * 180 + 75;
            const targetY = 50 + Math.floor(targetIndex / 3) * 120;
            
            const line = new Line([baseX + 75, baseY + 80, targetX, targetY], {
              stroke: '#ff5722',
              strokeWidth: 2,
              strokeDashArray: [5, 5],
            });
            
            canvas.add(line);
          }
        });
      }
    });
  };

  const renderChart = (canvas: FabricCanvas, data: any) => {
    const { values = [], labels = [], title: chartTitle = 'Gráfico Médico' } = data;
    
    // Título
    const titleText = new Text(chartTitle, {
      left: 300,
      top: 30,
      fontSize: 16,
      fill: '#333',
      fontWeight: 'bold',
      originX: 'center',
      fontFamily: 'Arial, sans-serif',
    });
    canvas.add(titleText);

    // Ejes
    const xAxis = new Line([80, 350, 520, 350], {
      stroke: '#333',
      strokeWidth: 2,
    });
    
    const yAxis = new Line([80, 80, 80, 350], {
      stroke: '#333',
      strokeWidth: 2,
    });

    canvas.add(xAxis);
    canvas.add(yAxis);

    // Barras o puntos
    values.forEach((value: number, index: number) => {
      const x = 100 + index * 60;
      const height = (value / Math.max(...values)) * 250;
      const y = 350 - height;

      const bar = new Rect({
        left: x,
        top: y,
        width: 40,
        height: height,
        fill: '#4fc3f7',
        stroke: '#0288d1',
        strokeWidth: 1,
      });

      const label = new Text(labels[index] || `${index + 1}`, {
        left: x + 20,
        top: 365,
        fontSize: 10,
        fill: '#666',
        originX: 'center',
        fontFamily: 'Arial, sans-serif',
      });

      const valueText = new Text(value.toString(), {
        left: x + 20,
        top: y - 15,
        fontSize: 10,
        fill: '#333',
        originX: 'center',
        fontFamily: 'Arial, sans-serif',
      });

      canvas.add(bar);
      canvas.add(label);
      canvas.add(valueText);
    });
  };

  const renderAnatomyDiagram = (canvas: FabricCanvas, data: any) => {
    const { parts = [], annotations = [] } = data;

    parts.forEach((part: any, index: number) => {
      let shape;
      
      if (part.type === 'circle') {
        shape = new Circle({
          left: part.x || 100 + index * 50,
          top: part.y || 100 + index * 30,
          radius: part.radius || 30,
          fill: part.color || '#ffcdd2',
          stroke: '#d32f2f',
          strokeWidth: 2,
        });
      } else {
        shape = new Rect({
          left: part.x || 100 + index * 50,
          top: part.y || 100 + index * 30,
          width: part.width || 60,
          height: part.height || 40,
          fill: part.color || '#ffcdd2',
          stroke: '#d32f2f',
          strokeWidth: 2,
          rx: 5,
          ry: 5,
        });
      }

      canvas.add(shape);

      // Etiqueta
      if (part.label) {
        const label = new Text(part.label, {
          left: (part.x || 100 + index * 50) + 10,
          top: (part.y || 100 + index * 30) - 20,
          fontSize: 11,
          fill: '#d32f2f',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        });
        canvas.add(label);
      }
    });

    // Anotaciones
    annotations.forEach((annotation: any) => {
      const annotationText = new Text(annotation.text, {
        left: annotation.x || 50,
        top: annotation.y || 50,
        fontSize: 10,
        fill: '#1976d2',
        backgroundColor: '#e3f2fd',
        padding: 5,
        fontFamily: 'Arial, sans-serif',
      });
      canvas.add(annotationText);
    });
  };

  const renderTimeline = (canvas: FabricCanvas, data: any) => {
    const { events = [], title: timelineTitle = 'Línea de Tiempo Médica' } = data;

    // Título
    const titleText = new Text(timelineTitle, {
      left: 300,
      top: 30,
      fontSize: 16,
      fill: '#333',
      fontWeight: 'bold',
      originX: 'center',
      fontFamily: 'Arial, sans-serif',
    });
    canvas.add(titleText);

    // Línea principal
    const mainLine = new Line([50, 200, 550, 200], {
      stroke: '#666',
      strokeWidth: 3,
    });
    canvas.add(mainLine);

    events.forEach((event: any, index: number) => {
      const x = 70 + index * (480 / Math.max(events.length - 1, 1));
      
      // Punto del evento
      const eventPoint = new Circle({
        left: x,
        top: 200,
        radius: 8,
        fill: event.color || '#4fc3f7',
        stroke: '#0288d1',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
      });

      // Línea vertical
      const verticalLine = new Line([x, 200, x, index % 2 === 0 ? 150 : 250], {
        stroke: '#999',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
      });

      // Texto del evento
      const eventText = new Text(event.text || `Evento ${index + 1}`, {
        left: x,
        top: index % 2 === 0 ? 130 : 270,
        fontSize: 10,
        fill: '#333',
        originX: 'center',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      });

      // Fecha
      if (event.date) {
        const dateText = new Text(event.date, {
          left: x,
          top: index % 2 === 0 ? 115 : 285,
          fontSize: 8,
          fill: '#666',
          originX: 'center',
          fontFamily: 'Arial, sans-serif',
        });
        canvas.add(dateText);
      }

      canvas.add(verticalLine);
      canvas.add(eventPoint);
      canvas.add(eventText);
    });
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = `${title || 'diagrama-medico'}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    fabricCanvas.setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    fabricCanvas.setZoom(Math.max(zoom / 1.2, 0.5));
  };

  const handleReset = () => {
    if (!fabricCanvas) return;
    fabricCanvas.setZoom(1);
    fabricCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    fabricCanvas.renderAll();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-medical-800">{title}</h4>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="border border-medical-200 rounded-lg p-2 bg-white">
        <canvas 
          ref={canvasRef} 
          className="max-w-full border border-gray-200 rounded"
          style={{ cursor: 'grab' }}
        />
      </div>
    </div>
  );
};

export default MedicalCanvas;
