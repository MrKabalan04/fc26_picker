// groups.js
import { shuffle } from "./utils.js";

export function generateGroups(players, mode, { homeAndAway }) {
  if (mode === "groups") {
    // One big group
    const groupId = "A";
    const matches = createGroupMatches(players, groupId, homeAndAway);
    return [{ id: groupId, teams: players, matches }];
  }

  // mode === "groups-knockout"
  const chunks = splitIntoBalancedGroups(players, 4);
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const groups = [];

  chunks.forEach((chunk, idx) => {
    const id = labels[idx] || `G${idx + 1}`;
    const matches = createGroupMatches(chunk, id, homeAndAway);
    groups.push({ id, teams: chunk, matches });
  });

  return groups;
}

// Balanced sizes, priority to equality: e.g. 6 -> 3+3, 10 -> 4+3+3
function splitIntoBalancedGroups(players, targetSize = 4) {
  const n = players.length;
  if (n <= targetSize) return [players.slice()];

  const numGroups = Math.max(2, Math.round(n / targetSize));
  const baseSize = Math.floor(n / numGroups);
  let remainder = n % numGroups;

  const groups = [];
  let index = 0;

  for (let g = 0; g < numGroups; g++) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    groups.push(players.slice(index, index + size));
    index += size;
  }
  return groups;
}

// Proper round-robin schedule (no immediate rematch)
function createGroupMatches(teams, groupId, homeAndAway = false) {
  const base = [...teams];
  const rounds = [];

  let arr = [...base];
  let hasBye = false;

  if (arr.length % 2 === 1) {
    arr.push(null);
    hasBye = true;
  }

  const n = arr.length;
  const totalRounds = n - 1;

  for (let r = 0; r < totalRounds; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const t1 = arr[i];
      const t2 = arr[n - 1 - i];
      if (t1 && t2) {
        round.push({ home: t1, away: t2 });
      }
    }
    rounds.push(round);

    // rotate (circle method)
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }

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

  // Second leg (reverse home/away)
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

// Group table
export function computeTable(group) {
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
    )
      return;

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

// global schedule: 2 matches from each group, then next group
function buildGlobalSchedule(groups) {
  if (!groups || groups.length === 0) return [];
  if (groups.length === 1) {
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
  if (!schedule.length) return;

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
    "Play 2 matches from each group, then move to the next group. Follow this for equal playtime.";
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

export function renderGroups(groups, container, mode) {
  container.innerHTML = "";

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

    // Matches and score inputs
    const matchesTitle = document.createElement("div");
    matchesTitle.className = "field-label";
    matchesTitle.textContent = "Matches (enter scores)";

    const matchesDiv = document.createElement("div");
    matchesDiv.style.display = "flex";
    matchesDiv.style.flexDirection = "column";
    matchesDiv.style.gap = "4px";
    matchesDiv.style.marginBottom = "8px";

    const tableContainer = document.createElement("div");
    const initialTable = computeTable(group);
    renderGroupTable(group, initialTable, tableContainer);

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
