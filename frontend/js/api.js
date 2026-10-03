const API_URL = 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUsuario() {
  const data = localStorage.getItem('usuario');
  return data ? JSON.parse(data) : null;
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    if (endpoint !== '/auth/login') {
      // token vencido o inválido -> volver a login
      // (no forzar redirect en /auth/login para poder mostrar el error)
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }
  return data;
}

const MENU_ADMIN = [
  { page: 'dashboard', href: 'dashboard.html', icon: '🏠', label: 'Dashboard' },
  { page: 'vuelos', href: 'vuelos.html', icon: '🛫', label: 'Vuelos' },
  { page: 'reservas', href: 'mis-reservas.html', icon: '📋', label: 'Reservas' },
  { page: 'pagos', href: 'pagos.html', icon: '💳', label: 'Pagos' },
  { page: 'usuarios', href: 'usuarios.html', icon: '👥', label: 'Usuarios' },
];

const MENU_CLIENTE = [
  { page: 'dashboard', href: 'dashboard.html', icon: '🏠', label: 'Inicio' },
  { page: 'vuelos', href: 'vuelos.html', icon: '🛫', label: 'Buscar Vuelos' },
  { page: 'reservas', href: 'mis-reservas.html', icon: '📋', label: 'Mis Reservas' },
  { page: 'pagos', href: 'pagos.html', icon: '💳', label: 'Mis Pagos' },
];

function renderSidebar(activo) {
  const contenedor = document.getElementById('sidebar-container');
  if (!contenedor) return;
  const usuario = getUsuario();
  if (!usuario) return;
  const menu = usuario.rol === 'Administrador' ? MENU_ADMIN : MENU_CLIENTE;

  contenedor.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <span style="font-size:22px;">✈️</span>
        <h1 style="font-size:15px;">AIRLINE<br>RESERVATION</h1>
      </div>
      <div class="user-box">
        <div class="avatar" id="sb-avatar"></div>
        <div>
          <div id="sb-nombre" style="color:#fff;font-size:14px;font-weight:600;"></div>
          <small id="sb-rol"></small>
        </div>
      </div>
      <nav>
        ${menu.map((m) => `<a href="${m.href}" data-page="${m.page}"><span>${m.icon}</span> ${m.label}</a>`).join('')}
      </nav>
      <div class="logout">
        <a href="#" id="btn-logout"><span>🚪</span> Cerrar Sesión</a>
      </div>
    </aside>`;

  document.getElementById('btn-logout').addEventListener('click', (e) => { e.preventDefault(); logout(); });
  pintarSidebar(activo);
}

function pintarSidebar(activo) {
  document.querySelectorAll('.sidebar nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.page === activo);
  });
  const usuario = getUsuario();
  const nombreEl = document.getElementById('sb-nombre');
  const rolEl = document.getElementById('sb-rol');
  const avatarEl = document.getElementById('sb-avatar');
  if (usuario) {
    if (nombreEl) nombreEl.textContent = usuario.nombre;
    if (rolEl) rolEl.textContent = usuario.rol;
    if (avatarEl) avatarEl.textContent = usuario.nombre.substring(0, 1).toUpperCase();
  }
}

function formatoMoneda(valor) {
  return `$${Number(valor).toFixed(2)}`;
}

function badgeEstado(estado) {
  const map = {
    Confirmada: 'badge-green', Disponible: 'badge-green', Activo: 'badge-green', Completado: 'badge-green',
    Pendiente: 'badge-orange',
    Cancelada: 'badge-red', Cancelado: 'badge-red', Inactivo: 'badge-red', Completo: 'badge-gray',
  };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${estado}</span>`;
}
