
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { ConsultationRecord } from "@/types";

// This function renders markdown tables as React components
const renderMarkdownTable = (markdownTable: string) => {
  if (!markdownTable.includes('|')) return markdownTable;
  
  try {
    const rows = markdownTable.trim().split('\n');
    if (rows.length < 2) return markdownTable;
    
    const headerRow = rows[0].trim();
    const headers = headerRow
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '');
      
    const isSeparator = rows[1].trim().replace(/[^|\-\s]/g, '') === rows[1].trim();
    const dataStartIndex = isSeparator ? 2 : 1;
    
    const dataRows = rows.slice(dataStartIndex).map(row => {
      return row
        .trim()
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
    }).filter(row => row.length > 0);
    
    // Limit to first two columns (Parámetro and Resultado)
    const processedHeaders = headers.slice(0, 2);
    const processedDataRows = dataRows.map(row => row.slice(0, 2));
    
    return (
      <Table className="mt-2 mb-4 border border-gray-200">
        <TableHeader className="bg-medical-50">
          <TableRow>
            {processedHeaders.map((header, i) => (
              <TableHead key={`header-${i}`} className="font-medium text-medical-800">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedDataRows.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`cell-${rowIndex}-${cellIndex}`}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } catch (error) {
    console.error("Error parsing markdown table:", error);
    return markdownTable;
  }
};

// Define a simple API function to fetch consultations by patient ID
const fetchPatientConsultations = async (patientId: string): Promise<ConsultationRecord[]> => {
  try {
    // This would be replaced with your actual API call
    const response = await fetch(`/api/consultations?patientId=${patientId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch consultations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching patient consultations:', error);
    return [];
  }
};

interface PatientConsultationsProps {
  patientId: string;
}

// The component that displays consultations for a given patient
const PatientConsultations: React.FC<PatientConsultationsProps> = ({ patientId }) => {
  const { data: consultations = [], isLoading, error } = useQuery({
    queryKey: ['patientConsultations', patientId],
    queryFn: () => fetchPatientConsultations(patientId),
    enabled: !!patientId
  });

  if (isLoading) {
    return <div className="text-center py-4">Cargando consultas...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error al cargar las consultas</div>;
  }

  if (consultations.length === 0) {
    return <div className="text-center py-4 text-gray-500">No hay consultas registradas para este paciente</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Historial de Consultas</h3>
      {consultations.map((consultation) => (
        <div key={consultation.id} className="border rounded-lg p-3 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">{new Date(consultation.dateTime).toLocaleDateString()}</p>
              {consultation.summary && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">Resumen:</p>
                  <p className="text-gray-700">{consultation.summary}</p>
                </div>
              )}
            </div>
            <a href={`/consultation/${consultation.id}`} className="text-blue-600 hover:underline text-sm">
              Ver detalles
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export { renderMarkdownTable };
export default PatientConsultations;
