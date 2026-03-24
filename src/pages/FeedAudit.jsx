import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, AlertTriangle, AlertCircle, Info, ChevronDown,
  ChevronUp, Zap, ShieldCheck, CheckCircle2, Clock, Tag,
  Image, FileText, Hash, Loader2, BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// CONFIG
// ============================================
const PRIORITY_CONFIG = {
  high: {
    label:       "High Priority",
    color:       "text-destructive",
    bg:          "bg-destructive/10",
    border:      "border-destructive/30",
    icon:        AlertTriangle,
    chartColor:  "#ef4444",
    description: "Critical issues that directly impact ad performance and feed approval.",
  },
  medium: {
    label:       "Medium Priority",
    color:       "text-warning",
    bg:          "bg-warning/10",
    border:      "border-warning/30",
    icon:        AlertCircle,
    chartColor:  "#f59e0b",
    description: "Issues that reduce feed quality and may limit impressions.",
  },
  low: {
    label:       "Low Priority",
    color:       "text-success",
    bg:          "bg-success/10",
    border:      "border-success/30",
    icon:        Info,
    chartColor:  "#22c55e",
    description: "Minor gaps that can improve product discoverability.",
  },
  others: {
    label:       "Others",
    color:       "text-blue-500",
    bg:          "bg-blue-500/10",
    border:      "border-blue-500/30",
    icon:        Info,
    chartColor:  "#3b82f6",
    description: "Additional attributes recommended for enhanced listings.",
  },
};

// ✅ Dynamic icon map by field — no hardcoded issue label matching needed
const FIELD_ICONS = {
  color:              Tag,
  age_group:          Hash,
  gender:             Hash,
  material:           Hash,
  pattern:            Tag,
  brand:              Tag,
  product_name:       FileText,
  google_category:    BarChart3,
  description:        FileText,
  short_description:  FileText,
  ean_id:             Hash,
  meta_title:         FileText,
  url_key:            FileText,
  bl_size:            Hash,
  bl_upc:             Hash,
  sku_variation:      Hash,
  quantity:           Hash,
  was_price:          Hash,
  product_highlight1: FileText,
  product_highlight2: FileText,
  product_highlight3: FileText,
  product_highlight4: FileText,
  product_highlight5: FileText,
  additional_image1:  Image,
  additional_image2:  Image,
  additional_image3:  Image,
  additional_image4:  Image,
  additional_image5:  Image,
  additional_image6:  Image,
  additional_image7:  Image,
  additional_image8:  Image,
};

// ============================================
// STAT CARD
// ============================================
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

// ============================================
// ISSUE ROW
// ============================================
function IssueRow({ issue, priority, totalProducts, onFix }) {
  const cfg = PRIORITY_CONFIG[priority];

  // ✅ Use field to get icon — dynamic, no hardcoded label matching
  const IssueIcon = FIELD_ICONS[issue.field] ?? Hash;

  const p          = Math.round((issue.products / (totalProducts || 1)) * 100);
  const isCritical = p === 100;

  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0`}>
          <IssueIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        <span className="text-sm font-medium text-foreground truncate">
          {issue.issue}
        </span>
      </div>

      <div className="w-20 shrink-0 text-center">
        <span className="text-sm text-muted-foreground">
          {Math.min(issue.products, totalProducts)} / {totalProducts}
        </span>
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
        {/* ✅ Pass issue.field directly — no ISSUE_TO_FIELD lookup needed */}
        <Button
          onClick={() => onFix(issue.field)}
          size="sm"
          variant={priority === "high" ? "destructive" : "outline"}
          className="h-7 bg-destructive hover:bg-destructive/90 text-destructive-foreground hover:text-destructive-foreground text-xs opacity-80 group-hover:opacity-100 transition-opacity"
        >
          Fix
        </Button>
      </div>
    </div>
  );
}

// ============================================
// PRIORITY SECTION
// ============================================
function PrioritySection({ priority, issues, totalProducts, onFix }) {
  const [open, setOpen] = useState(
    priority === "high" || priority === "medium"
  );
  const cfg   = PRIORITY_CONFIG[priority];
  const Icon  = cfg.icon;
  const total = issues.length;

  if (total === 0) return null;

  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${cfg.bg} hover:opacity-90 transition-opacity`}
      >
        <Icon className={`h-4 w-4 ${cfg.color}`} />
        <span className={`font-semibold text-sm ${cfg.color}`}>
          {cfg.label}
        </span>
        <Badge
          variant="outline"
          className={`ml-1 text-xs ${cfg.color} border-current`}
        >
          {total} issues
        </Badge>
        <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
          {cfg.description}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {open
            ? <ChevronUp   className={`h-4 w-4 ${cfg.color}`} />
            : <ChevronDown className={`h-4 w-4 ${cfg.color}`} />
          }
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
              <IssueRow
                key={i}
                issue={issue}
                priority={priority}
                totalProducts={totalProducts}
                onFix={onFix}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ============================================
// MAIN PAGE
// ============================================
export default function FeedAudit() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const navigate = useNavigate();

  const {
    user,
    currentStoreId,
    activeShopName,
    isSuperAdmin,
  } = useAuth();

  const token = user?.token || localStorage.getItem('token');

  // ----------------------------------------
  // ✅ handleFix — receives field directly from issue.field
  // No ISSUE_TO_FIELD lookup needed anymore
  // ----------------------------------------
  function handleFix(field) {
    if (field) {
      navigate('/field-optimization', { state: { field } });
    }
  }

  // ----------------------------------------
  // Fetch audit data
  // ----------------------------------------
  async function fetchAuditData() {
    if (!currentStoreId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/api/audit/feed-audit?companyId=${currentStoreId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id':   currentStoreId,
            'Content-Type':  'application/json',
          }
        }
      );

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const rawData = json.data;
      const allIssuesList = Object.values(rawData.issues || {}).flat();
      const maxProductCount = allIssuesList.length > 0
        ? Math.max(...allIssuesList.map(i => i.products ?? 0))
        : rawData.totalProducts;

      const correctTotalProducts = Math.min(
        rawData.totalProducts,
        maxProductCount <= rawData.totalProducts ? rawData.totalProducts : maxProductCount
      );

      setData({ ...rawData, totalProducts: correctTotalProducts });
      setLastChecked(new Date());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------
  // Manual refresh
  // ----------------------------------------
  async function handleRefresh() {
    if (!currentStoreId) return;
    try {
      setRefreshing(true);
      await fetch(
        `${API_BASE}/api/audit/refresh?companyId=${currentStoreId}`,
        {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id':   currentStoreId,
            'Content-Type':  'application/json',
          }
        }
      );
      await new Promise(r => setTimeout(r, 3000));
      await fetchAuditData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAuditData();
  }, [currentStoreId]);

  // ----------------------------------------
  // Loading
  // ----------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading audit data...</span>
      </div>
    );
  }

  // ----------------------------------------
  // No store selected
  // ----------------------------------------
  if (isSuperAdmin && !currentStoreId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 border rounded-xl border-dashed">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm font-medium">
          Please select a store from the top right menu
        </p>
      </div>
    );
  }

  // ----------------------------------------
  // Error
  // ----------------------------------------
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={fetchAuditData} variant="outline">Try Again</Button>
      </div>
    );
  }

  if (!data) return null;

  const { totalProducts, totalIssues, healthScore, issues } = data;

  // ----------------------------------------
  // No products
  // ----------------------------------------
  if (totalProducts === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSuperAdmin
              ? `Viewing audit for: ${activeShopName || currentStoreId}`
              : 'Detected issues across your product feed — fix them to improve ad performance.'
            }
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 border rounded-xl border-dashed gap-4">
          <div className="p-4 rounded-full bg-muted/50">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-base font-semibold text-foreground">No Products Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your feed has not been set up yet. Add your products to start seeing audit results.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const allIssues = Object.values(issues).flat();

  // ✅ Quick wins uses issue.field directly
  const quickWins = allIssues
    .filter(i  => parseFloat(i.percentage) < 50)
    .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSuperAdmin
              ? `Viewing audit for: ${activeShopName || currentStoreId}`
              : 'Detected issues across your product feed — fix them to improve ad performance.'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 text-sm">
            <Clock className="h-4 w-4" />
            {lastChecked
              ? `Last checked: ${lastChecked.toLocaleTimeString()}`
              : 'Last checked: just now'
            }
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing || !currentStoreId}
            className="bg-primary text-primary-foreground gap-2"
          >
            {refreshing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />
            }
            {refreshing ? 'Refreshing...' : 'Audit Issue Refresh'}
          </Button>
        </div>
      </div>

      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Issues"
          value={totalIssues}
          sub={`Across ${totalProducts} products`}
          icon={AlertCircle}
          color="text-foreground"
          bg="bg-secondary/50"
        />
        <StatCard
          label="High Priority"
          value={issues.high?.length ?? 0}
          sub="Need immediate action"
          icon={AlertTriangle}
          color="text-destructive"
          bg="bg-destructive/10"
        />
        <StatCard
          label="Medium Priority"
          value={issues.medium?.length ?? 0}
          sub="Affects impressions"
          icon={AlertCircle}
          color="text-warning"
          bg="bg-warning/10"
        />
        <StatCard
          label="Feed Health Score"
          value={`${healthScore}%`}
          sub={
            healthScore < 50 ? "Needs improvement"
            : healthScore < 75 ? "Fair"
            : "Good"
          }
          icon={ShieldCheck}
          color={
            healthScore < 50 ? "text-destructive"
            : healthScore < 75 ? "text-warning"
            : "text-success"
          }
          bg={
            healthScore < 50 ? "bg-destructive/10"
            : healthScore < 75 ? "bg-warning/10"
            : "bg-success/10"
          }
        />
      </div>

      {/* ---- Quick Wins ---- */}
      {quickWins.length > 0 && (
        <div className="bg-card border border-success/30 rounded-xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-success" />
            <h2 className="font-semibold text-sm">Quick Wins</h2>
            <Badge variant="outline" className="text-success border-success/50 text-xs ml-1">
              Easiest to fix
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickWins.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-success/5 border border-success/20 rounded-lg p-3"
              >
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.issue}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.products} products · {w.percentage}
                  </p>
                </div>
                {/* ✅ Pass w.field directly */}
                <Button
                  onClick={() => handleFix(w.field)}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-success/40 text-success hover:bg-success/10 shrink-0"
                >
                  Fix
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- All Issues ---- */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide px-1">
          All Issues
        </h2>

        {allIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border rounded-xl border-dashed gap-3">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-success font-medium text-sm">
              No issues found — your feed looks great!
            </p>
          </div>
        ) : (
          Object.keys(PRIORITY_CONFIG).map(priority => (
            <PrioritySection
              key={priority}
              priority={priority}
              issues={issues[priority] ?? []}
              totalProducts={totalProducts}
              onFix={handleFix}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
