const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const session = require('express-session');

const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'delirium123';

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  }
});

function authMiddleware(req, res, next) {
  if (!req.session || !req.session.admin) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

function adminPageMiddleware(req, res, next) {
  if (!req.session || !req.session.admin) {
    res.status(403).send('Unauthorized');
    return;
  }
  next();
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'delirium-decor-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  req.session.admin = true;
  req.session.username = username;
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/auth/session', (req, res) => {
  res.json({ admin: Boolean(req.session && req.session.admin) });
});

app.use('/api/products', productsRouter(upload, authMiddleware));

app.get('/catalog', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});

app.get('/product', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', adminPageMiddleware, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Unexpected error' });
});

app.listen(PORT, () => {
  console.log(`Delirium Decor running at http://localhost:${PORT}`);
});
