# Backend - Clínica Médica (NestJS + Prisma)

## Requisitos
- Node.js 18+
- Docker (para Postgres) o Postgres local

## Configuración rápida
1. Copia `.env.example` a `.env` y ajusta valores.
2. Levanta Postgres con Docker:
   - Ver archivo `docker-compose.yml` y ejecuta `docker compose up -d`.
3. Instala dependencias y genera cliente Prisma:
   - `npm install`
   - `npm run prisma:generate`
4. Ejecuta migraciones:
   - `npm run prisma:migrate -- --name init`
5. Ejecuta en dev:
   - `npm run start:dev`

## Endpoints principales
- Auth: POST `/auth/register`, POST `/auth/login`, GET `/auth/profile`
- Pacientes: GET `/pacientes`, GET `/pacientes/:id`, POST `/pacientes`, PUT `/pacientes/:id`, DELETE `/pacientes/:id`
- Citas: GET `/citas`, POST `/citas`, PUT `/citas/:id`, DELETE `/citas/:id`
- Recetas: GET `/recetas/:id`, GET `/pacientes/:id/recetas`, POST `/recetas`, GET `/recetas/:id/pdf`
- Pagos (opcional): GET `/pagos`, POST `/pagos`

## Documentación de API (Swagger)

- Disponible en `http://localhost:3001/docs` cuando el servidor está ejecutándose.
- Incluye esquemas de DTOs y ejemplos de request/response.

## Pruebas E2E

- Con PowerShell (Windows): `npm run e2e:ps`
- Con Node script: `npm run e2e`

El flujo crea datos mínimos (usuario doctor, paciente, cita, receta), descarga el PDF de receta y registra un pago.
