import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import API from "@/hooks/useApi";
import {
  FileText, Search, PencilLine, MinusCircle, Plus, X,
  ArrowLeftRight, Trash2, CheckCircle, AlertCircle, Tag, Package,
  Zap, Upload, Bot, Play, RotateCcw,
  Check, AlertTriangle, Loader2, Save, ToggleLeft, ToggleRight, Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const THUMB_COLORS = [
  'bg-info/10 text-info', 'bg-success/10 text-success',
  'bg-warning/10 text-warning', 'bg-destructive/10 text-destructive',
  'bg-primary/10 text-primary', 'bg-accent text-accent-foreground',
  'bg-secondary text-secondary-foreground', 'bg-muted text-muted-foreground',
];
const PER_PAGE = 5;
const RULE_CONDITIONS = ['Category', 'Brand', 'Price >', 'Price <', 'Title contains', 'SKU contains'];
const RULE_TYPES = ['Active keyword', 'Negative keyword'];

const SOURCE_BADGE = {
  csv:    { label: 'CSV',  cls: 'bg-success/10 text-success' },
  ai:     { label: 'AI',   cls: 'bg-primary/10 text-primary' },
  rule:   { label: 'Rule', cls: 'bg-warning/10 text-warning' },
  manual: { label: null,   cls: '' },
};

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function ruleMatchesProduct(rule, product) {
  if (!rule.enabled) return false;
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
function ruleMatchesProductRaw(rule, product) {
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

function removeRuleKeywords(products, ruleId) {
  return products.map(p => {
    const ownedKws = p.ruleKeywords?.[ruleId] || [];
    const newRuleKeywords = { ...p.ruleKeywords };
    delete newRuleKeywords[ruleId];
    const stillOwnedKws = new Set(Object.values(newRuleKeywords).flat());
    const newSources = { ...(p.keyword_sources || {}) };
    ownedKws.forEach(k => { if (!stillOwnedKws.has(k)) delete newSources[k]; });
    return {
      ...p,
      active:          p.active.filter(k => !ownedKws.includes(k) || stillOwnedKws.has(k)),
      inactive:        p.inactive.filter(k => !ownedKws.includes(k) || stillOwnedKws.has(k)),
      ruleKeywords:    newRuleKeywords,
      keyword_sources: newSources,
    };
  });
}

function applyRulesToProducts(products, rules) {
  return products.map((p) => {
    let updatedActive   = [...p.active];
    let updatedInactive = [...p.inactive];
    let ruleKeywords    = { ...(p.ruleKeywords || {}) };
    let keyword_sources = { ...(p.keyword_sources || {}) };
    rules.forEach((rule) => {
      if (!rule.enabled) return;
      if (!ruleMatchesProduct(rule, p)) return;
      const kws = rule.keywords.split(',').map(k => k.trim()).filter(Boolean);
      ruleKeywords[rule.id] = kws;
      kws.forEach(k => { keyword_sources[k] = 'rule'; });
      if (rule.type === 'Active keyword') {
        kws.forEach(k => { if (!updatedActive.includes(k)) updatedActive.push(k); });
      } else {
        kws.forEach(k => { if (!updatedInactive.includes(k)) updatedInactive.push(k); });
      }
    });
    return { ...p, active: updatedActive, inactive: updatedInactive, ruleKeywords, keyword_sources };
  });
}

function countRuleMatches(rule, products) {
  return products.filter((p) => ruleMatchesProductRaw(rule, p)).length;
}

function parseCSV(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["\r]/g, ''));
  const skuIdx = header.indexOf('sku');
  const kwIdx  = header.indexOf('keywords');
  const negIdx = header.indexOf('negative_keywords');
  if (skuIdx === -1 || kwIdx === -1) return null;
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/["\r]/g, ''));
    return {
      sku: (cols[skuIdx] || '').trim(),
      keywords: cols[kwIdx] ? cols[kwIdx].split(';').map((k) => k.trim()).filter(Boolean) : [],
      negativeKeywords: negIdx !== -1 && cols[negIdx]
        ? cols[negIdx].split(';').map((k) => k.trim()).filter(Boolean)
        : [],
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
  if (condition === 'Category') return <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}><option value="">Select category…</option>{uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select>;
  if (condition === 'Brand')    return <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}><option value="">Select brand…</option>{uniqueBrands.map((b) => <option key={b} value={b}>{b}</option>)}</select>;
  if (condition === 'Price >' || condition === 'Price <') return <div className="flex-1 min-w-[100px] flex flex-col gap-1"><input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`e.g. ${condition === 'Price >' ? priceRange.min : priceRange.max}`} min={0} className={inputCls}/><span className="text-[10px] text-muted-foreground">Range: &#x20B9;{priceRange.min.toLocaleString()} &ndash; &#x20B9;{priceRange.max.toLocaleString()}</span></div>;
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={condition === 'Title contains' ? 'e.g. refurb, pro…' : 'e.g. WH-, SNY-…'} className={inputCls}/>;
}

function ProductThumb({ name }) {
  const cls = THUMB_COLORS[(name || '?').charCodeAt(0) % THUMB_COLORS.length];
  return <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-medium flex-shrink-0 border border-border ${cls}`}>{getInitials(name || '??')}</div>;
}

function DeleteModal({ kw, type, onConfirm, onCancel }) {
  const isActive = type === 'active';
  return (
    <div className="fixed inset-0 bg-black/35 z-[999] flex items-center justify-center" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${isActive ? 'bg-info/10' : 'bg-destructive/10'}`}><Trash2 size={16} className={isActive ? 'text-info' : 'text-destructive'}/></div>
        <p className="text-sm font-medium text-foreground mb-2">Remove keyword?</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-5">Remove <span className={`font-medium px-2.5 py-0.5 rounded-full ${isActive ? 'bg-info/10 text-info' : 'bg-destructive/10 text-destructive'}`}>{kw}</span> from {type} keywords?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-border bg-secondary text-secondary-foreground hover:bg-accent">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none bg-destructive text-destructive-foreground hover:opacity-90">Remove</button>
        </div>
      </div>
    </div>
  );
}

function DryRunModal({ rules, products, onConfirm, onCancel }) {
  const preview = useMemo(() => {
    const updated = applyRulesToProducts(products, rules);
    return updated.map((p, i) => {
      const orig = products[i];
      return { ...p, newActive: p.active.filter(k => !orig.active.includes(k)), newInactive: p.inactive.filter(k => !orig.inactive.includes(k)) };
    }).filter(p => p.newActive.length > 0 || p.newInactive.length > 0);
  }, [rules, products]);
  return (
    <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div><p className="text-sm font-semibold text-foreground">Dry Run Preview</p><p className="text-xs text-muted-foreground mt-0.5">{preview.length} products will be affected</p></div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary cursor-pointer border-none bg-transparent text-muted-foreground"><X size={14}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {preview.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No products will be affected.</p>}
          {preview.map((p) => (
            <div key={p.id} className="p-3 rounded-lg border border-border bg-secondary/30 text-xs">
              <p className="font-medium text-foreground mb-1.5 truncate">{p.name}</p>
              <div className="flex flex-wrap gap-1">
                {p.newActive.map(k   => <span key={k} className="px-2 py-0.5 rounded-full bg-info/10 text-info text-[10px]">+{k}</span>)}
                {p.newInactive.map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px]">-{k} (neg)</span>)}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-border bg-secondary text-secondary-foreground hover:bg-accent">Cancel</button>
          <button onClick={onConfirm} disabled={preview.length === 0} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-40 disabled:cursor-default"><Play size={12}/> Apply to {preview.length} products</button>
        </div>
      </div>
    </div>
  );
}

function KwTag({ kw, variant, source, onDelete, onMove, moveTitle }) {
  const variantCls = {
    active:    'bg-info/10 text-info',
    suggested: 'bg-success/10 text-success',
    negative:  'bg-destructive/10 text-destructive',
  };
  const badge = SOURCE_BADGE[source] || SOURCE_BADGE.manual;
  return (
    <span className={`inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full text-xs leading-none ${variantCls[variant] || variantCls.active}`}>
      {kw}
      {badge?.label && (
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ml-0.5 ${badge.cls}`}>{badge.label}</span>
      )}
      <span className="inline-flex items-center gap-0.5 ml-1">
        <span className="w-px h-3 bg-current opacity-20 mx-0.5"/>
        <button onClick={() => onMove(kw)} title={moveTitle} className="w-[18px] h-[18px] flex items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent text-inherit p-0"><ArrowLeftRight size={11}/></button>
        <button onClick={() => onDelete(kw)} title="Remove" className="w-[18px] h-[18px] flex items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent text-inherit p-0"><X size={11}/></button>
      </span>
    </span>
  );
}

// ============================================
// RuleEngineTab
// ============================================
function RuleEngineTab({ rules, setRules, products, onRunRules, onSave }) {
  const [newRule, setNewRule]       = useState({ condition: 'Category', value: '', keywords: '', type: 'Active keyword' });
  const [runResult, setRunResult]   = useState(null);
  const [running, setRunning]       = useState(false);
  const [showDryRun, setShowDryRun] = useState(false);

  const newRuleMatchCount = useMemo(() => {
    if (!newRule.value.trim()) return 0;
    return countRuleMatches(newRule, products);
  }, [newRule.condition, newRule.value, products]);

  const addRule = () => {
    if (!newRule.value.trim() || !newRule.keywords.trim()) return;
    setRules((prev) => [...prev, { ...newRule, id: Date.now(), enabled: true }]);
    setNewRule((p) => ({ ...p, value: '', keywords: '' }));
    setRunResult(null);
  };

  const deleteRule = (id) => {
    onRunRules(removeRuleKeywords(products, id));
    setRules(prev => prev.filter(r => r.id !== id));
    setRunResult(null);
  };

  const toggleRule = (id) => {
    const rule = rules.find(r => r.id === id);
    if (rule?.enabled) {
      const hasTracked = products.some(p => p.ruleKeywords?.[id]?.length > 0);
      if (hasTracked) {
        onRunRules(removeRuleKeywords(products, id));
      } else {
        const ruleKws = rule.keywords.split(',').map(k => k.trim()).filter(Boolean);
        onRunRules(products.map(p => {
          if (!ruleMatchesProductRaw(rule, p)) return p;
          const newSources = { ...(p.keyword_sources || {}) };
          ruleKws.forEach(k => delete newSources[k]);
          return { ...p, active: p.active.filter(k => !ruleKws.includes(k)), inactive: p.inactive.filter(k => !ruleKws.includes(k)), keyword_sources: newSources };
        }));
      }
    } else {
      onRunRules(applyRulesToProducts(products, rules.map(r => r.id === id ? { ...r, enabled: true } : r)));
    }
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    setRunResult(null);
  };

  const handleDryRunConfirm = async () => {
    setShowDryRun(false); setRunning(true); setRunResult(null);
    await new Promise(r => setTimeout(r, 600));
    const updated = applyRulesToProducts(products, rules);
    onRunRules(updated);
    const affected = updated.filter((p, i) =>
      JSON.stringify(p.active) !== JSON.stringify(products[i]?.active) ||
      JSON.stringify(p.inactive) !== JSON.stringify(products[i]?.inactive)
    ).length;
    setRunResult({ affected, total: products.length });
    setRunning(false);
    try { await onSave(updated); } catch { }
  };

  const coveredCount  = [...new Set(rules.filter(r => r.enabled).flatMap(r => products.filter(p => ruleMatchesProduct(r, p)).map(p => p.id)))].length;
  const enabledCount  = rules.filter(r => r.enabled).length;
  const disabledCount = rules.filter(r => !r.enabled).length;

  return (
    <>
      {showDryRun && <DryRunModal rules={rules.filter(r => r.enabled)} products={products} onConfirm={handleDryRunConfirm} onCancel={() => setShowDryRun(false)}/>}
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[11px] text-muted-foreground mb-3">Rules apply keywords to all matching products automatically.</p>
          {runResult && <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-xs text-success"><Check size={13}/>Rules applied and saved! {runResult.affected} of {runResult.total} products updated.</div>}
          <div className="space-y-2 mb-4">
            {rules.map((rule) => {
              const matches = countRuleMatches(rule, products);
              const isNeg   = rule.type === 'Negative keyword';
              const isOff   = !rule.enabled;
              return (
                <div key={rule.id} className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-opacity ${isOff ? 'opacity-50 border-border bg-secondary/40' : 'border-border bg-secondary'}`}>
                  <button onClick={() => toggleRule(rule.id)} title={rule.enabled ? 'Disable' : 'Enable'} className="flex-shrink-0 cursor-pointer border-none bg-transparent p-0 text-muted-foreground hover:text-foreground">
                    {rule.enabled ? <ToggleRight size={16} className="text-primary"/> : <ToggleLeft size={16}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground">If </span>
                    <span className={`font-medium text-foreground ${isOff ? 'line-through' : ''}`}>{rule.condition} = "{rule.value}"</span>
                    <span className="text-muted-foreground"> then </span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${isNeg ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}>{rule.keywords}</span>
                    {isNeg && <span className="ml-1 text-[10px] text-destructive">(negative)</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{matches} products</span>
                  <button onClick={() => deleteRule(rule.id)} className="w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer border-none bg-transparent p-0 flex-shrink-0"><X size={12}/></button>
                </div>
              );
            })}
            {rules.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No rules yet. Add one below.</p>}
          </div>
          <div className="p-3 rounded-lg border border-dashed border-border bg-card space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Add new rule</p>
            <div className="flex gap-2 flex-wrap">
              <select value={newRule.condition} onChange={(e) => setNewRule(p => ({ ...p, condition: e.target.value, value: '' }))} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring">{RULE_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>
              <ValueInput condition={newRule.condition} value={newRule.value} onChange={(val) => setNewRule(p => ({ ...p, value: val }))} products={products}/>
              <select value={newRule.type} onChange={(e) => setNewRule(p => ({ ...p, type: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring">{RULE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="flex gap-2">
              <input value={newRule.keywords} onChange={(e) => setNewRule(p => ({ ...p, keywords: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addRule()} placeholder="Keywords (comma separated)..." className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring"/>
              <button onClick={addRule} disabled={!newRule.value.trim() || !newRule.keywords.trim()} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 flex-shrink-0 disabled:opacity-40 disabled:cursor-default">+ Add</button>
            </div>
            {newRule.value.trim() && <p className="text-[10px] text-muted-foreground">{newRuleMatchCount} product{newRuleMatchCount !== 1 ? 's' : ''} match this condition</p>}
          </div>
        </div>
        <div className="p-3 border-t border-border flex items-center gap-3 bg-secondary/50 flex-wrap">
          <span className="text-[11px] text-muted-foreground flex-1">{enabledCount} active{disabledCount > 0 ? `, ${disabledCount} disabled` : ''} covers {coveredCount} products</span>
          <button onClick={() => setShowDryRun(true)} disabled={enabledCount === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium cursor-pointer hover:bg-secondary disabled:opacity-40 disabled:cursor-default transition-colors"><Eye size={13}/> Preview</button>
          <button onClick={() => setShowDryRun(true)} disabled={running || enabledCount === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-default transition-colors">
            {running ? <Loader2 size={13} className="animate-spin"/> : <Play size={13}/>}
            {running ? 'Applying...' : 'Run all rules'}
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================
// CSVImportTab
// ============================================
function CSVImportTab({ products, onApply, onSave }) {
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
      if (result.length === 0) { setError('No valid rows found in CSV.'); setParsed(null); return; }
      setParsed(result);
      setPreview(result.slice(0, 5).map((row) => {
        const prod = products.find(p => p.sku.trim().toLowerCase() === row.sku.trim().toLowerCase());
        return { ...row, matched: !!prod, productName: prod?.name || 'Not found' };
      }));
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
    await new Promise(r => setTimeout(r, 800));
    const updated = products.map((p) => {
      const row = parsed.find(r => r.sku.trim().toLowerCase() === p.sku.trim().toLowerCase());
      if (!row) return p;
      const newSources = { ...(p.keyword_sources || {}) };
      row.keywords.forEach(k => { newSources[k] = 'csv'; });
      row.negativeKeywords.forEach(k => { newSources[k] = 'csv'; });
      return {
        ...p,
        active:          [...new Set([...p.active,   ...row.keywords])],
        inactive:        [...new Set([...p.inactive, ...row.negativeKeywords])],
        keyword_sources: newSources,
      };
    });
    onApply(updated);
    setApplying(false);
    setApplied(true);
    try { await onSave(updated); } catch { }
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
    ? parsed.filter(r => products.some(p => p.sku.trim().toLowerCase() === r.sku.trim().toLowerCase())).length
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {!parsed ? (
          <>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current.click()} className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors mb-3">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])}/>
              <Upload size={24} className="text-muted-foreground/40 mx-auto mb-2"/>
              <p className="text-sm font-medium text-foreground">Drop your CSV here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Columns: sku, keywords, negative_keywords</p>
            </div>
            {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive"><AlertTriangle size={13}/>{error}</div>}
            <button onClick={downloadTemplate} className="text-xs text-primary underline cursor-pointer bg-transparent border-none p-0 mt-2">Download template CSV</button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-success/10 text-success font-medium">{matchedCount} matched</span>
                <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground">{parsed.length - matchedCount} unmatched</span>
                <span className="text-muted-foreground">{parsed.length} total rows</span>
              </div>
              <button onClick={() => { setParsed(null); setPreview([]); setApplied(false); }} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none p-0"><RotateCcw size={12} className="inline mr-1"/>Clear</button>
            </div>
            {applied && <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-xs text-success"><Check size={13}/>Keywords applied and saved to {matchedCount} products!</div>}
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview (first 5 rows)</p>
            <div className="space-y-1.5">
              {preview.map((row, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${row.matched ? 'border-success/30 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {row.matched ? <Check size={11} className="text-success flex-shrink-0"/> : <X size={11} className="text-destructive flex-shrink-0"/>}
                    <span className="font-medium text-foreground">{row.sku}</span>
                    <span className="text-muted-foreground truncate">{row.productName}</span>
                  </div>
                  {row.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-4">
                      {row.keywords.map(k => <span key={k} className="px-1.5 py-0.5 rounded-full bg-info/10 text-info text-[10px]">{k}</span>)}
                      {row.negativeKeywords.map(k => <span key={k} className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px]">{k} (neg)</span>)}
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
          <button onClick={handleApply} disabled={applying || applied || matchedCount === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-default transition-colors">
            {applying ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}
            {applying ? 'Applying...' : applied ? 'Applied and Saved!' : 'Apply to products'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// AIBatchTab — OPT-OUT MODEL
// Generate ஆனவுடனே எல்லாம் auto-selected (true)
// Click பண்ணா deselect — strikethrough காட்டும்
// Re-click பண்ணா மீண்டும் select ஆகும்
// ============================================
function AIBatchTab({ products, onApply, onSave }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [accepted, setAccepted]       = useState({});   // true = include, false = removed
  const [applied, setApplied]         = useState(false);
  const [error, setError]             = useState('');
  const [selectionType, setSelectionType]   = useState('all');
  const [selectionValue, setSelectionValue] = useState('');
  const [customCount, setCustomCount]       = useState(50);

  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products]);
  const brands     = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(), [products]);

  const selectedProducts = useMemo(() => {
    switch(selectionType) {
      case 'category': return products.filter(p => p.category === selectionValue);
      case 'brand':    return products.filter(p => p.brand === selectionValue);
      case 'count':    return products.slice(0, Math.min(customCount, products.length));
      default:         return products;
    }
  }, [selectionType, selectionValue, customCount, products]);

  const selectCls = "border border-border rounded-lg px-2 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring";

  const generateSuggestions = async () => {
    if (selectedProducts.length === 0) return;
    setLoading(true); setError(''); setSuggestions([]); setAccepted({}); setApplied(false);
    try {
      const BATCH_SIZE = 3;
      const allParsed = [];
      for (let i = 0; i < selectedProducts.length; i += BATCH_SIZE) {
        const res = await API.post('/keywords/ai-suggest', { products: selectedProducts.slice(i, i + BATCH_SIZE) });
        if (res.data?.data) allParsed.push(...res.data.data);
      }
      const withNew = allParsed.map((s) => {
        const prod = selectedProducts.find(p => String(p.id) === String(s.id));
        return { ...s, name: prod?.name || '', newActive: (s.active || []).filter(k => !prod?.active?.includes(k)), newNegative: [] };
      }).filter(s => s.newActive.length > 0);
      setSuggestions(withNew);

      // OPT-OUT: generate ஆனவுடனே எல்லாம் selected (true)
      const allSelected = {};
      withNew.forEach(s => {
        s.newActive.forEach(k => { allSelected[`${s.id}__active__${k}`] = true; });
      });
      setAccepted(allSelected);
    } catch {
      setError('Failed to generate suggestions. Please try again.');
    }
    setLoading(false);
  };

  // click = toggle. selected இருந்தா deselect, deselected இருந்தா re-select
  const toggleAccept  = (id, kw, type) => {
    const key = `${id}__${type}__${kw}`;
    setAccepted(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const isAccepted = (id, kw, type) => !!accepted[`${id}__${type}__${kw}`];

  const acceptedCount = Object.values(accepted).filter(Boolean).length;
  const removedCount  = Object.values(accepted).filter(v => v === false).length;

  // Low-confidence keywords deselect பண்ணு
  const deselectLowConfidence = () => {
    setAccepted(prev => {
      const next = { ...prev };
      suggestions.forEach(s => {
        if (s.confidence < 0.8) {
          s.newActive.forEach(k => { next[`${s.id}__active__${k}`] = false; });
        }
      });
      return next;
    });
  };

  // எல்லாத்தையும் re-select பண்ணு
  const selectAll = () => {
    const next = {};
    suggestions.forEach(s => {
      s.newActive.forEach(k => { next[`${s.id}__active__${k}`] = true; });
    });
    setAccepted(next);
  };

  const applyAccepted = async () => {
    const updated = products.map((p) => {
      const sugg = suggestions.find(s => String(s.id) === String(p.id));
      if (!sugg) return p;
      const acceptedKws = sugg.newActive.filter(k => isAccepted(p.id, k, 'active'));
      const newSources  = { ...(p.keyword_sources || {}) };
      acceptedKws.forEach(k => { newSources[k] = 'ai'; });
      return {
        ...p,
        active:          [...new Set([...p.active, ...acceptedKws])],
        inactive:        [...new Set([...p.inactive])],
        keyword_sources: newSources,
      };
    });
    onApply(updated);
    setApplied(true);
    try { await onSave(updated); } catch { }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">

        {suggestions.length === 0 && !loading && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
              <p className="text-xs font-medium text-foreground">Select products to optimize</p>
              <div className="flex flex-wrap gap-2 items-center">
                <select value={selectionType} onChange={(e) => { setSelectionType(e.target.value); setSelectionValue(''); }} className={selectCls}>
                  <option value="all">All products</option>
                  <option value="category">By Category</option>
                  <option value="brand">By Brand</option>
                  <option value="count">Custom count</option>
                </select>
                {selectionType === 'category' && <select value={selectionValue} onChange={(e) => setSelectionValue(e.target.value)} className={selectCls}><option value="">Select category...</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>}
                {selectionType === 'brand'    && <select value={selectionValue} onChange={(e) => setSelectionValue(e.target.value)} className={selectCls}><option value="">Select brand...</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select>}
                {selectionType === 'count'    && <input type="number" min={1} max={products.length} value={customCount} onChange={(e) => setCustomCount(parseInt(e.target.value) || 1)} className={`${selectCls} w-24`} placeholder="Count..."/>}
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${selectedProducts.length > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{selectedProducts.length} products selected</span>
            </div>

            <div className="text-center py-4">
              <Bot size={32} className="text-muted-foreground/30 mx-auto mb-3"/>
              <p className="text-sm font-medium text-foreground mb-1">AI Keyword Suggestions</p>
              <p className="text-xs text-muted-foreground mb-1">AI will analyze {selectedProducts.length} products and suggest keywords.</p>
              <p className="text-xs text-primary font-medium mb-4">All keywords will be auto-selected. Click any keyword to remove it.</p>
              {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive mb-3 text-left"><AlertTriangle size={13}/>{error}</div>}
              <button
                onClick={generateSuggestions}
                disabled={selectedProducts.length === 0 || (selectionType === 'category' && !selectionValue) || (selectionType === 'brand' && !selectionValue)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer border-none hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-default">
                <Bot size={15}/> Generate for {selectedProducts.length} products
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <Loader2 size={28} className="text-primary mx-auto mb-3 animate-spin"/>
            <p className="text-sm font-medium text-foreground">Analyzing {selectedProducts.length} products...</p>
            <p className="text-xs text-muted-foreground mt-1">AI is reading product titles, categories, and brands</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <>
            {applied && <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-xs text-success"><Check size={13}/>{acceptedCount} keywords applied and saved!</div>}

            {/* Summary + actions */}
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-info/10 text-info font-medium">{acceptedCount} selected</span>
                {removedCount > 0 && <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">{removedCount} removed</span>}
                <span className="text-muted-foreground">{suggestions.length} products</span>
              </div>
              <div className="flex gap-3">
                {removedCount > 0 && (
                  <button onClick={selectAll} className="text-xs text-info font-medium cursor-pointer bg-transparent border-none p-0 hover:underline">
                    Re-select all
                  </button>
                )}
                <button onClick={deselectLowConfidence} className="text-xs text-muted-foreground cursor-pointer bg-transparent border-none p-0 hover:text-foreground hover:underline">
                  Remove low-confidence
                </button>
              </div>
            </div>

            {/* Hint banner */}
            <div className="mb-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-primary">
              All keywords selected by default. Click a keyword to remove it, click again to re-add.
            </div>

            <div className="space-y-3">
              {suggestions.map(s => (
                <div key={s.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground truncate flex-1 mr-2">{s.name}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.confidence >= 0.8 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {Math.round(s.confidence * 100)}% conf.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.newActive.map(k => {
                      const included = isAccepted(s.id, k, 'active');
                      return (
                        <button
                          key={k}
                          onClick={() => toggleAccept(s.id, k, 'active')}
                          title={included ? 'Click to remove' : 'Click to re-add'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] cursor-pointer border transition-all ${
                            included
                              ? 'bg-info text-white border-info hover:bg-destructive hover:border-destructive'
                              : 'bg-secondary text-muted-foreground border-border line-through opacity-50 hover:opacity-80'
                          }`}>
                          {included ? <Check size={10}/> : <X size={10}/>}
                          {k}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="p-3 border-t border-border flex items-center gap-3 bg-secondary/50">
          <span className="text-[11px] text-muted-foreground flex-1">
            {acceptedCount} keywords will be added
            {removedCount > 0 && <span className="text-destructive ml-1">({removedCount} removed)</span>}
          </span>
          <button onClick={() => { setSuggestions([]); setAccepted({}); setApplied(false); }} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs cursor-pointer hover:bg-secondary"><RotateCcw size={12}/> Back</button>
          <button onClick={generateSuggestions} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs cursor-pointer hover:bg-secondary"><RotateCcw size={12}/> Regenerate</button>
          <button
            onClick={applyAccepted}
            disabled={acceptedCount === 0 || applied}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-default transition-colors">
            <Check size={13}/>{applied ? 'Applied and Saved!' : `Apply ${acceptedCount} keywords`}
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

  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'x-tenant-id':  currentStoreId,
    'Content-Type': 'application/json',
  }), [token, currentStoreId]);

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
        const mapped = prodJson.data.map(p => ({
          ...p,
          ruleKeywords:    p.ruleKeywords    || {},
          keyword_sources: p.keyword_sources || {},
        }));
        setProducts(mapped);
        if (mapped.length > 0) setSelectedId(mapped[0].id);
      }
      if (rulesJson.success) {
        setRules((rulesJson.data || []).map(r => ({ enabled: true, ...r })));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(overrideProducts) {
    setSaving(true); setSaveSuccess(false); setSaveError('');
    try {
      const productsToSave = overrideProducts || products;
      const updates = productsToSave.map(p => ({
        id:              p.id,
        active:          p.active,
        inactive:        p.inactive,
        ruleKeywords:    p.ruleKeywords    || {},
        keyword_sources: p.keyword_sources || {},
      }));
      const [kwRes, rulesRes] = await Promise.all([
        fetch(`${API_BASE}/api/keywords/save`,  { method: 'PUT', headers, body: JSON.stringify({ updates }) }),
        fetch(`${API_BASE}/api/keywords/rules`, { method: 'PUT', headers, body: JSON.stringify({ rules }) }),
      ]);
      const kwJson    = await kwRes.json();
      const rulesJson = await rulesRes.json();
      if (!kwJson.success)    throw new Error(kwJson.message    || 'Keywords save failed');
      if (!rulesJson.success) throw new Error(rulesJson.message || 'Rules save failed');
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

  function updateProducts(fn) {
    setProducts(prev => { const next = typeof fn === 'function' ? fn(prev) : fn; setDirty(true); return next; });
  }

  const selected = products.find(p => p.id === selectedId);

  const SUGGESTED_POOL = useMemo(() => {
    const brands     = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return [...new Set([...brands, ...categories, 'Wireless', 'Premium', 'Bestseller', 'New Arrival', 'Sale', 'Lightweight', 'Waterproof', 'Original'])];
  }, [products]);

  const totalActive = products.reduce((a, p) => a + p.active.length, 0);
  const fullyTagged = products.filter(p => p.active.length > 0).length;
  const missing     = products.filter(p => p.active.length === 0).length;

  const filtered  = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const maxPage   = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const curPage   = Math.min(page, maxPage);
  const pageSlice = filtered.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);

  function updateProduct(id, fn) {
    updateProducts(prev => prev.map(p => p.id === id ? fn(p) : p));
  }

  const addKw = (type) => {
    const val = (type === 'active' ? activeInput : negInput).trim();
    if (!val || !selected) return;
    updateProduct(selectedId, (p) => {
      const field = type === 'active' ? 'active' : 'inactive';
      if (p[field].includes(val)) return p;
      const newSources = { ...(p.keyword_sources || {}), [val]: 'manual' };
      return { ...p, [field]: [...p[field], val], keyword_sources: newSources };
    });
    type === 'active' ? setActiveInput('') : setNegInput('');
  };

  const addSuggested = (kw) => {
    if (!selected || selected.active.includes(kw)) return;
    updateProduct(selectedId, (p) => {
      const newSources = { ...(p.keyword_sources || {}), [kw]: 'manual' };
      return { ...p, active: [...p.active, kw], keyword_sources: newSources };
    });
  };

  const moveKw = (kw, dir) => {
    updateProduct(selectedId, (p) =>
      dir === 'activeToNeg'
        ? { ...p, active: p.active.filter(k => k !== kw), inactive: p.inactive.includes(kw) ? p.inactive : [...p.inactive, kw] }
        : { ...p, inactive: p.inactive.filter(k => k !== kw), active: p.active.includes(kw) ? p.active : [...p.active, kw] }
    );
  };

  const confirmDelete = () => {
    if (!confirmState) return;
    const { kw, type } = confirmState;
    updateProduct(selectedId, (p) => {
      const newSources = { ...(p.keyword_sources || {}) };
      delete newSources[kw];
      return {
        ...p,
        active:          type === 'active'   ? p.active.filter(k => k !== kw)   : p.active,
        inactive:        type === 'inactive' ? p.inactive.filter(k => k !== kw) : p.inactive,
        keyword_sources: newSources,
      };
    });
    setConfirmState(null);
  };

  const suggestedForSelected = selected ? SUGGESTED_POOL.filter(s => !selected.active.includes(s)).slice(0, 4) : [];

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      <span className="ml-3 text-muted-foreground">Loading keywords...</span>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      {confirmState && <DeleteModal kw={confirmState.kw} type={confirmState.type} onConfirm={confirmDelete} onCancel={() => setConfirmState(null)}/>}
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Keyword Optimization</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage active and negative keywords per product</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {saveSuccess && <span className="flex items-center gap-1 text-xs text-success font-medium"><Check size={13}/> Saved!</span>}
            {saveError   && <span className="flex items-center gap-1 text-xs text-destructive font-medium"><AlertTriangle size={13}/> {saveError}</span>}
            {dirty && !saveSuccess && !saveError && <span className="text-xs text-warning font-medium">Unsaved changes</span>}
            <button onClick={() => handleSave()} disabled={saving || !dirty} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-40 disabled:cursor-default transition-all">
              {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <div className="w-px h-6 bg-border"/>
            <button onClick={() => setMode('manual')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${mode === 'manual' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}><PencilLine size={13}/> Manual</button>
            <button onClick={() => setMode('bulk')}   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${mode === 'bulk'   ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}><Zap size={13}/> Bulk mode</button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2.5">
          {statCards.map(({ label, val, sub, iconCls, valCls, Icon }) => (
            <div key={label} className="rounded-xl border border-border p-4 flex items-start gap-4 bg-card">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}><Icon size={18}/></div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
                <div className={`text-2xl font-bold mt-0.5 ${valCls}`}>{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Panels */}
        <div className="grid gap-3" style={{ gridTemplateColumns: mode === 'bulk' ? '1fr' : '280px minmax(0,1fr) minmax(0,1fr)' }}>
          {mode === 'manual' && (
            <>
              {/* Catalog */}
              <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground"><FileText size={15}/> Product catalog</div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{filtered.length} items</span>
                  </div>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Filter by name or SKU..." className="w-full border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs bg-secondary text-foreground outline-none focus:border-ring"/>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {pageSlice.length === 0 && <div className="px-4 py-5 text-xs text-muted-foreground">No products found</div>}
                  {pageSlice.map((p) => (
                    <div key={p.id} onClick={() => setSelectedId(p.id)} className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border cursor-pointer transition-colors ${p.id === selectedId ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'bg-card border-l-[3px] border-l-transparent hover:bg-secondary'}`}>
                      <ProductThumb name={p.name}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">SKU: {p.sku}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === 'active' ? 'bg-success' : 'bg-muted-foreground/40'}`}/>
                          <span className="text-[10px] text-muted-foreground">{p.status === 'active' ? 'Active' : 'Inactive'}</span>
                          {p.active.length > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-info/10 text-info">{p.active.length} tags</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">{filtered.length === 0 ? '0' : Math.min((curPage - 1) * PER_PAGE + 1, filtered.length)}-{Math.min(curPage * PER_PAGE, filtered.length)} of {filtered.length}</span>
                  <div className="flex gap-1">
                    {[
                      { label: '<', onClick: () => setPage(p => Math.max(1, p - 1)), disabled: curPage === 1 },
                      ...Array.from({ length: maxPage }, (_, i) => ({ label: String(i + 1), onClick: () => setPage(i + 1), active: curPage === i + 1 })),
                      { label: '>', onClick: () => setPage(p => Math.min(maxPage, p + 1)), disabled: curPage === maxPage },
                    ].map((b, i) => (
                      <button key={i} onClick={b.onClick} disabled={b.disabled} className={`w-6 h-6 rounded-md border text-xs flex items-center justify-center transition-colors ${b.disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'} ${b.active ? 'bg-info/10 border-info/30 text-info font-medium' : 'bg-secondary border-border text-muted-foreground hover:bg-info/10 hover:text-info'}`}>{b.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active keywords */}
              <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground"><PencilLine size={15}/> Active keywords<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-info/10 text-info">Suggested</span></div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-info/10 text-info">{selected?.active.length ?? 0}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{selected?.name}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selected && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.active.length > 0 && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-full">Active</span>}
                      {selected.active.map((kw) => (
                        <KwTag key={kw} kw={kw}
                          variant={SUGGESTED_POOL.includes(kw) ? 'suggested' : 'active'}
                          source={selected.keyword_sources?.[kw] || 'manual'}
                          onDelete={(k) => setConfirmState({ kw: k, type: 'active' })}
                          onMove={(k) => moveKw(k, 'activeToNeg')}
                          moveTitle="Move to negative"/>
                      ))}
                      {suggestedForSelected.length > 0 && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-full mt-2">Suggested</span>}
                      {suggestedForSelected.map((kw) => (
                        <span key={kw} onClick={() => addSuggested(kw)} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs border border-dashed border-border text-muted-foreground cursor-pointer hover:bg-secondary transition-colors">+ {kw}</span>
                      ))}
                      {!selected.active.length && !suggestedForSelected.length && <div className="text-xs text-muted-foreground">No active keywords yet</div>}
                    </div>
                  )}
                </div>
                <div className="p-3.5 border-t border-border flex gap-2 items-center">
                  <input value={activeInput} onChange={(e) => setActiveInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addKw('active')} placeholder="Add active keyword..." className="flex-1 border border-border rounded-lg px-3 py-2 text-xs bg-secondary text-foreground outline-none focus:border-ring"/>
                  <button onClick={() => addKw('active')} className="w-[34px] h-[34px] rounded-lg bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center flex-shrink-0 border-none cursor-pointer transition-colors"><Plus size={16}/></button>
                </div>
              </div>

              {/* Negative keywords */}
              <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground"><MinusCircle size={15} className="text-destructive"/> Negative keywords<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Exclusions</span></div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{selected?.inactive.length ?? 0}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{selected?.name}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selected && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.inactive.length > 0 && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-full">Negative</span>}
                      {selected.inactive.map((kw) => (
                        <KwTag key={kw} kw={kw} variant="negative"
                          source={selected.keyword_sources?.[kw] || 'manual'}
                          onDelete={(k) => setConfirmState({ kw: k, type: 'inactive' })}
                          onMove={(k) => moveKw(k, 'negToActive')}
                          moveTitle="Move to active"/>
                      ))}
                      {!selected.inactive.length && <div className="text-xs text-muted-foreground">No negative keywords yet</div>}
                    </div>
                  )}
                </div>
                <div className="p-3.5 border-t border-border flex gap-2 items-center">
                  <input value={negInput} onChange={(e) => setNegInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addKw('inactive')} placeholder="Add negative keyword..." className="flex-1 border border-border rounded-lg px-3 py-2 text-xs bg-secondary text-foreground outline-none focus:border-ring"/>
                  <button onClick={() => addKw('inactive')} className="w-[34px] h-[34px] rounded-lg bg-destructive hover:opacity-90 text-destructive-foreground flex items-center justify-center flex-shrink-0 border-none cursor-pointer transition-colors"><Plus size={16}/></button>
                </div>
              </div>
            </>
          )}

          {/* Bulk mode */}
          {mode === 'bulk' && (
            <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
              <div className="flex items-center border-b border-border">
                {bulkTabs.map(({ id, label, Icon: TabIcon }) => (
                  <button key={id} onClick={() => setBulkTab(id)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium cursor-pointer border-none bg-transparent transition-colors ${bulkTab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} style={{ borderBottom: bulkTab === id ? '2px solid hsl(var(--primary))' : '2px solid transparent' }}>
                    <TabIcon size={13}/>{label}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {bulkTab === 'rules' && <RuleEngineTab rules={rules} setRules={(fn) => { setRules(fn); setDirty(true); }} products={products} onRunRules={(updated) => updateProducts(updated)} onSave={handleSave}/>}
                {bulkTab === 'csv'   && <CSVImportTab  products={products} onApply={(updated) => updateProducts(updated)} onSave={handleSave}/>}
                {bulkTab === 'ai'    && <AIBatchTab    products={products} onApply={(updated) => updateProducts(updated)} onSave={handleSave}/>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
