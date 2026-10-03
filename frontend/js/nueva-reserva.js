requireAuth();
renderSidebar('vuelos');

const params = new URLSearchParams(window.location.search);
let vueloSeleccionado = null;
let asientosSeleccionados = [];
let precioAsiento = 0;

async function cargarVuelos() {
  const { data } = await apiFetch('/vuelos?estado=Disponible&limit=100');
  const sel = document.getElementById('sel-vuelo');
  sel.innerHTML = data.map((v) => `<option value="${v.id}">${v.numero} - ${v.origen_ciudad} (${v.origen}) → ${v.destino_ciudad} (${v.destino})</option>`).join('');

  const vueloParam = params.get('vuelo');
  if (vueloParam) sel.value = vueloParam;

  sel.addEventListener('change', () => cargarVuelo(sel.value));
  await cargarVuelo(sel.value);
}

async function cargarVuelo(id) {
  vueloSeleccionado = await apiFetch(`/vuelos/${id}`);
  precioAsiento = Number(vueloSeleccionado.precio);
  document.getElementById('info-fecha').value = vueloSeleccionado.fecha;
  document.getElementById('info-hora').value = vueloSeleccionado.hora;
  document.getElementById('resumen-precio').textContent = formatoMoneda(precioAsiento);
  asientosSeleccionados = [];
  await cargarAsientos(id);
  actualizarResumen();
}

async function cargarAsientos(vueloId) {
  const asientos = await apiFetch(`/vuelos/${vueloId}/asientos`);
  const filas = {};
  asientos.forEach((a) => {
    const fila = a.codigo.match(/\d+/)[0];
    filas[fila] = filas[fila] || {};
    filas[fila][a.codigo.replace(fila, '')] = a;
  });

  const cont = document.getElementById('mapa-asientos');
  cont.innerHTML = Object.keys(filas).sort((a, b) => a - b).map((fila) => {
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    return `<div class="seat-cols" style="margin-bottom:6px;">
      ${cols.map((c, idx) => {
        const asiento = filas[fila][c];
        if (!asiento) return `<div class="seat" style="visibility:hidden;"></div>${idx === 2 ? '<div class="aisle"></div>' : ''}`;
        let clase = 'seat';
        if (asiento.estado === 'Ocupado') clase += ' occupied';
        else if (asiento.estado === 'No disponible') clase += ' unavailable';
        const codigo = asiento.codigo;
        return `<div class="${clase}" data-codigo="${codigo}" onclick="toggleAsiento('${codigo}', this)">${fila}</div>${idx === 2 ? '<div class="aisle"></div>' : ''}`;
      }).join('')}
    </div>`;
  }).join('');
}

function toggleAsiento(codigo, el) {
  if (el.classList.contains('occupied') || el.classList.contains('unavailable')) return;

  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    asientosSeleccionados = asientosSeleccionados.filter((c) => c !== codigo);
  } else {
    el.classList.add('selected');
    asientosSeleccionados.push(codigo);
  }
  actualizarResumen();
}

function actualizarResumen() {
  document.getElementById('resumen-clase').textContent = document.getElementById('sel-clase').value;
  document.getElementById('resumen-asientos').textContent = asientosSeleccionados.join(', ') || '-';
  const total = asientosSeleccionados.length * precioAsiento;
  document.getElementById('resumen-total').textContent = formatoMoneda(total);
}

document.getElementById('sel-clase').addEventListener('change', actualizarResumen);

document.getElementById('btn-continuar').addEventListener('click', async () => {
  if (asientosSeleccionados.length === 0) {
    alert('Selecciona al menos un asiento');
    return;
  }
  try {
    const total = asientosSeleccionados.length * precioAsiento;
    const { id } = await apiFetch('/reservas', {
      method: 'POST',
      body: JSON.stringify({
        vuelo_id: vueloSeleccionado.id,
        clase: document.getElementById('sel-clase').value,
        asientos: asientosSeleccionados,
        total,
      }),
    });
    window.location.href = `procesar-pago.html?reserva=${id}`;
  } catch (err) {
    alert(err.message);
  }
});

cargarVuelos();
