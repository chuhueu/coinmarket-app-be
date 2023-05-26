const Product = require("../schema/productModel");

// GET ALL
const getProducts = async (req, res) => {
    try {
        const getProducts = await Product.find();
        res.status(200).json(getProducts);
      } catch (error) {
        res.status(500).json(error);
      }
}

// CREATE PRODUCT
const createProduct = async (req, res) => {
    const newProduct = new Product(req.body);
    try {
        const sendProduct = await newProduct.save();
        res.status(200).json(sendProduct);
    } catch (error) {
        res.status(500).json(error);
    }
}

// FIND BY ID
const getProductById = async (req, res) => {
  try {
    const getProduct = await Product.findById(req.params.id);
    res.status(200).json(getProduct);
  } catch (error) {
    res.status(500).json(error);
  }
}

module.exports = {createProduct, getProducts, getProductById};