# 02 — Screen Specifications

Seven screens. All URLs are relative to the deployed root. Shared UI: gold salon monogram/logo, language toggle (EN / ગુજરાતી), connection indicator ("Live" / "Offline — changes saved locally"), and a consistent status colour vocabulary (see `01-brief.md`).

> Staff routes (`/reception`, `/barber/:barberId`, `/owner`) show a PIN gate before rendering. `/tv` is intentionally open because it is a passive waiting-area display.

---

## Screen 1 — Home

| Item | Detail |
|---|---|
| **URL** | `/` |
| **Purpose** | Answer "Is the salon open, how busy is it right now, and how long will I wait?" and give a single clear entry point to join. |
| **Target user** | Potential customer on their phone; also useful at the entrance. |

**UI elements**
- Header: salon logo + name, language toggle, small "Open/Closed" pill with a live dot.
- Hero card: "Skip the wait. We'll tell you when it's your turn." with a **Join Queue** primary button and, if the visitor already has an active token, a secondary **Track my spot** button.
- Summary strip (three stats): people waiting, estimated wait range, barbers available (`on duty − on break − busy`) out of on duty.
- Barber availability list: avatar/initials, name, status pill (Available / With customer / On Break / Off duty), optional current token.
- Footer: opening hours, "Online joining closes 30 minutes before closing", walk-ins always welcome.

**Button functionality**
- **Join Queue** → `/join`; disabled with a clear reason when online joining is closed or salon is closed (walk-ins still go to reception).
- **Track my spot** → `/status` using the token saved in this browser.
- **EN / ગુજરાતી** → switches language for the whole app and persists the choice.
- **Barber card** → informational only on Home (no action); avoids accidental state changes from a public page.

**Responsive layout**
- Phone: stacked hero → 3-stat strip (3 equal columns with short labels) → barber list. Sticky bottom Join button on small screens.
- Tablet/desktop: two-column hero (copy left, live summary right); stat strip and barber grid below.

**Empty / error states**
- No barbers on duty: "Our team is arriving soon — please check back shortly", Join disabled.
- Queue empty: "No one is waiting — you'll be served straight away."
- Salon closed: dark hero state, "Closed — walk-ins at the desk only if the salon is open", Join disabled.
- Store unavailable: friendly retry banner; Home still renders cached/seed data.

---

## Screen 2 — Join Queue

| Item | Detail |
|---|---|
| **URL** | `/join` |
| **Purpose** | Collect the minimum correct information, show an honest ETA/price preview, and create exactly one active queue entry. |
| **Target user** | Remote customer. |

**UI elements**
- Progress-less single-page form (short enough to scan): name, phone, services, barber, live summary card.
- Name input with inline validation (required, sensible length).
- Phone input with country code hint `+91`; accepts 10 digits after stripping spaces/hyphens/`+91`.
- Service cards with checkbox-style selection (max 3), showing bilingual name, duration, price and enabled/disabled state. Disabled services are hidden or clearly marked unavailable.
- Barber chooser: "Any Barber" card plus one card per on-duty barber; barbers on break are visible but unselectable with the message "This barber is on a break — choose Any Barber or someone else".
- Sticky summary: selected services, total duration, total price, **estimated wait**, and an inline note explaining the estimate.
- Consent line: "We'll show your token on screen — please keep this page open."
- Success state after submit: large token display, position, ETA, and buttons **View my status** / **Back to home**.

**Button functionality**
- **Select/deselect service** → toggles; a 4th selection is blocked with a toast "You can choose up to 3 services".
- **Choose barber / Any Barber** → updates selection and the ETA preview immediately.
- **Confirm & Join** → validates, checks the one-active-entry-per-phone rule, writes the entry through the shared queue engine, saves token locally, shows success state.
- **Use my saved details** (if a previous non-active visit exists) → pre-fills name/phone.
- **Cancel** (back arrow) → `/` without creating an entry.

**Responsive layout**
- Phone: one column, services as 2-card grid, barber cards horizontally scrollable, summary sticky at bottom.
- Tablet/desktop: two-column form (inputs left, live summary right); services in a 2–3 column grid.

**Empty / error states**
- No enabled services: "Services are being updated — please try again shortly" with Home link.
- No available barber (all on break/off duty): inline notice, "Any Barber" disabled, join blocked with explanation.
- Invalid phone: inline error "Enter a valid 10-digit mobile number".
- Duplicate active phone: inline error with the existing token and a **Track my spot** link.
- Online joining closed: banner "Online joining is closed for today — walk-ins are welcome at reception" with Home link.
- Write failure (offline store full / cloud error): explicit error, form values preserved, retry button.

---

## Screen 3 — My Status

| Item | Detail |
|---|---|
| **URL** | `/status` (uses the token saved in this browser); `/status/:token` (shareable direct link) |
| **Purpose** | Reassure the customer with a live token, position and ETA, and give timely prompts to move to the salon. |
| **Target user** | Customer who has joined. |

**UI elements**
- Hero: huge token (e.g. `A014`), status pill (Waiting / Called / In Chair / Done / Cancelled / No-show).
- Live cards: queue position (`#3`), estimated wait ("about 18 min"), preferred barber (name or Any Barber), selected services, joined time.
- Notification banner area with `aria-live="polite"`:
  - at position 2 → **"Start Coming"** ("Please start coming to the salon — you're next but one").
  - on Called → **"It's Your Turn"** ("Please come to reception / barber <name> now").
  - on Done → thank-you message.
- Small progress track: Waiting → Called → In Chair → Done with the current step highlighted.
- Cancel section at the bottom: **Cancel My Spot** (secondary/destructive style) with a confirmation dialog.

**Button functionality**
- **Cancel My Spot** → confirmation modal ("This releases your place permanently") → **Yes, cancel** sets status `cancelled` and shows a cancelled state; **Keep my spot** closes the modal.
- **Refresh / Retry** → re-reads store (normally automatic via live subscription).
- **Copy token** → copies token to clipboard with feedback.
- **Find my token** (when no saved token) → enter phone number to locate an active entry.

**Responsive layout**
- Phone: token hero first, then two stacked cards, notification banner pinned under hero, cancel at the bottom with comfortable tap target.
- Desktop: hero left, progress + details right, same notification behaviour.

**Empty / error states**
- No token saved: "You haven't joined a queue yet" + **Join Queue** CTA.
- Token not found / already finished: "This token is no longer active" + Join again.
- Cancelled / no-show: distinct dimmed/red state with "Join again" CTA (a new token will be issued at the end of the queue).
- Disconnected: last-known values stay visible with a "Reconnecting…" banner; no false "your turn" alerts from stale data.

---

## Screen 4 — Reception Dashboard

| Item | Detail |
|---|---|
| **URL** | `/reception` (PIN gate) |
| **Purpose** | Let the receptionist run the live queue fairly and fix exceptions quickly. |
| **Target user** | Receptionist. |

**UI elements**
- Top bar: date/time, salon open pill, online joining state, language toggle, **Add Walk-in** primary button.
- Left column: barber cards — name, status (Available / With customer / On Break / Off duty), current customer token + name + remaining service time, and a **Call Next** button (enabled only when eligible).
- Right column: waiting list in strict queue order — position number, token, name, phone (masked), services (bilingual), preferred barber, joined time, wait duration, action buttons **Call** (for that barber / Any Barber), **No-show** (for called entries), **Cancel**, and a row highlight when wait > 60 minutes with a "Waiting 1h 12m" badge.
- Small stats row: waiting count, longest wait, served today, no-shows today.

**Button functionality**
- **Add Walk-in** → modal with the same validation as Join Queue (name, phone, services, optional barber), source `walk-in`, allowed even when online joining is closed.
- **Call Next (barber card)** → engine picks the earliest eligible waiting entry for that barber (preferred = this barber or Any Barber), sets status `called`, assigns barber, records `calledAt`, and fires the TV/chime event.
- **Call (row)** → calls that specific waiting customer; if their preferred barber is unavailable, show why instead of calling.
- **No-show** → available for `called` entries; confirmation modal; sets `no_show`, frees the barber, and explains the customer must rejoin at the end with a new token.
- **Cancel** → confirmation; sets `cancelled` and frees the place.
- **Barber card tap** → opens that barber's mini-detail (no navigation away from the queue).
- PIN gate → role PIN, "Remember this device" for the session.

**Responsive layout**
- Desktop: two-column dashboard (barbers ~40%, waiting list ~60%), sticky header.
- Tablet: stacked barber strip (horizontal scroll) above the waiting list.
- Phone: segmented tabs **Barbers | Waiting**; waiting rows collapse to token + name + key action to keep the list usable; primary Add Walk-in becomes a floating action button.

**Empty / error states**
- No waiting customers: illustrated empty card "The queue is clear — enjoy the calm."
- No barbers on duty: "No barbers are on duty. Ask the owner to mark someone on duty."
- All barbers on break/busy: Call Next disabled with tooltip/explanation.
- Customer waiting > 60 min: amber/red row highlight (not an error, an attention state).
- Store error: non-blocking banner, actions disabled with retry.

---

## Screen 5 — Barber View

| Item | Detail |
|---|---|
| **URL** | `/barber/:barberId` (PIN gate) |
| **Purpose** | Give the barber a distraction-free station: who is in the chair, what to do, how long is left, who is next. |
| **Target user** | Barber. |

**UI elements**
- Header: barber name, availability toggle **Available / On Break** with clear colour state, language toggle.
- Current customer card: large token, name, selected services with duration, total duration, timer (remaining time, e.g. `08:42`) and a thin progress bar.
- Action buttons: **Start Service** (when called), **Done** (when in chair), with a confirm-on-Done step if the timer is not finished (optional, quick).
- Next customer card: token, name, services, preferred barber, estimate.
- Small note: "Next customer appears here automatically."

**Button functionality**
- **Start Service** → engine transition `called → in_chair`, sets `startedAt`, timer begins counting from total service duration.
- **Done** → engine transition `in_chair → done`, frees the chair, updates served-today stats and ETAs; the previously-called next customer is highlighted for reception.
- **Available / On Break** → toggles `onBreak`; going on break makes the barber ineligible for new calls and recalculates ETAs; the current in-chair customer is never interrupted by a break toggle (a warning confirms this).
- **Refresh** → re-subscribe/retry on connection error.

**Responsive layout**
- Phone: current customer hero + big Start/Done buttons at thumb height; timer large; next card below.
- Tablet/desktop: two columns — current service (left, larger) and next-up + availability controls (right).

**Empty / error states**
- No current customer: calm empty state "No one in your chair yet. You're available for the next caller."
- No next customer: "No one is waiting for you right now."
- On break: overlay-free banner "You're on a break — Call Next is paused for you."
- Called customer not arrived: show "Called at 10:42 · waiting for arrival" and offer no Start until reception/barber confirms; the no-show action lives at reception.
- Invalid barber id: "Barber not found" with a link back to Home.

---

## Screen 6 — Waiting Area TV

| Item | Detail |
|---|---|
| **URL** | `/tv` |
| **Purpose** | Make the waiting area self-service and calm: everyone can see progress without asking staff. |
| **Target user** | Everyone in the waiting area. |

**UI elements**
- Full-screen dark layout with salon logo, large clock, "Now serving" headline.
- Grid of barber cards (one per on-duty barber): name, availability, **current token** in very large gold type, current customer's first name, and "Next 5" token chips in queue order.
- Estimated wait per barber ("≈ 24 min"), plus a compact list of the next five names/tokens with their ETA.
- Newly called customer: gold pulse animation + "JUST CALLED" ribbon for ~30 seconds; audio chime once (Web Audio API oscillator, no external file), unlocked via a small **Enable sound** button because browsers block autoplay until a gesture.
- Bottom ticker: "Please keep your token ready • Online joining closes 30 min before closing • Walk-ins welcome".

**Button functionality**
- **Enable sound** → unlocks the browser AudioContext and plays a short confirmation chime; state remembered for the session.
- **Fullscreen** → requests browser fullscreen for the TV.
- **EN / ગુજરાતી** → language toggle (small, for demo).
- All other elements are read-only — this is a passive display.

**Responsive layout**
- TV/desktop: 2–4 column card grid, 1920px friendly, huge numerals, high contrast.
- Tablet: 2 columns.
- Phone (for testing): single column, smaller type but same information; no horizontal scroll.

**Empty / error states**
- No called/in-chair customers: "We'll be with you shortly — please watch this screen."
- Empty queue: "All caught up. You're welcome to join the queue on your phone."
- No barbers on duty: "Salon team arriving shortly."
- Disconnected: last-known state shown with a subtle "Reconnecting…" indicator rather than blank cards.

---

## Screen 7 — Owner Settings

| Item | Detail |
|---|---|
| **URL** | `/owner` (PIN gate) |
| **Purpose** | Configure the salon's services, team and queue policy, and see a compact daily snapshot. |
| **Target user** | Salon owner / manager. |

**UI elements**
- Tabbed layout: **Services**, **Barbers**, **Queue**, **Today**.
- Services tab: rows with English name, Gujarati name, duration (minutes), price, enabled switch; **Add service** and delete/archive actions. Max-3-selection rule is explained near the list.
- Barbers tab: on-duty toggle, on-break toggle, name (and optional bilingual name), **Add barber**.
- Queue tab: salon open/closed switch, online joining open/closed switch, opening and closing times, a reminder that online joining auto-closes 30 minutes before closing time while walk-ins stay open.
- Today tab: three stat cards — customers served, average waiting time (joined → called, minutes), no-shows — plus a short recent activity list.
- Unsaved-changes indicator and Save button where relevant; most toggles save immediately with clear feedback.

**Button functionality**
- **Add / Edit service** → inline form/modal; validates name in both languages, duration > 0, price ≥ 0; saving updates Join Queue immediately.
- **Enable/disable service** → hidden from Join Queue without deleting history.
- **Add / remove barber** → updates barber chooser and TV; a barber with an active customer cannot be removed until the service is done.
- **On duty / On break** → affects Call Next eligibility and ETAs on all screens.
- **Open/close online joining** → immediately enables/disables `/join` with the configured reason.
- **Reset demo data** (clearly marked, with double confirmation) → restores realistic seed data for the next demonstration.

**Responsive layout**
- Desktop: left vertical tab rail + wide content panel; settings table with generous columns.
- Tablet: horizontal tabs, two-column forms.
- Phone: horizontal scrollable tabs, one row per card, labels above inputs, sticky Save bar.

**Empty / error states**
- No services: "Add your first service so customers can join."
- No barbers: "Add a barber to start taking customers."
- Validation errors inline next to the field; invalid time range rejected with an explanation.
- Save failure: explicit banner, no silent loss of edits; unsaved values remain in the form.
