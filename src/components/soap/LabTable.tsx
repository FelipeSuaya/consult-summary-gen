
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface LabResult {
  parameter: string;
  result: string;
  reference?: string;
  flagged?: "high" | "low" | "abnormal" | null;
}

interface LabTableProps {
  labs: LabResult[];
  className?: string;
}

const LabTable = ({ labs, className = "" }: LabTableProps) => {
  if (!labs.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No hay resultados de laboratorio consignados
      </div>
    );
  }

  const getFlagIcon = (flagged?: "high" | "low" | "abnormal" | null) => {
    switch (flagged) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "low":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "abnormal":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getCellClassName = (flagged?: "high" | "low" | "abnormal" | null) => {
    switch (flagged) {
      case "high":
      case "low":
        return "bg-red-50 dark:bg-red-950/20";
      case "abnormal":
        return "bg-amber-50 dark:bg-amber-950/20";
      default:
        return "";
    }
  };

  return (
    <div className={`max-h-56 overflow-auto border rounded-lg ${className}`}>
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-[30%]">Parámetro</TableHead>
            <TableHead className="w-[35%]">Resultado</TableHead>
            <TableHead className="w-[35%]">Valor de referencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {labs.map((lab, index) => (
            <TableRow 
              key={index} 
              className={`${index % 2 === 1 ? 'bg-muted/5' : ''} ${getCellClassName(lab.flagged)}`}
            >
              <TableCell className="font-medium">{lab.parameter}</TableCell>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  {getFlagIcon(lab.flagged)}
                  {lab.result}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lab.reference || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LabTable;
