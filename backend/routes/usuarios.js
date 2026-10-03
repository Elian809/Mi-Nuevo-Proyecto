const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/usuarios  (solo admin)
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { buscar, rol, page = 1, limit = 10 } = req.query;
    const condiciones = [];
    const valores = [];

    if (buscar) {
      condiciones.push('(nombre LIKE ? OR email LIKE ?)');
      valores.push(`%${buscar}%`, `%${buscar}%`);
    }
    if (rol && rol !== 'Todos') { condiciones.push('rol = ?'); valores.push(rol); }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, puntos, estado FROM usuarios ${where} ORDER BY id LIMIT ? OFFSET ?`,
      [...valores, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM usuarios ${where}`, valores);

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/usuarios  (solo admin - crear usuario)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, email, password, rol = 'Cliente' } = req.body;
    const hash = await bcrypt.hash(password || '123456', 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rol]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese correo ya existe' });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/usuarios/:id  (solo admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, email, rol, estado } = req.body;
    await pool.query('UPDATE usuarios SET nombre=?, email=?, rol=?, estado=? WHERE id=?', [
      nombre, email, rol, estado, req.params.id,
    ]);
    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/usuarios/:id/estado  (activar/bloquear)
router.put('/:id/estado', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ mensaje: 'Estado actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/usuarios/:id  (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
