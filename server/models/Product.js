// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    // ─── IDENTIFIERS ─────────────────────────────────────────
    sourceId:   { type: String, required: true },
    feedId:     { type: String, required: true },
    tenantId:   { type: String, required: true },
    item_code:  { type: String, default: null },
    ean_id:     { type: String, default: null },
    gtin:       { type: String, default: null },   // GTIN

    // ─── BASIC INFO ──────────────────────────────────────────
    product_name:    { type: String, default: null },
    brand:           { type: String, default: null },
    category:        { type: String, default: null },
    google_category: { type: String, default: null },
    price:           { type: Number, default: null },
    was_price:       { type: Number, default: null },
    stock:           { type: Number, default: null },
    quantity:        { type: Number, default: null },
    product_url:    { type: String, default: null },

    // ─── DESCRIPTIONS  
    description:       { type: String, default: null },
    short_description: { type: String, default: null },

    // ─── ATTRIBUTES ──────────────────────────────────────────
    color:         { type: String, default: null },
    age_group:     { type: String, default: null },
    gender:        { type: String, default: null },
    material:      { type: String, default: null },
    pattern:       { type: String, default: null },
    bl_size:       { type: String, default: null },
    sku_variation: { type: String, default: null },
    bl_upc:        { type: String, default: null },

    // ─── SEO ─────────────────────────────────────────────────
    url_key:    { type: String, default: null },
    meta_title: { type: String, default: null },

    // ─── HIGHLIGHTS ──────────────────────────────────────────
    product_highlight1: { type: String, default: null },
    product_highlight2: { type: String, default: null },
    product_highlight3: { type: String, default: null },
    product_highlight4: { type: String, default: null },
    product_highlight5: { type: String, default: null },

    // ─── ADDITIONAL IMAGES ───────────────────────────────────
    additional_image1: { type: String, default: null },
    additional_image2: { type: String, default: null },
    additional_image3: { type: String, default: null },
    additional_image4: { type: String, default: null },
    additional_image5: { type: String, default: null },
    additional_image6: { type: String, default: null },
    additional_image7: { type: String, default: null },
    additional_image8: { type: String, default: null },

    // ─── STATUS ──────────────────────────────────────────────
    is_active:     { type: Boolean, default: true },
    deactivatedAt: { type: Date,    default: null },
    importedAt:    { type: Date,    default: null },
    updatedAt:     { type: Date,    default: null },
    title_optimization_status: { type: String, enum: ['pending', 'optimized', 'failed'], default: 'pending' },
    field_optimization_status: { type: String, enum: ['pending', 'optimized', 'failed'], default: 'pending' },
    google_category_optimization_status: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    keyword_optimization_status: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
  },
  {
    timestamps: false,
    collection: 'products',
  }
);

// ─── INDEXES ─────────────────────────────────────────────────
ProductSchema.index({ sourceId: 1, tenantId: 1 }, { unique: true });
ProductSchema.index({ tenantId: 1 });
ProductSchema.index({ feedId: 1 });
ProductSchema.index({ is_active: 1 });
ProductSchema.index({ tenantId: 1, is_active: 1 });

module.exports = ProductSchema;
