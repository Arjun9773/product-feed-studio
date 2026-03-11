import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, AlertTriangle, AlertCircle, Info, ChevronDown,
  ChevronUp, Zap, ShieldCheck, TrendingUp, BarChart3, CheckCircle2,
  Clock, Tag, Image, FileText, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { feedAuditIssues } from "@/data/mockData";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TOTAL_PRODUCTS = 11;

const PRIORITY_CONFIG = {
  high: {
    label: "High Priority",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    dot: "bg-destructive",
    icon: AlertTriangle,
    chartColor: "#ef4444",
    description: "Critical issues that directly impact ad performance and feed approval.",
  },
  medium: {
    label: "Medium Priority",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    dot: "bg-warning",
    icon: AlertCircle,
    chartColor: "#f59e0b",
    description: "Issues that reduce feed quality and may limit impressions.",
  },
  low: {
    label: "Low Priority",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    dot: "bg-success",
    icon: Info,
    chartColor: "#22c55e",
    description: "Minor gaps that can improve product discoverability.",
  },
  others: {
    label: "Others",
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    dot: "bg-info",
    icon: Info,
    chartColor: "#3b82f6",
    description: "Additional attributes recommended for enhanced listings.",
  },
};

const ISSUE_ICONS = {
  "No Colour": Tag,
  "No Age Group": Hash,
  "No Gender": Hash,
  "No Material": Hash,
  "Brand not in title": FileText,
  "No Google Category": BarChart3,
  "No Pattern": Tag,
  "Proper casing": FileText,
  "No Description": FileText,
  "No Short Description": FileText,
  "No GTIN": Hash,
  "No Additional Image 3": Image,
  "No Additional Image 4": Image,
};

function pct(products) {
  return Math.round((products / TOTAL_PRODUCTS) * 100);
}

function calcHealthScore() {
  const highIssues = feedAuditIssues.high.length;
  const medIssues = feedAuditIssues.medium.length;
  const penalty = highIssues * 3 + medIssues;
  const maxPenalty = 30;
  return Math.max(0, Math.round(100 - (penalty / maxPenalty) * 100));
}

function StatCard({ label, value, sub, icon: Icon, color, bg }) {
  return (
  <div className={`rounded-xl border p-3 sm:p-4 flex items-start gap-3 sm:gap-4 ${bg} border-border shadow-sm`}>
    {/* Icon Container - Scaled for mobile */}
    <div className={`p-1.5 sm:p-2 rounded-lg ${bg} shrink-0`}>
      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
    </div>

    {/* Content Container - Text sizes adjusted */}
    <div className="min-w-0 overflow-hidden">
      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-tight truncate">
        {label}
      </p>
      <p className={`text-lg sm:text-2xl font-bold mt-0.5 leading-none ${color}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight line-clamp-1">
          {sub}
        </p>
      )}
    </div>
  </div>
);
}

function IssueRow({ issue, priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  const IssueIcon = ISSUE_ICONS[issue.issue] ?? Hash;
  const p = pct(issue.products);
  const isCritical = p === 100;

  return (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4 px-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors group">
    {/* Issue Name and Icon */}
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0`}>
        <IssueIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
      </div>
      <span className="text-sm font-medium text-foreground truncate">
        {issue.issue}
      </span>
    </div>

    {/* Details Container: Products, Coverage, and Button */}
    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
      
      {/* Product Count - Hidden on very small screens, shown on sm+ */}
      <div className="w-16 sm:w-20 shrink-0 text-left sm:text-center">
        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          {issue.products} / {TOTAL_PRODUCTS}
        </span>
      </div>

      {/* Progress/Coverage - Hidden on mobile, visible on sm+ */}
      <div className="hidden xs:flex w-24 sm:w-36 shrink-0 items-center gap-2">
        <div className="flex-1">
          <Progress value={p} className="h-1.5" />
        </div>
        <span className={`text-[10px] sm:text-xs font-semibold w-8 sm:w-10 text-right ${isCritical ? cfg.color : "text-warning"}`}>
          {issue.percentage}
        </span>
      </div>

      {/* Action Button */}
      <div className="shrink-0">
        <Button
          size="sm"
          variant={priority === "high" ? "destructive" : "outline"}
          className="h-8 sm:h-7 text-xs px-4 sm:px-3 opacity-100 sm:opacity-80 group-hover:opacity-100 transition-opacity"
        >
          Fix
        </Button>
      </div>
    </div>
  </div>
);
}

function PrioritySection({ priority, issues }) {
  const [open, setOpen] = useState(priority === "high" || priority === "medium");
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg.icon;
  const resolved = 0;
  const total = issues.length;

  return (
  <div className={`rounded-xl border ${cfg.border} overflow-hidden bg-card`}>
    <button
      onClick={() => setOpen((v) => !v)}
      className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 ${cfg.bg} hover:opacity-90 transition-opacity`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
      
      {/* Label and Badge Container */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 text-left">
        <span className={`font-semibold text-sm truncate ${cfg.color}`}>{cfg.label}</span>
        <Badge variant="outline" className={`w-fit text-[10px] sm:text-xs ${cfg.color} border-current px-1`}>
          {total} issues
        </Badge>
      </div>

      <span className="ml-2 text-xs text-muted-foreground hidden lg:inline truncate">{cfg.description}</span>
      
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <span className="text-[10px] sm:text-xs text-muted-foreground">{resolved}/{total} <span className="hidden xs:inline">resolved</span></span>
        {open ? (
          <ChevronUp className={`h-4 w-4 ${cfg.color}`} />
        ) : (
          <ChevronDown className={`h-4 w-4 ${cfg.color}`} />
        )}
      </div>
    </button>

    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header - Only visible on Tablet and Desktop */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-secondary/40 border-b border-border text-[10px] uppercase font-bold text-muted-foreground">
            <div className="flex-1">Issue</div>
            <div className="w-20 text-center">Products</div>
            <div className="w-36 text-center">Coverage</div>
            <div className="w-14 text-right">Action</div>
          </div>

          {/* Issue Rows */}
          <div className="divide-y divide-border">
            {issues.map((issue, i) => (
              <IssueRow key={i} issue={issue} priority={priority} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}

export default function FeedAudit() {
  const healthScore = calcHealthScore();
  const allIssues = Object.values(feedAuditIssues).flat();
  const totalIssues = allIssues.length;

  const chartData = Object.keys(feedAuditIssues).map((k) => ({
    name: PRIORITY_CONFIG[k].label,
    value: feedAuditIssues[k].length,
    color: PRIORITY_CONFIG[k].chartColor,
  }));

  const quickWins = allIssues
    .filter((i) => parseFloat(i.percentage) < 50)
    .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))
    .slice(0, 3);

return (
  <motion.div 
    initial={{ opacity: 0, y: 12 }} 
    animate={{ opacity: 1, y: 0 }} 
    className="space-y-6 px-4 sm:px-0 pb-10"
  >
    {/* Header Section */}
    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Feed Audit</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Detected issues across your product feed — fix them to improve ad performance.
        </p>
      </div>
      <div className="flex flex-col xs:flex-row items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" className="gap-2 text-sm w-full sm:w-auto justify-center">
          <Clock className="h-4 w-4" />
          <span className="truncate">Last checked: just now</span>
        </Button>
        <Button className="bg-primary text-primary-foreground gap-2 w-full sm:w-auto justify-center">
          <RefreshCw className="h-4 w-4" />
          Audit Issue Refresh
        </Button>
      </div>
    </div>

    {/* Stat Cards Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard label="Total Issues" value={totalIssues} sub={`Across ${TOTAL_PRODUCTS} products`} icon={AlertCircle} color="text-foreground" bg="bg-secondary/50" />
      <StatCard label="High Priority" value={feedAuditIssues.high.length} sub="Immediate action" icon={AlertTriangle} color="text-destructive" bg="bg-destructive/10" />
      <StatCard label="Medium Priority" value={feedAuditIssues.medium.length} sub="Affects reach" icon={AlertCircle} color="text-warning" bg="bg-warning/10" />
      <StatCard
        label="Health Score"
        value={`${healthScore}%`}
        sub={healthScore < 75 ? "Needs work" : "Good"}
        icon={ShieldCheck}
        color={healthScore < 50 ? "text-destructive" : healthScore < 75 ? "text-warning" : "text-success"}
        bg={healthScore < 50 ? "bg-destructive/10" : healthScore < 75 ? "bg-warning/10" : "bg-success/10"}
      />
    </div>

    {/* Charts Section */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 flex flex-col gap-4 card-shadow">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Overall Feed Health</h2>
        </div>
        <div className="flex items-center justify-center py-2">
          <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
            <svg className="w-28 h-28 sm:w-32 sm:h-32 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" strokeWidth="10" className="fill-none stroke-secondary" />
              <circle
                cx="50" cy="50" r="40" strokeWidth="10"
                className="fill-none transition-all duration-500"
                stroke={healthScore < 50 ? "#ef4444" : healthScore < 75 ? "#f59e0b" : "#22c55e"}
                strokeDasharray={`${healthScore * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl sm:text-3xl font-bold">{healthScore}</p>
              <p className="text-[10px] text-muted-foreground uppercase">/ 100</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:space-y-2 sm:block">
          {Object.keys(feedAuditIssues).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_CONFIG[k].dot}`} />
              <span className="text-[10px] sm:text-xs text-muted-foreground flex-1 truncate">{PRIORITY_CONFIG[k].label}</span>
              <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">{feedAuditIssues[k].length}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 card-shadow flex flex-col min-h-[300px]">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Issue Distribution</h2>
        </div>
        <div className="flex-1 w-full h-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [`${val} issues`, name]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => <span className="text-[10px] sm:text-xs text-muted-foreground">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Quick Wins */}
    {quickWins.length > 0 && (
      <div className="bg-card border border-success/30 rounded-xl p-4 sm:p-5 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-success" />
          <h2 className="font-semibold text-sm">Quick Wins</h2>
          <Badge variant="outline" className="text-success border-success/50 text-[10px] ml-1">Easy to fix</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickWins.map((w, i) => (
            <div key={i} className="flex items-center gap-3 bg-success/5 border border-success/20 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate uppercase">{w.issue}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{w.products} products · {w.percentage}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[10px] border-success/40 text-success hover:bg-success/10 shrink-0">Fix</Button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* All Issues Table Section */}
    <div className="space-y-3">
      <h2 className="font-bold text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest px-1">Detailed Audit</h2>
      <div className="grid grid-cols-1 gap-3">
        {Object.keys(feedAuditIssues).map((priority) => (
          <PrioritySection key={priority} priority={priority} issues={feedAuditIssues[priority]} />
        ))}
      </div>
    </div>
  </motion.div>
);
}
