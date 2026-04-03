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

## Estructura

- `src/app`: bootstrap, router, layouts y guards
- `src/features`: módulos por dominio
- `src/shared`: cliente API, config, tipos y UI base
- `docs/api-contract.md`: contrato esperado para el backend separado
