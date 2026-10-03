requireAuth();
renderSidebar('reservas');
const usuario = getUsuario();
if (usuario.rol === 'Administrador') document.getElementById('titulo-pagina').textContent = 'Gestión de Reservas';

async function cargarReservas() {
  const buscar = document.getElementById('buscar').value;
  const estado = document.getElementById('filtro-estado').value;
  const params = new URLSearchParams();
  if (buscar) params.append('buscar', buscar);
  if (estado) params.append('estado', estado);

  try {
    const reservas = await apiFetch(`/reservas?${params}`);
    const tbody = document.getElementById('tbody-reservas');

    tbody.innerHTML = reservas.map((r) => `
      <tr>
        <td>${r.id}</td>
        <td>${r.vuelo_numero}</td>
        <td>${r.origen} - ${r.destino}</td>
        <td>${r.vuelo_fecha}</td>
        <td>${r.asientos}</td>
        <td>${formatoMoneda(r.total)}</td>
        <td>${badgeEstado(r.estado)}</td>
        <td>
          ${r.estado === 'Pendiente' ? `<button class="icon-btn" onclick="window.location.href='procesar-pago.html?reserva=${r.id}'">💳</button>` : ''}
          ${r.estado !== 'Cancelada' ? `<button class="icon-btn red" onclick="cancelarReserva(${r.id})">✖</button>` : ''}
        </td>
      </tr>`).join('') || '<tr><td colspan="8">No tienes reservas todavía</td></tr>';

    pintarResumen(reservas);
  } catch (err) {
    alert(err.message);
  }
}

function pintarResumen(reservas) {
  const total = reservas.length;
  const confirmadas = reservas.filter((r) => r.estado === 'Confirmada').length;
  const pendientes = reservas.filter((r) => r.estado === 'Pendiente').length;
  const gastado = reservas.filter((r) => r.estado === 'Confirmada').reduce((s, r) => s + Number(r.total), 0);

  document.getElementById('stat-strip').innerHTML = `
    <div class="card"><div class="kpi-label">Total Reservas</div><div class="kpi-value">${total}</div></div>
    <div class="card"><div class="kpi-label">Reservas Confirmadas</div><div class="kpi-value">${confirmadas}</div></div>
    <div class="card"><div class="kpi-label">Reservas Pendientes</div><div class="kpi-value">${pendientes}</div></div>
    <div class="card"><div class="kpi-label">Total Gastado</div><div class="kpi-value">${formatoMoneda(gastado)}</div></div>
  `;
}

async function cancelarReserva(id) {
  if (!confirm('¿Cancelar esta reserva?')) return;
  try {
    await apiFetch(`/reservas/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado: 'Cancelada' }) });
    cargarReservas();
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('buscar').addEventListener('input', cargarReservas);
document.getElementById('filtro-estado').addEventListener('change', cargarReservas);

cargarReservas();
