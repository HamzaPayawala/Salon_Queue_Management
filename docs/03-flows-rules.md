# 03 — Flows, Rules and Test Checklist

This document is the **single source of truth for queue behaviour**. The implementation keeps these rules in `src/queue/queueEngine.js` (pure functions) plus `src/queue/queueStore.js` (persistence/sync). Every screen calls the engine — no screen invents its own queue logic.

---

## 1. Data model (conceptual)

```js
// One document shared by all screens
{
  salon: {
    name, logoInitials,
    isOpen: true,
    onlineJoiningOpen: true,
    openingTime: "10:00", closingTime: "20:00", // 24h, editable by owner
    staffPins: { reception: "1234", barber: "2222", owner: "3333" } // demo only
  },
  services: [
    { id, nameEn, nameGu, durationMin, price, enabled }
  ],
  barbers: [
    { id, name, nameGu, onDuty, onBreak }
  ],
  entries: [
    {
      id, token,                    // e.g. A014 (online), W007 (walk-in)
      name, phone,
      serviceIds: ["haircut", "beard"],
      preferredBarberId: "b1" | "any",
      assignedBarberId: "b1" | null,
      source: "online" | "walk-in",
      status: "waiting" | "called" | "in_chair" | "done" | "cancelled" | "no_show",
      createdAt, calledAt, startedAt, completedAt,
      notifiedComingAt, notifiedTurnAt
    }
  ],
  lastCall: { token, barberId, at } // drives TV highlight + chime
}
```

**Active statuses** = `waiting`, `called`, `in_chair`. Done/cancelled/no-show are terminal and do not block the phone number from joining again.

---

## 2. Remote customer flow

1. Customer opens `/` → sees open status, waiting count, ETA, barber availability.
2. Taps **Join Queue** → `/join`.
3. Enters name and 10-digit phone; selects 1–3 enabled services; chooses a barber or **Any Barber**.
4. UI recomputes total duration, price and ETA on every change (same engine function as the final submit).
5. **Confirm & Join**:
   - validate form;
   - reject if an active entry already exists for that phone;
   - reject if online joining is closed or salon is closed;
   - reject selected barber if off duty or on break;
   - create entry with status `waiting`, token `A` + 3-digit sequence, `createdAt = now`, source `online`;
   - save token in this browser (`localStorage`) and show success state.
6. Customer lands on `/status`; the page subscribes to store changes.
7. Engine updates:
   - at position 2 → `notifiedComingAt`, banner "Start Coming";
   - on `called` → `notifiedTurnAt`, banner "It's Your Turn" + optional browser notification (permission permitting);
   - barber presses Start → `in_chair`; Done → `done` with thank-you state.
8. Customer may cancel from `/status` at any time before `in_chair` (confirmation required).

## 3. Walk-in customer flow

1. Reception clicks **Add Walk-in** (works even when online joining is closed; salon must be open).
2. Same form validation and 1–3 service rule; barber can be chosen or left as Any Barber.
3. Engine checks duplicate **active** phone — if a person is already in the queue remotely, reception is shown that token instead of creating a duplicate.
4. Entry created with `source = "walk-in"`, token `W` + sequence, status `waiting`, `createdAt = now` — inserted in FIFO order alongside online entries.
5. Walk-in sees the same status rules when they open `/status/:token` (reception can show/share the token).
6. If the walk-in never arrives after being called, reception marks No-show using the same 10-minute rule.

## 4. Queue statuses and transitions

```
                 call next (reception, eligible)
waiting ────────────────────────────────────────► called
   │                                               │
   │ cancel (customer/reception)                   │ start (barber)
   ▼                                               ▼
cancelled                                       in_chair
                                                    │
                                          done (barber)
                                                    ▼
                                                  done

called ── no-show (reception, after 10 min window) ──► no_show
```

| From | To | Trigger | Actor | Side effects |
|---|---|---|---|---|
| waiting | called | Call Next / Call row | Reception | assign barber, `calledAt`, TV `lastCall`, chime, "It's Your Turn" |
| waiting | cancelled | Cancel My Spot / Cancel row | Customer / Reception | `completedAt`, place released, ETA recalculated |
| called | in_chair | Start Service | Barber | `startedAt`, timer starts, chair occupied |
| called | no_show | No-show button | Reception | `completedAt`, chair freed, customer must rejoin at end |
| in_chair | done | Done button | Barber | `completedAt`, stats updated, chair freed, next customer eligible |

**Illegal transitions are rejected by the engine** (e.g. calling a cancelled entry, starting a waiting entry) and the UI shows why. Terminal states are immutable.

## 5. Barber selection rules

1. FCFS: order strictly by `createdAt` (then token sequence as tie-break).
2. `Call Next(barber B)` scans waiting entries in order and picks the **first** entry where `preferredBarberId === B.id || preferredBarberId === "any"`.
3. A customer who chose a specific barber is **never** assigned to another barber — not by Call Next, not by TV, not by an ETA simulation.
4. A barber can have only **one** active customer: Call Next is blocked while they have a `called` or `in_chair` entry.
5. Call Next is blocked when the barber is off duty or on break; the UI explains the reason.
6. An "Any Barber" entry may be assigned to any eligible on-duty, non-break, free barber — normally the one whose queue is shortest, but always respecting global FCFS (we do not skip an older Any-Barber customer to favour a newer one).
7. Going on break does **not** interrupt an existing `called` or `in_chair` customer.
8. If no eligible customer exists for a barber (only entries preferring other barbers remain), Call Next says "No eligible customer for this barber" instead of breaking rule 3.

## 6. Waiting-time calculation

All screens use `estimateWait(entry, state, now)` and `laneFor(entry)`:

- **Lane** for a customer who chose barber B = all waiting entries with `preferredBarberId === B` **plus** all `any` entries. For an Any-Barber customer, the lane is the whole waiting list (plus each on-duty barber pool).
- **Remaining work** = sum of `durationMin` of the serviceIds of waiting entries ahead in the lane, plus the remaining time of any current `in_chair` service in that lane (`totalDuration − elapsed`, floored at 0), plus a small per-call overhead (1 min) for each `called-but-not-started` entry ahead.
- **Working barbers** = on-duty barbers **not** on break that can serve the lane.
- **ETA** = `ceil(remainingWork / max(1, workingBarbers))`, in minutes. Home uses a rounded range (`ETA − 2` to `ETA + 2`, never below 0); My Status and Join use the single number.
- Timers re-evaluate ETA every 30 seconds and immediately after any state change, so numbers drop as time passes or a service finishes.
- This is deliberately an **estimate**, labelled as such, not a promise.

**Queue position** = `1 + number of waiting entries ahead of this entry in its lane`. Called/in-chair/done/cancelled/no-show entries are excluded from position. A customer at position 2 receives the **Start Coming** notification (computed from the same function).

## 7. Cancellation rules

- Customer can cancel from Waiting or Called (confirmation modal); reception can cancel any non-terminal entry.
- Cancelling sets status `cancelled`, records `completedAt`, and immediately removes the entry from all queues/positions/ETAs.
- A cancelled phone number may join again — a new token is created and placed at the end (FCFS).
- Cancellation history is retained for the day but never shown as an active queue entry.
- Cancelling an `in_chair` customer is blocked ("Service already started — ask the barber to mark Done").

## 8. No-show rules

- Clock starts at `calledAt`. After **10 minutes** the entry is flagged `noShowEligible = true` in the reception UI (badge "Over 10 min since call").
- Reception explicitly marks **No-show** (confirmation), transitioning `called → no_show`. We do not silently auto-mark, so a slow but genuine customer is not lost without staff judgement.
- Marking no-show frees the barber and updates ETAs/stats.
- The same phone may join again, but **must get a new token at the end of the queue** (rule 11). Engine enforces this: old no-show entry is terminal, new entry gets a fresh sequence number and `createdAt = now`.
- A customer whose token is no-show sees "You were marked as a no-show. Please rejoin at the desk or online." on `/status`.

## 9. Barber break rules

- Owner or barber toggles `onBreak`; `onDuty` can be toggled by owner only.
- On break: barber disappears from Call Next eligibility, Home's "available" count, Join Queue's selectable list, and ETA's working-barber count.
- Their current `in_chair`/`called` customer is unaffected, and a confirmation warns before toggling if they are busy.
- TV shows "On Break" instead of a current token; next tokens are hidden for that barber.
- Returning from break immediately restores eligibility; no automatic calling occurs.

## 10. Online joining hours

- Default hours 10:00–20:00, editable in Owner Settings.
- Online joining is allowed only while `salon.isOpen === true`, `salon.onlineJoiningOpen === true`, and `now < closingTime − 30 minutes`.
- Reception **Add Walk-in** ignores the 30-minute cutoff but still requires the salon to be open.
- The Home and Join screens show the exact cut-off time ("Online joining closes at 19:30 today").

## 11. Test checklist (run after each major step)

| # | Test | Steps | Expected result |
|---|---|---|---|
| 1 | Join with valid data | Open `/join`, enter name, `9876543210`, 2 services, Any Barber, Confirm | Token `A001` created, status Waiting, saved locally, Home counts +1 |
| 2 | Phone validation | Enter `12345`, `98765432101`, `abcdefghij` | Inline "valid 10-digit mobile number" error, no entry created |
| 3 | Three-service limit | Select 4 services on `/join` | 4th blocked with toast, total duration/price reflect only 3 |
| 4 | Duplicate active phone | Join again with the same phone while first entry is active | Rejected with existing token + Track my spot link; no second entry |
| 5 | Barber affinity | Join with barber B1; join another with Any Barber; call next for B2 | B2 receives only the Any-Barber customer; B1's customer untouched |
| 6 | One customer per chair | Call next twice for the same barber without Done | Second Call disabled with "Barber already has a customer" |
| 7 | FCFS order | Join A, B, C; call next several times | Called in A → B → C order regardless of service duration |
| 8 | Start / Done timer | Start called customer, wait, press Done | Timer counts down, status In Chair → Done, chair free, stats served +1 |
| 9 | Start Coming alert | Join 3 customers, watch 2nd customer's `/status` | Position 2 shows "Start Coming" banner exactly once |
| 10 | Turn alert + TV | Call a customer | "It's Your Turn" appears on `/status`; TV shows token, JUST CALLED ribbon, chime if sound enabled |
| 11 | Cancel with confirmation | Cancel on `/status` → Keep, then Cancel → Yes | First keeps entry; second sets Cancelled and frees position; phone can rejoin |
| 12 | No-show + rejoin | Call a customer, advance >10 min, mark No-show, rejoin same phone | New token at end of queue; old token terminal; stats no-shows +1 |
| 13 | Break rules | Put barber on break, try Call Next, join selecting that barber | Call blocked; Join shows break message; ETA/availability update on Home/TV |
| 14 | Closing cut-off | Set closing 20:00, simulate 19:31 | `/join` blocked with cut-off explanation; reception Add Walk-in still works |
| 15 | Cross-window sync | Open Home, `/reception`, `/tv` in separate windows; join/call in one | Other windows update within ~2 s without refresh |
| 16 | Language toggle | Toggle EN → ગુજરાતી on every screen | All static labels change; queue data/state unchanged; service names use stored Gujarati |
| 17 | Responsive check | 360 px, 768 px, 1920 px widths on all 7 screens | No horizontal scroll, readable targets, all primary actions reachable |
| 18 | Production build | `npm run build`, serve `dist`, visit all routes | Build succeeds; no localhost URLs in config; routes load correctly |

**Record results** in `docs/04-test-log.md` (created during Step 11), including the date, browser/device and pass/fail per test.
