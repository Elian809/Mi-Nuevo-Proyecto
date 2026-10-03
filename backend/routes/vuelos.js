const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/vuelos  (con filtros opcionales origen, destino, estado, buscar)
router.get('/', verificarToken, async (req, res) => {
  try {
    const { origen, destino, estado, buscar, page = 1, limit = 10 } = req.query;
    const condiciones = [];
    const valores = [];

    if (origen) { condiciones.push('origen = ?'); valores.push(origen); }
    if (destino) { condiciones.push('destino = ?'); valores.push(destino); }
    if (estado) { condiciones.push('estado = ?'); valores.push(estado); }
    if (buscar) {
      condiciones.push('(numero LIKE ? OR origen_ciudad LIKE ? OR destino_ciudad LIKE ?)');
      valores.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM vuelos ${where} ORDER BY fecha, hora LIMIT ? OFFSET ?`,
      [...valores, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM vuelos ${where}`, valores);

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/vuelos/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vuelos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vuelo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/vuelos/:id/asientos
router.get('/:id/asientos', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asientos WHERE vuelo_id = ? ORDER BY codigo', [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/vuelos  (solo admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { numero, origen, origen_ciudad, destino, destino_ciudad, fecha, hora, precio, filas = 8 } = req.body;
    const [result] = await pool.query(
      `INSERT INTO vuelos (numero, origen, origen_ciudad, destino, destino_ciudad, fecha, hora, precio, filas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, origen, origen_ciudad, destino, destino_ciudad, fecha, hora, precio, filas]
    );

    // Generar asientos automáticamente
    const columnas = ['A', 'B', 'C', 'D', 'E', 'F'];
    const asientos = [];
    for (let f = 1; f <= filas; f++) {
      for (const c of columnas) asientos.push([result.insertId, `${f}${c}`, 'Disponible']);
    }
    await pool.query('INSERT INTO asientos (vuelo_id, codigo, estado) VALUES ?', [asientos]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese número de vuelo ya existe' });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/vuelos/:id  (solo admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { numero, origen, origen_ciudad, destino, destino_ciudad, fecha, hora, precio, estado } = req.body;
    await pool.query(
      `UPDATE vuelos SET numero=?, origen=?, origen_ciudad=?, destino=?, destino_ciudad=?, fecha=?, hora=?, precio=?, estado=?
       WHERE id=?`,
      [numero, origen, origen_ciudad, destino, destino_ciudad, fecha, hora, precio, estado, req.params.id]
    );
    res.json({ mensaje: 'Vuelo actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/vuelos/:id  (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM vuelos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Vuelo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
