(function () {
  var list = document.getElementById("radioMixList");
  var status = document.getElementById("radioMixStatus");
  var ambientAudio = document.getElementById("radioAmbientAudio");
  var ambientAudioEnabled = true;
  var waitingForInteraction = false;
  var introLimitSeconds = 15;
  var introLimitReached = false;
  var introLimitTimer = null;

  if (!list || !status) {
    return;
  }

  function formatDuration(totalSeconds) {
    var seconds = Number(totalSeconds) || 0;
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainingSeconds = seconds % 60;
    var paddedMinutes = minutes < 10 ? "0" + minutes : String(minutes);
    var paddedSeconds = remainingSeconds < 10 ? "0" + remainingSeconds : String(remainingSeconds);

    if (hours > 0) {
      return hours + ":" + paddedMinutes + ":" + paddedSeconds;
    }

    return minutes + ":" + paddedSeconds;
  }

  function formatPlays(count) {
    var value = Number(count) || 0;
    return value.toLocaleString("fr-FR") + " plays";
  }

  function setStatus(message, isError) {
    if (status.hasAttribute("hidden")) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function bindFirstInteraction() {
    if (waitingForInteraction) {
      return;
    }

    waitingForInteraction = true;

    function resumeAmbientAudio() {
      waitingForInteraction = false;
      window.removeEventListener("pointerdown", resumeAmbientAudio);
      window.removeEventListener("keydown", resumeAmbientAudio);
      startAmbientAudio(true);
    }

    window.addEventListener("pointerdown", resumeAmbientAudio, { once: true });
    window.addEventListener("keydown", resumeAmbientAudio, { once: true });
  }

  function startAmbientAudio(forceUnmute) {
    if (!ambientAudio || !ambientAudioEnabled || introLimitReached) {
      return;
    }

    if (forceUnmute) {
      ambientAudio.muted = false;
    }

    ambientAudio.volume = 1;

    ambientAudio.play()
      .then(function () {
        ambientAudio.muted = false;
        if (introLimitTimer) {
          window.clearTimeout(introLimitTimer);
        }

        introLimitReached = false;
        introLimitTimer = window.setTimeout(function () {
          if (!ambientAudio || ambientAudio.paused) {
            return;
          }

          introLimitReached = true;
          ambientAudio.pause();
          ambientAudio.currentTime = 0;
        }, introLimitSeconds * 1000);
      })
      .catch(function () {
        ambientAudio.pause();
        ambientAudio.muted = true;
        bindFirstInteraction();
      });
  }

  function renderMixes(mixes) {
    list.innerHTML = "";

    mixes.forEach(function (mix) {
      var frameWrap = document.createElement("div");
      frameWrap.className = "radio-embed-frame-wrap";
      frameWrap.innerHTML =
        '<iframe class="radio-embed-frame" scrolling="no" id="hearthis_at_track_' + mix.id + '_light" style="border-radius: 10px;" width="100%" height="150" src="' + mix.embedUrl + '" frameborder="0" allow="autoplay" allowtransparency></iframe>';

      list.appendChild(frameWrap);
    });
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP " + response.status + " for " + url);
      }

      return response.json();
    });
  }

  fetchJson("/api/hearthis/funkthetown/mixes")
    .catch(function () {
      return fetchJson("data/hearthis-funkthetown-mixes.json");
    })
    .then(function (payload) {
      var mixes = payload.mixes || [];

      if (!mixes.length) {
        setStatus("Aucun mix public trouve sur HearThis.", true);
        return;
      }

      renderMixes(mixes);
      setStatus(mixes.length + " mixes affiches depuis HearThis.", false);
    })
    .catch(function (error) {
      setStatus("Impossible de charger les mixes HearThis.", true);
      console.error(error);
    });

  if (ambientAudio) {
    ambientAudio.addEventListener("ended", function () {
      introLimitReached = true;
      ambientAudio.currentTime = 0;
    });

    ambientAudio.addEventListener("pause", function () {
      if (introLimitTimer) {
        window.clearTimeout(introLimitTimer);
        introLimitTimer = null;
      }
    });

    startAmbientAudio(false);
  }
})();
