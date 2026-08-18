/* Shared mixed-source player for Audi MediaTV + YouTube. */
(function () {
  "use strict";

  let youtubeApiPromise = null;

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;

    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousCallback === "function") previousCallback();
        resolve(window.YT);
      };

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => reject(new Error("Unable to load the YouTube IFrame API."));
        document.head.appendChild(script);
      }

      setTimeout(() => {
        if (window.YT && window.YT.Player) resolve(window.YT);
      }, 3000);
    });

    return youtubeApiPromise;
  }

  class AudiShowcasePlayer {
    constructor(mountElement, options = {}) {
      this.mount = mountElement;
      this.options = {
        audiEndBufferSeconds: 4,
        onStatus: null,
        ...options
      };
      this.youtubePlayer = null;
      this.audiTimer = null;
      this.audiLoadFallback = null;
      this.audiObserver = null;
      this.playToken = 0;
      this.current = null;
    }

    status(message) {
      if (typeof this.options.onStatus === "function") {
        this.options.onStatus(message);
      }
    }

    destroy() {
      this.playToken += 1;
      this.current = null;

      if (this.audiTimer) clearTimeout(this.audiTimer);
      if (this.audiLoadFallback) clearTimeout(this.audiLoadFallback);
      if (this.audiObserver) this.audiObserver.disconnect();
      this.audiTimer = null;
      this.audiLoadFallback = null;
      this.audiObserver = null;

      if (this.youtubePlayer && typeof this.youtubePlayer.destroy === "function") {
        try { this.youtubePlayer.destroy(); } catch (_) {}
      }
      this.youtubePlayer = null;
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
      /*
        YouTube error 153 means the request did not provide an HTTP Referer
        or equivalent API client identity. GitHub Pages serves this project
        over HTTPS with a normal page origin/referrer, which is why the site
        should be opened from its GitHub Pages URL rather than as file://.
      */
      if (window.location.protocol === "file:") {
        this.status(`YouTube requires the hosted GitHub Pages version: ${video.title}`);
        setTimeout(() => {
          if (token === this.playToken && typeof onEnd === "function") {
            onEnd({ reason: "file-protocol", video, errorCode: 153 });
          }
        }, 2500);
        return;
      }

      try {
        const YT = await loadYouTubeApi();
        if (token !== this.playToken) return;

        const iframe = document.createElement("iframe");
        iframe.className = "youtube-target";
        iframe.id = `youtube-${video.number}-${Date.now()}`;
        iframe.title = video.title;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.frameBorder = "0";

        const origin = window.location.origin;
        const params = new URLSearchParams({
          enablejsapi: "1",
          autoplay: "1",
          controls: "1",
          rel: "0",
          playsinline: "1",
          iv_load_policy: "3",
          fs: "1",
          origin
        });
        iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(video.id)}?${params.toString()}`;
        this.mount.appendChild(iframe);

        this.youtubePlayer = new YT.Player(iframe.id, {
          events: {
            onReady: (event) => {
              if (token !== this.playToken) return;
              this.status(`Playing: ${video.title}`);
              try { event.target.playVideo(); } catch (_) {}
            },
            onStateChange: (event) => {
              if (token !== this.playToken) return;
              if (event.data === YT.PlayerState.ENDED && typeof onEnd === "function") {
                onEnd({ reason: "ended", video });
              }
            },
            onError: (event) => {
              if (token !== this.playToken) return;
              const code = event && typeof event.data !== "undefined" ? event.data : "unknown";
              this.status(`Skipped YouTube video (${code}): ${video.title}`);
              setTimeout(() => {
                if (token === this.playToken && typeof onEnd === "function") {
                  onEnd({ reason: "error", video, errorCode: code });
                }
              }, 1800);
            }
          }
        });
      } catch (error) {
        if (token !== this.playToken) return;
        this.status(`YouTube could not load: ${video.title}`);
        setTimeout(() => {
          if (token === this.playToken && typeof onEnd === "function") {
            onEnd({ reason: "error", video });
          }
        }, 2500);
      }
    }

    playAudi(video, onEnd, token) {
      const host = document.createElement("div");
      host.className = "audi-embed-host";
      this.mount.appendChild(host);

      const script = document.createElement("script");
      script.src = "https://www.audimedia.tv/embed.js";
      script.id = `amc-video-${video.id}-en`;
      script.setAttribute("data-autoplay", "true");
      script.async = true;

      let timerStarted = false;
      const startEndTimer = () => {
        if (timerStarted || token !== this.playToken) return;
        timerStarted = true;
        this.status(`Playing: ${video.title}`);
        const runtime = Number(video.durationSeconds) || 90;
        const delay = (runtime + this.options.audiEndBufferSeconds) * 1000;
        this.audiTimer = setTimeout(() => {
          if (token === this.playToken && typeof onEnd === "function") {
            onEnd({ reason: "timed-end", video });
          }
        }, delay);
      };

      this.audiObserver = new MutationObserver(() => {
        const playerLike = host.querySelector("iframe, video, object, embed, [class*='player']");
        if (playerLike) {
          this.audiObserver.disconnect();
          setTimeout(startEndTimer, 1200);
        }
      });
      this.audiObserver.observe(host, { childList: true, subtree: true });

      this.audiLoadFallback = setTimeout(startEndTimer, 5000);

      script.onerror = () => {
        if (token !== this.playToken) return;
        this.status(`Audi MediaTV could not load: ${video.title}`);
        if (this.audiObserver) this.audiObserver.disconnect();
        if (this.audiLoadFallback) clearTimeout(this.audiLoadFallback);
        setTimeout(() => {
          if (token === this.playToken && typeof onEnd === "function") {
            onEnd({ reason: "error", video });
          }
        }, 1800);
      };

      host.appendChild(script);
    }
  }

  window.AudiShowcasePlayer = AudiShowcasePlayer;
})();
