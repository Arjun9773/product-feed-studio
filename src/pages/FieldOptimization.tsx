import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ImageOff, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts } from "@/data/mockData";

const dataFields = ["Product Color", "Age Group", "Gender", "Material", "Pattern", "GTIN"];
const taggingOptions = ["All", "Untagged", "Tagged"];

export default function FieldOptimization() {
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState("Product Color");
  const [selectedTagging, setSelectedTagging] = useState("Untagged");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const brands = [...new Set(mockProducts.map((p) => p.brand).filter(Boolean))];
  const categories = [...new Set(mockProducts.map((p) => p.category).filter(Boolean))];

  const filtered = mockProducts.filter((p) => {
    const matchesSearch = p.feedName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory ? p.category.includes(selectedCategory) : true;
    const matchesBrand = selectedBrand ? p.brand === selectedBrand : true;
    return matchesSearch && matchesCat && matchesBrand;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Field Optimization</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Adding additional data fields to your product feed can enhance the information available to potential customers. Select a data field and tag or update values for your products.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filtering Sidebar */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border space-y-5 h-fit">
          <h3 className="font-semibold text-foreground">Data Field Filtering</h3>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Select tagging:</label>
            <select
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedTagging}
              onChange={(e) => setSelectedTagging(e.target.value)}
            >
              {taggingOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Select Category:</label>
            <select
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">--Please Choose--</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Select Brand:</label>
            <select
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">--Please Choose--</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="bg-primary text-primary-foreground">Search</Button>
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedBrand(""); }}>Clear All</Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Field selector */}
          <div className="bg-card rounded-xl p-5 card-shadow border border-border">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Select Data Field Name:</label>
                <select
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                >
                  {dataFields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="min-w-[150px]">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Bulk Select:</label>
                <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                  <option>-- Bulk Select --</option>
                  <option>Select All</option>
                  <option>Deselect All</option>
                </select>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Showing 1-{filtered.length} of {filtered.length} items</p>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div key={product.id} className="bg-card rounded-xl card-shadow border border-border overflow-hidden hover:card-shadow-hover transition-shadow">
                <div className="h-32 bg-secondary flex items-center justify-center relative">
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                  <span className="absolute top-2 left-2">
                    <Badge className="bg-success/10 text-success border-0 text-[10px]">AVAILABLE</Badge>
                  </span>
                  <button className="absolute top-2 right-2 h-6 w-6 rounded bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-medium text-primary truncate flex items-center gap-1">
                    {product.feedName}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </p>
                  <p className="text-xs text-muted-foreground">Price: ₹{product.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                  <div className="pt-1.5 border-t border-border">
                    <span className="text-[10px] font-semibold text-warning uppercase">Optimized Value</span>
                    <p className="text-xs text-muted-foreground italic">No optimized Value</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
