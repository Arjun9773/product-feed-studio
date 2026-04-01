const mongoose = require('mongoose');
const crypto = require('crypto');

const CustomLabelSchema = new mongoose.Schema(
  {
    tenantId:    { type: String, required: true },
    // companyId → உன் project-ல tenantId

    feedId:      { type: String, required: true },

    data_field:  { type: String, required: true },
    // "custom_label_0" ... "custom_label_4"

    label:       { type: String, required: true },
    // "Custom Label 0" ... "Custom Label 4"

    label_value: { type: String, required: true },
    // user type பண்றது → "summer_sale"

    archived:    { type: Number, default: 0 },
    // 0 = active, 1 = deleted

    prodcount:   { type: Number, default: 0 },
    // எத்தனை products assign ஆச்சு

    position:    { type: Number, required: true },
    // 0,1,2,3,4

    id_name:     { type: String, required: true },
    // group id — custom_label_0 போடும்போது create ஆகும்
    // custom_label_1 to 4 same id share பண்ணும்

    created_date: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'customlabels',
  }
);

// indexes
CustomLabelSchema.index({ tenantId: 1 });
CustomLabelSchema.index({ feedId: 1 });
CustomLabelSchema.index({ id_name: 1 });
CustomLabelSchema.index({ tenantId: 1, feedId: 1, position: 1 });

module.exports = mongoose.model('CustomLabel', CustomLabelSchema);
