
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onReset: () => void;
}

const DateFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset
}: DateFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex items-center">
        <span className="text-sm text-medical-700 mr-2">Desde:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[140px]",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, "dd MMM yyyy", { locale: es })
              ) : (
                "Seleccionar"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
              locale={es}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center">
        <span className="text-sm text-medical-700 mr-2">Hasta:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline" 
              className={cn(
                "justify-start text-left font-normal w-[140px]",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, "dd MMM yyyy", { locale: es })
              ) : (
                "Seleccionar"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              initialFocus
              locale={es}
              fromDate={startDate}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {(startDate || endDate) && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="text-medical-700 hover:text-medical-900"
        >
          <X className="h-4 w-4 mr-1" /> Limpiar filtros
        </Button>
      )}
    </div>
  );
};

export default DateFilter;
