export const mockProducts = [
  { id: 1, title: "Nike Air Max 90", brand: "Nike", color: "White/Black", material: "Leather", price: 129.99, category: "Shoes", status: "ready", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop", missingFields: [] },
  { id: 2, title: "Adidas Ultraboost 22", brand: "Adidas", color: "Core Black", material: "Primeknit", price: 189.99, category: "Shoes", status: "ready", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=80&h=80&fit=crop", missingFields: [] },
  { id: 3, title: "Levi's 501 Original Jeans", brand: "Levi's", color: "Indigo", material: "Denim", price: 69.99, category: "Clothing", status: "ready", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=80&h=80&fit=crop", missingFields: [] },
  { id: 4, title: "Summer Cotton T-Shirt", brand: "", color: "White", material: "Cotton", price: 24.99, category: "Clothing", status: "warning", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop", missingFields: ["brand"] },
  { id: 5, title: "Classic Leather Wallet", brand: "Coach", color: "", material: "Leather", price: 89.99, category: "Accessories", status: "warning", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=80&h=80&fit=crop", missingFields: ["color"] },
  { id: 6, title: "Wireless Bluetooth Headphones", brand: "", color: "", material: "Plastic", price: 59.99, category: "Electronics", status: "error", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop", missingFields: ["brand", "color", "googleCategory"] },
  { id: 7, title: "Women's Running Shoes", brand: "New Balance", color: "Grey", material: "", price: 109.99, category: "Shoes", status: "warning", image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=80&h=80&fit=crop", missingFields: ["material"] },
  { id: 8, title: "Organic Face Cream", brand: "The Body Shop", color: "", material: "", price: 34.99, category: "", status: "error", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=80&h=80&fit=crop", missingFields: ["color", "material", "googleCategory"] },
  { id: 9, title: "Stainless Steel Water Bottle", brand: "Hydro Flask", color: "Pacific", material: "Stainless Steel", price: 44.99, category: "Sports", status: "ready", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=80&h=80&fit=crop", missingFields: [] },
  { id: 10, title: "Yoga Mat Premium", brand: "", color: "Purple", material: "TPE", price: 49.99, category: "Sports", status: "warning", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=80&h=80&fit=crop", missingFields: ["brand"] },
  { id: 11, title: "Smart Watch Pro", brand: "Samsung", color: "Black", material: "Aluminum", price: 299.99, category: "Electronics", status: "ready", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop", missingFields: [] },
  { id: 12, title: "Canvas Backpack", brand: "", color: "", material: "Canvas", price: 39.99, category: "", status: "error", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop", missingFields: ["brand", "color", "googleCategory"] },
];

export const categoryMappings = [
  { id: 1, storeCategory: "Shoes", googleCategory: "Apparel & Accessories > Shoes", status: "mapped" },
  { id: 2, storeCategory: "Clothing", googleCategory: "Apparel & Accessories > Clothing", status: "mapped" },
  { id: 3, storeCategory: "Electronics", googleCategory: "Electronics", status: "mapped" },
  { id: 4, storeCategory: "Accessories", googleCategory: "Apparel & Accessories > Clothing Accessories", status: "mapped" },
  { id: 5, storeCategory: "Sports", googleCategory: "Sporting Goods", status: "mapped" },
  { id: 6, storeCategory: "Home Decor", googleCategory: "", status: "unmapped" },
  { id: 7, storeCategory: "Beauty", googleCategory: "", status: "unmapped" },
  { id: 8, storeCategory: "Kitchen", googleCategory: "Home & Garden > Kitchen", status: "mapped" },
];

export const feedRules = [
  { id: 1, name: "Auto-categorize Shoes", condition: "Category = Shoes", action: "Set Google Category = Apparel & Accessories > Shoes", active: true },
  { id: 2, name: "Add Brand Prefix", condition: "Brand is not empty", action: "Prepend Brand to Title", active: true },
  { id: 3, name: "Fix Missing Color", condition: "Color is empty", action: "Set Color = 'Multicolor'", active: false },
  { id: 4, name: "Price Markup", condition: "Price < 50", action: "Add 'Budget' to Title", active: true },
];

export const auditData = {
  totalProducts: 12,
  healthScore: 72,
  issues: [
    { label: "Missing Brand", count: 4, severity: "high" as const },
    { label: "Missing Color", count: 3, severity: "high" as const },
    { label: "Missing Category", count: 3, severity: "critical" as const },
    { label: "Missing GTIN", count: 6, severity: "medium" as const },
    { label: "Missing Images", count: 0, severity: "low" as const },
    { label: "Missing Description", count: 5, severity: "medium" as const },
  ],
};
