const MAX_CHOICES = 10;

const listEl = document.getElementById("song-list");
const counterEl = document.getElementById("counter");
const prenomEl = document.getElementById("prenom");
const validateBtn = document.getElementById("validate-btn");
const validateHint = document.getElementById("validate-hint");
const confirmationEl = document.getElementById("confirmation");
const confirmNameEl = document.getElementById("confirm-name");
const resetBtn = document.getElementById("reset-btn");
const mainEl = document.querySelector("main");
const waLinkEl = document.getElementById("wa-link");
const emailLinkEl = document.getElementById("email-link");
const NOTIFY_EMAIL = "joaofmsilva1979@gmail.com";
const copyBtn = document.getElementById("copy-message-btn");
const copyStatusEl = document.getElementById("copy-status");
const confirmSuccessEl = document.getElementById("confirm-success");
const confirmFallbackEl = document.getElementById("confirm-fallback");

let lastMessage = "";

function createAudioPlayer(filename, label) {
  const wrapper = document.createElement("div");
  wrapper.className = "audio-wrapper";

  if (label) {
    const tag = document.createElement("span");
    tag.className = "audio-label";
    tag.textContent = label;
    wrapper.appendChild(tag);
  }

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  const source = document.createElement("source");
  source.src = "audio/" + filename;
  source.type = "audio/mpeg";
  audio.appendChild(source);
  audio.appendChild(document.createTextNode("Ton navigateur ne supporte pas la lecture audio."));
  wrapper.appendChild(audio);

  return wrapper;
}

function renderSongs() {
  listEl.innerHTML = "";
  SONGS.forEach((song) => {
    const li = document.createElement("li");
    li.className = "song-row";
    li.dataset.songTitle = song.title;

    const label = document.createElement("label");
    label.className = "song-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = song.slug;
    checkbox.dataset.title = song.title;
    checkbox.addEventListener("change", onSelectionChange);

    const titleSpan = document.createElement("span");
    titleSpan.className = "song-title";
    titleSpan.textContent = song.title;

    label.appendChild(checkbox);
    label.appendChild(titleSpan);
    li.appendChild(label);

    if (song.noAudio) {
      const notice = document.createElement("p");
      notice.className = "no-audio-notice";
      notice.textContent = "Aperçu audio pas encore disponible.";
      li.appendChild(notice);
    } else if (song.dualVersion) {
      li.appendChild(createAudioPlayer(song.slug + ".mp3", "Nouvelle version (IA)"));
      li.appendChild(createAudioPlayer(song.oldFile, "Ancienne version"));
    } else {
      li.appendChild(createAudioPlayer(song.slug + ".mp3", null));
    }

    const badges = document.createElement("div");
    badges.className = "vote-badges";
    badges.dataset.songTitle = song.title;
    li.appendChild(badges);

    listEl.appendChild(li);
  });
}

function getCheckboxes() {
  return Array.from(listEl.querySelectorAll('input[type="checkbox"]'));
}

function onSelectionChange() {
  const checkboxes = getCheckboxes();
  const selected = checkboxes.filter((c) => c.checked);

  counterEl.textContent = selected.length;

  const atLimit = selected.length >= MAX_CHOICES;
  checkboxes.forEach((c) => {
    if (!c.checked) c.disabled = atLimit;
  });

  updateValidateState();
}

function updateValidateState() {
  const selected = getCheckboxes().filter((c) => c.checked);
  const nameOk = prenomEl.value.trim().length > 0;
  const countOk = selected.length === MAX_CHOICES;

  validateBtn.disabled = !(nameOk && countOk);

  if (!nameOk) {
    validateHint.textContent = `Dis qui tu es et choisis exactement ${MAX_CHOICES} chansons.`;
  } else if (!countOk) {
    validateHint.textContent = `Choisis exactement ${MAX_CHOICES} chansons (actuellement ${selected.length}).`;
  } else {
    validateHint.textContent = "Prêt à valider !";
  }
}

prenomEl.addEventListener("change", updateValidateState);

async function submitVote(prenom, songs) {
  if (!SHEET_API_URL || SHEET_API_URL.includes("COLLE-TON-URL")) {
    return false;
  }
  try {
    const res = await fetch(SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ prenom, songs }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch (err) {
    return false;
  }
}

validateBtn.addEventListener("click", async () => {
  const prenom = prenomEl.value.trim();
  const selectedTitles = getCheckboxes()
    .filter((c) => c.checked)
    .map((c) => c.dataset.title);

  if (!prenom || selectedTitles.length !== MAX_CHOICES) return;

  validateBtn.disabled = true;
  validateBtn.textContent = "Envoi en cours...";

  const lines = [
    `🎸 Mon vote Ky-Lin (${prenom}) :`,
    ...selectedTitles.map((t, i) => `${i + 1}. ${t}`),
  ];
  lastMessage = lines.join("\n");

  const success = await submitVote(prenom, selectedTitles);

  validateBtn.disabled = false;
  validateBtn.textContent = "Valider mon vote";

  waLinkEl.href = `https://wa.me/?text=${encodeURIComponent(lastMessage)}`;
  const emailSubject = `Ky-Lin — vote de ${prenom}`;
  emailLinkEl.href = `mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(lastMessage)}`;
  copyStatusEl.textContent = "";
  confirmSuccessEl.classList.toggle("hidden", !success);
  confirmFallbackEl.classList.toggle("hidden", success);

  confirmNameEl.textContent = prenom;
  setVoteFormVisible(false);
  confirmationEl.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastMessage);
    copyStatusEl.textContent = "Copié ! Colle-le où tu veux (groupe, SMS, email...).";
  } catch (err) {
    copyStatusEl.textContent = "Impossible de copier automatiquement, sélectionne le texte ci-dessus à la main.";
  }
});

resetBtn.addEventListener("click", () => {
  prenomEl.value = "";
  getCheckboxes().forEach((c) => {
    c.checked = false;
    c.disabled = false;
  });
  counterEl.textContent = "0";
  updateValidateState();
  setVoteFormVisible(true);
  confirmationEl.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function setVoteFormVisible(visible) {
  const elements = [
    ...mainEl.querySelectorAll("section:not(#confirmation)"),
    listEl,
  ];
  elements.forEach((el) => el.classList.toggle("hidden", !visible));
}

renderSongs();
updateValidateState();
