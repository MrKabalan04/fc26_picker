// groups.js
import { shuffle } from "./utils.js";

export function generateGroups(entries, mode, { homeAndAway = false } = {}) {
  const n = entries.length;
  if (n === 0) return [];
  let groupCount = (mode === "groups") ? 1 : (n <= 4 ? 1 : Math.max(2, Math.round(n / 4)));
  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push({ id: String.fromCharCode(65 + i), teams: [], matches: [] });
  }
  const shuffledEntries = [...entries];
  shuffle(shuffledEntries);
  shuffledEntries.forEach((e, idx) => groups[idx % groupCount].teams.push(e));
  groups.forEach(group => group.matches = buildGroupMatches(group.teams, group.id, homeAndAway));
  return groups;
}

function createRoundRobinRounds(teams) {
  if (teams.length === 0) return [];
  let list = [...teams];
  if (list.length % 2 === 1) list.push(null);
  const n = list.length;
  const rounds = [];
  for (let roundIndex = 0; roundIndex < n - 1; roundIndex++) {
    const roundMatches = [];
    for (let i = 0; i < n / 2; i++) {
      const t1 = list[i];
      const t2 = list[n - 1 - i];
      if (t1 && t2) roundMatches.push({ home: t1, away: t2 });
    }
    rounds.push(roundMatches);
    const first = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop());
    list = [first, ...rest];
  }
  return rounds;
}

function buildGroupMatches(teams, groupId, homeAndAway) {
  const matches = [];
  if (teams.length < 2) return matches;
  const firstLegRounds = createRoundRobinRounds(teams);
  firstLegRounds.forEach((round, rIdx) => {
    round.forEach((pair, mIdx) => {
      matches.push({ id: `G${groupId}-R${rIdx + 1}M${mIdx + 1}`, home: pair.home, away: pair.away, homeGoals: null, awayGoals: null, leg: 1 });
    });
  });
  if (homeAndAway) {
    const startR = firstLegRounds.length + 1;
    firstLegRounds.forEach((round, rIdx) => {
      round.forEach((pair, mIdx) => {
        matches.push({ id: `G${groupId}-R${startR + rIdx}M${mIdx + 1}`, home: pair.away, away: pair.home, homeGoals: null, awayGoals: null, leg: 2 });
      });
    });
  }
  return matches;
}

export function computeTable(group) {
  const stats = new Map();
  function ensure(e) {
    if (!stats.has(e.id)) {
      stats.set(e.id, { playerId: e.id, label: e.team?.name || e.label, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, get gd() { return this.gf - this.ga; }, pts: 0 });
    }
    return stats.get(e.id);
  }
  group.matches.forEach(m => {
    const hg = m.homeGoals; const ag = m.awayGoals;
    if (hg == null || ag == null || !Number.isInteger(hg) || !Number.isInteger(ag)) return;
    const h = ensure(m.home); const a = ensure(m.away);
    h.played++; a.played++;
    h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag) { h.w++; a.l++; h.pts += 3; }
    else if (ag > hg) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts += 1; a.pts += 1; }
  });
  group.teams.forEach(e => ensure(e));
  return Array.from(stats.values()).sort((a, b) => (b.pts - a.pts) || (b.gd - a.gd) || (b.gf - a.gf) || a.label.localeCompare(b.label));
}

export function renderGroups(groups, container, mode) {
  container.innerHTML = "";
  groups.forEach(group => {
    const groupCard = document.createElement("div");
    groupCard.className = "card";
    groupCard.style.marginBottom = "24px";

    groupCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">GROUP ${group.id}</div>
      </div>
      <div class="card-body">
        <div class="matches-list" style="display: flex; flex-direction: column; gap: 8px"></div>
        <div class="table-container" style="margin-top: 16px; overflow-x: auto"></div>
      </div>
    `;

    const nextMatches = groupCard.querySelector(".matches-list");
    group.matches.forEach((match, idx) => {
      const row = document.createElement("div");
      row.className = "field-group";
      row.style.flexDirection = "row";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.background = "rgba(15, 23, 42, 0.2)";
      row.style.padding = "10px 16px";
      row.style.borderRadius = "12px";

      const homeName = match.home.team?.name || match.home.label;
      const awayName = match.away.team?.name || match.away.label;

      row.innerHTML = `
        <span style="font-size: 0.9rem; flex: 1; font-weight: 500">${homeName}</span>
        <div style="display: flex; align-items: center; gap: 8px">
          <input type="number" min="0" class="score-input home" value="${match.homeGoals ?? ''}" style="width: 50px; text-align: center; padding: 6px">
          <span style="color: var(--text-dim)">-</span>
          <input type="number" min="0" class="score-input away" value="${match.awayGoals ?? ''}" style="width: 50px; text-align: center; padding: 6px">
        </div>
        <span style="font-size: 0.9rem; flex: 1; text-align: right; font-weight: 500">${awayName}</span>
      `;

      const hInput = row.querySelector(".home");
      const aInput = row.querySelector(".away");
      const update = () => {
        match.homeGoals = hInput.value === "" ? null : parseInt(hInput.value);
        match.awayGoals = aInput.value === "" ? null : parseInt(aInput.value);
        renderTable();
      };
      hInput.addEventListener("input", update);
      aInput.addEventListener("input", update);
      nextMatches.appendChild(row);
    });

    const tableContainer = groupCard.querySelector(".table-container");
    const renderTable = () => {
      const stats = computeTable(group);
      tableContainer.innerHTML = `
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 4px; font-size: 0.85rem">
          <thead>
            <tr style="color: var(--text-dim); text-transform: uppercase; font-size: 0.75rem">
              <th style="text-align: left; padding: 8px">Club</th>
              <th style="padding: 8px">P</th>
              <th style="padding: 8px">GD</th>
              <th style="padding: 8px">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${stats.map(s => `
              <tr style="background: rgba(255,255,255,0.03); border-radius: 8px">
                <td style="padding: 10px; border-radius: 8px 0 0 8px; font-weight: 600">${s.label}</td>
                <td style="text-align: center; padding: 10px">${s.played}</td>
                <td style="text-align: center; padding: 10px; color: ${s.gd > 0 ? 'var(--success)' : s.gd < 0 ? 'var(--danger)' : 'inherit'}">${s.gd > 0 ? '+' + s.gd : s.gd}</td>
                <td style="text-align: center; padding: 10px; border-radius: 0 8px 8px 0; font-weight: 800; color: var(--primary)">${s.pts}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };
    renderTable();
    container.appendChild(groupCard);
  });
}
