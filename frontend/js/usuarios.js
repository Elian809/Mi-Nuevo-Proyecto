requireAuth();
renderSidebar('usuarios');

const usuarioActual = getUsuario();
if (usuarioActual.rol !== 'Administrador') {
  window.location.href = 'dashboard.html';
}

let paginaActual = 1;
let idAEliminar = null;

async function cargarUsuarios() {
  const buscar = document.getElementById('buscar').value;
  const rol = document.getElementById('filtro-rol').value;
  const params = new URLSearchParams({ page: paginaActual, limit: 10 });
  if (buscar) params.append('buscar', buscar);
  if (rol) params.append('rol', rol);

  try {
    const { data, total, limit } = await apiFetch(`/usuarios?${params}`);
    const tbody = document.getElementById('tbody-usuarios');

    tbody.innerHTML = data.map((u) => `
      <tr>
        <td>${u.id}</td>
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td>${u.rol}</td>
        <td>${u.puntos}</td>
        <td>${badgeEstado(u.estado)}</td>
        <td>
          <button class="icon-btn" onclick="editarUsuario(${u.id})">✏️</button>
          <button class="icon-btn orange" onclick="toggleEstado(${u.id}, '${u.estado}')">${u.estado === 'Activo' ? '🔒' : '🔓'}</button>
          <button class="icon-btn red" onclick="pedirEliminar(${u.id})">🗑️</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="7">No se encontraron usuarios</td></tr>';

    pintarPaginacion(total, limit);
  } catch (err) {
    alert(err.message);
  }
}

function pintarPaginacion(total, limit) {
  const totalPaginas = Math.max(1, Math.ceil(total / limit));
  const cont = document.getElementById('paginacion');
  let html = `<button ${paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual - 1})">‹</button>`;
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<button class="${i === paginaActual ? 'active' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
  }
  html += `<button ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual + 1})">›</button>`;
  cont.innerHTML = html;
}
function cambiarPagina(p) { paginaActual = p; cargarUsuarios(); }

document.getElementById('buscar').addEventListener('input', () => { paginaActual = 1; cargarUsuarios(); });
document.getElementById('filtro-rol').addEventListener('change', () => { paginaActual = 1; cargarUsuarios(); });

// ---------- Modal Crear/Editar ----------
const modal = document.getElementById('modal-usuario');
document.getElementById('btn-nuevo').addEventListener('click', () => abrirModal());
document.getElementById('btn-cancelar').addEventListener('click', () => modal.classList.add('hidden'));

function abrirModal(usuario = null) {
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('form-usuario').reset();
  document.getElementById('modal-titulo').textContent = usuario ? 'Editar Usuario' : 'Nuevo Usuario';
  document.getElementById('u-id').value = usuario ? usuario.id : '';
  document.getElementById('wrap-password').style.display = usuario ? 'none' : 'block';
  document.getElementById('wrap-estado').style.display = usuario ? 'block' : 'none';
  if (usuario) {
    document.getElementById('u-nombre').value = usuario.nombre;
    document.getElementById('u-email').value = usuario.email;
    document.getElementById('u-rol').value = usuario.rol;
    document.getElementById('u-estado').value = usuario.estado;
  }
  modal.classList.remove('hidden');
}

async function editarUsuario(id) {
  const { data } = await apiFetch(`/usuarios?limit=1000`);
  const usuario = data.find((u) => u.id === id);
  if (usuario) abrirModal(usuario);
}

document.getElementById('form-usuario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('u-id').value;

  try {
    if (id) {
      await apiFetch(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: document.getElementById('u-nombre').value,
          email: document.getElementById('u-email').value,
          rol: document.getElementById('u-rol').value,
          estado: document.getElementById('u-estado').value,
        }),
      });
    } else {
      await apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: document.getElementById('u-nombre').value,
          email: document.getElementById('u-email').value,
          password: document.getElementById('u-password').value,
          rol: document.getElementById('u-rol').value,
        }),
      });
    }
    modal.classList.add('hidden');
    cargarUsuarios();
  } catch (err) {
    const box = document.getElementById('modal-error');
    box.textContent = err.message;
    box.classList.remove('hidden');
  }
});

async function toggleEstado(id, estadoActual) {
  const nuevo = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
  try {
    await apiFetch(`/usuarios/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado: nuevo }) });
    cargarUsuarios();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Eliminar ----------
const modalEliminar = document.getElementById('modal-eliminar');
function pedirEliminar(id) { idAEliminar = id; modalEliminar.classList.remove('hidden'); }
document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => modalEliminar.classList.add('hidden'));
document.getElementById('btn-confirmar-eliminar').addEventListener('click', async () => {
  try {
    await apiFetch(`/usuarios/${idAEliminar}`, { method: 'DELETE' });
    modalEliminar.classList.add('hidden');
    cargarUsuarios();
  } catch (err) {
    alert(err.message);
  }
});

cargarUsuarios();
