const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    estimatePrice: { type: String, required: true },
    author: {
        name: { type: String, required: true },
        nationality: { type: String, required: true },
        birth: { type: String, required: true },
    },
    startedYear: { type: String, required: true },
    completedYear: { type: String, required: true },
    desc: { type: String },
    tokenAddress: {type: String},
    typeArt: {type: String}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
