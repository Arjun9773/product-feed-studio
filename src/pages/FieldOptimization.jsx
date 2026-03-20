import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ImageOff, Sparkles, Check, X, XCircle, Loader2,
  Pencil, MousePointerClick, Package, Layers,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import API from "@/hooks/useApi";
import { toast } from "sonner";

// Field name → DB field key mapping
const FIELD_MAP = {
  "Product Color": "color",
  "Age Group":     "age_group",
  "Gender":        "gender",
  "Material":      "material",
  "Pattern":       "pattern",
  "GTIN":          "ean_id",
};

const DATA_FIELDS    = Object.keys(FIELD_MAP);
const TAGGING_OPTIONS = ["All", "Untagged", "Tagged"];

// Product row component
function ProductRow({ idx, product, state, selectedField, onSelect, onSave, onClear, onInputChange }) {
  const isFilled  = state?.value !== "" && state?.value != null;
  const isEditing = state?.editing;

  return (
    <tr className={`border-b border-border transition-colors ${isEditing ? "bg-primary/5" : "hover:bg-secondary/30"}`}>
      <td className="px-4 py-3 text-sm text-muted-foreground w-10">{idx}</td>
      <td className="px-4 py-3 w-12">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          {product.image ? (
            <img src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <ImageOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
          {product.product_name || product.title || product.name || "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{product.brand || "—"}</p>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px]">
        <span className="truncate block">{product.category || "—"}</span>
      </td>
      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
        {product.price ? `₹${Number(product.price).toLocaleString()}` : "—"}
      </td>
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
            <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onSave} disabled={!state.inputVal.trim()}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={onSelect}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : isFilled ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{state.value}</span>
            <button onClick={onSelect} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={onClear} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button onClick={onSelect} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group">
            <MousePointerClick className="h-3.5 w-3.5" />
            <span className="italic">Click to add</span>
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        {isFilled
          ? <Badge className="bg-success/10 text-success border-0 text-[10px] gap-1"><Check className="h-2.5 w-2.5" />Filled</Badge>
          : <Badge className="bg-secondary text-muted-foreground border-0 text-[10px]">Empty</Badge>
        }
      </td>
    </tr>
  );
}

export default function FieldOptimization() {
  const [searchParams]                          = useSearchParams();
  const [products,        setProducts]          = useState([]);
  const [loading,         setLoading]           = useState(true);
  const [search,          setSearch]            = useState("");
  const [selectedField,   setSelectedField]     = useState(() => {
    // Auto-select field from URL param (from Feed Audit Fix button)
    const urlField = searchParams.get('field');
    if (urlField) {
      const match = Object.entries(FIELD_MAP).find(([, v]) => v === urlField);
      return match ? match[0] : DATA_FIELDS[0];
    }
    return DATA_FIELDS[0];
  });
  const [selectedTagging, setSelectedTagging]   = useState("Untagged");
  const [selectedCategory,setSelectedCategory]  = useState("");
  const [selectedBrand,   setSelectedBrand]     = useState("");
  const [productStates,   setProductStates]     = useState({});
  const [aiLoading,       setAiLoading]         = useState(false);
  const [saving,          setSaving]            = useState(false);

  const { currentStoreId } = useAuth();

  // Load products missing the selected field
  const loadProducts = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    try {
      const dbField = FIELD_MAP[selectedField];
      const res = await API.get(`/products/missing-field?field=${dbField}`);
      setProducts(res.data);

      // Initialize states
      const states = {};
      res.data.forEach(p => {
        states[p.sourceId] = {
          value:    p[dbField] || "",
          editing:  false,
          inputVal: "",
        };
      });
      setProductStates(states);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [selectedField, currentStoreId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Filter products
  const brands     = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const dbField = FIELD_MAP[selectedField];
    const ps = productStates[p.sourceId];
    const matchesSearch   = (p.product_name || p.title || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat      = selectedCategory ? p.category === selectedCategory : true;
    const matchesBrand    = selectedBrand ? p.brand === selectedBrand : true;
    const matchesTagging  =
      selectedTagging === "All"      ? true :
      selectedTagging === "Tagged"   ? ps?.value !== "" :
                                       ps?.value === "" || ps?.value == null;
    return matchesSearch && matchesCat && matchesBrand && matchesTagging;
  });

  const filledCount = Object.values(productStates).filter(s => s.value !== "").length;

  // State helpers
  function update(id, patch) {
    setProductStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function handleSelect(id) {
    setProductStates(prev => {
      const next = {};
      Object.keys(prev).forEach(k => {
        const isTarget = k === id;
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
    const val = productStates[id]?.inputVal.trim();
    if (!val) return;
    update(id, { value: val, editing: false, inputVal: "" });
  }

  function handleClear(id) {
    update(id, { value: "", editing: false, inputVal: "" });
  }

  function handleFieldChange(field) {
    setSelectedField(field);
  }

  // AI Fill — uses Anthropic API
  const handleAiFill = async () => {
    setAiLoading(true);
    try {
      const unfilledProducts = products.filter(p => !productStates[p.sourceId]?.value);

      if (unfilledProducts.length === 0) {
        toast.info("All products already filled!");
        return;
      }

      // Call AI for each unfilled product
      const updates = await Promise.all(
        unfilledProducts.map(async (product) => {
          try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 100,
                messages: [{
                  role: "user",
                  content: `Product: "${product.product_name || product.title}"
Brand: "${product.brand || ''}"
Category: "${product.category || ''}"

What is the "${selectedField}" for this product? 
Reply with ONLY the value, nothing else. Keep it short (1-3 words max).`
                }]
              })
            });
            const data = await response.json();
            const value = data.content?.[0]?.text?.trim() || "";
            return { id: product.sourceId, value };
          } catch {
            return { id: product.sourceId, value: "" };
          }
        })
      );

      // Update states with AI suggestions
      setProductStates(prev => {
        const next = { ...prev };
        updates.forEach(({ id, value }) => {
          if (value && next[id]) {
            next[id] = { ...next[id], value, editing: false, inputVal: "" };
          }
        });
        return next;
      });

      toast.success(`AI filled ${updates.filter(u => u.value).length} products!`);
    } catch {
      toast.error("AI fill failed");
    } finally {
      setAiLoading(false);
    }
  };

  // Save all to DB
  const handleSaveAll = async () => {
    const filled = Object.entries(productStates).filter(([, s]) => s.value !== "");
    if (filled.length === 0) {
      toast.info("No values to save");
      return;
    }

    setSaving(true);
    try {
      const dbField = FIELD_MAP[selectedField];
      const updates = filled.map(([id, s]) => ({ id, value: s.value }));

      await API.put('/products/bulk-update', { field: dbField, updates });
      toast.success(`Saved ${filled.length} products!`);
      loadProducts(); // Reload to reflect changes
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Field Optimization</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a field to see products missing that value. Fill manually or use AI.
          </p>
        </div>
        {filledCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-success/10 text-success border border-success/30 px-3 py-1 text-xs gap-1">
              <Check className="h-3 w-3" />{filledCount} filled
            </Badge>
            <Button onClick={handleSaveAll} disabled={saving} size="sm" className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Saving..." : "Save All to DB"}
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Missing",    value: products.length,               icon: Package,      color: "text-primary",     bg: "bg-primary/10" },
          { label: "Fields Available", value: DATA_FIELDS.length,            icon: Layers,       color: "text-info",        bg: "bg-info/10" },
          { label: "Filled",           value: filledCount,                    icon: CheckCircle2, color: "text-success",     bg: "bg-success/10" },
          { label: "Remaining",        value: products.length - filledCount,  icon: AlertCircle,  color: "text-warning",     bg: "bg-warning/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border border-border p-4 flex items-start gap-4 ${bg}`}>
            <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Data Field</label>
            <select
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedField}
              onChange={(e) => handleFieldChange(e.target.value)}
            >
              {DATA_FIELDS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedTagging} onChange={e => setSelectedTagging(e.target.value)}>
              {TAGGING_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">All</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Brand</label>
            <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
              <option value="">All</option>
              {brands.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary border-border text-sm" />
          </div>
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedBrand(""); setSelectedTagging("Untagged"); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* AI Fill Card */}
      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">AI Auto-Fill — {selectedField}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
              AI will suggest <strong>{selectedField}</strong> values for all {products.length} missing products instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {filledCount > 0 && (
            <Button variant="outline" className="gap-2 text-destructive border-destructive/30 text-sm"
              onClick={() => {
                const reset = {};
                products.forEach(p => { reset[p.sourceId] = { value: "", editing: false, inputVal: "" }; });
                setProductStates(reset);
              }}>
              <XCircle className="h-4 w-4" /> Clear All
            </Button>
          )}
          <Button
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm"
            onClick={handleAiFill}
            disabled={aiLoading || products.length === 0}
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
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `Showing ${filtered.length} of ${products.length} products missing ${selectedField}`}
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-success font-medium">All products have {selectedField}!</p>
          </div>
        ) : (
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
                    key={product.sourceId}
                    idx={idx + 1}
                    product={product}
                    state={productStates[product.sourceId]}
                    selectedField={selectedField}
                    onSelect={() => handleSelect(product.sourceId)}
                    onSave={() => handleSave(product.sourceId)}
                    onClear={() => handleClear(product.sourceId)}
                    onInputChange={(v) => update(product.sourceId, { inputVal: v })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </motion.div>
  );
}