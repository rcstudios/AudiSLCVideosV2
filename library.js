(function () {
  "use strict";

  const videos = window.AUDI_SHOWCASE_VIDEOS || [];
  const list = document.getElementById("videoList");
  const search = document.getElementById("searchInput");
  const filter = document.getElementById("sourceFilter");
  const resultCount = document.getElementById("resultCount");
  const FAILURE_KEY = "audiShowcasePlaybackFailuresV2";

  function readFailures() {
    try { return JSON.parse(localStorage.getItem(FAILURE_KEY) || "{}"); }
    catch (_) { return {}; }
  }

  function formatDuration(seconds) {
    if (!seconds) return "Automatic end detection";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function friendlyReason(failure) {
    if (!failure) return "";
    if (failure.reason === "youtube-error" && failure.errorCode !== null) {
      return `YouTube error ${failure.errorCode}`;
    }
    return String(failure.reason || "playback error").replaceAll("-", " ");
  }

  function render() {
    const failures = readFailures();
    const issueCount = Object.keys(failures).length;
    const term = search.value.trim().toLowerCase();
    const sourceType = filter.value;

    const shown = videos.filter(video => {
      const matchesTerm = !term || `${video.title} ${video.source} ${video.number} ${video.id}`.toLowerCase().includes(term);
      let matchesSource = true;
      if (sourceType === "audi" || sourceType === "youtube") matchesSource = video.type === sourceType;
      if (sourceType === "issues") matchesSource = Boolean(failures[String(video.number)]);
      return matchesTerm && matchesSource;
    });

    list.replaceChildren();

    shown.forEach(video => {
      const failure = failures[String(video.number)] || null;
      const row = document.createElement("article");
      row.className = `video-card${failure ? " has-issue" : ""}`;

      const sourceName = video.type === "audi" ? "Audi MediaTV" : "YouTube";
      const duration = video.type === "audi" ? formatDuration(video.durationSeconds) : "Automatic end detection";
      const issueMarkup = failure ? `
        <div class="playback-issue">
          <span class="issue-badge">Playback issue detected</span>
          <span>${escapeHtml(friendlyReason(failure))} • last seen ${escapeHtml(new Date(failure.time).toLocaleString())}</span>
        </div>` : "";

      row.innerHTML = `
        <div class="video-number">${String(video.number).padStart(2, "0")}</div>
        <div class="video-info">
          <h2>${escapeHtml(video.title)}</h2>
          <p>${escapeHtml(video.source)} <span>•</span> ${sourceName} <span>•</span> ${duration}</p>
          ${issueMarkup}
        </div>
        <div class="video-actions">
          <a class="secondary-button" href="watch.html?video=${video.number}" target="_blank" rel="noopener">Open film</a>
          <a class="primary-small" href="index.html?video=${video.number}" target="_blank" rel="noopener">Start showcase here</a>
        </div>
      `;

      list.appendChild(row);
    });

    resultCount.textContent = issueCount
      ? `${shown.length} of ${videos.length} films • ${issueCount} playback issue${issueCount === 1 ? "" : "s"}`
      : `${shown.length} of ${videos.length} films`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  window.addEventListener("storage", render);
  render();
})();
