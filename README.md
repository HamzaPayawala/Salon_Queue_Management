# Lumière Salon Queue

**Live demo:** [_Pending Vercel deployment — replace this line with the public URL before submission._](https://salonqueuemanagement.vercel.app?utm_source=chatgpt.com)

A responsive, bilingual (English / ગુજરાતી) live queue for one salon. Customers join from their phone or at reception, track their token, position and estimated wait, and are notified when it is their turn. Reception, barbers, the owner and the waiting-area TV all read and write the **same shared queue state**.

## Hosting

- **Frontend:** Vercel (static Vite build; `npm run build`, output `dist/`).
- **Data:** Firebase Firestore, free Spark plan, when `VITE_FIREBASE_*` env vars are present.
- **Offline / single-machine demo:** automatic local adapter using `localStorage`, `storage` events and `BroadcastChannel` when Firebase is not configured. No custom server, no paid services.

## Stack

React 18 (JavaScript) · Vite 6 · Tailwind CSS 3 · Lucide React · React Router 7 · Firebase Firestore 12 · `npm run check:rules` (Node assertions).

## Install and run

```bash
npm install
npm run dev
```

Open the URL printed by Vite in the terminal.

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run check:rules # fast engine rule checks
```

## Firebase setup

The app already contains the Firestore adapter and a git-ignored `.env.local` with the provided project values. **Paste the web API key into `VITE_FIREBASE_API_KEY`** in that file (Firebase console → Project settings → Your apps → Web app → SDK setup), then restart the dev server. A fresh clone can copy `.env.example` to `.env.local` and fill in all six values.

Required manual steps in the Firebase console:

1. **Enable anonymous sign-in:** Authentication → Sign-in method → Anonymous → Enable. The app signs each browser in anonymously so Firestore rules never need `allow write: if true`.
2. **Publish the rules:** Firestore Database → Rules → paste the contents of `firestore.rules` → Publish. If you use the Firebase CLI, run `firebase deploy --only firestore:rules` in this folder (`firebase.json` points to the rules file).
3. **Confirm the collection:** the app reads and writes exactly one document, `salons/default/queue/state`. The first run creates it automatically.
4. **Deploy:** add the same six `VITE_FIREBASE_*` values to Vercel Project Settings → Environment Variables, then redeploy.

**Security note:** the Firebase web API key is not a secret; it identifies the project. The database is protected by the rules, not by the key. Do **not** use `allow read, write: if true` — anyone with the config could read customer phone numbers or wipe the queue. The supplied rules require an authenticated (anonymous) user, restrict access to the one queue document, validate its shape and size, and deny deletes. The demo PINs are stored in client-side state and are **not** real authentication; do not expose a production salon deployment with these PINs.

If any required env value is missing, or sign-in/rules fail, the app automatically falls back to **local mode** (`localStorage` + `storage` events + `BroadcastChannel`). The header badge shows “Cloud error — using local mode” when a configured connection fails; in that state changes are saved only on that device and are not shared.

## Screens

| Route | Screen | Access |
|---|---|---|
| `/` | Home — live salon status, wait range, availability | Public |
| `/join` | Join Queue — services, barber preference, ETA, success token | Public |
| `/status` or `/status/:token` | My Status — position, ETA, turn alerts, cancel | Public (saved token) |
| `/reception` | Reception Dashboard — walk-ins, Call Next, cancel, no-show, stats | PIN `1234` |
| `/barber/:barberId` | Barber View — current customer, timer, Start/Done, break | PIN `2222` (`b1`, `b2`, `b3`) |
| `/tv` | Waiting Area TV — now serving, next tokens, `JUST CALLED`, sound/fullscreen | Public display |
| `/owner` | Owner Settings — services, barbers, hours, queue controls, stats, reset | PIN `3333` |

Demo PINs are for evaluation only; they are stored in the queue state and shown in Owner Settings. Change or remove them for a real deployment.

## Features

- First-come-first-served queue with barber affinity and one customer per chair.
- Shared ETA formula across Home, Join, My Status, Reception and TV; updates every 30 seconds and after any state change.
- Online joining closes 30 minutes before closing time; walk-ins are still accepted while the salon is open.
- Turn and “Start Coming” notifications, with `aria-live` regions.
- Service and barber management, breaks, on-duty toggles, editable hours and a two-step demo reset.
- EN / ગુ toggle on every screen with all strings in `src/i18n/`; service and barber names are stored bilingually.
- Loading, empty and error states; dark charcoal and gold theme; 44 px touch targets; reduced-motion support.
- Cross-window sync verified with Home + Reception + TV open together.

## Screenshots

| | | |
|---|---|---|
| [Home](docs/screenshots/home.png) | [Join](docs/screenshots/join.png) | [My Status](docs/screenshots/status.png) |
| [Reception](docs/screenshots/reception.png) | [Barber](docs/screenshots/barber.png) | [TV](docs/screenshots/tv.png) |
| [Owner](docs/screenshots/owner.png) | | |

## Documentation and submission

- `docs/01-brief.md` — scope and users
- `docs/02-screens.md` — all seven screens
- `docs/03-flows-rules.md` — single source of truth for rules and 18-case checklist
- `docs/04-test-log.md` — dated browser and build results
- `docs/05-reflection.md` — half-page reflection on one mistake, how it was found and fixed
- `prompts.md` — chronological prompt history

**Still required before final submission:** add the Firebase web API key to `.env.local`, enable Anonymous sign-in and publish `firestore.rules` in the Firebase console, publish the Vercel URL at the top of this README, record the 3-minute demo video, and push the repository to GitHub.
