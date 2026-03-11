import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageOff, ExternalLink, Sparkles, Check, X,
  CheckCheck, XCircle, Loader2, Pencil
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts } from "@/data/mockData";

// ─── types ────────────────────────────────────────────────────────────────────

type CardState = "empty" | "suggested" | "accepted" | "rejected";

interface ProductState {
  state: CardState;
  suggestion: string;
  confidence: number;
  manualValue: string;
  finalValue: string;
}

// ─── mock AI suggestions per field ───────────────────────────────────────────

const AI_SUGGESTIONS: Record<string, Record<number, { value: string; confidence: number }>> = {
  "Product Color": {
    1:  { value: "White",          confidence: 95 },
    2:  { value: "Black",          confidence: 88 },
    3:  { value: "White",          confidence: 92 },
    4:  { value: "White",          confidence: 78 },
    5:  { value: "Black",          confidence: 90 },
    6:  { value: "White",          confidence: 94 },
    7:  { value: "Midnight Black", confidence: 85 },
    8:  { value: "Red",            confidence: 72 },
    9:  { value: "Black",          confidence: 89 },
    10: { value: "Silver",         confidence: 80 },
    11: { value: "Black",          confidence: 87 },
  },
  "Age Group": Object.fromEntries(
    mockProducts.map((p) => [p.id, { value: "Adult", confidence: 98 }])
  ),
  "Gender": Object.fromEntries(
    mockProducts.map((p) => [p.id, { value: "Unisex", confidence: 97 }])
  ),
  "Material": {
    1:  { value: "Plastic",          confidence: 82 },
    2:  { value: "Plastic / Glass",  confidence: 79 },
    3:  { value: "Plastic",          confidence: 84 },
    4:  { value: "Plastic",          confidence: 76 },
    5:  { value: "Plastic / Metal",  confidence: 81 },
    6:  { value: "Plastic",          confidence: 88 },
    7:  { value: "Aluminium / Glass",confidence: 91 },
    8:  { value: "Plastic",          confidence: 74 },
    9:  { value: "Plastic / Glass",  confidence: 80 },
    10: { value: "Stainless Steel",  confidence: 85 },
    11: { value: "Plastic",          confidence: 83 },
  },
  "Pattern": Object.fromEntries(
    mockProducts.map((p) => [p.id, { value: "Solid", confidence: 95 }])
  ),
  "GTIN": {
    1:  { value: "8887549884986", confidence: 99 },
    2:  { value: "8801643710118", confidence: 99 },
    3:  { value: "8801643710125", confidence: 99 },
    4:  { value: "8801643710132", confidence: 99 },
    5:  { value: "8801643710149", confidence: 99 },
    6:  { value: "8801643710156", confidence: 99 },
    7:  { value: "8801643710163", confidence: 99 },
    8:  { value: "8801643710170", confidence: 99 },
    9:  { value: "8801643710187", confidence: 99 },
    10: { value: "8801643710194", confidence: 99 },
    11: { value: "8801643710200", confidence: 99 },
  },
};

const dataFields = ["Product Color", "Age Group", "Gender", "Material", "Pattern", "GTIN"];
const taggingOptions = ["All", "Untagged", "Tagged"];

function confidenceColor(c: number) {
  if (c >= 90) return "text-success";
  if (c >= 75) return "text-warning";
  return "text-destructive";
}

function initStates(): Record<number, ProductState> {
  return Object.fromEntries(
    mockProducts.map((p) => [
      p.id,
      { state: "empty", suggestion: "", confidence: 0, manualValue: "", finalValue: "" },
    ])
  );
}

// ─── product card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  ps,
  onAccept,
  onReject,
  onManualChange,
  onManualSave,
}: {
  product: typeof mockProducts[0];
  ps: ProductState;
  onAccept: () => void;
  onReject: () => void;
  onManualChange: (v: string) => void;
  onManualSave: () => void;
}) {
  const borderClass =
    ps.state === "suggested" ? "border-purple-400/60" :
    ps.state === "accepted"  ? "border-success/50"   :
    ps.state === "rejected"  ? "border-border"        :
                               "border-border";

  return (
    <div className={`bg-card rounded-xl border overflow-hidden transition-all ${borderClass} card-shadow`}>
      {/* image */}
      <div className="h-28 bg-secondary flex items-center justify-center relative">
        <ImageOff className="h-7 w-7 text-muted-foreground" />
        <span className="absolute top-2 left-2">
          <Badge className="bg-success/10 text-success border-0 text-[10px]">AVAILABLE</Badge>
        </span>
        <button className="absolute top-2 right-2 h-6 w-6 rounded bg-secondary/80 text-muted-foreground flex items-center justify-center hover:bg-border transition-colors">
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium text-primary truncate">{product.feedName}</p>
        <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground truncate">{product.category}</p>
      </div>

      {/* value section */}
      <div className="px-3 pb-3 pt-1 border-t border-border space-y-2">

        {/* EMPTY */}
        {ps.state === "empty" && (
          <p className="text-xs text-muted-foreground italic">No optimized value</p>
        )}

        {/* AI SUGGESTED */}
        {ps.state === "suggested" && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">AI Suggestion</p>
                  <p className="text-sm font-medium text-foreground truncate">{ps.suggestion}</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${confidenceColor(ps.confidence)}`}>
                  {ps.confidence}%
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs bg-success/10 text-success border border-success/30 hover:bg-success/20"
                  variant="ghost"
                  onClick={onAccept}
                >
                  <Check className="h-3 w-3 mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  variant="outline"
                  onClick={onReject}
                >
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ACCEPTED */}
        {ps.state === "accepted" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Check className="h-3.5 w-3.5 text-success shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{ps.finalValue}</span>
            </div>
            <Badge className="bg-success/10 text-success border-0 text-[10px] shrink-0">AI Filled</Badge>
          </motion.div>
        )}

        {/* REJECTED — manual input */}
        {ps.state === "rejected" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Enter value manually
            </p>
            <div className="flex gap-1.5">
              <Input
                className="h-7 text-xs bg-secondary border-border"
                placeholder="Type value…"
                value={ps.manualValue}
                onChange={(e) => onManualChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onManualSave()}
              />
              <Button
                size="sm"
                className="h-7 px-2 text-xs bg-primary text-primary-foreground shrink-0"
                onClick={onManualSave}
                disabled={!ps.manualValue.trim()}
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function FieldOptimization() {
  const [search, setSearch]                   = useState("");
  const [selectedField, setSelectedField]     = useState("Product Color");
  const [selectedTagging, setSelectedTagging] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand]     = useState("");
  const [productStates, setProductStates]     = useState<Record<number, ProductState>>(initStates);
  const [aiLoading, setAiLoading]             = useState(false);

  const brands     = [...new Set(mockProducts.map((p) => p.brand).filter(Boolean))];
  const categories = [...new Set(mockProducts.map((p) => p.category).filter(Boolean))];

  const filtered = mockProducts.filter((p) => {
    const matchesSearch = p.feedName.toLowerCase().includes(search.toLowerCase());
    const matchesCat    = selectedCategory ? p.category.includes(selectedCategory) : true;
    const matchesBrand  = selectedBrand ? p.brand === selectedBrand : true;
    const ps            = productStates[p.id];
    const matchesTag    =
      selectedTagging === "All"      ? true :
      selectedTagging === "Tagged"   ? ps.state === "accepted" :
                                       ps.state !== "accepted";
    return matchesSearch && matchesCat && matchesBrand && matchesTag;
  });

  // counts
  const accepted  = Object.values(productStates).filter((s) => s.state === "accepted").length;
  const suggested = Object.values(productStates).filter((s) => s.state === "suggested").length;

  // ── helpers ──

  function update(id: number, patch: Partial<ProductState>) {
    setProductStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function handleAiFill() {
    setAiLoading(true);
    setTimeout(() => {
      setProductStates((prev) => {
        const next = { ...prev };
        mockProducts.forEach((p) => {
          if (next[p.id].state === "empty") {
            const s = AI_SUGGESTIONS[selectedField]?.[p.id];
            if (s) {
              next[p.id] = { ...next[p.id], state: "suggested", suggestion: s.value, confidence: s.confidence };
            }
          }
        });
        return next;
      });
      setAiLoading(false);
    }, 1600);
  }

  function handleAcceptAll() {
    setProductStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const ps = next[+id];
        if (ps.state === "suggested") {
          next[+id] = { ...ps, state: "accepted", finalValue: ps.suggestion };
        }
      });
      return next;
    });
  }

  function handleRejectAll() {
    setProductStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const ps = next[+id];
        if (ps.state === "suggested") {
          next[+id] = { ...ps, state: "rejected" };
        }
      });
      return next;
    });
  }

  function handleFieldChange(field: string) {
    setSelectedField(field);
    setProductStates(initStates());
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Field Optimization</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a data field and tag or update values for your products. Use AI Auto-Fill to suggest values instantly.
          </p>
        </div>
        {/* progress badge */}
        {accepted > 0 && (
          <Badge className="bg-success/10 text-success border border-success/30 px-3 py-1 text-xs">
            <Check className="h-3 w-3 mr-1" />
            {accepted} / {mockProducts.length} fields filled
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── sidebar ── */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border space-y-5 h-fit">
          <h3 className="font-semibold text-foreground">Filters</h3>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">Tagging status:</label>
            <select
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedTagging}
              onChange={(e) => setSelectedTagging(e.target.value)}
            >
              {taggingOptions.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">Category:</label>
            <select
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">Brand:</label>
            <select
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedBrand(""); }}
          >
            Clear Filters
          </Button>

          {/* field legend */}
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Legend</p>
            {[
              { color: "bg-purple-400", label: "AI Suggested" },
              { color: "bg-success",    label: "Accepted"     },
              { color: "bg-border",     label: "Manual / Empty" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── main ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* toolbar */}
          <div className="bg-card rounded-xl p-4 card-shadow border border-border">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px] space-y-1.5">
                <label className="text-sm font-medium text-foreground block">Data Field:</label>
                <select
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  value={selectedField}
                  onChange={(e) => handleFieldChange(e.target.value)}
                >
                  {dataFields.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>

              <div className="flex items-end gap-2 flex-wrap">
                {/* AI fill */}
                <Button
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleAiFill}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
                    : <><Sparkles className="h-4 w-4" /> AI Auto-Fill</>
                  }
                </Button>

                {/* accept / reject all — only show when suggestions are pending */}
                {suggested > 0 && (
                  <>
                    <Button
                      variant="outline"
                      className="gap-2 text-success border-success/40 hover:bg-success/10"
                      onClick={handleAcceptAll}
                    >
                      <CheckCheck className="h-4 w-4" /> Accept All
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={handleRejectAll}
                    >
                      <XCircle className="h-4 w-4" /> Reject All
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* AI loading bar */}
            {aiLoading && (
              <div className="mt-3 h-1 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>

          {/* count + summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>Showing {filtered.length} of {mockProducts.length} products</span>
            {suggested > 0 && (
              <span className="text-purple-500 font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                {suggested} suggestions pending review
              </span>
            )}
          </div>

          {/* product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                ps={productStates[product.id]}
                onAccept={() =>
                  update(product.id, {
                    state: "accepted",
                    finalValue: productStates[product.id].suggestion,
                  })
                }
                onReject={() => update(product.id, { state: "rejected" })}
                onManualChange={(v) => update(product.id, { manualValue: v })}
                onManualSave={() =>
                  update(product.id, {
                    state: "accepted",
                    finalValue: productStates[product.id].manualValue,
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
