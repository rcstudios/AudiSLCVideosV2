/*
  Shared mixed-source player for Audi MediaTV + YouTube.

  Resilience rules:
  - A source error NEVER stops the showcase.
  - YouTube videos have both API error handling and a startup watchdog.
  - Audi videos have a child-player startup watchdog plus a runtime fallback.
  - The catalog is never edited automatically; failures are reported to app.js.
*/
(function () {
  "use strict";

  let youtubeApiPromise = null;

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;

    youtubeApiPromise = new Promise((resolve, reject) => {
      let settled = false;
      const finishResolve = () => {
        if (settled) return;
        settled = true;
        clearTimeout(apiTimeout);
        resolve(window.YT);
      };
      const finishReject = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(apiTimeout);
        youtubeApiPromise = null;
        reject(error);
      };

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousCallback === "function") previousCallback();
        if (window.YT && window.YT.Player) finishResolve();
      };

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => finishReject(new Error("Unable to load the YouTube IFrame API."));
        document.head.appendChild(script);
      }

      const apiTimeout = setTimeout(() => {
        if (window.YT && window.YT.Player) finishResolve();
        else finishReject(new Error("YouTube IFrame API timed out."));
      }, 12000);
    });

    return youtubeApiPromise;
  }

  class AudiShowcasePlayer {
    constructor(mountElement, options = {}) {
      this.mount = mountElement;
      this.options = {
        onStatus: null,
        youtubeStartupTimeoutSeconds: 18,
        youtubePlaybackSafetySeconds: 120,
        youtubeUnknownMaxSeconds: 7200,
        audiStartupTimeoutSeconds: 22,
        audiHardFallbackSeconds: 35,
        ...options
      };

      this.youtubePlayer = null;
      this.audiFrame = null;
      this.timers = new Set();
      this.playToken = 0;
      this.current = null;
      this.audiMessageHandler = null;
    }

    status(message) {
      if (typeof this.options.onStatus === "function") {
        this.options.onStatus(message);
      }
    }

    setTimer(fn, ms) {
      const id = setTimeout(() => {
        this.timers.delete(id);
        fn();
      }, ms);
      this.timers.add(id);
      return id;
    }

    clearTimer(id) {
      if (!id) return;
      clearTimeout(id);
      this.timers.delete(id);
    }

    clearAllTimers() {
      this.timers.forEach(id => clearTimeout(id));
      this.timers.clear();
    }

    destroy() {
      this.playToken += 1;
      this.current = null;
      this.clearAllTimers();

      if (this.audiMessageHandler) {
        window.removeEventListener("message", this.audiMessageHandler);
        this.audiMessageHandler = null;
      }

      if (this.youtubePlayer && typeof this.youtubePlayer.destroy === "function") {
        try { this.youtubePlayer.destroy(); } catch (_) {}
      }

      this.youtubePlayer = null;
      this.audiFrame = null;
      this.mount.replaceChildren();
    }

    async play(video, onEnd) {
      this.destroy();
      const token = this.playToken;
      this.current = video;
      this.status(`Loading: ${video.title}`);

      if (video.type === "youtube") {
        return this.playYouTube(video, onEnd, token);
      }

      return this.playAudi(video, onEnd, token);
    }

    async playYouTube(video, onEnd, token) {
      let completed = false;
      let startupTimer = null;
      let playbackTimer = null;
      let started = false;

      const finish = (ok, reason, extra = {}) => {
        if (completed || token !== this.playToken) return;
        completed = true;
        this.clearTimer(startupTimer);
        this.clearTimer(playbackTimer);

        if (ok) this.status(`Finished: ${video.title}`);
        else this.status(`Skipped unavailable video: ${video.title} (${reason})`);

        if (typeof onEnd === "function") {
          onEnd({ ok, reason, video, ...extra });
        }
      };

      if (window.location.protocol === "file:") {
        this.setTimer(() => finish(false, "youtube-file-protocol", { errorCode: 153 }), 1200);
        return;
      }

      startupTimer = this.setTimer(() => {
        finish(false, "youtube-startup-timeout");
      }, this.options.youtubeStartupTimeoutSeconds * 1000);

      try {
        const YT = await loadYouTubeApi();
        if (token !== this.playToken || completed) return;

        const target = document.createElement("div");
        target.className = "youtube-target";
        target.id = `youtube-${video.number}-${Date.now()}`;
        this.mount.appendChild(target);

        this.youtubePlayer = new YT.Player(target.id, {
          videoId: video.id,
          host: "https://www.youtube.com",
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            fs: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              if (token !== this.playToken || completed) return;
              this.status(`Starting: ${video.title}`);
              try { event.target.playVideo(); } catch (_) {}
            },

            onStateChange: (event) => {
              if (token !== this.playToken || completed) return;

              if (event.data === YT.PlayerState.PLAYING) {
                if (!started) {
                  started = true;
                  this.clearTimer(startupTimer);
                  startupTimer = null;
                  this.status(`Playing: ${video.title}`);

                  let duration = 0;
                  try { duration = Number(event.target.getDuration()) || 0; } catch (_) {}
                  const maxSeconds = duration > 0
                    ? duration + this.options.youtubePlaybackSafetySeconds
                    : this.options.youtubeUnknownMaxSeconds;

                  playbackTimer = this.setTimer(() => {
                    finish(false, "youtube-playback-timeout");
                  }, maxSeconds * 1000);
                }
              }

              if (event.data === YT.PlayerState.ENDED) {
                finish(true, "ended");
              }
            },

            onError: (event) => {
              if (token !== this.playToken || completed) return;
              const code = event && typeof event.data !== "undefined" ? event.data : "unknown";
              // Common codes: 2 invalid ID, 5 player error, 100 removed/private,
              // 101/150 embedding blocked, 153 missing referrer/client identity.
              this.setTimer(() => finish(false, "youtube-error", { errorCode: code }), 650);
            }
          }
        });
      } catch (error) {
        if (token !== this.playToken || completed) return;
        finish(false, "youtube-api-error", { message: String(error && error.message || error) });
      }
    }

    playAudi(video, onEnd, token) {
      let completed = false;
      let ready = false;
      let startupTimer = null;
      let hardFallback = null;

      const finish = (ok, reason, extra = {}) => {
        if (completed || token !== this.playToken) return;
        completed = true;
        this.clearTimer(startupTimer);
        this.clearTimer(hardFallback);

        if (this.audiMessageHandler) {
          window.removeEventListener("message", this.audiMessageHandler);
          this.audiMessageHandler = null;
        }

        if (ok) this.status(`Finished: ${video.title} (${reason})`);
        else this.status(`Skipped unavailable Audi video: ${video.title} (${reason})`);

        if (typeof onEnd === "function") {
          onEnd({ ok, reason, video, ...extra });
        }
      };

      const frameToken = `${token}-${video.number}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const iframe = document.createElement("iframe");
      iframe.className = "audi-isolated-frame";
      iframe.title = video.title;
      iframe.allow = "autoplay; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.frameBorder = "0";

      const params = new URLSearchParams({
        id: video.id,
        duration: String(Number(video.durationSeconds) || 90),
        token: frameToken
      });

      iframe.src = `audi-player.html?${params.toString()}`;
      this.audiFrame = iframe;
      this.mount.appendChild(iframe);

      startupTimer = this.setTimer(() => {
        if (!ready) finish(false, "audi-startup-timeout");
      }, this.options.audiStartupTimeoutSeconds * 1000);

      this.audiMessageHandler = (event) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data;
        if (!data || data.token !== frameToken) return;

        if (data.type === "audi-showcase-media-ready") {
          if (ready || completed) return;
          ready = true;
          this.clearTimer(startupTimer);
          startupTimer = null;
          this.status(`Playing: ${video.title}`);

          const runtime = Number(video.durationSeconds) || 90;
          hardFallback = this.setTimer(() => {
            // Audi does not publish an end callback. Reaching the expected
            // runtime plus a generous buffer is treated as a normal completion.
            finish(true, "parent-runtime-fallback");
          }, (runtime + this.options.audiHardFallbackSeconds) * 1000);
          return;
        }

        if (data.type === "audi-showcase-media-ended") {
          finish(data.ok !== false, data.reason || "audi-child-ended", {
            childDetail: data.detail || null
          });
        }
      };

      window.addEventListener("message", this.audiMessageHandler);

      iframe.addEventListener("error", () => {
        finish(false, "audi-frame-load-error");
      }, { once: true });
    }
  }

  window.AudiShowcasePlayer = AudiShowcasePlayer;
})();
