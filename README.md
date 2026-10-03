# Airline Reservation System

Sistema de reservas de aerolínea con backend **Node.js + Express** y base de datos **MariaDB**, y un frontend en HTML/CSS/JS puro. Incluye: login/registro, dashboard con gráficos, gestión de vuelos (CRUD), reserva con mapa de asientos interactivo, procesamiento de pago, gestión de reservas, gestión de pagos y gestión de usuarios.

## 1. Requisitos

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/) (v18 o superior)
- [MariaDB](https://mariadb.org/download/) instalado y corriendo (o XAMPP/WAMP/Laragon con MariaDB)
- Extensión recomendada en VS Code: **"REST Client"** o **Thunder Client** (opcional, para probar la API)

## 2. Abrir el proyecto en VS Code

1. Descomprime el proyecto.
2. Abre VS Code → `File > Open Folder...` → selecciona la carpeta `airline-reservation`.
3. Abre una terminal integrada: `Terminal > New Terminal`.

## 3. Crear la base de datos en MariaDB

Abre tu cliente de MariaDB (consola `mysql`, HeidiSQL, DBeaver o phpMyAdmin) y ejecuta el script incluido:

```bash
mysql -u root -p < backend/database/schema.sql
```

Esto crea la base de datos `airline_reservation`, todas las tablas y datos de ejemplo (vuelos, usuarios, reservas, pagos, asientos).

> Si usas phpMyAdmin/HeidiSQL: crea una conexión, abre una pestaña SQL y pega el contenido de `backend/database/schema.sql`.

## 4. Configurar el backend

```bash
cd backend
npm install
copy .env.example .env      # en Windows
# cp .env.example .env      # en Mac/Linux
```

Edita `.env` con tus credenciales reales de MariaDB:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=airline_reservation
JWT_SECRET=algo_bien_secreto
```

Genera las contraseñas de los usuarios de ejemplo (todas quedan en `123456`):

```bash
npm run seed
```

## 5. Ejecutar el servidor

```bash
npm start
```

O en modo desarrollo con recarga automática:

```bash
npm run dev
```

Verás: `Servidor corriendo en http://localhost:3000`

## 6. Abrir la aplicación

Abre el navegador en **http://localhost:3000** (el backend sirve directamente el frontend).

**Usuarios de prueba** (contraseña `123456` para todos):
- Administrador: `admin@airline.com`
- Cliente: `juan.perez@email.com`

## 7. Estructura del proyecto

```
airline-reservation/
├── backend/
│   ├── config/db.js          # Conexión a MariaDB (pool mysql2)
│   ├── middleware/auth.js    # Verificación de JWT
│   ├── routes/                # auth, vuelos, reservas, pagos, usuarios, dashboard
│   ├── database/schema.sql   # Script de creación de BD + datos de ejemplo
│   ├── database/seed.js      # Genera contraseñas hasheadas reales
│   ├── server.js             # Punto de entrada Express
│   └── .env.example
└── frontend/
    ├── index.html             # Login
    ├── register.html          # Registro
    ├── dashboard.html         # Dashboard con KPIs y gráficos
    ├── vuelos.html            # Gestión de vuelos (CRUD, admin) / búsqueda (cliente)
    ├── nueva-reserva.html     # Selección de vuelo, clase y asientos
    ├── procesar-pago.html     # Formulario de pago
    ├── mis-reservas.html      # Listado de reservas
    ├── pagos.html             # Historial de pagos
    ├── usuarios.html          # Gestión de usuarios (solo admin)
    ├── css/styles.css
    └── js/                     # api.js (helper fetch+JWT) + un archivo por página
```

## 8. Cómo funciona la autenticación

El login genera un **JWT** que se guarda en `localStorage`. Cada petición del frontend a la API (`js/api.js` → `apiFetch`) manda el token en el header `Authorization: Bearer <token>`. El middleware `verificarToken` lo valida en cada ruta protegida, y `soloAdmin` restringe rutas como usuarios o edición de vuelos.

## 9. Próximos pasos sugeridos

- Agregar recuperación de contraseña por correo.
- Integrar una pasarela de pago real (Stripe/PayPal) en vez de la simulación actual.
- Agregar paginación de reservas/pagos en el backend si crece mucho la data.
- Desplegar el backend (Render/Railway) y la BD MariaDB en un proveedor administrado.
