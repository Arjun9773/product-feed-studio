import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { auditData } from "@/data/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const severityColors: Record<string, string> = {
  critical: "text-destructive bg-destructive/10",
  high: "text-warning bg-warning/10",
  medium: "text-info bg-info/10",
  low: "text-success bg-success/10",
};

export default function FeedAudit() {
  const pieData = [
    { name: "Healthy", value: auditData.healthScore },
    { name: "Issues", value: 100 - auditData.healthScore },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed Audit</h1>
        <p className="text-muted-foreground text-sm mt-1">Analyze your feed quality and fix issues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="bg-card rounded-xl p-6 card-shadow border border-border text-center">
          <h3 className="font-semibold text-foreground mb-4">Feed Health Score</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} startAngle={90} endAngle={-270} dataKey="value">
                <Cell fill="hsl(142, 71%, 45%)" />
                <Cell fill="hsl(220, 13%, 91%)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <p className="text-4xl font-bold text-foreground -mt-4">{auditData.healthScore}%</p>
          <p className="text-sm text-muted-foreground mt-1">Overall feed quality</p>
        </div>

        {/* Issues List */}
        <div className="lg:col-span-2 bg-card rounded-xl card-shadow border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Issues Found</h3>
            <span className="text-sm text-muted-foreground">{auditData.totalProducts} products scanned</span>
          </div>
          <div className="divide-y divide-border">
            {auditData.issues.map((issue) => (
              <button key={issue.label} className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${severityColors[issue.severity]}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground">{issue.label}</p>
                    <span className="text-sm font-semibold text-foreground">{issue.count} products</span>
                  </div>
                  <Progress value={issue.count > 0 ? (issue.count / auditData.totalProducts) * 100 : 0} className="h-1.5" />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
