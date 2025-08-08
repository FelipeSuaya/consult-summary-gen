
import React from 'react';
import MedicalCanvas from './MedicalCanvas';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  if (!content) return null;

  // Función para procesar bloques de canvas
  const processCanvasBlocks = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const canvasPattern = /```canvas\s*\n([\s\S]*?)\n```/g;
    let lastIndex = 0;
    let keyCounter = 0;

    let match;
    while ((match = canvasPattern.exec(text)) !== null) {
      // Agregar texto antes del canvas
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(
          <div key={`text-before-canvas-${keyCounter}`}>
            {processMarkdownText(beforeText)}
          </div>
        );
      }

      // Procesar datos del canvas
      try {
        const canvasDataStr = match[1].trim();
        const canvasData = JSON.parse(canvasDataStr);
        
        parts.push(
          <MedicalCanvas
            key={`canvas-${keyCounter}`}
            canvasData={canvasData}
            title={canvasData.title}
            className="my-4"
          />
        );
      } catch (error) {
        console.error('Error parsing canvas data:', error);
        parts.push(
          <div key={`canvas-error-${keyCounter}`} className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            Error al renderizar gráfico: Datos inválidos
          </div>
        );
      }

      lastIndex = match.index + match[0].length;
      keyCounter++;
    }

    // Agregar texto restante
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(
        <div key={`text-after-canvas-${keyCounter}`}>
          {processMarkdownText(remainingText)}
        </div>
      );
    }

    return parts.length > 0 ? parts : [processMarkdownText(text)];
  };

  const processMarkdownText = (text: string): React.ReactNode => {
    // Función para procesar texto con formato Markdown básico
    const processMarkdown = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;
      let keyCounter = 0;

      // Patrón para encontrar texto en negrita, cursiva, y otros formatos
      const markdownPattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_|`([^`]+)`)/g;
      
      let match;
      while ((match = markdownPattern.exec(text)) !== null) {
        // Agregar texto antes del formato
        if (match.index > currentIndex) {
          const beforeText = text.slice(currentIndex, match.index);
          if (beforeText) {
            parts.push(<span key={`text-${keyCounter++}`}>{beforeText}</span>);
          }
        }

        // Procesar el formato encontrado
        const fullMatch = match[1];
        if (match[2]) { // **negrita**
          parts.push(
            <strong key={`bold-${keyCounter++}`} className="font-semibold text-medical-800">
              {match[2]}
            </strong>
          );
        } else if (match[3]) { // *cursiva*
          parts.push(
            <em key={`italic-${keyCounter++}`} className="italic text-medical-700">
              {match[3]}
            </em>
          );
        } else if (match[4]) { // __negrita__
          parts.push(
            <strong key={`bold2-${keyCounter++}`} className="font-semibold text-medical-800">
              {match[4]}
            </strong>
          );
        } else if (match[5]) { // _cursiva_
          parts.push(
            <em key={`italic2-${keyCounter++}`} className="italic text-medical-700">
              {match[5]}
            </em>
          );
        } else if (match[6]) { // `código`
          parts.push(
            <code key={`code-${keyCounter++}`} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-medical-800 border">
              {match[6]}
            </code>
          );
        }

        currentIndex = match.index + fullMatch.length;
      }

      // Agregar texto restante
      if (currentIndex < text.length) {
        const remainingText = text.slice(currentIndex);
        if (remainingText) {
          parts.push(<span key={`text-${keyCounter++}`}>{remainingText}</span>);
        }
      }

      return parts.length > 0 ? parts : [<span key="fallback">{text}</span>];
    };

    // Dividir por líneas y procesar cada una
    const lines = text.split('\n');
    
    return (
      <div className="space-y-2">
        {lines.map((line, lineIndex) => {
          if (!line.trim()) {
            return <div key={`empty-${lineIndex}`} className="h-2" />;
          }

          // Detectar listas con - o •
          if (line.trim().match(/^[-•]\s+/)) {
            const listContent = line.trim().replace(/^[-•]\s+/, '');
            return (
              <div key={`list-${lineIndex}`} className="flex items-start gap-2 ml-4">
                <span className="text-medical-600 mt-0.5 text-sm">•</span>
                <div className="flex-1">
                  {processMarkdown(listContent)}
                </div>
              </div>
            );
          }

          // Líneas normales
          return (
            <div key={`line-${lineIndex}`} className="leading-relaxed">
              {processMarkdown(line)}
            </div>
          );
        })}
      </div>
    );
  };

  // Primero procesar bloques de canvas, luego el markdown normal
  const contentParts = processCanvasBlocks(content);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {contentParts}
    </div>
  );
};

export default MarkdownRenderer;
