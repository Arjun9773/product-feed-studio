function getDataField(position) {
  return `custom_label_${position}`;
}

function getLabelName(position) {
  return `Custom Label ${position}`;
}

module.exports = { getDataField, getLabelName };
