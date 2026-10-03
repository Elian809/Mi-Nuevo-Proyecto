/**
 * Genera los hashes de contraseña reales para los usuarios de ejemplo.
 * Ejecutar DESPUÉS de correr schema.sql:
 *   node backend/database/seed.js
 *
 * Todos los usuarios de ejemplo quedan con la contraseña: 123456
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seed() {
  const hash = await bcrypt.hash('123456', 10);
  const [result] = await pool.query('UPDATE usuarios SET password_hash = ?', [hash]);
  console.log(`Contraseñas actualizadas para ${result.affectedRows} usuarios.`);
  console.log('Ahora puedes iniciar sesión con cualquier correo de ejemplo y contraseña: 123456');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error al generar seed:', err);
  process.exit(1);
});
