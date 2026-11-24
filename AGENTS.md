# AGENTS.md — Instructions for this project

## Project overview

A responsive, bilingual (English/Gujarati) web app for managing a single salon's live queue. Customers join remotely or as walk-ins, track their token/position/estimated wait and get turn notifications. Receptionists, barbers, the owner and a waiting-area TV all work from the **same shared queue state**. The project is an MSc IT student project: prioritise correctness, clarity and demonstrability over cleverness.

**Current phase:** documentation and architecture review. **Do not write application code until the review is confirmed.** All behaviour is specified in `docs/` before implementation.

## Mandatory reading before any coding or change

1. `docs/01-brief.md` — problem, users, features, scope, look and feel.
2. `docs/02-screens.md` — all seven screens, URLs, UI, buttons, responsive and empty/error states.
3. `docs/03-flows-rules.md` — queue rules, transitions, ETA formula, test checklist. This is the single source of truth for behaviour.
4. `prompts.md` — chronological prompt history; append every new prompt, including failed/abandoned attempts.

If a requested change conflicts with these documents, say so and update the document first, then the code.

## Technology stack

- **Frontend:** React (JavaScript) + Vite
- **Styling:** Tailwind CSS (theme colours configured centrally)
- **Icons:** Lucide React
- **Routing:** react-router-dom
- **Language:** English + Gujarati, central files (`src/i18n/en.js`, `src/i18n/gu.js`), no hard-coded UI strings in components
- **Backend/storage:** Firebase Firestore (free Spark plan) for real-time multi-device sync, with an automatic local adapter (`localStorage` + `storage` events + `BroadcastChannel`) when Firebase env vars are absent, so the demo works offline and on one machine. No custom server; no paid services.
- **Hosting:** Vercel (frontend). Firebase handles data; backend hosting not required.

## Architecture and storage decision (why)

A custom Node backend would add maintenance, cold starts on free hosting and persistent-disk problems; plain `localStorage` cannot sync across devices. Firestore gives real-time listeners, a generous free tier, and no server to manage, which fits a student demo. The local adapter is a deliberately small second implementation of the same repository interface so development and evaluation still work if Firebase config is unavailable. All UI screens depend only on `queueStore` (subscribe + actions), never on a storage API directly.

## Design guidelines

- Dark charcoal `#1F2937` background, gold `#D4A017` accent, `rounded-2xl` cards, subtle borders/shadows.
- Mobile-first, then tablet and desktop/TV. No horizontal scrolling at 360 px.
- Purpose-built screens, not a generic admin template: Home is welcoming, Join is a friendly form, My Status is reassuring, Reception is dense but scannable, Barber is distraction-free, TV is large and glanceable, Owner is settings-like.
- 150–250 ms transitions, pulse only for live/JUST CALLED states, respect `prefers-reduced-motion`.
- Every screen needs a loading state, an empty state and an error state. No blank panels.
- Status colours consistent everywhere: waiting slate/blue, called gold, in chair amber/green, done emerald, cancelled muted, no-show red, on break orange.
- Lucide icons with text labels; minimum 44 px touch targets; visible focus rings; `aria-live` for notifications.
- All visible text via `t()` keys. Service/barber names stored bilingual in data.

## Coding rules

1. Follow the documented step order strictly (Step 1 → Step 13); work one step at a time and report after each major step.
2. Implement every rule in `docs/03-flows-rules.md` inside `src/queue/queueEngine.js` as pure functions. Screens call engine actions only; never duplicate rule logic in components.
3. Keep files small and readable; prefer obvious functions to clever abstractions. JS + JSX only, no TypeScript.
4. No non-functional buttons, fake interactions, dead links or placeholder/TODO implementations. If an action exists, it must change shared state.
5. Use realistic seed data on first run (4–6 services with Gujarati names, 3 barbers, a few waiting entries), clearly resettable from Owner Settings.
6. Keep environment values in `.env` (Firebase config only). Never put localhost URLs, API keys or secrets in production config or committed source.
7. Do not modify screens unrelated to the current task when fixing a bug. Re-run the affected screen's checks afterwards.
8. Use feature-based folders: `src/screens/`, `src/components/`, `src/queue/`, `src/i18n/`, `src/hooks/`, `src/lib/`.
9. Commit working milestones to Git with clear messages when a step is verified.
10. Append every prompt used (successful or not) to `prompts.md` with the date and a short outcome note.

## Testing requirements

- After each major feature: run `npm run build`, open the affected screens at 360 px and desktop width, and verify the relevant rows of the test checklist in `docs/03-flows-rules.md`.
- Before declaring a feature done, actually exercise it in the browser (join, call, start, done, cancel, no-show, break, toggle, language switch). Never claim a feature works without testing it.
- Keep a test log at `docs/04-test-log.md` with test ID, result, browser and notes.
- Multi-window check is mandatory: Home + Reception + TV must reflect one action without refresh.
- Final check: full production build, all 7 routes, env config, no console errors, screenshots captured for README.

## Submission deliverables (tracked in README and repo)

GitHub repo with all files; deployed link at the very top of README; `prompts.md`; 3-minute demo video; half-page reflection on one agent mistake, how it was found and fixed. README must include title, hosting info, description, stack, install steps, features, screenshots and demo staff PINs.
