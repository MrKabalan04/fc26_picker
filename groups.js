// groups.js
import { shuffle } from "./utils.js";

/**
 * entries: [{ id, label, team, ownerId, ownerLabel }]
 * mode: "groups" | "groups-knockout"
 * options: { homeAndAway: boolean }
 */
export function generateGroups(entries, mode, { homeAndAway = false } = {}) {
  const n = entries.length;
  if (n === 0) return [];

  let groupCount;

  if (mode === "groups") {
    // Pure group stage: always 1 group
    groupCount = 1;
  } else {
    // groups-knockout: as equal as possible, aiming for ~4 per group
    // e.g. 6 → 2 groups of 3 & 3, 8 → 2 groups of 4, 12 → 3 groups of 4, etc.
    if (n <= 4) {
      groupCount = 1;
    } else {
      groupCount = Math.max(2, Math.round(n / 4));
    }
  }

  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push({
      id: String.fromCharCode(65 + i), // A, B, C...
      teams: [],
      matches: []
    });
  }

  // 🔥 IMPORTANT: shuffle entries so teams of same player can land in same group
  const shuffledEntries = [...entries];
  shuffle(shuffledEntries);

  // Distribute entries: E0→G0, E1→G1, ..., E(k)→G(k % groupCount)
  shuffledEntries.forEach((e, idx) => {
    const gIdx = idx % groupCount;
    groups[gIdx].teams.push(e);
  });

  // Build matches per group using round-robin schedule
  groups.forEach((group) => {
    group.matches = buildGroupMatches(group.teams, group.id, homeAndAway);
  });

  return groups;
}

/* ---------- round-robin scheduling helpers ---------- */

/**
 * Create single round-robin rounds for a list of teams.
 * Returns array of rounds; each round is an array of { home, away } pairs.
 * Uses "circle method". Supports odd number of teams (adds a bye).
 */
function createRoundRobinRounds(teams) {
  if (teams.length === 0) return [];

  let list = [...teams];
  const isOdd = list.length % 2 === 1;

  if (isOdd) {
    // Add a null "bye" so we have an even count
    list.push(null);
  }

  const n = list.length;
  const rounds = [];

  for (let roundIndex = 0; roundIndex < n - 1; roundIndex++) {
    const roundMatches = [];

    for (let i = 0; i < n / 2; i++) {
      const t1 = list[i];
      const t2 = list[n - 1 - i];

      // Skip bye
      if (!t1 || !t2) continue;

      roundMatches.push({ home: t1, away: t2 });
    }

    rounds.push(roundMatches);

    // Rotate all except first element
    const first = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop());
    list = [first, ...rest];
  }

  return rounds;
}

/**
 * Build group matches from teams using round-robin.
 * If homeAndAway = false → each pair once.
 * If homeAndAway = true → first all first-leg rounds, then all second-leg rounds
 * with reversed home/away (so same fixture is NOT back-to-back).
 */
function buildGroupMatches(teams, groupId, homeAndAway) {
  const matches = [];
  if (teams.length < 2) return matches;

  // Single round-robin (first legs)
  const firstLegRounds = createRoundRobinRounds(teams);

  // FIRST-LEG matches
  firstLegRounds.forEach((round, rIdx) => {
    round.forEach((pair, mIdx) => {
      matches.push({
        id: `G${groupId}-R${rIdx + 1}M${mIdx + 1}`,
        home: pair.home,
        away: pair.away,
        homeGoals: null,
        awayGoals: null,
        leg: 1
      });
    });
  });

  if (homeAndAway) {
    // SECOND-LEG rounds: same pairs, reversed home/away
    const secondLegStartRound = firstLegRounds.length + 1;

    firstLegRounds.forEach((round, rIdx) => {
      round.forEach((pair, mIdx) => {
        matches.push({
          id: `G${groupId}-R${secondLegStartRound + rIdx}M${mIdx + 1}`,
          home: pair.away,
          away: pair.home,
          homeGoals: null,
          awayGoals: null,
          leg: 2
        });
      });
    });
  }

  return matches;
}

/* ---------- table / stats ---------- */

/**
 * Compute standings for a group
 * Returns array of:
 * {
 *   playerId,        // internal id (entry.id)
 *   label,           // team name (preferred)
 *   played, w, d, l,
 *   gf, ga, gd, pts
 * }
 */
export function computeTable(group) {
  const stats = new Map();

  function ensure(entry) {
    if (!stats.has(entry.id)) {
      const displayLabel = entry.team?.name || entry.label;
      stats.set(entry.id, {
        playerId: entry.id,
        label: displayLabel,
        played: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        get gd() {
          return this.gf - this.ga;
        },
        pts: 0
      });
    }
    return stats.get(entry.id);
  }

  group.matches.forEach((m) => {
    const hg = m.homeGoals;
    const ag = m.awayGoals;

    if (
      hg == null ||
      ag == null ||
      !Number.isInteger(hg) ||
      !Number.isInteger(ag)
    ) {
      return; // not played yet
    }

    const homeStat = ensure(m.home);
    const awayStat = ensure(m.away);

    homeStat.played += 1;
    awayStat.played += 1;

    homeStat.gf += hg;
    homeStat.ga += ag;
    awayStat.gf += ag;
    awayStat.ga += hg;

    if (hg > ag) {
      homeStat.w += 1;
      awayStat.l += 1;
      homeStat.pts += 3;
    } else if (ag > hg) {
      awayStat.w += 1;
      homeStat.l += 1;
      awayStat.pts += 3;
    } else {
      homeStat.d += 1;
      awayStat.d += 1;
      homeStat.pts += 1;
      awayStat.pts += 1;
    }
  });

  // Ensure all entries appear even if they haven't played yet
  group.teams.forEach((e) => ensure(e));

  const table = Array.from(stats.values());

  // Sort: points, GD, GF, then label
  table.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdDiff = b.gd - a.gd;
    if (gdDiff !== 0) return gdDiff;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.label.localeCompare(b.label);
  });

  return table;
}

/* ---------- render ---------- */

export function renderGroups(groups, container, mode) {
  container.innerHTML = "";

  groups.forEach((group) => {
    const groupCard = document.createElement("div");
    groupCard.className = "card";
    groupCard.style.marginBottom = "10px";

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = `Group ${group.id}`;
    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "card-body";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "8px";

    // Matches
    const matchesBlock = document.createElement("div");
    matchesBlock.style.display = "flex";
    matchesBlock.style.flexDirection = "column";
    matchesBlock.style.gap = "4px";

    const matchesTitle = document.createElement("div");
    matchesTitle.className = "field-label";
    matchesTitle.textContent = "Matches";
    matchesBlock.appendChild(matchesTitle);

    group.matches.forEach((match, idx) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.flexWrap = "wrap";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      row.style.fontSize = "0.85rem";

      const homeName = match.home.team?.name || match.home.label;
      const awayName = match.away.team?.name || match.away.label;

      const label = document.createElement("span");
      label.textContent = `M${idx + 1}: ${homeName} vs ${awayName}`;

      const homeInput = document.createElement("input");
      homeInput.type = "number";
      homeInput.min = "0";
      homeInput.style.width = "40px";
      homeInput.value =
        match.homeGoals != null ? String(match.homeGoals) : "";

      const dash = document.createElement("span");
      dash.textContent = "-";

      const awayInput = document.createElement("input");
      awayInput.type = "number";
      awayInput.min = "0";
      awayInput.style.width = "40px";
      awayInput.value =
        match.awayGoals != null ? String(match.awayGoals) : "";

      function parseIntOrNull(value) {
        if (value === "" || value == null) return null;
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0) return null;
        return Math.floor(num);
      }

      function onChange() {
        match.homeGoals = parseIntOrNull(homeInput.value);
        match.awayGoals = parseIntOrNull(awayInput.value);
        // Re-render all groups so tables refresh
        renderGroups(groups, container, mode);
      }

      homeInput.addEventListener("input", onChange);
      awayInput.addEventListener("input", onChange);

      row.appendChild(label);
      row.appendChild(homeInput);
      row.appendChild(dash);
      row.appendChild(awayInput);

      matchesBlock.appendChild(row);
    });

    body.appendChild(matchesBlock);

    // Table
    const tableTitle = document.createElement("div");
    tableTitle.className = "field-label";
    tableTitle.style.marginTop = "8px";
    tableTitle.textContent = "Table";

    const tableEl = document.createElement("table");
    tableEl.style.width = "100%";
    tableEl.style.borderCollapse = "collapse";
    tableEl.style.fontSize = "0.8rem";
    tableEl.style.marginTop = "4px";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const headers = ["Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"];
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.padding = "2px 4px";
      th.style.borderBottom = "1px solid rgba(55,65,81,0.8)";
      th.style.textAlign = h === "Team" ? "left" : "right";
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    const standings = computeTable(group);

    standings.forEach((row) => {
      const tr = document.createElement("tr");

      function cell(text, alignRight = false) {
        const td = document.createElement("td");
        td.textContent = String(text);
        td.style.padding = "2px 4px";
        td.style.textAlign = alignRight ? "right" : "left";
        return td;
      }

      tr.appendChild(cell(row.label));
      tr.appendChild(cell(row.played, true));
      tr.appendChild(cell(row.w, true));
      tr.appendChild(cell(row.d, true));
      tr.appendChild(cell(row.l, true));
      tr.appendChild(cell(row.gf, true));
      tr.appendChild(cell(row.ga, true));
      tr.appendChild(cell(row.gd, true));
      tr.appendChild(cell(row.pts, true));

      tbody.appendChild(tr);
    });

    tableEl.appendChild(thead);
    tableEl.appendChild(tbody);

    body.appendChild(tableTitle);
    body.appendChild(tableEl);

    groupCard.appendChild(header);
    groupCard.appendChild(body);
    container.appendChild(groupCard);
  });
}
