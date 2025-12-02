// teamPicker.js
import LEAGUES from "./data/leagues.js";
import TEAMS from "./data/teams.js";
import National from "./data/national_teams.js";
import { shuffle, loadSettings, saveSettings } from "./utils.js";

const ALL_TEAMS = [...TEAMS, ...National];

let lastAssignments = []; // [{ playerIndex, team }]

export function getLastAssignments() {
  return lastAssignments;
}

export function initTeamPicker() {
  const leagueListEl = document.getElementById("league-list");
  const playerCountEl = document.getElementById("player-count");
  const ratingMinEl = document.getElementById("rating-min");
  const ratingMaxEl = document.getElementById("rating-max");
  const onePerLeagueEl = document.getElementById("one-per-league");
  const generateBtn = document.getElementById("generate-btn");
  const clearSettingsBtn = document.getElementById("clear-settings-btn");
  const resultsEl = document.getElementById("results");
  const messageEl = document.getElementById("message");

  // Render leagues
  LEAGUES.forEach((league) => {
    const label = document.createElement("label");
    label.className = "league-chip";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = league.id;
    checkbox.dataset.leagueId = league.id;

    const text = document.createElement("span");
    text.textContent = league.name;

    label.appendChild(checkbox);
    label.appendChild(text);
    leagueListEl.appendChild(label);
  });

  // Rating options 0.5–5.0
  const ratingValues = [];
  for (let i = 1; i <= 10; i++) {
    ratingValues.push(i * 0.5);
  }

  ratingValues.forEach((val) => {
    const optMin = document.createElement("option");
    optMin.value = String(val);
    optMin.textContent = `${val.toFixed(1)}★`;
    ratingMinEl.appendChild(optMin);

    const optMax = document.createElement("option");
    optMax.value = String(val);
    optMax.textContent = `${val.toFixed(1)}★`;
    ratingMaxEl.appendChild(optMax);
  });

  ratingMinEl.value = "4.5";
  ratingMaxEl.value = "5.0";

  // Load saved settings
  const saved = loadSettings();
  if (saved) {
    if (typeof saved.playerCount === "number") {
      playerCountEl.value = String(saved.playerCount);
    }
    if (saved.minRating != null) ratingMinEl.value = String(saved.minRating);
    if (saved.maxRating != null) ratingMaxEl.value = String(saved.maxRating);
    if (typeof saved.onlyOnePerLeague === "boolean") {
      onePerLeagueEl.checked = saved.onlyOnePerLeague;
    }
    if (Array.isArray(saved.selectedLeagueIds)) {
      const set = new Set(saved.selectedLeagueIds);
      leagueListEl
        .querySelectorAll("input[type=checkbox]")
        .forEach((cb) => (cb.checked = set.has(cb.value)));
    }
  } else {
    leagueListEl
      .querySelectorAll("input[type=checkbox]")
      .forEach((cb) => (cb.checked = true));
  }

  function getSelectedLeagueIds() {
    return Array.from(
      leagueListEl.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);
  }

  function showMessage(text, type = "") {
    messageEl.textContent = text;
    messageEl.classList.remove("message--error", "message--success");
    if (type === "error") messageEl.classList.add("message--error");
    if (type === "success") messageEl.classList.add("message--success");
  }

  function persistSettings() {
    const settings = {
      selectedLeagueIds: getSelectedLeagueIds(),
      playerCount: Number(playerCountEl.value) || 0,
      minRating: parseFloat(ratingMinEl.value),
      maxRating: parseFloat(ratingMaxEl.value),
      onlyOnePerLeague: onePerLeagueEl.checked
    };
    saveSettings(settings);
  }

  leagueListEl.addEventListener("change", persistSettings);
  playerCountEl.addEventListener("input", persistSettings);
  ratingMinEl.addEventListener("change", persistSettings);
  ratingMaxEl.addEventListener("change", persistSettings);
  onePerLeagueEl.addEventListener("change", persistSettings);

  clearSettingsBtn.addEventListener("click", () => {
    localStorage.removeItem("fc26-team-picker-settings");
    leagueListEl
      .querySelectorAll("input[type=checkbox]")
      .forEach((cb) => (cb.checked = true));
    playerCountEl.value = "4";
    ratingMinEl.value = "4.5";
    ratingMaxEl.value = "5.0";
    onePerLeagueEl.checked = false;
    showMessage("Settings reset to defaults.", "success");
    resultsEl.innerHTML =
      '<p class="placeholder">Set your options and press <strong>Spin teams</strong>.</p>';
  });

  generateBtn.addEventListener("click", () => {
    const selectedLeagueIds = getSelectedLeagueIds();
    const playerCount = Number(playerCountEl.value);
    let minRating = parseFloat(ratingMinEl.value);
    let maxRating = parseFloat(ratingMaxEl.value);
    const onlyOnePerLeague = onePerLeagueEl.checked;

    if (!Number.isFinite(playerCount) || playerCount < 2) {
      showMessage("Player count must be at least 2.", "error");
      return;
    }
    if (selectedLeagueIds.length === 0) {
      showMessage("Select at least one league.", "error");
      return;
    }
    if (!Number.isFinite(minRating) || !Number.isFinite(maxRating)) {
      showMessage("Select a valid rating range.", "error");
      return;
    }

    if (minRating > maxRating) {
      [minRating, maxRating] = [maxRating, minRating];
      ratingMinEl.value = String(minRating);
      ratingMaxEl.value = String(maxRating);
    }

    const pool = ALL_TEAMS.filter(
      (team) =>
        selectedLeagueIds.includes(team.leagueId) &&
        team.stars >= minRating &&
        team.stars <= maxRating
    );

    if (pool.length === 0) {
      showMessage(
        "No teams match this rating range in the selected leagues.",
        "error"
      );
      resultsEl.innerHTML =
        '<p class="placeholder">Try widening the rating range or adding more leagues.</p>';
      return;
    }

    if (!onlyOnePerLeague && pool.length < playerCount) {
      showMessage(
        `Not enough teams (${pool.length}) for ${playerCount} players. Add more leagues or lower player count.`,
        "error"
      );
      return;
    }

    let assignments = [];

    if (onlyOnePerLeague) {
      const leagueToTeams = new Map();
      for (const team of pool) {
        if (!leagueToTeams.has(team.leagueId)) {
          leagueToTeams.set(team.leagueId, []);
        }
        leagueToTeams.get(team.leagueId).push(team);
      }

      const availableLeagueIds = Array.from(leagueToTeams.keys());
      if (availableLeagueIds.length < playerCount) {
        showMessage(
          `You selected ${playerCount} players but only ${availableLeagueIds.length} leagues have teams in this rating range. Either allow multiple teams per league or lower the player count.`,
          "error"
        );
        return;
      }

      shuffle(availableLeagueIds);

      for (let i = 0; i < playerCount; i++) {
        const leagueId = availableLeagueIds[i];
        const teamsInLeague = leagueToTeams.get(leagueId);
        const randomTeam =
          teamsInLeague[Math.floor(Math.random() * teamsInLeague.length)];
        assignments.push(randomTeam);
      }
    } else {
      const remaining = [...pool];
      shuffle(remaining);
      assignments = remaining.slice(0, playerCount);
    }

    renderResults(assignments, resultsEl);
    showMessage("Teams generated successfully!", "success");
    persistSettings();

    lastAssignments = assignments.map((team, idx) => ({
      playerIndex: idx + 1,
      team
    }));
  });
}

function renderResults(assignments, container) {
  container.innerHTML = "";
  assignments.forEach((team, index) => {
    const card = document.createElement("div");
    card.className = "player-card";

    const logoWrapper = document.createElement("div");
    logoWrapper.className = "player-logo-wrapper";

    const logoImg = document.createElement("img");
    logoImg.className = "player-logo";
    logoImg.alt = `${team.name} logo`;
    logoImg.src =
      team.logo || "https://placehold.co/64x64/020617/ffffff?text=FC";

    logoWrapper.appendChild(logoImg);

    const main = document.createElement("div");
    main.className = "player-main";

    const label = document.createElement("div");
    label.className = "player-label";
    label.textContent = `Player ${index + 1}`;

    const teamNameEl = document.createElement("div");
    teamNameEl.className = "player-team";
    teamNameEl.textContent = team.name;

    const meta = document.createElement("div");
    meta.className = "player-meta";
    meta.textContent = team.leagueName;

    main.appendChild(label);
    main.appendChild(teamNameEl);
    main.appendChild(meta);

    const rating = document.createElement("div");
    rating.className = "player-rating";
    rating.textContent = `${team.stars.toFixed(1)}★`;

    card.appendChild(logoWrapper);
    card.appendChild(main);
    card.appendChild(rating);

    container.appendChild(card);
  });
}
