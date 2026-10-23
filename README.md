# Audi Film Showcase — GitHub Pages

Customer-facing Audi film loop with randomized, non-repeating playback.

## Current catalog
- 52 total films
- 20 Audi MediaTV embeds
- 32 YouTube embeds

## Failure-safe playback
The site does **not** remove dead videos from `videos.js`.

If a video becomes deleted, private, unavailable, embedding-blocked, or simply fails to start:
1. The player waits only for its startup watchdog.
2. The source is skipped automatically.
3. Playback moves to the next randomized film.
4. That film is quarantined for the rest of the current browser session so it cannot repeatedly stall the kiosk.
5. The failure is stored in browser `localStorage` and highlighted on `library.html`.
6. Reloading the page tries every catalog entry again. A later successful play automatically clears its saved warning.

The Library has a **Playback issues** filter to find broken sources.

## Files
- `index.html` — main randomized showcase
- `library.html` — searchable library / source diagnostics
- `watch.html` — single-film test page
- `audi-player.html` — isolated Audi MediaTV child player
- `videos.js` — all titles and source IDs
- `player-engine.js` — mixed-source playback + watchdogs
- `audi-player.js` — Audi MediaTV detection + runtime fallback
- `app.js` — random shuffle bag, loop and failure quarantine
- `library.js` — library rendering + playback issue badges
- `watch.js` — individual film tester
- `styles.css` — styling
- `favicon.svg` — replace with your preferred favicon

## GitHub Pages
Upload all files to the same folder/repository root and publish the repository through GitHub Pages. Use the HTTPS GitHub Pages URL for playback; do not run the site from a local `file://` URL because YouTube embeds may return Error 153.
