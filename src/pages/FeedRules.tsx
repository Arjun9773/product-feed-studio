import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { feedRules } from "@/data/mockData";

export default function FeedRules() {
  const [rules, setRules] = useState(feedRules);
  const [showBuilder, setShowBuilder] = useState(false);

  const toggleRule = (id: number) => {
    setRules(rules.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Rules</h1>
          <p className="text-muted-foreground text-sm mt-1">Automate product data transformations</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2" onClick={() => setShowBuilder(!showBuilder)}>
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Rule Builder */}
      {showBuilder && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-card rounded-xl p-6 card-shadow border border-border space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            New Rule Builder
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Name</label>
              <Input placeholder="e.g., Auto-categorize Electronics" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Condition Field</label>
              <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                <option>Category</option>
                <option>Brand</option>
                <option>Price</option>
                <option>Color</option>
                <option>Title</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Condition Value</label>
              <Input placeholder="e.g., Shoes" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Action</label>
              <Input placeholder="e.g., Set Google Category = Apparel > Shoes" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-primary text-primary-foreground">Save Rule</Button>
            <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-card rounded-xl p-5 card-shadow border border-border flex items-center gap-4">
            <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule.id)} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{rule.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                IF <span className="font-medium text-foreground">{rule.condition}</span> → THEN <span className="font-medium text-foreground">{rule.action}</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
