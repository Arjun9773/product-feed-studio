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

    {/* Form Section - Mobile Responsive Grid */}
    {showForm && (
      <motion.div 
        initial={{ opacity: 0, height: 0 }} 
        animate={{ opacity: 1, height: "auto" }} 
        className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border space-y-4"
      >
        <h3 className="font-semibold text-foreground">New Title Optimization Rule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 block">Rule Name</label>
            <Input placeholder="e.g., Television" />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 block">Title Opt Structure</label>
            <Input placeholder="e.g., brand,name,color" />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 block">Category</label>
            <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              <option>Home Entertainment &gt; Television</option>
              <option>Home appliances &gt; Air Conditioners</option>
              <option>Electronics &gt; Mobile</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="bg-primary text-primary-foreground">Save Rule</Button>
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>
      </motion.div>
    )}

    {/* Table Section with Horizontal Scroll */}
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/10">
        <p className="text-xs sm:text-sm text-muted-foreground">Showing 1-{rules.length} of {rules.length} items</p>
      </div>

      {/* இங்குதான் முக்கியமான மாற்றம்: 
          overflow-x-auto மொபைலில் ஸ்க்ரோல் செய்ய உதவும்.
      */}
      <div className="overflow-x-auto w-full">
        {/* min-w-[800px] மொபைலில் டேபிள் நசுங்காமல் இருக்க உதவும் */}
        <table className="w-full text-sm min-w-[800px] border-collapse">
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
                <td className="p-4 text-foreground truncate max-w-[200px]">{rule.category}</td>
                <td className="p-4 text-foreground">{rule.productsCount}</td>
                <td className="p-4">
                  <Badge className="bg-muted text-muted-foreground border-0 font-medium">{rule.status}</Badge>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary text-primary-foreground h-7 text-xs gap-1">
                      <Play className="h-3 w-3" /> Run
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <Edit className="h-3 w-3" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs gap-1 px-2">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Hint: மொபைல் பயனர்களுக்கு ஸ்க்ரோல் செய்யலாம் என்பதை உணர்த்த சிறிய ஹிண்ட் */}
      <div className="sm:hidden p-2 text-[10px] text-center text-muted-foreground border-t border-border bg-muted/5">
        ← Swipe left to see more details →
      </div>
    </div>
  </motion.div>
);
}
