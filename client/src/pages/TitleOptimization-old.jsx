import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Play, Edit, Trash2, ListOrdered, Package, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { titleOptRules } from "@/data/mockData";

export default function TitleOptimization() {
  const [rules, setRules] = useState(titleOptRules);
  const [showForm, setShowForm] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Title Optimization</h1>
          <p className="text-muted-foreground text-sm mt-1">Your product name optimization process is shown below</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add New Rule
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Rules", value: rules.length, sub: "Optimization rules defined", icon: ListOrdered, color: "text-primary", bg: "bg-primary/10" },
          { label: "Products Covered", value: rules.reduce((s, r) => s + r.productsCount, 0), sub: "Products with active rules", icon: Package, color: "text-info", bg: "bg-info/10" },
          { label: "Not Started", value: rules.filter((r) => r.status === "not started").length, sub: "Rules pending execution", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
          { label: "Completed", value: rules.filter((r) => r.status === "completed").length, sub: "Successfully optimized", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
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

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-card rounded-xl p-6 card-shadow border border-border space-y-4">
          <h3 className="font-semibold text-foreground">New Title Optimization Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Name</label>
              <Input placeholder="e.g., Television" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title Opt Structure</label>
              <Input placeholder="e.g., brand,name,color" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
              <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                <option>Home Entertainment &gt; Television</option>
                <option>Home appliances &gt; Air Conditioners</option>
                <option>Home appliances &gt; Air cooler</option>
                <option>Electronics &gt; Mobile</option>
                <option>Electronics &gt; Kitchen</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-primary text-primary-foreground">Save Rule</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm text-muted-foreground">Showing 1-{rules.length} of {rules.length} items</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/90">
                <th className="p-4 text-left text-primary-foreground font-medium">Rule Name</th>
                <th className="p-4 text-left text-primary-foreground font-medium">Title Opt Structure</th>
                <th className="p-4 text-left text-primary-foreground font-medium">Category</th>
                <th className="p-4 text-left text-primary-foreground font-medium">Products Count</th>
                <th className="p-4 text-left text-primary-foreground font-medium">Status</th>
                <th className="p-4 text-left text-primary-foreground font-medium">Options</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{rule.ruleName}</td>
                  <td className="p-4 font-mono text-xs text-foreground">{rule.titleOptStructure}</td>
                  <td className="p-4 text-foreground">{rule.category}</td>
                  <td className="p-4 text-foreground">{rule.productsCount}</td>
                  <td className="p-4">
                    <Badge className="bg-muted text-muted-foreground border-0 font-medium">{rule.status}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-primary text-primary-foreground h-7 text-xs gap-1">
                        <Play className="h-3 w-3" />
                        Run
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs gap-1">
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
