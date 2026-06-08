# ArreglaYa — Fixes aplicados (2026-06-02)

Revisión completa de bugs visuales, de lógica de negocio y UX identificados contra el diseño Figma.

---

## Backend (`Backend-arregla-ya`)

### #7 — ServiceRequest no completaba su ciclo de vida
**Archivo:** `src/modules/bookings/bookings.routes.ts`  
**Problema:** Al marcar un Booking como `COMPLETED`, el ServiceRequest asociado quedaba en estado `ASSIGNED` indefinidamente.  
**Fix:** Se agregó el bloque que actualiza el `ServiceRequest` a `COMPLETED` cuando el booking se completa. También se agregó el valor `COMPLETED` al enum `ServiceRequestStatus` en `prisma/schema.prisma` y se corrió la migración correspondiente.

### #8 — Conflict check usaba timestamp exacto
**Archivos:** `src/modules/bookings/bookings.routes.ts`, `src/modules/professionals/professionals.routes.ts`  
**Problema:** La verificación de disponibilidad del profesional comparaba `scheduledAt` con igualdad exacta de timestamp, lo que permitía reservas casi simultáneas y bloqueaba horarios diferentes del mismo día bajo ciertos escenarios.  
**Fix:** Se reemplazó la comparación exacta por una ventana de ±2 horas usando `gte`/`lte` de Prisma.

### #10 — Quote cards mostraban UUID en vez de título
**Archivos:** `src/modules/quotes/quotes.routes.ts`, `src/lib/serializers.ts`  
**Problema:** `serializeQuote` no incluía el título del ServiceRequest. El frontend mostraba el UUID crudo como nombre de la cotización.  
**Fix:** Se agregó `serviceRequest: { select: { id, title } }` al include de las queries de quotes (GET y POST). Se actualizó `serializeQuote` para exponer `serviceRequestTitle`.

### #2 — Upload de imágenes no implementado
**Archivos:** `src/modules/uploads/uploads.routes.ts` (nuevo), `src/routes/index.ts`, `src/app.ts`, `src/modules/service-requests/service-requests.routes.ts`, `prisma/schema.prisma`  
**Problema:** El Figma muestra una sección "Agregar imágenes del problema" que no tenía ninguna implementación en backend ni frontend.  
**Fix:**
- Se instaló `multer` para manejo de archivos.
- Se creó el endpoint `POST /uploads` que guarda imágenes en `public/uploads/` y retorna la URL relativa.
- Se agregó `express.static('public/uploads')` para servir los archivos.
- Se agregó el campo `photos String[]` al modelo `ServiceRequest` en Prisma (con migración).
- El endpoint `POST /service-requests` ahora acepta y persiste el array de fotos.

---

## Frontend (`Frontend-arregla-ya`)

### #4 — Bottom nav mostraba 3 ítems para profesional (debería ser 4)
**Archivo:** `src/app/layouts/app-shell.tsx`  
**Problema:** El Figma muestra 4 ítems en el nav inferior para el rol profesional (Panel, Perfil, Solicitudes, Cotizaciones) pero la lógica siempre recortaba a 3.  
**Fix:** Se simplificó `visibleMobileItems` para mostrar todos los ítems disponibles para el rol. El grid pasa a ser dinámico (`grid-cols-3` o `grid-cols-4` según cantidad de ítems).

### #5 — Link "¿Olvidaste tu contraseña?" ausente en login
**Archivo:** `src/features/auth/pages/login-page.tsx`  
**Problema:** El Figma muestra el link de recuperación de contraseña pero no estaba implementado.  
**Fix:** Se agregó el link debajo del campo Contraseña. Al hacer click muestra un mensaje inline: *"Esta función no está disponible aún. Contactá al administrador."*

### #6 — Campo descripción extra no contemplado en Figma
**Archivos:** `src/shared/types/contracts.ts`, `src/features/service-requests/pages/service-requests-page.tsx`  
**Problema:** El Figma solo muestra un campo "Titulo" en el formulario de nueva solicitud. El frontend tenía además un textarea de "Descripcion" que el diseño no contempla.  
**Fix:** Se eliminó el textarea de descripción. El campo "Titulo" se renombró a "Describe tu problema" con mínimo de 12 caracteres. La API recibe `description: values.title` para cumplir el contrato del backend.

### #7 / #11 — Tipos frontend desactualizados
**Archivo:** `src/shared/types/api.ts`  
**Fix:** Se agregó `'completed'` a `ServiceRequestStatus`, `photos: string[]` a `ServiceRequest` y `CreateServiceRequestInput`, y `serviceRequestTitle: string` a `Quote`.

### #10 — statusCopy/statusTone/requestProgress sin valor para 'completed'
**Archivo:** `src/features/service-requests/pages/service-requests-page.tsx`  
**Fix:** Se agregó el valor `completed` a los tres records de mapeo de estados, con el label "Completada" y color verde.

### #11 — Quote cards mostraban UUID en vez de título (frontend)
**Archivo:** `src/features/quotes/pages/quotes-page.tsx`  
**Fix:** Se reemplazó `{quote.serviceRequestId}` por `{quote.serviceRequestTitle}`.

### #2 — Componente upload de imágenes en formulario de solicitud
**Archivo:** `src/features/service-requests/pages/service-requests-page.tsx`  
**Fix:** Se agregó sección "Agregar imágenes del problema" con:
- Thumbnails de fotos subidas con botón de eliminación.
- Botón "+" que abre el file picker (acepta `image/*`, máx. 4 fotos, máx. 5MB c/u).
- Upload inmediato al seleccionar el archivo vía `POST /uploads`.
- Las URLs se pasan con el submit del formulario.

---

---

## Segunda ronda de fixes (2026-06-02) — post verificación responsive

### Bottom nav: íconos SVG en vez de letras
**Archivo:** `src/app/layouts/app-shell.tsx`  
**Problema:** Los ítems de la barra de navegación inferior mostraban letras (H, P, S, C) en vez de íconos reales.  
**Fix:** Se agregaron componentes SVG inline (`NavIconHome`, `NavIconUser`, `NavIconFile`, `NavIconWallet`) que reemplazan las letras. El label se reduce a `text-[10px]` cuando hay 4 ítems para evitar truncamiento.

### Ciudad/Zona side by side en mobile
**Archivo:** `src/features/service-requests/pages/service-requests-page.tsx`  
**Problema:** Los campos Ciudad y Zona aparecían apilados en mobile (440px). El Figma los muestra en la misma fila.  
**Fix:** Se envolvieron en un `<div className="grid grid-cols-2 gap-3 md:col-span-2">`.

### Dashboard: segunda acción rápida para profesional
**Archivo:** `src/features/auth/pages/dashboard-page.tsx`  
**Problema:** El profesional solo tenía un botón de acción rápida ("Buscar trabajos"). El Figma muestra dos: "Buscar trabajos" y "Mis cotizaciones".  
**Fix:** `actionByRole` ahora es un array por rol. Se itera con `.map()` para renderizar una o dos cards según el rol. El ícono `>` se reemplazó por un SVG de flecha propio del diseño.

### Perfil: sección PROFESIONAL con Especialidad y Trabajos
**Archivos:** `src/features/profile/pages/profile-page.tsx`, `src/shared/types/api.ts`  
**Problema:** La card de perfil profesional en mobile mostraba solo tags de especialidad. Faltaba la vista de dos columnas con íconos (Especialidad + Trabajos completados) del Figma.  
**Fix:** Se reemplazó la card anterior por una con grid de 2 columnas: izquierda muestra la primera especialidad con ícono de herramienta (naranja), derecha muestra el conteo de trabajos completados (`ratingCount`) con ícono de estrella (verde). Se agregaron `ratingAverage?` y `ratingCount?` opcionales a la interfaz `AuthUser`.

---

## Tercera ronda de fixes (2026-06-08) - cierre QA

### #1 - Quote accept/reject
**Archivos:** `src/modules/quotes/quotes.routes.ts`, `src/features/service-requests/pages/service-requests-page.tsx`, `src/features/quotes/services/quotes-service.ts`
**Problema:** El cliente no podia aceptar o rechazar cotizaciones recibidas desde la app.
**Fix:** Se agrego `PATCH /quotes/:id` en backend y acciones de aceptar/rechazar en el detalle de solicitud.

### Dashboard metrics con datos reales
**Archivo:** `src/features/auth/pages/dashboard-page.tsx`
**Problema:** Los valores del dashboard eran estaticos por rol.
**Fix:** El dashboard ahora calcula metricas desde servicios existentes: solicitudes/reservas para cliente, cotizaciones/reservas para profesional, y usuarios/solicitudes globales para admin.

---

## Pendiente

No quedan pendientes funcionales registrados en esta revision.
