# UX Flow Redesign

## Scope

This document defines the first redesign slice for ArreglaYa: the client end-to-end flow from service request creation to quote acceptance, booking, payment, work completion, and review.

The frontend will continue using React, TypeScript, Tailwind CSS, React Query, React Router, React Hook Form, and the existing shared UI components. We will not migrate to MUI in this slice.

The backend remains Express, Prisma, PostgreSQL, and JWT. Backend changes should enrich current contracts instead of replacing the full endpoint structure.

## Current Problems

- The app has the domain states needed for requests, quotes, bookings, payments, and reviews, but screens often require users to infer the next step.
- After a client accepts a quote, the UI does not clearly communicate that the next action is choosing a date and booking the professional.
- The app can display completed bookings, payments, and reviewable services, but the visible workflow does not clearly expose the transition from confirmed work to completed work.
- Frontend pages duplicate status logic and decide actions locally instead of receiving available actions from the backend.
- Empty, loading, success, and error states exist in some pages but are inconsistent across the flow.
- Admin and professional views exist, but their operational CTAs are not always tied to an obvious state transition.
- The current dashboards are useful summaries, but they do not yet act as role-specific launchpads for pending work.

## Redesigned Client Flow

1. **Create service request**
   - The client enters a guided form with clear steps: problem, category, location, details, and confirmation.
   - On success, the app shows a confirmation state and sends the user to the request detail.

2. **Wait for quotes**
   - The request detail shows the current state, expected next event, and a progress timeline.
   - If there are no quotes, the user sees a useful empty state instead of a dead end.

3. **Compare and accept quote**
   - Quote cards make amount, professional, message, and status easy to compare.
   - Accepting a quote does not feel like the end of the flow. The next visible step is booking date and time.

4. **Create booking**
   - The client selects date, time, and notes for the accepted quote.
   - The booking starts as `pending`.
   - The client sees that the app is waiting for professional confirmation.

5. **Professional confirms booking**
   - The professional sees a clear `Confirm booking` CTA for pending bookings.
   - Confirmation moves the booking to `confirmed`.

6. **Client pays**
   - A confirmed booking exposes the client CTA `Pay service`.
   - Payment success shows receipt details and a path back to bookings or history.
   - Payment errors are actionable and allow retry.

7. **Professional completes work**
   - The professional or admin can move a confirmed booking to `completed`.
   - This closes the current flow gap where completed bookings can be consumed but are hard to reach from UI.

8. **Client reviews**
   - Completed bookings expose the client CTA `Review service`.
   - Review submission shows a success state and closes the flow.

## Backend Contract

Current endpoints should remain compatible. The first backend slice should enrich serialized `ServiceRequest` and `Booking` responses with frontend-ready state metadata.

Recommended shared shape:

```ts
type FlowAction =
  | 'create_quote'
  | 'accept_quote'
  | 'book'
  | 'confirm_booking'
  | 'pay'
  | 'complete_work'
  | 'review';

interface FlowNextStep {
  action: FlowAction | null;
  label: string;
  description: string;
  path?: string;
}

interface FlowState {
  statusLabel: string;
  statusDescription: string;
  availableActions: FlowAction[];
  nextStep: FlowNextStep;
}
```

### ServiceRequest Additions

- `statusLabel`
- `statusDescription`
- `availableActions`
- `nextStep`
- Optional when cheap to compute:
  - `quoteCount`
  - `acceptedQuoteId`

### Booking Additions

- `statusLabel`
- `statusDescription`
- `availableActions`
- `nextStep`
- `hasPayment`
- `hasReview`

### Booking Transition Rules

- Client or admin can cancel a `pending` booking.
- Professional or admin can confirm a `pending` booking.
- Professional or admin can complete a `confirmed` booking.
- Client or admin can pay a `confirmed` or `completed` booking.
- Client or admin can review only a `completed` booking.
- A booking can be reviewed only once.

Invalid transitions should return clear messages, for example:

- `La reserva debe estar confirmada antes de marcarla como finalizada.`
- `Solo el profesional asignado puede finalizar este trabajo.`
- `Este servicio ya fue calificado.`

## Frontend Components

The redesign should introduce reusable UI primitives instead of duplicating flow logic per page.

### FlowProgress

Displays the lifecycle: request, quote, booking, payment, completion, review. On mobile it should collapse into a compact vertical list.

### NextActionPanel

Shows the current state, what it means, and the primary CTA. This should be the main guide on request and booking screens.

### GuidedFormShell

Frames multi-step forms with step labels, progress, primary/secondary actions, and validation feedback.

### StatusChip

Provides consistent status colors and labels for request, quote, booking, payment, and review states.

### EmptyState

Explains what is missing and what the user can do next.

### SuccessState

Confirms completed actions such as request creation, booking creation, payment approval, work completion, and review submission.

## Screens In Scope

### `/app/solicitudes`

- Convert request creation into a guided form.
- Improve request cards with state, progress, and next step.
- Add a useful empty state with a primary CTA.

### `/app/solicitudes/:requestId`

- Add `NextActionPanel`.
- Add `FlowProgress`.
- Make quote acceptance and booking feel like one guided sequence.
- Make accepted quotes clearly lead to scheduling.

### `/app/reservas`

- Show next step per booking.
- Client states:
  - `pending`: waiting for professional confirmation.
  - `confirmed`: pay service.
  - `completed`: review service.
- Professional states:
  - `pending`: confirm booking.
  - `confirmed`: mark work as completed.
- Show inline success feedback after state changes.

### `/app/pagos`

- Explain which booking is being paid.
- Improve success, receipt, retry, and return navigation.

### `/app/calificaciones`

- Show only reviewable completed bookings.
- Preselect booking when navigating from a completed booking.
- Show a closing success state after review submission.

### Professional Support

The first PR should add only the professional actions required to unblock the client flow:

- Confirm pending bookings.
- Complete confirmed bookings.

## Out Of Scope For This Slice

- Migrating to MUI.
- Real chat or messaging.
- Full endpoint normalization across `/api/users`, `/users`, and similar route variants.
- Large admin redesign beyond the data needed to inspect flow state.
- Heavy decorative animation.

## UX Principles

- Each screen has one primary purpose.
- Each state explains what happened and what happens next.
- Primary, secondary, and destructive actions are visually distinct.
- Loading, success, empty, and error states are consistent.
- Mobile layouts prioritize action clarity and avoid buried CTAs.
- Animation should be subtle and tied to state changes, not decorative.
- Backend should provide state and action metadata so the frontend avoids fragile duplicated logic.

## Testing And Verification Plan

Backend:

- Serializer tests for enriched `ServiceRequest` and `Booking` flow metadata.
- Booking transition tests for confirm, complete, cancel, invalid transitions, and authorization.
- Review tests ensuring only completed bookings can be reviewed once.

Frontend:

- Component tests for `NextActionPanel`, `FlowProgress`, `StatusChip`, and empty/success states.
- Page tests for:
  - request creation success;
  - quote acceptance leading to booking;
  - booking confirmation/completion actions;
  - payment success/error state;
  - review submission success.

Commands:

- Backend tests and build.
- Frontend tests, lint, and build.
- Real smoke flow when backend and database are available.

## Implementation Order

1. Backend flow metadata and booking completion transition.
2. Frontend types and service contract updates.
3. Shared flow components.
4. Request list and request detail redesign.
5. Bookings flow redesign.
6. Payments and reviews polish.
7. Tests, build, lint, smoke verification.

## Decisions

- Keep Tailwind and current shared components.
- Use backend-provided `availableActions` and `nextStep` as the source of truth for CTAs.
- Keep current endpoints unless a specific contract blocks this slice.
- Document broader endpoint normalization as future work.
- Prefer one coherent client flow PR over many small visual-only tweaks, but keep implementation commits scoped by layer.

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
