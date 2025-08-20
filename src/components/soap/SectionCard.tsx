
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/utils/format";
import { useToast } from "@/components/ui/use-toast";

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  collapsible?: boolean;
  highlight?: boolean;
  isEmpty?: boolean;
  copyContent?: string;
  className?: string;
}

const SectionCard = ({ 
  title, 
  icon, 
  children, 
  actions,
  collapsible = false,
  highlight = false,
  isEmpty = false,
  copyContent,
  className = ""
}: SectionCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!copyContent) return;
    
    const success = await copyToClipboard(copyContent);
    toast({
      title: success ? "Copiado" : "Error",
      description: success ? `Sección "${title}" copiada al portapapeles` : "No se pudo copiar al portapapeles",
      variant: success ? "default" : "destructive",
    });
  };

  return (
    <Card 
      className={`
        ${highlight ? 'ring-2 ring-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : ''}
        ${className}
        print:shadow-none print:border print:border-gray-300
      `}
      role="region"
      aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <CardHeader className="pb-3">
        <CardTitle 
          id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="flex items-center justify-between text-lg md:text-xl font-semibold"
        >
          <div className="flex items-center gap-2">
            <div className="text-blue-600">{icon}</div>
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {copyContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0 print:hidden"
                aria-label={`Copiar sección ${title}`}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0 print:hidden"
                aria-label={isCollapsed ? "Expandir sección" : "Colapsar sección"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
            {actions}
          </div>
        </CardTitle>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="pt-0 print:break-inside-avoid">
          {isEmpty ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Sin datos consignados
            </div>
          ) : (
            children
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SectionCard;
