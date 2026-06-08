# ArreglaYa Frontend

Frontend-only para ArreglaYa, separado del backend.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form + Zod
- Vitest + Testing Library

## Variables de entorno

Usa `.env.example` como base:

```bash
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=ArreglaYa
VITE_ENABLE_DEV_AUTH=false
```

`VITE_ENABLE_DEV_AUTH=true` habilita un acceso local de demostración para navegar la app mientras el backend real todavía no existe.

## Scripts

```bash
npm install
npm run dev
npm run test
npm run build
```

## Smoke E2E con backend real

El smoke real valida el flujo completo contra servicios locales: login de cliente y profesional, creacion de solicitud, cotizacion, aceptacion, reserva, confirmacion, pago por webhook, comprobante, finalizacion y resena.

Prerequisitos:

- Frontend local disponible en `http://127.0.0.1:5173/login`.
- Backend local actualizado con `main` disponible en `http://127.0.0.1:3000/health`.
- Base de datos con seed de `cliente@arreglaya.com` y `pro@arreglaya.com`, ambos con password `123456`.
- Backend con las rutas actuales de cotizaciones, reservas, pagos y resenas.

Comando:

```bash
npm run smoke:e2e
```

Tambien se pueden apuntar URLs alternativas:

```powershell
$env:FRONTEND_URL='http://127.0.0.1:5173'
$env:BACKEND_URL='http://127.0.0.1:3001'
npm run smoke:e2e
```

Si el smoke falla en `PATCH /quotes/:id` con `403`, normalmente significa que el backend local no esta actualizado con la rama `main` que incluye resolucion de cotizaciones por el cliente.

## Estructura

- `src/app`: bootstrap, router, layouts y guards
- `src/features`: módulos por dominio
- `src/shared`: cliente API, config, tipos y UI base
- `docs/api-contract.md`: contrato esperado para el backend separado
