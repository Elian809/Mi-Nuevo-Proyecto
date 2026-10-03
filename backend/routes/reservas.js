const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/reservas  (admin ve todas, cliente ve solo las suyas)
router.get('/', verificarToken, async (req, res) => {
  try {
    const { buscar, estado } = req.query;
    const condiciones = [];
    const valores = [];

    if (req.usuario.rol !== 'Administrador') {
      condiciones.push('r.usuario_id = ?');
      valores.push(req.usuario.id);
    }
    if (estado && estado !== 'Todos') { condiciones.push('r.estado = ?'); valores.push(estado); }
    if (buscar) {
      condiciones.push('(v.numero LIKE ? OR r.id LIKE ?)');
      valores.push(`%${buscar}%`, `%${buscar}%`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT r.*, u.nombre AS usuario_nombre, v.numero AS vuelo_numero,
              v.origen, v.destino, v.fecha AS vuelo_fecha
       FROM reservas r
       JOIN usuarios u ON u.id = r.usuario_id
       JOIN vuelos v ON v.id = r.vuelo_id
       ${where}
       ORDER BY r.creado_en DESC`,
      valores
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/reservas/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, v.numero AS vuelo_numero, v.origen, v.destino, v.fecha AS vuelo_fecha, v.hora AS vuelo_hora
       FROM reservas r JOIN vuelos v ON v.id = r.vuelo_id WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (req.usuario.rol !== 'Administrador' && rows[0].usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/reservas  (crear reserva + marcar asientos ocupados)
router.post('/', verificarToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { vuelo_id, clase, asientos, total } = req.body;
    if (!vuelo_id || !asientos || !asientos.length) {
      return res.status(400).json({ error: 'Datos de reserva incompletos' });
    }

    await conn.beginTransaction();

    // Verificar que los asientos sigan disponibles
    const [asientosDb] = await conn.query(
      `SELECT codigo, estado FROM asientos WHERE vuelo_id = ? AND codigo IN (?)`,
      [vuelo_id, asientos]
    );
    const noDisponibles = asientosDb.filter((a) => a.estado !== 'Disponible');
    if (noDisponibles.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Uno o más asientos ya no están disponibles' });
    }

    const [result] = await conn.query(
      `INSERT INTO reservas (usuario_id, vuelo_id, clase, asientos, total, estado) VALUES (?, ?, ?, ?, ?, 'Pendiente')`,
      [req.usuario.id, vuelo_id, clase, asientos.join(','), total]
    );

    await conn.query(
      `UPDATE asientos SET estado = 'Ocupado' WHERE vuelo_id = ? AND codigo IN (?)`,
      [vuelo_id, asientos]
    );

    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    conn.release();
  }
});

// PUT /api/reservas/:id/estado
router.put('/:id/estado', verificarToken, async (req, res) => {
  try {
    const { estado } = req.body;
    await pool.query('UPDATE reservas SET estado = ? WHERE id = ?', [estado, req.params.id]);

    if (estado === 'Cancelada') {
      const [[reserva]] = await pool.query('SELECT vuelo_id, asientos FROM reservas WHERE id = ?', [req.params.id]);
      if (reserva) {
        const codigos = reserva.asientos.split(',');
        await pool.query(
          `UPDATE asientos SET estado = 'Disponible' WHERE vuelo_id = ? AND codigo IN (?)`,
          [reserva.vuelo_id, codigos]
        );
      }
    }
    res.json({ mensaje: 'Estado actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/reservas/:id  (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Reserva eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
