import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Play,
  Edit,
  Trash2,
  ListOrdered,
  Package,
  CheckCircle2,
  Clock,
  GripVertical,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import API from "@/hooks/useApi";
import { toast } from "sonner";

// All available fields — all draggable
const ALL_FIELDS = [
  "Product Name",
  "Brand",
  "Colour",
  "Age Group",
  "Material",
  "Gender",
  "Pattern",
  "Size",
  "GTIN",
  "Category",
];

// Map display name → DB field key
const FIELD_DB_MAP = {
  "Product Name": "product_name",
  Brand: "brand",
  Colour: "color",
  "Age Group": "age_group",
  Material: "material",
  Gender: "gender",
  Pattern: "pattern",
  Size: "bl_size",
  GTIN: "ean_id",
  Category: "category",
};

// ─── Add Rule Form ────────────────────────────────────────────
function AddRuleForm({ onSave, onCancel, categories, editRule = null }) {
  const [ruleName, setRuleName] = useState(editRule?.ruleName || "");
  const [selectedCat, setSelectedCat] = useState(editRule?.category || "");
  const [activeFields, setActiveFields] = useState(() => {
    if (editRule?.titleOptStructure) {
      const dbFields = editRule.titleOptStructure
        .split(",")
        .map((f) => f.trim());
      return dbFields
        .map(
          (dbField) =>
            Object.entries(FIELD_DB_MAP).find(([, v]) => v === dbField)?.[0],
        )
        .filter(Boolean);
    }
    return ["Product Name", "Brand"];
  });
  const [saving, setSaving] = useState(false);

  // Fields not yet added
  const availableToAdd = ALL_FIELDS.filter((f) => !activeFields.includes(f));

  // Build comma-separated DB field string
  const buildStructure = () =>
    activeFields.map((f) => FIELD_DB_MAP[f]).join(",");

  // Preview string
  const previewStructure = activeFields.join(" + ");

  const handleSave = async () => {
    if (!ruleName.trim()) {
      toast.error("Rule name is required");
      return;
    }
    if (!selectedCat) {
      toast.error("Please select a category");
      return;
    }
    if (activeFields.length === 0) {
      toast.error("Add at least one field");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ruleName: ruleName.trim(),
        titleOptStructure: buildStructure(),
        category: selectedCat,
        status: "not started",
      };

      if (editRule) {
        await API.put(`/title-rules/${editRule._id}`, payload);
        toast.success("Rule updated!");
      } else {
        await API.post("/title-rules", payload);
        toast.success("Rule created!");
      }
      onSave();
    } catch {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card rounded-xl p-6 border border-border space-y-5"
    >
      <h3 className="font-semibold text-foreground">
        {editRule ? "Edit Rule" : "New Title Optimization Rule"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Rule Name *
          </label>
          <Input
            placeholder="e.g., Television Rule"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Product Category *
          </label>
          <select
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Title Structure Builder */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Product Name Optimization Order
        </label>

        {/* Draggable active fields */}
        <div className="bg-secondary/40 rounded-xl p-4 border border-border min-h-[60px]">
          {activeFields.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Add fields below to build title structure
            </p>
          ) : (
            <Reorder.Group
              axis="x"
              values={activeFields}
              onReorder={setActiveFields}
              className="flex flex-wrap gap-2"
            >
              {activeFields.map((field) => (
                <Reorder.Item key={field} value={field}>
                  <motion.div
                    layout
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-secondary border border-border cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors select-none"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {field}
                    <button
                      onClick={() =>
                        setActiveFields((prev) =>
                          prev.filter((f) => f !== field),
                        )
                      }
                      className="ml-1 h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>

        {/* Available fields to add */}
        {availableToAdd.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Add fields:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableToAdd.map((field) => (
                <button
                  key={field}
                  onClick={() => setActiveFields((prev) => [...prev, field])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {field}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {activeFields.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
            <p className="text-xs text-muted-foreground mb-1">
              Title preview structure:
            </p>
            <p className="text-sm font-mono text-primary">{previewStructure}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {saving ? "Saving..." : editRule ? "Update Rule" : "Save Rule"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function TitleOptimization() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [categories, setCategories] = useState([]);
  const [running, setRunning] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const { currentStoreId } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesRes, productsRes] = await Promise.all([
        API.get("/title-rules"),
        API.get("/products"),
      ]);
      setRules(rulesRes.data);

      const cats = [
        ...new Set(productsRes.data.map((p) => p.category).filter(Boolean)),
      ].sort();
      setCategories(cats);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentStoreId]);

  const handleRun = async (rule) => {
    setRunning(rule._id);
    try {
      await API.post(`/title-rules/${rule._id}/run`);
      toast.success(`Rule "${rule.ruleName}" applied!`);
      loadData();
    } catch {
      toast.error("Failed to run rule");
    } finally {
      setRunning(null);
    }
  };

  const handleDelete = async () => {
    const ruleId = confirmDel;
    setConfirmDel(null);
    setDeleting(ruleId);
    try {
      await API.delete(`/title-rules/${ruleId}`);
      toast.success("Rule deleted");
      setRules((prev) => prev.filter((r) => r._id !== ruleId));
    } catch {
      toast.error("Failed to delete rule");
    } finally {
      setDeleting(null);
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditRule(null);
    loadData();
  };

  const statusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success";
      case "running":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Title Optimization
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define rules to optimize product titles by category
          </p>
        </div>
        {!showForm && (
          <Button
            className="bg-primary text-primary-foreground gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" /> Add New Rule
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Rules",
            value: rules.length,
            icon: ListOrdered,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Products Covered",
            value: rules.reduce((s, r) => s + (r.productsCount || 0), 0),
            icon: Package,
            color: "text-info",
            bg: "bg-info/10",
          },
          {
            label: "Not Started",
            value: rules.filter((r) => r.status === "not started").length,
            icon: Clock,
            color: "text-warning",
            bg: "bg-warning/10",
          },
          {
            label: "Completed",
            value: rules.filter((r) => r.status === "completed").length,
            icon: CheckCircle2,
            color: "text-success",
            bg: "bg-success/10",
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
              <p className="text-xs text-muted-foreground font-medium">
                {label}
              </p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <AddRuleForm
            onSave={handleFormSave}
            onCancel={() => {
              setShowForm(false);
              setEditRule(null);
            }}
            categories={categories}
            editRule={editRule}
          />
        )}
      </AnimatePresence>

      {/* Rules Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${rules.length} rules defined`}
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading rules...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <ListOrdered className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No rules yet — create your first rule
            </p>
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Rule
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Rule Name
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Title Structure
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Category
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Products
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr
                    key={rule._id}
                    className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="p-4 font-medium text-foreground">
                      {rule.ruleName}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {rule.titleOptStructure?.split(",").map((f, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono"
                          >
                            {f.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-foreground">{rule.category}</td>
                    <td className="p-4 text-foreground">
                      {rule.productsCount ?? 0}
                    </td>
                    <td className="p-4">
                      <Badge
                        className={`${statusColor(rule.status)} border-0 text-xs font-medium`}
                      >
                        {rule.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleRun(rule)}
                          disabled={running === rule._id}
                        >
                          {running === rule._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          {running === rule._id ? "Running..." : "Run"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setEditRule(rule);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs gap-1"
                          onClick={() => setConfirmDel(rule._id)}
                          disabled={deleting === rule._id}
                        >
                          {deleting === rule._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <AnimatePresence>
        {confirmDel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setConfirmDel(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10"
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Delete Rule
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this rule? This cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button
                  onClick={() => setConfirmDel(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
