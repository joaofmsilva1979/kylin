// Affiche le classement des chansons en lisant en direct le Google Sheet (via
// l'API Apps Script). Le Top 10 est mis en valeur, le reste suit dans l'ordre.
// Se rafraîchit automatiquement toutes les 20 secondes.

const TOP_HIGHLIGHT = 10;
const REFRESH_INTERVAL_MS = 20000;

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

function latestVotePerPerson(votes) {
  const byPerson = new Map();
  votes.forEach((vote) => {
    byPerson.set(vote.prenom.toLowerCase(), vote);
  });
  return Array.from(byPerson.values());
}

function buildTally(votes) {
  const tally = new Map();
  votes.forEach((vote) => {
    vote.songs.forEach((title) => {
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

function renderLeaderboard(tally, participantCount) {
  const leaderboardListEl = document.getElementById("leaderboard-list");
  const leaderboardEl = document.getElementById("leaderboard");
  leaderboardListEl.innerHTML = "";

  const ranked = Array.from(tally.entries())
    .map(([title, voters]) => ({ title, voters }))
    .sort((a, b) => b.voters.length - a.voters.length);

  if (ranked.length === 0) {
    leaderboardEl.classList.add("hidden");
    return;
  }

  leaderboardEl.classList.remove("hidden");

  ranked.forEach(({ title, voters }, index) => {
    const li = document.createElement("li");
    if (index < TOP_HIGHLIGHT) li.classList.add("leaderboard-top");

    const rank = document.createElement("span");
    rank.className = "leaderboard-rank";
    rank.textContent = `${index + 1}`;
    li.appendChild(rank);

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

    if (index === TOP_HIGHLIGHT - 1 && ranked.length > TOP_HIGHLIGHT) {
      const divider = document.createElement("li");
      divider.className = "leaderboard-divider";
      divider.textContent = "— le reste, dans l'ordre —";
      leaderboardListEl.appendChild(divider);
    }
  });

  const statusEl = document.getElementById("results-status");
  statusEl.textContent = `${participantCount} participant${participantCount > 1 ? "s" : ""} pris en compte.`;
}

async function fetchVotes() {
  if (!SHEET_API_URL || SHEET_API_URL.includes("COLLE-TON-URL")) {
    document.getElementById("results-status").textContent =
      "Classement pas encore branché (sheet-config.js à configurer).";
    return null;
  }
  try {
    const res = await fetch(SHEET_API_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    document.getElementById("results-status").textContent =
      "Impossible de charger le classement pour l'instant.";
    return null;
  }
}

async function loadResults() {
  const rawVotes = await fetchVotes();
  if (!rawVotes) {
    document.getElementById("leaderboard").classList.add("hidden");
    return;
  }
  const votes = latestVotePerPerson(rawVotes);
  const tally = buildTally(votes);
  renderTally(tally);
  renderLeaderboard(tally, votes.length);
}

loadResults();
setInterval(loadResults, REFRESH_INTERVAL_MS);
