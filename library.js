(function () {
  "use strict";

  const videos = window.AUDI_SHOWCASE_VIDEOS || [];
  const list = document.getElementById("videoList");
  const search = document.getElementById("searchInput");
  const filter = document.getElementById("sourceFilter");
  const resultCount = document.getElementById("resultCount");

  function formatDuration(seconds) {
    if (!seconds) return "Automatic end detection";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function render() {
    const term = search.value.trim().toLowerCase();
    const sourceType = filter.value;
    const shown = videos.filter(video => {
      const matchesTerm = !term || `${video.title} ${video.source} ${video.number}`.toLowerCase().includes(term);
      const matchesSource = sourceType === "all" || video.type === sourceType;
      return matchesTerm && matchesSource;
    });

    list.replaceChildren();

    shown.forEach(video => {
      const row = document.createElement("article");
      row.className = "video-card";

      const sourceName = video.type === "audi" ? "Audi MediaTV" : "YouTube";
      const duration = video.type === "audi" ? formatDuration(video.durationSeconds) : "Automatic end detection";

      row.innerHTML = `
        <div class="video-number">${String(video.number).padStart(2, "0")}</div>
        <div class="video-info">
          <h2>${escapeHtml(video.title)}</h2>
          <p>${escapeHtml(video.source)} <span>•</span> ${sourceName} <span>•</span> ${duration}</p>
        </div>
        <div class="video-actions">
          <a class="secondary-button" href="watch.html?video=${video.number}" target="_blank" rel="noopener">Open film</a>
          <a class="primary-small" href="index.html?video=${video.number}" target="_blank" rel="noopener">Start showcase here</a>
        </div>
      `;

      list.appendChild(row);
    });

    resultCount.textContent = `${shown.length} of ${videos.length} films`;
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
  render();
})();
