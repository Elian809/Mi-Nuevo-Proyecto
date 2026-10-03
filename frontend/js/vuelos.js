requireAuth();
renderSidebar('vuelos');
const usuario = getUsuario();
const esAdmin = usuario.rol === 'Administrador';
if (!esAdmin) document.getElementById('btn-nuevo').classList.add('hidden');

let paginaActual = 1;
let idAEliminar = null;

async function cargarVuelos() {
  const buscar = document.getElementById('buscar').value;
  const estado = document.getElementById('filtro-estado').value;
  const params = new URLSearchParams({ page: paginaActual, limit: 10 });
  if (buscar) params.append('buscar', buscar);
  if (estado) params.append('estado', estado);

  try {
    const { data, total, limit } = await apiFetch(`/vuelos?${params}`);
    const tbody = document.getElementById('tbody-vuelos');

    tbody.innerHTML = data.map((v, i) => `
      <tr>
        <td>${(paginaActual - 1) * limit + i + 1}</td>
        <td>${v.numero}</td>
        <td>${v.origen_ciudad} (${v.origen})</td>
        <td>${v.destino_ciudad} (${v.destino})</td>
        <td>${v.fecha}</td>
        <td>${v.hora}</td>
        <td>${formatoMoneda(v.precio)}</td>
        <td>${badgeEstado(v.estado)}</td>
        <td>
          ${esAdmin ? `
            <button class="icon-btn" onclick="editarVuelo(${v.id})">✏️</button>
            <button class="icon-btn red" onclick="pedirEliminar(${v.id})">🗑️</button>
          ` : `<button class="btn btn-outline" style="padding:6px 12px;" onclick="reservarVuelo(${v.id})">Reservar</button>`}
        </td>
      </tr>`).join('') || '<tr><td colspan="9">No se encontraron vuelos</td></tr>';

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

function cambiarPagina(p) { paginaActual = p; cargarVuelos(); }
function reservarVuelo(id) { window.location.href = `nueva-reserva.html?vuelo=${id}`; }

document.getElementById('buscar').addEventListener('input', () => { paginaActual = 1; cargarVuelos(); });
document.getElementById('filtro-estado').addEventListener('change', () => { paginaActual = 1; cargarVuelos(); });

// ---------- Modal Crear/Editar ----------
const modal = document.getElementById('modal-vuelo');
document.getElementById('btn-nuevo').addEventListener('click', () => abrirModal());
document.getElementById('btn-cancelar').addEventListener('click', () => modal.classList.add('hidden'));

function abrirModal(vuelo = null) {
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('form-vuelo').reset();
  document.getElementById('campo-estado-wrap').style.display = vuelo ? 'block' : 'none';
  document.getElementById('modal-titulo').textContent = vuelo ? 'Editar Vuelo' : 'Nuevo Vuelo';
  document.getElementById('vuelo-id').value = vuelo ? vuelo.id : '';
  if (vuelo) {
    document.getElementById('v-numero').value = vuelo.numero;
    document.getElementById('v-precio').value = vuelo.precio;
    document.getElementById('v-origen').value = vuelo.origen;
    document.getElementById('v-origen-ciudad').value = vuelo.origen_ciudad;
    document.getElementById('v-destino').value = vuelo.destino;
    document.getElementById('v-destino-ciudad').value = vuelo.destino_ciudad;
    document.getElementById('v-fecha').value = vuelo.fecha;
    document.getElementById('v-hora').value = vuelo.hora;
    document.getElementById('v-estado').value = vuelo.estado;
  }
  modal.classList.remove('hidden');
}

async function editarVuelo(id) {
  try {
    const vuelo = await apiFetch(`/vuelos/${id}`);
    abrirModal(vuelo);
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('form-vuelo').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('vuelo-id').value;
  const payload = {
    numero: document.getElementById('v-numero').value,
    origen: document.getElementById('v-origen').value.toUpperCase(),
    origen_ciudad: document.getElementById('v-origen-ciudad').value,
    destino: document.getElementById('v-destino').value.toUpperCase(),
    destino_ciudad: document.getElementById('v-destino-ciudad').value,
    fecha: document.getElementById('v-fecha').value,
    hora: document.getElementById('v-hora').value,
    precio: document.getElementById('v-precio').value,
    estado: document.getElementById('v-estado').value || 'Disponible',
  };

  try {
    if (id) {
      await apiFetch(`/vuelos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/vuelos', { method: 'POST', body: JSON.stringify(payload) });
    }
    modal.classList.add('hidden');
    cargarVuelos();
  } catch (err) {
    const box = document.getElementById('modal-error');
    box.textContent = err.message;
    box.classList.remove('hidden');
  }
});

// ---------- Eliminar ----------
const modalEliminar = document.getElementById('modal-eliminar');
function pedirEliminar(id) { idAEliminar = id; modalEliminar.classList.remove('hidden'); }
document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => modalEliminar.classList.add('hidden'));
document.getElementById('btn-confirmar-eliminar').addEventListener('click', async () => {
  try {
    await apiFetch(`/vuelos/${idAEliminar}`, { method: 'DELETE' });
    modalEliminar.classList.add('hidden');
    cargarVuelos();
  } catch (err) {
    alert(err.message);
  }
});

cargarVuelos();
