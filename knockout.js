// knockout.js
import { shuffle } from "./utils.js";

/**
 * entries: [{ id, label, team, ownerId, ownerLabel }]
 * options: { homeAway: boolean }  // homeAway applies to all rounds EXCEPT the Final
 */
export function generateKnockoutTournament(entries, container, { homeAway }) {
  container.innerHTML = "";

  const count = entries.length;
  const allowed = [2, 4, 8, 16, 32];
  if (!allowed.includes(count)) {
    container.innerHTML =
      "<p class='placeholder'>Knockout currently supports 2, 4, 8, 16, or 32 entries.</p>";
    return;
  }

  const shuffled = [...entries];
  shuffle(shuffled);

  const state = {
    homeAway,
    initialCount: count,
    rounds: [], // [{ name, ties: [...] }]
    participants: shuffled,
    thirdPlace: {
      teamA: null,
      teamB: null,
      goalsA: null,
      goalsB: null,
      pensA: null,
      pensB: null
    }
  };

  const firstRound = createRoundFromParticipants(shuffled, homeAway, 0);
  state.rounds.push(firstRound);

  renderKnockout(container, state);
}

/* ---------- helpers: model ---------- */

function roundNameForCount(count) {
  if (count === 2) return "Final";
  if (count === 4) return "Semi-finals";
  if (count === 8) return "Quarter-finals";
  if (count === 16) return "Round of 16";
  if (count === 32) return "Round of 32";
  return "Knockout";
}

/**
 * For the Final (2 entries), force single-leg (twoLegged = false).
 */
function createRoundFromParticipants(participants, homeAway, depth) {
  const roundSize = participants.length;
  const name = roundNameForCount(roundSize);

  const twoLeggedForThisRound = homeAway && roundSize > 2;

  const ties = [];
  for (let i = 0; i < participants.length; i += 2) {
    const home = participants[i];
    const away = participants[i + 1];
    if (!home || !away) continue;

    ties.push({
      id: `R${depth + 1}-T${i / 2 + 1}`,
      home,
      away,
      twoLegged: twoLeggedForThisRound,
      leg1HomeGoals: null,
      leg1AwayGoals: null,
      leg2HomeGoals: twoLeggedForThisRound ? null : null,
      leg2AwayGoals: twoLeggedForThisRound ? null : null,
      pensHome: null,
      pensAway: null,
      winner: null,
      loser: null
    });
  }

  return { name, ties };
}

function computeTieWinner(tie) {
  const {
    twoLegged,
    leg1HomeGoals,
    leg1AwayGoals,
    leg2HomeGoals,
    leg2AwayGoals,
    pensHome,
    pensAway
  } = tie;

  const valid = (v) => Number.isInteger(v) && v >= 0;

  // SINGLE-LEG (includes Final)
  if (!twoLegged) {
    if (!valid(leg1HomeGoals) || !valid(leg1AwayGoals)) return null;

    if (leg1HomeGoals > leg1AwayGoals) {
      return { winner: tie.home, loser: tie.away };
    }
    if (leg1AwayGoals > leg1HomeGoals) {
      return { winner: tie.away, loser: tie.home };
    }

    // Draw -> penalties
    if (valid(pensHome) && valid(pensAway) && pensHome !== pensAway) {
      return pensHome > pensAway
        ? { winner: tie.home, loser: tie.away }
        : { winner: tie.away, loser: tie.home };
    }
    return null;
  }

  // TWO-LEGGED (not final)
  if (
    !valid(leg1HomeGoals) ||
    !valid(leg1AwayGoals) ||
    !valid(leg2HomeGoals) ||
    !valid(leg2AwayGoals)
  ) {
    return null;
  }

  const totalHome = leg1HomeGoals + leg2AwayGoals;
  const totalAway = leg1AwayGoals + leg2HomeGoals;

  if (totalHome > totalAway) {
    return { winner: tie.home, loser: tie.away };
  }
  if (totalAway > totalHome) {
    return { winner: tie.away, loser: tie.home };
  }

  if (valid(pensHome) && valid(pensAway) && pensHome !== pensAway) {
    return pensHome > pensAway
      ? { winner: tie.home, loser: tie.away }
      : { winner: tie.away, loser: tie.home };
  }

  return null;
}

function recompute(state) {
  const maxRounds = Math.log2(state.initialCount);

  for (let r = 0; r < state.rounds.length; r++) {
    const round = state.rounds[r];
    const winners = [];

    round.ties.forEach((tie) => {
      const result = computeTieWinner(tie);
      if (result) {
        tie.winner = result.winner;
        tie.loser = result.loser;
        winners.push(result.winner);
      } else {
        tie.winner = null;
        tie.loser = null;
      }
    });

    const allDecided = winners.length === round.ties.length;

    if (
      r === state.rounds.length - 1 &&
      allDecided &&
      winners.length > 1 &&
      state.rounds.length < maxRounds
    ) {
      const nextRound = createRoundFromParticipants(
        winners,
        state.homeAway,
        state.rounds.length
      );
      state.rounds.push(nextRound);
    }
  }

  updateThirdPlaceFromSemis(state);
}

function updateThirdPlaceFromSemis(state) {
  if (state.initialCount < 4) {
    state.thirdPlace.teamA = null;
    state.thirdPlace.teamB = null;
    state.thirdPlace.goalsA = null;
    state.thirdPlace.goalsB = null;
    state.thirdPlace.pensA = null;
    state.thirdPlace.pensB = null;
    return;
  }

  const semiRound = state.rounds.find((r) => r.name === "Semi-finals");
  if (!semiRound) {
    state.thirdPlace.teamA = null;
    state.thirdPlace.teamB = null;
    state.thirdPlace.goalsA = null;
    state.thirdPlace.goalsB = null;
    state.thirdPlace.pensA = null;
    state.thirdPlace.pensB = null;
    return;
  }

  const losers = semiRound.ties
    .map((tie) => tie.loser)
    .filter((loser) => !!loser);

  if (losers.length === 2) {
    state.thirdPlace.teamA = losers[0];
    state.thirdPlace.teamB = losers[1];
  } else {
    state.thirdPlace.teamA = null;
    state.thirdPlace.teamB = null;
    state.thirdPlace.goalsA = null;
    state.thirdPlace.goalsB = null;
    state.thirdPlace.pensA = null;
    state.thirdPlace.pensB = null;
  }
}

/* ---------- view ---------- */

function renderKnockout(container, state) {
  container.innerHTML = "";

  const title = document.createElement("div");
  title.className = "field-label";
  title.textContent = "Knockout Bracket";
  container.appendChild(title);

  const roundsWrapper = document.createElement("div");
  roundsWrapper.style.display = "flex";
  roundsWrapper.style.flexDirection = "column";
  roundsWrapper.style.gap = "10px";
  roundsWrapper.style.marginTop = "6px";

  state.rounds.forEach((round) => {
    const roundCard = document.createElement("div");
    roundCard.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const hTitle = document.createElement("div");
    hTitle.className = "card-title";
    hTitle.textContent = round.name;
    header.appendChild(hTitle);

    const body = document.createElement("div");
    body.className = "card-body";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "8px";

    round.ties.forEach((tie, tieIndex) => {
      const tieBlock = document.createElement("div");
      tieBlock.style.display = "flex";
      tieBlock.style.flexDirection = "column";
      tieBlock.style.gap = "4px";

      // 🔥 Prefer team names if available
      const homeName = tie.home.team?.name || tie.home.label;
      const awayName = tie.away.team?.name || tie.away.label;

      const info = document.createElement("div");
      info.style.fontSize = "0.85rem";
      info.textContent = `Match ${tieIndex + 1}: ${homeName} vs ${awayName}`;
      tieBlock.appendChild(info);

      // LEG 1
      const leg1Row = document.createElement("div");
      leg1Row.style.display = "flex";
      leg1Row.style.alignItems = "center";
      leg1Row.style.flexWrap = "wrap";
      leg1Row.style.gap = "6px";
      leg1Row.style.fontSize = "0.85rem";

      const leg1Label = document.createElement("span");
      leg1Label.textContent = `Leg 1: ${homeName} vs ${awayName}`;

      const leg1Home = document.createElement("input");
      leg1Home.type = "number";
      leg1Home.min = "0";
      leg1Home.style.width = "40px";
      leg1Home.value =
        tie.leg1HomeGoals != null ? String(tie.leg1HomeGoals) : "";

      const dash1 = document.createElement("span");
      dash1.textContent = "-";

      const leg1Away = document.createElement("input");
      leg1Away.type = "number";
      leg1Away.min = "0";
      leg1Away.style.width = "40px";
      leg1Away.value =
        tie.leg1AwayGoals != null ? String(tie.leg1AwayGoals) : "";

      leg1Row.appendChild(leg1Label);
      leg1Row.appendChild(leg1Home);
      leg1Row.appendChild(dash1);
      leg1Row.appendChild(leg1Away);

      tieBlock.appendChild(leg1Row);

      // LEG 2 (if twoLegged)
      let leg2HomeInput, leg2AwayInput;
      if (tie.twoLegged) {
        const leg2Row = document.createElement("div");
        leg2Row.style.display = "flex";
        leg2Row.style.alignItems = "center";
        leg2Row.style.flexWrap = "wrap";
        leg2Row.style.gap = "6px";
        leg2Row.style.fontSize = "0.85rem";

        const leg2Label = document.createElement("span");
        leg2Label.textContent = `Leg 2: ${awayName} vs ${homeName}`;

        leg2HomeInput = document.createElement("input");
        leg2HomeInput.type = "number";
        leg2HomeInput.min = "0";
        leg2HomeInput.style.width = "40px";
        leg2HomeInput.value =
          tie.leg2HomeGoals != null ? String(tie.leg2HomeGoals) : "";

        const dash2 = document.createElement("span");
        dash2.textContent = "-";

        leg2AwayInput = document.createElement("input");
        leg2AwayInput.type = "number";
        leg2AwayInput.min = "0";
        leg2AwayInput.style.width = "40px";
        leg2AwayInput.value =
          tie.leg2AwayGoals != null ? String(tie.leg2AwayGoals) : "";

        leg2Row.appendChild(leg2Label);
        leg2Row.appendChild(leg2HomeInput);
        leg2Row.appendChild(dash2);
        leg2Row.appendChild(leg2AwayInput);

        tieBlock.appendChild(leg2Row);
      }

      // Penalties
      const pensRow = document.createElement("div");
      pensRow.style.display = "flex";
      pensRow.style.alignItems = "center";
      pensRow.style.flexWrap = "wrap";
      pensRow.style.gap = "6px";
      pensRow.style.fontSize = "0.8rem";

      const pensLabel = document.createElement("span");
      pensLabel.textContent = "Penalties (if needed):";

      const pensHome = document.createElement("input");
      pensHome.type = "number";
      pensHome.min = "0";
      pensHome.style.width = "40px";
      pensHome.value = tie.pensHome != null ? String(tie.pensHome) : "";

      const dashP = document.createElement("span");
      dashP.textContent = "-";

      const pensAway = document.createElement("input");
      pensAway.type = "number";
      pensAway.min = "0";
      pensAway.style.width = "40px";
      pensAway.value = tie.pensAway != null ? String(tie.pensAway) : "";

      pensRow.appendChild(pensLabel);
      pensRow.appendChild(pensHome);
      pensRow.appendChild(dashP);
      pensRow.appendChild(pensAway);

      tieBlock.appendChild(pensRow);

      // Winner label (team name preferred)
      const winnerLabel = document.createElement("div");
      winnerLabel.style.fontSize = "0.8rem";
      winnerLabel.style.color = "#9ca3af";
      winnerLabel.style.marginTop = "2px";

      if (tie.winner) {
        const winnerName = tie.winner.team?.name || tie.winner.label;
        winnerLabel.textContent = `Winner: ${winnerName}`;
      } else {
        winnerLabel.textContent = "Winner: –";
      }

      tieBlock.appendChild(winnerLabel);

      function parseIntOrNull(value) {
        if (value === "" || value == null) return null;
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0) return null;
        return Math.floor(num);
      }

      function onChange() {
        tie.leg1HomeGoals = parseIntOrNull(leg1Home.value);
        tie.leg1AwayGoals = parseIntOrNull(leg1Away.value);

        if (tie.twoLegged) {
          tie.leg2HomeGoals = parseIntOrNull(leg2HomeInput.value);
          tie.leg2AwayGoals = parseIntOrNull(leg2AwayInput.value);
        }

        tie.pensHome = parseIntOrNull(pensHome.value);
        tie.pensAway = parseIntOrNull(pensAway.value);

        recompute(state);
        renderKnockout(container, state);
      }

      leg1Home.addEventListener("input", onChange);
      leg1Away.addEventListener("input", onChange);
      pensHome.addEventListener("input", onChange);
      pensAway.addEventListener("input", onChange);
      if (tie.twoLegged) {
        leg2HomeInput.addEventListener("input", onChange);
        leg2AwayInput.addEventListener("input", onChange);
      }

      body.appendChild(tieBlock);
    });

    roundCard.appendChild(header);
    roundCard.appendChild(body);
    roundsWrapper.appendChild(roundCard);
  });

  container.appendChild(roundsWrapper);

  // 3rd place (single match, teams auto from semi-final losers)
  if (state.initialCount >= 4) {
    const thirdCard = document.createElement("div");
    thirdCard.className = "card";
    thirdCard.style.marginTop = "10px";

    const h = document.createElement("div");
    h.className = "card-header";
    const t = document.createElement("div");
    t.className = "card-title";
    t.textContent = "3rd Place Match";
    h.appendChild(t);

    const b = document.createElement("div");
    b.className = "card-body";

    const hint = document.createElement("p");
    hint.className = "hint";
    hint.style.marginBottom = "6px";

    if (state.thirdPlace.teamA && state.thirdPlace.teamB) {
      hint.textContent =
        "Semi-finals losers are auto-selected for the 3rd place match.";
    } else {
      hint.textContent =
        "Once both semi-finals are finished, the losing entries will appear here automatically.";
    }

    if (state.thirdPlace.teamA && state.thirdPlace.teamB) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.flexWrap = "wrap";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      row.style.fontSize = "0.85rem";

      const nameA =
        state.thirdPlace.teamA.team?.name || state.thirdPlace.teamA.label;
      const nameB =
        state.thirdPlace.teamB.team?.name || state.thirdPlace.teamB.label;

      const labelTeams = document.createElement("span");
      labelTeams.textContent = `${nameA} vs ${nameB}`;
      labelTeams.style.marginBottom = "4px";
      labelTeams.style.display = "block";

      const scoreA = document.createElement("input");
      scoreA.type = "number";
      scoreA.min = "0";
      scoreA.style.width = "40px";
      scoreA.value =
        state.thirdPlace.goalsA != null
          ? String(state.thirdPlace.goalsA)
          : "";

      const dash = document.createElement("span");
      dash.textContent = "-";

      const scoreB = document.createElement("input");
      scoreB.type = "number";
      scoreB.min = "0";
      scoreB.style.width = "40px";
      scoreB.value =
        state.thirdPlace.goalsB != null
          ? String(state.thirdPlace.goalsB)
          : "";

      const pensLabel = document.createElement("span");
      pensLabel.textContent = "Penalties (if needed):";
      pensLabel.style.marginLeft = "10px";

      const pensA = document.createElement("input");
      pensA.type = "number";
      pensA.min = "0";
      pensA.style.width = "40px";
      pensA.value =
        state.thirdPlace.pensA != null
          ? String(state.thirdPlace.pensA)
          : "";

      const dashP = document.createElement("span");
      dashP.textContent = "-";

      const pensB = document.createElement("input");
      pensB.type = "number";
      pensB.min = "0";
      pensB.style.width = "40px";
      pensB.value =
        state.thirdPlace.pensB != null
          ? String(state.thirdPlace.pensB)
          : "";

      function parseIntOrNull(value) {
        if (value === "" || value == null) return null;
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0) return null;
        return Math.floor(num);
      }

      scoreA.addEventListener("input", () => {
        state.thirdPlace.goalsA = parseIntOrNull(scoreA.value);
      });

      scoreB.addEventListener("input", () => {
        state.thirdPlace.goalsB = parseIntOrNull(scoreB.value);
      });

      pensA.addEventListener("input", () => {
        state.thirdPlace.pensA = parseIntOrNull(pensA.value);
      });

      pensB.addEventListener("input", () => {
        state.thirdPlace.pensB = parseIntOrNull(pensB.value);
      });

      row.appendChild(scoreA);
      row.appendChild(dash);
      row.appendChild(scoreB);
      row.appendChild(pensLabel);
      row.appendChild(pensA);
      row.appendChild(dashP);
      row.appendChild(pensB);

      b.appendChild(labelTeams);
      b.appendChild(row);
    }

    b.prepend(hint);
    thirdCard.appendChild(h);
    thirdCard.appendChild(b);
    container.appendChild(thirdCard);
  }
}
