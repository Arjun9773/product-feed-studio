import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { mockProducts } from "@/data/mockData";
import { motion } from "framer-motion";

const quickFilters = [
  { label: "Missing Brand", field: "brand" },
  { label: "Missing Color", field: "color" },
  { label: "Missing Category", field: "googleCategory" },
  { label: "Missing Material", field: "material" },
];

export default function Products() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filtered = mockProducts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter ? p.missingFields.includes(activeFilter) : true;
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((p) => p.id));
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ready": return <Badge className="bg-success/10 text-success border-0 font-medium">Ready</Badge>;
      case "warning": return <Badge className="bg-warning/10 text-warning border-0 font-medium">Warning</Badge>;
      case "error": return <Badge className="bg-destructive/10 text-destructive border-0 font-medium">Error</Badge>;
      default: return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockProducts.length} products in your feed</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Export Feed</Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl p-4 card-shadow border border-border space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-0" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickFilters.map((f) => (
              <Button
                key={f.field}
                variant={activeFilter === f.field ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(activeFilter === f.field ? null : f.field)}
                className={activeFilter === f.field ? "bg-primary text-primary-foreground" : ""}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="p-4 text-left w-12">
                  <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </th>
                <th className="p-4 text-left text-muted-foreground font-medium">Product</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Brand</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Color</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Material</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Price</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Category</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <Checkbox checked={selectedIds.includes(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.title} className="h-10 w-10 rounded-lg object-cover bg-secondary" />
                      <span className="font-medium text-foreground">{product.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.brand ? (
                      <span className="text-foreground">{product.brand}</span>
                    ) : (
                      <span className="text-destructive text-xs font-medium">Missing</span>
                    )}
                  </td>
                  <td className="p-4">
                    {product.color ? (
                      <span className="text-foreground">{product.color}</span>
                    ) : (
                      <span className="text-destructive text-xs font-medium">Missing</span>
                    )}
                  </td>
                  <td className="p-4">
                    {product.material ? (
                      <span className="text-foreground">{product.material}</span>
                    ) : (
                      <span className="text-destructive text-xs font-medium">Missing</span>
                    )}
                  </td>
                  <td className="p-4 text-foreground">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    {product.category ? (
                      <span className="text-foreground">{product.category}</span>
                    ) : (
                      <span className="text-destructive text-xs font-medium">Missing</span>
                    )}
                  </td>
                  <td className="p-4">{statusBadge(product.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} of {mockProducts.length} products</p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" className="h-8 min-w-[32px] bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm" className="h-8 min-w-[32px]">2</Button>
            <Button variant="outline" size="sm" className="h-8 min-w-[32px]">3</Button>
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
