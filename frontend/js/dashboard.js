requireAuth();
renderSidebar('dashboard');

const usuario = getUsuario();
document.getElementById('bienvenida').textContent = usuario.nombre;
if (usuario.rol !== 'Administrador') {
  document.getElementById('kpi-usuarios-card').classList.add('hidden');
}

async function cargarDashboard() {
  try {
    const data = await apiFetch('/dashboard/resumen');

    document.getElementById('kpi-vuelos').textContent = data.vuelosActivos;
    document.getElementById('kpi-reservas').textContent = data.reservas;
    document.getElementById('kpi-pagos').textContent = data.pagos;
    document.getElementById('kpi-usuarios').textContent = data.usuarios;

    // Gráfico de reservas por mes
    new Chart(document.getElementById('chart-mes'), {
      type: 'line',
      data: {
        labels: data.reservasPorMes.map((r) => r.mes),
        datasets: [{
          label: 'Reservas',
          data: data.reservasPorMes.map((r) => r.total),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.1)',
          tension: 0.35,
          fill: true,
        }],
      },
      options: { plugins: { legend: { display: false } } },
    });

    // Gráfico de reservas por clase
    new Chart(document.getElementById('chart-clase'), {
      type: 'doughnut',
      data: {
        labels: data.reservasPorClase.map((r) => r.clase),
        datasets: [{
          data: data.reservasPorClase.map((r) => r.total),
          backgroundColor: ['#2563eb', '#60a5fa', '#f59e0b', '#dc2626'],
        }],
      },
    });

    // Tabla de reservas recientes
    const tbody = document.getElementById('tbody-recientes');
    tbody.innerHTML = data.reservasRecientes.map((r) => `
      <tr>
        <td>${r.id}</td>
        <td>${r.usuario}</td>
        <td>${r.vuelo}</td>
        <td>${r.origen} - ${r.destino}</td>
        <td>${r.fecha}</td>
        <td>${formatoMoneda(r.total)}</td>
        <td>${badgeEstado(r.estado)}</td>
      </tr>`).join('') || '<tr><td colspan="7">Sin reservas todavía</td></tr>';
  } catch (err) {
    console.error(err);
  }
}

cargarDashboard();
