
import { Badge } from "@/components/ui/badge";

interface KeyChipsProps {
  items: Array<{
    label: string;
    value: string;
    unit?: string;
    flagged?: "high" | "low" | "abnormal" | null;
  }>;
  className?: string;
}

const KeyChips = ({ items, className = "" }: KeyChipsProps) => {
  const getVariant = (flagged?: "high" | "low" | "abnormal" | null) => {
    switch (flagged) {
      case "high":
      case "low":
      case "abnormal":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, index) => (
        <Badge
          key={index}
          variant={getVariant(item.flagged)}
          className="font-mono text-sm"
        >
          {item.label}: {item.value}{item.unit ? ` ${item.unit}` : ''}
        </Badge>
      ))}
    </div>
  );
};

export default KeyChips;
