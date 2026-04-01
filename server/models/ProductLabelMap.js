const mongoose = require('mongoose');

const ProductLabelMapSchema = new mongoose.Schema(
  {
    tenantId:    { type: String, required: true },
    feedId:      { type: String, required: true },

    productId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    // Product._id reference

    id_name:     { type: String, required: true },
    // CustomLabel group id → same as CustomLabel.id_name

    data_field:  { type: String, required: true },
    // "custom_label_0" ... "custom_label_4"

    label_value: { type: String, required: true },
    // "summer_sale"

    assigned_by: { type: String, enum: ['manual', 'rule'], default: 'manual' },
    // manual = user select பண்ணாங்க
    // rule   = automatic match ஆச்சு

    assigned_date: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'productlabelmaps',
  }
);

// ஒரு product-க்கு same label duplicate வரக்கூடாது
ProductLabelMapSchema.index(
  { productId: 1, data_field: 1 },
  { unique: true }
);

ProductLabelMapSchema.index({ tenantId: 1 });
ProductLabelMapSchema.index({ feedId: 1 });
ProductLabelMapSchema.index({ id_name: 1 });

module.exports = mongoose.model('ProductLabelMap', ProductLabelMapSchema);
