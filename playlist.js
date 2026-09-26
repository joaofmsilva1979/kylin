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
    var a = _pitchAudio;
    _pitchAudio = null;
    a._audio.pause();
    a._btn.textContent = a._label;
    if (a._keyBadge) a._keyBadge.textContent = a._origKeyText;
    a._wrapper.classList.add("hidden");
  }
}

function createPitchBtn(track, index, keyBadge) {
  var label = pitchLabel(track.pitchShift);
  var origKeyText = keyBadge ? keyBadge.textContent : null;
  var shiftedKeyText = (keyBadge && track.key)
    ? "\uD83C\uDFB5 " + (transposeKey(track.key, track.pitchShift) || track.key)
    : null;

  // Lecteur audio shifté — créé manuellement (pas via createPlayer)
  // pour éviter que son propre event 'play' appelle stopAllPitch()
  var shiftedWrapper = document.createElement("div");
  shiftedWrapper.className = "pl-audio-wrapper hidden pl-shifted-player";
  var shiftedAudio = document.createElement("audio");
  shiftedAudio.controls = true;
  shiftedAudio.preload = "none";
  shiftedAudio.src = "audio/" + track.slug + "-shifted.mp3";
  shiftedWrapper.appendChild(shiftedAudio);
  allAudioEls.push(shiftedAudio);
  // Quand l'utilisateur appuie play manuellement sur le lecteur natif
  shiftedAudio.addEventListener("play", function() { pauseAllExcept(shiftedAudio); });

  var btn = document.createElement("button");
  btn.className = "pl-pitch-btn";
  btn.textContent = label;

  btn.addEventListener("click", function() {
    // Déjà actif → stop
    if (_pitchAudio && _pitchAudio._index === index) {
      stopAllPitch();
      return;
    }

    stopAllPitch();
    pauseAllExcept(shiftedAudio);
    if (sequenceActive) stopSequence();

    if (keyBadge && shiftedKeyText) keyBadge.textContent = shiftedKeyText;

    shiftedWrapper.classList.remove("hidden");
    shiftedAudio.play();

    _pitchAudio = {
      _audio: shiftedAudio,
      _wrapper: shiftedWrapper,
      _btn: btn,
      _label: label,
      _index: index,
      _keyBadge: keyBadge,
      _origKeyText: origKeyText,
    };

    btn.textContent = "\u23F9 Stop";

    shiftedAudio.addEventListener("ended", function onEnded() {
      if (_pitchAudio && _pitchAudio._audio === shiftedAudio) stopAllPitch();
      shiftedAudio.removeEventListener("ended", onEnded);
    });
  });

  // Si l'utilisateur met pause via le lecteur natif sans passer par le bouton,
  // on laisse faire — le bouton reste en mode Stop pour qu'il puisse reprendre.

  return { btn: btn, wrapper: shiftedWrapper };
}
// --- Fin pitch shift ---

// --- Tonalité + BPM ---
var CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var ENHARMONIC = { Db:"C#", Eb:"D#", Fb:"E", Gb:"F#", Ab:"G#", Bb:"A#", Cb:"B" };

function transposeKey(key, semitones) {
  if (!key || !semitones) return null;
  var minor = key.endsWith("m");
  var root = minor ? key.slice(0, -1) : key;
  var idx = CHROMATIC.indexOf(ENHARMONIC[root] || root);
  if (idx === -1) return null;
  return CHROMATIC[((idx + semitones) % 12 + 12) % 12] + (minor ? "m" : "");
}

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
  var keyBadge = metaRow ? metaRow.querySelector(".pl-meta-badge") : null;

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
    var pitch = createPitchBtn(track, index, keyBadge);
    info.appendChild(pitch.wrapper);
    info.appendChild(pitch.btn);
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
