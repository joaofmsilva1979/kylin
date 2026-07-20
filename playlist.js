const trackListEl = document.getElementById("track-list");
const playAllBtn = document.getElementById("play-all-btn");
const nowPlayingBar = document.getElementById("now-playing-bar");
const nowPlayingTitle = document.getElementById("now-playing-title");
const stopBtn = document.getElementById("stop-btn");

let sequenceActive = false;
let sequenceIndex = -1;
const audioEls = [];
const allAudioEls = [];

function pauseAllExcept(except) {
  allAudioEls.forEach((a) => {
    if (a !== except && !a.paused) a.pause();
  });
}

function createPlayer(src, label) {
  const wrapper = document.createElement("div");
  wrapper.className = "pl-audio-wrapper";

  if (label) {
    const tag = document.createElement("span");
    tag.className = "pl-audio-label";
    tag.textContent = label;
    wrapper.appendChild(tag);
  }

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.src = src;
  wrapper.appendChild(audio);

  allAudioEls.push(audio);
  audio.addEventListener("play", () => pauseAllExcept(audio));

  return { wrapper, audio };
}

function renderTierHeading(tierKey) {
  const tier = TIERS[tierKey];
  const h2 = document.createElement("h2");
  h2.className = "pl-tier-heading";
  h2.textContent = `${tier.emoji} ${tier.label}`;
  return h2;
}

function renderTrack(track, index) {
  const card = document.createElement("div");
  card.className = "pl-track";
  card.dataset.index = index;

  const number = document.createElement("span");
  number.className = "pl-track-number";
  number.textContent = index + 1;

  const info = document.createElement("div");
  info.className = "pl-track-info";

  const title = document.createElement("p");
  title.className = "pl-track-title";
  title.textContent = track.title;

  info.appendChild(title);

  const newLabel = track.dualVersion ? "Nouvelle version (IA)" : null;
  const { wrapper: newWrapper, audio } = createPlayer("audio/" + track.slug + ".mp3", newLabel);
  audio.dataset.index = index;

  audio.addEventListener("play", () => {
    if (!sequenceActive) setNowPlaying(index, false);
  });

  audio.addEventListener("ended", () => {
    if (sequenceActive && index === sequenceIndex) {
      playNextInSequence();
    } else if (!sequenceActive) {
      clearNowPlaying();
    }
  });

  info.appendChild(newWrapper);

  if (track.dualVersion) {
    const { wrapper: oldWrapper } = createPlayer("audio/" + track.oldFile, "Ancienne version");
    info.appendChild(oldWrapper);
  }

  card.appendChild(number);
  card.appendChild(info);

  audioEls[index] = audio;
  return card;
}

function renderPlaylist() {
  trackListEl.innerHTML = "";
  let currentTier = null;

  PLAYLIST.forEach((track, index) => {
    if (track.tier !== currentTier) {
      currentTier = track.tier;
      trackListEl.appendChild(renderTierHeading(currentTier));
    }
    trackListEl.appendChild(renderTrack(track, index));
  });
}

function setNowPlaying(index, isSequence) {
  const track = PLAYLIST[index];
  nowPlayingTitle.textContent = `${index + 1}. ${track.title}`;
  nowPlayingBar.classList.remove("hidden");
  nowPlayingBar.classList.toggle("pl-sequence-mode", isSequence);

  document.querySelectorAll(".pl-track").forEach((card) => {
    card.classList.toggle("pl-track-active", Number(card.dataset.index) === index);
  });

  const activeCard = trackListEl.querySelector(`.pl-track[data-index="${index}"]`);
  if (activeCard) activeCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearNowPlaying() {
  nowPlayingBar.classList.add("hidden");
  document.querySelectorAll(".pl-track").forEach((card) => card.classList.remove("pl-track-active"));
}

function playNextInSequence() {
  const nextIndex = sequenceIndex + 1;
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
  playAllBtn.textContent = "⏸ Lecture en cours...";
  playAllBtn.disabled = true;
  playNextInSequence();
}

function stopSequence() {
  sequenceActive = false;
  sequenceIndex = -1;
  playAllBtn.textContent = "▶ Tout écouter";
  playAllBtn.disabled = false;
  allAudioEls.forEach((a) => a.pause());
  clearNowPlaying();
}

playAllBtn.addEventListener("click", () => {
  if (sequenceActive) return;
  startSequence();
});

stopBtn.addEventListener("click", () => {
  if (sequenceActive) {
    stopSequence();
  } else {
    allAudioEls.forEach((a) => a.pause());
    clearNowPlaying();
  }
});

renderPlaylist();
