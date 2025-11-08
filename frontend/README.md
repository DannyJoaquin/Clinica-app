# Frontend - Clínica Médica (Next.js)

## Requisitos
- Node.js 18+

## Configuración rápida
1. Instalar dependencias: `npm install`
2. Ejecutar en dev: `npm run dev`

Se recomienda configurar variables de entorno para la URL del backend (`NEXT_PUBLIC_API_URL`).
Por defecto usamos `http://localhost:3002` para el backend.

## Páginas y funcionalidades

- `/login`: iniciar sesión. Guarda el token JWT en `localStorage` y protege las rutas.
- `/pacientes`: CRUD completo contra la API `/pacientes`.
- `/citas`: CRUD completo contra la API `/citas`. Selección de paciente, campo para ID de doctor, fecha, hora, estado y notas.
- `/recetas`: Crear recetas y listar por paciente con `/pacientes/:id/recetas`. Permite bajar el PDF en `/recetas/:id/pdf`.
- `/pagos`: Registrar y listar pagos usando `/pagos`. Requiere paciente y monto; `citaId` es opcional.

## Panel Administrativo (Admin)

- Ruta: `/dashboard/admin` (visible sólo para usuarios con rol `admin`).
- Contenido: tarjetas de métricas, gráficas (Recharts), agenda del día, actividad reciente, alertas y exportaciones (CSV/PDF).
- Dependencias para el dashboard: `recharts` y `jspdf` (se instalan con `npm i recharts jspdf`).
- Datos reales vs. mock:
	- Por defecto el dashboard consume la API real (`/admin/dashboard/summary`).
	- Si prefieres datos de ejemplo sin tocar el backend, coloca `NEXT_PUBLIC_USE_API=false` en `.env.local`.

### Variables de entorno

En `./.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3002
# Descomenta para usar datos mock en el admin dashboard
# NEXT_PUBLIC_USE_API=false
```

> Asegúrate de que `NEXT_PUBLIC_API_URL` apunte al backend (por defecto `http://localhost:3002`).
