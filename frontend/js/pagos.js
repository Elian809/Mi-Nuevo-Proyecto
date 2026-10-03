requireAuth();
renderSidebar('pagos');

async function cargarPagos() {
  const buscar = document.getElementById('buscar').value;
  const estado = document.getElementById('filtro-estado').value;
  const params = new URLSearchParams();
  if (buscar) params.append('buscar', buscar);
  if (estado) params.append('estado', estado);

  try {
    const { data, totalMonto } = await apiFetch(`/pagos?${params}`);
    const tbody = document.getElementById('tbody-pagos');

    tbody.innerHTML = data.map((p) => `
      <tr>
        <td>${p.id}</td>
        <td>${p.reserva_id}</td>
        <td>${p.metodo}</td>
        <td>${formatoMoneda(p.monto)}</td>
        <td>${new Date(p.creado_en).toLocaleString('es-DO')}</td>
        <td>${badgeEstado(p.estado)}</td>
        <td>${p.transaccion || '...'}</td>
      </tr>`).join('') || '<tr><td colspan="7">No hay pagos registrados</td></tr>';

    document.getElementById('total-pagos').textContent = `Total de pagos: ${data.length}`;
    document.getElementById('total-monto').textContent = formatoMoneda(totalMonto);
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('buscar').addEventListener('input', cargarPagos);
document.getElementById('filtro-estado').addEventListener('change', cargarPagos);

cargarPagos();
