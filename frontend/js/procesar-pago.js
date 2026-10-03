requireAuth();
renderSidebar('reservas');

const params = new URLSearchParams(window.location.search);
const reservaId = params.get('reserva');
let reserva = null;

if (!reservaId) window.location.href = 'mis-reservas.html';

async function cargarReserva() {
  try {
    reserva = await apiFetch(`/reservas/${reservaId}`);
    document.getElementById('r-id').textContent = reserva.id;
    document.getElementById('r-vuelo').textContent = reserva.vuelo_numero;
    document.getElementById('r-ruta').textContent = `${reserva.origen} → ${reserva.destino}`;
    document.getElementById('r-fecha').textContent = `${reserva.vuelo_fecha}  ${reserva.vuelo_hora}`;
    document.getElementById('r-clase').textContent = reserva.clase;
    document.getElementById('r-asientos').textContent = reserva.asientos;
    document.getElementById('r-total').textContent = formatoMoneda(reserva.total);

    if (reserva.estado === 'Confirmada') {
      document.getElementById('form-pago').innerHTML = '<p class="success-msg">Esta reserva ya fue pagada.</p>';
    }
  } catch (err) {
    alert(err.message);
    window.location.href = 'mis-reservas.html';
  }
}

document.getElementById('p-metodo').addEventListener('change', (e) => {
  const esTarjeta = e.target.value.includes('Tarjeta');
  document.getElementById('wrap-tarjeta').style.display = esTarjeta ? 'block' : 'none';
  document.getElementById('wrap-fecha-cvv').style.display = esTarjeta ? 'flex' : 'none';
  document.getElementById('wrap-titular').style.display = esTarjeta ? 'block' : 'none';
});

document.getElementById('form-pago').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('pago-error');
  errorBox.classList.add('hidden');

  const metodo = document.getElementById('p-metodo').value;
  if (metodo.includes('Tarjeta')) {
    const numero = document.getElementById('p-numero').value.replace(/\s/g, '');
    if (numero.length < 15) {
      errorBox.textContent = 'Número de tarjeta inválido';
      errorBox.classList.remove('hidden');
      return;
    }
  }

  try {
    await apiFetch('/pagos', {
      method: 'POST',
      body: JSON.stringify({ reserva_id: reserva.id, metodo, monto: reserva.total }),
    });
    window.location.href = 'mis-reservas.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  }
});

cargarReserva();
