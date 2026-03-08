const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
} = require('../utils/productStore');
const { requireAdmin, ADMIN_COOKIE } = require('../middleware/auth');

function isValidProductInput(input) {
  return (
    input.name &&
    String(input.name).trim() &&
    input.price &&
    !Number.isNaN(Number(input.price)) &&
    input.shortDescription &&
    String(input.shortDescription).trim() &&
    input.description &&
    String(input.description).trim()
  );
}

function removeUploadIfExists(imagePath) {
  if (!imagePath || imagePath.includes('default-product.svg')) {
    return;
  }

  const localPath = path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''));
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
}

module.exports = function adminRoutes(upload) {
  const router = express.Router();

  router.get('/login', (_req, res) => {
    res.render('admin/login', { error: '' });
  });

  router.post('/login', (req, res) => {
    const submitted = req.body.password;
    const expected = process.env.ADMIN_PASSWORD || 'admin123';

    if (submitted !== expected) {
      return res.status(401).render('admin/login', { error: 'Invalid password' });
    }

    res.cookie(ADMIN_COOKIE, expected, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 12
    });

    return res.redirect('/admin');
  });

  router.get('/logout', (_req, res) => {
    res.clearCookie(ADMIN_COOKIE);
    res.redirect('/admin/login');
  });

  router.get('/', requireAdmin, (_req, res) => {
    const products = getAllProducts();
    res.render('admin/dashboard', { products, error: '', formData: {} });
  });

  router.post('/products', requireAdmin, upload.single('image'), (req, res) => {
    if (!isValidProductInput(req.body)) {
      const products = getAllProducts();
      return res.status(400).render('admin/dashboard', {
        products,
        error: 'Please fill all required fields with valid values.',
        formData: req.body
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : '/uploads/default-product.svg';
    addProduct({ ...req.body, image });
    return res.redirect('/admin');
  });

  router.get('/products/:id/edit', requireAdmin, (req, res) => {
    const product = getProductById(req.params.id);
    if (!product) {
      return res.status(404).send('Product not found.');
    }

    return res.render('admin/edit-product', { product, error: '' });
  });

  router.post('/products/:id/edit', requireAdmin, upload.single('image'), (req, res) => {
    if (!isValidProductInput(req.body)) {
      const product = getProductById(req.params.id);
      return res.status(400).render('admin/edit-product', {
        product: { ...product, ...req.body },
        error: 'Please fill all required fields with valid values.'
      });
    }

    const existing = getProductById(req.params.id);
    if (!existing) {
      return res.status(404).send('Product not found.');
    }

    let image = existing.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
      removeUploadIfExists(existing.image);
    }

    updateProduct(req.params.id, { ...req.body, image });
    return res.redirect('/admin');
  });

  router.post('/products/:id/delete', requireAdmin, (req, res) => {
    const deleted = deleteProduct(req.params.id);
    if (deleted) {
      removeUploadIfExists(deleted.image);
    }
    res.redirect('/admin');
  });

  return router;
};
