const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

// GET /api/pagos
router.get('/', verificarToken, async (req, res) => {
  try {
    const { buscar, estado } = req.query;
    const condiciones = [];
    const valores = [];

    if (req.usuario.rol !== 'Administrador') {
      condiciones.push('r.usuario_id = ?');
      valores.push(req.usuario.id);
    }
    if (estado && estado !== 'Todos') { condiciones.push('p.estado = ?'); valores.push(estado); }
    if (buscar) {
      condiciones.push('(p.reserva_id LIKE ? OR p.metodo LIKE ?)');
      valores.push(`%${buscar}%`, `%${buscar}%`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.*, r.usuario_id FROM pagos p
       JOIN reservas r ON r.id = p.reserva_id
       ${where}
       ORDER BY p.creado_en DESC`,
      valores
    );

    const [[{ totalMonto }]] = await pool.query(
      `SELECT COALESCE(SUM(p.monto),0) AS totalMonto FROM pagos p JOIN reservas r ON r.id = p.reserva_id ${where}`,
      valores
    );

    res.json({ data: rows, totalMonto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/pagos  (procesar pago de una reserva)
router.post('/', verificarToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { reserva_id, metodo, monto } = req.body;
    await conn.beginTransaction();

    const transaccion = 'TXN' + Math.floor(100000000 + Math.random() * 899999999);

    const [result] = await conn.query(
      `INSERT INTO pagos (reserva_id, metodo, monto, transaccion, estado) VALUES (?, ?, ?, ?, 'Completado')`,
      [reserva_id, metodo, monto, transaccion]
    );

    await conn.query(`UPDATE reservas SET estado = 'Confirmada' WHERE id = ?`, [reserva_id]);

    await conn.commit();
    res.status(201).json({ id: result.insertId, transaccion });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    conn.release();
  }
});

module.exports = router;
