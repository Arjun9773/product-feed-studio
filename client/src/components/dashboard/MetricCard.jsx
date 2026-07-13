import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricCard({ label, value, delta, icon: Icon, loading }) {
  return (
    <Card>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {delta !== undefined && (
              <p
                className={`text-xs ${delta >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {delta >= 0 ? "↑" : "↓"} {Math.abs((delta * 100).toFixed(1))}%
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
