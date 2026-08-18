# Audi Film Showcase — GitHub Pages Edition

A randomized, continuous Audi film player built for a customer-facing TV display.

## Files to upload

Upload all of these files to the root of the GitHub repository:

- `index.html` — main randomized showcase
- `library.html` — searchable film list
- `watch.html` — single-film viewer opened from the library
- `videos.js` — full video catalog
- `player-engine.js` — Audi MediaTV + YouTube playback engine
- `app.js` — main shuffle/loop logic
- `library.js` — library search/filter/new-tab behavior
- `watch.js` — individual film page behavior
- `styles.css` — all site styling
- `favicon.svg` — placeholder favicon; replace with your own icon if desired

## GitHub Pages setup

1. Create or open the GitHub repository.
2. Upload the files above to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the branch containing the files (normally `main`) and `/ (root)`.
6. Open the GitHub Pages URL once deployment completes.

Do not test the final YouTube behavior by double-clicking `index.html` from disk. YouTube embeds can return Error 153 from `file://` pages because there is no normal HTTP referrer. GitHub Pages supplies the normal HTTPS origin/referrer.

## Playback behavior

- Click **Start Random Playback** once.
- The site creates a shuffled bag containing every film.
- Every film plays once before any film repeats.
- After all films have played, the entire catalog is reshuffled.
- The last film of one cycle is prevented from immediately becoming the first film of the next cycle.
- YouTube films use the YouTube IFrame API `ENDED` event.
- Audi MediaTV films use their stored runtime plus a small safety buffer because the public Audi embed does not expose a documented end event.
- A YouTube video that errors is skipped so the kiosk does not get stuck.

## Library behavior

`library.html` stays open. Both **Open film** and **Start showcase here** open in a new browser tab.

## Favicon

Replace `favicon.svg` with your preferred icon, or edit the `<link rel="icon">` line in the HTML files if you use `.ico` or `.png`.
