import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, ImageOff, Package,
  ShieldCheck, LayoutGrid, AlertTriangle, Loader2, Check, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PER_PAGE = 20;

// ── Fields to skip (internal/system) ─────────────────────────
const SKIP_FIELDS = new Set([
  "_id", "__v", "feedId", "tenantId", "is_active",
  "deactivatedAt", "importedAt", "updatedAt",
  "title_optimization_status", "field_optimization_status",
  "google_category_optimization_status",
  "keyword_optimization_status",
]);

// ── Read-only (show but no edit) ──────────────────────────────
const READONLY_FIELDS = new Set([
  "sourceId", "item_code", "product_url", "products_url",
]);

// ── Image fields ──────────────────────────────────────────────
const IMAGE_FIELDS = new Set([
  "product_image",
  "additional_image1", "additional_image2", "additional_image3",
  "additional_image4", "additional_image5", "additional_image6",
  "additional_image7", "additional_image8",
]);

// ── Pin these columns first ───────────────────────────────────
const PIN_ORDER = [
  "sourceId", "product_name", "brand", "price",
  "category", "google_category", "color", "age_group",
  "gender", "material", "gtin",
];

const COLUMN_CONFIG = {
  active_keywords: { label: "Keywords" }
};

// ── Extract dynamic columns from first product ────────────────
function extractColumns(products) {
  if (!products.length) return [];
  const allKeys = new Set();
  products.forEach((p) => Object.keys(p).forEach((k) => allKeys.add(k)));

  const visible = [...allKeys].filter((k) => !SKIP_FIELDS.has(k));

  return visible.sort((a, b) => {
    const ai = PIN_ORDER.indexOf(a);
    const bi = PIN_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

// ── Pretty label ──────────────────────────────────────────────
function fieldLabel(key) {
  if (COLUMN_CONFIG[key]?.label) return COLUMN_CONFIG[key].label;
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Inline Editable Cell ──────────────────────────────────────
function EditableCell({ product, fieldKey, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(product[fieldKey] ?? "");
  const [status, setStatus]   = useState(null);
  const [imgError, setImgError] = useState(false);
  const inputRef              = useRef(null);

  const isReadonly = READONLY_FIELDS.has(fieldKey);
  const isImage    = IMAGE_FIELDS.has(fieldKey);
  const rawVal     = product[fieldKey];
  const isEmpty    = rawVal === null || rawVal === undefined || rawVal === "";

  useEffect(() => { setValue(product[fieldKey] ?? ""); }, [product[fieldKey]]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function handleSave() {
    const trimmed  = String(value).trim();
    const original = String(product[fieldKey] ?? "").trim();
    if (trimmed === original) { setEditing(false); return; }
    setStatus("saving");
    const ok = await onSave(product.sourceId, fieldKey, trimmed);
    setStatus(ok ? "saved" : "error");
    setEditing(false);
    setTimeout(() => setStatus(null), 2000);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter")  handleSave();
    if (e.key === "Escape") { setValue(product[fieldKey] ?? ""); setEditing(false); }
  }

  // Read-only
  if (isReadonly) {
    return (
      <td className="p-3 text-xs font-mono text-muted-foreground max-w-[160px]">
        <span className="truncate block">{rawVal ?? "—"}</span>
      </td>
    );
  }

  // Image
  if (isImage) {
    return (
      <td className="p-3">
        {rawVal && !imgError ? (
          <img
            src={rawVal}
            alt=""
            className="h-10 w-10 rounded object-cover border border-border"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center border border-border">
            <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </td>
    );
  }

  // Editing
  if (editing) {
    return (
      <td className="p-2" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full min-w-[100px] border border-primary rounded px-2 py-1 text-xs bg-background text-foreground outline-none ring-1 ring-primary"
        />
      </td>
    );
  }

  // Normal
  return (
    <td className="p-3 cursor-pointer group whitespace-nowrap" onClick={() => setEditing(true)} title="Click to edit">
      {status === "saving" && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
      {status === "saved"  && <span className="flex items-center gap-1 text-success text-xs"><Check size={12} />Saved</span>}
      {status === "error"  && <span className="flex items-center gap-1 text-destructive text-xs"><X size={12} />Error</span>}
      {!status && (
        isEmpty ? (
          <span className="text-destructive/70 text-xs">
            — <span className="opacity-0 group-hover:opacity-60 text-[10px] text-primary transition-opacity">fill</span>
          </span>
        ) : (
          <span className="text-sm text-foreground group-hover:underline decoration-dashed underline-offset-2">
            {String(rawVal)}
          </span>
        )
      )}
    </td>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function FeedProductList() {
  const { user, currentStoreId, isSuperAdmin, activeShopName } = useAuth();
  const token = user?.token || localStorage.getItem("token");

  const [products, setProducts] = useState([]);
  const [columns, setColumns]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  const headers = {
    Authorization:  `Bearer ${token}`,
    "x-tenant-id":  currentStoreId,
    "Content-Type": "application/json",
  };

  async function fetchProducts() {
    if (!currentStoreId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const res  = await fetch(`${API_BASE}/api/products/with-keywords`, { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      setColumns(extractColumns(list));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProducts(); }, [currentStoreId]);

  const handleSave = useCallback(async (sourceId, field, value) => {
    try {
      const res = await fetch(`${API_BASE}/api/products/bulk-update`, {
        method: "PUT", headers,
        body: JSON.stringify({ field, updates: [{ id: sourceId, value }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts((prev) =>
        prev.map((p) => p.sourceId === sourceId ? { ...p, [field]: value || null } : p)
      );
      return true;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    }
  }, [currentStoreId, token]);

  // Filter
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.product_name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.sourceId?.toLowerCase().includes(q)
    );
  });

  const maxPage   = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const curPage   = Math.min(page, maxPage);
  const pageSlice = filtered.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);

  // Stats
  const editableCols     = columns.filter((c) => !READONLY_FIELDS.has(c) && !IMAGE_FIELDS.has(c));
  const uniqueCategories = [...new Set(products.map((p) => p.category).filter(Boolean))].length;
  const missingCount     = products.reduce((acc, p) =>
    acc + editableCols.filter((f) => p[f] === null || p[f] === undefined || p[f] === "").length, 0
  );
  const totalFields  = products.length * editableCols.length;
  const completeness = totalFields > 0 ? Math.round(((totalFields - missingCount) / totalFields) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-3 text-muted-foreground">Loading products...</span>
    </div>
  );

  if (isSuperAdmin && !currentStoreId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 border rounded-xl border-dashed">
      <ShieldCheck className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground text-sm font-medium">Please select a store from the top right menu</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-destructive font-medium">{error}</p>
      <Button onClick={fetchProducts} variant="outline">Try Again</Button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed Product List</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isSuperAdmin
            ? `Viewing: ${activeShopName || currentStoreId}`
            : `${filtered.length} of ${products.length} products · ${columns.length} fields · click any cell to edit`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products",     value: products.length,    sub: "In current feed",       icon: Package,       color: "text-primary",     bg: "bg-primary/10"     },
          { label: "Feed Completeness",  value: `${completeness}%`, sub: "Overall data quality",  icon: ShieldCheck,   color: "text-info",        bg: "bg-info/10"        },
          { label: "Categories",         value: uniqueCategories,   sub: "Product categories",    icon: LayoutGrid,    color: "text-success",     bg: "bg-success/10"     },
          { label: "Missing Attributes", value: missingCount,       sub: "Fields needing data",   icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border border-border p-4 flex items-start gap-4 ${bg}`}>
            <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, source ID, or brand..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="p-3 text-left text-muted-foreground font-medium w-10">#</th>
                {columns.map((col) => (
                  <th key={col} className="p-3 text-left text-muted-foreground font-medium whitespace-nowrap text-xs">
                    {fieldLabel(col)}
                    {!READONLY_FIELDS.has(col) && !IMAGE_FIELDS.has(col) && (
                      <span className="ml-1 text-[9px] text-primary/40 font-normal">✎</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageSlice.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-10 text-center text-muted-foreground text-sm">
                    No products found
                  </td>
                </tr>
              ) : (
                pageSlice.map((product, idx) => (
                  <tr key={product.sourceId} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs">{(curPage - 1) * PER_PAGE + idx + 1}</td>
                    {columns.map((col) => (
                      <EditableCell
                        key={col}
                        product={product}
                        fieldKey={col}
                        onSave={handleSave}
                      />
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (curPage - 1) * PER_PAGE + 1}–{Math.min(curPage * PER_PAGE, filtered.length)} of {filtered.length} items
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={curPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(maxPage, 5) }, (_, i) => {
              let p;
              if (maxPage <= 5)             p = i + 1;
              else if (curPage <= 3)        p = i + 1;
              else if (curPage >= maxPage - 2) p = maxPage - 4 + i;
              else                          p = curPage - 2 + i;
              return (
                <Button key={p} size="sm" onClick={() => setPage(p)}
                  className={`h-8 min-w-[32px] ${curPage === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground hover:bg-secondary"}`}>
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={curPage === maxPage}
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Click any cell to edit · Enter to save · Esc to cancel
      </p>
    </motion.div>
  );
}
