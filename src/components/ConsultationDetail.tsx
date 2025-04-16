
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConsultationRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { renderMarkdownTable } from "./PatientConsultations";

interface ConsultationDetailProps {
  consultation: ConsultationRecord;
  onBack: () => void;
}

const ConsultationDetail: React.FC<ConsultationDetailProps> = ({ consultation, onBack }) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    
    const sections = content.split('\n\n');
    
    return sections.map((section, index) => {
      if (section.trim().startsWith('|') && section.trim().includes('|')) {
        return renderMarkdownTable(section);
      }
      
      if (section.trim().startsWith('#')) {
        const level = section.match(/^#+/)[0].length;
        const text = section.replace(/^#+\s+/, '');
        
        if (level === 1) {
          return <h1 key={index} className="text-2xl font-bold mb-4 mt-6">{text}</h1>;
        } else if (level === 2) {
          return <h2 key={index} className="text-xl font-semibold mb-3 mt-5">{text}</h2>;
        } else {
          return <h3 key={index} className="text-lg font-medium mb-2 mt-4">{text}</h3>;
        }
      }
      
      return <p key={index} className="mb-4">{section}</p>;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="flex items-center text-medical-700 hover:text-medical-800 hover:bg-medical-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Consulta de {consultation.patientName}
        </h1>
      </div>

      <Card className="shadow-md border-none rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-medical-500 to-medical-600 text-white">
          <div className="flex justify-between items-center">
            <CardTitle>Resumen de la consulta</CardTitle>
            <span className="text-sm text-white/90">{formatDate(consultation.dateTime)}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {consultation.summary ? (
            <div className="prose max-w-none">
              {renderContent(consultation.summary)}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay resumen disponible para esta consulta.
            </div>
          )}
        </CardContent>
      </Card>

      {consultation.transcription && (
        <Card className="shadow-md border-none rounded-xl overflow-hidden">
          <CardHeader className="bg-medical-100">
            <CardTitle className="text-medical-800">Transcripción completa</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{consultation.transcription}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConsultationDetail;
