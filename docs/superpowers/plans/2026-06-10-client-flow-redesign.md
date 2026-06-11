# Client Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first ArreglaYa client end-to-end UX slice from service request creation through quote acceptance, booking, payment, completion, and review.

**Architecture:** Keep current routes and modules, but move flow-state decisions into backend serializers through `availableActions`, `nextStep`, and human-readable state copy. Frontend screens consume that metadata through typed contracts and shared flow UI components instead of duplicating fragile status logic per page.

**Tech Stack:** Frontend React 19, TypeScript, Tailwind CSS, React Query, React Router, React Hook Form, Vitest. Backend Express, Prisma, PostgreSQL, JWT, Zod, Vitest, Supertest.

---

## File Structure

Backend repository: `../Backend-arregla-ya`

- Modify: `src/lib/serializers.ts`
  - Add flow action types, status copy helpers, and enriched `serializeServiceRequest` / `serializeBooking` output.
- Modify: `src/modules/bookings/bookings.routes.ts`
  - Add explicit booking transition validation for cancel, confirm, and complete.
- Modify: `src/modules/service-requests/service-requests.routes.ts`
  - Include quotes when needed for request flow metadata if the selected implementation needs quote counts.
- Modify: `src/test/serializers.test.ts`
  - Add serializer coverage for `availableActions`, `nextStep`, status labels, and flags.
- Modify: `src/test/bookings.test.ts`
  - Add transition tests for professional completion and invalid completion.

Frontend repository: `../Frontend-arregla-ya`

- Modify: `src/shared/types/api.ts`
  - Add `FlowAction`, `FlowNextStep`, and enriched fields to `ServiceRequest` and `Booking`.
- Create: `src/shared/ui/status-chip.tsx`
  - Shared chip for request, quote, booking, and payment states.
- Create: `src/shared/ui/empty-state.tsx`
  - Reusable empty state with optional CTA.
- Create: `src/shared/ui/success-state.tsx`
  - Reusable success panel for post-action confirmation.
- Create: `src/shared/ui/flow-progress.tsx`
  - Shared progress indicator for request to review lifecycle.
- Create: `src/shared/ui/next-action-panel.tsx`
  - Shared guided action panel backed by `nextStep`.
- Modify: `src/features/service-requests/pages/service-requests-page.tsx`
  - Add guided request UX and next-step-driven request cards/detail.
- Modify: `src/features/bookings/pages/bookings-page.tsx`
  - Add next-step display and professional `complete_work` action.
- Modify: `src/features/payments/pages/payments-page.tsx`
  - Improve success/error copy and return navigation.
- Modify: `src/features/reviews/pages/reviews-page.tsx`
  - Improve reviewable-only state and closing success.
- Modify frontend tests in touched feature folders.

---

### Task 1: Backend Flow Metadata In Serializers

**Files:**
- Modify: `../Backend-arregla-ya/src/lib/serializers.ts`
- Modify: `../Backend-arregla-ya/src/test/serializers.test.ts`

- [ ] **Step 1: Add failing serializer tests**

Add this import change:

```ts
import { serializeBooking, serializeQuote, serializeServiceRequest, serializeUser } from '../lib/serializers.js';
```

Append these tests to `src/test/serializers.test.ts`:

```ts
it('agrega metadata de flujo a solicitudes cotizadas', () => {
  const request = serializeServiceRequest({
    id: 'sr1',
    title: 'Plomeria urgente',
    description: 'Pierde agua bajo mesada',
    status: 'QUOTED',
    city: 'Buenos Aires',
    zone: 'Palermo',
    budget: '$85.000',
    photos: [],
    createdAt: new Date('2026-04-02T00:00:00.000Z'),
    updatedAt: new Date('2026-04-02T00:00:00.000Z'),
    clientId: 'client-1',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Plomeria',
      slug: 'plomeria',
    },
  });

  expect(request.statusLabel).toBe('Cotizaciones recibidas');
  expect(request.statusDescription).toContain('Revisa las propuestas');
  expect(request.availableActions).toContain('accept_quote');
  expect(request.nextStep).toMatchObject({
    action: 'accept_quote',
    label: 'Comparar cotizaciones',
  });
});

it('agrega metadata de flujo a reservas confirmadas y completadas', () => {
  const confirmed = serializeBooking({
    id: 'booking-1',
    serviceRequestId: 'request-1',
    clientId: 'client-1',
    professionalId: 'pro-1',
    scheduledAt: new Date('2026-06-05T14:00:00.000Z'),
    status: 'CONFIRMED',
    notes: null,
    createdAt: new Date('2026-04-02T00:00:00.000Z'),
    updatedAt: new Date('2026-04-02T00:00:00.000Z'),
    client: { id: 'client-1', fullName: 'Lucia Benitez' },
    professional: { id: 'pro-1', fullName: 'Carlos Mendoza' },
    serviceRequest: { id: 'request-1', title: 'Arreglo de canilla' },
    payment: null,
    review: null,
  });

  const completed = serializeBooking({
    id: 'booking-2',
    serviceRequestId: 'request-1',
    clientId: 'client-1',
    professionalId: 'pro-1',
    scheduledAt: new Date('2026-06-05T14:00:00.000Z'),
    status: 'COMPLETED',
    notes: 'Trabajo terminado',
    createdAt: new Date('2026-04-02T00:00:00.000Z'),
    updatedAt: new Date('2026-04-02T00:00:00.000Z'),
    client: { id: 'client-1', fullName: 'Lucia Benitez' },
    professional: { id: 'pro-1', fullName: 'Carlos Mendoza' },
    serviceRequest: { id: 'request-1', title: 'Arreglo de canilla' },
    payment: { id: 'payment-1' },
    review: null,
  });

  expect(confirmed.availableActions).toEqual(['pay', 'complete_work']);
  expect(confirmed.nextStep).toMatchObject({ action: 'pay', label: 'Pagar servicio' });
  expect(confirmed.hasPayment).toBe(false);
  expect(confirmed.hasReview).toBe(false);
  expect(completed.availableActions).toEqual(['review']);
  expect(completed.nextStep).toMatchObject({ action: 'review', label: 'Calificar servicio' });
  expect(completed.hasPayment).toBe(true);
  expect(completed.hasReview).toBe(false);
});
```

- [ ] **Step 2: Run serializer test to verify failure**

Run:

```powershell
cd ..\Backend-arregla-ya
npm test -- src/test/serializers.test.ts
```

Expected: FAIL because `serializeBooking` is not imported/exporting the enriched fields and existing relation type does not include `payment`/`review`.

- [ ] **Step 3: Implement flow metadata**

In `src/lib/serializers.ts`, add:

```ts
type FlowAction =
  | 'create_quote'
  | 'accept_quote'
  | 'book'
  | 'confirm_booking'
  | 'pay'
  | 'complete_work'
  | 'review';

const requestFlowCopy: Record<
  ServiceRequestStatus,
  {
    label: string;
    description: string;
    actions: FlowAction[];
    next: { action: FlowAction | null; label: string; description: string; path?: string };
  }
> = {
  DRAFT: {
    label: 'Borrador',
    description: 'Completa los datos para publicar tu solicitud.',
    actions: [],
    next: { action: null, label: 'Completar solicitud', description: 'Termina los datos para pedir ayuda.' },
  },
  OPEN: {
    label: 'Esperando cotizaciones',
    description: 'Tu solicitud esta publicada y disponible para profesionales.',
    actions: [],
    next: { action: null, label: 'Esperar propuestas', description: 'Te avisaremos cuando llegue una cotizacion.' },
  },
  QUOTED: {
    label: 'Cotizaciones recibidas',
    description: 'Revisa las propuestas y elige con quien avanzar.',
    actions: ['accept_quote'],
    next: {
      action: 'accept_quote',
      label: 'Comparar cotizaciones',
      description: 'Acepta una propuesta para coordinar fecha y horario.',
    },
  },
  ASSIGNED: {
    label: 'Reserva en curso',
    description: 'Ya hay un profesional asignado a esta solicitud.',
    actions: [],
    next: { action: null, label: 'Seguir reserva', description: 'Revisa el estado desde tus reservas.', path: '/app/reservas' },
  },
  COMPLETED: {
    label: 'Trabajo completado',
    description: 'El trabajo fue marcado como finalizado.',
    actions: ['review'],
    next: { action: 'review', label: 'Calificar servicio', description: 'Comparte tu experiencia con el profesional.', path: '/app/calificaciones' },
  },
  CANCELLED: {
    label: 'Cancelada',
    description: 'Esta solicitud fue cancelada.',
    actions: [],
    next: { action: null, label: 'Solicitud cerrada', description: 'No hay acciones pendientes.' },
  },
};

const bookingFlowCopy: Record<
  BookingStatus,
  {
    label: string;
    description: string;
    actions: FlowAction[];
    next: { action: FlowAction | null; label: string; description: string; path?: string };
  }
> = {
  PENDING: {
    label: 'Pendiente de confirmacion',
    description: 'La reserva espera confirmacion del profesional.',
    actions: ['confirm_booking'],
    next: { action: 'confirm_booking', label: 'Confirmar reserva', description: 'El profesional debe confirmar el turno.' },
  },
  CONFIRMED: {
    label: 'Reserva confirmada',
    description: 'El turno esta confirmado y listo para avanzar.',
    actions: ['pay', 'complete_work'],
    next: { action: 'pay', label: 'Pagar servicio', description: 'Completa el pago del servicio.', path: '/app/pagos' },
  },
  COMPLETED: {
    label: 'Trabajo completado',
    description: 'El trabajo fue finalizado por el profesional.',
    actions: ['review'],
    next: { action: 'review', label: 'Calificar servicio', description: 'Deja tu resena para cerrar el flujo.', path: '/app/calificaciones' },
  },
  CANCELLED: {
    label: 'Cancelada',
    description: 'Esta reserva fue cancelada.',
    actions: [],
    next: { action: null, label: 'Reserva cerrada', description: 'No hay acciones pendientes.' },
  },
};
```

Update `serializeServiceRequest` return object:

```ts
const flow = requestFlowCopy[serviceRequest.status];

return {
  id: serviceRequest.id,
  title: serviceRequest.title,
  description: serviceRequest.description,
  status: serviceRequestStatusMap[serviceRequest.status],
  statusLabel: flow.label,
  statusDescription: flow.description,
  availableActions: flow.actions,
  nextStep: flow.next,
  category: serializeCategory(serviceRequest.category),
  city: serviceRequest.city,
  zone: serviceRequest.zone,
  budget: serviceRequest.budget ?? undefined,
  photos: serviceRequest.photos,
  createdAt: serviceRequest.createdAt.toISOString(),
};
```

Update `serializeBooking` input type and return object:

```ts
export const serializeBooking = (
  booking: Booking & {
    client: Pick<User, 'id' | 'fullName'>;
    professional: Pick<User, 'id' | 'fullName'>;
    serviceRequest: Pick<ServiceRequest, 'id' | 'title'>;
    payment?: { id: string } | null;
    review?: { id: string } | null;
  },
) => {
  const flow = bookingFlowCopy[booking.status];
  const hasPayment = Boolean(booking.payment);
  const hasReview = Boolean(booking.review);
  const availableActions = flow.actions.filter((action) => {
    if (action === 'pay') {
      return !hasPayment;
    }
    if (action === 'review') {
      return !hasReview;
    }
    return true;
  });
  const nextStep =
    flow.next.action && !availableActions.includes(flow.next.action)
      ? { action: null, label: 'Sin acciones pendientes', description: 'Este paso ya fue completado.' }
      : flow.next;

  return {
    id: booking.id,
    serviceRequestId: booking.serviceRequestId,
    serviceRequestTitle: booking.serviceRequest.title,
    clientId: booking.clientId,
    clientName: booking.client.fullName,
    professionalId: booking.professionalId,
    professionalName: booking.professional.fullName,
    scheduledAt: booking.scheduledAt.toISOString(),
    status: bookingStatusMap[booking.status],
    statusLabel: flow.label,
    statusDescription: flow.description,
    availableActions,
    nextStep,
    hasPayment,
    hasReview,
    notes: booking.notes ?? undefined,
    createdAt: booking.createdAt.toISOString(),
  };
};
```

- [ ] **Step 4: Run serializer test to verify pass**

Run:

```powershell
cd ..\Backend-arregla-ya
npm test -- src/test/serializers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit backend serializer metadata**

Run:

```powershell
cd ..\Backend-arregla-ya
git add src/lib/serializers.ts src/test/serializers.test.ts
git commit -m "feat: add flow metadata to serializers"
```

---

### Task 2: Backend Booking Transition Rules

**Files:**
- Modify: `../Backend-arregla-ya/src/modules/bookings/bookings.routes.ts`
- Modify: `../Backend-arregla-ya/src/test/bookings.test.ts`

- [ ] **Step 1: Add failing transition tests**

Append to `src/test/bookings.test.ts`:

```ts
it('permite que el profesional finalice una reserva confirmada', async () => {
  const app = createApp();
  const professional = makeUser({
    id: 'pro-1',
    email: 'pro@arreglaya.com',
    role: 'PROFESIONAL',
  });
  const currentBooking = makeBooking({ status: 'CONFIRMED' });
  const updatedBooking = withRelations(makeBooking({ status: 'COMPLETED' }));

  prismaMocks.userFindUnique.mockResolvedValue(professional);
  prismaMocks.bookingFindUnique.mockResolvedValue(currentBooking);
  prismaMocks.bookingUpdate.mockResolvedValue(updatedBooking);
  prismaMocks.serviceRequestUpdate.mockResolvedValue(makeServiceRequest({ status: 'COMPLETED' }));

  const response = await request(app)
    .patch('/bookings/booking-1')
    .set('Authorization', bearerTokenFor(professional))
    .send({ status: 'completed' });

  const updateArgs = prismaMocks.bookingUpdate.mock.calls[0]?.[0] as BookingWriteArgs | undefined;

  expect(response.status).toBe(200);
  expect(updateArgs?.data?.status).toBe('COMPLETED');
  expect(prismaMocks.serviceRequestUpdate).toHaveBeenCalledWith({
    where: { id: 'request-1' },
    data: { status: 'COMPLETED' },
  });
  expect(notificationMocks.notifyBookingStatusChanged).toHaveBeenCalledWith(updatedBooking);
});

it('rechaza finalizar una reserva que todavia no fue confirmada', async () => {
  const app = createApp();
  const professional = makeUser({
    id: 'pro-1',
    email: 'pro@arreglaya.com',
    role: 'PROFESIONAL',
  });

  prismaMocks.userFindUnique.mockResolvedValue(professional);
  prismaMocks.bookingFindUnique.mockResolvedValue(makeBooking({ status: 'PENDING' }));

  const response = await request(app)
    .patch('/bookings/booking-1')
    .set('Authorization', bearerTokenFor(professional))
    .send({ status: 'completed' });

  expect(response.status).toBe(409);
  expect(response.body).toMatchObject({
    code: 'INVALID_BOOKING_TRANSITION',
    message: 'La reserva debe estar confirmada antes de marcarla como finalizada.',
  });
  expect(prismaMocks.bookingUpdate).not.toHaveBeenCalled();
});

it('impide que el cliente finalice una reserva confirmada', async () => {
  const app = createApp();
  const client = makeUser();

  prismaMocks.userFindUnique.mockResolvedValue(client);
  prismaMocks.bookingFindUnique.mockResolvedValue(makeBooking({ status: 'CONFIRMED' }));

  const response = await request(app)
    .patch('/bookings/booking-1')
    .set('Authorization', bearerTokenFor(client))
    .send({ status: 'completed' });

  expect(response.status).toBe(403);
  expect(response.body).toMatchObject({
    code: 'FORBIDDEN',
    message: 'Solo el profesional asignado puede finalizar este trabajo.',
  });
  expect(prismaMocks.bookingUpdate).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run bookings tests to verify failure**

Run:

```powershell
cd ..\Backend-arregla-ya
npm test -- src/test/bookings.test.ts
```

Expected: FAIL because current route allows broader updates and does not enforce `CONFIRMED -> COMPLETED`.

- [ ] **Step 3: Implement explicit transition validation**

Replace `resolveAllowedStatus` in `src/modules/bookings/bookings.routes.ts` with:

```ts
const resolveAllowedStatus = (
  role: UserRole,
  userId: string,
  booking: Booking,
  status: z.infer<typeof updateSchema>['status'],
) => {
  if (!status) {
    return undefined;
  }

  if (status === 'cancelled') {
    if (booking.status !== 'PENDING') {
      throw new HttpError(409, 'Solo se pueden cancelar reservas pendientes.', 'INVALID_BOOKING_TRANSITION');
    }
    if (role !== 'ADMIN' && booking.clientId !== userId) {
      throw new HttpError(403, 'Solo el cliente puede cancelar esta reserva.', 'FORBIDDEN');
    }
    return 'CANCELLED';
  }

  if (status === 'confirmed') {
    if (booking.status !== 'PENDING') {
      throw new HttpError(409, 'Solo se pueden confirmar reservas pendientes.', 'INVALID_BOOKING_TRANSITION');
    }
    if (role !== 'ADMIN' && booking.professionalId !== userId) {
      throw new HttpError(403, 'Solo el profesional asignado puede confirmar esta reserva.', 'FORBIDDEN');
    }
    return 'CONFIRMED';
  }

  if (status === 'completed') {
    if (booking.status !== 'CONFIRMED') {
      throw new HttpError(
        409,
        'La reserva debe estar confirmada antes de marcarla como finalizada.',
        'INVALID_BOOKING_TRANSITION',
      );
    }
    if (role !== 'ADMIN' && booking.professionalId !== userId) {
      throw new HttpError(403, 'Solo el profesional asignado puede finalizar este trabajo.', 'FORBIDDEN');
    }
    return 'COMPLETED';
  }

  if (status === 'pending') {
    throw new HttpError(409, 'No se puede volver una reserva al estado pendiente.', 'INVALID_BOOKING_TRANSITION');
  }

  return statusMap[status];
};
```

Update the route call:

```ts
const status = resolveAllowedStatus(request.auth!.role, request.auth!.userId, current, payload.status);
```

- [ ] **Step 4: Include payment/review in booking include**

Update `bookingInclude`:

```ts
const bookingInclude = {
  client: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  professional: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  serviceRequest: {
    select: {
      id: true,
      title: true,
    },
  },
  payment: {
    select: {
      id: true,
    },
  },
  review: {
    select: {
      id: true,
    },
  },
} as const;
```

- [ ] **Step 5: Run bookings tests**

Run:

```powershell
cd ..\Backend-arregla-ya
npm test -- src/test/bookings.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run backend focused validation**

Run:

```powershell
cd ..\Backend-arregla-ya
npm test -- src/test/bookings.test.ts src/test/serializers.test.ts src/test/reviews.test.ts
npm run build
```

Expected: tests pass and TypeScript build succeeds.

- [ ] **Step 7: Commit booking transition rules**

Run:

```powershell
cd ..\Backend-arregla-ya
git add src/modules/bookings/bookings.routes.ts src/test/bookings.test.ts
git commit -m "feat: validate booking completion flow"
```

---

### Task 3: Frontend Flow Types And Shared Components

**Files:**
- Modify: `src/shared/types/api.ts`
- Create: `src/shared/ui/status-chip.tsx`
- Create: `src/shared/ui/empty-state.tsx`
- Create: `src/shared/ui/success-state.tsx`
- Create: `src/shared/ui/flow-progress.tsx`
- Create: `src/shared/ui/next-action-panel.tsx`

- [ ] **Step 1: Update frontend API types**

Add to `src/shared/types/api.ts` after `AuthTokens`:

```ts
export type FlowAction =
  | 'create_quote'
  | 'accept_quote'
  | 'book'
  | 'confirm_booking'
  | 'pay'
  | 'complete_work'
  | 'review';

export interface FlowNextStep {
  action: FlowAction | null;
  label: string;
  description: string;
  path?: string;
}

export interface FlowState {
  statusLabel: string;
  statusDescription: string;
  availableActions: FlowAction[];
  nextStep: FlowNextStep;
}
```

Extend `ServiceRequest`:

```ts
export interface ServiceRequest extends FlowState {
  id: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  category: CategorySummary;
  city: string;
  zone: string;
  budget?: string;
  photos: string[];
  createdAt: string;
  quoteCount?: number;
  acceptedQuoteId?: string;
}
```

Extend `Booking`:

```ts
export interface Booking extends FlowState {
  id: string;
  serviceRequestId: string;
  serviceRequestTitle: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  scheduledAt: string;
  status: BookingStatus;
  hasPayment?: boolean;
  hasReview?: boolean;
  notes?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Create `StatusChip`**

Create `src/shared/ui/status-chip.tsx`:

```tsx
import { cn } from '@/shared/lib/cn';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const toneClassName: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-brand-50 text-brand-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-red-50 text-red-700',
};

const statusTone: Record<string, Tone> = {
  draft: 'neutral',
  open: 'warning',
  quoted: 'info',
  assigned: 'info',
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  refunded: 'neutral',
  accepted: 'success',
  withdrawn: 'neutral',
};

interface StatusChipProps {
  status: string;
  label?: string;
  className?: string;
}

export const StatusChip = ({ status, label, className }: StatusChipProps) => {
  const tone = statusTone[status] ?? 'neutral';

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold',
        toneClassName[tone],
        className,
      )}
    >
      {label ?? status}
    </span>
  );
};
```

- [ ] **Step 3: Create `EmptyState`**

Create `src/shared/ui/empty-state.tsx`:

```tsx
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) => (
  <Card className={cn('rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl', className)}>
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
      {icon ?? '0'}
    </div>
    <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{description}</p>
    {actionLabel && onAction ? (
      <Button className="mt-4 w-full sm:w-auto" onClick={onAction} type="button">
        {actionLabel}
      </Button>
    ) : null}
  </Card>
);
```

- [ ] **Step 4: Create `SuccessState`**

Create `src/shared/ui/success-state.tsx`:

```tsx
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface SuccessStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const SuccessState = ({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: SuccessStateProps) => (
  <Card className={cn('rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-emerald-100/70 md:rounded-3xl', className)}>
    <p className="text-sm font-semibold text-emerald-800">{title}</p>
    <p className="mt-2 text-sm leading-6 text-emerald-700">{description}</p>
    {actionLabel && onAction ? (
      <Button className="mt-4 w-full sm:w-auto" onClick={onAction} type="button" variant="secondary">
        {actionLabel}
      </Button>
    ) : null}
  </Card>
);
```

- [ ] **Step 5: Create `FlowProgress`**

Create `src/shared/ui/flow-progress.tsx`:

```tsx
import { cn } from '@/shared/lib/cn';

export interface FlowProgressStep {
  key: string;
  label: string;
  description?: string;
  state: 'done' | 'current' | 'upcoming';
}

interface FlowProgressProps {
  steps: FlowProgressStep[];
  className?: string;
}

export const FlowProgress = ({ steps, className }: FlowProgressProps) => (
  <ol className={cn('grid gap-3 rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:grid-cols-3 md:rounded-3xl md:p-5', className)}>
    {steps.map((step) => (
      <li className="flex items-start gap-3" key={step.key}>
        <span
          className={cn(
            'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black',
            step.state === 'done' && 'bg-emerald-100 text-emerald-700',
            step.state === 'current' && 'bg-accent-500 text-white',
            step.state === 'upcoming' && 'bg-slate-100 text-slate-400',
          )}
        >
          {step.state === 'done' ? '✓' : ''}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-950">{step.label}</span>
          {step.description ? (
            <span className="mt-1 block text-xs leading-5 text-slate-500">{step.description}</span>
          ) : null}
        </span>
      </li>
    ))}
  </ol>
);
```

- [ ] **Step 6: Create `NextActionPanel`**

Create `src/shared/ui/next-action-panel.tsx`:

```tsx
import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { StatusChip } from '@/shared/ui/status-chip';
import type { FlowNextStep } from '@/shared/types/api';

interface NextActionPanelProps {
  eyebrow?: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  nextStep: FlowNextStep;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  aside?: ReactNode;
}

export const NextActionPanel = ({
  eyebrow = 'Proximo paso',
  title,
  description,
  status,
  statusLabel,
  nextStep,
  actionLabel,
  onAction,
  actionDisabled,
  aside,
}: NextActionPanelProps) => (
  <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:rounded-3xl md:p-6">
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-200">{description}</p>
        <div className="mt-4">
          <StatusChip className="bg-white/10 text-white" label={statusLabel} status={status} />
        </div>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
    <div className="mt-5 rounded-3xl bg-white/10 p-4">
      <p className="text-sm font-bold text-white">{nextStep.label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">{nextStep.description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-4 w-full sm:w-auto" disabled={actionDisabled} onClick={onAction} type="button">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  </Card>
);
```

- [ ] **Step 7: Typecheck frontend components**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm run build
```

Expected: build succeeds or surfaces exact type errors to fix in the new types/components.

- [ ] **Step 8: Commit shared frontend flow components**

Run:

```powershell
cd ..\Frontend-arregla-ya
git add src/shared/types/api.ts src/shared/ui/status-chip.tsx src/shared/ui/empty-state.tsx src/shared/ui/success-state.tsx src/shared/ui/flow-progress.tsx src/shared/ui/next-action-panel.tsx
git commit -m "feat: add shared flow guidance components"
```

---

### Task 4: Request Detail Guided Quote-To-Booking Flow

**Files:**
- Modify: `src/features/service-requests/pages/service-requests-page.tsx`
- Modify: `src/features/service-requests/pages/service-request-detail-page.test.tsx`

- [ ] **Step 1: Update test data with flow fields**

In `service-request-detail-page.test.tsx`, extend the mocked request:

```ts
statusLabel: 'Cotizaciones recibidas',
statusDescription: 'Revisa las propuestas y elige con quien avanzar.',
availableActions: ['accept_quote'],
nextStep: {
  action: 'accept_quote',
  label: 'Comparar cotizaciones',
  description: 'Acepta una propuesta para coordinar fecha y horario.',
},
```

Extend mocked booking responses:

```ts
statusLabel: 'Pendiente de confirmacion',
statusDescription: 'La reserva espera confirmacion del profesional.',
availableActions: ['confirm_booking'],
nextStep: {
  action: 'confirm_booking',
  label: 'Confirmar reserva',
  description: 'El profesional debe confirmar el turno.',
},
hasPayment: false,
hasReview: false,
```

- [ ] **Step 2: Add failing UX assertions**

Add to the booking test:

```ts
expect(await screen.findByText('Comparar cotizaciones')).toBeInTheDocument();
expect(screen.getByText('Acepta una propuesta para coordinar fecha y horario.')).toBeInTheDocument();
expect(screen.getByText('Reserva')).toBeInTheDocument();
```

Add after booking creation:

```ts
expect(await screen.findByText('Reservas')).toBeInTheDocument();
```

- [ ] **Step 3: Run focused frontend test to verify failure**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm test -- src/features/service-requests/pages/service-request-detail-page.test.tsx --exclude .worktrees/**
```

Expected: FAIL because the new panel/progress copy is not rendered.

- [ ] **Step 4: Add detail progress helper**

In `service-requests-page.tsx`, add near detail component helpers:

```tsx
const flowStepOrder = ['open', 'quoted', 'assigned', 'completed'] as const;

const requestFlowSteps = (status: ServiceRequest['status']) => {
  const currentIndex = Math.max(flowStepOrder.indexOf(status as (typeof flowStepOrder)[number]), 0);

  return [
    { key: 'request', label: 'Solicitud', description: 'Pedido publicado', state: 'done' as const },
    {
      key: 'quote',
      label: 'Cotizacion',
      description: 'Comparar propuestas',
      state: currentIndex >= 1 ? ('current' as const) : ('upcoming' as const),
    },
    {
      key: 'booking',
      label: 'Reserva',
      description: 'Coordinar turno',
      state: currentIndex >= 2 ? ('current' as const) : ('upcoming' as const),
    },
    {
      key: 'done',
      label: 'Cierre',
      description: 'Pago y calificacion',
      state: status === 'completed' ? ('current' as const) : ('upcoming' as const),
    },
  ];
};
```

- [ ] **Step 5: Render `NextActionPanel` and `FlowProgress`**

Import:

```tsx
import { FlowProgress } from '@/shared/ui/flow-progress';
import { NextActionPanel } from '@/shared/ui/next-action-panel';
import { StatusChip } from '@/shared/ui/status-chip';
```

Replace the top detail hero card with:

```tsx
<NextActionPanel
  title={request.title}
  description={request.statusDescription ?? request.description}
  status={request.status}
  statusLabel={request.statusLabel ?? statusCopy[request.status]}
  nextStep={request.nextStep ?? {
    action: null,
    label: requestProgress[request.status],
    description: 'Revisa el detalle para ver acciones disponibles.',
  }}
/>

<FlowProgress steps={requestFlowSteps(request.status)} />
```

Replace quote badges:

```tsx
<StatusChip label={quoteStatusCopy[quote.status]} status={quote.status} />
```

- [ ] **Step 6: Run focused test**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm test -- src/features/service-requests/pages/service-request-detail-page.test.tsx --exclude .worktrees/**
```

Expected: PASS.

- [ ] **Step 7: Commit request detail flow guidance**

Run:

```powershell
cd ..\Frontend-arregla-ya
git add src/features/service-requests/pages/service-requests-page.tsx src/features/service-requests/pages/service-request-detail-page.test.tsx
git commit -m "feat: guide quote booking flow"
```

---

### Task 5: Bookings Next Actions And Completion CTA

**Files:**
- Modify: `src/features/bookings/pages/bookings-page.tsx`
- Modify: `src/features/bookings/pages/bookings-page.test.tsx`

- [ ] **Step 1: Add professional completion test**

Append to `bookings-page.test.tsx`:

```tsx
it('permite al profesional marcar un trabajo confirmado como terminado', async () => {
  useAuthMock.mockReturnValue({
    user: {
      id: 'pro-top',
      email: 'pro@arreglaya.com',
      fullName: 'Profesional Demo',
      role: 'profesional',
    },
    accessToken: 'token',
    refreshToken: 'refresh',
    isAuthenticated: true,
    isBootstrapping: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  });
  bookingsServiceMock.list.mockResolvedValue([
    {
      id: 'booking-1',
      serviceRequestId: 'request-1',
      serviceRequestTitle: 'Arreglo de canilla',
      clientId: 'client-1',
      clientName: 'Cliente Demo',
      professionalId: 'pro-top',
      professionalName: 'Ana Ruiz',
      scheduledAt: '2026-05-30T13:30:00.000Z',
      status: 'confirmed',
      statusLabel: 'Reserva confirmada',
      statusDescription: 'El turno esta confirmado y listo para avanzar.',
      availableActions: ['pay', 'complete_work'],
      nextStep: {
        action: 'pay',
        label: 'Pagar servicio',
        description: 'Completa el pago del servicio.',
      },
      hasPayment: false,
      hasReview: false,
      notes: 'Revisar perdida bajo mesada',
      createdAt: '2026-05-28T12:30:00.000Z',
    },
  ]);
  bookingsServiceMock.update.mockResolvedValue({
    id: 'booking-1',
    serviceRequestId: 'request-1',
    serviceRequestTitle: 'Arreglo de canilla',
    clientId: 'client-1',
    clientName: 'Cliente Demo',
    professionalId: 'pro-top',
    professionalName: 'Ana Ruiz',
    scheduledAt: '2026-05-30T13:30:00.000Z',
    status: 'completed',
    statusLabel: 'Trabajo completado',
    statusDescription: 'El trabajo fue finalizado por el profesional.',
    availableActions: ['review'],
    nextStep: {
      action: 'review',
      label: 'Calificar servicio',
      description: 'Deja tu resena para cerrar el flujo.',
    },
    hasPayment: false,
    hasReview: false,
    notes: 'Trabajo terminado',
    createdAt: '2026-05-28T12:30:00.000Z',
  });

  render(
    <TestProviders>
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    </TestProviders>,
  );

  expect(await screen.findByText('Arreglo de canilla')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Marcar trabajo como terminado' }));

  expect(await screen.findByText(/Trabajo marcado como terminado/)).toBeInTheDocument();
  expect(bookingsServiceMock.update.mock.calls[0]).toEqual(['booking-1', { status: 'completed' }]);
});
```

Also extend the existing mocked client pending booking with:

```ts
statusLabel: 'Pendiente de confirmacion',
statusDescription: 'La reserva espera confirmacion del profesional.',
availableActions: ['confirm_booking'],
nextStep: {
  action: 'confirm_booking',
  label: 'Confirmar reserva',
  description: 'El profesional debe confirmar el turno.',
},
hasPayment: false,
hasReview: false,
```

- [ ] **Step 2: Run focused test to verify failure**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm test -- src/features/bookings/pages/bookings-page.test.tsx --exclude .worktrees/**
```

Expected: FAIL because completion CTA is not rendered.

- [ ] **Step 3: Implement booking CTA helpers**

In `bookings-page.tsx`, import:

```tsx
import { NextActionPanel } from '@/shared/ui/next-action-panel';
import { StatusChip } from '@/shared/ui/status-chip';
```

Add helper:

```tsx
const canComplete = (booking: Booking, role: typeof user.role | undefined) =>
  booking.availableActions?.includes('complete_work') &&
  (role === 'profesional' || role === 'admin');
```

If TypeScript cannot reference `user` in helper scope, use:

```tsx
const canComplete = (booking: Booking) =>
  booking.availableActions?.includes('complete_work') &&
  (user?.role === 'profesional' || user?.role === 'admin');
```

Update success notice:

```tsx
setNotice(
  booking.status === 'confirmed'
    ? 'Reserva confirmada. El cliente recibira una notificacion de turno confirmado.'
    : booking.status === 'completed'
      ? 'Trabajo marcado como terminado. El cliente ya puede calificar el servicio.'
      : 'Reserva cancelada. El profesional recibira una notificacion y el turno queda libre.',
);
```

Replace status span with:

```tsx
<StatusChip label={booking.statusLabel ?? statusCopy[booking.status]} status={booking.status} />
```

Add next-step text inside each booking card before action buttons:

```tsx
<div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Proximo paso</p>
  <p className="mt-1 text-sm font-bold text-slate-950">
    {booking.nextStep?.label ?? statusCopy[booking.status]}
  </p>
  <p className="mt-1 text-sm leading-6 text-slate-600">
    {booking.nextStep?.description ?? booking.statusDescription ?? 'Revisa las acciones disponibles.'}
  </p>
</div>
```

Add action button:

```tsx
{canComplete(booking) ? (
  <Button
    className="w-full sm:w-auto"
    disabled={updateMutation.isPending}
    onClick={() =>
      updateMutation.mutate({
        bookingId: booking.id,
        status: 'completed',
      })
    }
    variant="secondary"
  >
    Marcar trabajo como terminado
  </Button>
) : null}
```

- [ ] **Step 4: Run focused test**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm test -- src/features/bookings/pages/bookings-page.test.tsx --exclude .worktrees/**
```

Expected: PASS.

- [ ] **Step 5: Commit booking next actions**

Run:

```powershell
cd ..\Frontend-arregla-ya
git add src/features/bookings/pages/bookings-page.tsx src/features/bookings/pages/bookings-page.test.tsx
git commit -m "feat: guide booking next actions"
```

---

### Task 6: Payment And Review Closing States

**Files:**
- Modify: `src/features/payments/pages/payments-page.tsx`
- Modify: `src/features/payments/pages/payments-page.test.tsx`
- Modify: `src/features/reviews/pages/reviews-page.tsx`
- Modify: `src/features/reviews/pages/reviews-page.test.tsx`

- [ ] **Step 1: Add payment success assertion**

In `payments-page.test.tsx`, after successful payment creation, assert:

```tsx
expect(await screen.findByText('Pago procesado exitosamente.')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Volver a reservas' })).toBeInTheDocument();
```

- [ ] **Step 2: Add review success assertion**

In `reviews-page.test.tsx`, after review submission, assert:

```tsx
expect(await screen.findByText('Gracias por calificar el servicio')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Volver a reservas' })).toBeInTheDocument();
```

- [ ] **Step 3: Run focused tests to verify failure**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm test -- src/features/payments/pages/payments-page.test.tsx src/features/reviews/pages/reviews-page.test.tsx --exclude .worktrees/**
```

Expected: FAIL because the new buttons/copy are not present yet.

- [ ] **Step 4: Improve payment success state**

In `payments-page.tsx`, import `useNavigate` if not already available and `SuccessState`:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { SuccessState } from '@/shared/ui/success-state';
```

Use:

```tsx
const navigate = useNavigate();
```

Replace the top `payment ? <Card ...>` success block with:

```tsx
{payment ? (
  <SuccessState
    title="Pago procesado exitosamente."
    description={
      payment.status === 'approved'
        ? `Comprobante ${payment.receiptNumber ?? payment.id}. Recibiras el detalle por email.`
        : 'Pago iniciado en MercadoPago. Completa el checkout para recibir el comprobante.'
    }
    actionLabel="Volver a reservas"
    onAction={() => void navigate('/app/reservas')}
  />
) : null}
```

Keep the existing checkout link block if `payment.checkoutUrl` is needed by rendering it below the success state.

- [ ] **Step 5: Improve review success state**

In `reviews-page.tsx`, import:

```tsx
import { SuccessState } from '@/shared/ui/success-state';
```

Replace the review success card with:

```tsx
<SuccessState
  title="Gracias por calificar el servicio"
  description="Tu opinion ayuda a otros clientes y mejora la calidad de la comunidad ArreglaYa."
  actionLabel="Volver a reservas"
  onAction={() => void navigate('/app/reservas')}
/>
```

- [ ] **Step 6: Run focused tests**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm test -- src/features/payments/pages/payments-page.test.tsx src/features/reviews/pages/reviews-page.test.tsx --exclude .worktrees/**
```

Expected: PASS.

- [ ] **Step 7: Commit payment and review closing states**

Run:

```powershell
cd ..\Frontend-arregla-ya
git add src/features/payments/pages/payments-page.tsx src/features/payments/pages/payments-page.test.tsx src/features/reviews/pages/reviews-page.tsx src/features/reviews/pages/reviews-page.test.tsx
git commit -m "feat: improve flow closing states"
```

---

### Task 7: Documentation And Full Verification

**Files:**
- Modify: `docs/ux-flow-redesign.md`

- [ ] **Step 1: Update implementation notes**

Append to `docs/ux-flow-redesign.md`:

```md
## Implemented In First Flow Slice

- Backend serializers expose flow metadata for requests and bookings.
- Booking transitions now validate the professional/admin completion path.
- Shared frontend components guide next actions and consistent states.
- Request detail, bookings, payments, and reviews now expose clearer next steps.

## Follow-Up Recommendations

- Add a dedicated dashboard summary endpoint per role.
- Normalize endpoint namespaces in a separate backend compatibility PR.
- Add a real notification center once push/email flows are productized.
- Revisit admin workflows after client/professional flow telemetry is available.
```

- [ ] **Step 2: Run backend verification**

Run:

```powershell
cd ..\Backend-arregla-ya
npm test
npm run build
```

Expected: all backend tests pass and build succeeds.

- [ ] **Step 3: Run frontend verification**

Run:

```powershell
cd ..\Frontend-arregla-ya
npm test -- --exclude .worktrees/**
npm run lint
npm run build
```

Expected: all frontend tests pass, lint has no errors, build succeeds. Existing non-blocking warnings must be reported.

- [ ] **Step 4: Restore generated TypeScript build info if changed**

Run:

```powershell
cd ..\Frontend-arregla-ya
git restore -- tsconfig.app.tsbuildinfo
```

Expected: generated build info is not included in the commit.

- [ ] **Step 5: Commit docs update**

Run:

```powershell
cd ..\Frontend-arregla-ya
git add docs/ux-flow-redesign.md
git commit -m "docs: record client flow implementation"
```

- [ ] **Step 6: Final status check**

Run:

```powershell
cd ..\Frontend-arregla-ya
git status --short --branch
cd ..\Backend-arregla-ya
git status --short --branch
```

Expected: both repos are on intended branches with only known untracked local `.worktrees/` artifacts outside commits.

---

## Self-Review

Spec coverage:

- Client request to review flow is covered by Tasks 1 through 6.
- Backend flow metadata and transition validation are covered by Tasks 1 and 2.
- Tailwind/no-MUI decision is preserved by using existing shared UI and Tailwind classes.
- Empty/success/progress/next-action components are covered by Task 3.
- Flow screens are covered by Tasks 4 through 6.
- Verification and docs are covered by Task 7.

No placeholders remain. The plan intentionally leaves chat, MUI migration, and full endpoint normalization out of scope.
