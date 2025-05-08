
import { Button } from "@/components/ui/button";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface DateFilterProps {
  onSortToggle?: () => void;
  sortAscending?: boolean;
}

const DateFilter = ({ onSortToggle, sortAscending = false }: DateFilterProps) => {
  return (
    <div className="bg-white rounded-lg p-3 border border-medical-200 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="text-medical-700 font-medium">
          Ordenar por fecha de primera consulta
        </div>
        
        {onSortToggle && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSortToggle}
            className="text-medical-700 border-medical-300"
          >
            Ordenar por fecha {sortAscending ? <ArrowDownIcon className="ml-1 h-4 w-4" /> : <ArrowUpIcon className="ml-1 h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateFilter;
