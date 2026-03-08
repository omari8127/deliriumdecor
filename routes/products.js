const fs = require('fs');
const path = require('path');
const express = require('express');

const PRODUCTS_FILE = path.join(__dirname, '..', 'products.json');

function readProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf8');
  }

  const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(clean || '[]');
}

function writeProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function matchesFilters(product, q, category) {
  const qLower = q ? q.toLowerCase() : '';
  const categoryLower = category ? category.toLowerCase() : '';

  const qMatch =
    !qLower ||
    product.name.toLowerCase().includes(qLower) ||
    product.description.toLowerCase().includes(qLower);
  const categoryMatch =
    !categoryLower ||
    categoryLower === 'all' ||
    (product.category || '').toLowerCase() === categoryLower;

  return qMatch && categoryMatch;
}

function updateProductById(id, body, file) {
  const products = readProducts();
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    return { error: 'Product not found', status: 404 };
  }

  const current = products[index];
  const updated = {
    ...current,
    name: body.name ? String(body.name).trim() : current.name,
    price: body.price ? Number(body.price) : current.price,
    description: body.description
      ? String(body.description).trim()
      : current.description,
    category:
      body.category !== undefined
        ? String(body.category).trim()
        : current.category,
    image: file ? `/uploads/${file.filename}` : current.image
  };

  products[index] = updated;
  writeProducts(products);
  return { product: updated };
}

module.exports = function productsRouter(upload, authMiddleware) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const { q = '', category = 'all' } = req.query;
    const products = readProducts().filter((product) =>
      matchesFilters(product, q, category)
    );
    res.json(products);
  });

  router.get('/:id', (req, res) => {
    const products = readProducts();
    const product = products.find((item) => item.id === req.params.id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  });

  router.post('/', authMiddleware, upload.single('image'), (req, res) => {
    const { name, price, description, category = '' } = req.body;

    if (!name || !price || !description) {
      res.status(400).json({ error: 'name, price, and description are required' });
      return;
    }

    const products = readProducts();
    const product = {
      id: Date.now().toString(),
      name: String(name).trim(),
      price: Number(price),
      description: String(description).trim(),
      category: String(category).trim(),
      image: req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder-mug.svg'
    };

    products.push(product);
    writeProducts(products);
    res.status(201).json(product);
  });

  router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
    const result = updateProductById(req.params.id, req.body, req.file);
    if (result.error) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.json(result.product);
  });

  router.put('/', authMiddleware, upload.single('image'), (req, res) => {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: 'id is required for PUT /api/products' });
      return;
    }

    const result = updateProductById(String(id), req.body, req.file);
    if (result.error) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.json(result.product);
  });

  router.delete('/:id', authMiddleware, (req, res) => {
    const products = readProducts();
    const product = products.find((item) => item.id === req.params.id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updated = products.filter((item) => item.id !== req.params.id);
    writeProducts(updated);
    res.json({ success: true });
  });

  return router;
};
