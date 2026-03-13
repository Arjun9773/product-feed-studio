import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ImageOff, Sparkles, Check, X, Loader2, Pencil, MousePointerClick, XCircle, Package, CheckCircle2, AlertCircle, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts, googleCategories } from "@/data/mockData";

// ─── AI suggestions ───────────────────────────────────────────────────────────

const AI_CATEGORY_SUGGESTIONS = {
  1:  "Electronics > Home appliances",
  2:  "Electronics > Home Entertainment",
  3:  "Electronics > Home appliances",
  4:  "Electronics > Home appliances",
  5:  "Electronics > Home appliances",
  6:  "Electronics > Home & Garden",
  7:  "Electronics > Mobile Phone",
  8:  "Electronics > Kitchen Appliances",
  9:  "Electronics > Home Entertainment",
  10: "Electronics > Home Appliances",
  11: "Electronics > Kitchen Appliances",
};

function initStates() {
  return Object.fromEntries(
    mockProducts.map((p) => [p.id, { value: "", editing: false, inputVal: "" }])
  );
}

// ─── table row ────────────────────────────────────────────────────────────────

function CategoryRow({ idx, product, state, aiSuggestion, onSelect, onSave, onClear, onInputChange }) {
  const isFilled  = state.value !== "";
  const isEditing = state.editing;

  return (
    <tr className={`border-b border-border transition-colors ${isEditing ? "bg-primary/5" : "hover:bg-secondary/30"}`}>

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

      {/* source category */}
      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px]">
        <span className="truncate block">{product.category}</span>
      </td>

      {/* price */}
      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
        ₹{product.price.toLocaleString()}
      </td>

      {/* google category — inline editable dropdown */}
      <td className="px-4 py-3 min-w-[280px]">
        {isEditing ? (
          <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            {aiSuggestion && (
              <button
                type="button"
                onClick={() => onInputChange(aiSuggestion)}
                className="flex items-center gap-1.5 text-[11px] text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md px-2 py-1 w-fit transition-colors"
              >
                <Sparkles className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[200px]">AI: {aiSuggestion}</span>
              </button>
            )}
            <div className="flex items-center gap-1.5">
            <select
              autoFocus
              className="flex-1 min-w-0 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs text-foreground"
              value={state.inputVal}
              onChange={(e) => onInputChange(e.target.value)}
            >
              <option value="">-- Select Category --</option>
              {googleCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Button
              size="sm"
              className="h-8 w-8 p-0 bg-primary text-primary-foreground shrink-0"
              onClick={onSave}
              disabled={!state.inputVal}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground shrink-0"
              onClick={onSelect}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            </div>
          </div>
        ) : isFilled ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{state.value}</span>
            <button
              onClick={onSelect}
              title="Edit category"
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shrink-0"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={onClear}
              title="Remove category"
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSelect}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            <span className="italic">Click to assign</span>
          </button>
        )}
      </td>

      {/* status */}
      <td className="px-4 py-3">
        {isFilled
          ? <Badge className="bg-success/10 text-success border-0 text-[10px] gap-1 whitespace-nowrap"><Check className="h-2.5 w-2.5" />Mapped</Badge>
          : <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] whitespace-nowrap">Not mapped</Badge>
        }
      </td>
    </tr>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function GoogleCategory() {
  const [search, setSearch]                     = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand]       = useState("");
  const [filterStatus, setFilterStatus]         = useState("All");
  const [productStates, setProductStates]       = useState(initStates);
  const [aiLoading, setAiLoading]               = useState(false);

  const brands     = [...new Set(mockProducts.map((p) => p.brand).filter(Boolean))];
  const categories = [...new Set(mockProducts.map((p) => p.category).filter(Boolean))];

  const filtered = mockProducts.filter((p) => {
    const matchesSearch  = p.feedName.toLowerCase().includes(search.toLowerCase());
    const matchesCat     = selectedCategory ? p.category.includes(selectedCategory) : true;
    const matchesBrand   = selectedBrand ? p.brand === selectedBrand : true;
    const ps             = productStates[p.id];
    const matchesStatus  =
      filterStatus === "All"       ? true :
      filterStatus === "Mapped"    ? ps.value !== "" :
                                     ps.value === "";
    return matchesSearch && matchesCat && matchesBrand && matchesStatus;
  });

  const mappedCount = Object.values(productStates).filter((s) => s.value !== "").length;

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
    const val = productStates[id].inputVal;
    if (!val) return;
    update(id, { value: val, editing: false });
  }

  function handleClear(id) {
    update(id, { value: "", editing: false, inputVal: "" });
  }

  function handleAiFill() {
    setAiLoading(true);
    setTimeout(() => {
      setProductStates((prev) => {
        const next = { ...prev };
        mockProducts.forEach((p) => {
          const suggestion = AI_CATEGORY_SUGGESTIONS[p.id];
          if (suggestion && !next[p.id].value) {
            next[p.id] = { ...next[p.id], value: suggestion, inputVal: suggestion, editing: false };
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
          <h1 className="text-2xl font-bold text-foreground">Google Category</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Click the category cell on any row to assign a Google product category inline.
          </p>
        </div>
        {mappedCount > 0 && (
          <Badge className="bg-success/10 text-success border border-success/30 px-3 py-1 text-xs gap-1">
            <Check className="h-3 w-3" />
            {mappedCount} / {mockProducts.length} mapped
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: mockProducts.length, sub: "Products to categorize", icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: "Mapped", value: mappedCount, sub: "Categories assigned", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
          { label: "Unmapped", value: mockProducts.length - mappedCount, sub: "Still need a category", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Available Categories", value: googleCategories.length, sub: "Google category options", icon: Tag, color: "text-info", bg: "bg-info/10" },
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
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option>All</option>
              <option>Mapped</option>
              <option>Not Mapped</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs font-medium text-muted-foreground">Brand</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary border-border pl-8 text-sm" />
            </div>
          </div>

          <Button size="sm" variant="outline" className="self-end" onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedBrand(""); setFilterStatus("All"); }}>
            Clear
          </Button>

          {/* progress */}
          <div className="flex flex-col gap-1 min-w-[160px] self-end">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">{mappedCount} / {mockProducts.length} mapped</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${(mappedCount / mockProducts.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── toolbar ── */}
      <div className="bg-card rounded-xl p-4 card-shadow border border-border">

        <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">

          {/* Left Side */}
          <div className="flex items-start gap-3">
            
            {/* Icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>

            {/* Text */}
            <div>
              <p className="text-sm font-semibold text-purple-700">
                AI Auto-Fill — Google Category
              </p>
              <p className="text-xs text-purple-600">
                Use AI to automatically assign Google Product Categories for all products instantly.
                Unmapped values will be suggested based on product title and description.
              </p>
            </div>

          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-2">

            <Button
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleAiFill}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Filling…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI Fill All
                </>
              )}
            </Button>

            {mappedCount > 0 && (
              <Button
                variant="outline"
                className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleClearAll}
              >
                <XCircle className="h-4 w-4" />
                Clear
              </Button>
            )}

          </div>

        </div>

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
      </div>

      {/* ── table ── */}
      <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} of {mockProducts.length} products</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-12">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Source Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-primary">Google Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, idx) => (
                <CategoryRow
                  key={product.id}
                  idx={idx + 1}
                  product={product}
                  state={productStates[product.id]}
                  aiSuggestion={AI_CATEGORY_SUGGESTIONS[product.id]}
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
