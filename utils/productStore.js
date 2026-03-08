const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'products.json');

function ensureDataFile() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]', 'utf8');
  }
}

function readProducts() {
  ensureDataFile();
  let raw = fs.readFileSync(dataFile, 'utf8');

  // Handle files with UTF-8 BOM (common on Windows editors).
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }

  return JSON.parse(raw);
}

function writeProducts(products) {
  fs.writeFileSync(dataFile, JSON.stringify(products, null, 2), 'utf8');
}

function getAllProducts() {
  return readProducts();
}

function getProductById(id) {
  return readProducts().find((item) => item.id === id);
}

function addProduct(productInput) {
  const products = readProducts();
  const product = {
    id: Date.now().toString(),
    name: productInput.name,
    price: Number(productInput.price),
    shortDescription: productInput.shortDescription,
    description: productInput.description,
    category: productInput.category || '',
    image: productInput.image || '/uploads/default-product.svg',
    createdAt: new Date().toISOString()
  };

  products.push(product);
  writeProducts(products);
  return product;
}

function updateProduct(id, updates) {
  const products = readProducts();
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const existing = products[index];
  const updated = {
    ...existing,
    name: updates.name,
    price: Number(updates.price),
    shortDescription: updates.shortDescription,
    description: updates.description,
    category: updates.category || '',
    image: updates.image || existing.image
  };

  products[index] = updated;
  writeProducts(products);
  return updated;
}

function deleteProduct(id) {
  const products = readProducts();
  const toDelete = products.find((item) => item.id === id);

  if (!toDelete) {
    return null;
  }

  const filtered = products.filter((item) => item.id !== id);
  writeProducts(filtered);
  return toDelete;
}

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
};
