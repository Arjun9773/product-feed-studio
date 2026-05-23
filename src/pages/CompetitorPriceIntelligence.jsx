import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, ExternalLink,
  Loader2, RefreshCw, Download, Target,
  AlertCircle, CheckCircle2, Layers,
  ShoppingCart, ChevronDown, Search,
  ArrowUpRight, ArrowDownRight, BarChart2, ChevronLeft,
} from "lucide-react";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { useAuth }    from "@/context/AuthContext";
import API            from "@/hooks/useApi";
import { toast }      from "sonner";
import { useNavigate } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price) {
  if (price == null || price === "") return "—";
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, bg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 flex items-start gap-4"
    >
      <div className={`p-2 rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Diff Badge ───────────────────────────────────────────────────────────────
function DiffBadge({ price_diff, price_diff_pct }) {
  if (price_diff == null) return <span className="text-xs text-muted-foreground">—</span>;

  const absAmt = Math.abs(price_diff);
  const absPct = Math.abs(price_diff_pct ?? 0).toFixed(1);

  if (price_diff > 0) return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
        <ArrowUpRight className="h-3 w-3" />+{formatPrice(absAmt)}
      </span>
      <span className="text-[10px] text-emerald-600/80 font-medium">({absPct}% higher)</span>
    </div>
  );

  if (price_diff < 0) return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-destructive">
        <ArrowDownRight className="h-3 w-3" />-{formatPrice(absAmt)}
      </span>
      <span className="text-[10px] text-destructive/80 font-medium">({absPct}% lower)</span>
    </div>
  );

  return <span className="text-xs font-semibold text-muted-foreground">Same price</span>;
}

// ─── Price Status Badge ───────────────────────────────────────────────────────
function PriceStatusBadge({ status }) {
  if (status === "cheaper") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
      <TrendingUp className="h-3 w-3 shrink-0" />You&apos;re expensive
    </span>
  );
  if (status === "expensive") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
      <TrendingDown className="h-3 w-3 shrink-0" />You&apos;re cheaper
    </span>
  );
  if (status === "matched") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-lg whitespace-nowrap">
      <Minus className="h-3 w-3" />Price matched
    </span>
  );
  if (status === "no_data") return (
    <span className="text-[11px] text-muted-foreground">No data</span>
  );
  return null;
}

// ─── Competitor Pill ──────────────────────────────────────────────────────────
// Sample image மாதிரி: Logo | ₹1,932 | signal bars
// Out of Stock இருந்தா அதுவும் காட்டு
function CompetitorPill({ c }) {
  const isOutOfStock = !c.competitor_price || c.competitor_price === 0;

  return (
    <a
      key={c._id || c.competitor_name}
      href={c.competitor_url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      title={
        isOutOfStock
          ? `${c.competitor_name}: Out of Stock`
          : `${c.competitor_name}: ${formatPrice(c.competitor_price)}`
      }
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all
        ${c.competitor_url
          ? "cursor-pointer hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
          : "cursor-default"
        }
        bg-secondary border-border text-foreground`}
    >
      {/* Competitor Name */}
      <span className="font-semibold">{c.competitor_name}</span>

      {/* Divider */}
      <span className="text-border">|</span>

      {/* Price or Out of Stock */}
      {isOutOfStock ? (
        <span className="text-muted-foreground italic">Out of Stock</span>
      ) : (
        <span className="text-foreground font-bold">{formatPrice(c.competitor_price)}</span>
      )}

      {/* Signal bars icon — price strength indicator */}
      {!isOutOfStock && c.price_diff_pct != null && (
        <>
          <span className="text-border">|</span>
          <span className={`flex items-end gap-[2px] h-3
            ${c.price_diff_pct > 0
              ? "text-emerald-500"   // competitor costlier → green
              : c.price_diff_pct < 0
                ? "text-destructive"  // competitor cheaper → red
                : "text-muted-foreground"
            }`}
          >
            {/* 3 bars — signal style */}
            <span className={`w-[3px] rounded-sm ${Math.abs(c.price_diff_pct) >= 1 ? "h-1.5 opacity-100" : "h-1.5 opacity-30"}`
              + " bg-current"} />
            <span className={`w-[3px] rounded-sm ${Math.abs(c.price_diff_pct) >= 3 ? "h-2.5 opacity-100" : "h-2.5 opacity-30"}`
              + " bg-current"} />
            <span className={`w-[3px] rounded-sm ${Math.abs(c.price_diff_pct) >= 6 ? "h-3.5 opacity-100" : "h-3.5 opacity-30"}`
              + " bg-current"} />
          </span>
        </>
      )}
    </a>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────
function ProductRow({ idx, doc }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
      className="border-b border-border transition-colors hover:bg-secondary/30 group"
    >

      {/* ── Product ── */}
      <td className="px-4 py-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          {doc.product_image ? (
            <img
              src={doc.product_image}
              alt={doc.product_name}
              className="h-12 w-12 rounded-lg object-cover border border-border shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
              {doc.product_name || doc.item_code || "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              {doc.item_code || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* ── Your Price ── */}
      <td className="px-4 py-3 whitespace-nowrap">
        {doc.your_price != null
          ? <span className="text-sm font-bold text-foreground">{formatPrice(doc.your_price)}</span>
          : <span className="text-xs text-muted-foreground italic">—</span>
        }
      </td>

      {/* ── Competitor Lowest ── */}
      <td className="px-4 py-3 min-w-[150px]">
        {doc.comp_lowest_price != null ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-foreground">
              {formatPrice(doc.comp_lowest_price)}
            </span>
            {doc.comp_highest_price != null &&
             doc.comp_highest_price !== doc.comp_lowest_price && (
              <span className="text-[11px] text-muted-foreground">
                Range up to {formatPrice(doc.comp_highest_price)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">No data</span>
        )}
      </td>

      {/* ── Diff ── */}
      <td className="px-4 py-3 whitespace-nowrap">
        <DiffBadge price_diff={doc.price_diff} price_diff_pct={doc.price_diff_pct} />
      </td>

      {/* ── Competitors Selling (pills with price) ── */}
      <td className="px-4 py-3 min-w-[220px]">
        {doc.competitors && doc.competitors.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {doc.competitors.map((c) => (
              <CompetitorPill key={c._id || c.competitor_name} c={c} />
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">—</span>
        )}
      </td>

      {/* ── Status ── */}
      <td className="px-4 py-3">
        <PriceStatusBadge status={doc.status} />
      </td>

      {/* ── External link ── */}
      <td className="px-4 py-3 w-10">
        {doc.competitors?.[0]?.competitor_url && (
          <a
            href={doc.competitors[0].competitor_url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </td>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompetitorPriceIntelligence() {
  const [docs,            setDocs]            = useState([]);
  const [stats,           setStats]           = useState({ total: 0, withData: 0, expensive: 0, cheaper: 0, matched: 0, noData: 0, pctAdvantage: 0 });
  const [competitorNames, setCompetitorNames] = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [search,          setSearch]          = useState("");
  const [selectedStatus,  setSelectedStatus]  = useState("All status");
  const [selectedComp,    setSelectedComp]    = useState("All");
  const [lastSynced,      setLastSynced]      = useState(null);

  const { currentStoreId } = useAuth();
  const navigate = useNavigate();

  // ── Fetch ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    try {
      const params = {};
      if (selectedStatus !== "All status") params.status          = selectedStatus;
      if (selectedComp   !== "All")        params.competitor_name = selectedComp;
      if (search)                          params.search          = search;

      const res  = await API.get("/competitor-price/list", { params });
      console.log("API Response:", res.data);
      const body = res.data;

      // ✅ No scrape data found → toast காட்டு
      if (body.message === "No scrape data found") {
        toast.info("No scrape data found for your products.");
      }

      setDocs(Array.isArray(body.data) ? body.data : []);
      setStats(body.stats ?? {});
      setCompetitorNames(body.competitorNames ?? []);
      setLastSynced(new Date());
    } catch (err) {
      toast.error("Failed to load competitor data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentStoreId, selectedStatus, selectedComp, search]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Client-side search ─────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search) return docs;
    const q = search.toLowerCase();
    return docs.filter(d =>
      (d.item_code    || "").toLowerCase().includes(q) ||
      (d.product_name || "").toLowerCase().includes(q) ||
      (d.brand        || "").toLowerCase().includes(q) ||
      (d.competitors || []).some(c =>
        (c.competitor_name || "").toLowerCase().includes(q)
      )
    );
  }, [docs, search]);

  // ── Export ─────────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      ["#", "Item Code", "Product Name", "Brand", "Your Price", "Comp Lowest", "Comp Highest", "Cheapest Store", "Price Diff", "Diff %", "Status", "Competitors"],
      ...filtered.map((d, i) => [
        i + 1,
        d.item_code || "",
        `"${(d.product_name || "").replace(/"/g, '""')}"`,
        d.brand || "",
        d.your_price || "",
        d.comp_lowest_price || "",
        d.comp_highest_price || "",
        d.comp_cheapest_store || "",
        d.price_diff || "",
        d.price_diff_pct || "",
        d.status || "",
        (d.competitors || []).map(c => `${c.competitor_name}:${c.competitor_price}`).join(" | "),
      ]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `competitor-prices-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />Back to Optimization Center
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Competitor Price Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Google Shopping · GMC Feed Analysis
            {lastSynced && (
              <span className="ml-2 text-xs">· Last synced: {lastSynced.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2 text-sm" onClick={loadData} disabled={loading}>
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="gap-2 text-sm" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={stats.total}
          sub="From your catalog"
          icon={Layers}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          label="With Competitor Data"
          value={stats.withData}
          sub="Prices tracked"
          icon={Target}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          label="Price Advantage"
          value={`${stats.pctAdvantage}%`}
          sub="You're cheaper"
          icon={TrendingDown}
          color="text-emerald-600"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="Undercut Alerts"
          value={stats.expensive}
          sub="Action needed"
          icon={AlertCircle}
          color="text-destructive"
          bg="bg-destructive/10"
        />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border">
        <button className="px-4 py-2.5 text-sm font-medium border-b-2 border-primary text-primary -mb-px">
          Product Comparison
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex flex-wrap items-end gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <div className="relative">
              <select
                className="appearance-none rounded-lg border border-border bg-secondary px-3 py-2 pr-8 text-sm text-foreground min-w-[150px]"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                {["All status", "cheaper", "expensive", "matched", "no_data"].map(s => (
                  <option key={s} value={s}>
                    {s === "cheaper"   ? "You're expensive"
                    : s === "expensive" ? "You're cheaper"
                    : s === "matched"   ? "Price matched"
                    : s === "no_data"   ? "No data"
                    : s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Competitor</label>
            <div className="relative">
              <select
                className="appearance-none rounded-lg border border-border bg-secondary px-3 py-2 pr-8 text-sm text-foreground min-w-[150px]"
                value={selectedComp}
                onChange={e => setSelectedComp(e.target.value)}
              >
                <option value="All">All competitors</option>
                {competitorNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Product name, item code, brand..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-secondary border-border text-sm pl-8"
              />
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => { setSearch(""); setSelectedStatus("All status"); setSelectedComp("All"); }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `Showing ${filtered.length} of ${stats.total} products`}
          </p>
          {!loading && stats.pctAdvantage > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" />{stats.pctAdvantage}% price advantage
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading competitor data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <BarChart2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-foreground font-medium">No scrape data found</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Products have not been scraped yet. Please wait for scraping to complete.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[220px]">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">Your Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">Competitor Lowest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Diff</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">Competitors Selling</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((doc, idx) => (
                    <ProductRow
                      key={doc.item_code || String(idx)}
                      idx={idx + 1}
                      doc={doc}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
