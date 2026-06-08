# Final Release QA Checklist - 2026-06-08

## Scope

This checklist captures the current release-readiness checks for the frontend after the QA closure work. It focuses on behavior that keeps the app working correctly with the real backend.

## Required Checks

| Check | Command / Action | Expected Result |
| --- | --- | --- |
| Frontend tests | `npm run test` | Unit and integration tests pass. |
| Frontend build | `npm run build` | TypeScript and Vite production build pass. The known Vite chunk-size warning is non-blocking. |
| Backend health | `GET /health` on the backend used by the app | HTTP 200 with service status `ok`. |
| Frontend health | Open `/login` on the frontend used by the app | HTTP 200 and the app shell loads. |
| Full real-backend smoke | `npm run smoke:e2e` with `FRONTEND_URL` and `BACKEND_URL` pointing to the checked services | Login, service request, quote, quote acceptance, booking, payment approval, receipt, completion and review all pass. |

## Final Smoke Evidence

The final smoke was executed from frontend `origin/main` after merge `7f19bd6` using:

- Frontend build served at `http://127.0.0.1:5175/login`.
- Backend `origin/main` served at `http://127.0.0.1:3001/health`.
- Existing seeded users `cliente@arreglaya.com` and `pro@arreglaya.com`.

Result:

| Artifact | ID |
| --- | --- |
| Service request | `094955d3-be4c-4418-83e4-acf0e348cee5` |
| Quote | `955c37c6-4eb6-4d37-ad01-22514334d09e` |
| Booking | `9e2fdb00-1079-4958-8cfe-367af3f42357` |
| Payment | `0fe5b619-2dbe-478f-a670-f76f34da2dc5` |
| Receipt | `AY-2026-0FE5B619` |
| Review | `b6e1aa35-9567-4e23-b29e-ce68f118a129` |

## Release Gate

The release is functionally ready when all required checks above pass against the same frontend and backend revisions intended for deployment.

If `npm run smoke:e2e` fails, use the request method, URL, status and backend body included in the smoke error output as the first diagnostic source.
