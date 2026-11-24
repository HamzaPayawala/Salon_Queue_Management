# 01 — Project Brief
**Project:** Salon Queue Management System  
**Document version:** 1.0  
**Date:** 24 November 2026  
**Status:** For review — no application code has been written yet.

---

## 1. Problem statement

Salons in busy urban areas (the project context is Gujarat, India) commonly manage their queue with paper tickets or by shouting names in the waiting area. This creates several problems:

- Customers must physically sit in the salon to know when their turn is coming, so waiting time is wasted and the waiting area becomes crowded.
- Nobody can see a reliable estimated waiting time; customers cannot plan food, work or travel around their appointment.
- Disputes occur when someone who arrived later is called first, especially when a customer prefers a particular barber.
- Receptionists have no single place to see barber availability, waiting customers, walk-ins and no-shows.
- Barbers do not know who is next or how long the current service should take.
- Owners cannot see basic daily performance (served, average wait, no-shows) or change services/prices without editing code.
- A single device or browser window is not enough: the reception desk, barber station, TV and customers' phones must all see the *same* queue at the same time.

**Proposed solution:** a responsive web app where customers join a shared, persistent queue remotely, watch their live position and estimated wait, and are notified when they should come over. Reception, barber, TV and owner screens all read and write the same queue through one shared rule engine and one shared data store.

---

## 2. Target users

| User | Where they are | What they need |
|---|---|---|
| Remote customer | Phone, anywhere in the salon's locality | Join the queue, choose up to 3 services and a barber (or "Any Barber"), see token/position/ETA, get "Start Coming" and "It's Your Turn" alerts, cancel if plans change. |
| Walk-in customer | At the reception desk | Added by the receptionist; follows the same FCFS rules and gets a token. |
| Receptionist | Desk computer or tablet | See barbers and their current customers, see the ordered waiting list, add walk-ins, call next, mark no-show, cancel, and spot anyone waiting over 60 minutes. |
| Barber | Barber station (phone/tablet) | See current customer and services, run a service timer, start/done, see next customer, toggle Available / On Break. |
| Owner / manager | Any device | Enable/disable services, edit bilingual names, durations and prices, manage barbers on duty, open/close online joining, view today's statistics. |
| Waiting-area audience | Waiting-area TV | Large, glanceable view of each barber's current token, next five tokens, ETAs and newly called names. |

**Access model (demo-friendly):** customer screens are open; staff screens are protected by a simple role PIN gate. This is intended for an academic demonstration, not for public deployment. Security limits are documented in the final README.

---

## 3. Must-have features

1. **Remote join queue** — name, validated 10-digit phone, 1–3 services, preferred barber or Any Barber, live total duration/price and ETA preview, confirmation.
2. **One active entry per phone** — duplicate active entries are rejected with a clear message and a link to the existing status.
3. **Live "My Status"** — unique token, current position, ETA, automatic status updates, "Start Coming" at position 2, "It's Your Turn" when called, cancel with confirmation.
4. **Centralised queue engine** — one module implements all queue rules (FCFS, barber affinity, one customer per chair, status transitions, no-show window, cancellation) so every screen behaves identically.
5. **Reception dashboard** — barber cards with current customer, ordered waiting list, add walk-in, call next (per barber), no-show, cancel, 60-minute highlighting.
6. **Barber view** — current customer and services, live service timer, Start / Done, next customer preview, Available / On Break toggle that immediately affects eligibility and ETAs.
7. **Waiting-area TV** — all barbers, current token per barber, next five tokens, ETAs, highlight on new call, optional chime (unlocked by a user gesture because browsers restrict autoplay).
8. **Owner settings** — bilingual service management (enable/disable, duration, price), barbers on duty, open/close online joining, today's stats (served, average wait, no-shows).
9. **English / Gujarati toggle** — all static labels come from central language files; service names are stored in both languages.
10. **Shared persistent storage and sync** — changes appear across browser windows and devices without refresh; local fallback keeps the demo working offline/on one machine.
11. **Responsive, premium UI** — dark charcoal + gold theme, purpose-built layouts for phone/tablet/desktop, loading/empty/error states, subtle animations, Lucide icons.

---

## 4. Features that will NOT be implemented

- Online payments, UPI, invoices or billing.
- Future-date appointments or calendar booking (today's live queue only).
- SMS, WhatsApp, push services or email notifications (in-app/browser notifications only).
- Loyalty points, memberships, review/rating system.
- Multiple salon branches, multi-tenant accounts or staff user management with signup.
- AI/ML prediction, complex analytics dashboards or historical reports.
- Native mobile apps (the responsive web app is the deliverable).
- Real authentication for public deployment — the PIN gate is a demo access control only.

---

## 5. Look and feel

- **Background:** dark charcoal `#1F2937`, with `#111827` / `#374151` used for depth and separation.
- **Accent:** gold `#D4A017` for primary buttons, active tabs, emphasis, and the salon monogram. Avoid overusing it — it should signal actions and status.
- **Cards:** generous `rounded-2xl` corners, thin `#374151` borders, soft shadows, subtle gold gradient only on hero/focused cards.
- **Typography:** modern sans-serif (`Inter` or system stack via Tailwind), with a Gujarati-capable fallback (`Noto Sans Gujarati`) so toggled text renders cleanly. Clear hierarchy: large numeric tokens, medium headings, small muted metadata.
- **Status colours:** waiting = slate/blue, called = gold, in chair = amber/green, done = emerald, cancelled = slate muted, no-show = red, on break = orange.
- **Motion:** 150–250 ms transitions, small fade/slide entrance animations, pulsing dot for live updates; respect `prefers-reduced-motion`.
- **Layout:** mobile-first. Phone = single column with sticky bottom actions; tablet = two columns where useful; desktop = dashboard grids. TV screen uses very large type and high contrast for distance reading.
- **Tone:** calm, premium salon — short friendly copy, no dense admin tables, no generic dashboard shells. Each screen is designed around the single job its user is doing.
- **Accessibility:** visible focus rings, minimum 44 px touch targets, text labels alongside icons, `aria-live` regions for status/notifications.

---

## 6. Success criteria for evaluation

- A customer can join on one device and see the same token/position update on another device/window within a second or two.
- Reception can add a walk-in, call a customer, and the barber and TV screens update automatically.
- A preferred-barber customer is never assigned to a different barber, and no barber ever has two active customers.
- All 7 screens work on a phone width of 360 px and on a desktop/TV width of 1920 px without horizontal scrolling.
- English↔Gujarati toggle changes every visible static label without losing queue state.
- Production build succeeds, and all environment/configuration needed for deployment is documented.
