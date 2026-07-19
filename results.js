// Affiche, pour chaque chanson, des pastilles avec les initiales des votants.
// Va lire les votes déjà soumis via l'API GitHub (Issues avec le label "vote").
// Si une même personne a voté plusieurs fois (même prénom), seul son vote le
// plus récent est compté — ça permet de changer d'avis en revotant.

const refreshBtn = document.getElementById("refresh-results-btn");
const statusEl = document.getElementById("results-status");
const leaderboardEl = document.getElementById("leaderboard");
const leaderboardListEl = document.getElementById("leaderboard-list");
const TOP_N = 12;

function initialsFor(name) {
  const s = name.trim();
  if (!s) return "?";
  return s.slice(0, 1).toUpperCase() + s.slice(1, 3).toLowerCase();
}

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

function parseIssue(issue) {
  const titleMatch = issue.title.match(/—\s*(.+)$/);
  const prenom = (titleMatch ? titleMatch[1] : issue.user?.login || "Anonyme").trim();

  const songTitles = [];
  const lines = (issue.body || "").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*\d+\.\s+(.+?)\s*$/);
    if (m) songTitles.push(m[1].trim());
  }

  return { prenom, songTitles, createdAt: issue.created_at };
}

function latestVotePerPerson(issues) {
  const byPerson = new Map();
  issues.forEach((issue) => {
    const parsed = parseIssue(issue);
    const key = parsed.prenom.toLowerCase();
    const existing = byPerson.get(key);
    if (!existing || new Date(parsed.createdAt) > new Date(existing.createdAt)) {
      byPerson.set(key, parsed);
    }
  });
  return Array.from(byPerson.values());
}

function buildTally(votes) {
  const tally = new Map();
  votes.forEach((vote) => {
    vote.songTitles.forEach((title) => {
      if (!tally.has(title)) tally.set(title, []);
      tally.get(title).push(vote.prenom);
    });
  });
  return tally;
}

function clearBadges() {
  document.querySelectorAll(".vote-badges").forEach((el) => {
    el.innerHTML = "";
  });
}

function renderTally(tally) {
  clearBadges();
  tally.forEach((voters, songTitle) => {
    const container = document.querySelector(
      `.vote-badges[data-song-title="${CSS.escape(songTitle)}"]`
    );
    if (!container) return;

    const count = document.createElement("span");
    count.className = "vote-count";
    count.textContent = `${voters.length} vote${voters.length > 1 ? "s" : ""}`;
    container.appendChild(count);

    voters.forEach((prenom) => {
      const badge = document.createElement("span");
      badge.className = "vote-badge";
      badge.textContent = initialsFor(prenom);
      badge.title = prenom;
      badge.style.backgroundColor = colorFor(prenom);
      container.appendChild(badge);
    });
  });
}

function renderLeaderboard(tally) {
  leaderboardListEl.innerHTML = "";

  const ranked = Array.from(tally.entries())
    .map(([title, voters]) => ({ title, voters }))
    .sort((a, b) => b.voters.length - a.voters.length)
    .slice(0, TOP_N);

  if (ranked.length === 0) {
    leaderboardEl.classList.add("hidden");
    return;
  }

  leaderboardEl.classList.remove("hidden");

  ranked.forEach(({ title, voters }) => {
    const li = document.createElement("li");

    const titleSpan = document.createElement("span");
    titleSpan.className = "leaderboard-title";
    titleSpan.textContent = title;
    li.appendChild(titleSpan);

    const badges = document.createElement("span");
    badges.className = "vote-badges";

    const count = document.createElement("span");
    count.className = "vote-count";
    count.textContent = `${voters.length} vote${voters.length > 1 ? "s" : ""}`;
    badges.appendChild(count);

    voters.forEach((prenom) => {
      const badge = document.createElement("span");
      badge.className = "vote-badge";
      badge.textContent = initialsFor(prenom);
      badge.title = prenom;
      badge.style.backgroundColor = colorFor(prenom);
      badges.appendChild(badge);
    });

    li.appendChild(badges);
    leaderboardListEl.appendChild(li);
  });
}

async function loadResults() {
  if (!GITHUB_REPO || GITHUB_REPO.includes("TON-COMPTE")) {
    statusEl.textContent = "Repo GitHub non configuré (config.js) — impossible de charger les votes.";
    leaderboardEl.classList.add("hidden");
    return;
  }

  statusEl.textContent = "Chargement des votes...";
  refreshBtn.disabled = true;

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=vote&state=all&per_page=100`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });

    if (!res.ok) {
      if (res.status === 403) {
        statusEl.textContent = "Limite de requêtes GitHub atteinte, réessaie dans quelques minutes.";
      } else if (res.status === 404) {
        statusEl.textContent = "Repo introuvable ou privé — les votes doivent être publics pour s'afficher ici.";
      } else {
        statusEl.textContent = `Erreur (${res.status}) en chargeant les votes.`;
      }
      return;
    }

    const issues = await res.json();
    const votes = latestVotePerPerson(issues);
    const tally = buildTally(votes);
    renderTally(tally);
    renderLeaderboard(tally);

    statusEl.textContent = `${votes.length} vote${votes.length > 1 ? "s" : ""} pris en compte.`;
  } catch (err) {
    statusEl.textContent = "Impossible de charger les votes (connexion ?).";
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", loadResults);

loadResults();
