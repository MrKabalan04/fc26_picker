// knockout.js
import { shuffle } from "./utils.js";

export function generateKnockoutTournament(entries, container, { homeAway }) {
  container.innerHTML = "";
  const count = entries.length;
  if (![2, 4, 8, 16, 32].includes(count)) {
    container.innerHTML = "<p class='placeholder' style='text-align: center; padding: 40px'>Knockout supports 2, 4, 8, 16, or 32 entries.</p>";
    return;
  }
  const shuffled = [...entries];
  shuffle(shuffled);
  const state = { homeAway, initialCount: count, rounds: [], participants: shuffled, thirdPlace: { teamA: null, teamB: null, goalsA: null, goalsB: null, pensA: null, pensB: null } };
  state.rounds.push(createRoundFromParticipants(shuffled, homeAway, 0));
  renderKnockout(container, state);
}

function roundNameForCount(count) {
  if (count === 2) return "Final";
  if (count === 4) return "Semi-finals";
  if (count === 8) return "Quarter-finals";
  if (count === 16) return "Round of 16";
  return "Round of 32";
}

function createRoundFromParticipants(participants, homeAway, depth) {
  const roundSize = participants.length;
  const name = roundNameForCount(roundSize);
  const twoLegged = homeAway && roundSize > 2;
  const ties = [];
  for (let i = 0; i < participants.length; i += 2) {
    ties.push({ id: `R${depth + 1}-T${i / 2 + 1}`, home: participants[i], away: participants[i + 1], twoLegged, leg1HomeGoals: null, leg1AwayGoals: null, leg2HomeGoals: null, leg2AwayGoals: null, pensHome: null, pensAway: null, winner: null, loser: null });
  }
  return { name, ties };
}

function computeTieWinner(tie) {
  const valid = (v) => Number.isInteger(v) && v >= 0;
  if (!tie.twoLegged) {
    if (!valid(tie.leg1HomeGoals) || !valid(tie.leg1AwayGoals)) return null;
    if (tie.leg1HomeGoals > tie.leg1AwayGoals) return { winner: tie.home, loser: tie.away };
    if (tie.leg1AwayGoals > tie.leg1HomeGoals) return { winner: tie.away, loser: tie.home };
    if (valid(tie.pensHome) && valid(tie.pensAway) && tie.pensHome !== tie.pensAway) {
      return tie.pensHome > tie.pensAway ? { winner: tie.home, loser: tie.away } : { winner: tie.away, loser: tie.home };
    }
    return null;
  }
  if (!valid(tie.leg1HomeGoals) || !valid(tie.leg1AwayGoals) || !valid(tie.leg2HomeGoals) || !valid(tie.leg2AwayGoals)) return null;
  const h = tie.leg1HomeGoals + tie.leg2AwayGoals;
  const a = tie.leg1AwayGoals + tie.leg2HomeGoals;
  if (h > a) return { winner: tie.home, loser: tie.away };
  if (a > h) return { winner: tie.away, loser: tie.home };
  if (valid(tie.pensHome) && valid(tie.pensAway) && tie.pensHome !== tie.pensAway) {
    return tie.pensHome > tie.pensAway ? { winner: tie.home, loser: tie.away } : { winner: tie.away, loser: tie.home };
  }
  return null;
}

function recompute(state) {
  const maxR = Math.log2(state.initialCount);
  for (let r = 0; r < state.rounds.length; r++) {
    const round = state.rounds[r];
    const winners = [];
    round.ties.forEach(tie => {
      const res = computeTieWinner(tie);
      if (res) { tie.winner = res.winner; tie.loser = res.loser; winners.push(res.winner); }
      else { tie.winner = null; tie.loser = null; }
    });
    if (r === state.rounds.length - 1 && winners.length === round.ties.length && winners.length > 1 && state.rounds.length < maxR) {
      state.rounds.push(createRoundFromParticipants(winners, state.homeAway, state.rounds.length));
    }
  }
  updateThirdPlace(state);
}

function updateThirdPlace(state) {
  if (state.initialCount < 4) return;
  const semi = state.rounds.find(r => r.name === "Semi-finals");
  if (!semi) return;
  const losers = semi.ties.map(t => t.loser).filter(l => !!l);
  if (losers.length === 2) { state.thirdPlace.teamA = losers[0]; state.thirdPlace.teamB = losers[1]; }
}

function renderKnockout(container, state) {
  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "20px";

  state.rounds.forEach(round => {
    const roundDiv = document.createElement("div");
    roundDiv.className = "card";
    roundDiv.innerHTML = `
      <div class="card-header"><div class="card-title">${round.name}</div></div>
      <div class="card-body" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px"></div>
    `;
    const body = roundDiv.querySelector(".card-body");
    round.ties.forEach((tie, idx) => {
      const tieDiv = document.createElement("div");
      tieDiv.style.background = "rgba(15, 23, 42, 0.4)";
      tieDiv.style.padding = "16px";
      tieDiv.style.borderRadius = "16px";
      tieDiv.style.border = "1px solid var(--border-color)";

      const homeName = tie.home.team?.name || tie.home.label;
      const awayName = tie.away.team?.name || tie.away.label;

      tieDiv.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-dim); margin-bottom: 12px; text-transform: uppercase">Match ${idx + 1}</div>
        <div class="tie-legs" style="display: flex; flex-direction: column; gap: 8px"></div>
        ${tie.winner ? `<div style="margin-top: 12px; font-size: 0.85rem; color: var(--success); font-weight: 700; text-align: center; background: rgba(34,197,94,0.1); padding: 4px; border-radius: 8px">Proceeds: ${tie.winner.team?.name || tie.winner.label}</div>` : ''}
      `;

      const legs = tieDiv.querySelector(".tie-legs");
      const addLeg = (n, h, a, hV, aV) => {
        const l = document.createElement("div");
        l.style.display = "flex";
        l.style.alignItems = "center";
        l.style.justifyContent = "space-between";
        l.innerHTML = `
          <span style="font-size: 0.85rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${h}</span>
          <div style="display: flex; align-items: center; gap: 4px; margin: 0 10px">
            <input type="number" min="0" class="score h" value="${hV ?? ''}" style="width: 44px; text-align: center; padding: 4px">
            <span style="opacity: 0.5">-</span>
            <input type="number" min="0" class="score a" value="${aV ?? ''}" style="width: 44px; text-align: center; padding: 4px">
          </div>
          <span style="font-size: 0.85rem; flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${a}</span>
        `;
        legs.appendChild(l);
        return { h: l.querySelector(".h"), a: l.querySelector(".a") };
      };

      const leg1 = addLeg(1, homeName, awayName, tie.leg1HomeGoals, tie.leg1AwayGoals);
      leg1.h.addEventListener("input", e => { tie.leg1HomeGoals = e.target.value === "" ? null : parseInt(e.target.value); recompute(state); renderKnockout(container, state); });
      leg1.a.addEventListener("input", e => { tie.leg1AwayGoals = e.target.value === "" ? null : parseInt(e.target.value); recompute(state); renderKnockout(container, state); });

      if (tie.twoLegged) {
        const leg2 = addLeg(2, awayName, homeName, tie.leg2HomeGoals, tie.leg2AwayGoals);
        leg2.h.addEventListener("input", e => { tie.leg2HomeGoals = e.target.value === "" ? null : parseInt(e.target.value); recompute(state); renderKnockout(container, state); });
        leg2.a.addEventListener("input", e => { tie.leg2AwayGoals = e.target.value === "" ? null : parseInt(e.target.value); recompute(state); renderKnockout(container, state); });
      }

      const penRow = document.createElement("div");
      penRow.style.marginTop = "8px";
      penRow.style.paddingTop = "8px";
      penRow.style.borderTop = "1px dashed var(--border-color)";
      penRow.style.display = "flex";
      penRow.style.alignItems = "center";
      penRow.style.justifyContent = "center";
      penRow.style.gap = "8px";
      penRow.innerHTML = `
        <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700">Pens:</span>
        <input type="number" min="0" class="p-h" value="${tie.pensHome ?? ''}" style="width: 40px; text-align: center; padding: 2px; font-size: 0.8rem">
        <span style="opacity: 0.5">-</span>
        <input type="number" min="0" class="p-a" value="${tie.pensAway ?? ''}" style="width: 40px; text-align: center; padding: 2px; font-size: 0.8rem">
      `;
      tieDiv.appendChild(penRow);
      penRow.querySelector(".p-h").addEventListener("input", e => { tie.pensHome = e.target.value === "" ? null : parseInt(e.target.value); recompute(state); renderKnockout(container, state); });
      penRow.querySelector(".p-a").addEventListener("input", e => { tie.pensAway = e.target.value === "" ? null : parseInt(e.target.value); recompute(state); renderKnockout(container, state); });

      body.appendChild(tieDiv);
    });
    wrapper.appendChild(roundDiv);
  });
  container.appendChild(wrapper);
}
