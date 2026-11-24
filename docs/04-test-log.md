# Test log

**Date:** 24 November 2026
**Browser:** Google Chrome 155.0.8059.84 (Windows desktop), plus a 360 / 768 / 1920 px iframe harness for responsive checks
**Mode:** Local adapter (`localStorage` + `storage` events + `BroadcastChannel`) because no Firebase env vars are configured
**Build:** `npm run build` — pass; `npm run check:rules` — 9/9 rule groups pass

Results use the 18 cases in `docs/03-flows-rules.md` §11. Token numbers below continue from the seeded demo data (`A101`–`A107`), so new tokens start at `A108`/`W108` rather than `A001`.

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Join with valid data | PASS | `/join`, name + `9876543220`, 2 services, Any Barber → `A109`, status Waiting, persisted in `salon-queue-v1`; Home count increased. |
| 2 | Phone validation | PASS | `12345`, `98765432101` and non-digit input all show the inline “valid 10-digit mobile number” error; no entry created. Input filters non-digits, so letters become an empty value but still show the error. |
| 3 | Three-service limit | PASS | 4th service click shows “You can choose up to 3 services”; only 3 selected; totals reflect 3. |
| 4 | Duplicate active phone | PASS | Rejoining with the active phone shows `A110 Track my spot`; entry count unchanged. |
| 5 | Barber affinity | PASS | Engine + browser: `A102` stayed with Arjun; Any-Barber rows went to the next free barber; preferred barber never reassigned. |
| 6 | One customer per chair | PASS | After Call Next for Arjun, his button became disabled; second call blocked with `reception.barberBusy`. |
| 7 | FCFS order | PASS | Verified `A102` → `A103` order by queue order, not service duration; reception card showed the correct “Next up” token. |
| 8 | Start / Done timer | PASS | Barber `2222`: Start → In Chair, countdown advanced, Mark done → confirmation → Done; chair freed and stats updated. |
| 9 | Start Coming alert | PASS (engine + UI position) | `getPosition` returns 2 for the second waiting customer and `markNotified` is idempotent; My Status showed live positions 4/5 for later tokens, so the banner was not triggered in that run. Covered by `check:rules`. |
| 10 | Turn alert + TV | PASS | Called token showed “It’s your turn!” on `/status`; TV showed the token, barber and `JUST CALLED` ribbon immediately after the call; sound control present. |
| 11 | Cancel with confirmation | PASS | Keep my spot left `A109` Waiting; second confirm set Cancelled; My Status kept the cancelled token visible and allowed rejoin. |
| 12 | No-show + rejoin | PASS (engine + UI) | Engine check: no-show before 10 min rejected, after 10 min accepted, same phone rejoins with a fresh token and only one active entry. UI no-show control was present on the Reception waiting row. |
| 13 | Break rules | PASS | Raj on break: Call Next disabled, Join barber card disabled with break message, TV hid his next tokens; Home availability dropped. Engine check confirms break blocks calls and does not cancel an existing customer. |
| 14 | Closing cut-off | PASS (after fix) | With closing `20:00` at 20:30, `/join` now shows the closed empty state with “closes at 19:30”; Reception Add walk-in still works. Bug found in this test and fixed — see `05-reflection.md`. |
| 15 | Cross-window sync | PASS | Home + Reception + TV tabs updated after a walk-in/call in ~0.5 s without refresh; no console errors. |
| 16 | Language toggle | PASS | EN → ગુ on all 7 routes changed all static labels and stored service/barber names; entry count stayed at 10. EN/Gu key sets are identical (282 keys each). |
| 17 | Responsive check | PASS (after fix) | All 7 routes at 360, 768, 1920 px: no horizontal overflow. Language toggle, nav links and brand link raised to 44 px minimum touch targets. |
| 18 | Production build | PASS | `npm run build` succeeds; all 7 routes also load from `npm run preview` with correct headings and no console errors. `dist/` contains hashed assets; no localhost URLs or secrets in source/config. |

## Additional checks

- `npm audit --audit-level=moderate`: 0 vulnerabilities.
- `npm run check:rules`: 9/9 groups (phone, join, calling, statuses, no-show, breaks, ETA, hours, owner guards/stats).
- Owner settings browser-tested: service add/edit/delete/enable, barber add/remove/duty/break, salon toggles, hours validation, stats/activity, two-step reset.
- Multi-window test repeated after the final engine/store changes.
- Screenshots of all seven screens are in `docs/screenshots/`.
- Firestore integration (24 Nov 2026): adapter now signs in anonymously before reading/writing `salons/default/queue/state`; rules in `firestore.rules` require auth, validate the document and deny deletes. Local fallback remains active while the API key is blank and Anonymous sign-in/rules are not yet configured in the project.
- After integration, `npm run build` passed and all seven routes were rechecked from the production preview: correct headings, `Local mode` badge, no console errors. EN/Gu key parity remained 283/283; `npm run check:rules` remained 9/9. Cloud mode itself could not be exercised until the web API key is supplied and Anonymous sign-in/rules are published manually.
