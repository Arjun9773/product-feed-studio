import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronDown, Plus, Trash2,
  Pencil, Check, X, Tag, ImageOff,
  Search, ArrowLeft, CheckSquare, Square,
  RefreshCw, Package, Tags, CheckCircle2, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import ProductAssignView from "./ProductAssignView";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LABEL_NAMES = [
  "Custom Label 0",
  "Custom Label 1",
  "Custom Label 2",
  "Custom Label 3",
  "Custom Label 4",
];

function initTree(id_name = null) {
  return {
    id_name,
    groups: LABEL_NAMES.map((label, i) => ({
      labelIndex: i,
      label,
      expanded: true,
      values: [],
    })),
  };
}

function convertLabelsToTrees(labels) {
  const groupMap = {};

  labels.forEach((label) => {
    if (!groupMap[label.id_name]) {
      groupMap[label.id_name] = initTree(label.id_name);
    }
    const tree = groupMap[label.id_name];
    const grp  = tree.groups[label.position];
    grp.values.push({
      id:         label._id,
      name:       label.label_value,
      productIds: new Array(label.prodcount || 0).fill(null),
    });
  });

  return Object.values(groupMap);
}

// ─── Product Assignment View ─────────────────────────────────────

// function ProductAssignView({
//   labelName, valueName, assignedIds,
//   onSave, onBack, products, loading
// }) {
//   const [selected, setSelected] = useState(new Set(assignedIds));
//   const [search, setSearch]     = useState("");

//   const filtered = products.filter((p) =>
//     p.product_name?.toLowerCase().includes(search.toLowerCase()) ||
//     p.brand?.toLowerCase().includes(search.toLowerCase())
//   );

//   function toggle(id) {
//     setSelected((prev) => {
//       const next = new Set(prev);
//       next.has(id) ? next.delete(id) : next.add(id);
//       return next;
//     });
//   }

//   function toggleAll() {
//     setSelected(
//       selected.size === filtered.length
//         ? new Set()
//         : new Set(filtered.map((p) => p._id))
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: 20 }}
//       animate={{ opacity: 1, x: 0 }}
//       className="space-y-5"
//     >
//       <div className="flex items-center gap-3">
//         <Button variant="outline" size="sm" className="gap-2" onClick={onBack}>
//           <ArrowLeft className="h-4 w-4" /> Back
//         </Button>
//         <div>
//           <h1 className="text-xl font-bold text-foreground">Assign Products</h1>
//           <p className="text-xs text-muted-foreground mt-0.5">
//             <span className="font-medium text-foreground">{labelName}</span>
//             {" → "}
//             <Badge className="bg-primary/10 text-primary border-0 text-xs">
//               {valueName}
//             </Badge>
//           </p>
//         </div>
//       </div>

//       <div className="bg-card rounded-xl p-4 border border-border card-shadow flex items-center gap-3">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search products..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="pl-9 bg-secondary border-0"
//           />
//         </div>
//         <Button
//           variant="outline" size="sm"
//           className="gap-2 shrink-0"
//           onClick={toggleAll}
//         >
//           {selected.size === filtered.length
//             ? <><CheckSquare className="h-4 w-4" /> Deselect All</>
//             : <><Square className="h-4 w-4" /> Select All</>}
//         </Button>
//         <Badge className="bg-primary/10 text-primary border-0 shrink-0">
//           {selected.size} selected
//         </Badge>
//       </div>

//       <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
//         {loading ? (
//           <div className="py-12 text-center text-sm text-muted-foreground">
//             Loading products...
//           </div>
//         ) : (
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-border bg-secondary/50">
//                 <th className="px-4 py-3 w-10" />
//                 <th className="px-4 py-3 w-12 text-left text-xs font-medium text-muted-foreground">Image</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((product) => {
//                 const isChecked = selected.has(product._id);
//                 return (
//                   <tr
//                     key={product._id}
//                     onClick={() => toggle(product._id)}
//                     className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
//                       isChecked ? "bg-primary/5" : "hover:bg-secondary/30"
//                     }`}
//                   >
//                     <td className="px-4 py-3">
//                       <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
//                         isChecked
//                           ? "bg-primary border-primary"
//                           : "border-muted-foreground/40"
//                       }`}>
//                         {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
//                         {product.additional_image1 ? (
//                           <img
//                             src={product.additional_image1}
//                             alt=""
//                             className="h-full w-full object-cover"
//                           />
//                         ) : (
//                           <ImageOff className="h-4 w-4 text-muted-foreground" />
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <p className="font-medium text-foreground truncate max-w-[220px]">
//                         {product.product_name}
//                       </p>
//                       <p className="text-xs text-muted-foreground">
//                         {product.brand || "—"}
//                       </p>
//                     </td>
//                     <td className="px-4 py-3 text-xs text-muted-foreground">
//                       {product.category?.split(" > ").slice(-1)[0] || "—"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
//                       ₹{product.price?.toLocaleString() || "—"}
//                     </td>
//                   </tr>
//                 );
//               })}
//               {filtered.length === 0 && (
//                 <tr>
//                   <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
//                     No products found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>

//       <div className="flex gap-3">
//         <Button
//           className="bg-primary text-primary-foreground gap-2"
//           onClick={() => onSave([...selected])}
//         >
//           <Check className="h-4 w-4" />
//           Save — {selected.size} product{selected.size !== 1 ? "s" : ""} assigned
//         </Button>
//         <Button variant="outline" onClick={onBack}>Cancel</Button>
//       </div>
//     </motion.div>
//   );
// }

// ─── Main Page ───────────────────────────────────────────────────

export default function CustomLabels() {
  const { currentStoreId, user } = useAuth();
  const token = user?.token || localStorage.getItem("token");

  const [trees, setTrees]                     = useState([initTree()]);
  const [currentTreeIdx, setCurrentTreeIdx]   = useState(0);
  const [nextLabelIdx, setNextLabelIdx]       = useState(0);
  const [inputText, setInputText]             = useState("");
  const [renamingKey, setRenamingKey]         = useState(null);
  const [renameText, setRenameText]           = useState("");
  const [assigningValue, setAssigningValue]   = useState(null);
  const [products, setProducts]               = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [labelsLoading, setLabelsLoading]     = useState(true);

  // ── API helper — component inside ──
  async function apiFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
      "x-tenant-id":   currentStoreId,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  if (!text || !text.trim()) return null;

  const result = JSON.parse(text);

  if (!res.ok) {
    throw new Error(result?.message || `API error ${res.status}`);
  }

  return result;
}

  // ── Page load ──
  useEffect(() => {
    if (!currentStoreId) return;
    fetchLabels();
    fetchProducts();
  }, [currentStoreId]);

  // ── Fetch labels from DB ──
  async function fetchLabels() {
    try {
      setLabelsLoading(true);
      const data = await apiFetch(
        `/api/custom-labels?companyId=${currentStoreId}`
      );

      if (Array.isArray(data) && data.length > 0) {
        const converted = convertLabelsToTrees(data);
        setTrees(converted);

        const lastTree    = converted[converted.length - 1];
        const filledCount = lastTree.groups.filter(
          (g) => g.values.length > 0
        ).length;

        if (filledCount === 5) {
          setTrees((prev) => [...prev, initTree()]);
          setCurrentTreeIdx(converted.length);
          setNextLabelIdx(0);
        } else {
          setCurrentTreeIdx(converted.length - 1);
          setNextLabelIdx(filledCount);
        }
      }
    } catch (err) {
      console.error("fetchLabels error", err);
    } finally {
      setLabelsLoading(false);
    }
  }

  // ── Fetch products from DB ──
  async function fetchProducts() {
    try {
      setProductsLoading(true);
      const data = await apiFetch(
        `/api/products?companyId=${currentStoreId}&limit=500`
      );
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      console.error("fetchProducts error", err);
    } finally {
      setProductsLoading(false);
    }
  }

  // ── KPI ──
  const allValues      = trees.flatMap((t) => t.groups.flatMap((g) => g.values));
  const totalValues    = allValues.length;
  const taggedIds      = new Set(allValues.flatMap((v) => v.productIds));
  const taggedProducts = taggedIds.size;
  const totalProducts  = products.length;
  const untagged       = totalProducts - taggedProducts;

  // ── Toggle expand ──
  function toggleExpand(treeIdx, labelIndex) {
    setTrees((prev) =>
      prev.map((tree, ti) =>
        ti !== treeIdx ? tree : {
          ...tree,
          groups: tree.groups.map((g) =>
            g.labelIndex === labelIndex
              ? { ...g, expanded: !g.expanded }
              : g
          ),
        }
      )
    );
  }

  // ── Add value → API call ──
  async function addValue() {
    const name = inputText.trim();
    if (!name) return;

    try {
      const currentIdName = nextLabelIdx === 0
        ? null
        : trees[currentTreeIdx]?.id_name || null;

      const result = await apiFetch("/api/custom-labels", {
        method: "POST",
        body: JSON.stringify({
          label_value: name,
          position:    nextLabelIdx,
          ...(currentIdName ? { id_name: currentIdName } : {}),
        }),
      });

      // Local state update
      setTrees((prev) =>
        prev.map((tree, ti) => {
          if (ti !== currentTreeIdx) return tree;
          return {
            ...tree,
            id_name: nextLabelIdx === 0
              ? result.id_name
              : tree.id_name,
            groups: tree.groups.map((g) =>
              g.labelIndex === nextLabelIdx
                ? {
                    ...g,
                    expanded: true,
                    values: [
                      ...g.values,
                      {
                        id:         result.id,
                        name,
                        productIds: [],
                      },
                    ],
                  }
                : g
            ),
          };
        })
      );

      if (nextLabelIdx === 4) {
        setTrees((prev) => [...prev, initTree()]);
        setCurrentTreeIdx((prev) => prev + 1);
        setNextLabelIdx(0);
      } else {
        setNextLabelIdx((prev) => prev + 1);
      }

      setInputText("");
    } catch (err) {
      console.error("addValue error", err.message);
  alert(err.message);
    }
  }

  // ── Remove → API call ──
  async function removeValue(treeIdx, labelIndex, valueId) {
    try {
      const res = await apiFetch(`/api/custom-labels/${valueId}`, {
        method: "DELETE",
      });

      if (res.deleteGroup) {
        // ✅ position 0 → whole group remove
        setTrees((prev) => {
          const updated = prev.filter((_, ti) => ti !== treeIdx);
          return updated.length === 0 ? [initTree()] : [...updated, initTree()];
        });
        setCurrentTreeIdx((prev) => Math.max(0, prev - 1));
        setNextLabelIdx(0);

      } else {
        // ✅ position 1-4 → clear from deleted position onwards
        setTrees((prev) =>
          prev.map((tree, ti) =>
            ti !== treeIdx ? tree : {
              ...tree,
              groups: tree.groups.map((g) =>
                g.labelIndex >= res.deletedFromPosition
                  ? { ...g, values: [] }
                  : g
              ),
            }
          )
        );

        // ✅ Input bar reset — deleted position-லிருந்து மீண்டும் type பண்ணலாம்
        setCurrentTreeIdx(treeIdx);
        setNextLabelIdx(res.deletedFromPosition);
      }

    } catch (err) {
      console.error("removeValue error", err);
    }
  }

  // ── Rename ──
  function startRename(treeIdx, labelIndex, valueId, name) {
    setRenamingKey(`${treeIdx}-${labelIndex}-${valueId}`);
    setRenameText(name);
  }

  async function saveRename(treeIdx, labelIndex, valueId) {
    const text = renameText.trim();
    if (!text) { setRenamingKey(null); return; }

    try {
      await apiFetch(`/api/custom-labels/${valueId}`, {
        method: "PUT",
        body: JSON.stringify({ label_value: text }),
      });

      setTrees((prev) =>
        prev.map((tree, ti) =>
          ti !== treeIdx ? tree : {
            ...tree,
            groups: tree.groups.map((g) =>
              g.labelIndex === labelIndex
                ? {
                    ...g,
                    values: g.values.map((v) =>
                      v.id === valueId ? { ...v, name: text } : v
                    ),
                  }
                : g
            ),
          }
        )
      );
    } catch (err) {
      console.error("saveRename error", err);
    } finally {
      setRenamingKey(null);
    }
  }

  // ── Product assign save ──
  async function saveAssign(ids) {
    const { treeIdx, labelIndex, valueId } = assigningValue;

    // ✅ அந்த label-ஓட value name எடு
    const tree  = trees[treeIdx];
    const grp   = tree.groups[labelIndex];
    const val   = grp.values.find(v => v.id === valueId);
    const field = `custom_label_${labelIndex}`; // "custom_label_0"

    // ✅ Products-ல் custom_label_X update பண்ணு
    await apiFetch("/api/products/bulk-update", {
      method: "PUT",
      body: JSON.stringify({
        field,
        updates: ids.map(id => ({
          id: products.find(p => p._id === id)?.sourceId, // sourceId use பண்ணு
          value: val.name,
        })),
      }),
    });

    // ✅ prodcount update
    await apiFetch(`/api/custom-labels/${valueId}/prodcount`, {
      method: "PUT",
      body: JSON.stringify({ count: ids.length }),
    });

    // ✅ Local state update
    setTrees(prev =>
      prev.map((tree, ti) =>
        ti !== treeIdx ? tree : {
          ...tree,
          groups: tree.groups.map(g =>
            g.labelIndex === labelIndex
              ? {
                  ...g,
                  values: g.values.map(v =>
                    v.id === valueId ? { ...v, productIds: ids } : v
                  ),
                }
              : g
          ),
        }
      )
    );

    setAssigningValue(null);
  }

  // ── Product assign view ──
  if (assigningValue) {
    const tree = trees[assigningValue.treeIdx];
    const grp  = tree?.groups[assigningValue.labelIndex];
    const val  = grp?.values.find((v) => v.id === assigningValue.valueId);

    return (
      <div className="p-1">
        <ProductAssignView
          labelName={grp?.label || ""}
          valueName={val?.name || ""}
          assignedIds={val?.productIds || []}
          onSave={saveAssign}
          onBack={() => setAssigningValue(null)}
          products={products}
          loading={productsLoading}
        />
      </div>
    );
  }

  // ── Render all trees ──
  function renderAllTrees() {
    const rows = [];

    trees.forEach((tree, treeIdx) => {
      const hasValues = tree.groups.some((g) => g.values.length > 0);
      if (!hasValues) return;

      if (treeIdx > 0 && rows.length > 0) {
        rows.push(
          <tr key={`sep-${treeIdx}`}>
            <td colSpan={4} className="px-0 py-0">
              <div className="h-px bg-border mx-4 my-1 opacity-50" />
            </td>
          </tr>
        );
      }

      rows.push(
        <tr key={`tree-header-${treeIdx}`} className="bg-secondary/10">
          <td colSpan={4} className="px-4 py-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Group {treeIdx + 1}
            </span>
          </td>
        </tr>
      );

      rows.push(
        <TreeRows
          key={`tree-${treeIdx}`}
          treeIdx={treeIdx}
          tree={tree.groups}
          renamingKey={renamingKey}
          renameText={renameText}
          onToggleExpand={toggleExpand}
          onRemove={removeValue}
          onStartRename={startRename}
          onSaveRename={saveRename}
          onCancelRename={() => setRenamingKey(null)}
          onRenameTextChange={setRenameText}
          onAssign={(treeIdx, labelIndex, valueId) =>
            setAssigningValue({ treeIdx, labelIndex, valueId })
          }
        />
      );
    });

    return rows;
  }

  const nextLabelName = LABEL_NAMES[nextLabelIdx];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Custom Labels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign custom_label_0 – custom_label_4 to segment products for Google Shopping campaigns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Products",
            value: totalProducts,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            label: "Label Values",
            value: totalValues,
            icon: Tags,
            color: "text-purple-600",
            bg: "bg-purple-500/10",
          },
          {
            label: "Tagged Products",
            value: taggedProducts,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-500/10",
          },
          {
            label: "Untagged Products",
            value: untagged,
            icon: AlertCircle,
            color: "text-orange-600",
            bg: "bg-orange-500/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={`rounded-xl border border-border p-4 flex items-start gap-4 ${bg}`}
          >
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tree Table */}
      <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-[320px]">
                Data field
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-[120px]">
                <span className="flex items-center gap-1.5">
                  Products <RefreshCw className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Label Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-[240px]">
                Options
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {labelsLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Loading labels...
                  </td>
                </tr>
              ) : totalValues === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No label values yet. Type a value below and click "+ Add Custom Label Value".
                  </td>
                </tr>
              ) : (
                renderAllTrees()
              )}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Bottom input bar */}
        <div className="border-t border-border px-4 py-3 flex items-center gap-3 bg-secondary/20">
          <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            <span>
              Group{" "}
              <span className="font-semibold text-foreground">
                {currentTreeIdx + 1}
              </span>
              {" · "}
              <span className="font-semibold text-foreground">
                {nextLabelName}
              </span>
            </span>
          </div>
          <Input
            placeholder={`Enter ${nextLabelName} Value`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addValue()}
            className="flex-1 h-9 bg-background text-sm"
          />
          <Button
            onClick={addValue}
            disabled={!inputText.trim()}
            className="gap-2 bg-gray-800 hover:bg-gray-700 text-white shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Custom Label Value
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── TreeRows ────────────────────────────────────────────────────

function TreeRows({
  treeIdx, tree, renamingKey, renameText,
  onToggleExpand, onRemove, onStartRename, onSaveRename,
  onCancelRename, onRenameTextChange, onAssign,
}) {
  function renderLevel(labelIndex, parentVisible) {
    if (labelIndex >= 5 || !parentVisible) return null;

    const group  = tree[labelIndex];
    const indent = labelIndex * 24;
    const isLeaf = labelIndex === 4;

    return (
      <>
        {group.values.map((v) => {
          const rKey       = `${treeIdx}-${labelIndex}-${v.id}`;
          const isRenaming = renamingKey === rKey;

          return (
            <motion.tr
              key={rKey}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="border-b border-border hover:bg-secondary/20 transition-colors"
            >
              <td className="px-4 py-2.5">
                <div
                  className="flex items-center gap-1"
                  style={{ paddingLeft: `${indent}px` }}
                >
                  {!isLeaf ? (
                    <button
                      onClick={() => onToggleExpand(treeIdx, labelIndex)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 shrink-0"
                    >
                      {group.expanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : (
                    <span className="inline-block w-5 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground select-none">
                    {group.label}
                  </span>
                </div>
              </td>

              <td className="px-4 py-2.5 text-sm text-muted-foreground">
                {v.productIds.length}
              </td>

              <td className="px-4 py-2.5">
                {isRenaming ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={renameText}
                      onChange={(e) => onRenameTextChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSaveRename(treeIdx, labelIndex, v.id);
                        if (e.key === "Escape") onCancelRename();
                      }}
                      className="h-7 text-sm w-44 bg-secondary border-0"
                    />
                    <button
                      onClick={() => onSaveRename(treeIdx, labelIndex, v.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={onCancelRename}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-blue-600 font-medium">{v.name}</span>
                )}
              </td>

              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => onRemove(treeIdx, labelIndex, v.id)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                  <button
                    onClick={() => onStartRename(treeIdx, labelIndex, v.id, v.name)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => onAssign(treeIdx, labelIndex, v.id)}
                    className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </td>
            </motion.tr>
          );
        })}
        {renderLevel(labelIndex + 1, group.expanded && group.values.length > 0)}
      </>
    );
  }

  return renderLevel(0, true);
}
