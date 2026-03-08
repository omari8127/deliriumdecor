function shortText(text, max = 92) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function renderFooter() {
  const footer = document.getElementById('siteFooter');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-grid">
      <section class="footer-block">
        <h3>Delirium Decor</h3>
        <p>Delirium Decor vende piezas decorativas para el hogar, tazas con estilos modernos.</p>
      </section>

      <section class="footer-block">
        <h3>Enlaces Rapidos</h3>
        <nav class="footer-list">
          <a href="/index.html">Inicio</a>
          <a href="/catalog.html">Catalogo</a>
          <a href="/about.html">Acerca de</a>
          <a href="/contact.html">Contacto</a>
        </nav>
      </section>

      <section class="footer-block">
        <h3>Servicio al cliente</h3>
        <ul class="footer-static-list">
          <li>Pedidos personalizados</li>
          <li>Seguimiento de ordenes</li>
          <li>Ayuda y soporte</li>
          <li>Politica de cambios</li>
        </ul>
      </section>

      <section class="footer-block">
        <h3>Informacion del contacto</h3>
        <p>Email: orders@deliriumdecor.com</p>
        <p>Instagram: @deliriumdecor</p>
        <p>Tijuana, Baja California</p>
        <div class="social-links" aria-label="Redes sociales">
          <a href="https://www.facebook.com/profile.php?id=100067987325521" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6h1.5V3.8c-.3 0-1.2-.1-2.3-.1-2.2 0-3.8 1.3-3.8 3.8V10H8v3h2.9v8h2.6z"/></svg>
          </a>
          <a href="https://www.instagram.com/deliriumdecor" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm9.8 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
          </a>
          <a href="https://www.tiktok.com/@deliriumdecor" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 3h2.1c.2 1.8 1.2 3.1 2.9 3.6v2.1a5.6 5.6 0 0 1-2.9-1v7.1a5.3 5.3 0 1 1-5.3-5.3h.3v2.1h-.3a3.2 3.2 0 1 0 3.2 3.2V3z"/></svg>
          </a>
        </div>
      </section>
    </div>
  `;
}

async function fetchProducts(query = '', category = 'all') {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);

  const res = await fetch(`/api/products?${params.toString()}`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('No se pudieron cargar los productos');
  return res.json();
}

function productCard(product, index) {
  return `
    <article class="card" style="animation-delay:${Math.min(index * 70, 420)}ms">
      <img src="${product.image}" alt="${product.name}" />
      <div class="card-body">
        <h3>${product.name}</h3>
        <p class="price">$${Number(product.price).toFixed(2)}</p>
        <p class="small">${shortText(product.description)}</p>
        <a class="btn" href="/product.html?id=${encodeURIComponent(product.id)}">Ver producto</a>
      </div>
    </article>
  `;
}

function setLoading(isLoading) {
  const loadingState = document.getElementById('loadingState');
  if (!loadingState) return;
  loadingState.classList.toggle('hidden', !isLoading);
}

async function initCatalogPage() {
  const grid = document.getElementById('productGrid');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');

  async function render() {
    setLoading(true);
    try {
      const products = await fetchProducts(searchInput.value.trim(), categorySelect.value);
      grid.innerHTML = products.length
        ? products.map((product, index) => productCard(product, index)).join('')
        : '<div class="panel"><p>No se encontraron productos.</p></div>';
    } catch {
      grid.innerHTML = '<div class="panel"><p>No se pudieron cargar los productos en este momento.</p></div>';
    } finally {
      setLoading(false);
    }
  }

  searchInput.addEventListener('input', render);
  categorySelect.addEventListener('change', render);

  await render();
}

async function initProductPage() {
  const container = document.getElementById('productDetail');
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    container.innerHTML = '<div class="panel"><p>Falta el ID del producto.</p></div>';
    return;
  }

  const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
    credentials: 'include'
  });

  if (!res.ok) {
    container.innerHTML = '<div class="panel"><p>Producto no encontrado.</p></div>';
    return;
  }

  const product = await res.json();
  container.innerHTML = `
    <div class="detail-layout">
      <img class="detail-image" src="${product.image}" alt="${product.name}" />
      <div>
        <h1>${product.name}</h1>
        <p class="price">$${Number(product.price).toFixed(2)}</p>
        <p class="small">Categoria: ${product.category || 'Sin categoria'}</p>
        <p>${product.description}</p>
        <a class="btn" href="mailto:orders@deliriumdecor.com?subject=Solicitud%20de%20pedido%20-%20${encodeURIComponent(product.name)}">Contactar / Ordenar</a>
      </div>
    </div>
  `;
}

async function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessage.textContent = '';

    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      loginMessage.textContent = 'Usuario o contrasena incorrectos.';
      loginMessage.classList.add('text-error');
      return;
    }

    window.location.href = '/admin';
  });
}

function adminRow(product) {
  return `
    <tr>
      <td><img class="admin-thumb" src="${product.image}" alt="${product.name}" /></td>
      <td>${product.name}</td>
      <td>$${Number(product.price).toFixed(2)}</td>
      <td>${product.category || '-'}</td>
      <td>
        <button class="btn btn-outline js-edit" type="button" data-id="${product.id}">Editar</button>
      </td>
      <td>
        <button class="btn js-delete" type="button" data-id="${product.id}">Eliminar</button>
      </td>
    </tr>
  `;
}

async function initAdminPage() {
  const tableBody = document.getElementById('adminTableBody');
  const form = document.getElementById('adminProductForm');
  const message = document.getElementById('adminMessage');
  const formTitle = document.getElementById('formTitle');
  const saveBtn = document.getElementById('saveBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editProductId = document.getElementById('editProductId');
  const logoutBtn = document.getElementById('logoutBtn');

  let products = [];

  function resetForm() {
    form.reset();
    editProductId.value = '';
    formTitle.textContent = 'Agregar producto';
    saveBtn.textContent = 'Agregar producto';
    cancelEditBtn.classList.add('hidden');
  }

  async function loadProducts() {
    const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
    const sessionData = await sessionRes.json();
    if (!sessionData.admin) {
      window.location.href = '/login';
      return;
    }

    products = await fetchProducts('', 'all');
    tableBody.innerHTML = products.length
      ? products.map(adminRow).join('')
      : '<tr><td colspan="6">No hay productos disponibles.</td></tr>';
  }

  function fillEdit(productId) {
    const item = products.find((product) => product.id === productId);
    if (!item) return;

    editProductId.value = item.id;
    form.elements.name.value = item.name;
    form.elements.price.value = item.price;
    form.elements.description.value = item.description;
    form.elements.category.value = item.category || 'mugs';

    formTitle.textContent = 'Editar producto';
    saveBtn.textContent = 'Guardar cambios';
    cancelEditBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tableBody.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.js-edit');
    const deleteBtn = event.target.closest('.js-delete');

    if (editBtn) {
      fillEdit(editBtn.dataset.id);
      return;
    }

    if (deleteBtn) {
      const ok = window.confirm('Eliminar este producto?');
      if (!ok) return;

      const res = await fetch(`/api/products/${encodeURIComponent(deleteBtn.dataset.id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.status === 403) {
        message.textContent = 'No autorizado. Inicia sesion nuevamente.';
        message.classList.add('text-error');
        return;
      }

      await loadProducts();
      message.textContent = 'Producto eliminado.';
      message.classList.remove('text-error');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    const id = editProductId.value;
    const formData = new FormData(form);

    const url = id ? `/api/products/${encodeURIComponent(id)}` : '/api/products';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      credentials: 'include',
      body: formData
    });

    if (res.status === 403) {
      message.textContent = 'No autorizado. Inicia sesion nuevamente.';
      message.classList.add('text-error');
      return;
    }

    if (!res.ok) {
      const error = await res.json();
      message.textContent = error.error || 'La operacion fallo.';
      message.classList.add('text-error');
      return;
    }

    await loadProducts();
    message.textContent = id ? 'Producto actualizado.' : 'Producto agregado.';
    message.classList.remove('text-error');
    resetForm();
  });

  cancelEditBtn.addEventListener('click', () => {
    resetForm();
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/login';
  });

  await loadProducts();
}

document.addEventListener('DOMContentLoaded', () => {
  renderFooter();
  const page = document.body.dataset.page;

  if (page === 'catalog') {
    initCatalogPage();
  }

  if (page === 'product') {
    initProductPage();
  }

  if (page === 'login') {
    initLoginPage();
  }

  if (page === 'admin') {
    initAdminPage();
  }
});

