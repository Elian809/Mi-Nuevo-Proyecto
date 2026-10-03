const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

// GET /api/dashboard/resumen
router.get('/resumen', verificarToken, async (req, res) => {
  try {
    const [[{ vuelosActivos }]] = await pool.query(
      "SELECT COUNT(*) AS vuelosActivos FROM vuelos WHERE estado = 'Disponible'"
    );
    const [[{ reservas }]] = await pool.query('SELECT COUNT(*) AS reservas FROM reservas');
    const [[{ pagos }]] = await pool.query('SELECT COUNT(*) AS pagos FROM pagos');
    const [[{ usuarios }]] = await pool.query("SELECT COUNT(*) AS usuarios FROM usuarios WHERE rol = 'Cliente'");

    const [reservasPorMes] = await pool.query(
      `SELECT DATE_FORMAT(creado_en, '%Y-%m') AS mes, COUNT(*) AS total
       FROM reservas GROUP BY mes ORDER BY mes`
    );

    const [reservasPorClase] = await pool.query(
      `SELECT clase, COUNT(*) AS total FROM reservas GROUP BY clase`
    );

    const [reservasRecientes] = await pool.query(
      `SELECT r.id, u.nombre AS usuario, v.numero AS vuelo, v.origen, v.destino,
              r.creado_en AS fecha, r.total, r.estado
       FROM reservas r
       JOIN usuarios u ON u.id = r.usuario_id
       JOIN vuelos v ON v.id = r.vuelo_id
       ORDER BY r.creado_en DESC LIMIT 5`
    );

    res.json({ vuelosActivos, reservas, pagos, usuarios, reservasPorMes, reservasPorClase, reservasRecientes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
