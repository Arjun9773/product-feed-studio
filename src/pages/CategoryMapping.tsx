import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { categoryMappings } from "@/data/mockData";

const googleCategories = [
  "Apparel & Accessories > Shoes",
  "Apparel & Accessories > Clothing",
  "Apparel & Accessories > Clothing Accessories",
  "Electronics",
  "Electronics > Audio",
  "Home & Garden",
  "Home & Garden > Kitchen",
  "Sporting Goods",
  "Health & Beauty",
  "Health & Beauty > Personal Care",
];

export default function CategoryMapping() {
  const [search, setSearch] = useState("");
  const filtered = categoryMappings.filter((m) => m.storeCategory.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Category Mapping</h1>
          <p className="text-muted-foreground text-sm mt-1">Map store categories to Google product categories</p>
        </div>
        <Button className="bg-primary text-primary-foreground">Auto-Map Categories</Button>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-0" />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="p-4 text-left text-muted-foreground font-medium">Store Category</th>
              <th className="p-4 text-center text-muted-foreground font-medium w-12"></th>
              <th className="p-4 text-left text-muted-foreground font-medium">Google Category</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
              <th className="p-4 text-right text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((mapping) => (
              <tr key={mapping.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{mapping.storeCategory}</td>
                <td className="p-4 text-center"><ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                <td className="p-4">
                  {mapping.googleCategory ? (
                    <span className="text-foreground">{mapping.googleCategory}</span>
                  ) : (
                    <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                      <option value="">Select Google Category...</option>
                      {googleCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="p-4">
                  {mapping.status === "mapped" ? (
                    <Badge className="bg-success/10 text-success border-0 font-medium gap-1"><Check className="h-3 w-3" />Mapped</Badge>
                  ) : (
                    <Badge className="bg-warning/10 text-warning border-0 font-medium gap-1"><X className="h-3 w-3" />Unmapped</Badge>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Button variant="outline" size="sm">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
