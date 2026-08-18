(function () {
  "use strict";

  const videos = window.AUDI_SHOWCASE_VIDEOS || [];
  const params = new URLSearchParams(window.location.search);
  const number = Number(params.get("video"));
  const video = videos.find(item => item.number === number);

  const title = document.getElementById("watchTitle");
  const meta = document.getElementById("watchMeta");
  const button = document.getElementById("watchButton");
  const start = document.getElementById("watchStart");
  const mount = document.getElementById("watchMount");
  const status = document.getElementById("watchStatus");

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
    audiEndBufferSeconds: 4,
    onStatus: message => {
      status.textContent = message;
      status.classList.add("visible");
    }
  });

  function play() {
    start.classList.add("hidden");
    player.play(video, () => {
      player.destroy();
      title.textContent = video.title;
      meta.textContent = "Film finished.";
      button.querySelector("span:last-child").textContent = "Play Again";
      start.classList.remove("hidden");
    });
  }

  button.addEventListener("click", play);
})();
