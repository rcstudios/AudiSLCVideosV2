(function () {
  "use strict";

  const videos = window.AUDI_SHOWCASE_VIDEOS || [];
  const params = new URLSearchParams(window.location.search);
  const number = Number(params.get("video"));
  const video = videos.find(item => item.number === number);
  const FAILURE_KEY = "audiShowcasePlaybackFailuresV2";

  const title = document.getElementById("watchTitle");
  const meta = document.getElementById("watchMeta");
  const button = document.getElementById("watchButton");
  const start = document.getElementById("watchStart");
  const mount = document.getElementById("watchMount");
  const status = document.getElementById("watchStatus");

  function readFailures() {
    try { return JSON.parse(localStorage.getItem(FAILURE_KEY) || "{}"); }
    catch (_) { return {}; }
  }

  function writeFailures(value) {
    try { localStorage.setItem(FAILURE_KEY, JSON.stringify(value)); }
    catch (_) {}
  }

  function updateFailure(result) {
    const failures = readFailures();
    const key = String(video.number);
    if (result.ok === false) {
      failures[key] = {
        number: video.number,
        title: video.title,
        source: video.source,
        type: video.type,
        id: video.id,
        reason: result.reason || "unknown",
        errorCode: typeof result.errorCode !== "undefined" ? result.errorCode : null,
        time: new Date().toISOString()
      };
    } else {
      delete failures[key];
    }
    writeFailures(failures);
  }

  if (!video) {
    title.textContent = "Film not found";
    meta.textContent = "Return to the library and choose another title.";
    button.disabled = true;
    return;
  }

  document.title = `${video.title} • Audi Film Viewer`;
  title.textContent = video.title;
  meta.textContent = `${video.source} • Film ${video.number}`;

  const player = new window.AudiShowcasePlayer(mount, {
    onStatus: message => {
      status.textContent = message;
      status.classList.add("visible");
    }
  });

  function play() {
    start.classList.add("hidden");
    player.play(video, (result = {}) => {
      updateFailure(result);
      player.destroy();
      title.textContent = video.title;
      meta.textContent = result.ok === false
        ? `Playback issue detected: ${result.reason || "unknown"}. The main loop will skip this source automatically.`
        : "Film finished.";
      button.querySelector("span:last-child").textContent = "Play Again";
      start.classList.remove("hidden");
    });
  }

  button.addEventListener("click", play);
})();
