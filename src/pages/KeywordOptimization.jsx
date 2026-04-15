import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import API from "@/hooks/useApi";
import {
  FileText, Search, PencilLine, MinusCircle, Plus, X,
  ArrowLeftRight, Trash2, CheckCircle, AlertCircle, Tag, Package,
  Zap, Upload, Bot, Play, RotateCcw,
  Check, AlertTriangle, Loader2, Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// CONSTANTS
// ============================================
const THUMB_COLORS = [
  'bg-info/10 text-info',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
  'bg-destructive/10 text-destructive',
  'bg-primary/10 text-primary',
  'bg-accent text-accent-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-muted text-muted-foreground',
];

const PER_PAGE = 5;

const RULE_CONDITIONS = ['Category', 'Brand', 'Price >', 'Price <', 'Title contains', 'SKU contains'];
const RULE_TYPES = ['Active keyword', 'Negative keyword'];

// ============================================
// HELPERS
// ============================================
function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function ruleMatchesProduct(rule, product) {
  const val = rule.value.toLowerCase().trim();
  switch (rule.condition) {
    case 'Category':       return product.category?.toLowerCase() === val;
    case 'Brand':          return product.brand?.toLowerCase() === val;
    case 'Price >':        return product.price > parseFloat(val);
    case 'Price <':        return product.price < parseFloat(val);
    case 'Title contains': return product.name.toLowerCase().includes(val);
    case 'SKU contains':   return product.sku.toLowerCase().includes(val);
    default:               return false;
  }
}

function applyRulesToProducts(products, rules) {
  return products.map((p) => {
    let updatedActive = [...p.active];
    let updatedInactive = [...p.inactive];
    rules.forEach((rule) => {
      if (!ruleMatchesProduct(rule, p)) return;
      const kws = rule.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      if (rule.type === 'Active keyword') {
        kws.forEach((k) => { if (!updatedActive.includes(k)) updatedActive.push(k); });
      } else {
        kws.forEach((k) => { if (!updatedInactive.includes(k)) updatedInactive.push(k); });
      }
    });
    return { ...p, active: updatedActive, inactive: updatedInactive };
  });
}

function countRuleMatches(rule, products) {
  return products.filter((p) => ruleMatchesProduct(rule, p)).length;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const skuIdx = header.indexOf('sku');
  const kwIdx  = header.indexOf('keywords');
  const negIdx = header.indexOf('negative_keywords');
  if (skuIdx === -1 || kwIdx === -1) return null;
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''));
    return {
      sku: cols[skuIdx] || '',
      keywords: cols[kwIdx] ? cols[kwIdx].split(';').map((k) => k.trim()).filter(Boolean) : [],
      negativeKeywords: negIdx !== -1 && cols[negIdx] ? cols[negIdx].split(';').map((k) => k.trim()).filter(Boolean) : [],
    };
  }).filter((r) => r.sku);
}

// ============================================
// ValueInput
// ============================================
function ValueInput({ condition, value, onChange, products }) {
  const uniqueCategories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);
  const uniqueBrands     = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(), [products]);
  const priceRange       = useMemo(() => {
    const prices = products.map((p) => p.price).filter(Boolean);
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 99999 };
  }, [products]);

  const selectCls = "border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring flex-1 min-w-[100px]";
  const inputCls  = "flex-1 min-w-[100px] border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring";

  if (condition === 'Category') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        <option value="">Select category…</option>
        {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    );
  }
  if (condition === 'Brand') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        <option value="">Select brand…</option>
        {uniqueBrands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
    );
  }
  if (condition === 'Price >' || condition === 'Price <') {
    return (
      <div className="flex-1 min-w-[100px] flex flex-col gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`e.g. ${condition === 'Price >' ? priceRange.min : priceRange.max}`}
          min={0}
          className={inputCls}
        />
        <span className="text-[10px] text-muted-foreground">
          Range: ₹{priceRange.min.toLocaleString()} – ₹{priceRange.max.toLocaleString()}
        </span>
      </div>
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={condition === 'Title contains' ? 'e.g. refurb, pro…' : 'e.g. WH-, SNY-…'}
      className={inputCls}
    />
  );
}

// ============================================
// ProductThumb
// ============================================
function ProductThumb({ name }) {
  const cls = THUMB_COLORS[(name || '?').charCodeAt(0) % THUMB_COLORS.length];
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-medium flex-shrink-0 border border-border ${cls}`}>
      {getInitials(name || '??')}
    </div>
  );
}

// ============================================
// DeleteModal
// ============================================
function DeleteModal({ kw, type, onConfirm, onCancel }) {
  const isActive = type === 'active';
  return (
    <div className="fixed inset-0 bg-black/35 z-[999] flex items-center justify-center" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${isActive ? 'bg-info/10' : 'bg-destructive/10'}`}>
          <Trash2 size={16} className={isActive ? 'text-info' : 'text-destructive'} />
        </div>
        <p className="text-sm font-medium text-foreground mb-2">Remove keyword?</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-5">
          Remove{' '}
          <span className={`font-medium px-2.5 py-0.5 rounded-full ${isActive ? 'bg-info/10 text-info' : 'bg-destructive/10 text-destructive'}`}>{kw}</span>
          {' '}from {type} keywords?
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-border bg-secondary text-secondary-foreground hover:bg-accent">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none bg-destructive text-destructive-foreground hover:opacity-90">Remove</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// KwTag
// ============================================
function KwTag({ kw, variant, onDelete, onMove, moveTitle }) {
  const variantCls = {
    active:    'bg-info/10 text-info',
    suggested: 'bg-success/10 text-success',
    negative:  'bg-destructive/10 text-destructive',
  };
  return (
    <span className={`inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full text-xs leading-none ${variantCls[variant] || variantCls.active}`}>
      {kw}
      <span className="inline-flex items-center gap-0.5 ml-1">
        <span className="w-px h-3 bg-current opacity-20 mx-0.5" />
        <button onClick={() => onMove(kw)} title={moveTitle} className="w-[18px] h-[18px] flex items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent text-inherit p-0">
          <ArrowLeftRight size={11} />
        </button>
        <button onClick={() => onDelete(kw)} title="Remove" className="w-[18px] h-[18px] flex items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent text-inherit p-0">
          <X size={11} />
        </button>
      </span>
    </span>
  );
}

// ============================================
// RuleEngineTab
// ============================================
function RuleEngineTab({ rules, setRules, products, onRunRules }) {
  const [newRule, setNewRule] = useState({ condition: 'Category', value: '', keywords: '', type: 'Active keyword' });
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning]     = useState(false);

  const handleConditionChange = (condition) => {
    setNewRule((p) => ({ ...p, condition, value: '' }));
  };

  const addRule = () => {
    if (!newRule.value.trim() || !newRule.keywords.trim()) return;
    setRules((prev) => [...prev, { ...newRule, id: Date.now() }]);
    setNewRule((p) => ({ ...p, value: '', keywords: '' }));
    setRunResult(null);
  };

  const deleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setRunResult(null);
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const updated = applyRulesToProducts(products, rules);
    onRunRules(updated);
    const affected = updated.filter((p, i) =>
      JSON.stringify(p.active) !== JSON.stringify(products[i]?.active) ||
      JSON.stringify(p.inactive) !== JSON.stringify(products[i]?.inactive)
    ).length;
    setRunResult({ affected, total: products.length });
    setRunning(false);
  };

  const coveredCount = [...new Set(
    rules.flatMap((r) => products.filter((p) => ruleMatchesProduct(r, p)).map((p) => p.id))
  )].length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-[11px] text-muted-foreground mb-3">Rules apply keywords to all matching products automatically.</p>
        {runResult && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-xs text-success">
            <Check size={13} />
            Rules applied! {runResult.affected} of {runResult.total} products updated.
          </div>
        )}
        <div className="space-y-2 mb-4">
          {rules.map((rule) => {
            const matches = countRuleMatches(rule, products);
            const isNeg   = rule.type === 'Negative keyword';
            return (
              <div key={rule.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-secondary text-xs">
                <div className="flex-1 min-w-0">
                  <span className="text-muted-foreground">If </span>
                  <span className="font-medium text-foreground">{rule.condition} = "{rule.value}"</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${isNeg ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}>
                    {rule.keywords}
                  </span>
                  {isNeg && <span className="ml-1 text-[10px] text-destructive">(negative)</span>}
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{matches} products</span>
                <button onClick={() => deleteRule(rule.id)} className="w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer border-none bg-transparent p-0 flex-shrink-0">
                  <X size={12} />
                </button>
              </div>
            );
          })}
          {rules.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No rules yet. Add one below.</p>
          )}
        </div>
        <div className="p-3 rounded-lg border border-dashed border-border bg-card space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Add new rule</p>
          <div className="flex gap-2 flex-wrap">
            <select
              value={newRule.condition}
              onChange={(e) => handleConditionChange(e.target.value)}
              className="border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring">
              {RULE_CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ValueInput
              condition={newRule.condition}
              value={newRule.value}
              onChange={(val) => setNewRule((p) => ({ ...p, value: val }))}
              products={products}
            />
            <select
              value={newRule.type}
              onChange={(e) => setNewRule((p) => ({ ...p, type: e.target.value }))}
              className="border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring">
              {RULE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              value={newRule.keywords}
              onChange={(e) => setNewRule((p) => ({ ...p, keywords: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addRule()}
              placeholder="Keywords (comma separated)…"
              className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring"
            />
            <button
              onClick={addRule}
              disabled={!newRule.value.trim() || !newRule.keywords.trim()}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 flex-shrink-0 disabled:opacity-40 disabled:cursor-default">
              + Add
            </button>
          </div>
          {newRule.value.trim() && (
            <p className="text-[10px] text-muted-foreground">
              {countRuleMatches(newRule, products)} product{countRuleMatches(newRule, products) !== 1 ? 's' : ''} match this condition
            </p>
          )}
        </div>
      </div>
      <div className="p-3 border-t border-border flex items-center gap-3 bg-secondary/50">
        <span className="text-[11px] text-muted-foreground flex-1">
          {rules.length} rules · covers {coveredCount} products
        </span>
        <button
          onClick={handleRun}
          disabled={running || rules.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-default transition-colors">
          {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          {running ? 'Applying…' : 'Run all rules'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// CSVImportTab
// ============================================
function CSVImportTab({ products, onApply }) {
  const [parsed, setParsed]     = useState(null);
  const [error, setError]       = useState('');
  const [preview, setPreview]   = useState([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied]   = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setError(''); setApplied(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);
      if (!result) { setError('Invalid CSV format. Need columns: sku, keywords, negative_keywords'); setParsed(null); return; }
      setParsed(result);
      const prev = result.slice(0, 5).map((row) => {
        const prod = products.find((p) => p.sku.toLowerCase() === row.sku.toLowerCase());
        return { ...row, matched: !!prod, productName: prod?.name || 'Not found' };
      });
      setPreview(prev);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [products]);

  const handleApply = async () => {
    if (!parsed) return;
    setApplying(true);
    await new Promise((r) => setTimeout(r, 800));
    const updated = products.map((p) => {
      const row = parsed.find((r) => r.sku.toLowerCase() === p.sku.toLowerCase());
      if (!row) return p;
      return {
        ...p,
        active:   [...new Set([...p.active,   ...row.keywords])],
        inactive: [...new Set([...p.inactive, ...row.negativeKeywords])],
      };
    });
    onApply(updated);
    setApplying(false);
    setApplied(true);
  };

  const downloadTemplate = () => {
    const csv = `sku,keywords,negative_keywords\nWH-1000XM4,Bluetooth;Wireless;Sony,Cheap;Used\nSW-ELT-44-W,Smartwatch;GPS,Fake`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'keywords_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const matchedCount = parsed
    ? parsed.filter((r) => products.some((p) => p.sku.toLowerCase() === r.sku.toLowerCase())).length
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {!parsed ? (
          <>
            <div
              onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors mb-3">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              <Upload size={24} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Drop your CSV here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Columns: sku, keywords, negative_keywords</p>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                <AlertTriangle size={13} />{error}
              </div>
            )}
            <button onClick={downloadTemplate} className="text-xs text-primary underline cursor-pointer bg-transparent border-none p-0 mt-2">
              Download template CSV
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-success/10 text-success font-medium">{matchedCount} matched</span>
                <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground">{parsed.length - matchedCount} unmatched</span>
                <span className="text-muted-foreground">{parsed.length} total rows</span>
              </div>
              <button onClick={() => { setParsed(null); setPreview([]); setApplied(false); }} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none p-0">
                <RotateCcw size={12} className="inline mr-1" />Clear
              </button>
            </div>
            {applied && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-xs text-success">
                <Check size={13} />Keywords applied to {matchedCount} products successfully!
              </div>
            )}
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview (first 5 rows)</p>
            <div className="space-y-1.5">
              {preview.map((row, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${row.matched ? 'border-success/30 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {row.matched ? <Check size={11} className="text-success flex-shrink-0" /> : <X size={11} className="text-destructive flex-shrink-0" />}
                    <span className="font-medium text-foreground">{row.sku}</span>
                    <span className="text-muted-foreground truncate">{row.productName}</span>
                  </div>
                  {row.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-4">
                      {row.keywords.map((k) => <span key={k} className="px-1.5 py-0.5 rounded-full bg-info/10 text-info text-[10px]">{k}</span>)}
                      {row.negativeKeywords.map((k) => <span key={k} className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px]">{k} (neg)</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {parsed && (
        <div className="p-3 border-t border-border flex items-center gap-3 bg-secondary/50">
          <span className="text-[11px] text-muted-foreground flex-1">{matchedCount} products will be updated</span>
          <button
            onClick={handleApply}
            disabled={applying || applied || matchedCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-default transition-colors">
            {applying ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {applying ? 'Applying…' : applied ? 'Applied!' : 'Apply to products'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// AIBatchTab
// ============================================
function AIBatchTab({ products, onApply, onSave }) {
  const [suggestions, setSuggestions]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [accepted, setAccepted]           = useState({});
  const [applied, setApplied]             = useState(false);
  const [error, setError]                 = useState('');

  // New states
  const [selectionType, setSelectionType]   = useState('all');
  const [selectionValue, setSelectionValue] = useState('');
  const [customCount, setCustomCount]       = useState(50);

  // Unique categories & brands
  const categories = useMemo(() => {
    console.log('Products:', products);
    return [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  }, [products]);
  const brands     = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(), [products]);

  // Selected products based on filter
  const selectedProducts = useMemo(() => {
    switch(selectionType) {
      case 'category': return products.filter(p => p.category === selectionValue);
      case 'brand':    return products.filter(p => p.brand === selectionValue);
      case 'count':    return products.slice(0, Math.min(customCount, products.length));
      default:         return products; // all
    }
  }, [selectionType, selectionValue, customCount, products]);

  const selectCls = "border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring";

const generateSuggestions = async () => {
  if (selectedProducts.length === 0) return;
  setLoading(true); setError(''); setSuggestions([]); setAccepted({}); setApplied(false);
  try {
    const BATCH_SIZE = 3; // 3 products per AI call
    const allParsed = [];

    for (let i = 0; i < selectedProducts.length; i += BATCH_SIZE) {
      const batch = selectedProducts.slice(i, i + BATCH_SIZE);
      const res = await API.post('/keywords/ai-suggest', { products: batch });
      if (res.data?.data) {
        allParsed.push(...res.data.data);
      }
    }

    const withNew = allParsed.map((s) => {
      const prod = selectedProducts.find((p) => String(p.id) === String(s.id));
      return {
        ...s,
        name:        prod?.name || '',
        newActive:   s.active.filter((k) => !prod?.active.includes(k)),
  
      };
    }).filter((s) => s.newActive.length > 0 || s.newNegative.length > 0);

    setSuggestions(withNew);
  } catch (e) {
    setError('Failed to generate suggestions. Please try again.');
  }
  setLoading(false);
};

  const toggleAccept  = (id, kw, type) => {
    const key = `${id}__${type}__${kw}`;
    setAccepted((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const isAccepted    = (id, kw, type) => !!accepted[`${id}__${type}__${kw}`];
  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  const acceptAll = () => {
    const next = {};
    suggestions.forEach((s) => {
      if (s.confidence >= 0.8) {
        s.newActive.forEach((k)   => { next[`${s.id}__active__${k}`]   = true; });
        
      }
    });
    setAccepted(next);
  };

 const applyAccepted = async () => {
  const updated = products.map((p) => {
    const sugg = suggestions.find((s) => String(s.id) === String(p.id));
    if (!sugg) return p;
    return {
      ...p,
      active:   [...new Set([...p.active,   ...sugg.newActive.filter((k) => isAccepted(p.id, k, 'active'))])],
     
    };
  });

  onApply(updated); 
  setApplied(true);


  try {
    await onSave(); 
  } catch {
  
  }
};

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Selection UI ── */}
        {suggestions.length === 0 && !loading && (
          <div className="space-y-4">

            {/* Selection controls */}
            <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
              <p className="text-xs font-medium text-foreground">Select products to optimize</p>

              {/* Type dropdown */}
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={selectionType}
                  onChange={(e) => { setSelectionType(e.target.value); setSelectionValue(''); }}
                  className={selectCls}
                >
                  <option value="all">All products</option>
                  <option value="category">By Category</option>
                  <option value="brand">By Brand</option>
                  <option value="count">Custom count</option>
                </select>

                {/* Category dropdown */}
                {selectionType === 'category' && (
                  <select
                    value={selectionValue}
                    onChange={(e) => setSelectionValue(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}

                {/* Brand dropdown */}
                {selectionType === 'brand' && (
                  <select
                    value={selectionValue}
                    onChange={(e) => setSelectionValue(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select brand...</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}

                {/* Count input */}
                {selectionType === 'count' && (
                  <input
                    type="number"
                    min={1}
                    max={products.length}
                    value={customCount}
                    onChange={(e) => setCustomCount(parseInt(e.target.value) || 1)}
                    className={`${selectCls} w-24`}
                    placeholder="Count..."
                  />
                )}
              </div>

              {/* Count badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${selectedProducts.length > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  {selectedProducts.length} products selected
                </span>
                {selectionType === 'category' && selectionValue && (
                  <span className="text-xs text-muted-foreground">Category: {selectionValue}</span>
                )}
                {selectionType === 'brand' && selectionValue && (
                  <span className="text-xs text-muted-foreground">Brand: {selectionValue}</span>
                )}
              </div>
            </div>

            {/* Generate button */}
            <div className="text-center py-4">
              <Bot size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">AI Keyword Suggestions</p>
              <p className="text-xs text-muted-foreground mb-4">
                AI will analyze {selectedProducts.length} selected products and suggest relevant keywords.
              </p>
              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive mb-3 text-left">
                  <AlertTriangle size={13} />{error}
                </div>
              )}
              <button
                onClick={generateSuggestions}
                disabled={selectedProducts.length === 0 || (selectionType === 'category' && !selectionValue) || (selectionType === 'brand' && !selectionValue)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer border-none hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-default">
                <Bot size={15} /> Generate for {selectedProducts.length} products
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-10">
            <Loader2 size={28} className="text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm font-medium text-foreground">Analyzing {selectedProducts.length} products…</p>
            <p className="text-xs text-muted-foreground mt-1">AI is reading product titles, categories, and brands</p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <>
            {applied && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-xs text-success">
                <Check size={13} />{acceptedCount} keywords applied to products!
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{suggestions.length} products have new suggestions</span>
              <button onClick={acceptAll} className="text-xs text-primary font-medium cursor-pointer bg-transparent border-none p-0 hover:underline">
                Accept all high-confidence
              </button>
            </div>
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div key={s.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground truncate flex-1 mr-2">{s.name}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.confidence >= 0.8 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {Math.round(s.confidence * 100)}% conf.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.newActive.map((k) => (
                      <button key={k} onClick={() => toggleAccept(s.id, k, 'active')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] cursor-pointer border transition-colors ${isAccepted(s.id, k, 'active') ? 'bg-info text-white border-info' : 'bg-info/10 text-info border-info/30 hover:bg-info/20'}`}>
                        {isAccepted(s.id, k, 'active') && <Check size={10} />}{k}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="p-3 border-t border-border flex items-center gap-3 bg-secondary/50">
          <span className="text-[11px] text-muted-foreground flex-1">{acceptedCount} keywords selected</span>
          <button onClick={() => { setSuggestions([]); setAccepted({}); setApplied(false); }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs cursor-pointer hover:bg-secondary">
            <RotateCcw size={12} /> Back
          </button>
          <button onClick={generateSuggestions}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs cursor-pointer hover:bg-secondary">
            <RotateCcw size={12} /> Regenerate
          </button>
          <button
            onClick={applyAccepted}
            disabled={acceptedCount === 0 || applied}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-default transition-colors">
            <Check size={13} />{applied ? 'Applied!' : `Apply ${acceptedCount} keywords`}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN
// ============================================
export default function KeywordOptimization() {
  const { user, currentStoreId } = useAuth();
  const token = user?.token || localStorage.getItem('token');

  // ── State ──────────────────────────────────────────────────
  const [products, setProducts]         = useState([]);
  const [rules, setRules]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [dirty, setDirty]               = useState(false);
  const [saveSuccess, setSaveSuccess]   = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [selectedId, setSelectedId]     = useState(null);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [activeInput, setActiveInput]   = useState('');
  const [negInput, setNegInput]         = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const [mode, setMode]                 = useState('manual');
  const [bulkTab, setBulkTab]           = useState('rules');

  // ── API Headers ────────────────────────────────────────────
  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'x-tenant-id':  currentStoreId,
    'Content-Type': 'application/json',
  }), [token, currentStoreId]);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentStoreId) { setLoading(false); return; }
    fetchAll();
  }, [currentStoreId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [prodRes, rulesRes] = await Promise.all([
        fetch(`${API_BASE}/api/keywords/products`, { headers }),
        fetch(`${API_BASE}/api/keywords/rules`,    { headers }),
      ]);
      const prodJson  = await prodRes.json();
      const rulesJson = await rulesRes.json();
      if (prodJson.success) {
        setProducts(prodJson.data);
        if (prodJson.data.length > 0) setSelectedId(prodJson.data[0].id);
      }
      if (rulesJson.success) setRules(rulesJson.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Save ───────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const updates = products.map(p => ({
        id:       p.id,
        active:   p.active,
        inactive: p.inactive,
      }));

      const [kwRes, rulesRes] = await Promise.all([
        fetch(`${API_BASE}/api/keywords/save`, {
          method: 'PUT', headers,
          body: JSON.stringify({ updates }),
        }),
        fetch(`${API_BASE}/api/keywords/rules`, {
          method: 'PUT', headers,
          body: JSON.stringify({ rules }),
        }),
      ]);

      const kwJson = await kwRes.json();
      if (!kwJson.success) throw new Error(kwJson.message);

      setDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Save failed');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  // ── Products update with dirty flag ───────────────────────
  function updateProducts(fn) {
    setProducts(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      setDirty(true);
      return next;
    });
  }

  // ── Derived ────────────────────────────────────────────────
  const selected = products.find((p) => p.id === selectedId);

  const SUGGESTED_POOL = useMemo(() => {
    const brands     = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return [...new Set([...brands, ...categories,
      'Wireless', 'Premium', 'Bestseller', 'New Arrival',
      'Sale', 'Lightweight', 'Waterproof', 'Original',
    ])];
  }, [products]);

  const totalActive = products.reduce((a, p) => a + p.active.length, 0);
  const fullyTagged = products.filter((p) => p.active.length > 0).length;
  const missing     = products.filter((p) => p.active.length === 0).length;

  const filtered  = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );
  const maxPage   = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const curPage   = Math.min(page, maxPage);
  const pageSlice = filtered.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);

  // ── Product keyword update helpers ─────────────────────────
  function updateProduct(id, fn) {
    updateProducts((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));
  }

  const addKw = (type) => {
    const val = (type === 'active' ? activeInput : negInput).trim();
    if (!val || !selected) return;
    updateProduct(selectedId, (p) => {
      const field = type === 'active' ? 'active' : 'inactive';
      if (p[field].includes(val)) return p;
      return { ...p, [field]: [...p[field], val] };
    });
    type === 'active' ? setActiveInput('') : setNegInput('');
  };

  const addSuggested = (kw) => {
    if (!selected || selected.active.includes(kw)) return;
    updateProduct(selectedId, (p) => ({ ...p, active: [...p.active, kw] }));
  };

  const moveKw = (kw, dir) => {
    updateProduct(selectedId, (p) =>
      dir === 'activeToNeg'
        ? { ...p, active: p.active.filter((k) => k !== kw), inactive: p.inactive.includes(kw) ? p.inactive : [...p.inactive, kw] }
        : { ...p, inactive: p.inactive.filter((k) => k !== kw), active: p.active.includes(kw) ? p.active : [...p.active, kw] }
    );
  };

  const confirmDelete = () => {
    if (!confirmState) return;
    const { kw, type } = confirmState;
    updateProduct(selectedId, (p) => ({
      ...p,
      active:   type === 'active'   ? p.active.filter((k) => k !== kw)   : p.active,
      inactive: type === 'inactive' ? p.inactive.filter((k) => k !== kw) : p.inactive,
    }));
    setConfirmState(null);
  };

  const suggestedForSelected = selected
    ? SUGGESTED_POOL.filter((s) => !selected.active.includes(s)).slice(0, 4)
    : [];

  const statCards = [
    { label: 'Total products',   val: products.length, sub: 'All products',    iconCls: 'bg-info/10 text-info',               valCls: 'text-info',        Icon: Package },
    { label: 'Active keywords',  val: totalActive,     sub: 'Tags added',      iconCls: 'bg-secondary text-foreground',       valCls: 'text-foreground',  Icon: Tag },
    { label: 'Fully tagged',     val: fullyTagged,     sub: 'Complete',        iconCls: 'bg-success/10 text-success',         valCls: 'text-success',     Icon: CheckCircle },
    { label: 'Missing keywords', val: missing,         sub: 'Needs attention', iconCls: 'bg-destructive/10 text-destructive', valCls: 'text-destructive', Icon: AlertCircle },
  ];

  const bulkTabs = [
    { id: 'rules', label: 'Rule engine', Icon: Zap },
    { id: 'csv',   label: 'CSV import',  Icon: Upload },
    { id: 'ai',    label: 'AI batch',    Icon: Bot },
  ];

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading keywords...</span>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="bg-background min-h-screen">
      {confirmState && (
        <DeleteModal kw={confirmState.kw} type={confirmState.type} onConfirm={confirmDelete} onCancel={() => setConfirmState(null)} />
      )}

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Keyword Optimization</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage active &amp; negative keywords per product</p>
          </div>

          {/* Right side — Save + Mode buttons */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Save feedback */}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-success font-medium">
                <Check size={13} /> Saved!
              </span>
            )}
            {saveError && (
              <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                <AlertTriangle size={13} /> {saveError}
              </span>
            )}
            {dirty && !saveSuccess && !saveError && (
              <span className="text-xs text-warning font-medium">Unsaved changes</span>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-40 disabled:cursor-default transition-all">
              {saving
                ? <Loader2 size={13} className="animate-spin" />
                : <Save size={13} />
              }
              {saving ? 'Saving...' : 'Save changes'}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-border" />

            {/* Mode toggle */}
            <button onClick={() => setMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${mode === 'manual' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}>
              <PencilLine size={13} /> Manual
            </button>
            <button onClick={() => setMode('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${mode === 'bulk' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}>
              <Zap size={13} /> Bulk mode
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-2.5">
          {statCards.map(({ label, val, sub, iconCls, valCls, Icon }) => (
            <div key={label} className="rounded-xl border border-border p-4 flex items-start gap-4 bg-card">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}><Icon size={18} /></div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
                <div className={`text-2xl font-bold mt-0.5 ${valCls}`}>{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Panels ── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: mode === 'bulk' ? '1fr' : '280px minmax(0,1fr) minmax(0,1fr)' }}>

        {mode === 'manual' && (
          <>
             {/* Panel 1 — Catalog */}
              <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      <FileText size={15} /> Product catalog
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{filtered.length} items</span>
                  </div>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      placeholder="Filter by name or SKU…"
                      className="w-full border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {pageSlice.length === 0 && (
                    <div className="px-4 py-5 text-xs text-muted-foreground">No products found</div>
                  )}
                  {pageSlice.map((p) => (
                    <div key={p.id} onClick={() => setSelectedId(p.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border cursor-pointer transition-colors
                        ${p.id === selectedId ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'bg-card border-l-[3px] border-l-transparent hover:bg-secondary'}`}>
                      <ProductThumb name={p.name} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">SKU: {p.sku}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === 'active' ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                          <span className="text-[10px] text-muted-foreground">{p.status === 'active' ? 'Active' : 'Inactive'}</span>
                          {p.active.length > 0 && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-info/10 text-info">{p.active.length} tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    {filtered.length === 0 ? '0' : Math.min((curPage - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(curPage * PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex gap-1">
                    {[
                      { label: '‹', onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: curPage === 1 },
                      ...Array.from({ length: maxPage }, (_, i) => ({ label: String(i + 1), onClick: () => setPage(i + 1), active: curPage === i + 1 })),
                      { label: '›', onClick: () => setPage((p) => Math.min(maxPage, p + 1)), disabled: curPage === maxPage },
                    ].map((b, i) => (
                      <button key={i} onClick={b.onClick} disabled={b.disabled}
                        className={`w-6 h-6 rounded-md border text-xs flex items-center justify-center transition-colors
                          ${b.disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
                          ${b.active ? 'bg-info/10 border-info/30 text-info font-medium' : 'bg-secondary border-border text-muted-foreground hover:bg-info/10 hover:text-info'}`}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
          </>
        )}

          {/* Manual mode panels */}
          {mode === 'manual' && (
            <>
              {/* Active keywords panel */}
              <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      <PencilLine size={15} /> Active keywords
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-info/10 text-info">Suggested</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-info/10 text-info">{selected?.active.length ?? 0}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{selected?.name}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selected && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.active.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-full">Active</span>
                      )}
                      {selected.active.map((kw) => (
                        <KwTag key={kw} kw={kw}
                          variant={SUGGESTED_POOL.includes(kw) ? 'suggested' : 'active'}
                          onDelete={(k) => setConfirmState({ kw: k, type: 'active' })}
                          onMove={(k) => moveKw(k, 'activeToNeg')}
                          moveTitle="Move to negative" />
                      ))}
                      {suggestedForSelected.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-full mt-2">Suggested</span>
                      )}
                      {suggestedForSelected.map((kw) => (
                        <span key={kw} onClick={() => addSuggested(kw)}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs border border-dashed border-border text-muted-foreground cursor-pointer hover:bg-secondary transition-colors">
                          + {kw}
                        </span>
                      ))}
                      {!selected.active.length && !suggestedForSelected.length && (
                        <div className="text-xs text-muted-foreground">No active keywords yet</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-3.5 border-t border-border flex gap-2 items-center">
                  <input value={activeInput} onChange={(e) => setActiveInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKw('active')}
                    placeholder="Add active keyword…"
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-xs bg-secondary text-foreground outline-none focus:border-ring" />
                  <button onClick={() => addKw('active')}
                    className="w-[34px] h-[34px] rounded-lg bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center flex-shrink-0 border-none cursor-pointer transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Negative keywords panel */}
              <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      <MinusCircle size={15} className="text-destructive" /> Negative keywords
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Exclusions</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{selected?.inactive.length ?? 0}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{selected?.name}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selected && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.inactive.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-full">Negative</span>
                      )}
                      {selected.inactive.map((kw) => (
                        <KwTag key={kw} kw={kw} variant="negative"
                          onDelete={(k) => setConfirmState({ kw: k, type: 'inactive' })}
                          onMove={(k) => moveKw(k, 'negToActive')}
                          moveTitle="Move to active" />
                      ))}
                      {!selected.inactive.length && (
                        <div className="text-xs text-muted-foreground">No negative keywords yet</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Bulk mode panel */}
          {mode === 'bulk' && (
            <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden" style={{ gridColumn: 'span 2' }}>
              <div className="flex items-center border-b border-border">
                {bulkTabs.map(({ id, label, Icon: TabIcon }) => (
                  <button key={id} onClick={() => setBulkTab(id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium cursor-pointer border-none bg-transparent transition-colors
                      ${bulkTab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    style={{ borderBottom: bulkTab === id ? '2px solid hsl(var(--primary))' : '2px solid transparent' }}>
                    <TabIcon size={13} />{label}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {bulkTab === 'rules' && (
                  <RuleEngineTab
                    rules={rules}
                    setRules={(fn) => { setRules(fn); setDirty(true); }}
                    products={products}
                    onRunRules={(updated) => updateProducts(updated)}
                  />
                )}
                {bulkTab === 'csv' && (
                  <CSVImportTab products={products} onApply={(updated) => updateProducts(updated)} />
                )}
                {bulkTab === 'ai' && (
                  <AIBatchTab products={products} onApply={(updated) => updateProducts(updated)}onSave={handleSave} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
