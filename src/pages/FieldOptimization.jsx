import { useState } from "react";
import { motion } from "framer-motion";
import {
  ImageOff, Sparkles, Check, X,
  XCircle, Loader2, Pencil, MousePointerClick,
  Package, Layers, CheckCircle2, AlertCircle
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

// ─── table row ────────────────────────────────────────────────────────────────

function ProductRow({ idx, product, state, selectedField, onSelect, onSave, onClear, onInputChange }) {
  const isFilled  = state.value !== "";
  const isEditing = state.editing;

  return (
    <tr className={`border-b border-border transition-colors
      ${isEditing ? "bg-primary/5" : "hover:bg-secondary/30"}`}>

      {/* # */}
      <td className="px-4 py-3 text-sm text-muted-foreground w-10">{idx}</td>

      {/* image */}
      <td className="px-4 py-3 w-12">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <ImageOff className="h-4 w-4 text-muted-foreground" />
        </div>
      </td>

      {/* product name + brand */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{product.feedName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{product.brand || "—"}</p>
      </td>

      {/* category */}
      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px]">
        <span className="truncate block">{product.category}</span>
      </td>

      {/* price */}
      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
        ₹{product.price.toLocaleString()}
      </td>

      {/* value cell — inline editable */}
      <td className="px-4 py-3 min-w-[200px]">
        {isEditing ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Input
              autoFocus
              className="h-8 text-xs bg-secondary border-border flex-1 min-w-0"
              placeholder={`Enter ${selectedField}…`}
              value={state.inputVal}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && state.inputVal.trim()) onSave();
                if (e.key === "Escape") onSelect();
              }}
            />
            <Button size="sm" className="h-8 w-8 p-0 bg-primary text-primary-foreground shrink-0" onClick={onSave} disabled={!state.inputVal.trim()}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground shrink-0" onClick={onSelect}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : isFilled ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{state.value}</span>
            <button
              onClick={onSelect}
              title="Edit value"
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={onClear}
              title="Remove value"
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSelect}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
          >
            <MousePointerClick className="h-3.5 w-3.5 group-hover:text-primary" />
            <span className="italic">Click to add</span>
          </button>
        )}
      </td>

      {/* status */}
      <td className="px-4 py-3">
        {isFilled
          ? <Badge className="bg-success/10 text-success border-0 text-[10px] gap-1 whitespace-nowrap"><Check className="h-2.5 w-2.5" />Filled</Badge>
          : <Badge className="bg-secondary text-muted-foreground border-0 text-[10px] whitespace-nowrap">Empty</Badge>
        }
      </td>
    </tr>
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
            Select a data field, then click the value cell on any row to enter its value inline.
          </p>
        </div>
        {filledCount > 0 && (
          <Badge className="bg-success/10 text-success border border-success/30 px-3 py-1 text-xs gap-1">
            <Check className="h-3 w-3" />
            {filledCount} / {mockProducts.length} filled
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: mockProducts.length, sub: "Products in feed", icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: "Fields Available", value: dataFields.length, sub: "Optimizable data fields", icon: Layers, color: "text-info", bg: "bg-info/10" },
          { label: "Filled", value: filledCount, sub: `For: ${selectedField}`, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
          { label: "Unfilled", value: mockProducts.length - filledCount, sub: "Still need values", icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
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

      {/* ── filters bar ── */}
      <div className="bg-card rounded-xl p-4 card-shadow border border-border">
        <div className="flex flex-wrap items-end gap-5">
          <div className="flex flex-col gap-1 max-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Data Field</label>
            <select
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedField}
              onChange={(e) => handleFieldChange(e.target.value)}
            >
              {dataFields.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 max-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedTagging} onChange={(e) => setSelectedTagging(e.target.value)}>
              {taggingOptions.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 max-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 max-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Brand</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <MousePointerClick className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary border-border pl-8 text-sm" />
            </div>
          </div>

          <Button size="sm" variant="outline" className="self-end" onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedBrand(""); setSelectedTagging("All"); }}>
            Reset
          </Button>
        </div>

        {!aiLoading && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <MousePointerClick className="h-3.5 w-3.5" />
            Click a product row to enter the <strong>{selectedField}</strong> value inline. Press Enter or ✓ to save.
          </p>
        )}
      </div>

      {/* ── AI action card ── */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 card-shadow flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">AI Auto-Fill — {selectedField}</p>
            <p className="text-xs text-purple-600 mt-0.5">
              Use AI to automatically fill <strong>{selectedField}</strong> for all {mockProducts.length} products instantly. Unfilled values will be suggested based on product data.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {filledCount > 0 && (
            <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 text-sm" onClick={handleClearAll}>
              <XCircle className="h-4 w-4" /> Clear All
            </Button>
          )}
          <Button
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm"
            onClick={handleAiFill}
            disabled={aiLoading}
          >
            {aiLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Filling…</>
              : <><Sparkles className="h-4 w-4" /> AI Fill All</>
            }
          </Button>
        </div>
        {aiLoading && (
          <div className="w-full h-1 bg-purple-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.3, ease: "easeInOut" }}
            />
          </div>
        )}
      </div>

      {/* product table */}
      <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {mockProducts.length} products
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-12">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-primary">{selectedField}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, idx) => (
                <ProductRow
                  key={product.id}
                  idx={idx + 1}
                  product={product}
                  state={productStates[product.id]}
                  selectedField={selectedField}
                  onSelect={() => handleSelect(product.id)}
                  onSave={() => handleSave(product.id)}
                  onClear={() => handleClear(product.id)}
                  onInputChange={(v) => update(product.id, { inputVal: v })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
