# Frontend - Clínica Médica (Next.js)

## Requisitos
- Node.js 18+

## Configuración rápida
1. Instalar dependencias: `npm install`
2. Ejecutar en dev: `npm run dev`

Se recomienda configurar variables de entorno para la URL del backend (`NEXT_PUBLIC_API_URL`).

## Páginas y funcionalidades

- `/login`: iniciar sesión. Guarda el token JWT en `localStorage` y protege las rutas.
- `/pacientes`: CRUD completo contra la API `/pacientes`.
- `/citas`: CRUD completo contra la API `/citas`. Selección de paciente, campo para ID de doctor, fecha, hora, estado y notas.
- `/recetas`: Crear recetas y listar por paciente con `/pacientes/:id/recetas`. Permite bajar el PDF en `/recetas/:id/pdf`.
- `/pagos`: Registrar y listar pagos usando `/pagos`. Requiere paciente y monto; `citaId` es opcional.

> Asegúrate de que `NEXT_PUBLIC_API_URL` apunte al backend (por defecto `http://localhost:3001`).
