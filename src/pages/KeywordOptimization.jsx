import { useState } from "react";
import {
  FileText, Search, PencilLine, MinusCircle, Plus, X,
  ArrowLeftRight, Trash2, CheckCircle, AlertCircle, Tag, Package,
} from "lucide-react";

const SUGGESTED = ['Wireless', 'Premium', 'Fast Delivery', 'Bestseller', 'New Arrival', 'Sale'];
const THUMB_COLORS = [
  ['bg-blue-100 text-blue-700'],
  ['bg-green-100 text-green-700'],
  ['bg-amber-100 text-amber-700'],
  ['bg-pink-100 text-pink-700'],
  ['bg-teal-100 text-teal-700'],
  ['bg-purple-100 text-purple-700'],
  ['bg-orange-100 text-orange-700'],
  ['bg-emerald-100 text-emerald-700'],
];
const PER_PAGE = 5;

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Wireless Noise-Cancelling Headphones', sku: 'WH-1000XM4', status: 'active', active: ['Bluetooth', 'Noise-Cancelling', 'Sony', 'Premium Audio', 'Wireless', 'Microphone', 'Battery Life'], inactive: ['Cheap', 'Used', 'Free Shipping', 'Refurbished', 'Bulk'] },
  { id: 2, name: 'Elite Series Smartwatch Pro', sku: 'SW-ELT-44-W', status: 'active', active: ['Smartwatch', 'Fitness Tracker', 'GPS'], inactive: ['Replica', 'Wholesale'] },
  { id: 3, name: 'ProRun Hyperlight Trail Shoe', sku: 'PR-HL-99-R', status: 'inactive', active: [], inactive: ['Cheap', 'Knockoff'] },
  { id: 4, name: 'Nike Air Max 270', sku: 'NKE-001', status: 'active', active: ['Running Shoes', 'Nike Air Max', 'Black Sneakers', 'Men Footwear', 'Comfortable Shoes'], inactive: ['Used Shoes', 'Damaged', 'Cheap Replica'] },
  { id: 5, name: 'Sony WH-1000XM5', sku: 'SNY-002', status: 'active', active: ['Noise Cancelling', 'Wireless Audio', 'Sony Headphones', 'Premium Sound', 'Bluetooth Headset'], inactive: ['Wired Headphones', 'Budget Earphones'] },
  { id: 6, name: 'Bosch Cordless Drill', sku: 'BSH-003', status: 'active', active: ['Cordless Drill', 'Bosch Tools', '18V Drill', 'Power Tools'], inactive: ['Hand Drill', 'Corded Drill', 'Toy Tools'] },
  { id: 7, name: "Levi's 501 Jeans", sku: 'LVS-004', status: 'active', active: ["Levi's Jeans", 'Denim Pants', 'Classic Fit', 'Straight Leg', '501 Original'], inactive: ['Skinny Jeans', 'Ripped Jeans'] },
  { id: 8, name: 'Philips Air Fryer XXL', sku: 'PHP-005', status: 'inactive', active: [], inactive: ['Deep Fryer', 'Microwave'] },
];

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function ProductThumb({ name }) {
  const cls = THUMB_COLORS[name.charCodeAt(0) % THUMB_COLORS.length][0];
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-medium flex-shrink-0 border border-black/[0.08] ${cls}`}>
      {getInitials(name)}
    </div>
  );
}

// ── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ kw, type, onConfirm, onCancel }) {
  const isActive = type === 'active';
  return (
    <div className="fixed inset-0 bg-black/35 z-[999] flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white border border-black/10 rounded-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${isActive ? 'bg-blue-50' : 'bg-red-50'}`}>
          <Trash2 size={16} className={isActive ? 'text-blue-700' : 'text-red-700'} />
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">Remove keyword?</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-5">
          Remove{' '}
          <span className={`font-medium px-2.5 py-0.5 rounded-full ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
            {kw}
          </span>
          {' '}from {type} keywords? This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none bg-red-800 text-white hover:bg-red-900">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Keyword Tag ──────────────────────────────────────────────────────────────
function KwTag({ kw, variant, onDelete, onMove, moveTitle }) {
  const variantCls = {
    active:    'bg-blue-50 text-blue-700',
    suggested: 'bg-green-50 text-green-800',
    negative:  'bg-red-50 text-red-800',
  };
  return (
    <span className={`inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full text-xs leading-none ${variantCls[variant] || variantCls.active}`}>
      {kw}
      <span className="inline-flex items-center gap-0.5 ml-1">
        <span className="w-px h-3 bg-current opacity-20 mx-0.5" />
        <button
          onClick={() => onMove(kw)}
          title={moveTitle}
          className="w-[18px] h-[18px] flex items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 cursor-pointer border-none bg-transparent text-inherit p-0"
        >
          <ArrowLeftRight size={11} />
        </button>
        <button
          onClick={() => onDelete(kw)}
          title="Remove"
          className="w-[18px] h-[18px] flex items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 cursor-pointer border-none bg-transparent text-inherit p-0"
        >
          <X size={11} />
        </button>
      </span>
    </span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function KeywordOptimization() {
  const [products, setProducts]         = useState(INITIAL_PRODUCTS);
  const [selectedId, setSelectedId]     = useState(1);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [activeInput, setActiveInput]   = useState('');
  const [confirmState, setConfirmState] = useState(null);

  const selected    = products.find((p) => p.id === selectedId);
  const totalActive = products.reduce((a, p) => a + p.active.length, 0);
  const fullyTagged = products.filter((p) => p.active.length > 0).length;
  const missing     = products.filter((p) => p.active.length === 0).length;

  const filtered  = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );
  const maxPage   = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const curPage   = Math.min(page, maxPage);
  const pageSlice = filtered.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);

  const updateProduct = (id, fn) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));

  const addKw = (type) => {
    const val = activeInput.trim();
    if (!val || !selected) return;

    updateProduct(selectedId, (p) => {
      if (!p.active.includes(val)) {
        return { ...p, active: [...p.active, val] };
      }
      return p;
    });

    setActiveInput('');
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
    ? SUGGESTED.filter((s) => !selected.active.includes(s)).slice(0, 3)
    : [];

  const statCards = [
    { label: 'Total products',   val: products.length, sub: 'All products',    iconCls: 'bg-blue-50 text-blue-700',   valCls: 'text-blue-700',   Icon: Package, bg: "bg-primary/10",      },
    { label: 'Active keywords',  val: totalActive,     sub: 'Tags added',      iconCls: 'bg-gray-100 text-gray-600',  valCls: 'text-gray-800',   Icon: Tag, bg: "bg-info/10" },
    { label: 'Fully tagged',     val: fullyTagged,     sub: 'Complete',        iconCls: 'bg-green-50 text-green-700', valCls: 'text-green-700',  Icon: CheckCircle, bg: "bg-success/10"  },
    { label: 'Missing keywords', val: missing,         sub: 'Needs attention', iconCls: 'bg-red-50 text-red-700',     valCls: 'text-red-800',    Icon: AlertCircle, bg: "bg-destructive/10"   },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">

      {confirmState && (
        <DeleteModal
          kw={confirmState.kw}
          type={confirmState.type}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmState(null)}
        />
      )}
    
      <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl sm:text-2xl font-bold text-foreground">Keyword Optimization</h1><p className="text-muted-foreground text-sm mt-1">Manage active &amp; negative keywords per product</p>
        </div>
      </div>

       {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {statCards.map(({ label, val, sub, iconCls, valCls, Icon, bg }) => (
            <div key={label} className={`rounded-xl border border-border p-4 flex items-start gap-4 ${bg}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
                <div className={`text-2xl font-bold mt-0.5 ${valCls}`}>{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

      {/* 3-panel grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '280px minmax(0,1fr) minmax(0,1fr)' }}>

        {/* Panel 1 — Catalog */}
        <div className="bg-white border border-black/10 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-black/[0.07]">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
                <FileText size={15} /> Product catalog
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {filtered.length} items
              </span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Filter by name or SKU…"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs bg-gray-50 text-gray-900 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {pageSlice.length === 0 && (
              <div className="px-4 py-5 text-xs text-gray-400">No products found</div>
            )}
            {pageSlice.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b border-black/[0.06] cursor-pointer transition-colors
                  ${p.id === selectedId
                    ? 'bg-blue-50 border-l-[3px] border-l-blue-600'
                    : 'bg-white border-l-[3px] border-l-transparent hover:bg-gray-50'}`}
              >
                <ProductThumb name={p.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">SKU: {p.sku}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-[10px] text-gray-400">{p.status === 'active' ? 'Active' : 'Inactive'}</span>
                    {p.active.length > 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {p.active.length} tags
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3.5 py-2 border-t border-black/[0.07]">
            <span className="text-[11px] text-gray-400">
              {Math.min((curPage - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(curPage * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              {[
                { label: '‹', onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: curPage === 1 },
                ...Array.from({ length: maxPage }, (_, i) => ({ label: String(i + 1), onClick: () => setPage(i + 1), active: curPage === i + 1 })),
                { label: '›', onClick: () => setPage((p) => Math.min(maxPage, p + 1)), disabled: curPage === maxPage },
              ].map((b, i) => (
                <button
                  key={i} onClick={b.onClick} disabled={b.disabled}
                  className={`w-6 h-6 rounded-md border text-xs flex items-center justify-center transition-colors
                    ${b.disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
                    ${b.active ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-700'}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2 — Active keywords */}
        <div className="bg-white border border-black/10 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-black/[0.07]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
                <PencilLine size={15} /> Active keywords
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Suggested</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {selected?.active.length ?? 0}
              </span>
            </div>
            <div className="text-[11px] text-gray-400">{selected?.name}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selected && (
              <div className="flex flex-wrap gap-1.5">
                {selected.active.length > 0 && (
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider w-full">Active</span>
                )}
                {selected.active.map((kw) => (
                  <KwTag
                    key={kw} kw={kw}
                    variant={SUGGESTED.includes(kw) ? 'suggested' : 'active'}
                    onDelete={(k) => setConfirmState({ kw: k, type: 'active' })}
                    onMove={(k) => moveKw(k, 'activeToNeg')}
                    moveTitle="Move to negative"
                  />
                ))}
                {suggestedForSelected.length > 0 && (
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider w-full mt-2">Suggested</span>
                )}
                {suggestedForSelected.map((kw) => (
                  <span
                    key={kw} onClick={() => addSuggested(kw)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    + {kw}
                  </span>
                ))}
                {!selected.active.length && !suggestedForSelected.length && (
                  <div className="text-xs text-gray-400">No active keywords yet</div>
                )}
              </div>
            )}
          </div>

          <div className="p-3.5 border-t border-black/[0.07] flex gap-2 items-center">
            <input
              value={activeInput}
              onChange={(e) => setActiveInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKw('active')}
              placeholder="Add active keyword…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-900 outline-none focus:border-blue-400"
            />
            <button
              onClick={() => addKw('active')}
              className="w-[34px] h-[34px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center flex-shrink-0 border-none cursor-pointer transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Panel 3 — Negative keywords */}
        <div className="bg-white border border-black/10 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-black/[0.07]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
                <MinusCircle size={15} className="text-red-800" /> Negative keywords
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-800">Exclusions</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-800">
                {selected?.inactive.length ?? 0}
              </span>
            </div>
            <div className="text-[11px] text-gray-400">{selected?.name}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selected && (
              <div className="flex flex-wrap gap-1.5">
                {selected.inactive.length > 0 && (
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider w-full">Negative</span>
                )}
                {selected.inactive.map((kw) => (
                  <KwTag
                    key={kw} kw={kw} variant="negative"
                    onDelete={(k) => setConfirmState({ kw: k, type: 'inactive' })}
                    onMove={(k) => moveKw(k, 'negToActive')}
                    moveTitle="Move to active"
                  />
                ))}
                {!selected.inactive.length && (
                  <div className="text-xs text-gray-400">No negative keywords yet</div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
      </div>
    </div>
  );
}
