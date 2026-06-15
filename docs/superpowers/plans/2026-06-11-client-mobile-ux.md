# Client Mobile UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the full client journey so the real mobile viewport feels like a professional app, without turning desktop into a phone frame.

**Architecture:** Keep the existing React/Tailwind structure and API contracts. Add a small set of shared mobile layout primitives, then refactor client screens to use one clear mobile hierarchy: compact header, next action, primary content, and thumb-friendly CTA. Preserve desktop usability with existing `md:` layouts.

**Tech Stack:** React, TypeScript, TanStack Query, React Router, React Hook Form, Tailwind CSS, Vitest, Testing Library, Vite.

---

## File Structure

- Create `src/shared/ui/mobile-page.tsx`: small mobile-first layout primitives used by client flow screens.
- Create `src/shared/ui/mobile-page.test.tsx`: protects the shared primitives from regressions.
- Modify `src/app/layouts/app-shell.tsx`: improve mobile shell spacing, active labels, safe bottom nav, and route title handling.
- Modify `src/app/layouts/app-shell.test.tsx`: add client mobile nav coverage.
- Modify `src/features/auth/pages/dashboard-page.tsx`: convert client dashboard from metric panel to action launchpad.
- Modify `src/features/auth/pages/dashboard-page.test.tsx`: assert client next-action launchpad content.
- Modify `src/features/profile/pages/profile-page.tsx`: make profile a mobile utility screen for clients.
- Modify `src/features/profile/pages/profile-page.test.tsx`: keep logout/edit behavior covered.
- Modify `src/features/service-requests/pages/service-requests-page.tsx`: split mobile request creation/listing hierarchy and improve request cards.
- Create `src/features/service-requests/pages/service-requests-page.test.tsx`: add list/create mobile behavior coverage.
- Modify `src/features/service-requests/pages/service-request-detail-page.test.tsx`: protect quote decision ordering and metadata-gated actions.
- Modify `src/features/bookings/pages/bookings-page.tsx`: turn bookings into service timeline cards with next action emphasis.
- Modify `src/features/bookings/pages/bookings-page.test.tsx`: assert action priority and metadata gating.
- Modify `src/features/payments/pages/payments-page.tsx`: simplify payment into direct service, amount, method, confirm flow.
- Modify `src/features/payments/pages/payments-page.test.tsx`: keep payable filtering and success/error coverage.
- Modify `src/features/reviews/pages/reviews-page.tsx`: make review flow short, focused, and large-tap.
- Modify `src/features/reviews/pages/reviews-page.test.tsx`: keep star/comment behavior covered.
- Create `docs/qa/2026-06-11-client-mobile-ux-checklist.md`: manual visual QA checklist with viewport results.

## Task 1: Shared Mobile Layout Primitives

**Files:**
- Create: `src/shared/ui/mobile-page.tsx`
- Create: `src/shared/ui/mobile-page.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/ui/mobile-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';

import {
  MobileHero,
  MobilePage,
  MobileSection,
  MobileStats,
} from '@/shared/ui/mobile-page';

describe('mobile page primitives', () => {
  it('renders a compact mobile page with bottom-nav safe spacing', () => {
    render(
      <MobilePage>
        <p>Contenido mobile</p>
      </MobilePage>,
    );

    expect(screen.getByText('Contenido mobile').parentElement).toHaveClass('pb-24');
  });

  it('renders a mobile hero with optional badge and action', () => {
    render(
      <MobileHero
        eyebrow="Solicitudes"
        title="Segui tus pedidos"
        description="Revisa estados y acciones pendientes."
        badge="2 activas"
        action={<button type="button">Crear</button>}
      />,
    );

    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Segui tus pedidos' })).toBeInTheDocument();
    expect(screen.getByText('2 activas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('renders section heading and stats without requiring a card wrapper', () => {
    render(
      <MobileSection eyebrow="Seguimiento" title="Mis solicitudes" description="Estado general">
        <MobileStats
          stats={[
            { label: 'Activas', value: '2' },
            { label: 'Pagos', value: '$85.000' },
          ]}
        />
      </MobileSection>,
    );

    expect(screen.getByRole('heading', { name: 'Mis solicitudes' })).toBeInTheDocument();
    expect(screen.getByText('Activas')).toBeInTheDocument();
    expect(screen.getByText('$85.000')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/shared/ui/mobile-page.test.tsx --exclude .worktrees/**
```

Expected: fail because `src/shared/ui/mobile-page.tsx` does not exist.

- [ ] **Step 3: Add the shared mobile primitives**

Create `src/shared/ui/mobile-page.tsx`:

```tsx
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Card } from '@/shared/ui/card';

interface MobilePageProps {
  children: ReactNode;
  className?: string;
}

interface MobileHeroProps {
  action?: ReactNode;
  badge?: string;
  className?: string;
  description: string;
  eyebrow: string;
  title: string;
}

interface MobileSectionProps {
  action?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
}

interface MobileStatsProps {
  className?: string;
  stats: Array<{
    label: string;
    value: ReactNode;
  }>;
}

export const MobilePage = ({ children, className }: MobilePageProps) => (
  <div className={cn('space-y-4 pb-24 md:space-y-6 md:pb-0', className)}>
    {children}
  </div>
);

export const MobileHero = ({
  action,
  badge,
  className,
  description,
  eyebrow,
  title,
}: MobileHeroProps) => (
  <Card
    className={cn(
      'rounded-[28px] !bg-[#07152a] p-5 text-white shadow-lg shadow-slate-900/20 md:hidden',
      className,
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
          {eyebrow}
        </p>
        <h1 className="mt-2 break-words text-2xl font-black leading-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-200">{description}</p>
      </div>
      {badge ? (
        <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink">
          {badge}
        </div>
      ) : null}
    </div>
    {action ? <div className="mt-5">{action}</div> : null}
  </Card>
);

export const MobileSection = ({
  action,
  badge,
  children,
  className,
  description,
  eyebrow,
  title,
}: MobileSectionProps) => (
  <section className={cn('space-y-3', className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="break-words text-xl font-black leading-tight text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {badge}
    </div>
    {children}
    {action ? <div>{action}</div> : null}
  </section>
);

export const MobileStats = ({ className, stats }: MobileStatsProps) => (
  <div className={cn('grid grid-cols-3 gap-2', className)}>
    {stats.map((stat) => (
      <div
        className="min-w-0 rounded-2xl bg-slate-50 px-3 py-3 text-center"
        key={stat.label}
      >
        <p className="break-words text-base font-black text-slate-950">
          {stat.value}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {stat.label}
        </p>
      </div>
    ))}
  </div>
);
```

- [ ] **Step 4: Verify the tests pass**

Run the same focused command.

Expected: `1 passed`, `3 tests passed`.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/ui/mobile-page.tsx src/shared/ui/mobile-page.test.tsx
git commit -m "feat: add mobile layout primitives"
```

## Task 2: Mobile App Shell Polish

**Files:**
- Modify: `src/app/layouts/app-shell.tsx`
- Modify: `src/app/layouts/app-shell.test.tsx`

- [ ] **Step 1: Write the failing shell test**

Add this test to `src/app/layouts/app-shell.test.tsx`:

```tsx
it('prioriza la navegacion mobile del cliente sin mostrar rutas secundarias', () => {
  useAuthMock.mockReturnValue({
    user: {
      id: '1',
      email: 'cliente@arreglaya.com',
      fullName: 'Cliente Demo',
      role: 'cliente',
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

  render(
    <MemoryRouter initialEntries={['/app/solicitudes/request-1']}>
      <Routes>
        <Route path="/app" element={<AppShell />}>
          <Route path="solicitudes/:requestId" element={<p>Detalle</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Solicitudes')).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /Inicio/ })).not.toHaveLength(0);
  expect(screen.getAllByRole('link', { name: /Solicitudes/ })).not.toHaveLength(0);
  expect(screen.getAllByRole('link', { name: /Reservas/ })).not.toHaveLength(0);
  expect(screen.getAllByRole('link', { name: /Perfil/ })).not.toHaveLength(0);
  expect(screen.queryByRole('link', { name: 'Cotizaciones' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused shell test**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/app/layouts/app-shell.test.tsx --exclude .worktrees/**
```

Expected: the test may fail if the detail route title falls back incorrectly or if duplicate labels make the query ambiguous.

- [ ] **Step 3: Refine mobile route labels and shell spacing**

In `src/app/layouts/app-shell.tsx`, add a route-title resolver above `AppShell`:

```tsx
const getMobileTitle = (pathname: string, fallback: string) => {
  const matchedPath = Object.keys(mobileLabelByPath)
    .filter((path) =>
      path === '/app' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`),
    )
    .sort((current, next) => next.length - current.length)
    .at(0);

  return mobileLabelByPath[matchedPath ?? ''] ?? fallback;
};
```

Then replace the mobile title expression with:

```tsx
{getMobileTitle(
  location.pathname,
  activeItem?.label ?? 'Inicio',
)}
```

Update the mobile root container and bottom nav classes:

```tsx
<div className="min-h-screen overflow-x-clip bg-[#eef2f8] text-ink md:bg-gradient-to-b md:from-mist md:via-white md:to-slate-100">
```

stays unchanged, but replace the content wrapper class with:

```tsx
className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-4 md:flex-row md:gap-6 md:px-6 md:py-4"
```

Replace bottom nav class with:

```tsx
className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-2xl shadow-slate-900/15 backdrop-blur md:hidden"
```

- [ ] **Step 4: Verify shell tests pass**

Run the focused shell test again.

Expected: `1 file passed`, all shell tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/app/layouts/app-shell.tsx src/app/layouts/app-shell.test.tsx
git commit -m "feat: polish mobile app shell"
```

## Task 3: Client Dashboard And Profile Utility Screens

**Files:**
- Modify: `src/features/auth/pages/dashboard-page.tsx`
- Modify: `src/features/auth/pages/dashboard-page.test.tsx`
- Modify: `src/features/profile/pages/profile-page.tsx`
- Modify: `src/features/profile/pages/profile-page.test.tsx`

- [ ] **Step 1: Add dashboard test for client mobile launchpad**

In `src/features/auth/pages/dashboard-page.test.tsx`, add:

```tsx
it('prioriza la proxima accion del cliente antes que las metricas', async () => {
  useAuthMock.mockReturnValue({
    user: {
      id: 'client-1',
      email: 'cliente@arreglaya.com',
      fullName: 'Cliente Demo',
      role: 'cliente',
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
  serviceRequestsServiceMock.list.mockResolvedValue([
    {
      ...serviceRequest('quoted'),
      title: 'Arreglo de canilla',
      nextStep: {
        action: 'accept_quote',
        label: 'Comparar cotizaciones',
        description: 'Acepta una propuesta para coordinar fecha y horario.',
      },
    },
  ]);
  bookingsServiceMock.list.mockResolvedValue([]);

  renderPage();

  expect(await screen.findByText('Comparar cotizaciones')).toBeInTheDocument();
  expect(screen.getByText('Arreglo de canilla')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ver solicitud' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Add profile test for client utility hierarchy**

In `src/features/profile/pages/profile-page.test.tsx`, add:

```tsx
it('muestra el perfil cliente como pantalla utilitaria mobile', async () => {
  mockAuth(clientUser);
  profileServiceMock.me.mockResolvedValue(clientUser);

  renderPage();

  expect(await screen.findByText('Lucia Benitez')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Editar perfil' })).toHaveAttribute(
    'href',
    '#editar-perfil',
  );
  expect(screen.getByRole('button', { name: 'Cerrar sesion' })).toBeInTheDocument();
  expect(screen.queryByText('Profesional')).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/features/auth/pages/dashboard-page.test.tsx src/features/profile/pages/profile-page.test.tsx --exclude .worktrees/**
```

Expected: dashboard test fails because the next action launchpad does not exist yet.

- [ ] **Step 4: Implement dashboard client launchpad**

In `src/features/auth/pages/dashboard-page.tsx`, import `Button` and mobile primitives:

```tsx
import { Button } from '@/shared/ui/button';
import { MobileHero, MobilePage, MobileSection, MobileStats } from '@/shared/ui/mobile-page';
```

Add helper functions above `DashboardPage`:

```tsx
const firstActionableRequest = (requests: ServiceRequest[]) =>
  requests.find((request) => request.nextStep?.action || request.availableActions?.length);

const firstActionableBooking = (bookings: Booking[]) =>
  bookings.find((booking) => booking.nextStep?.action || booking.availableActions?.length);
```

Inside `DashboardPage`, after `const actions = actionByRole[role];`, add:

```tsx
const clientRequestAction = role === 'cliente'
  ? firstActionableRequest(serviceRequestsQuery.data ?? [])
  : undefined;
const clientBookingAction = role === 'cliente'
  ? firstActionableBooking(bookingsQuery.data ?? [])
  : undefined;
const clientNextAction = clientRequestAction
  ? {
      label: clientRequestAction.nextStep?.label ?? 'Ver solicitud',
      description:
        clientRequestAction.nextStep?.description ??
        'Revisa el estado y las acciones disponibles.',
      title: clientRequestAction.title,
      path: `/app/solicitudes/${clientRequestAction.id}`,
      cta: 'Ver solicitud',
    }
  : clientBookingAction
    ? {
        label: clientBookingAction.nextStep?.label ?? 'Ver reserva',
        description:
          clientBookingAction.nextStep?.description ??
          'Revisa el estado y las acciones disponibles.',
        title: clientBookingAction.serviceRequestTitle,
        path: '/app/reservas',
        cta: 'Ver reserva',
      }
    : undefined;
```

Replace the outer wrapper with:

```tsx
<MobilePage>
```

and close it at the end. Replace the mobile intro card block with:

```tsx
<MobileHero
  eyebrow="Inicio"
  title={`Hola, ${getFirstName(user?.fullName)}`}
  description={
    clientNextAction
      ? 'Tenes una accion pendiente para avanzar con tu servicio.'
      : introByRole[role]
  }
  badge={roleCopy[role]}
/>
```

Before the metrics grid, add:

```tsx
{role === 'cliente' && clientNextAction ? (
  <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:hidden">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-600">
      Proximo paso
    </p>
    <h2 className="mt-2 text-xl font-black leading-tight text-slate-950">
      {clientNextAction.label}
    </h2>
    <p className="mt-1 text-sm font-semibold text-slate-700">
      {clientNextAction.title}
    </p>
    <p className="mt-2 text-sm leading-6 text-slate-600">
      {clientNextAction.description}
    </p>
    <Button
      className="mt-4 w-full"
      onClick={() => void navigate(clientNextAction.path)}
      variant="secondary"
    >
      {clientNextAction.cta}
    </Button>
  </Card>
) : null}
```

Replace the metrics grid with:

```tsx
<MobileSection
  eyebrow="Resumen"
  title={role === 'cliente' ? 'Tu actividad' : 'Actividad'}
  description={role === 'cliente' ? 'Indicadores breves para ubicarte rapido.' : undefined}
>
  <MobileStats stats={metrics} />
</MobileSection>
```

- [ ] **Step 5: Refine profile only where it affects client mobile**

In `src/features/profile/pages/profile-page.tsx`, import `MobilePage` and wrap the root:

```tsx
import { MobilePage } from '@/shared/ui/mobile-page';
```

Replace:

```tsx
<div className="space-y-4 md:space-y-6">
```

with:

```tsx
<MobilePage>
```

and replace the closing `</div>` with `</MobilePage>`.

Keep professional-only mobile card guarded by:

```tsx
{user?.role === 'profesional' ? (
```

Do not show professional-only summary to clients.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/features/auth/pages/dashboard-page.test.tsx src/features/profile/pages/profile-page.test.tsx --exclude .worktrees/**
```

Expected: both test files pass.

Commit:

```powershell
git add src/features/auth/pages/dashboard-page.tsx src/features/auth/pages/dashboard-page.test.tsx src/features/profile/pages/profile-page.tsx src/features/profile/pages/profile-page.test.tsx
git commit -m "feat: improve client mobile dashboard and profile"
```

## Task 4: Requests List Mobile UX

**Files:**
- Modify: `src/features/service-requests/pages/service-requests-page.tsx`
- Create: `src/features/service-requests/pages/service-requests-page.test.tsx`

- [ ] **Step 1: Add request list tests**

Create `src/features/service-requests/pages/service-requests-page.test.tsx` with:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { ServiceRequestsPage } from '@/features/service-requests/pages/service-requests-page';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';

vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/service-requests/services/categories-service', () => ({
  categoriesService: { list: vi.fn() },
}));
vi.mock('@/features/service-requests/services/service-requests-service', () => ({
  serviceRequestsService: {
    create: vi.fn(),
    list: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const categoriesServiceMock = vi.mocked(categoriesService);
const serviceRequestsServiceMock = vi.mocked(serviceRequestsService);

const TestProviders = ({ children }: PropsWithChildren) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ServiceRequestsPage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'client-1',
        email: 'cliente@arreglaya.com',
        fullName: 'Cliente Demo',
        role: 'cliente',
        city: 'Buenos Aires',
        zone: 'Palermo',
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
    categoriesServiceMock.list.mockResolvedValue([
      { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
    ]);
    serviceRequestsServiceMock.list.mockResolvedValue([
      {
        id: 'request-1',
        title: 'Arreglo de canilla',
        description: 'Pierde agua bajo mesada',
        status: 'quoted',
        statusLabel: 'Cotizaciones recibidas',
        statusDescription: 'Revisa propuestas.',
        availableActions: ['accept_quote'],
        nextStep: {
          action: 'accept_quote',
          label: 'Comparar cotizaciones',
          description: 'Acepta una propuesta para coordinar fecha y horario.',
        },
        category: { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
        city: 'Buenos Aires',
        zone: 'Palermo',
        photos: [],
        createdAt: '2026-06-01T10:00:00.000Z',
      },
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('muestra solicitudes cliente con proximo paso visible', async () => {
    render(
      <TestProviders>
        <ServiceRequestsPage />
      </TestProviders>,
    );

    expect(await screen.findByText('Arreglo de canilla')).toBeInTheDocument();
    expect(screen.getByText('Comparar cotizaciones')).toBeInTheDocument();
    expect(screen.getByText('Acepta una propuesta para coordinar fecha y horario.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute(
      'href',
      '/app/solicitudes/request-1',
    );
  });

  it('muestra accion concreta cuando el cliente no tiene solicitudes', async () => {
    serviceRequestsServiceMock.list.mockResolvedValue([]);

    render(
      <TestProviders>
        <ServiceRequestsPage />
      </TestProviders>,
    );

    expect(await screen.findByText('Todavia no tenes solicitudes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear una solicitud' })).toHaveAttribute(
      'href',
      '#nueva-solicitud',
    );
  });
});
```

- [ ] **Step 2: Run list tests and verify expected failure**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/features/service-requests/pages/service-requests-page.test.tsx --exclude .worktrees/**
```

Expected: first test fails because request cards do not yet show `nextStep` label/description.

- [ ] **Step 3: Implement request card next-step hierarchy**

In `src/features/service-requests/pages/service-requests-page.tsx`, import:

```tsx
import { MobileHero, MobilePage, MobileSection, MobileStats } from '@/shared/ui/mobile-page';
```

Replace the root wrapper in `ServiceRequestsContent` with `MobilePage`.

Replace the mobile hero card with:

```tsx
<MobileHero
  eyebrow={mobileHero.eyebrow}
  title={mobileHero.title}
  description={mobileHero.description}
  badge={mobileHero.pill}
/>
```

Replace the stats card section with:

```tsx
<MobileSection
  eyebrow={trackingCopy.eyebrow}
  title={trackingCopy.title}
  description={trackingCopy.description}
  badge={<Badge>{trackingCopy.badge}</Badge>}
>
  <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
    <MobileStats stats={requestStats} />
  </Card>
</MobileSection>
```

Inside each request card, after location, add:

```tsx
<div className="mt-4 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3">
  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-700">
    Proximo paso
  </p>
  <p className="mt-1 text-sm font-black text-slate-950">
    {request.nextStep?.label ?? request.statusLabel ?? statusCopy[request.status]}
  </p>
  <p className="mt-1 text-sm leading-6 text-slate-600">
    {request.nextStep?.description ??
      request.statusDescription ??
      'Abri el detalle para revisar el estado.'}
  </p>
</div>
```

Keep the card CTA as the only client action:

```tsx
<Link
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400 sm:w-auto"
  to={`/app/solicitudes/${request.id}`}
>
  Ver detalle
</Link>
```

- [ ] **Step 4: Verify and commit**

Run the focused request list test.

Expected: `2 tests passed`.

Commit:

```powershell
git add src/features/service-requests/pages/service-requests-page.tsx src/features/service-requests/pages/service-requests-page.test.tsx
git commit -m "feat: improve mobile request list"
```

## Task 5: Request Detail And Quote Decision UX

**Files:**
- Modify: `src/features/service-requests/pages/service-requests-page.tsx`
- Modify: `src/features/service-requests/pages/service-request-detail-page.test.tsx`

- [ ] **Step 1: Add detail test for quote-first mobile order**

Add to `src/features/service-requests/pages/service-request-detail-page.test.tsx`:

```tsx
it('muestra la decision de cotizaciones antes del resumen operativo', async () => {
  renderPage();

  const quoteHeading = await screen.findByRole('heading', {
    name: 'Propuestas recibidas',
  });
  const summaryHeading = screen.getByText('Resumen');

  expect(quoteHeading.compareDocumentPosition(summaryHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});
```

- [ ] **Step 2: Run detail tests and verify failure**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/features/service-requests/pages/service-request-detail-page.test.tsx --exclude .worktrees/**
```

Expected: the new order test fails because summary currently appears before proposals.

- [ ] **Step 3: Reorder request detail sections**

In `ServiceRequestDetailContent`, keep this order after `FlowProgress`:

```tsx
{canReviewQuotes ? (
  <section className="space-y-4">
    {/* existing quote error card */}
    {/* proposals intro card */}
    {/* empty quotes state */}
    {/* quote cards */}
  </section>
) : null}

<div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
  {/* summary card */}
  {/* status card */}
</div>
```

In the proposals intro card, keep booking inputs below the heading only when an accepted quote exists:

```tsx
const hasAcceptedQuote = quotes.some((quote) => quote.status === 'accepted');
```

Then wrap the date/time/notes form block with:

```tsx
{hasAcceptedQuote && canBookAcceptedQuote ? (
  <div className="mt-5 grid gap-3 md:grid-cols-3">
    {/* existing Fecha tentativa, Horario, Notas para la reserva fields */}
  </div>
) : null}
```

In pending quote cards, keep `Aceptar` as `variant="secondary"` and `Rechazar` as `variant="ghost"`. Do not show booking CTA unless `quote.status === 'accepted' && canBookAcceptedQuote`.

- [ ] **Step 4: Verify and commit**

Run detail tests again.

Expected: all detail tests pass.

Commit:

```powershell
git add src/features/service-requests/pages/service-requests-page.tsx src/features/service-requests/pages/service-request-detail-page.test.tsx
git commit -m "feat: improve mobile quote decision flow"
```

## Task 6: Booking Timeline UX

**Files:**
- Modify: `src/features/bookings/pages/bookings-page.tsx`
- Modify: `src/features/bookings/pages/bookings-page.test.tsx`

- [ ] **Step 1: Add booking next-action priority test**

Add to `src/features/bookings/pages/bookings-page.test.tsx`:

```tsx
it('destaca el proximo paso del cliente en la card de reserva', async () => {
  bookingsServiceMock.list.mockResolvedValue([
    {
      id: 'booking-pay',
      serviceRequestId: 'request-1',
      serviceRequestTitle: 'Arreglo de canilla',
      clientId: 'client-1',
      clientName: 'Cliente Demo',
      professionalId: 'pro-top',
      professionalName: 'Ana Ruiz',
      scheduledAt: '2026-05-30T13:30:00.000Z',
      status: 'confirmed',
      statusLabel: 'Reserva confirmada',
      statusDescription: 'El turno esta confirmado.',
      availableActions: ['pay'],
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

  render(
    <TestProviders>
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    </TestProviders>,
  );

  expect(await screen.findByText('Proximo paso')).toBeInTheDocument();
  expect(screen.getByText('Pagar servicio')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pagar servicio' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused booking tests**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/features/bookings/pages/bookings-page.test.tsx --exclude .worktrees/**
```

Expected: should pass today or fail only if duplicate labels make the assertion ambiguous.

- [ ] **Step 3: Refine booking mobile layout**

In `src/features/bookings/pages/bookings-page.tsx`, import:

```tsx
import { MobileHero, MobilePage, MobileSection, MobileStats } from '@/shared/ui/mobile-page';
```

Replace root wrapper with `MobilePage`.

Replace the mobile hero card with:

```tsx
<MobileHero
  eyebrow={mobileCopy.eyebrow}
  title={mobileCopy.title}
  description={mobileCopy.description}
  badge={`${bookings.length} total`}
/>
```

Replace the stats section with:

```tsx
<MobileSection
  eyebrow="Seguimiento"
  title={mobileCopy.listTitle}
  description={mobileCopy.listDescription}
  badge={<Badge>{mobileCopy.badge}</Badge>}
>
  <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
    <MobileStats stats={bookingStats} />
  </Card>
</MobileSection>
```

Keep the next-step block visually prominent and above notes:

```tsx
<div className="mt-4 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3">
  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-700">
    Proximo paso
  </p>
  <p className="mt-1 text-sm font-black text-slate-950">
    {booking.nextStep?.label ?? statusCopy[booking.status]}
  </p>
  <p className="mt-1 text-sm leading-6 text-slate-600">
    {booking.nextStep?.description ??
      booking.statusDescription ??
      'Revisa las acciones disponibles.'}
  </p>
</div>
```

Order booking actions so client primary path wins:

```tsx
{canPay(booking) ? <Button variant="secondary">Pagar servicio</Button> : null}
{canReview(booking) ? <Button variant="secondary">Calificar servicio</Button> : null}
{canCancel(booking) ? <Button variant="ghost">Cancelar reserva</Button> : null}
```

Keep professional actions guarded by role as they are now.

- [ ] **Step 4: Verify and commit**

Run booking tests again.

Expected: all booking tests pass.

Commit:

```powershell
git add src/features/bookings/pages/bookings-page.tsx src/features/bookings/pages/bookings-page.test.tsx
git commit -m "feat: improve mobile booking timeline"
```

## Task 7: Payment And Review Task Flows

**Files:**
- Modify: `src/features/payments/pages/payments-page.tsx`
- Modify: `src/features/payments/pages/payments-page.test.tsx`
- Modify: `src/features/reviews/pages/reviews-page.tsx`
- Modify: `src/features/reviews/pages/reviews-page.test.tsx`

- [ ] **Step 1: Add payment summary test**

Add to `src/features/payments/pages/payments-page.test.tsx`:

```tsx
it('mantiene el pago enfocado en servicio, monto y accion principal', async () => {
  renderPage();

  expect(await screen.findByText('Cambio de termica')).toBeInTheDocument();
  expect(screen.getByLabelText('Servicio a pagar')).toBeInTheDocument();
  expect(screen.getByLabelText('Monto')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirmar pago' })).toBeInTheDocument();
  expect(screen.getByText('Resumen del servicio')).toBeInTheDocument();
});
```

- [ ] **Step 2: Add review tap target test**

Add to `src/features/reviews/pages/reviews-page.test.tsx`:

```tsx
it('presenta estrellas grandes y comentario opcional para mobile', async () => {
  renderPage();

  await screen.findByText('Cambio de termica');
  expect(screen.getByRole('radio', { name: '5 estrellas' })).toHaveClass('h-12');
  expect(screen.getByLabelText('Comentario opcional')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Enviar resena' })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run focused payment and review tests**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src/features/payments/pages/payments-page.test.tsx src/features/reviews/pages/reviews-page.test.tsx --exclude .worktrees/**
```

Expected: tests should pass or expose duplicate content that needs tighter accessible labels.

- [ ] **Step 4: Refine payment page**

In `src/features/payments/pages/payments-page.tsx`, import:

```tsx
import { MobileHero, MobilePage, MobileSection, MobileStats } from '@/shared/ui/mobile-page';
```

Replace root wrapper with `MobilePage`.

Replace mobile hero with:

```tsx
<MobileHero
  eyebrow="Pagos"
  title="Paga el servicio"
  description="Confirma el servicio, ingresa el monto y genera tu comprobante."
  badge={`${payableBookings.length} servicios`}
/>
```

Replace the stats section with `MobileSection` + `MobileStats`, and keep the payment form before recent payment history on mobile.

If there are no `payableBookings`, show this specific empty card before the form:

```tsx
{!payableBookings.length && !bookingsQuery.isLoading ? (
  <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
    <h3 className="text-lg font-black text-slate-950">
      No tenes servicios listos para pagar
    </h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">
      Cuando un trabajo quede habilitado para pago, lo vas a ver aca con su monto y comprobante.
    </p>
  </Card>
) : null}
```

- [ ] **Step 5: Refine review page**

In `src/features/reviews/pages/reviews-page.tsx`, import:

```tsx
import { MobileHero, MobilePage } from '@/shared/ui/mobile-page';
```

Replace root wrapper with `MobilePage`.

Replace the current mobile hero section with:

```tsx
<MobileHero
  eyebrow="Calificaciones"
  title="Califica el servicio"
  description="Elegi estrellas, agrega un comentario si queres y publica tu experiencia."
  badge={reviewState}
  action={
    <Button
      className="w-full border-white/10 bg-white/10 text-white hover:bg-white/20"
      variant="ghost"
      onClick={() => {
        void navigate('/app/reservas');
      }}
    >
      Volver a reservas
    </Button>
  }
/>
```

Keep the star buttons at least `h-12`, full-width grid on mobile, and disabled when `visibleReview` exists.

- [ ] **Step 6: Verify and commit**

Run the focused payment and review tests again.

Expected: both files pass.

Commit:

```powershell
git add src/features/payments/pages/payments-page.tsx src/features/payments/pages/payments-page.test.tsx src/features/reviews/pages/reviews-page.tsx src/features/reviews/pages/reviews-page.test.tsx
git commit -m "feat: improve mobile payment and review flows"
```

## Task 8: Full Verification And Mobile Visual QA

**Files:**
- Create: `docs/qa/2026-06-11-client-mobile-ux-checklist.md`

- [ ] **Step 1: Run full automated verification**

Run:

```powershell
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run --exclude .worktrees/**
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\typescript\bin\tsc -b
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\eslint\bin\eslint.js .
C:\Users\GCBA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build
```

Expected:

- Vitest passes all test files.
- TypeScript exits with code 0.
- ESLint exits with code 0. The existing Fast Refresh warning in `src/features/auth/context/auth-context.tsx` may remain if still present.
- Vite build exits with code 0. The existing chunk-size warning may remain if still present.

- [ ] **Step 2: Start the frontend for mobile browser QA**

Run:

```powershell
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173` or another available port.

- [ ] **Step 3: Inspect these mobile viewports**

Use the in-app browser or Playwright viewport emulation:

- `360x800`
- `390x844`
- `430x932`

Check routes:

- `/app`
- `/app/perfil`
- `/app/solicitudes`
- `/app/solicitudes/<existing-request-id>`
- `/app/reservas`
- `/app/pagos`
- `/app/calificaciones`

For each route, verify:

- No horizontal overflow.
- Bottom nav does not cover the final primary action.
- First viewport shows useful content or a clear action.
- Buttons do not wrap awkwardly.
- Long request titles and professional names remain readable.
- Empty/error/success states give one clear next step.

- [ ] **Step 4: Write QA checklist**

Create `docs/qa/2026-06-11-client-mobile-ux-checklist.md`:

```markdown
# Client Mobile UX QA Checklist

## Automated Verification

- Vitest:
- TypeScript:
- ESLint:
- Build:

## Viewports

- 360x800:
- 390x844:
- 430x932:

## Routes Checked

- /app:
- /app/perfil:
- /app/solicitudes:
- /app/solicitudes/:requestId:
- /app/reservas:
- /app/pagos:
- /app/calificaciones:

## Findings

- Blocking:
- Non-blocking:

## Result

- Ready for PR:
```

Fill every line with the actual result from the run. Use `None` when there are no findings in a section.

- [ ] **Step 5: Commit QA evidence**

```powershell
git add docs/qa/2026-06-11-client-mobile-ux-checklist.md
git commit -m "docs: record client mobile ux qa"
```

## Final Branch Completion

- [ ] **Step 1: Check status**

```powershell
git status --short --branch
```

Expected: clean working tree on `feature/client-mobile-ux`.

- [ ] **Step 2: Summarize commits**

```powershell
git log --oneline origin/main..HEAD
```

Expected commits include:

- `docs: define client mobile ux design`
- `feat: add mobile layout primitives`
- `feat: polish mobile app shell`
- `feat: improve client mobile dashboard and profile`
- `feat: improve mobile request list`
- `feat: improve mobile quote decision flow`
- `feat: improve mobile booking timeline`
- `feat: improve mobile payment and review flows`
- `docs: record client mobile ux qa`

- [ ] **Step 3: Ask for user validation before push**

Report:

- Screens changed.
- Tests/build run.
- Known non-blocking warnings.
- QA checklist path.

Do not push until the user validates what will be sent to the server.
