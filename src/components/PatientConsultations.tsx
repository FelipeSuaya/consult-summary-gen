
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConsultationsByPatient } from "@/lib/storage";
import { format, isAfter, isBefore, isEqual, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, VolumeX } from "lucide-react";
import DateFilter from "@/components/DateFilter";
import { ConsultationRecord } from "@/types";

interface PatientConsultationsProps {
  patientId: string;
}

const PatientConsultations = ({ patientId }: PatientConsultationsProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filteredConsultations, setFilteredConsultations] = useState<ConsultationRecord[]>([]);
  
  // Query to get patient consultations
  const { 
    data: consultations = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['consultationsByPatient', patientId],
    queryFn: () => getConsultationsByPatient(patientId),
    enabled: !!patientId
  });

  // Apply date filters to consultations
  useEffect(() => {
    if (!consultations || consultations.length === 0) {
      setFilteredConsultations([]);
      return;
    }

    let filtered = [...consultations];
    
    if (startDate) {
      // Set start date to beginning of day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(consultation => {
        const consultationDate = new Date(consultation.dateTime);
        return isAfter(consultationDate, start) || isEqual(consultationDate, start);
      });
    }
    
    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(consultation => {
        const consultationDate = new Date(consultation.dateTime);
        return isBefore(consultationDate, end) || isEqual(consultationDate, end);
      });
    }
    
    setFilteredConsultations(filtered);
  }, [consultations, startDate, endDate]);

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-medical-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Error al cargar las consultas
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onReset={resetFilters}
        />
      </div>

      {filteredConsultations.length === 0 ? (
        <div className="text-center p-4 bg-medical-50 rounded-lg text-medical-700">
          {startDate || endDate ? 
            "No hay consultas en el rango de fechas seleccionado." : 
            "No hay consultas registradas para este paciente."
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConsultations.map(consultation => (
            <Card key={consultation.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      {format(new Date(consultation.dateTime), "PPP", { locale: es })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(consultation.dateTime), "p", { locale: es })}
                    </div>
                    {consultation.summary ? (
                      <div className="mt-2 text-sm">
                        {consultation.summary.length > 150 
                          ? `${consultation.summary.substring(0, 150)}...` 
                          : consultation.summary}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm italic text-gray-400">
                        No hay resumen disponible
                      </div>
                    )}
                  </div>
                  
                  <div className="flex">
                    {consultation.audioUrl ? (
                      <Button variant="ghost" size="sm" className="text-medical-600" onClick={() => window.open(consultation.audioUrl, '_blank')}>
                        Escuchar audio
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled className="text-gray-400">
                        <VolumeX className="h-4 w-4 mr-1" />
                        Sin audio
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientConsultations;
