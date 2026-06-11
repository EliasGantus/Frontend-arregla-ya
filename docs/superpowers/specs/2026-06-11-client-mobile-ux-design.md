# Client Mobile UX Design

## Context

ArreglaYa is a web application, but the client-facing product should feel like a professional mobile app when used on real mobile viewports. Desktop must remain functional and clean, but this pass is not about presenting desktop as a phone frame. The priority is the real mobile experience around the complete client flow.

The latest client flow work added backend-driven next steps, action availability, and safer state transitions. This design builds on that behavior, but it should not preserve weak UX patterns from the current screens just because they already exist. Existing components may be reused only when they support a clear, app-like mobile experience.

## Goal

Create a coherent mobile-first UX for the complete client journey:

1. Dashboard and profile entry points.
2. Service request list and request creation.
3. Service request detail and quote comparison.
4. Booking history and next actions.
5. Payment flow.
6. Review flow.

The result should feel intentional at 360px to 430px wide, with clear hierarchy, ergonomic actions, readable content, and no desktop-first leftovers squeezed into mobile.

## Non-Goals

- Do not make desktop look like a phone centered on the page.
- Do not migrate the UI framework or replace Tailwind.
- Do not redesign professional or admin workflows except where shared layout changes require minor compatibility.
- Do not add new backend behavior unless a frontend bug exposes a missing contract.
- Do not expand scope into animations, native packaging, or PWA installation.

## Design Principles

### Mobile Is The Primary Surface

Each client screen should be evaluated first at mobile sizes. Desktop styles are secondary adaptations. A screen is not acceptable if it only works because desktop has enough horizontal space.

### One Clear Primary Action

Every step should make the next client action obvious. If the backend exposes `nextStep` or `availableActions`, the mobile UI should use it to prioritize one main CTA and demote secondary actions.

### Content Before Decoration

Cards, shadows, badges, and hero areas must help scanning and decision-making. Avoid decorative blocks that push the useful action below the fold.

### Thumb-Friendly Controls

Primary actions should be full-width or easy to tap, with stable height and enough spacing. Destructive or secondary actions should remain reachable without competing visually with the main path.

### State Is UX

Statuses are not just labels. Pending quote, accepted quote, assigned booking, completed booking, paid booking, and reviewed booking must each explain what the client can do next.

## Anti-Patterns To Remove

- Desktop dashboard composition squeezed into a single column.
- Oversized mobile hero cards that consume the first viewport without enabling action.
- Nested card-in-card layouts.
- Multiple equally loud CTAs on the same mobile viewport.
- Long explanatory paragraphs above core actions.
- Horizontal grids that collapse awkwardly into dense mobile cards.
- Buttons with labels that wrap or change layout height.
- Status chips that are visually present but do not clarify the next action.
- Forms that feel like admin panels instead of guided mobile tasks.
- Success/error states that leave the user unsure where to go next.

## Screen Model

### Shared Mobile Shell

The app shell keeps bottom navigation stable and role-aware. Mobile screens should use a consistent page rhythm:

- Compact top identity or back affordance.
- Optional status or next-action panel when it helps the current task.
- Main content sections ordered by decision priority.
- Bottom spacing that accounts for the fixed bottom nav.

The bottom nav should remain predictable and should not compete with screen-level primary CTAs.

### Dashboard

The client dashboard should act as a launchpad, not an analytics panel. On mobile it should prioritize:

1. The next pending action, if one exists.
2. Active request or booking summary.
3. Fast entry points for creating a request, reviewing bookings, or paying/reviewing completed work.

Metric cards are allowed only if they support action. They should not dominate the first viewport.

### Profile

Profile should be a utility screen. On mobile:

- Identity and role are visible immediately.
- Edit profile and logout are easy to find.
- Long forms remain grouped and readable.
- Professional-only sections must not distract client users.

### Service Requests List

The request list should be the client's operational home. Mobile cards should show:

- Title and category.
- Status label with strong visual hierarchy.
- Short next-step text.
- Location/date metadata.
- One obvious action to open the detail.

Creation should feel guided and compact. If the creation form is on the same page, it must not bury the existing requests. If needed, the form can become an explicit create section reached by CTA or anchor.

### Service Request Detail And Quotes

This screen is the main decision point. Mobile order:

1. Back affordance.
2. Current request status and next action.
3. Quote comparison, if quotes exist.
4. Request details and photos.

Quote cards should make price, professional, rating, notes, and action easy to compare. Accept/reject actions must appear only when valid, and accepted/closed quotes should visually explain why no action is available.

### Bookings

Bookings should read like a service timeline. Mobile cards should emphasize:

- Service title.
- Professional.
- Scheduled time.
- Current status.
- Next action such as confirm, pay, review, or view detail.

Completed bookings should not feel like dead records; they should lead naturally to payment or review when available.

### Payments

Payment should be direct and low-noise:

- Show what service is being paid.
- Show amount and professional clearly.
- Use one primary pay action.
- Show success with receipt context and a next step.
- If checkout is initiated externally, explain that state briefly and offer a clear return path.

### Reviews

Review should be short and satisfying:

- The service/professional context is visible.
- Star selection is large and easy to tap.
- Comment is optional and secondary.
- Submit is full-width and stable.
- Success returns the client to bookings or service history.

## Component Strategy

Use existing components only when they support the target experience. Refine shared UI where it reduces duplication and improves consistency:

- Mobile page header or section header pattern.
- Next action panel refinements.
- Status chip refinements.
- Empty state and success state consistency.
- Mobile card pattern for request, quote, booking, payment, and review items.

Do not create a large abstract design system before improving screens. Extract shared components only after seeing repeated mobile structure across at least two screens.

## Data And Behavior

Frontend action visibility should keep relying on backend metadata:

- `availableActions` decides which actions are shown.
- `nextStep` decides the highlighted action and guidance.
- Status labels and descriptions should come from API when available.

The UI should not guess that an action is possible based only on raw status if the API already exposes explicit action metadata.

## Error, Empty, And Loading States

Every client screen needs mobile-specific behavior for:

- Loading: compact skeleton or stable placeholder, not large blank space.
- Empty: explain the state and provide one next action.
- Error: describe what failed and provide retry or safe navigation.
- Success: confirm what happened and route to the next useful step.

These states should not use generic copy if the current flow can provide specific context.

## Verification Plan

Use both automated and visual checks:

- Existing frontend tests must remain green.
- Add or adjust tests for action visibility when mobile refactors affect behavior.
- Run TypeScript, ESLint, and production build.
- Use browser inspection at 360x800, 390x844, and 430x932.
- Check the complete client flow in mobile viewport:
  - dashboard
  - profile
  - requests list
  - request detail
  - quote decision
  - bookings
  - payment
  - review

Manual visual acceptance should check:

- No horizontal overflow.
- No overlapping bottom nav and primary actions.
- Buttons do not wrap awkwardly.
- First viewport shows useful content or action.
- Long titles, long zones, and long professional names remain readable.
- Empty, loading, error, and success states feel intentional.

## Acceptance Criteria

- The client flow is comfortable and coherent on real mobile viewport sizes.
- Desktop remains usable but is not the design driver.
- The mobile bottom navigation remains stable and predictable.
- Each client screen has one clear primary action when an action is available.
- Invalid actions remain hidden or disabled based on API metadata.
- The UI avoids the listed anti-patterns.
- Verification commands pass, with only explicitly documented non-blocking warnings allowed.
