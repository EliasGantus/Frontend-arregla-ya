# Real Backend Flow QA Report - 2026-06-07

## Environment

| Item | Value |
| --- | --- |
| Frontend branch | `docs/qa-real-backend-report` |
| Frontend commit | `5531db0` |
| Frontend URL | `http://127.0.0.1:5173` |
| Backend URL | `http://127.0.0.1:3000` |
| Backend branch | `main` (`git status`: `main...origin/main`, dirty worktree observed: `src/modules/uploads/uploads.routes.ts`, `.codex`, `public/`) |
| Backend commit | `49edf8f` |
| Database state | Existing database inferred from running backend responses; not reset and not independently inspected through Docker |
| Docker status | `docker ps` unavailable from sandbox user: access denied to Docker config and `//./pipe/docker_engine` |

## Seed Users

| Role | Email | Password | Name | City / Zone |
| --- | --- | --- | --- | --- |
| Cliente | `cliente@arreglaya.com` | `123456` | Lucia Benitez | Buenos Aires / Caballito |
| Profesional | `pro@arreglaya.com` | `123456` | Carlos Mendoza | Buenos Aires / Almagro |
| Admin | `admin@arreglaya.com` | `123456` | Sofia Herrera | Buenos Aires / Centro |

## Automated Checks

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Backend health | `Invoke-WebRequest -Uri http://127.0.0.1:3000/health -UseBasicParsing` | Passed | HTTP 200 OK. Body: `{"status":"ok","service":"arreglaya-backend","timestamp":"2026-06-07T14:42:23.263Z"}` |
| Frontend login | `Invoke-WebRequest -Uri http://127.0.0.1:5173/login -UseBasicParsing` | Passed | HTTP 200 OK. Returned Vite HTML shell for `/login`. |
| Smoke e2e | `C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/smoke-e2e.mjs` | Passed | Output: `login: ok`, `serviceRequests: 4`, frontend `/login`, backend `/health`. |

## Browser UI Checks

| Flow | Status | Notes |
| --- | --- | --- |
| Cliente login and dashboard | Passed | Browser login with `cliente@arreglaya.com` reached private dashboard with `Hola, Lucia`, role Cliente, and mobile nav `Inicio / Solicitudes / Reservas / Perfil`. |
| Cliente service request flow | Passed | Browser created request `QA cierre perdida agua 1780843946412` with category Plomeria, city/zona Buenos Aires/Palermo, and budget `15000`; request appeared as `Abierta`. |
| Profesional login and quote flow | Passed with data caveat | Browser login with `pro@arreglaya.com` reached professional dashboard and quote flow. The profile name rendered as `Lucia Benitez` even though the seed table expects Carlos Mendoza; role/nav were professional. A quote for the QA request was submitted from UI with amount `18500`, and quote count increased from 4 to 5. |
| Navigation and protected route behavior | Partial | Role-based private routes rendered for client/professional during browser login checks. Direct `/login` navigation while authenticated redirected back to `/app`, as expected. Logout did not clear the current session from the browser, blocking further role switching in the same browser session. |
| Error and empty states | Partial | Empty/error states were not exhaustively exercised. The most relevant observed error-path issue is logout/session switching with real backend/browser session. |

## End-to-End Backend Flow Evidence

The following records were created or updated against the running backend and existing database:

| Step | Endpoint / Action | Result | Evidence |
| --- | --- | --- | --- |
| Client request | Browser UI `/app/solicitudes` | Passed | Request `7805be5c-84eb-423c-ab5e-4f7d4b3ca671`, title `QA cierre perdida agua 1780843946412`, status later observed as `quoted`. |
| Professional quote | Browser UI `/app/cotizaciones` | Passed | Quote appeared in `GET /quotes/me` for the request with amount `18500`, status `pending`, professional id `7b88e13b-adbb-4e58-837e-afec78919729`. |
| Booking create | `POST /bookings` as client | HTTP 201 | Booking `1c523c0b-b321-4319-a055-8f4d25eae158`, status `pending`, scheduled at `2026-06-14T15:01:02.574Z`. |
| Booking confirm | `PATCH /bookings/1c523c0b-b321-4319-a055-8f4d25eae158` as professional | HTTP 200 | Booking status became `confirmed`. |
| Payment create | `POST /bookings/1c523c0b-b321-4319-a055-8f4d25eae158/payments` as client | HTTP 201 | Payment `5ab6878a-85e6-4eb8-bf5d-b46fa78ef4fb`, amount `1850000` ARS cents, status `pending`, checkout URL generated in dev mode. |
| Payment approval | `POST /payments/webhooks/mercadopago` | HTTP 200 | Payment status became `approved`, receipt number `AY-2026-5AB6878A`. |
| Receipt | `GET /payments/5ab6878a-85e6-4eb8-bf5d-b46fa78ef4fb/receipt` as client | HTTP 200 | Receipt returned payment, booking, service title, professional name, amount and paid date. |
| Booking complete | `PATCH /bookings/1c523c0b-b321-4319-a055-8f4d25eae158` as professional | HTTP 200 | Booking status became `completed`; service request status moved to completed by backend. |
| Client review | `POST /reviews` as client | HTTP 201 | Review `18626541-0517-49a0-b3d4-ed411ebe05dc`, rating `5`, comment `Trabajo completado correctamente en QA.` |
| Professional reviews | `GET /professionals/7b88e13b-adbb-4e58-837e-afec78919729/reviews` | HTTP 200 | Returned 1 review after the QA submission. |
| Admin users | `GET /admin/users` as admin | HTTP 200 | Returned 3 users. |
| Admin service requests | `GET /admin/service-requests` as admin | HTTP 200 | Returned 5 service requests. |

## Observations

- Backend and frontend local services responded successfully at the requested URLs.
- Smoke e2e confirmed seeded client login works and `/service-requests` returns an array with 4 records.
- Docker container/database status could not be inspected directly because the sandbox user lacks access to the Docker daemon; database state is inferred from successful backend responses.
- Backend repository had pre-existing uncommitted/untracked changes; no backend files were modified for this report.
- Client rating of a completed job is supported by the backend: the executed completed-booking path accepted `POST /reviews` and updated the professional review list. Route inspection also shows a guard that should reject review creation before completion, but that negative path was not executed in this QA pass.
- Payment can be created in local/dev mode without a MercadoPago token; the backend returns a pending checkout URL and the webhook path can mark it approved, enabling receipt retrieval.
- Follow-up closure work on 2026-06-08 addressed the logout/session-switching issue, the quoted-request UI path to booking, seed consistency for `pro@arreglaya.com`, and dashboard metric placeholders.
- The quote lifecycle is now available from the request detail flow: received quotes can be accepted/rejected, and accepted quotes can lead into booking creation.
- The client rating flow remains supported after completed bookings, with automated coverage added around the completed-booking review path.

## Follow-Up Closure Status

| Original Priority | Follow-up | Status | Evidence |
| --- | --- | --- | --- |
| High | Fix/verify logout with real backend sessions | Closed | `fix/qa-logout-session` clears the local authenticated session even if backend logout returns an error, allowing role switching in the browser. |
| High | Add or document the UI path from quoted request to booking/payment/review | Closed | `feature/qa-booking-from-quotes` added received quotes to the service request detail page and booking creation from accepted/available quote context. `feature/quote-accept-reject` added backend/frontend quote resolution. |
| Medium | Normalize seed data for `pro@arreglaya.com` | Closed | `fix/qa-seed-professional-profile` updates the demo professional user/profile on repeated seed runs so the documented Carlos Mendoza account stays consistent. |
| Medium | Add an automated smoke that creates completed booking and review in isolated test data | Closed | `feature/full-flow-smoke` extends `npm run smoke:e2e` to create isolated request data and validate quote acceptance, booking, payment approval, receipt retrieval, completion and client review against a real backend. |

No functional QA follow-ups remain open from this report after the 2026-06-08 closure branches were merged to `main`.
