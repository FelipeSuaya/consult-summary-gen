
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
  title, icon, children, actions,
  collapsible = false, highlight = false, isEmpty = false,
  copyContent, className = ""
}: SectionCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!copyContent) return;
    const success = await copyToClipboard(copyContent);
    toast({
      title: success ? "Copiado" : "Error",
      description: success ? `"${title}" copiado` : "No se pudo copiar",
      variant: success ? "default" : "destructive",
    });
  };

  return (
    <div 
      className={`
        rounded-lg border bg-card overflow-hidden
        ${highlight ? 'border-primary/30 bg-accent/30' : 'border-border'}
        ${className}
        print:shadow-none print:border print:border-border
      `}
      role="region"
      aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <span 
            id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
            className="text-sm font-semibold text-foreground"
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {copyContent && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0 text-muted-foreground print:hidden">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          {collapsible && (
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-7 w-7 p-0 text-muted-foreground print:hidden">
              {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          )}
          {actions}
        </div>
      </div>
      {!isCollapsed && (
        <div className="px-4 py-3 print:break-inside-avoid">
          {isEmpty ? (
            <div className="text-xs text-muted-foreground text-center py-6">Sin datos consignados</div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};

export default SectionCard;
