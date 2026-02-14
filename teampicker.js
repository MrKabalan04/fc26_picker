// teampicker.js
import LEAGUES from "./data/leagues.js";
import TEAMS from "./data/teams.js";
import National from "./data/national_teams.js";
import { shuffle, loadSettings, saveSettings } from "./utils.js";

const ALL_TEAMS = [...TEAMS, ...National];
const STORAGE_KEY = "fc26-team-picker-settings";

let lastAssignments = []; // [{ id, label, team, allTeams: [...], isLocked }]
let customPlayerLabels = []; // ["Name 1", "Name 2", ...]

export function getLastAssignments() {
  return lastAssignments;
}

export function updatePlayersFromWheel(names) {
  const playerCountEl = document.getElementById("player-count");
  if (playerCountEl) {
    playerCountEl.value = names.length;
    // Trigger input event to persist settings
    playerCountEl.dispatchEvent(new Event('input'));
  }
  customPlayerLabels = [...names];
}

export function initTeamPicker() {
  const leagueListEl = document.getElementById("league-list");
  const playerCountEl = document.getElementById("player-count");
  const teamsPerPlayerEl = document.getElementById("teams-per-player");
  const ratingMinEl = document.getElementById("rating-min");
  const ratingMaxEl = document.getElementById("rating-max");
  const onePerLeagueEl = document.getElementById("one-per-league");
  const generateBtn = document.getElementById("generate-btn");
  const clearSettingsBtn = document.getElementById("clear-settings-btn");
  const resultsEl = document.getElementById("results");
  const messageEl = document.getElementById("message");

  // ========== Render leagues ==========
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

  // ========== Rating options 0.5–5.0 ==========
  const ratingValues = [];
  for (let i = 1; i <= 10; i++) ratingValues.push(i * 0.5);

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

  // ========== Load saved settings ==========
  const saved = loadSettings(STORAGE_KEY);
  if (saved) {
    if (typeof saved.playerCount === "number") {
      playerCountEl.value = String(saved.playerCount);
    }
    if (typeof saved.teamsPerPlayer === "number" && teamsPerPlayerEl) {
      teamsPerPlayerEl.value = String(saved.teamsPerPlayer);
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
    if (teamsPerPlayerEl) teamsPerPlayerEl.value = "1";
  }

  // ========== Helpers ==========
  function getSelectedLeagueIds() {
    return Array.from(
      leagueListEl.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);
  }

  function showMessage(text, type = "") {
    messageEl.textContent = text;
    messageEl.className = "message";
    if (type === "error") messageEl.classList.add("message--error");
    if (type === "success") messageEl.classList.add("message--success");
  }

  function persistSettings() {
    const settings = {
      selectedLeagueIds: getSelectedLeagueIds(),
      playerCount: Number(playerCountEl.value) || 0,
      teamsPerPlayer: teamsPerPlayerEl ? Number(teamsPerPlayerEl.value) || 1 : 1,
      minRating: parseFloat(ratingMinEl.value),
      maxRating: parseFloat(ratingMaxEl.value),
      onlyOnePerLeague: onePerLeagueEl.checked
    };
    saveSettings(STORAGE_KEY, settings);
  }

  leagueListEl.addEventListener("change", persistSettings);
  playerCountEl.addEventListener("input", persistSettings);
  if (teamsPerPlayerEl) teamsPerPlayerEl.addEventListener("input", persistSettings);
  ratingMinEl.addEventListener("change", persistSettings);
  ratingMaxEl.addEventListener("change", persistSettings);
  onePerLeagueEl.addEventListener("change", persistSettings);

  // ========== Reset ==========
  clearSettingsBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  // ========== Generate ==========
  generateBtn.addEventListener("click", async () => {
    const selectedLeagueIds = getSelectedLeagueIds();
    const playerCount = Number(playerCountEl.value);
    const teamsPerPlayer = teamsPerPlayerEl ? Number(teamsPerPlayerEl.value) : 1;
    let minRating = parseFloat(ratingMinEl.value);
    let maxRating = parseFloat(ratingMaxEl.value);
    const onlyOnePerLeague = onePerLeagueEl.checked;

    if (!Number.isFinite(playerCount) || playerCount < 2) {
      showMessage("Player count must be at least 2.", "error");
      return;
    }
    if (!Number.isFinite(teamsPerPlayer) || teamsPerPlayer < 1) {
      showMessage("Teams per player must be at least 1.", "error");
      return;
    }

    if (selectedLeagueIds.length === 0) {
      showMessage("Select at least one league.", "error");
      return;
    }

    // Animation state
    generateBtn.disabled = true;
    generateBtn.textContent = "Spinning...";
    resultsEl.innerHTML = '<div style="width: 100%; text-align: center; padding: 40px; color: var(--text-dim);">Scouting the world for the best squads...</div>';

    // Simulate delay for effect
    await new Promise(r => setTimeout(r, 800));

    // Filter pool
    let pool = ALL_TEAMS.filter(
      (team) =>
        selectedLeagueIds.includes(team.leagueId) &&
        team.stars >= minRating &&
        team.stars <= maxRating
    );

    if (pool.length === 0) {
      showMessage("No teams match this rating range.", "error");
      generateBtn.disabled = false;
      generateBtn.textContent = "Spin Squads";
      return;
    }

    const totalTeamsNeeded = playerCount * teamsPerPlayer;
    if (onlyOnePerLeague && teamsPerPlayer > 1) {
      showMessage("One team per league only works with 1 team per player.", "error");
      generateBtn.disabled = false;
      generateBtn.textContent = "Spin Squads";
      return;
    }

    const prev = Array.isArray(lastAssignments) ? lastAssignments : [];
    const newPlayers = new Array(playerCount);
    const lockedTeamsFlat = [];

    // Apply Locks
    for (let i = 0; i < playerCount; i++) {
      const prevP = prev[i];
      const customLabel = customPlayerLabels[i] || `Player ${i + 1}`;
      if (prevP && prevP.isLocked && Array.isArray(prevP.allTeams) && prevP.allTeams.length === teamsPerPlayer) {
        newPlayers[i] = { ...prevP, id: i + 1, label: customLabel };
        lockedTeamsFlat.push(...prevP.allTeams);
      }
    }

    // Remove locked from pool
    if (lockedTeamsFlat.length > 0) {
      pool = pool.filter(t => !lockedTeamsFlat.some(lt => lt.name === t.name && lt.leagueId === t.leagueId));
    }

    if (!onlyOnePerLeague && pool.length + lockedTeamsFlat.length < totalTeamsNeeded) {
      showMessage(`Not enough teams (${pool.length + lockedTeamsFlat.length} available).`, "error");
      generateBtn.disabled = false;
      generateBtn.textContent = "Spin Squads";
      return;
    }

    // Assign
    if (onlyOnePerLeague) {
      const leagueToTeams = new Map();
      for (const team of pool) {
        if (!leagueToTeams.has(team.leagueId)) leagueToTeams.set(team.leagueId, []);
        leagueToTeams.get(team.leagueId).push(team);
      }
      const availableLeagues = Array.from(leagueToTeams.keys());
      shuffle(availableLeagues);

      for (let i = 0; i < playerCount; i++) {
        if (newPlayers[i]) continue;
        let lid = availableLeagues.pop();
        if (!lid) {
          showMessage("Ran out of distinct leagues.", "error");
          generateBtn.disabled = false;
          generateBtn.textContent = "Spin Squads";
          return;
        }
        const tList = leagueToTeams.get(lid);
        const randTeam = tList[Math.floor(Math.random() * tList.length)];
        const label = customPlayerLabels[i] || `Player ${i + 1}`;
        newPlayers[i] = { id: i + 1, label: label, team: randTeam, allTeams: [randTeam], isLocked: false };
      }
    } else {
      const remaining = [...pool];
      shuffle(remaining);
      for (let i = 0; i < playerCount; i++) {
        if (newPlayers[i]) continue;
        const chunk = remaining.splice(0, teamsPerPlayer);
        if (chunk.length < teamsPerPlayer) {
          showMessage("Not enough teams left.", "error");
          generateBtn.disabled = false;
          generateBtn.textContent = "Spin Squads";
          return;
        }
        const label = customPlayerLabels[i] || `Player ${i + 1}`;
        newPlayers[i] = { id: i + 1, label: label, team: chunk[0], allTeams: chunk, isLocked: false };
      }
    }

    lastAssignments = newPlayers;
    renderResults(lastAssignments, resultsEl);
    showMessage("Squads Assigned!", "success");
    generateBtn.disabled = false;
    generateBtn.textContent = "Spin Squads";
    persistSettings();
  });
}

function renderResults(players, container) {
  container.innerHTML = "";

  players.forEach((player, index) => {
    const firstTeam = player.allTeams[0];
    const card = document.createElement("div");
    card.className = "player-card";
    if (player.isLocked) card.classList.add("player-card--locked");
    card.style.animationDelay = `${index * 0.1}s`;

    const logoUrl = firstTeam?.logo || "https://placehold.co/64x64/0f172a/ffffff?text=FC";

    card.innerHTML = `
      <div class="card-top">
        <div class="player-logo-wrapper">
          <img src="${logoUrl}" class="player-logo" alt="logo">
        </div>
        <div class="player-rating">${firstTeam?.stars ? firstTeam.stars.toFixed(1) + "★" : ""}</div>
      </div>
      <div class="player-main">
        <div class="player-label">${player.label}</div>
        <div class="player-team">${player.allTeams.map(t => t.name).join(" / ")}</div>
        <div class="player-meta">${firstTeam?.leagueName || ""}</div>
      </div>
      <button type="button" class="lock-btn ${player.isLocked ? 'lock-btn--active' : ''}">
        ${player.isLocked ? "🔒 Locked" : "🔓 Lock Squad"}
      </button>
    `;

    card.querySelector(".lock-btn").addEventListener("click", () => {
      player.isLocked = !player.isLocked;
      renderResults(players, container);
    });

    container.appendChild(card);
  });
}
