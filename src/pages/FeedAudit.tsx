import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { feedAuditIssues } from "@/data/mockData";

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-destructive/10", text: "text-destructive", label: "Priority: High" },
  medium: { bg: "bg-warning/10", text: "text-warning", label: "Priority: Medium" },
  low: { bg: "bg-success/10", text: "text-success", label: "Priority: Low" },
  others: { bg: "bg-info/10", text: "text-info", label: "Priority: Others" },
};

export default function FeedAudit() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">This shows the current feed issues we've detected</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2">
          <RefreshCw className="h-4 w-4" />
          Audit Issue Refresh
        </Button>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="p-4 text-left text-muted-foreground font-medium">Issue</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Products</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Product %</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(feedAuditIssues).map(([priority, issues]) => {
              const style = priorityStyles[priority];
              return (
                <> 
                  <tr key={`header-${priority}`}>
                    <td colSpan={4} className={`px-4 py-2.5 font-semibold text-sm ${style.bg} ${style.text}`}>
                      {style.label}
                    </td>
                  </tr>
                  {issues.map((issue, idx) => (
                    <tr key={`${priority}-${idx}`} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-foreground">{issue.issue}</td>
                      <td className="px-4 py-3 text-foreground">{issue.products}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${issue.percentage === "100%" ? "text-destructive" : "text-warning"}`}>
                          {issue.percentage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="destructive" className="h-7 text-xs">
                          Fix
                        </Button>
                      </td>
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
