// teampicker.js
import LEAGUES from "./data/leagues.js";
import TEAMS from "./data/teams.js";
import National from "./data/national_teams.js";
import { shuffle, loadSettings, saveSettings } from "./utils.js";

const ALL_TEAMS = [...TEAMS, ...National];
const STORAGE_KEY = "fc26-team-picker-settings";

let lastAssignments = []; // [{ id, label, team, allTeams: [...], isLocked }]

// Used by tournament.js
export function getLastAssignments() {
  return lastAssignments;
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
    messageEl.classList.remove("message--error", "message--success");
    if (type === "error") messageEl.classList.add("message--error");
    if (type === "success") messageEl.classList.add("message--success");
  }

  function persistSettings() {
    const settings = {
      selectedLeagueIds: getSelectedLeagueIds(),
      playerCount: Number(playerCountEl.value) || 0,
      teamsPerPlayer: teamsPerPlayerEl
        ? Number(teamsPerPlayerEl.value) || 1
        : 1,
      minRating: parseFloat(ratingMinEl.value),
      maxRating: parseFloat(ratingMaxEl.value),
      onlyOnePerLeague: onePerLeagueEl.checked
    };
    saveSettings(STORAGE_KEY, settings);
  }

  leagueListEl.addEventListener("change", persistSettings);
  playerCountEl.addEventListener("input", persistSettings);
  if (teamsPerPlayerEl) {
    teamsPerPlayerEl.addEventListener("input", persistSettings);
  }
  ratingMinEl.addEventListener("change", persistSettings);
  ratingMaxEl.addEventListener("change", persistSettings);
  onePerLeagueEl.addEventListener("change", persistSettings);

  // ========== Reset ==========
  clearSettingsBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    leagueListEl
      .querySelectorAll("input[type=checkbox]")
      .forEach((cb) => (cb.checked = true));
    playerCountEl.value = "4";
    if (teamsPerPlayerEl) teamsPerPlayerEl.value = "1";
    ratingMinEl.value = "4.5";
    ratingMaxEl.value = "5.0";
    onePerLeagueEl.checked = false;
    showMessage("Settings reset to defaults.", "success");
    resultsEl.innerHTML =
      '<p class="placeholder">Set your options and press <strong>Spin teams</strong>.</p>';
    // Locks reset because assignments are effectively cleared
    lastAssignments = [];
  });

  // ========== Generate ==========
  generateBtn.addEventListener("click", () => {
    const selectedLeagueIds = getSelectedLeagueIds();
    const playerCount = Number(playerCountEl.value);
    const teamsPerPlayer = teamsPerPlayerEl
      ? Number(teamsPerPlayerEl.value)
      : 1;
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
    if (teamsPerPlayer > 4) {
      showMessage("Maximum 4 teams per player for now.", "error");
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

    // Filter pool by league + rating
    let pool = ALL_TEAMS.filter(
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

    const totalTeamsNeeded = playerCount * teamsPerPlayer;

    if (onlyOnePerLeague && teamsPerPlayer > 1) {
      showMessage(
        "One team per league mode only works when each player has 1 team.",
        "error"
      );
      return;
    }

    // ====== LOCK LOGIC STARTS HERE ======
    // Try to reuse locked players from lastAssignments if it matches the structure
    const prev = Array.isArray(lastAssignments) ? lastAssignments : [];
    const newPlayers = new Array(playerCount);
    const lockedTeamsFlat = [];

    for (let i = 0; i < playerCount; i++) {
      const prevP = prev[i];
      if (
        prevP &&
        prevP.isLocked &&
        Array.isArray(prevP.allTeams) &&
        prevP.allTeams.length === teamsPerPlayer
      ) {
        // Copy locked player & their teams
        const cloned = {
          ...prevP,
          id: i + 1,
          label: `Player ${i + 1}`,
          allTeams: [...prevP.allTeams],
          team: prevP.allTeams[0],
          isLocked: true
        };
        newPlayers[i] = cloned;
        lockedTeamsFlat.push(...prevP.allTeams);
      }
    }

    // Remove locked teams from pool so they can't be reused
    if (lockedTeamsFlat.length > 0) {
      pool = pool.filter((t) =>
        !lockedTeamsFlat.some(
          (lt) =>
            lt.name === t.name &&
            lt.leagueId === t.leagueId &&
            lt.stars === t.stars
        )
      );
    }

    const lockedTeamsCount = lockedTeamsFlat.length;

    if (!onlyOnePerLeague && pool.length + lockedTeamsCount < totalTeamsNeeded) {
      showMessage(
        `Not enough teams (${pool.length + lockedTeamsCount}) for ${playerCount} players × ${teamsPerPlayer} teams each (with locks).`,
        "error"
      );
      return;
    }

    // ========== ASSIGN TEAMS ==========

    if (onlyOnePerLeague) {
      // ------------- One per league, single team per player (no multi teams allowed) -------------
      const leagueToTeams = new Map();
      for (const team of pool) {
        if (!leagueToTeams.has(team.leagueId)) {
          leagueToTeams.set(team.leagueId, []);
        }
        leagueToTeams.get(team.leagueId).push(team);
      }

      const availableLeagueIds = Array.from(leagueToTeams.keys());

      // Also include leagues already used by locked players
      const lockedLeagueIds = new Set(
        lockedTeamsFlat.map((t) => t.leagueId)
      );

      if (availableLeagueIds.length + lockedLeagueIds.size < playerCount) {
        showMessage(
          `You selected ${playerCount} players but there aren't enough distinct leagues with teams in this rating range (consider removing locks).`,
          "error"
        );
        return;
      }

      shuffle(availableLeagueIds);

      for (let i = 0; i < playerCount; i++) {
        if (newPlayers[i]) continue; // locked

        // pick random league that still has teams
        let pickLeague = null;
        while (availableLeagueIds.length && !pickLeague) {
          const lid = availableLeagueIds.pop();
          const arr = leagueToTeams.get(lid);
          if (arr && arr.length > 0) {
            pickLeague = lid;
          }
        }

        if (!pickLeague) {
          showMessage(
            "Ran out of leagues that match the constraints.",
            "error"
          );
          return;
        }

        const teamsInLeague = leagueToTeams.get(pickLeague);
        const randomTeam =
          teamsInLeague[Math.floor(Math.random() * teamsInLeague.length)];

        newPlayers[i] = {
          id: i + 1,
          label: `Player ${i + 1}`,
          team: randomTeam,
          allTeams: [randomTeam],
          isLocked: false
        };
      }
    } else {
      // ------------- Normal mode: multiple teams per player allowed -------------
      const remaining = [...pool];
      shuffle(remaining);

      // Count already locked teams per player index
      for (let i = 0; i < playerCount; i++) {
        if (newPlayers[i]) continue; // already filled from locked

        const chunk = remaining.splice(0, teamsPerPlayer);
        if (chunk.length < teamsPerPlayer) {
          showMessage(
            "Not enough teams left after applying locks. Try removing some locks or changing settings.",
            "error"
          );
          return;
        }

        newPlayers[i] = {
          id: i + 1,
          label: `Player ${i + 1}`,
          team: chunk[0],
          allTeams: chunk,
          isLocked: false
        };
      }
    }

    // Sanity: ensure every slot filled
    for (let i = 0; i < playerCount; i++) {
      if (!newPlayers[i]) {
        showMessage(
          "Unexpected error while assigning teams. Please try spinning again.",
          "error"
        );
        return;
      }
    }

    // Save & render
    lastAssignments = newPlayers;
    renderResults(lastAssignments, resultsEl);
    showMessage("Teams generated successfully!", "success");
    persistSettings();
  });
}
function renderResults(players, container) {
  container.innerHTML = "";

  players.forEach((player) => {
    const card = document.createElement("div");
    card.className = "player-card";
    if (player.isLocked) card.classList.add("player-card--locked");

    // ==== LOGO WRAPPER ====
    const logoWrapper = document.createElement("div");
    logoWrapper.className = "player-logo-wrapper";

    const logoImg = document.createElement("img");
    logoImg.className = "player-logo";
    logoImg.alt = "Team Logo";

    // Use first team logo if multi-team mode
    const firstTeam = Array.isArray(player.allTeams)
      ? player.allTeams[0]
      : player.team;

    logoImg.src =
      firstTeam?.logo ||
      "https://placehold.co/64x64/020617/ffffff?text=FC";

    logoWrapper.appendChild(logoImg);

    // ==== MAIN INFO ====
    const main = document.createElement("div");
    main.className = "player-main";

    const label = document.createElement("div");
    label.className = "player-label";
    label.textContent = player.label;

    const teamNameEl = document.createElement("div");
    teamNameEl.className = "player-team";

    if (Array.isArray(player.allTeams) && player.allTeams.length > 1) {
      teamNameEl.textContent = player.allTeams.map((t) => t.name).join(" / ");
    } else {
      teamNameEl.textContent = firstTeam?.name ?? "Unknown";
    }

    const meta = document.createElement("div");
    meta.className = "player-meta";
    meta.textContent = firstTeam?.leagueName ?? "";

    main.appendChild(label);
    main.appendChild(teamNameEl);
    main.appendChild(meta);

    // ==== RIGHT SIDE: rating + lock ====
    const side = document.createElement("div");
    side.style.display = "flex";
    side.style.flexDirection = "column";
    side.style.alignItems = "flex-end";
    side.style.gap = "4px";

    const rating = document.createElement("div");
    rating.className = "player-rating";
    rating.textContent =
      firstTeam?.stars != null ? `${firstTeam.stars.toFixed(1)}★` : "";

    // Lock button
    const lockBtn = document.createElement("button");
    lockBtn.type = "button";
    lockBtn.className = "lock-btn";

    if (player.isLocked) {
      lockBtn.classList.add("lock-btn--active");
      lockBtn.textContent = "🔒 Locked";
    } else {
      lockBtn.textContent = "🔓 Lock";
    }

    lockBtn.addEventListener("click", () => {
      player.isLocked = !player.isLocked;
      renderResults(players, container);
    });

    side.appendChild(rating);
    side.appendChild(lockBtn);

    // ==== ASSEMBLE CARD ====
    card.appendChild(logoWrapper);
    card.appendChild(main);
    card.appendChild(side);

    container.appendChild(card);
  });
}

