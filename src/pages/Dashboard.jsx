import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Package, AlertTriangle, AlertCircle, Heart, FileOutput,
  ArrowUpRight, ArrowDownRight, Settings, Tag, ListOrdered,
  LayoutGrid, ShieldCheck, Layers, ExternalLink, TrendingUp,
  CheckCircle2, Clock, Globe, Zap, Calendar, FileText, Link2, BarChart3, Info, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  mockProducts, outputFeeds, titleOptRules, feedAuditIssues, googleCategories,
} from "@/data/mockData";

// ─── computed constants ─────────────────────────────────────────────────────────

const TOTAL_PRODUCTS      = mockProducts.length;
const HIGH_ISSUES         = feedAuditIssues.high.length;
const MEDIUM_ISSUES       = feedAuditIssues.medium.length;
const LOW_ISSUES          = feedAuditIssues.low.length;
const OTHERS_ISSUES       = feedAuditIssues.others.length;
const TOTAL_ISSUES        = HIGH_ISSUES + MEDIUM_ISSUES + LOW_ISSUES + OTHERS_ISSUES;
const HEALTH_SCORE        = Math.max(0, Math.round(100 - ((HIGH_ISSUES * 3 + MEDIUM_ISSUES) / 30) * 100));
const MISSING_ATTRS       = 67;
const UNIQUE_CATEGORIES   = [...new Set(mockProducts.map((p) => p.category).filter(Boolean))].length;
const UNIQUE_BRANDS       = [...new Set(mockProducts.map((p) => p.brand).filter(Boolean))].length;
const TITLE_RULES_TOTAL   = titleOptRules.length;
const TITLE_RULES_DONE    = titleOptRules.filter((r) => r.status === "completed").length;
const TITLE_PRODUCTS      = titleOptRules.reduce((s, r) => s + r.productsCount, 0);
const OUTPUT_FEEDS_TOTAL  = outputFeeds.length;
const OUTPUT_PRODUCTS     = outputFeeds.reduce((s, f) => s + f.products, 0);
const PENDING_BUILDS      = outputFeeds.filter((f) => f.status === "Not yet built").length;

// ─── chart data ────────────────────────────────────────────────────────────────

const attributeData = [
  { name: "Brand",       complete: Math.round((mockProducts.filter((p) => p.brand).length    / TOTAL_PRODUCTS) * 100) },
  { name: "Color",       complete: Math.round((mockProducts.filter((p) => p.color).length    / TOTAL_PRODUCTS) * 100) },
  { name: "Age Group",   complete: Math.round((mockProducts.filter((p) => p.ageGroup).length / TOTAL_PRODUCTS) * 100) },
  { name: "Gender",      complete: Math.round((mockProducts.filter((p) => p.gender).length   / TOTAL_PRODUCTS) * 100) },
  { name: "Material",    complete: Math.round((mockProducts.filter((p) => p.material).length / TOTAL_PRODUCTS) * 100) },
  { name: "GTIN",        complete: Math.round((mockProducts.filter((p) => p.gtin).length     / TOTAL_PRODUCTS) * 100) },
  { name: "Category",    complete: Math.round((mockProducts.filter((p) => p.category).length / TOTAL_PRODUCTS) * 100) },
  { name: "Description", complete: 0 },
];

const issueChartData = [
  { name: "High",   value: HIGH_ISSUES,   color: "#ef4444" },
  { name: "Medium", value: MEDIUM_ISSUES, color: "#f59e0b" },
  { name: "Low",    value: LOW_ISSUES,    color: "#22c55e" },
  { name: "Others", value: OTHERS_ISSUES, color: "#3b82f6" },
];

const trendData = [
  { month: "Jan", score: 12 },
  { month: "Feb", score: 14 },
  { month: "Mar", score: 15 },
  { month: "Apr", score: 16 },
  { month: "May", score: 17 },
  { month: "Jun", score: 18 },
];

const fieldCompletionData = [
  { field: "Color",     filled: 0, total: TOTAL_PRODUCTS },
  { field: "Age Group", filled: 0, total: TOTAL_PRODUCTS },
  { field: "Gender",    filled: 0, total: TOTAL_PRODUCTS },
  { field: "Material",  filled: 0, total: TOTAL_PRODUCTS },
  { field: "Pattern",   filled: 0, total: TOTAL_PRODUCTS },
  { field: "GTIN",      filled: 0, total: TOTAL_PRODUCTS },
];

// ─── animation presets ─────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── helpers ───────────────────────────────────────────────────────────────────

function healthColor(score) {
  if (score < 40) return "#ef4444";
  if (score < 65) return "#f59e0b";
  return "#22c55e";
}

function HealthGauge({ score, size = 120 }) {
  const r    = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} strokeWidth="10" className="fill-none stroke-secondary" />
        <circle
          cx="50" cy="50" r={r} strokeWidth="10"
          fill="none"
          stroke={healthColor(score)}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="-mt-[${size / 2 + 4}px] absolute flex flex-col items-center" style={{ marginTop: -(size / 2 + 4) }}>
        <span className="text-2xl font-bold" style={{ color: healthColor(score) }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, change, up, icon: Icon, color, bg, to }) {
  const inner = (
    <div className="bg-card rounded-xl p-5 card-shadow border border-border h-full group-hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
  if (to) {
    return (
      <motion.div variants={itemVariants} className="group">
        <Link to={to} className="block h-full">{inner}</Link>
      </motion.div>
    );
  }
  return <motion.div variants={itemVariants}>{inner}</motion.div>;
}

function ModuleCard({ title, subtitle, to, icon: Icon, iconColor, iconBg, children }) {
  return (
    <motion.div variants={itemVariants} className="bg-card rounded-xl p-5 card-shadow border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {to && (
          <Link to={to}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function PBarRow({ label, value, max, colorClass = "bg-primary" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* ── header ── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete overview of your product feed health across all modules
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2">
          <Clock className="h-3.5 w-3.5" />
          Last updated: just now
        </div>
      </motion.div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Products"     value={TOTAL_PRODUCTS}    change="+2"  up={true}  icon={Package}      color="text-primary"     bg="bg-primary/10"     to="/feed-products" />
        <KpiCard label="Feed Health Score"  value={`${HEALTH_SCORE}%`} change="+2%" up={true}  icon={Heart}        color="text-success"     bg="bg-success/10"     to="/feed-audit" />
        <KpiCard label="Total Issues"       value={TOTAL_ISSUES}      change={`${HIGH_ISSUES} high`} up={false} icon={AlertCircle} color="text-destructive" bg="bg-destructive/10" to="/feed-audit" />
        <KpiCard label="Missing Attributes" value={MISSING_ATTRS}     change="-3"  up={false} icon={AlertTriangle} color="text-warning"     bg="bg-warning/10"     to="/field-optimization" />
        <KpiCard label="Output Feeds"       value={OUTPUT_FEEDS_TOTAL} change="0"  up={true}  icon={FileOutput}   color="text-info"        bg="bg-info/10"        to="/output-feed" />
        <KpiCard label="Title Rules"        value={TITLE_RULES_TOTAL} change="0"   up={true}  icon={ListOrdered}  color="text-primary"     bg="bg-primary/10"     to="/title-optimization" />
      </div>

      {/* ── Feed Health + Issue Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* health gauge card */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 card-shadow border border-border flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Overall Feed Health</h3>
            <Link to="/feed-audit" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* gauge */}
          <div className="flex items-center justify-center relative">
            <svg width="130" height="130" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="40" strokeWidth="10" className="fill-none stroke-secondary" />
              <circle
                cx="50" cy="50" r="40" strokeWidth="10"
                fill="none"
                stroke={healthColor(HEALTH_SCORE)}
                strokeDasharray={`${(HEALTH_SCORE / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-bold" style={{ color: healthColor(HEALTH_SCORE) }}>{HEALTH_SCORE}</p>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
          </div>

          {/* issue breakdown */}
          <div className="space-y-2.5">
            {[
              { label: "High Priority",   count: HIGH_ISSUES,   color: "bg-destructive", text: "text-destructive" },
              { label: "Medium Priority", count: MEDIUM_ISSUES, color: "bg-warning",     text: "text-warning" },
              { label: "Low Priority",    count: LOW_ISSUES,    color: "bg-success",     text: "text-success" },
              { label: "Others",          count: OTHERS_ISSUES, color: "bg-info",        text: "text-info" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${row.color}`} />
                <span className="text-xs text-muted-foreground flex-1">{row.label}</span>
                <Badge className={`${row.text} bg-transparent border-current text-[10px] px-1.5 py-0`}>{row.count} issues</Badge>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <PBarRow label="High Priority Fixed" value={0} max={HIGH_ISSUES} colorClass="bg-destructive" />
          </div>
        </motion.div>

        {/* issue distribution donut */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card rounded-xl p-6 card-shadow border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Issue Distribution by Priority</h3>
            <Link to="/feed-audit" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex-1 flex gap-6 items-stretch">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={issueChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                    {issueChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} issues`, name]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-[200px] shrink-0 flex flex-col justify-between">
              <div className="space-y-3">
                {issueChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-sm text-muted-foreground flex-1">{item.name} Priority</span>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Issues</span>
                <span className="font-bold text-foreground">{TOTAL_ISSUES}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Attribute Completeness + Feed Health Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card rounded-xl p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Attribute Completeness</h3>
            <Link to="/field-optimization" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attributeData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(v) => [`${v}%`, "Completeness"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220, 13%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
              />
              <Bar dataKey="complete" radius={[6, 6, 0, 0]}>
                {attributeData.map((entry, i) => (
                  <Cell key={i} fill={entry.complete === 100 ? "#22c55e" : entry.complete > 50 ? "#f59e0b" : entry.complete > 0 ? "hsl(217, 91%, 60%)" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Feed Health Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="dashHealthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} domain={[0, 30]} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="hsl(217, 91%, 60%)" fill="url(#dashHealthGrad)" strokeWidth={2} dot={{ r: 3, fill: "hsl(217, 91%, 60%)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Module Overview Cards ── */}
      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Module Overview</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Feed Audit */}
        <ModuleCard title="Feed Audit" subtitle="Issues detected in your feed" to="/feed-audit" icon={AlertCircle} iconColor="text-destructive" iconBg="bg-destructive/10">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "High",   val: HIGH_ISSUES,   cls: "text-destructive bg-destructive/10" },
              { label: "Medium", val: MEDIUM_ISSUES, cls: "text-warning bg-warning/10" },
              { label: "Low",    val: LOW_ISSUES,    cls: "text-success bg-success/10" },
              { label: "Others", val: OTHERS_ISSUES, cls: "text-info bg-info/10" },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg p-3 ${item.cls.split(" ")[1]}`}>
                <p className={`text-lg font-bold ${item.cls.split(" ")[0]}`}>{item.val}</p>
                <p className="text-xs text-muted-foreground">{item.label} priority</p>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <Zap className="h-3 w-3 text-success" />
            Quick wins available — fix low-impact issues first
          </div>
        </ModuleCard>

        {/* Google Category */}
        <ModuleCard title="Google Category" subtitle="Category mapping status" to="/google-category" icon={Tag} iconColor="text-info" iconBg="bg-info/10">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mapped products</span>
              <Badge className="bg-destructive/10 text-destructive border-0 text-xs">0 / {TOTAL_PRODUCTS}</Badge>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-secondary/50 rounded-lg p-2.5">
                <p className="font-bold text-foreground text-sm">{TOTAL_PRODUCTS}</p>
                <p className="text-muted-foreground">To categorize</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2.5">
                <p className="font-bold text-foreground text-sm">{googleCategories.length}</p>
                <p className="text-muted-foreground">Available categories</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3 w-3 text-warning" />
              All products need Google category mapping
            </div>
          </div>
        </ModuleCard>

        {/* Field Optimization */}
        <ModuleCard title="Field Optimization" subtitle="Product attribute filling" to="/field-optimization" icon={Layers} iconColor="text-warning" iconBg="bg-warning/10">
          <div className="space-y-2.5">
            {fieldCompletionData.map((f) => (
              <PBarRow key={f.field} label={f.field} value={f.filled} max={f.total} colorClass="bg-primary" />
            ))}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            All {fieldCompletionData.length} fields are empty — use AI Fill to speed up
          </div>
        </ModuleCard>

        {/* Title Optimization */}
        <ModuleCard title="Title Optimization" subtitle="Product title rule engine" to="/title-optimization" icon={ListOrdered} iconColor="text-primary" iconBg="bg-primary/10">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-xl font-bold text-primary">{TITLE_RULES_TOTAL}</p>
              <p className="text-xs text-muted-foreground">Total rules</p>
            </div>
            <div className="bg-info/10 rounded-lg p-3">
              <p className="text-xl font-bold text-info">{TITLE_PRODUCTS}</p>
              <p className="text-xs text-muted-foreground">Products covered</p>
            </div>
            <div className="bg-success/10 rounded-lg p-3">
              <p className="text-xl font-bold text-success">{TITLE_RULES_DONE}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="bg-warning/10 rounded-lg p-3">
              <p className="text-xl font-bold text-warning">{TITLE_RULES_TOTAL - TITLE_RULES_DONE}</p>
              <p className="text-xs text-muted-foreground">Not started</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {titleOptRules.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
                <span className="flex-1 text-foreground font-medium truncate">{r.ruleName}</span>
                <span className="text-muted-foreground">{r.productsCount} products</span>
                <Badge className="bg-secondary text-muted-foreground border-0 text-[10px] px-1.5">{r.status}</Badge>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Output Feed */}
        <ModuleCard title="Output Feed" subtitle="Generated feed files" to="/output-feed" icon={FileOutput} iconColor="text-success" iconBg="bg-success/10">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Feeds", value: OUTPUT_FEEDS_TOTAL },
              { label: "Products", value: OUTPUT_PRODUCTS },
              { label: "Pending", value: PENDING_BUILDS },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/50 rounded-lg p-2.5">
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-1">
            {outputFeeds.map((f) => (
              <div key={f.id} className="flex items-center gap-3 bg-secondary/30 rounded-lg px-3 py-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{f.feedName}</p>
                  <p className="text-[10px] text-muted-foreground">{f.deliveryMethod} · {f.products} products</p>
                </div>
                <Badge className="bg-warning/10 text-warning border-0 text-[10px] px-1.5">{f.status}</Badge>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Manage Feed Setup */}
        <ModuleCard title="Feed Setup" subtitle="Feed configuration" to="/manage-feed-setup" icon={Settings} iconColor="text-primary" iconBg="bg-primary/10">
          <div className="space-y-2.5">
            {[
              { label: "Feed Name",    value: "Gmc",         icon: Settings,  color: "text-primary" },
              { label: "Feed Format",  value: "JSON",        icon: FileText,  color: "text-info" },
              { label: "Schedule",     value: "Daily 06:00", icon: Calendar,  color: "text-warning" },
              { label: "Import Source",value: "HTTP URL",    icon: Link2,     color: "text-success" },
              { label: "CMS Platform", value: "None",        icon: Globe,     color: "text-muted-foreground" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                <span className="text-xs text-muted-foreground flex-1">{label}</span>
                <span className="text-xs font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Custom Labels */}
        <ModuleCard title="Custom Labels" subtitle="Campaign segmentation labels" to="/custom-labels" icon={Tag} iconColor="text-warning" iconBg="bg-warning/10">
          <div className="space-y-2.5">
            {[
              { label: "custom_label_0", strategy: "Price Segment",    example: "Budget / Premium" },
              { label: "custom_label_1", strategy: "Category Group",   example: "TV / AC / Phone" },
              { label: "custom_label_2", strategy: "Brand Tier",       example: "Premium / Value" },
              { label: "custom_label_3", strategy: "Sale Eligibility", example: "On Sale / Regular" },
              { label: "custom_label_4", strategy: "Campaign Season",  example: "Summer 2024" },
            ].map(({ label, strategy, example }) => (
              <div key={label} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                <Tag className="h-3 w-3 shrink-0 text-warning" />
                <span className="text-xs font-mono text-foreground w-[110px] shrink-0">{label}</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">{example}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <Sparkles className="h-3 w-3 text-purple-500" />
            AI auto-fill available for all 5 labels
          </div>
        </ModuleCard>

      </div>

      {/* ── Product Feed Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Products overview */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Feed Product Overview</h3>
            <Link to="/feed-products" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Total Products",    value: TOTAL_PRODUCTS, color: "text-primary",    bg: "bg-primary/5" },
              { label: "Feed Completeness", value: "18%",          color: "text-info",       bg: "bg-info/5" },
              { label: "Categories",        value: UNIQUE_CATEGORIES, color: "text-success", bg: "bg-success/5" },
              { label: "Brands",            value: UNIQUE_BRANDS,  color: "text-warning",    bg: "bg-warning/5" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Category breakdown</p>
            {[...new Set(mockProducts.map((p) => p.category).filter(Boolean))].map((cat) => {
              const count = mockProducts.filter((p) => p.category === cat).length;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground truncate flex-1 max-w-[200px]">{cat.split(" > ").slice(-2).join(" > ")}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[80px]">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(count / TOTAL_PRODUCTS) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-foreground w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* High priority issues */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-sm text-foreground">Critical Issues</h3>
            <Badge className="bg-destructive/10 text-destructive border-0 text-xs ml-1">{HIGH_ISSUES} high priority</Badge>
            <Link to="/feed-audit" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {feedAuditIssues.high.map((issue, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                <span className="text-sm text-foreground flex-1">{issue.issue}</span>
                <span className="text-xs text-muted-foreground">{issue.products}/{TOTAL_PRODUCTS}</span>
                <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] px-1.5">{issue.percentage}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Medium priority</p>
            <div className="space-y-1.5">
              {feedAuditIssues.medium.map((issue, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                  <span className="text-xs text-muted-foreground flex-1">{issue.issue}</span>
                  <Badge className="bg-warning/10 text-warning border-0 text-[10px] px-1.5">{issue.percentage}</Badge>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── Quick Action Footer ── */}
      <motion.div variants={itemVariants} className="bg-card rounded-xl p-5 card-shadow border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-success" />
          <h3 className="font-semibold text-sm text-foreground">Quick Navigation</h3>
          <span className="text-xs text-muted-foreground ml-1">Jump to any module to start optimizing</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: "Feed Products",      to: "/feed-products",       icon: Package,      color: "text-primary",     bg: "bg-primary/10" },
            { label: "Feed Audit",         to: "/feed-audit",          icon: AlertCircle,  color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Google Category",    to: "/google-category",     icon: Tag,          color: "text-info",        bg: "bg-info/10" },
            { label: "Field Optimization", to: "/field-optimization",  icon: Layers,       color: "text-warning",     bg: "bg-warning/10" },
            { label: "Title Optimization", to: "/title-optimization",  icon: ListOrdered,  color: "text-primary",     bg: "bg-primary/10" },
            { label: "Output Feed",        to: "/output-feed",         icon: FileOutput,   color: "text-success",     bg: "bg-success/10" },
            { label: "Custom Labels",      to: "/custom-labels",       icon: Tag,          color: "text-warning",     bg: "bg-warning/10" },
          ].map((nav) => (
            <Link key={nav.to} to={nav.to}
              className="flex flex-col items-center gap-2 rounded-xl p-3 border border-border hover:border-primary/40 hover:bg-secondary/50 transition-all group text-center">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${nav.bg} group-hover:scale-110 transition-transform`}>
                <nav.icon className={`h-4.5 w-4.5 ${nav.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">{nav.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
