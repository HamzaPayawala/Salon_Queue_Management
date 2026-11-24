# Reflection — one agent mistake, found and fixed

**Mistake:** The Join screen rendered the full customer form even when online joining was closed. The queue engine correctly rejected a late submission (`join.joiningClosed`), but the UI still invited the customer to fill in their name, phone, services and barber, then failed only at the last click. This was a rule/UI mismatch: `isOnlineJoiningOpen()` existed in `queueEngine.js` and Home already showed the cut-off, but `Join.jsx` never called it.

**How it was found:** During checklist test 14 (`docs/04-test-log.md`), I set closing time to `20:00` through Owner Settings while the browser clock was 20:30. Home showed “Online joining is closed for today”, but `/join` still displayed “Confirm & Join”. The test caught it because I compared the two screens after the same state change rather than trusting the engine check alone.

**Fix:** `Join.jsx` now imports `isOnlineJoiningOpen` and `onlineCutoffTime`, computes `joiningOpen` from the same `useNow()` clock used everywhere else, and returns a `Card` + `EmptyState` with a translated “Online joining is closed” message and the exact cut-off time before rendering the form. English and Gujarati strings were added to both central dictionaries (`join.closedTitle`, `join.closedBody`) so no hard-coded UI text was introduced. The success screen is still shown to a customer who joined just before the cut-off.

**Verification:** Re-ran test 14 in Chrome: `/join` now shows the closed state, hides the form and names `19:30` as the cut-off; Reception Add walk-in still works. Rebuilt (`npm run build`), re-ran `npm run check:rules` (9/9), checked EN/Gu key parity (282 keys each) and confirmed no console errors on all seven routes.

**Lesson:** A rule implemented in the engine is not the same as a rule enforced by the UI. Every screen that offers an action should derive its enabled/disabled state from the same engine predicate, and browser checks should deliberately exercise the negative case (closed, full, busy, duplicate) and not only the happy path.
