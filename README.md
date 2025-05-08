# 🧠 Chronotask

Chronotask es una aplicación web estilo **Pomodoro** enfocada en la productividad, con gestión de tareas, proyectos y estadísticas.

> "Tu tiempo bajo control, una tarea a la vez 🍅"

---

## 🚀 Funcionalidades principales

- ⏱️ Temporizador Pomodoro configurable (trabajo y descansos)
- 📝 Gestión de tareas diarias con estimación de pomodoros
- 📂 Organización por proyectos (crear, asignar y filtrar)
- 📊 Reportes semanales visuales (gráfico de pomodoros)
- 🧘‍♂️ Modo sin distracciones (pantalla oscura animada)
- 🌙 Modo oscuro / claro con persistencia
- 🔐 Registro e inicio de sesión con JWT
- 📤 Exportación de tareas a CSV
- 💾 Modo invitado (sin cuenta) con almacenamiento local
- ✅ Todo sin suscripciones ni versiones “Pro”

---

## 🛠️ Tecnologías usadas

### Frontend:
- React + Tailwind CSS
- Framer Motion (animaciones)
- Chart.js (gráficos)
- Heroicons (iconos SVG)
- Vite (entorno de desarrollo)

### Backend:
- Node.js + Express
- Prisma ORM
- SQLite (desarrollo) o PostgreSQL (producción-ready)
- JWT para autenticación

---

## 📦 Instalación local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/chronotask.git
   cd chronotask
2. Instala las dependencias:
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   npm install
   npx prisma migrate dev --name init
3. Configura las variables:
   Crear un archivo .env en server/ con:
   ```ini
   JWT_SECRET=supersecreto
4. Ejecuta:
   ```bash
   # Backend
   cd server
   npm run dev

   # Frontend
   cd ../client
   npm run dev

📷 Capturas de pantalla

![Captura de pantalla 2025-05-08 101341](https://github.com/user-attachments/assets/be0073b2-0703-4298-9c76-80680a38d382)


📄 Licencia
MIT — sin restricciones comerciales.
¡Úsalo, modifícalo y compártelo libremente!
