import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockProducts } from "@/data/mockData";

export default function FeedOptimization() {
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[3]);
  const [editedTitle, setEditedTitle] = useState(selectedProduct.title);
  const [editedBrand, setEditedBrand] = useState(selectedProduct.brand);
  const [editedColor, setEditedColor] = useState(selectedProduct.color);

  const productsWithIssues = mockProducts.filter((p) => p.missingFields.length > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed Optimization</h1>
        <p className="text-muted-foreground text-sm mt-1">Improve your product data quality</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Products Needing Attention</h3>
            <p className="text-xs text-muted-foreground mt-1">{productsWithIssues.length} products</p>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {productsWithIssues.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setEditedTitle(product.title);
                  setEditedBrand(product.brand);
                  setEditedColor(product.color);
                }}
                className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors ${selectedProduct.id === product.id ? "bg-sidebar-accent" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <img src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                    <div className="flex gap-1 mt-1">
                      {product.missingFields.map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px] text-destructive border-destructive/30">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Edit Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl p-6 card-shadow border border-border space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Edit Product Attributes</h3>
              <Button size="sm" variant="outline" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Auto-detect from Title
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Product Title</label>
                <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Brand</label>
                  <Input value={editedBrand} onChange={(e) => setEditedBrand(e.target.value)} placeholder="Enter brand..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Color</label>
                  <Input value={editedColor} onChange={(e) => setEditedColor(e.target.value)} placeholder="Enter color..." />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="bg-primary text-primary-foreground gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview Optimized Title
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card rounded-xl p-6 card-shadow border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Optimized Title Preview
            </h3>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-foreground">
                {editedBrand && `${editedBrand} `}{editedTitle}{editedColor && ` - ${editedColor}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
