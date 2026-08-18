(function () {
  "use strict";

  const videos = window.AUDI_SHOWCASE_VIDEOS || [];
  const stage = document.getElementById("playerMount");
  const startScreen = document.getElementById("startScreen");
  const startButton = document.getElementById("startButton");
  const nextButton = document.getElementById("nextButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const nowPlaying = document.getElementById("nowPlaying");
  const nowTitle = document.getElementById("nowTitle");
  const nowSource = document.getElementById("nowSource");
  const cycleCounter = document.getElementById("cycleCounter");
  const playerShell = document.getElementById("playerShell");

  let shuffleBag = [];
  let currentVideo = null;
  let lastVideoNumber = null;
  let cycle = 0;
  let running = false;
  let overlayTimer = null;
  let controlFadeTimer = null;
  let wakeLock = null;

  const player = new window.AudiShowcasePlayer(stage, {
    audiEndBufferSeconds: 4,
    onStatus: (message) => console.info(`[Audi Showcase] ${message}`)
  });

  function secureRandomFraction() {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] / 4294967296;
    }
    return Math.random();
  }

  function shuffledCopy(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(secureRandomFraction() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function refillShuffleBag() {
    shuffleBag = shuffledCopy(videos);
    cycle += 1;

    // Prevent the last video of the previous cycle from immediately repeating.
    if (shuffleBag.length > 1 && shuffleBag[0].number === lastVideoNumber) {
      [shuffleBag[0], shuffleBag[1]] = [shuffleBag[1], shuffleBag[0]];
    }

    cycleCounter.textContent = `Random cycle ${cycle} • ${videos.length} films`;
  }

  function drawNextVideo() {
    if (!shuffleBag.length) refillShuffleBag();
    return shuffleBag.shift();
  }

  function showNowPlaying(video) {
    nowTitle.textContent = video.title;
    nowSource.textContent = `${video.source} • Film ${video.number}`;
    nowPlaying.classList.add("visible");
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => nowPlaying.classList.remove("visible"), 5500);
  }

  function playVideo(video) {
    if (!video) return;
    currentVideo = video;
    lastVideoNumber = video.number;
    showNowPlaying(video);

    player.play(video, () => {
      if (!running) return;
      const finishedVideo = video;
      setTimeout(() => {
        // If somebody manually skipped during the transition, do not skip twice.
        if (running && currentVideo === finishedVideo) playNext();
      }, 500);
    });
  }

  function playNext() {
    if (!running) return;
    playVideo(drawNextVideo());
  }

  async function requestFullscreen() {
    const target = document.documentElement;
    try {
      if (!document.fullscreenElement && target.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch (_) {
      // F11 remains available when browser fullscreen is blocked (e.g. CodePen iframe).
    }
  }

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    } catch (_) {}
  }

  function selectedVideoFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const n = Number(params.get("video"));
    return Number.isFinite(n) ? videos.find(v => v.number === n) : null;
  }

  function start() {
    if (running || !videos.length) return;
    running = true;
    document.body.classList.add("running");
    startScreen.classList.add("hidden");
    requestFullscreen();
    requestWakeLock();

    refillShuffleBag();

    const selected = selectedVideoFromUrl();
    if (selected) {
      shuffleBag = shuffleBag.filter(v => v.number !== selected.number);
      playVideo(selected);
    } else {
      playNext();
    }
  }

  startButton.addEventListener("click", start);
  playerShell.addEventListener("dblclick", requestFullscreen);
  nextButton.addEventListener("click", playNext);
  fullscreenButton.addEventListener("click", requestFullscreen);


  document.addEventListener("mousemove", () => {
    if (!running) return;
    document.body.classList.add("controls-active");
    clearTimeout(controlFadeTimer);
    controlFadeTimer = setTimeout(() => {
      document.body.classList.remove("controls-active");
    }, 2600);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.code === "Space" || event.code === "Enter") && !running) {
      event.preventDefault();
      start();
    } else if (event.code === "ArrowRight" && running) {
      event.preventDefault();
      playNext();
    } else if (event.key.toLowerCase() === "f") {
      requestFullscreen();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && running && wakeLock === null) {
      requestWakeLock();
    }
  });

  const selected = selectedVideoFromUrl();
  if (selected) {
    document.getElementById("startHeading").textContent = selected.title;
    document.getElementById("startSubheading").textContent = "Start this film, then continue into the randomized showcase.";
  }
})();
