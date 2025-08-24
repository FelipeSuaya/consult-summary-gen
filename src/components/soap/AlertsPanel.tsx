import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface Alert {
  type: "warning" | "danger" | "info";
  text: string;
  priority?: "high" | "medium" | "low";
}

interface AlertsPanelProps {
  alerts: Alert[];
  className?: string;
}

const AlertsPanel = ({ alerts, className = "" }: AlertsPanelProps) => {
  if (!alerts.length) return null;

  const getAlertConfig = (type: Alert["type"]) => {
    switch (type) {
      case "danger":
        return {
          icon: AlertCircle,
          className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800",
        };
      case "info":
        return {
          icon: Info,
          className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800",
        };
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || "low"];
    const bPriority = priorityOrder[b.priority || "low"];
    return bPriority - aPriority;
  });

  return (
    <div className={`flex flex-wrap gap-2 justify-end ${className}`}>
      {sortedAlerts.map((alert, index) => {
        const { icon: Icon, className: alertClass } = getAlertConfig(alert.type);
        
        return (
          <Badge
            key={index}
            variant="outline"
            className={`${alertClass} flex items-center gap-1 text-xs font-medium px-2 py-1 animate-pulse-once`}
          >
            <Icon className="h-3 w-3" />
            {alert.text}
          </Badge>
        );
      })}
    </div>
  );
};

export default AlertsPanel;