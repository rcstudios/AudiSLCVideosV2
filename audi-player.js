(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const id = (params.get("id") || "").replace(/[^0-9]/g, "");
  const durationSeconds = Math.max(1, Number(params.get("duration")) || 90);
  const token = params.get("token") || "";
  const mount = document.getElementById("audiMount");

  const END_BUFFER_MS = 1800;
  const PLAYER_LOAD_TIMEOUT_MS = 18000;
  const END_TEXT_CHECK_MS = 700;

  let finished = false;
  let ready = false;
  let endTimer = null;
  let loadTimeout = null;
  let textCheck = null;
  let observer = null;

  function post(type, payload = {}) {
    window.parent.postMessage({ type, id, token, ...payload }, window.location.origin);
  }

  function cleanup() {
    if (endTimer) clearTimeout(endTimer);
    if (loadTimeout) clearTimeout(loadTimeout);
    if (textCheck) clearInterval(textCheck);
    if (observer) observer.disconnect();
  }

  function finish(ok, reason, detail = null) {
    if (finished) return;
    finished = true;
    cleanup();
    post("audi-showcase-media-ended", { ok, reason, detail });
  }

  function pageText() {
    return (document.body.innerText || "").toLowerCase();
  }

  function bodyShowsEndCard() {
    const text = pageText();
    return text.includes("replay previous video") ||
           text.includes("similar videos") ||
           text.includes("ähnliche videos") ||
           text.includes("vorheriges video wiederholen");
  }

  function bodyShowsError() {
    const text = pageText();
    const phrases = [
      "video not found",
      "video is unavailable",
      "video unavailable",
      "not available",
      "does not exist",
      "could not be loaded",
      "cannot be played",
      "nicht verfügbar",
      "nicht gefunden"
    ];
    return phrases.find(phrase => text.includes(phrase)) || null;
  }

  function playerElement() {
    return mount.querySelector(
      "iframe, video, object, embed, [class*='player'], [class*='video']"
    );
  }

  function markReady(reason) {
    if (ready || finished) return;
    ready = true;

    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }

    post("audi-showcase-media-ready", { reason });

    endTimer = setTimeout(() => {
      // Audi's public embed has no documented ended event, so expected runtime
      // is still the normal backup path for healthy MediaTV videos.
      finish(true, `runtime-watchdog:${reason}`);
    }, (durationSeconds * 1000) + END_BUFFER_MS);
  }

  function inspect() {
    if (finished) return;

    const errorPhrase = bodyShowsError();
    if (errorPhrase) {
      finish(false, "audi-source-error", errorPhrase);
      return;
    }

    if (bodyShowsEndCard()) {
      // If a real player was observed first, this is the normal Audi end card.
      // If not, Audi likely sent us directly to a fallback/recommendation state.
      if (ready) finish(true, "end-card-detected");
      else finish(false, "audi-source-unavailable", "end card appeared before playback started");
      return;
    }

    if (playerElement()) {
      // Allow the MediaTV widget to initialize before considering it started.
      setTimeout(() => markReady("player-detected"), 700);
    }
  }

  function observeAudiPlayer() {
    observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    textCheck = setInterval(inspect, END_TEXT_CHECK_MS);

    loadTimeout = setTimeout(() => {
      if (!ready) finish(false, "audi-player-not-found");
    }, PLAYER_LOAD_TIMEOUT_MS);
  }

  function loadAudiEmbed() {
    if (!id) {
      finish(false, "missing-id");
      return;
    }

    observeAudiPlayer();

    const script = document.createElement("script");
    script.src = "https://www.audimedia.tv/embed.js";
    script.id = `amc-video-${id}-en`;
    script.setAttribute("data-autoplay", "true");
    script.async = true;
    script.onerror = () => finish(false, "embed-load-error");
    mount.appendChild(script);
  }

  loadAudiEmbed();
})();
