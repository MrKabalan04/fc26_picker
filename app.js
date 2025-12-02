import LEAGUES from "./data/leagues.js";
import TEAMS from "./data/teams.js";
import National from "./data/national_teams.js";

const STORAGE_KEY = "fc26-team-picker-settings";

// Merge club + national
const ALL_TEAMS = [...TEAMS, ...National];

// ====== GLOBAL STATE ======
let lastAssignments = []; // [{ playerIndex, team }]
let tournamentState = null;

// ====== HELPERS ======

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ====== TAB SWITCHING ======

function initTabs() {
  const pickerTabBtn = document.getElementById("tab-btn-picker");
  const tournamentTabBtn = document.getElementById("tab-btn-tournament");
  const pickerTab = document.getElementById("tab-picker");
  const tournamentTab = document.getElementById("tab-tournament");

  function setMode(mode) {
    if (mode === "picker") {
      pickerTab.classList.remove("hidden");
      tournamentTab.classList.add("hidden");
      pickerTabBtn.classList.replace("btn-secondary", "btn-primary");
      tournamentTabBtn.classList.replace("btn-primary", "btn-secondary");
    } else {
      pickerTab.classList.add("hidden");
      tournamentTab.classList.remove("hidden");
      tournamentTabBtn.classList.replace("btn-secondary", "btn-primary");
      pickerTabBtn.classList.replace("btn-primary", "btn-secondary");
    }
  }

  pickerTabBtn.addEventListener("click", () => setMode("picker"));
  tournamentTabBtn.addEventListener("click", () => setMode("tournament"));

  // default
  setMode("picker");
}

// ====== TEAM PICKER ======

function initTeamPicker() {
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

  // Default range
  ratingMinEl.value = "4.5";
  ratingMaxEl.value = "5.0";

  // Load saved
  const saved = loadSettings();
  if (saved) {
    if (typeof saved.playerCount === "number") {
      playerCountEl.value = String(saved.playerCount);
    }
    if (saved.minRating != null) {
      ratingMinEl.value = String(saved.minRating);
    }
    if (saved.maxRating != null) {
      ratingMaxEl.value = String(saved.maxRating);
    }
    if (typeof saved.onlyOnePerLeague === "boolean") {
      onePerLeagueEl.checked = saved.onlyOnePerLeague;
    }
    if (Array.isArray(saved.selectedLeagueIds)) {
      const set = new Set(saved.selectedLeagueIds);
      const checkboxes = leagueListEl.querySelectorAll("input[type=checkbox]");
      checkboxes.forEach((cb) => {
        cb.checked = set.has(cb.value);
      });
    }
  } else {
    const checkboxes = leagueListEl.querySelectorAll("input[type=checkbox]");
    checkboxes.forEach((cb) => {
      cb.checked = true;
    });
  }

  function getSelectedLeagueIds() {
    const checked = leagueListEl.querySelectorAll(
      "input[type=checkbox]:checked"
    );
    return Array.from(checked).map((cb) => cb.value);
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
    localStorage.removeItem(STORAGE_KEY);
    const checkboxes = leagueListEl.querySelectorAll("input[type=checkbox]");
    checkboxes.forEach((cb) => (cb.checked = true));
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

    // store for tournament
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

// ====== TOURNAMENT LOGIC ======

function initTournament() {
  const typeEl = document.getElementById("tournament-type");
  const playerCountEl = document.getElementById("tournament-player-count");
  const homeAwayEl = document.getElementById("groups-home-away");
  const useLastBtn = document.getElementById("tournament-use-last");
  const clearBtn = document.getElementById("tournament-clear");
  const setupMsgEl = document.getElementById("tournament-setup-message");
  const groupsCard = document.getElementById("groups-card");
  const groupsContainer = document.getElementById("groups-container");
  const knockoutCard = document.getElementById("knockout-card");
  const knockoutContainer = document.getElementById("knockout-container");

  function showSetupMessage(text, type = "") {
    setupMsgEl.textContent = text;
    setupMsgEl.classList.remove("message--error", "message--success");
    if (type === "error") setupMsgEl.classList.add("message--error");
    if (type === "success") setupMsgEl.classList.add("message--success");
  }

  function resetTournamentView() {
    groupsCard.style.display = "none";
    knockoutCard.style.display = "none";
    groupsContainer.innerHTML = "";
    knockoutContainer.innerHTML = "";
  }

  clearBtn.addEventListener("click", () => {
    tournamentState = null;
    resetTournamentView();
    showSetupMessage("Tournament cleared.", "success");
  });

  useLastBtn.addEventListener("click", () => {
    const tType = typeEl.value;
    const count = Number(playerCountEl.value);
    const homeAndAway = !!homeAwayEl.checked;

    if (!Array.isArray(lastAssignments) || lastAssignments.length === 0) {
      showSetupMessage(
        "No last spin found. Spin teams first in Team Picker.",
        "error"
      );
      return;
    }

    if (!Number.isFinite(count) || count < 2) {
      showSetupMessage("Enter a valid player count.", "error");
      return;
    }

    if (lastAssignments.length < count) {
      showSetupMessage(
        `You requested ${count} players but only ${lastAssignments.length} teams exist from last spin.`,
        "error"
      );
      return;
    }

    const players = lastAssignments.slice(0, count).map((entry, idx) => ({
      id: idx + 1,
      label: `Player ${idx + 1}`,
      team: entry.team
    }));

    tournamentState = { type: tType, players, homeAndAway };

    resetTournamentView();

    if (tType === "knockout") {
      knockoutCard.style.display = "block";
      generateKnockoutTournament(players, knockoutContainer);
      groupsCard.style.display = "none";
    } else if (tType === "groups") {
      // 🔹 ONE big group with all players
      const groups = generateGroups(players, homeAndAway, "groups");
      tournamentState.groups = groups;
      renderGroups(groups, groupsContainer, "groups");
      groupsCard.style.display = "block";
      knockoutCard.style.display = "none";
    } else if (tType === "groups-knockout") {
      // 🔹 Groups of 4 for groups + knockout
      const groups = generateGroups(players, homeAndAway, "groups-knockout");
      tournamentState.groups = groups;
      renderGroups(groups, groupsContainer, "groups-knockout");
      groupsCard.style.display = "block";
      knockoutCard.style.display = "block";

      // button + empty bracket area
      knockoutContainer.innerHTML = "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-primary";
      btn.textContent = "Generate knockout from standings";
      btn.style.marginBottom = "8px";

      const bracketDiv = document.createElement("div");
      bracketDiv.id = "knockout-bracket";

      btn.addEventListener("click", () => {
        if (!tournamentState || !tournamentState.groups) return;
        const qualified = buildQualifiedFromGroups(tournamentState.groups);
        if (!qualified || qualified.length === 0) {
          bracketDiv.innerHTML =
            "<p class='placeholder'>Not enough qualified teams from groups.</p>";
          return;
        }
        generateKnockoutTournament(qualified, bracketDiv);
      });

      knockoutContainer.appendChild(btn);
      knockoutContainer.appendChild(bracketDiv);
    }

    showSetupMessage("Tournament created from last spin.", "success");
  });
}

// ----- Groups & Matches -----

function generateGroups(players, homeAndAway = false, mode = "groups") {
  let groupSize;

  if (mode === "groups") {
    // 🔹 One big group: all players together
    groupSize = players.length;
  } else {
    // 🔹 groups-knockout → groups of 4 (last group can be smaller)
    groupSize = 4;
  }

  const playersCopy = [...players];
  shuffle(playersCopy);

  const groups = [];
  const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let idx = 0;

  while (playersCopy.length > 0) {
    const chunk = playersCopy.splice(0, groupSize);
    const groupId = groupLabels[idx] || `G${idx + 1}`;
    const matches = createGroupMatches(chunk, groupId, homeAndAway);
    groups.push({
      id: groupId,
      teams: chunk,
      matches
    });
    idx++;
  }

  return groups;
}

function createGroupMatches(teams, groupId, homeAndAway = false) {
  const baseTeams = [...teams]; // don't mutate original
  const rounds = [];
  let arr = [...baseTeams];

  // If odd number of teams, add a BYE slot
  let hasBye = false;
  if (arr.length % 2 === 1) {
    arr.push(null);
    hasBye = true;
  }

  const n = arr.length;
  const totalRounds = n - 1; // classic round-robin

  // "Circle method" round-robin
  for (let r = 0; r < totalRounds; r++) {
    const round = [];

    for (let i = 0; i < n / 2; i++) {
      const t1 = arr[i];
      const t2 = arr[n - 1 - i];

      // Skip pairs where one is BYE
      if (t1 && t2) {
        round.push({ home: t1, away: t2 });
      }
    }

    rounds.push(round);

    // Rotate all except first
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()); // rotate right
    arr = [fixed, ...rest];
  }

  // Now convert to match objects in round order
  const matches = [];
  let matchId = 1;

  // First leg
  rounds.forEach((round) => {
    round.forEach((pair) => {
      matches.push({
        id: `${groupId}-M${matchId++}`,
        groupId,
        home: pair.home,
        away: pair.away,
        homeGoals: null,
        awayGoals: null
      });
    });
  });

  // Second leg (home & away) if enabled
  if (homeAndAway) {
    rounds.forEach((round) => {
      round.forEach((pair) => {
        matches.push({
          id: `${groupId}-M${matchId++}`,
          groupId,
          home: pair.away,
          away: pair.home,
          homeGoals: null,
          awayGoals: null
        });
      });
    });
  }

  return matches;
}

function computeTable(group) {
  const stats = new Map();

  group.teams.forEach((p) => {
    stats.set(p.id, {
      playerId: p.id,
      label: p.label,
      teamName: p.team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    });
  });

  group.matches.forEach((m) => {
    if (
      m.homeGoals == null ||
      m.awayGoals == null ||
      m.homeGoals === "" ||
      m.awayGoals === ""
    ) {
      return;
    }

    const hg = Number(m.homeGoals);
    const ag = Number(m.awayGoals);
    if (!Number.isFinite(hg) || !Number.isFinite(ag)) return;

    const homeStats = stats.get(m.home.id);
    const awayStats = stats.get(m.away.id);

    homeStats.played++;
    awayStats.played++;
    homeStats.gf += hg;
    homeStats.ga += ag;
    awayStats.gf += ag;
    awayStats.ga += hg;

    if (hg > ag) {
      homeStats.wins++;
      awayStats.losses++;
      homeStats.pts += 3;
    } else if (hg < ag) {
      awayStats.wins++;
      homeStats.losses++;
      awayStats.pts += 3;
    } else {
      homeStats.draws++;
      awayStats.draws++;
      homeStats.pts += 1;
      awayStats.pts += 1;
    }
  });

  stats.forEach((row) => {
    row.gd = row.gf - row.ga;
  });

  const table = Array.from(stats.values());
  table.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.label.localeCompare(b.label);
  });

  return table;
}

// 🔹 Global group-stage schedule (2 matches per group, then next group)
function buildGlobalSchedule(groups) {
  if (!groups || groups.length === 0) return [];
  if (groups.length === 1) {
    // Only one group: just list its matches in order
    return groups[0].matches.map((m, idx) => ({
      index: idx + 1,
      groupId: groups[0].id,
      match: m
    }));
  }

  const queues = groups.map((g) => [...g.matches]);
  const pointers = new Array(groups.length).fill(0);

  const totalMatches = queues.reduce((sum, arr) => sum + arr.length, 0);
  const schedule = [];

  let remaining = totalMatches;
  let globalIndex = 1;

  while (remaining > 0) {
    for (let gi = 0; gi < groups.length; gi++) {
      let taken = 0;
      while (taken < 2 && pointers[gi] < queues[gi].length) {
        const match = queues[gi][pointers[gi]++];
        schedule.push({
          index: globalIndex++,
          groupId: groups[gi].id,
          match
        });
        remaining--;
        taken++;
      }
      if (remaining <= 0) break;
    }
  }

  return schedule;
}

function renderGlobalSchedule(groups, container) {
  const schedule = buildGlobalSchedule(groups);
  if (!schedule || schedule.length === 0) return;

  const schedCard = document.createElement("div");
  schedCard.className = "card";
  schedCard.style.marginBottom = "10px";

  const header = document.createElement("div");
  header.className = "card-header";
  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Suggested Match Order";
  header.appendChild(title);

  const body = document.createElement("div");
  body.className = "card-body";

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent =
    "Play 2 matches from each group, then move to the next group. Follow this order for a fair rotation.";
  hint.style.marginBottom = "6px";

  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "4px";

  schedule.forEach((entry) => {
    const row = document.createElement("div");
    row.style.fontSize = "0.8rem";
    row.textContent = `Match ${entry.index}: Group ${entry.groupId} – ${entry.match.home.team.name} vs ${entry.match.away.team.name}`;
    list.appendChild(row);
  });

  body.appendChild(hint);
  body.appendChild(list);
  schedCard.appendChild(header);
  schedCard.appendChild(body);

  container.appendChild(schedCard);
}

function renderGroups(groups, container, mode = "groups") {
  container.innerHTML = "";

  // 🔹 For groups-knockout we show a global schedule at the top
  if (mode === "groups-knockout") {
    renderGlobalSchedule(groups, container);
  }

  groups.forEach((group) => {
    const groupCard = document.createElement("div");
    groupCard.className = "card";
    groupCard.style.marginBottom = "10px";

    const header = document.createElement("div");
    header.className = "card-header";
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent =
      mode === "groups" ? "Group Stage" : `Group ${group.id}`;
    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "card-body";

    // Teams list
    const teamsDiv = document.createElement("div");
    teamsDiv.style.marginBottom = "8px";
    group.teams.forEach((p) => {
      const row = document.createElement("div");
      row.className = "player-card";
      row.style.marginBottom = "4px";

      const main = document.createElement("div");
      main.className = "player-main";

      const label = document.createElement("div");
      label.className = "player-label";
      label.textContent = p.label;

      const team = document.createElement("div");
      team.className = "player-team";
      team.textContent = p.team.name;

      const meta = document.createElement("div");
      meta.className = "player-meta";
      meta.textContent = p.team.leagueName;

      main.appendChild(label);
      main.appendChild(team);
      main.appendChild(meta);

      const rating = document.createElement("div");
      rating.className = "player-rating";
      rating.textContent = `${p.team.stars.toFixed(1)}★`;

      row.appendChild(main);
      row.appendChild(rating);
      teamsDiv.appendChild(row);
    });

    // Matches
    const matchesTitle = document.createElement("div");
    matchesTitle.className = "field-label";
    matchesTitle.textContent = "Matches (enter scores)";

    const matchesDiv = document.createElement("div");
    matchesDiv.style.display = "flex";
    matchesDiv.style.flexDirection = "column";
    matchesDiv.style.gap = "4px";
    matchesDiv.style.marginBottom = "8px";

    group.matches.forEach((match, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      row.style.fontSize = "0.85rem";

      const label = document.createElement("span");
      label.textContent = `Match ${index + 1}: ${match.home.team.name} vs ${match.away.team.name}`;

      const homeInput = document.createElement("input");
      homeInput.type = "number";
      homeInput.min = "0";
      homeInput.style.width = "40px";
      homeInput.value =
        match.homeGoals != null && match.homeGoals !== ""
          ? match.homeGoals
          : "";

      const dash = document.createElement("span");
      dash.textContent = "-";

      const awayInput = document.createElement("input");
      awayInput.type = "number";
      awayInput.min = "0";
      awayInput.style.width = "40px";
      awayInput.value =
        match.awayGoals != null && match.awayGoals !== ""
          ? match.awayGoals
          : "";

      function updateScore() {
        match.homeGoals =
          homeInput.value === "" ? null : Number(homeInput.value);
        match.awayGoals =
          awayInput.value === "" ? null : Number(awayInput.value);

        const tableData = computeTable(group);
        renderGroupTable(group, tableData, tableContainer);
      }

      homeInput.addEventListener("input", updateScore);
      awayInput.addEventListener("input", updateScore);

      row.appendChild(label);
      row.appendChild(homeInput);
      row.appendChild(dash);
      row.appendChild(awayInput);
      matchesDiv.appendChild(row);
    });

    // Table
    const tableContainer = document.createElement("div");
    const initialTable = computeTable(group);
    renderGroupTable(group, initialTable, tableContainer);

    body.appendChild(teamsDiv);
    body.appendChild(matchesTitle);
    body.appendChild(matchesDiv);
    body.appendChild(tableContainer);

    groupCard.appendChild(header);
    groupCard.appendChild(body);
    container.appendChild(groupCard);
  });
}

function renderGroupTable(group, tableData, container) {
  container.innerHTML = "";

  if (!tableData || tableData.length === 0) {
    const p = document.createElement("p");
    p.className = "placeholder";
    p.textContent = "Table updates when you enter scores.";
    container.appendChild(p);
    return;
  }

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "4px";
  table.style.fontSize = "0.8rem";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  const headers = ["Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"];
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.padding = "2px 4px";
    th.style.textAlign = h === "Team" ? "left" : "center";
    th.style.borderBottom = "1px solid rgba(75,85,99,0.8)";
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");

  tableData.forEach((row) => {
    const tr = document.createElement("tr");

    function td(text, align = "center") {
      const cell = document.createElement("td");
      cell.textContent = text;
      cell.style.padding = "2px 4px";
      cell.style.textAlign = align;
      return cell;
    }

    tr.appendChild(td(row.teamName, "left"));
    tr.appendChild(td(row.played));
    tr.appendChild(td(row.wins));
    tr.appendChild(td(row.draws));
    tr.appendChild(td(row.losses));
    tr.appendChild(td(row.gf));
    tr.appendChild(td(row.ga));
    tr.appendChild(td(row.gd));
    tr.appendChild(td(row.pts));

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

// Build qualified players from group standings for knockout
function buildQualifiedFromGroups(groups) {
  if (!groups || groups.length === 0) return [];

  // Sort groups by id so mapping is deterministic (A,B,C,D,...)
  const sortedGroups = [...groups].sort((a, b) =>
    a.id.toString().localeCompare(b.id.toString())
  );

  const qualified = [];

  for (let i = 0; i < sortedGroups.length; i += 2) {
    const gA = sortedGroups[i];
    const gB = sortedGroups[i + 1];

    if (!gB) {
      // odd number of groups – fallback: just push winners sequentially
      const tableA = computeTable(gA);
      if (tableA[0]) {
        const pA1 = gA.teams.find((p) => p.id === tableA[0].playerId);
        qualified.push(pA1);
      }
      continue;
    }

    const tableA = computeTable(gA);
    const tableB = computeTable(gB);

    if (tableA.length < 2 || tableB.length < 2) {
      // not enough finished to pick top 2 – skip pairing this block
      continue;
    }

    const a1 = gA.teams.find((p) => p.id === tableA[0].playerId);
    const a2 = gA.teams.find((p) => p.id === tableA[1].playerId);
    const b1 = gB.teams.find((p) => p.id === tableB[0].playerId);
    const b2 = gB.teams.find((p) => p.id === tableB[1].playerId);

    if (!a1 || !a2 || !b1 || !b2) continue;

    // World Cup style: A1 vs B2, B1 vs A2
    qualified.push(a1, b2, b1, a2);
  }

  return qualified;
}

// ----- Knockout fixtures -----

function generateKnockoutTournament(players, container) {
  container.innerHTML = "";

  const count = players.length;
  const allowed = [2, 4, 8, 16, 32];
  if (!allowed.includes(count)) {
    container.innerHTML =
      "<p class='placeholder'>Knockout currently supports 2, 4, 8, 16, or 32 players (2 per group works: 2 groups → 4, 4 groups → 8, etc.).</p>";
    return;
  }

  const shuffled = [...players];
  shuffle(shuffled);

  const roundTitle = document.createElement("div");
  roundTitle.className = "field-label";
  roundTitle.textContent = "First Round Fixtures";
  container.appendChild(roundTitle);

  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "6px";
  list.style.marginTop = "4px";

  for (let i = 0; i < shuffled.length; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];

    const row = document.createElement("div");
    row.className = "player-card";

    const main = document.createElement("div");
    main.className = "player-main";

    const label = document.createElement("div");
    label.className = "player-label";
    label.textContent = `Match ${i / 2 + 1}`;

    const teamsLine = document.createElement("div");
    teamsLine.className = "player-team";
    teamsLine.textContent = `${home.label} (${home.team.name}) vs ${away.label} (${away.team.name})`;

    main.appendChild(label);
    main.appendChild(teamsLine);

    const scoreWrap = document.createElement("div");
    scoreWrap.style.display = "flex";
    scoreWrap.style.alignItems = "center";
    scoreWrap.style.gap = "4px";

    const homeInput = document.createElement("input");
    homeInput.type = "number";
    homeInput.min = "0";
    homeInput.style.width = "40px";

    const dash = document.createElement("span");
    dash.textContent = "-";

    const awayInput = document.createElement("input");
    awayInput.type = "number";
    awayInput.min = "0";
    awayInput.style.width = "40px";

    scoreWrap.appendChild(homeInput);
    scoreWrap.appendChild(dash);
    scoreWrap.appendChild(awayInput);

    row.appendChild(main);
    row.appendChild(scoreWrap);
    list.appendChild(row);
  }

  container.appendChild(list);
}

// ====== INIT ======

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initTeamPicker();
  initTournament();
});
