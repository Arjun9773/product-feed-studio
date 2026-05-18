import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export function DateRangeFilter({ value, custom, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [fromDate, setFromDate] = useState(
    custom?.from?.toISOString().split("T")[0] || "",
  );
  const [toDate, setToDate] = useState(
    custom?.to?.toISOString().split("T")[0] || "",
  );

  const ranges = [
    { key: "last7", label: "Last 7 days" },
    { key: "last30", label: "Last 30 days" },
    { key: "last90", label: "Last 90 days" },
    { key: "custom", label: "Custom" },
  ];

  const handleApplyCustom = () => {
    if (fromDate && toDate) {
      onChange("custom", {
        from: new Date(fromDate),
        to: new Date(toDate),
      });
      setShowCustom(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ranges.map((range) => (
          <Button
            key={range.key}
            variant={value === range.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (range.key === "custom") {
                setShowCustom(true);
              } else {
                onChange(range.key);
                setShowCustom(false);
              }
            }}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {showCustom && (
        <div className="flex gap-2 p-3 border rounded-lg bg-muted/50">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded bg-background"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded bg-background"
            />
          </div>
          <div className="flex gap-1 items-end">
            <Button size="sm" onClick={handleApplyCustom}>
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCustom(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
