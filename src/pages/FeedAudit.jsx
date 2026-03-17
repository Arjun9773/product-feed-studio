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
    <div className={`rounded-xl border p-4 flex items-start gap-4 ${bg} border-border`}>
      <div className={`p-2 rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0`}>
          <IssueIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        <span className="text-sm font-medium text-foreground truncate">{issue.issue}</span>
      </div>
      <div className="w-20 shrink-0 text-center">
        <span className="text-sm text-muted-foreground">{issue.products} / {TOTAL_PRODUCTS}</span>
      </div>
      <div className="w-36 shrink-0 flex items-center gap-2">
        <div className="flex-1">
          <Progress value={p} className="h-1.5" />
        </div>
        <span className={`text-xs font-semibold w-10 text-right ${isCritical ? cfg.color : "text-warning"}`}>
          {issue.percentage}
        </span>
      </div>
      <div className="shrink-0">
        <Button
          size="sm"
          variant={priority === "high" ? "destructive" : "outline"}
          className="h-7 text-xs opacity-80 group-hover:opacity-100 transition-opacity"
        >
          Fix
        </Button>
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
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${cfg.bg} hover:opacity-90 transition-opacity`}
      >
        <Icon className={`h-4 w-4 ${cfg.color}`} />
        <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
        <Badge variant="outline" className={`ml-1 text-xs ${cfg.color} border-current`}>
          {total} issues
        </Badge>
        <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">{cfg.description}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{resolved}/{total} resolved</span>
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
            <div className="flex items-center gap-4 px-4 py-2 bg-secondary/40 border-b border-border text-xs text-muted-foreground font-medium">
              <div className="flex-1">Issue</div>
              <div className="w-20 text-center">Products</div>
              <div className="w-36">Coverage</div>
              <div className="w-14">Action</div>
            </div>
            {issues.map((issue, i) => (
              <IssueRow key={i} issue={issue} priority={priority} />
            ))}
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Detected issues across your product feed — fix them to improve ad performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Last checked: just now
          </Button>
          <Button className="bg-primary text-primary-foreground gap-2">
            <RefreshCw className="h-4 w-4" />
            Audit Issue Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Issues" value={totalIssues} sub={`Across ${TOTAL_PRODUCTS} products`} icon={AlertCircle} color="text-foreground" bg="bg-secondary/50" />
        <StatCard label="High Priority" value={feedAuditIssues.high.length} sub="Need immediate action" icon={AlertTriangle} color="text-destructive" bg="bg-destructive/10" />
        <StatCard label="Medium Priority" value={feedAuditIssues.medium.length} sub="Affects impressions" icon={AlertCircle} color="text-warning" bg="bg-warning/10" />
        <StatCard
          label="Feed Health Score"
          value={`${healthScore}%`}
          sub={healthScore < 50 ? "Needs improvement" : healthScore < 75 ? "Fair" : "Good"}
          icon={ShieldCheck}
          color={healthScore < 50 ? "text-destructive" : healthScore < 75 ? "text-warning" : "text-success"}
          bg={healthScore < 50 ? "bg-destructive/10" : healthScore < 75 ? "bg-warning/10" : "bg-success/10"}
        />
      </div>

      {quickWins.length > 0 && (
        <div className="bg-card border border-success/30 rounded-xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-success" />
            <h2 className="font-semibold text-sm">Quick Wins</h2>
            <Badge variant="outline" className="text-success border-success/50 text-xs ml-1">Easiest to fix</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickWins.map((w, i) => (
              <div key={i} className="flex items-center gap-3 bg-success/5 border border-success/20 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.issue}</p>
                  <p className="text-xs text-muted-foreground">{w.products} products · {w.percentage}</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs border-success/40 text-success hover:bg-success/10 shrink-0">Fix</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide px-1">All Issues</h2>
        {Object.keys(feedAuditIssues).map((priority) => (
          <PrioritySection key={priority} priority={priority} issues={feedAuditIssues[priority]} />
        ))}
      </div>

    </motion.div>
  );
}
