import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Package, AlertTriangle, AlertCircle, Heart, FileOutput,
  ArrowUpRight, ArrowDownRight, Settings, Tag, ListOrdered,
  Layers, ExternalLink, TrendingUp, Clock, Globe, Zap,
  Calendar, FileText, Link2, BarChart3, Info, Sparkles,
  RefreshCw, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

// ─── config ────────────────────────────────────────────────────────────────────
const API_BASE    = import.meta.env.VITE_API_URL || "http://localhost:5000";
const POLL_MS     = 60_000;
const DATE_RANGES = [
  { label: "Today",    value: "today"  },
  { label: "Last 7d",  value: "last7"  },
  { label: "Last 30d", value: "last30" },
  { label: "Last 90d", value: "last90" },
];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── animation ─────────────────────────────────────────────────────────────────
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
function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
function makeHeaders(token, storeId) {
  return {
    Authorization:  `Bearer ${token}`,
    "x-tenant-id":  storeId,
    "Content-Type": "application/json",
  };
}

// ─── hooks ─────────────────────────────────────────────────────────────────────
function useAuditData(token, storeId) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerRef = useRef(null);

  const fetchAudit = useCallback(async (silent = false) => {
    if (!storeId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/api/audit/feed-audit`, {
        headers: makeHeaders(token, storeId),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastUpdate(new Date().toISOString());
      } else {
        setError(json.message || "Failed to load audit");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, storeId]);

  useEffect(() => {
    fetchAudit(false);
    timerRef.current = setInterval(() => fetchAudit(true), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchAudit]);

  return { data, loading, error, lastUpdate, refetch: () => fetchAudit(false) };
}

function useProductsData(token, storeId) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchProducts = useCallback(async (silent = false) => {
    if (!storeId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/products/with-keywords`, {
        headers: makeHeaders(token, storeId),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token, storeId]);

  useEffect(() => {
    fetchProducts(false);
    timerRef.current = setInterval(() => fetchProducts(true), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchProducts]);

  return { data, loading };
}

function useOutputFeeds(token, storeId) {
  const [feeds,   setFeeds]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    fetch(`${API_BASE}/api/output-feeds`, { headers: makeHeaders(token, storeId) })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => { if (json.success) setFeeds(json.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, storeId]);

  return { feeds, loading };
}

function useTitleRules(token, storeId) {
  const [rules,   setRules]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    fetch(`${API_BASE}/api/title-rules`, { headers: makeHeaders(token, storeId) })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => {
        if (Array.isArray(json))           setRules(json);
        else if (json.success)             setRules(json.data ?? []);
        else if (Array.isArray(json.data)) setRules(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, storeId]);

  return { rules, loading };
}

function useFeedSetup(token, storeId) {
  const [setup,   setSetup]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    fetch(`${API_BASE}/api/feeds`, { headers: makeHeaders(token, storeId) })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => { if (json && json.feed_url) setSetup(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, storeId]);

  return { setup, loading };
}

// ─── derived stats ─────────────────────────────────────────────────────────────
function deriveAudit(data) {
  const empty = {
    totalProducts: 0, totalIssues: 0, healthScore: 0,
    HIGH: 0, MEDIUM: 0, LOW: 0, OTHERS: 0,
    highIssues: [], mediumIssues: [], lowIssues: [], othersIssues: [],
  };
  if (!data) return empty;
  const issues = data.issues ?? { high: [], medium: [], low: [], others: [] };
  return {
    totalProducts: data.totalProducts ?? 0,
    totalIssues:   data.totalIssues   ?? 0,
    healthScore:   data.healthScore   ?? 0,
    HIGH:    (issues.high    ?? []).length,
    MEDIUM:  (issues.medium  ?? []).length,
    LOW:     (issues.low     ?? []).length,
    OTHERS:  (issues.others  ?? []).length,
    highIssues:   issues.high    ?? [],
    mediumIssues: issues.medium  ?? [],
    lowIssues:    issues.low     ?? [],
    othersIssues: issues.others  ?? [],
  };
}

function deriveProducts(data) {
  const products    = Array.isArray(data?.products)    ? data.products    : [];
  const fieldConfig = Array.isArray(data?.fieldConfig) ? data.fieldConfig : [];
  const total       = products.length;

  const editableCols = fieldConfig
    .filter(f => !f.readonly && f.type !== "image" && f.type !== "url")
    .map(f => f.key);

  const pct = (field) =>
    total > 0 ? Math.round((products.filter(p => p[field]).length / total) * 100) : 0;

  const attributeData = [
    { name: "Brand",       complete: pct("brand")       },
    { name: "Color",       complete: pct("color")       },
    { name: "Age Group",   complete: pct("age_group")   },
    { name: "Gender",      complete: pct("gender")      },
    { name: "Material",    complete: pct("material")    },
    { name: "GTIN",        complete: pct("gtin")        },
    { name: "Category",    complete: pct("category")    },
    { name: "Description", complete: pct("description") },
  ];

  const missingAttrs = products.reduce(
    (acc, p) => acc + editableCols.filter(f => !p[f]).length, 0
  );

  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].length;
  const uniqueBrands     = [...new Set(products.map(p => p.brand).filter(Boolean))].length;

  const catBreakdown = [...new Set(products.map(p => p.category).filter(Boolean))].map(cat => ({
    cat, count: products.filter(p => p.category === cat).length,
  }));

  const fieldCompletion = [
    { field: "Color",     filled: products.filter(p => p.color).length,     total },
    { field: "Age Group", filled: products.filter(p => p.age_group).length, total },
    { field: "Gender",    filled: products.filter(p => p.gender).length,    total },
    { field: "Material",  filled: products.filter(p => p.material).length,  total },
    { field: "GTIN",      filled: products.filter(p => p.gtin).length,      total },
  ];

  const totalFields  = total * editableCols.length;
  const completeness = totalFields > 0
    ? Math.round(((totalFields - missingAttrs) / totalFields) * 100)
    : 0;

  const googleMapped   = products.filter(p => p.google_category && p.google_category.trim() !== "").length;
  const googleUnmapped = total - googleMapped;
  const googlePct      = total > 0 ? Math.round((googleMapped / total) * 100) : 0;

  const customLabels = [0, 1, 2, 3, 4].map(n => {
    const key    = `custom_label_${n}`;
    const filled = products.filter(p => p[key] && String(p[key]).trim() !== "").length;
    const unique = [...new Set(
      products.map(p => p[key]).filter(v => v && String(v).trim() !== "")
    )].slice(0, 3);
    return {
      key,
      filled,
      total,
      pct:    total > 0 ? Math.round((filled / total) * 100) : 0,
      sample: unique.join(", ") || "—",
    };
  });

  return { total, uniqueCategories, uniqueBrands, attributeData, missingAttrs, catBreakdown, fieldCompletion, completeness, googleMapped, googleUnmapped, googlePct, customLabels };
}

function deriveFeeds(feeds) {
  return {
    total:    feeds.length,
    products: feeds.reduce((s, f) => s + (f.products_total ?? 0), 0),
    pending:  feeds.filter(f => !f.is_output_setup).length,
  };
}

function deriveTitles(rules) {
  return {
    total:    rules.length,
    done:     rules.filter(r => r.status === "completed").length,
    products: rules.reduce((s, r) => s + (r.productsCount ?? 0), 0),
  };
}

// ─── small components ──────────────────────────────────────────────────────────
function Skel({ className = "" }) {
  return <div className={`animate-pulse bg-secondary rounded ${className}`} />;
}

function KpiCard({ label, value, change, up, icon: Icon, color, bg, to, loading }) {
  const inner = (
    <div className="bg-card rounded-xl p-4 sm:p-5 card-shadow border border-border h-full group-hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
        </div>
        {change !== undefined && !loading && (
          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      {loading
        ? <Skel className="h-6 sm:h-7 w-14 sm:w-16 mb-1" />
        : <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      }
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
  return to
    ? <motion.div variants={itemVariants} className="group"><Link to={to} className="block h-full">{inner}</Link></motion.div>
    : <motion.div variants={itemVariants}>{inner}</motion.div>;
}

function ModuleCard({ title, subtitle, to, icon: Icon, iconColor, iconBg, children }) {
  return (
    <motion.div variants={itemVariants} className="bg-card rounded-xl p-4 sm:p-5 card-shadow border border-border space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-foreground">{title}</h3>
            {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {to && (
          <Link to={to}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0">
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

function DateRangeSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const label = DATE_RANGES.find(d => d.value === value)?.label ?? "Select";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 sm:gap-2 text-xs bg-secondary/60 hover:bg-secondary rounded-lg px-2.5 sm:px-3 py-2 border border-border transition-colors"
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground font-medium">{label}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[130px]">
          {DATE_RANGES.map(dr => (
            <button
              key={dr.value}
              onClick={() => { onChange(dr.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-secondary ${dr.value === value ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}
            >
              {dr.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, currentStoreId } = useAuth();
  const token   = user?.token || localStorage.getItem("token");
  const storeId = currentStoreId;

  const [dateRange, setDateRange] = useState("last30");

  const { data: auditRaw, loading: auditLoading, error: auditError, lastUpdate, refetch } = useAuditData(token, storeId);
  const { data: productsRaw, loading: productsLoading } = useProductsData(token, storeId);
  const { feeds, loading: feedsLoading  } = useOutputFeeds(token, storeId);
  const { rules, loading: rulesLoading  } = useTitleRules(token, storeId);
  const { setup, loading: setupLoading  } = useFeedSetup(token, storeId);

  const audit    = deriveAudit(auditRaw);
  const products = deriveProducts(productsRaw);
  const feedStat = deriveFeeds(feeds);
  const ruleStat = deriveTitles(rules);

  const issueChartData = [
    { name: "High",   value: audit.HIGH,   color: "#ef4444" },
    { name: "Medium", value: audit.MEDIUM, color: "#f59e0b" },
    { name: "Low",    value: audit.LOW,    color: "#22c55e" },
    { name: "Others", value: audit.OTHERS, color: "#3b82f6" },
  ];

  const trendData = useMemo(() => {
    if (!storeId) return [{ month: "Now", score: 0 }];
    const key = `health_trend_${storeId}`;
    let history = [];
    try { history = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    if (!auditLoading && auditRaw && audit.healthScore > 0) {
      const now        = new Date();
      const monthLabel = MONTHS[now.getMonth()];
      const lastEntry  = history[history.length - 1];
      if (!lastEntry || lastEntry.month !== monthLabel) {
        history = [...history, { month: monthLabel, score: audit.healthScore }].slice(-6);
      } else {
        history = history.map((h, i) =>
          i === history.length - 1 ? { ...h, score: audit.healthScore } : h
        );
      }
      try { localStorage.setItem(key, JSON.stringify(history)); } catch {}
    }
    return history.length > 0
      ? history
      : [{ month: "Now", score: auditLoading ? 0 : audit.healthScore }];
  }, [auditRaw, auditLoading, audit.healthScore, storeId]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 sm:space-y-6">

      {/* ── header ── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
            Complete overview of your product feed health
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={refetch}
            disabled={auditLoading}
            className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground bg-secondary/60 hover:bg-secondary rounded-lg px-2.5 sm:px-3 py-2 border border-border transition-colors disabled:opacity-60 ml-auto sm:ml-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${auditLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{lastUpdate ? `Updated ${fmtTime(lastUpdate)}` : "Refresh"}</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* error banner */}
      {auditError && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Audit error: {auditError}
        </motion.div>
      )}

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        <KpiCard label="Total Products"     value={products.total}          icon={Package}       color="text-primary"     bg="bg-primary/10"     to="/feed-products"      loading={productsLoading} />
        <KpiCard label="Feed Health Score"  value={`${audit.healthScore}%`} icon={Heart}         color="text-success"     bg="bg-success/10"     to="/feed-audit"         loading={auditLoading} />
        <KpiCard label="Total Issues"       value={audit.totalIssues}       icon={AlertCircle}   color="text-destructive" bg="bg-destructive/10" to="/feed-audit"          loading={auditLoading}
          change={audit.HIGH > 0 ? `${audit.HIGH} high` : undefined} />
        <KpiCard label="Missing Attributes" value={products.missingAttrs}   icon={AlertTriangle} color="text-warning"     bg="bg-warning/10"     to="/field-optimization" loading={productsLoading} />
        <KpiCard label="Output Feeds"       value={feedStat.total}          icon={FileOutput}    color="text-info"        bg="bg-info/10"        to="/output-feed"        loading={feedsLoading} />
        <KpiCard label="Title Rules"        value={ruleStat.total}          icon={ListOrdered}   color="text-primary"     bg="bg-primary/10"     to="/title-optimization" loading={rulesLoading} />
      </div>

      {/* ── Feed Health + Issue Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* gauge */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-4 sm:p-6 card-shadow border border-border flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Overall Feed Health</h3>
            <Link to="/feed-audit" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-center relative">
            {auditLoading
              ? <Skel className="h-[110px] w-[110px] sm:h-[130px] sm:w-[130px] rounded-full" />
              : (
                <>
                  <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90 sm:w-[130px] sm:h-[130px]">
                    <circle cx="50" cy="50" r="40" strokeWidth="10" className="fill-none stroke-secondary" />
                    <circle
                      cx="50" cy="50" r="40" strokeWidth="10" fill="none"
                      stroke={healthColor(audit.healthScore)}
                      strokeDasharray={`${(audit.healthScore / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dasharray 0.8s ease" }}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: healthColor(audit.healthScore) }}>{audit.healthScore}</p>
                    <p className="text-xs text-muted-foreground">/ 100</p>
                  </div>
                </>
              )
            }
          </div>

          <div className="space-y-2">
            {[
              { label: "High Priority",   count: audit.HIGH,   color: "bg-destructive", text: "text-destructive" },
              { label: "Medium Priority", count: audit.MEDIUM, color: "bg-warning",     text: "text-warning"     },
              { label: "Low Priority",    count: audit.LOW,    color: "bg-success",     text: "text-success"     },
              { label: "Others",          count: audit.OTHERS, color: "bg-info",        text: "text-info"        },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${row.color}`} />
                <span className="text-xs text-muted-foreground flex-1">{row.label}</span>
                {auditLoading
                  ? <Skel className="h-4 w-14" />
                  : <Badge className={`${row.text} bg-transparent border-current text-[10px] px-1.5 py-0`}>{row.count} issues</Badge>
                }
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <PBarRow label="High Priority Fixed" value={0} max={audit.HIGH} colorClass="bg-destructive" />
          </div>
        </motion.div>

        {/* donut */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card rounded-xl p-4 sm:p-6 card-shadow border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Issue Distribution by Priority</h3>
            <Link to="/feed-audit" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          {auditLoading
            ? <div className="flex-1 flex items-center justify-center"><Skel className="h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] rounded-full" /></div>
            : (
              <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-stretch" style={{ minHeight: 200 }}>
                <div className="w-full sm:flex-1 min-h-0" style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={issueChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {issueChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} issues`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* legend */}
                <div className="sm:w-[200px] shrink-0 flex flex-row flex-wrap sm:flex-col justify-between gap-2 sm:gap-0 w-full">
                  <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-3 flex-1">
                    {issueChartData.map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                        <span className="text-xs font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="sm:pt-3 sm:border-t border-border flex items-center justify-between text-xs w-full sm:w-auto">
                    <span className="text-muted-foreground">Total Issues</span>
                    <span className="font-bold text-foreground ml-2">{audit.totalIssues}</span>
                  </div>
                </div>
              </div>
            )
          }
        </motion.div>
      </div>

      {/* ── Attribute Completeness + Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card rounded-xl p-4 sm:p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Attribute Completeness</h3>
            <Link to="/field-optimization" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          {productsLoading
            ? <Skel className="h-[200px] sm:h-[220px] w-full" />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={products.attributeData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,10%,46%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220,10%,46%)" }} domain={[0, 100]} unit="%" width={32} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Completeness"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220,13%,91%)", fontSize: 12 }}
                  />
                  <Bar dataKey="complete" radius={[5, 5, 0, 0]}>
                    {products.attributeData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={
                          e.complete === 100 ? "#22c55e"
                          : e.complete > 50  ? "#f59e0b"
                          : e.complete > 0   ? "hsl(217,91%,60%)"
                          : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card rounded-xl p-4 sm:p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Feed Health Trend</h3>
          </div>
          {auditLoading && trendData.length <= 1
            ? <Skel className="h-[200px] w-full" />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="hsl(217,91%,60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(217,91%,60%)" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220,10%,46%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220,10%,46%)" }} domain={[0, 100]} width={28} />
                  <Tooltip
                    formatter={(v) => [`${v}`, "Health Score"]}
                    contentStyle={{ borderRadius: "8px", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(217,91%,60%)"
                    fill="url(#hGrad)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(217,91%,60%)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </motion.div>
      </div>

      {/* ── Module Overview ── */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Module Overview</h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Feed Audit */}
        <ModuleCard title="Feed Audit" subtitle="Issues detected in your feed" to="/feed-audit" icon={AlertCircle} iconColor="text-destructive" iconBg="bg-destructive/10">
          {auditLoading
            ? <div className="grid grid-cols-2 gap-2 sm:gap-3">{[...Array(4)].map((_, i) => <Skel key={i} className="h-14 sm:h-16 rounded-lg" />)}</div>
            : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { label: "High",   val: audit.HIGH,   cls: "text-destructive bg-destructive/10" },
                    { label: "Medium", val: audit.MEDIUM, cls: "text-warning bg-warning/10"         },
                    { label: "Low",    val: audit.LOW,    cls: "text-success bg-success/10"         },
                    { label: "Others", val: audit.OTHERS, cls: "text-info bg-info/10"               },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg p-2.5 sm:p-3 ${item.cls.split(" ")[1]}`}>
                      <p className={`text-base sm:text-lg font-bold ${item.cls.split(" ")[0]}`}>{item.val}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label} priority</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Zap className="h-3 w-3 text-success shrink-0" />
                  Quick wins available — fix low-impact issues first
                </div>
              </>
            )
          }
        </ModuleCard>

        {/* Google Category */}
        <ModuleCard title="Google Category" subtitle="Category mapping status" to="/google-category" icon={Tag} iconColor="text-info" iconBg="bg-info/10">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mapped products</span>
              {productsLoading
                ? <Skel className="h-5 w-16" />
                : (
                  <Badge className={`border-0 text-xs ${products.googleMapped === products.total ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {products.googleMapped} / {products.total}
                  </Badge>
                )
              }
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              {productsLoading
                ? <div className="h-full bg-secondary animate-pulse rounded-full" style={{ width: "60%" }} />
                : <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${products.googlePct}%` }} />
              }
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-success/5 rounded-lg p-2 sm:p-2.5">
                {productsLoading
                  ? <Skel className="h-5 w-8 mb-1" />
                  : <p className="font-bold text-success text-sm">{products.googleMapped}</p>
                }
                <p className="text-muted-foreground text-[10px] sm:text-xs">Mapped</p>
              </div>
              <div className="bg-warning/5 rounded-lg p-2 sm:p-2.5">
                {productsLoading
                  ? <Skel className="h-5 w-8 mb-1" />
                  : <p className="font-bold text-warning text-sm">{products.googleUnmapped}</p>
                }
                <p className="text-muted-foreground text-[10px] sm:text-xs">Unmapped</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              {productsLoading ? null : products.googleUnmapped === 0
                ? <><Zap className="h-3 w-3 text-success shrink-0" />All products have Google category ✓</>
                : <><Info className="h-3 w-3 text-warning shrink-0" />{products.googleUnmapped} product{products.googleUnmapped > 1 ? "s" : ""} need mapping</>
              }
            </div>
          </div>
        </ModuleCard>

        {/* Field Optimization */}
        <ModuleCard title="Field Optimization" subtitle="Product attribute filling" to="/field-optimization" icon={Layers} iconColor="text-warning" iconBg="bg-warning/10">
          {productsLoading
            ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skel key={i} className="h-7" />)}</div>
            : (
              <>
                <div className="space-y-2 sm:space-y-2.5">
                  {products.fieldCompletion.map(f => (
                    <PBarRow key={f.field} label={f.field} value={f.filled} max={f.total} colorClass="bg-primary" />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                  Use AI Fill to speed up missing attributes
                </div>
              </>
            )
          }
        </ModuleCard>

        {/* Title Optimization */}
        <ModuleCard title="Title Optimization" subtitle="Product title rule engine" to="/title-optimization" icon={ListOrdered} iconColor="text-primary" iconBg="bg-primary/10">
          {rulesLoading
            ? <Skel className="h-32 w-full rounded-lg" />
            : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { label: "Total rules",  val: ruleStat.total,                 cls: "bg-primary/5  text-primary" },
                    { label: "Products",     val: ruleStat.products,              cls: "bg-info/10    text-info"    },
                    { label: "Completed",    val: ruleStat.done,                  cls: "bg-success/10 text-success" },
                    { label: "Not started",  val: ruleStat.total - ruleStat.done, cls: "bg-warning/10 text-warning" },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg p-2.5 sm:p-3 ${item.cls.split(" ")[0]}`}>
                      <p className={`text-lg sm:text-xl font-bold ${item.cls.split(" ")[1]}`}>{item.val}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {rules.slice(0, 4).map(r => (
                    <div key={r._id ?? r.id} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
                      <span className="flex-1 text-foreground font-medium truncate">{r.ruleName}</span>
                      <span className="text-muted-foreground shrink-0">{r.productsCount}p</span>
                      <Badge className="bg-secondary text-muted-foreground border-0 text-[10px] px-1.5 shrink-0">{r.status}</Badge>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </ModuleCard>

        {/* Output Feed */}
        <ModuleCard title="Output Feed" subtitle="Generated feed files" to="/output-feed" icon={FileOutput} iconColor="text-success" iconBg="bg-success/10">
          {feedsLoading
            ? <Skel className="h-32 w-full rounded-lg" />
            : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Feeds",    value: feedStat.total    },
                    { label: "Products", value: feedStat.products },
                    { label: "Pending",  value: feedStat.pending  },
                  ].map(item => (
                    <div key={item.label} className="bg-secondary/50 rounded-lg p-2">
                      <p className="text-base sm:text-lg font-bold text-foreground">{item.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 mt-1">
                  {feeds.slice(0, 3).map(f => (
                    <div key={f._id} className="flex items-center gap-2 sm:gap-3 bg-secondary/30 rounded-lg px-2.5 sm:px-3 py-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{f.output_feed_name}</p>
                        <p className="text-[10px] text-muted-foreground">{f.output_delivery_method || "http"} · {f.products_total ?? 0} products</p>
                      </div>
                      <Badge className={`border-0 text-[10px] px-1.5 shrink-0 ${f.is_output_setup ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {f.is_output_setup ? "Active" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </ModuleCard>

        {/* Feed Setup */}
        <ModuleCard title="Feed Setup" subtitle="Feed configuration" to="/manage-feed-setup" icon={Settings} iconColor="text-primary" iconBg="bg-primary/10">
          {setupLoading
            ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skel key={i} className="h-8" />)}</div>
            : (
              <div className="space-y-2">
                {[
                  { label: "Feed Name",     value: setup?.feed_name  || "—", icon: Settings, color: "text-primary"          },
                  { label: "Feed Format",   value: setup?.feed_type  || "—", icon: FileText, color: "text-info"             },
                  { label: "Schedule",      value: setup ? `${setup.schedule_info || "Daily"} ${setup.import_time || ""}`.trim() : "—", icon: Calendar, color: "text-warning" },
                  { label: "Import Source", value: setup?.feed_url   || "—", icon: Link2,    color: "text-success"          },
                  { label: "CMS Platform",  value: (!setup?.cms_upload_type || setup.cms_upload_type === "none") ? "None" : setup.cms_upload_type, icon: Globe, color: "text-muted-foreground" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-2 sm:gap-3 py-1.5 border-b border-border last:border-0">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                    <span className="text-xs text-muted-foreground flex-1">{label}</span>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[100px] sm:max-w-[120px]" title={value}>{value}</span>
                  </div>
                ))}
              </div>
            )
          }
        </ModuleCard>

        {/* Custom Labels */}
        <ModuleCard title="Custom Labels" subtitle="Campaign segmentation labels" to="/custom-labels" icon={Tag} iconColor="text-warning" iconBg="bg-warning/10">
          {productsLoading
            ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skel key={i} className="h-10" />)}</div>
            : (
              <>
                <div className="space-y-2 sm:space-y-3">
                  {products.customLabels.map(({ key, filled, total: t, pct, sample }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 shrink-0 text-warning" />
                          <span className="text-xs font-mono text-foreground">{key}</span>
                        </div>
                        <span className={`text-[10px] font-semibold ${filled === 0 ? "text-destructive" : filled === t ? "text-success" : "text-warning"}`}>
                          {filled}/{t}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${filled === 0 ? "bg-destructive/40" : filled === t ? "bg-success" : "bg-warning"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{sample}</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border">
                  <Sparkles className="h-3 w-3 text-purple-500 shrink-0" />
                  AI auto-fill available for all 5 labels
                </div>
              </>
            )
          }
        </ModuleCard>

        {/* Feed Product Overview */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-4 sm:p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Feed Product Overview</h3>
            <Link to="/feed-products" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          {productsLoading
            ? <div className="grid grid-cols-2 gap-2 sm:gap-3">{[...Array(4)].map((_, i) => <Skel key={i} className="h-14 sm:h-16 rounded-xl" />)}</div>
            : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {[
                    { label: "Total Products",    value: products.total,              color: "text-primary", bg: "bg-primary/5" },
                    { label: "Feed Completeness", value: `${products.completeness}%`, color: "text-info",    bg: "bg-info/5"    },
                    { label: "Categories",        value: products.uniqueCategories,   color: "text-success", bg: "bg-success/5" },
                    { label: "Brands",            value: products.uniqueBrands,       color: "text-warning", bg: "bg-warning/5" },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-2.5 sm:p-3`}>
                      <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Category breakdown</p>
                <div className="space-y-1.5 sm:space-y-2">
                  {products.catBreakdown.slice(0, 5).map(({ cat, count }) => (
                    <div key={cat} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate flex-1 max-w-[140px] sm:max-w-[200px]">{cat.split(" > ").slice(-2).join(" > ")}</span>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[60px] sm:max-w-[80px]">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${products.total > 0 ? (count / products.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-4 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </motion.div>

        {/* Critical Issues */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-4 sm:p-6 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-sm text-foreground">Critical Issues</h3>
            {!auditLoading && (
              <Badge className="bg-destructive/10 text-destructive border-0 text-xs ml-1">{audit.HIGH} high</Badge>
            )}
            <Link to="/feed-audit" className="ml-auto text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          {auditLoading
            ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skel key={i} className="h-9 sm:h-10" />)}</div>
            : (
              <>
                <div className="space-y-1.5 sm:space-y-2">
                  {audit.highIssues.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">No high priority issues 🎉</p>
                  )}
                  {audit.highIssues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 border-b border-border last:border-0">
                      <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground flex-1 truncate">{issue.issue}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{issue.products}/{audit.totalProducts}</span>
                      <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] px-1.5 shrink-0">{issue.percentage}</Badge>
                    </div>
                  ))}
                </div>
                {audit.mediumIssues.length > 0 && (
                  <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Medium priority</p>
                    <div className="space-y-1 sm:space-y-1.5">
                      {audit.mediumIssues.slice(0, 4).map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                          <span className="text-xs text-muted-foreground flex-1 truncate">{issue.issue}</span>
                          <Badge className="bg-warning/10 text-warning border-0 text-[10px] px-1.5 shrink-0">{issue.percentage}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          }
        </motion.div>

      </div>
    </motion.div>
  );
}
