import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Check, CheckSquare, Square,
  ImageOff, Filter, X, ChevronDown, Tag, Layers,
  DollarSign, Store, SlidersHorizontal, Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Helpers ─────────────────────────────────────────────────────

function getLastCategory(category) {
  if (!category) return null;
  const parts = category.split(" > ");
  return parts[parts.length - 1].trim();
}

// ─── Filter Pill ─────────────────────────────────────────────────

function FilterPill({ label, value, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
      {label}: <span className="font-semibold">{value}</span>
      <button onClick={onClear} className="hover:text-primary/60 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ─── Dropdown Select ─────────────────────────────────────────────

function DropdownSelect({ icon: Icon, placeholder, options, value, onChange, color = "text-muted-foreground" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors text-sm w-full ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
        <span className="flex-1 text-left truncate">{value || placeholder}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto"
          >
            <div
              onClick={() => { onChange(null); setOpen(false); }}
              className="px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              All
            </div>
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                  value === opt
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-secondary/50 text-foreground"
                }`}
              >
                {opt}
                {value === opt && <Check className="h-3.5 w-3.5" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Price Range Inputs ───────────────────────────────────────────

function PriceRange({ minPrice, maxPrice, priceMin, priceMax, onMinChange, onMaxChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
        <Input
          type="number"
          placeholder={minPrice?.toLocaleString() || "Min"}
          value={priceMin}
          onChange={e => onMinChange(e.target.value)}
          className="pl-6 h-9 text-sm bg-card border-border"
        />
      </div>
      <span className="text-muted-foreground text-xs shrink-0">—</span>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
        <Input
          type="number"
          placeholder={maxPrice?.toLocaleString() || "Max"}
          value={priceMax}
          onChange={e => onMaxChange(e.target.value)}
          className="pl-6 h-9 text-sm bg-card border-border"
        />
      </div>
    </div>
  );
}

// ─── Main ProductAssignView ───────────────────────────────────────

export default function ProductAssignView({
  labelName,
  valueName,
  assignedIds,
  onSave,
  onBack,
  products,
  loading,
}) {
  const [tab, setTab]           = useState("smart"); // "smart" | "manual"
  const [selected, setSelected] = useState(new Set(assignedIds));
  const [search, setSearch]     = useState("");

  // Smart filters
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterBrand, setBrand]             = useState(null);
  const [priceMin, setPriceMin]             = useState("");
  const [priceMax, setPriceMax]             = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);

  // ── Unique options from products ──
  const categories = useMemo(() =>
    [...new Set(products.map(p => getLastCategory(p.category)).filter(Boolean))].sort(),
    [products]
  );

  const brands = useMemo(() =>
    [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
    [products]
  );

  const prices = useMemo(() => ({
    min: Math.min(...products.map(p => p.price || 0).filter(Boolean)),
    max: Math.max(...products.map(p => p.price || 0).filter(Boolean)),
  }), [products]);

  // ── Filtered products (Smart tab) ──
  const smartFiltered = useMemo(() => {
    return products.filter(p => {
      if (filterCategory && getLastCategory(p.category) !== filterCategory) return false;
      if (filterBrand    && p.brand !== filterBrand)                        return false;
      if (priceMin       && (p.price || 0) < Number(priceMin))              return false;
      if (priceMax       && (p.price || 0) > Number(priceMax))              return false;
      return true;
    });
  }, [products, filterCategory, filterBrand, priceMin, priceMax]);

  // ── Filtered products (Manual tab) ──
  const manualFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      p.product_name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  }, [products, search]);

  // ── Active filter count ──
  const activeFilterCount = [filterCategory, filterBrand, priceMin, priceMax].filter(Boolean).length;

  function clearAllFilters() {
    setFilterCategory(null);
    setBrand(null);
    setPriceMin("");
    setPriceMax("");
    setFiltersApplied(false);
  }

  // ── Toggle single product ──
  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Smart: Select all filtered ──
  function selectAllFiltered() {
    const ids = smartFiltered.map(p => p._id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      allSelected
        ? ids.forEach(id => next.delete(id))
        : ids.forEach(id => next.add(id));
      return next;
    });
  }

  // ── Manual: toggle all ──
  function toggleAllManual() {
    const ids = manualFiltered.map(p => p._id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      allSelected
        ? ids.forEach(id => next.delete(id))
        : ids.forEach(id => next.add(id));
      return next;
    });
  }

  const smartAllSelected =
    smartFiltered.length > 0 &&
    smartFiltered.every(p => selected.has(p._id));

  const manualAllSelected =
    manualFiltered.length > 0 &&
    manualFiltered.every(p => selected.has(p._id));

  // ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Assign Products</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{labelName}</span>
            {" → "}
            <Badge className="bg-primary/10 text-primary border-0 text-xs">
              {valueName}
            </Badge>
          </p>
        </div>
        <div className="ml-auto">
          <Badge className="bg-primary/10 text-primary border-0 text-sm px-3 py-1">
            {selected.size} selected
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit border border-border">
        {[
          { key: "smart",  label: "Smart Filter", icon: Sparkles },
          { key: "manual", label: "Manual Select", icon: SlidersHorizontal },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── SMART FILTER TAB ── */}
      {tab === "smart" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Filter Controls */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Filter Products</span>
              {activeFilterCount > 0 && (
                <Badge className="bg-primary/10 text-primary border-0 text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Category
                </label>
                <DropdownSelect
                  icon={Layers}
                  placeholder="All Categories"
                  options={categories}
                  value={filterCategory}
                  onChange={setFilterCategory}
                  color="text-blue-500"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" /> Brand
                </label>
                <DropdownSelect
                  icon={Store}
                  placeholder="All Brands"
                  options={brands}
                  value={filterBrand}
                  onChange={setBrand}
                  color="text-purple-500"
                />
              </div>

              {/* Price Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Price Range
                </label>
                <PriceRange
                  minPrice={prices.min}
                  maxPrice={prices.max}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  onMinChange={setPriceMin}
                  onMaxChange={setPriceMax}
                />
              </div>
            </div>

            {/* Active Filter Pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {filterCategory && (
                  <FilterPill label="Category" value={filterCategory} onClear={() => setFilterCategory(null)} />
                )}
                {filterBrand && (
                  <FilterPill label="Brand" value={filterBrand} onClear={() => setBrand(null)} />
                )}
                {(priceMin || priceMax) && (
                  <FilterPill
                    label="Price"
                    value={`₹${priceMin || "0"} — ₹${priceMax || "∞"}`}
                    onClear={() => { setPriceMin(""); setPriceMax(""); }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Result Bar */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{smartFiltered.length}</span> products match
              {smartFiltered.filter(p => selected.has(p._id)).length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  ({smartFiltered.filter(p => selected.has(p._id)).length} selected)
                </span>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={selectAllFiltered}
              disabled={smartFiltered.length === 0}
            >
              {smartAllSelected
                ? <><CheckSquare className="h-3.5 w-3.5" /> Deselect All Filtered</>
                : <><Square className="h-3.5 w-3.5" /> Select All Filtered ({smartFiltered.length})</>
              }
            </Button>
          </div>

          {/* Product Table */}
          <ProductTable
            products={smartFiltered}
            selected={selected}
            onToggle={toggle}
            loading={loading}
          />
        </motion.div>
      )}

      {/* ── MANUAL SELECT TAB ── */}
      {tab === "manual" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or brand..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-0"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={toggleAllManual}
            >
              {manualAllSelected
                ? <><CheckSquare className="h-4 w-4" /> Deselect All</>
                : <><Square className="h-4 w-4" /> Select All ({manualFiltered.length})</>
              }
            </Button>
          </div>

          <ProductTable
            products={manualFiltered}
            selected={selected}
            onToggle={toggle}
            loading={loading}
          />
        </motion.div>
      )}

      {/* Save Bar */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t border-border pt-4 pb-2 flex gap-3">
        <Button
          className="bg-primary text-primary-foreground gap-2"
          onClick={() => onSave([...selected])}
          disabled={selected.size === 0}
        >
          <Check className="h-4 w-4" />
          Save — {selected.size} product{selected.size !== 1 ? "s" : ""} assigned
        </Button>
        <Button variant="outline" onClick={onBack}>Cancel</Button>
      </div>
    </motion.div>
  );
}

// ─── Shared Product Table ─────────────────────────────────────────

function ProductTable({ products, selected, onToggle, loading }) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border py-12 text-center text-sm text-muted-foreground">
        Loading products...
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 w-10" />
            <th className="px-4 py-3 w-12 text-left text-xs font-medium text-muted-foreground">Image</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Brand</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {products.map(product => {
              const isChecked = selected.has(product._id);
              return (
                <motion.tr
                  key={product._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onToggle(product._id)}
                  className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                    isChecked ? "bg-primary/5" : "hover:bg-secondary/30"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isChecked ? "bg-primary border-primary" : "border-muted-foreground/40"
                    }`}>
                      {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                      {product.additional_image1 ? (
                        <img src={product.additional_image1} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-[220px]">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{product.sourceId}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {getLastCategory(product.category) || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {product.brand || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    ₹{product.price?.toLocaleString() || "—"}
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>

          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
