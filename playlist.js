const trackListEl = document.getElementById("track-list");
const playAllBtn = document.getElementById("play-all-btn");
const nowPlayingBar = document.getElementById("now-playing-bar");
const nowPlayingTitle = document.getElementById("now-playing-title");
const stopBtn = document.getElementById("stop-btn");

let sequenceActive = false;
let sequenceIndex = -1;
const audioEls = [];
const allAudioEls = [];

// --- Pitch shift — lecture du fichier pré-rendu slug-shifted.mp3 ---
var _pitchAudio = null; // l'élément <audio> de lecture shiftée en cours

function pitchLabel(semitones) {
  var tones = Math.abs(semitones) / 2;
  var label = tones % 1 === 0 ? String(tones) : String(tones).replace(".", ",");
  return "\uD83C\uDFB5 -" + label + " ton";
}

function stopAllPitch() {
  if (_pitchAudio) {
    _pitchAudio.pause();
    _pitchAudio._btn.textContent = _pitchAudio._label;
    _pitchAudio = null;
  }
}

function createPitchBtn(track, index) {
  var label = pitchLabel(track.pitchShift);
  var shiftedSrc = "audio/" + track.slug + "-shifted.mp3";

  var btn = document.createElement("button");
  btn.className = "pl-pitch-btn";
  btn.textContent = label;

  btn.addEventListener("click", function() {
    // Si ce bouton est déjà actif → stop
    if (_pitchAudio && _pitchAudio._index === index) {
      stopAllPitch();
      return;
    }

    // Stop tout le reste
    stopAllPitch();
    pauseAllExcept(null);
    if (sequenceActive) stopSequence();

    var audio = new Audio(shiftedSrc);
    audio._btn = btn;
    audio._label = label;
    audio._index = index;
    _pitchAudio = audio;

    btn.textContent = "\u23F9 Stop";
    allAudioEls.push(audio);

    audio.addEventListener("ended", function() {
      if (_pitchAudio === audio) {
        btn.textContent = label;
        _pitchAudio = null;
      }
      var i = allAudioEls.indexOf(audio);
      if (i !== -1) allAudioEls.splice(i, 1);
    });

    audio.play();
  });

  return btn;
}
// --- Fin pitch shift ---

// --- Tonalité + BPM (affichage seul) ---
function createMetaRow(track) {
  var row = document.createElement("div");
  row.className = "pl-track-meta";

  if (track.key) {
    var kb = document.createElement("span");
    kb.className = "pl-meta-badge";
    kb.textContent = "\uD83C\uDFB5 " + track.key;
    row.appendChild(kb);
  }

  if (track.bpm) {
    var bb = document.createElement("span");
    bb.className = "pl-meta-badge";
    bb.textContent = track.bpm + " BPM";
    row.appendChild(bb);
  }

  return row.children.length ? row : null;
}
// ---

function pauseAllExcept(except) {
  allAudioEls.forEach(function(a) {
    if (a !== except && !a.paused) a.pause();
  });
}

function createPlayer(src, label) {
  var wrapper = document.createElement("div");
  wrapper.className = "pl-audio-wrapper";

  if (label) {
    var tag = document.createElement("span");
    tag.className = "pl-audio-label";
    tag.textContent = label;
    wrapper.appendChild(tag);
  }

  var audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.src = src;
  wrapper.appendChild(audio);

  allAudioEls.push(audio);
  audio.addEventListener("play", function() {
    stopAllPitch();
    pauseAllExcept(audio);
  });

  return { wrapper: wrapper, audio: audio };
}

function renderTierHeading(tierKey) {
  var tier = TIERS[tierKey];
  var h2 = document.createElement("h2");
  h2.className = "pl-tier-heading";
  h2.textContent = tier.emoji + " " + tier.label;
  return h2;
}

function renderTrack(track, index) {
  var card = document.createElement("div");
  card.className = "pl-track";
  card.dataset.index = index;

  var number = document.createElement("span");
  number.className = "pl-track-number";
  number.textContent = index + 1;

  var info = document.createElement("div");
  info.className = "pl-track-info";

  var title = document.createElement("p");
  title.className = "pl-track-title";
  title.textContent = track.title;
  info.appendChild(title);

  var metaRow = createMetaRow(track);
  if (metaRow) info.appendChild(metaRow);

  var newLabel = track.dualVersion ? "Nouvelle version (IA)" : null;
  var newResult = createPlayer("audio/" + track.slug + ".mp3", newLabel);
  var audio = newResult.audio;
  audio.dataset.index = index;

  audio.addEventListener("play", function() {
    if (!sequenceActive) setNowPlaying(index, false);
  });

  audio.addEventListener("ended", function() {
    if (sequenceActive && index === sequenceIndex) {
      playNextInSequence();
    } else if (!sequenceActive) {
      clearNowPlaying();
    }
  });

  info.appendChild(newResult.wrapper);

  if (track.dualVersion) {
    var oldResult = createPlayer("audio/" + track.oldFile, "Ancienne version");
    info.appendChild(oldResult.wrapper);
  }

  if (track.pitchShift) {
    info.appendChild(createPitchBtn(track, index));
  }

  card.appendChild(number);
  card.appendChild(info);

  audioEls[index] = audio;
  return card;
}

function renderPlaylist() {
  trackListEl.replaceChildren();
  var currentTier = null;

  PLAYLIST.forEach(function(track, index) {
    if (track.tier !== currentTier) {
      currentTier = track.tier;
      trackListEl.appendChild(renderTierHeading(currentTier));
    }
    trackListEl.appendChild(renderTrack(track, index));
  });
}

function setNowPlaying(index, isSequence) {
  var track = PLAYLIST[index];
  nowPlayingTitle.textContent = (index + 1) + ". " + track.title;
  nowPlayingBar.classList.remove("hidden");
  nowPlayingBar.classList.toggle("pl-sequence-mode", isSequence);

  document.querySelectorAll(".pl-track").forEach(function(card) {
    card.classList.toggle("pl-track-active", Number(card.dataset.index) === index);
  });

  var activeCard = trackListEl.querySelector(".pl-track[data-index=\"" + index + "\"]");
  if (activeCard) activeCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearNowPlaying() {
  nowPlayingBar.classList.add("hidden");
  document.querySelectorAll(".pl-track").forEach(function(card) {
    card.classList.remove("pl-track-active");
  });
}

function playNextInSequence() {
  var nextIndex = sequenceIndex + 1;
  if (nextIndex >= PLAYLIST.length) {
    stopSequence();
    return;
  }
  sequenceIndex = nextIndex;
  setNowPlaying(sequenceIndex, true);
  audioEls[sequenceIndex].currentTime = 0;
  audioEls[sequenceIndex].play();
}

function startSequence() {
  sequenceActive = true;
  sequenceIndex = -1;
  playAllBtn.textContent = "\u23F8 Lecture en cours...";
  playAllBtn.disabled = true;
  playNextInSequence();
}

function stopSequence() {
  sequenceActive = false;
  sequenceIndex = -1;
  playAllBtn.textContent = "\u25B6 Tout \u00E9couter";
  playAllBtn.disabled = false;
  allAudioEls.forEach(function(a) { a.pause(); });
  clearNowPlaying();
}

playAllBtn.addEventListener("click", function() {
  if (sequenceActive) return;
  startSequence();
});

stopBtn.addEventListener("click", function() {
  if (sequenceActive) {
    stopSequence();
  } else {
    allAudioEls.forEach(function(a) { a.pause(); });
    clearNowPlaying();
  }
});

renderPlaylist();
