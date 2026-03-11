import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockData";

export default function FeedProductList() {
  const [search, setSearch] = useState("");

  const filtered = mockProducts.filter((p) =>
    p.feedName.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.productCode.includes(search)
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed Product List</h1>
        <p className="text-muted-foreground text-sm mt-1">Showing {filtered.length} of {mockProducts.length} items</p>
      </div>

      <div className="bg-card rounded-xl p-4 card-shadow border border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by product name, code, or brand..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-0" />
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="p-3 text-left text-muted-foreground font-medium w-12">#</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Product Code</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Feed Name</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Image</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Brand</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Color</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Age Group</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Gender</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Material</th>
                <th className="p-3 text-left text-muted-foreground font-medium">GTIN</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, idx) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-3 text-muted-foreground">{idx + 1}</td>
                  <td className="p-3 font-mono text-xs text-foreground">{product.productCode}</td>
                  <td className="p-3 font-medium text-foreground">{product.feedName}</td>
                  <td className="p-3">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="p-3">{product.brand || <span className="text-destructive text-xs">—</span>}</td>
                  <td className="p-3">{product.color || <span className="text-destructive text-xs">—</span>}</td>
                  <td className="p-3">{product.ageGroup || <span className="text-destructive text-xs">—</span>}</td>
                  <td className="p-3">{product.gender || <span className="text-destructive text-xs">—</span>}</td>
                  <td className="p-3">{product.material || <span className="text-destructive text-xs">—</span>}</td>
                  <td className="p-3">{product.gtin || <span className="text-destructive text-xs">—</span>}</td>
                  <td className="p-3 text-foreground">₹{product.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} of {mockProducts.length} items</p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" className="h-8 min-w-[32px] bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
