-- =====================================================
-- Airline Reservation System - Esquema MariaDB
-- =====================================================
DROP DATABASE IF EXISTS airline_reservation;
CREATE DATABASE airline_reservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE airline_reservation;

-- ---------------------------
-- Tabla: usuarios
-- ---------------------------
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('Administrador','Cliente') NOT NULL DEFAULT 'Cliente',
    puntos INT DEFAULT 0,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------
-- Tabla: vuelos
-- ---------------------------
CREATE TABLE vuelos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    origen VARCHAR(10) NOT NULL,
    origen_ciudad VARCHAR(100) NOT NULL,
    destino VARCHAR(10) NOT NULL,
    destino_ciudad VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    estado ENUM('Disponible','Cancelado','Completo') DEFAULT 'Disponible',
    filas INT DEFAULT 8,
    columnas VARCHAR(20) DEFAULT 'A,B,C,D,E,F',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------
-- Tabla: asientos (estado por vuelo)
-- ---------------------------
CREATE TABLE asientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vuelo_id INT NOT NULL,
    codigo VARCHAR(5) NOT NULL, -- ej. 2B
    estado ENUM('Disponible','Ocupado','No disponible') DEFAULT 'Disponible',
    FOREIGN KEY (vuelo_id) REFERENCES vuelos(id) ON DELETE CASCADE,
    UNIQUE KEY unico_asiento (vuelo_id, codigo)
) ENGINE=InnoDB;

-- ---------------------------
-- Tabla: reservas
-- ---------------------------
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    vuelo_id INT NOT NULL,
    clase ENUM('Económica','Económica Plus','Business','Primera Clase') DEFAULT 'Económica',
    asientos VARCHAR(50) NOT NULL, -- ej "2B,2C"
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('Confirmada','Pendiente','Cancelada') DEFAULT 'Pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (vuelo_id) REFERENCES vuelos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- Tabla: pagos
-- ---------------------------
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id INT NOT NULL,
    metodo ENUM('Tarjeta de Crédito','Tarjeta de Débito','PayPal','Transferencia') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    transaccion VARCHAR(50),
    estado ENUM('Completado','Pendiente','Cancelado') DEFAULT 'Pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- Datos de ejemplo
-- =====================================================

-- Usuarios (password de todos: "123456", hash bcrypt se genera en /backend/database/seed.js)
INSERT INTO usuarios (nombre, email, password_hash, rol, puntos, estado) VALUES
('Administrador', 'admin@airline.com', '$2b$10$placeholderplaceholderplaceholderplaceholderplaceh', 'Administrador', 0, 'Activo'),
('Juan Pérez', 'juan.perez@email.com', '$2b$10$placeholderplaceholderplaceholderplaceholderplaceh', 'Cliente', 1200, 'Activo'),
('Maria Garcia', 'maria.garcia@email.com', '$2b$10$placeholderplaceholderplaceholderplaceholderplaceh', 'Cliente', 850, 'Activo'),
('Carlos Lopez', 'carlos.lopez@email.com', '$2b$10$placeholderplaceholderplaceholderplaceholderplaceh', 'Cliente', 600, 'Activo'),
('Ana Martinez', 'ana.martinez@email.com', '$2b$10$placeholderplaceholderplaceholderplaceholderplaceh', 'Cliente', 450, 'Activo');

-- Vuelos
INSERT INTO vuelos (numero, origen, origen_ciudad, destino, destino_ciudad, fecha, hora, precio, estado) VALUES
('AR101', 'SDQ', 'Santo Domingo', 'JFK', 'New York', '2024-06-10', '08:00:00', 450.00, 'Disponible'),
('AR102', 'SDQ', 'Santo Domingo', 'MIA', 'Miami', '2024-06-11', '10:30:00', 320.00, 'Disponible'),
('AR103', 'SDQ', 'Santo Domingo', 'MAD', 'Madrid', '2024-06-12', '18:00:00', 780.00, 'Disponible'),
('AR104', 'SDQ', 'Santo Domingo', 'PTY', 'Panama', '2024-06-13', '14:00:00', 280.00, 'Disponible'),
('AR105', 'SDQ', 'Santo Domingo', 'SCL', 'Santiago', '2024-06-14', '09:00:00', 550.00, 'Cancelado');

-- Reservas
INSERT INTO reservas (usuario_id, vuelo_id, clase, asientos, total, estado) VALUES
(2, 1, 'Económica', '2B,2C', 900.00, 'Confirmada'),
(3, 2, 'Económica', '3A', 320.00, 'Confirmada'),
(4, 3, 'Económica', '1D,1E', 780.00, 'Pendiente'),
(5, 4, 'Económica', '4A', 280.00, 'Cancelada');

-- Pagos
INSERT INTO pagos (reserva_id, metodo, monto, transaccion, estado) VALUES
(1, 'Tarjeta de Crédito', 900.00, 'TXN123456789', 'Completado'),
(2, 'PayPal', 320.00, 'TXN987654321', 'Completado'),
(3, 'Tarjeta de Débito', 780.00, NULL, 'Pendiente'),
(4, 'Transferencia', 280.00, NULL, 'Cancelado');

-- Generar asientos base para el vuelo AR101 (5 filas x 6 columnas) con algunos ocupados
INSERT INTO asientos (vuelo_id, codigo, estado)
SELECT 1, CONCAT(f, c), 'Disponible'
FROM (SELECT 1 f UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) filas
CROSS JOIN (SELECT 'A' c UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F') cols;

UPDATE asientos SET estado='Ocupado' WHERE vuelo_id=1 AND codigo IN ('2A','2D','2E','2F','5A','5B');
UPDATE asientos SET estado='No disponible' WHERE vuelo_id=1 AND codigo IN ('5C','5D','5E','5F');
