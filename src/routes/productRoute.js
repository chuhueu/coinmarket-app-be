const { createProduct, getProducts, getProductById } = require("../controller/productController")

const router = require("express").Router();

//CREATE AND GET
router.route("/").post(createProduct).get(getProducts);

//FIND PRODUCT BY ID
router.route("/:id").get(getProductById)

module.exports = router;