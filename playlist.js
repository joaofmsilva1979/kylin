const trackListEl = document.getElementById("track-list");
const playAllBtn = document.getElementById("play-all-btn");
const nowPlayingBar = document.getElementById("now-playing-bar");
const nowPlayingTitle = document.getElementById("now-playing-title");
const stopBtn = document.getElementById("stop-btn");

let sequenceActive = false;
let sequenceIndex = -1;
const audioEls = [];
const allAudioEls = [];

// --- Pitch shift (Web Audio API — detune sans changer le tempo) ---
const pitchState = {};
const pitchBufferCache = new Map();

function pitchLabel(semitones) {
  var tones = Math.abs(semitones) / 2;
  var label = tones % 1 === 0 ? String(tones) : String(tones).replace(".", ",");
  return "\uD83C\uDFB5 -" + label + " ton";
}

function stopAllPitch() {
  Object.keys(pitchState).forEach(function(i) {
    var state = pitchState[i];
    delete pitchState[i];
    try { state.source.stop(); } catch (e) {}
    try { state.ctx.close(); } catch (e) {}
    state.btn.textContent = pitchLabel(state.semitones);
    state.btn.disabled = false;
  });
}

async function togglePitch(src, slug, semitones, index, btn) {
  if (pitchState[index]) {
    var prev = pitchState[index];
    delete pitchState[index];
    try { prev.source.stop(); } catch (e) {}
    try { prev.ctx.close(); } catch (e) {}
    btn.textContent = pitchLabel(semitones);
    return;
  }

  pauseAllExcept(null);
  if (sequenceActive) stopSequence();

  btn.textContent = "\u23F3\u2026";
  btn.disabled = true;

  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();

    var buffer = pitchBufferCache.get(slug);
    if (!buffer) {
      var ab = await fetch(src).then(function(r) { return r.arrayBuffer(); });
      buffer = await ctx.decodeAudioData(ab);
      pitchBufferCache.set(slug, buffer);
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.detune.value = semitones * 100; // cents : -200 = -1 ton, -300 = -1,5 ton
    source.connect(ctx.destination);
    source.start();

    pitchState[index] = { source: source, ctx: ctx, btn: btn, semitones: semitones };
    btn.textContent = "\u23F9 Stop";
    btn.disabled = false;

    source.addEventListener("ended", function() {
      if (!pitchState[index]) return;
      delete pitchState[index];
      try { ctx.close(); } catch (e) {}
      btn.textContent = pitchLabel(semitones);
    });
  } catch (e) {
    console.error("Pitch error:", e);
    btn.textContent = pitchLabel(semitones);
    btn.disabled = false;
  }
}

function createPitchBtn(track, index) {
  var btn = document.createElement("button");
  btn.className = "pl-pitch-btn";
  btn.textContent = pitchLabel(track.pitchShift);
  btn.addEventListener("click", function() {
    togglePitch("audio/" + track.slug + ".mp3", track.slug, track.pitchShift, index, btn);
  });
  return btn;
}
// --- Fin pitch shift ---

// --- Transposition de tonalité ---
var CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var ENHARMONIC = { Db: "C#", Eb: "D#", Fb: "E", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B" };

function transposeKey(key, semitones) {
  if (!key || !semitones) return null;
  var isMinor = key.endsWith("m");
  var root = isMinor ? key.slice(0, -1) : key;
  var normalized = ENHARMONIC[root] || root;
  var idx = CHROMATIC.indexOf(normalized);
  if (idx === -1) return null;
  var newIdx = ((idx + semitones) % 12 + 12) % 12;
  return CHROMATIC[newIdx] + (isMinor ? "m" : "");
}
// --- Fin transposition ---

// --- BPM / Tonalité — localStorage ---
var STORAGE_KEY = "kylin-meta";

function getLocalMeta(slug) {
  try {
    var all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[slug] || {};
  } catch (e) { return {}; }
}

function saveLocalMeta(slug, field, value) {
  try {
    var all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!all[slug]) all[slug] = {};
    if (value === null || value === "") {
      delete all[slug][field];
    } else {
      all[slug][field] = value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
}

function makeBadgeText(field, value, pitchShift) {
  if (field === "key") {
    if (!value) return "\uD83C\uDFB5 tonalité";
    var transposed = transposeKey(value, pitchShift);
    return transposed
      ? "\uD83C\uDFB5 " + value + " \u2192 " + transposed
      : "\uD83C\uDFB5 " + value;
  }
  return value ? value + " BPM" : "BPM";
}

function editMeta(badge, slug, field, pitchShift) {
  var savedVal = getLocalMeta(slug)[field] || "";
  var input = document.createElement("input");
  input.className = "pl-meta-input";
  input.type = field === "bpm" ? "number" : "text";
  input.value = savedVal;
  input.placeholder = field === "bpm" ? "ex: 120" : "ex: Am";

  badge.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    var val = input.value.trim();
    saveLocalMeta(slug, field, val || null);
    var newBadge = document.createElement("span");
    newBadge.className = badge.className;
    newBadge.title = "Cliquer pour modifier";
    newBadge.textContent = makeBadgeText(field, val || null, pitchShift);
    newBadge.addEventListener("click", function() { editMeta(newBadge, slug, field, pitchShift); });
    input.replaceWith(newBadge);
  }

  function cancel() {
    var newBadge = document.createElement("span");
    newBadge.className = badge.className;
    newBadge.title = "Cliquer pour modifier";
    newBadge.textContent = badge.textContent;
    newBadge.addEventListener("click", function() { editMeta(newBadge, slug, field, pitchShift); });
    input.replaceWith(newBadge);
  }

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") { input.blur(); }
    if (e.key === "Escape") { input.removeEventListener("blur", commit); cancel(); }
  });
}

function createMetaBadge(slug, field, initialValue, pitchShift) {
  var badge = document.createElement("span");
  badge.className = "pl-meta-badge pl-meta-editable";
  badge.title = "Cliquer pour modifier";
  badge.textContent = makeBadgeText(field, initialValue, pitchShift);
  badge.addEventListener("click", function() { editMeta(badge, slug, field, pitchShift); });
  return badge;
}
// --- Fin BPM / Tonalité ---

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

  // Badges BPM + tonalité — toujours affichés, cliquables pour saisir
  // Pour la tonalité : affiche "original → transposé" si pitchShift défini
  var savedMeta = getLocalMeta(track.slug);
  var pitchShift = track.pitchShift || 0;
  var meta = document.createElement("div");
  meta.className = "pl-track-meta";
  meta.appendChild(createMetaBadge(track.slug, "key", savedMeta.key || track.key || null, pitchShift));
  meta.appendChild(createMetaBadge(track.slug, "bpm", savedMeta.bpm || track.bpm || null, 0));
  info.appendChild(meta);

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
