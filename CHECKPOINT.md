# Project checkpoint — 2026-11-06

## User direction

Ebad wants a polished workout program based exactly on the attached corrected four-week plan, six exercises on each training day, exercise GIFs that match the actual exercise/equipment, individual useful form tips, attendance check-ins, and persistent progress counts. No kg or set logging. They want a quick reference to use before training and put the phone aside.

For the live subdomain, Ebad chose one shared cPanel password and device-local progress storage. There is no cloud account or cross-device sync.

## Current implementation

Workspace: `C:\xampp\htdocs\GYM`.

- `src/program.ts` is the single source for the user's corrected four-week program. Each of five training days has six exercises; Tuesday and Friday are rest days.
- `src/App.tsx` provides the daily guide, weekly schedule, searchable category-based Exercise directory, attendance, and progress views.
- `src/catalog.ts` has equipment, target muscles, setup, exercise-specific movement cues, breathing, and common mistakes for every unique exercise ID in the program.
- `src/exercise-media.ts` maps all program exercise IDs to 39 real GIF URLs from Exercise Gym GIFs DB v1.1.0. The catalog has no exact bilateral horizontal leg-press, dumbbell walking lunge, or seated cable pullover animation; those use clearly labeled closest matching catalog variants.
- GIFs are credited, runtime-cached, and can be saved locally through Exercises → Save GIFs offline.
- Attendance is stored in IndexedDB under `sabiry-training-attendance`; records include check-in timestamps. After check-in, the browser is asked to preserve site storage where supported. Data remains in this browser/device and is not synced.
- Dark and light themes are available through a header toggle and the selection persists in local storage.
- Exercise GIF panels have a white background to reduce empty-looking space around GIFs on mobile.
- Footer link points to `https://sabiry.dev`.
- The README explains how to protect the `train.sabiry.dev` document root with cPanel Directory Privacy. This hosting-level setting is not part of the app build and has not been enabled from this workspace. The existing live site must be locked in cPanel.

## Verification

Latest run passed:

- `npm run build`
- `npm test` (6 tests)
- `npm run test:e2e` (desktop Chromium and Pixel 7 emulation)

## Delivery

`Ebad-Training-source.zip` contains the project source. `Ebad-Training-production.zip` contains the latest static production build. Upload the production ZIP contents to the `train.sabiry.dev` document root after setting the cPanel directory password. Do not publish or change DNS from this workspace.

- The light theme was refreshed to a crisp daytime palette: neutral paper backgrounds, dark slate text, restrained cobalt accents, and subtle cool-blue/warm-sun highlights. It avoids the previous lavender-heavy look.


- Corrected remaining light-theme contrast leaks in the progression note, rest-day message, progress fractions, branding labels, and library metadata. Manually audited visible text contrast on Today, Weekly plan, Exercises, and Progress at a 390 px viewport; no text below 4.5:1 on those screens.


- Investigated the report that the new theme was not appearing on the live phone app. Live 	rain.sabiry.dev serves the new theme CSS/JS, but the previous PWA used prompt-style registration without an update prompt, so an installed client could remain controlled by an older worker. Switched to utoUpdate and registered through irtual:pwa-register with immediate update handling; production now sets skipWaiting and clientsClaim and reloads clients onto the current build.

