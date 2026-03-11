import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageOff, ExternalLink, Sparkles, Check, X,
  CheckCheck, XCircle, Loader2, Pencil, MousePointerClick
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts } from "@/data/mockData";

// ─── AI suggestions ───────────────────────────────────────────────────────────

const AI_SUGGESTIONS = {
  "Product Color": { 1:"White", 2:"Black", 3:"White", 4:"White", 5:"Black", 6:"White", 7:"Midnight Black", 8:"Red", 9:"Black", 10:"Silver", 11:"Black" },
  "Age Group":     Object.fromEntries(mockProducts.map((p) => [p.id, "Adult"])),
  "Gender":        Object.fromEntries(mockProducts.map((p) => [p.id, "Unisex"])),
  "Material":      { 1:"Plastic", 2:"Plastic / Glass", 3:"Plastic", 4:"Plastic", 5:"Plastic / Metal", 6:"Plastic", 7:"Aluminium / Glass", 8:"Plastic", 9:"Plastic / Glass", 10:"Stainless Steel", 11:"Plastic" },
  "Pattern":       Object.fromEntries(mockProducts.map((p) => [p.id, "Solid"])),
  "GTIN":          { 1:"8887549884986", 2:"8801643710118", 3:"8801643710125", 4:"8801643710132", 5:"8801643710149", 6:"8801643710156", 7:"8801643710163", 8:"8801643710170", 9:"8801643710187", 10:"8801643710194", 11:"8801643710200" },
};

const dataFields    = ["Product Color", "Age Group", "Gender", "Material", "Pattern", "GTIN"];
const taggingOptions = ["All", "Untagged", "Tagged"];

function initStates() {
  return Object.fromEntries(
    mockProducts.map((p) => [p.id, { value: "", editing: false, inputVal: "" }])
  );
}

// ─── product card ─────────────────────────────────────────────────────────────

function ProductCard({ product, state, selectedField, onSelect, onSave, onClear, onInputChange }) {
  const isFilled  = state.value !== "";
  const isEditing = state.editing;

  return (
    <motion.div
      layout
      className={`bg-card rounded-xl border overflow-hidden transition-all cursor-pointer
        ${isEditing  ? "border-primary shadow-md ring-2 ring-primary/20" :
          isFilled   ? "border-success/50" :
                       "border-border hover:border-primary/40"}`}
      onClick={() => !isEditing && onSelect()}
    >
      {/* image area */}
      <div className="h-28 bg-secondary flex items-center justify-center relative">
        <ImageOff className="h-7 w-7 text-muted-foreground" />

        {/* status badge top-left */}
        <span className="absolute top-2 left-2">
          {isFilled
            ? <Badge className="bg-success/15 text-success border-0 text-[10px] gap-1"><Check className="h-2.5 w-2.5" />Filled</Badge>
            : <Badge className="bg-secondary text-muted-foreground border-0 text-[10px]">Empty</Badge>
          }
        </span>

        {/* clear button top-right (only when filled) */}
        {isFilled && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-2 right-2 h-6 w-6 rounded bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* edit pencil when filled but not editing */}
        {isFilled && !isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="absolute bottom-2 right-2 h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* product info */}
      <div className="px-3 pt-2.5 pb-1 space-y-0.5">
        <p className="text-sm font-medium text-primary truncate flex items-center gap-1">
          {product.feedName}
          <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
        </p>
        <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString()}</p>
      </div>

      {/* value / input area */}
      <div className="px-3 pb-3 pt-2 border-t border-border mt-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          {selectedField}
        </p>

        {/* editing state — inline input */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                autoFocus
                className="h-7 text-xs bg-secondary border-border flex-1"
                placeholder={`Enter ${selectedField}…`}
                value={state.inputVal}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && state.inputVal.trim()) onSave();
                  if (e.key === "Escape") onSelect(); // close without saving
                }}
              />
              <Button
                size="sm"
                className="h-7 w-7 p-0 bg-primary text-primary-foreground shrink-0"
                onClick={onSave}
                disabled={!state.inputVal.trim()}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground shrink-0"
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ) : isFilled ? (
            <motion.p
              key="filled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-semibold text-foreground truncate"
            >
              {state.value}
            </motion.p>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground italic flex items-center gap-1"
            >
              <MousePointerClick className="h-3 w-3" />
              Click to add value
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function FieldOptimization() {
  const [search, setSearch]                     = useState("");
  const [selectedField, setSelectedField]       = useState("Product Color");
  const [selectedTagging, setSelectedTagging]   = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand]       = useState("");
  const [productStates, setProductStates]       = useState(initStates);
  const [aiLoading, setAiLoading]               = useState(false);

  const brands     = [...new Set(mockProducts.map((p) => p.brand).filter(Boolean))];
  const categories = [...new Set(mockProducts.map((p) => p.category).filter(Boolean))];

  const filtered = mockProducts.filter((p) => {
    const matchesSearch = p.feedName.toLowerCase().includes(search.toLowerCase());
    const matchesCat    = selectedCategory ? p.category.includes(selectedCategory) : true;
    const matchesBrand  = selectedBrand ? p.brand === selectedBrand : true;
    const ps            = productStates[p.id];
    const matchesTag    =
      selectedTagging === "All"    ? true :
      selectedTagging === "Tagged" ? ps.value !== "" :
                                     ps.value === "";
    return matchesSearch && matchesCat && matchesBrand && matchesTag;
  });

  const filledCount = Object.values(productStates).filter((s) => s.value !== "").length;

  // ── state helpers ──

  function update(id, patch) {
    setProductStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function handleSelect(id) {
    setProductStates((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const isTarget = +k === id;
        next[k] = {
          ...prev[k],
          editing:  isTarget ? !prev[k].editing : false,
          inputVal: isTarget && !prev[k].editing ? prev[k].value : prev[k].inputVal,
        };
      });
      return next;
    });
  }

  function handleSave(id) {
    const val = productStates[id].inputVal.trim();
    if (!val) return;
    update(id, { value: val, editing: false, inputVal: "" });
  }

  function handleClear(id) {
    update(id, { value: "", editing: false, inputVal: "" });
  }

  function handleFieldChange(field) {
    setSelectedField(field);
    setProductStates(initStates());
  }

  // ── AI fill ──

  function handleAiFill() {
    setAiLoading(true);
    setTimeout(() => {
      setProductStates((prev) => {
        const next = { ...prev };
        mockProducts.forEach((p) => {
          const suggestion = AI_SUGGESTIONS[selectedField]?.[p.id];
          if (suggestion && !next[p.id].value) {
            next[p.id] = { ...next[p.id], value: suggestion, editing: false, inputVal: "" };
          }
        });
        return next;
      });
      setAiLoading(false);
    }, 1400);
  }

  function handleClearAll() {
    setProductStates(initStates());
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Field Optimization</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a data field, then click any product card to enter its value inline.
          </p>
        </div>
        {filledCount > 0 && (
          <Badge className="bg-success/10 text-success border border-success/30 px-3 py-1 text-xs gap-1">
            <Check className="h-3 w-3" />
            {filledCount} / {mockProducts.length} filled
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── sidebar ── */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border space-y-5 h-fit">
          <h3 className="font-semibold text-foreground">Filters</h3>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">Tagging status:</label>
            <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedTagging} onChange={(e) => setSelectedTagging(e.target.value)}>
              {taggingOptions.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">Category:</label>
            <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">Brand:</label>
            <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <Button size="sm" variant="outline" className="w-full" onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedBrand(""); }}>
            Clear Filters
          </Button>

          {/* progress */}
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Filled</span>
              <span className="font-medium text-foreground">{filledCount} / {mockProducts.length}</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${(filledCount / mockProducts.length) * 100}%` }}
              />
            </div>

            <div className="pt-2 space-y-1.5">
              {[
                { color: "bg-success/50 border border-success/50", label: "Filled" },
                { color: "bg-primary/20 border border-primary",    label: "Editing (selected)" },
                { color: "bg-border",                              label: "Empty" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`w-2.5 h-2.5 rounded-sm ${color} shrink-0`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── main ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* toolbar */}
          <div className="bg-card rounded-xl p-4 card-shadow border border-border">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px] space-y-1.5">
                <label className="text-sm font-medium text-foreground block">Data Field to fill:</label>
                <select
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  value={selectedField}
                  onChange={(e) => handleFieldChange(e.target.value)}
                >
                  {dataFields.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>

              <div className="flex items-end gap-2 flex-wrap">
                <Button
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleAiFill}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Filling…</>
                    : <><Sparkles className="h-4 w-4" /> AI Auto-Fill All</>
                  }
                </Button>
                {filledCount > 0 && (
                  <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleClearAll}>
                    <XCircle className="h-4 w-4" /> Clear All
                  </Button>
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
                  transition={{ duration: 1.3, ease: "easeInOut" }}
                />
              </div>
            )}

            {/* hint */}
            {!aiLoading && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" />
                Click a product card to enter the <strong>{selectedField}</strong> value inline. Press Enter or ✓ to save.
              </p>
            )}
          </div>

          {/* count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>Showing {filtered.length} of {mockProducts.length} products</span>
          </div>

          {/* product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                state={productStates[product.id]}
                selectedField={selectedField}
                onSelect={() => handleSelect(product.id)}
                onSave={() => handleSave(product.id)}
                onClear={() => handleClear(product.id)}
                onInputChange={(v) => update(product.id, { inputVal: v })}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
