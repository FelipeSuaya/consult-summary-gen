
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowDownIcon, ArrowUpIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface DateFilterProps {
  onDateChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
  onSortToggle?: () => void;
  sortAscending?: boolean;
  showSortToggle?: boolean;
}

const DateFilter = ({ onDateChange, onSortToggle, sortAscending, showSortToggle = false }: DateFilterProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handleClearFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onDateChange(undefined, undefined);
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    onDateChange(date, endDate);
    setIsStartOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    onDateChange(startDate, date);
    setIsEndOpen(false);
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-medical-200 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <Label>Filtrar por fecha de primera consulta:</Label>
        {(startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={handleClearFilter} className="h-7 px-2 text-sm">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Limpiar filtro
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="pl-3 pr-2 text-medical-700 border-medical-300">
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Fecha inicial"}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <span className="text-medical-500">a</span>

          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="pl-3 pr-2 text-medical-700 border-medical-300">
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: es }) : "Fecha final"}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                initialFocus
                locale={es}
                disabled={(date) => startDate ? date < startDate : false}
              />
            </PopoverContent>
          </Popover>
        </div>

        {showSortToggle && onSortToggle && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSortToggle}
            className="text-medical-700 border-medical-300 ml-auto"
          >
            Ordenar por fecha {sortAscending ? <ArrowDownIcon className="ml-1 h-4 w-4" /> : <ArrowUpIcon className="ml-1 h-4 w-4" />}
          </Button>
        )}
        
        {(startDate || endDate) && (
          <div className="ml-auto flex items-center">
            <Badge variant="secondary" className="bg-medical-100 text-medical-800 hover:bg-medical-200">
              {startDate && endDate 
                ? `${format(startDate, "dd/MM/yyyy", { locale: es })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`
                : startDate 
                  ? `Desde ${format(startDate, "dd/MM/yyyy", { locale: es })}`
                  : `Hasta ${format(endDate!, "dd/MM/yyyy", { locale: es })}`}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateFilter;
