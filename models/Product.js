const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  imagePaths: [{ type: String, required: true }],
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  sizes: [{ type: Number }],
  colors: [{ type: String }]
});

module.exports = mongoose.model('Product', productSchema);
