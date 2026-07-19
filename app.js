const MAX_CHOICES = 8;

const listEl = document.getElementById("song-list");
const counterEl = document.getElementById("counter");
const prenomEl = document.getElementById("prenom");
const validateBtn = document.getElementById("validate-btn");
const validateHint = document.getElementById("validate-hint");
const confirmationEl = document.getElementById("confirmation");
const confirmNameEl = document.getElementById("confirm-name");
const resetBtn = document.getElementById("reset-btn");
const mainEl = document.querySelector("main");

function renderSongs() {
  listEl.innerHTML = "";
  SONGS.forEach((song) => {
    const li = document.createElement("li");
    li.className = "song-row";

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
    } else {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "none";
      const source = document.createElement("source");
      source.src = "audio/" + song.slug + ".mp3";
      source.type = "audio/mpeg";
      audio.appendChild(source);
      if (song.wav) {
        const wavSource = document.createElement("source");
        wavSource.src = "audio/" + song.slug + ".wav";
        wavSource.type = "audio/wav";
        audio.appendChild(wavSource);
      }
      audio.appendChild(document.createTextNode("Ton navigateur ne supporte pas la lecture audio."));
      li.appendChild(audio);
    }

    listEl.appendChild(li);
  });
}

function getSelectedCheckboxes() {
  return Array.from(listEl.querySelectorAll('input[type="checkbox"]'));
}

function onSelectionChange() {
  const checkboxes = getSelectedCheckboxes();
  const selected = checkboxes.filter((c) => c.checked);

  counterEl.textContent = selected.length;

  const atLimit = selected.length >= MAX_CHOICES;
  checkboxes.forEach((c) => {
    if (!c.checked) c.disabled = atLimit;
  });

  updateValidateState();
}

function updateValidateState() {
  const selected = getSelectedCheckboxes().filter((c) => c.checked);
  const nameOk = prenomEl.value.trim().length > 0;
  const countOk = selected.length === MAX_CHOICES;

  validateBtn.disabled = !(nameOk && countOk);

  if (!nameOk) {
    validateHint.textContent = "Renseigne ton prénom et choisis exactement 8 chansons.";
  } else if (!countOk) {
    validateHint.textContent = `Choisis exactement ${MAX_CHOICES} chansons (actuellement ${selected.length}).`;
  } else {
    validateHint.textContent = "Prêt à valider !";
  }
}

prenomEl.addEventListener("input", updateValidateState);

validateBtn.addEventListener("click", () => {
  const prenom = prenomEl.value.trim();
  const selectedTitles = getSelectedCheckboxes()
    .filter((c) => c.checked)
    .map((c) => c.dataset.title);

  if (!prenom || selectedTitles.length !== MAX_CHOICES) return;

  if (!GITHUB_REPO || GITHUB_REPO.includes("TON-COMPTE")) {
    alert(
      "Le repo GitHub n'est pas encore configuré (fichier config.js). " +
      "Le vote de " + prenom + " a bien été validé localement, mais il faut configurer " +
      "GITHUB_REPO dans config.js pour l'envoyer sur GitHub. Voir README.md."
    );
  } else {
    const title = encodeURIComponent(`Vote setlist — ${prenom}`);
    const bodyLines = [
      `**Prénom :** ${prenom}`,
      "",
      "**Chansons choisies :**",
      ...selectedTitles.map((t, i) => `${i + 1}. ${t}`),
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));
    const url = `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=vote`;
    window.open(url, "_blank");
  }

  confirmNameEl.textContent = prenom;
  setVoteFormVisible(false);
  confirmationEl.classList.remove("hidden");
});

resetBtn.addEventListener("click", () => {
  prenomEl.value = "";
  getSelectedCheckboxes().forEach((c) => {
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
