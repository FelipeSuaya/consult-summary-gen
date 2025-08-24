import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FlaskConical, 
  Copy,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/utils/format";
import { useToast } from "@/components/ui/use-toast";

interface LabResult {
  parameter: string;
  result: string;
  reference?: string;
  flagged?: "high" | "low" | "abnormal" | null;
  unit?: string;
}

interface LabCardProps {
  labs: LabResult[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const LabCard = ({ 
  labs, 
  title = "Laboratorio", 
  subtitle,
  className = "" 
}: LabCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const content = labs.map(lab => 
      `${lab.parameter}: ${lab.result}${lab.unit ? ` ${lab.unit}` : ''} ${lab.reference ? `(Ref: ${lab.reference})` : ''}`
    ).join('\n');
    
    const success = await copyToClipboard(content);
    toast({
      title: success ? "Copiado" : "Error",
      description: success ? "Resultados de laboratorio copiados" : "No se pudo copiar",
      variant: success ? "default" : "destructive",
    });
  };

  const getFlagIcon = (flagged?: "high" | "low" | "abnormal" | null) => {
    switch (flagged) {
      case "high":
        return <TrendingUp className="h-3 w-3 text-red-600" />;
      case "low":
        return <TrendingDown className="h-3 w-3 text-blue-600" />;
      case "abnormal":
        return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      default:
        return null;
    }
  };

  const getFlagColor = (flagged?: "high" | "low" | "abnormal" | null) => {
    switch (flagged) {
      case "high":
        return "bg-red-50 border-l-red-400 dark:bg-red-950/20 dark:border-l-red-600";
      case "low":
        return "bg-blue-50 border-l-blue-400 dark:bg-blue-950/20 dark:border-l-blue-600";
      case "abnormal":
        return "bg-amber-50 border-l-amber-400 dark:bg-amber-950/20 dark:border-l-amber-600";
      default:
        return "border-l-transparent";
    }
  };

  const getBadgeVariant = (flagged?: "high" | "low" | "abnormal" | null) => {
    return flagged ? "destructive" : "secondary";
  };

  if (!labs.length) {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </div>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin resultados de laboratorio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2 text-xs print:hidden"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0 print:hidden"
            >
              {isCollapsed ? "+" : "−"}
            </Button>
          </div>
        </div>
        
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {labs.map((lab, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border-l-4 transition-colors ${getFlagColor(lab.flagged)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{lab.parameter}</span>
                    {lab.flagged && getFlagIcon(lab.flagged)}
                  </div>
                  {lab.reference && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Referencia: {lab.reference}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={getBadgeVariant(lab.flagged)}
                    className="font-mono text-sm"
                  >
                    {lab.result}
                    {lab.unit && <span className="ml-1">{lab.unit}</span>}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LabCard;