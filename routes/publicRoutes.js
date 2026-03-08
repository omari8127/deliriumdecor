const express = require('express');
const { getAllProducts, getProductById } = require('../utils/productStore');

const router = express.Router();

router.get('/', (_req, res) => {
  res.render('index');
});

router.get('/catalog', (_req, res) => {
  const products = getAllProducts();
  res.render('catalog', { products });
});

router.get('/products/:id', (req, res) => {
  const product = getProductById(req.params.id);

  if (!product) {
    return res.status(404).send('Product not found.');
  }

  return res.render('product-details', { product });
});

module.exports = router;
