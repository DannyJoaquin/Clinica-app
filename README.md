# Clínica Médica - Monorepo

Este repositorio contiene el backend (NestJS + Prisma + PostgreSQL) y el frontend (Next.js + Tailwind) para una clínica médica privada.

## Estructura

- `backend/` – API REST con NestJS, Prisma y JWT
- `frontend/` – Aplicación web con Next.js, React, TypeScript, Tailwind, shadcn/ui

Consulta los READMEs en cada paquete para instrucciones específicas.

## Cómo ejecutar todo el stack

1) Base de datos
- Copia `backend/.env.example` a `backend/.env` y ajusta credenciales de Postgres si es necesario.
- Levanta Postgres con Docker: dentro de `backend/` ejecuta `docker compose up -d`.

2) Backend
- Dentro de `backend/` instala dependencias y prepara Prisma:
	- `npm install`
	- `npm run prisma:generate`
	- `npm run prisma:migrate -- --name init`
- Inicia en desarrollo:
	- `npm run start:dev`
- Salud: `GET http://localhost:3001/health`
- Documentación Swagger: `http://localhost:3001/docs`

3) Frontend
- Dentro de `frontend/` instala dependencias:
	- `npm install`
- Configura `frontend/.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Inicia en desarrollo:
	- `npm run dev`
- App en `http://localhost:3000`

## Pruebas de extremo a extremo (E2E)

- Requiere el backend corriendo en `http://localhost:3001`.
- Desde `backend/`, Windows PowerShell:
	- `npm run e2e:ps`
- Alternativa (Node script):
	- `npm run e2e`

El script E2E valida: login, perfil, creación de doctor/paciente/cita/receta, descarga de PDF (`/recetas/:id/pdf`), creación y listado de pagos.

## Páginas principales del Frontend

- `/login` – inicio de sesión y guarda JWT.
- `/pacientes` – CRUD completo.
- `/citas` – CRUD completo.
- `/recetas` – crear, listar por paciente y descargar PDF.
- `/pagos` – registrar y listar.
