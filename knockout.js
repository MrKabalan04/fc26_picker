// knockout.js
import { shuffle } from "./utils.js";

/**
 * Entry point used by tournament.js
 * players: [{ id, label, team }]
 * options: { homeAway: boolean }  // homeAway applies to ALL ROUNDS EXCEPT FINAL
 */
export function generateKnockoutTournament(players, container, { homeAway }) {
  container.innerHTML = "";

  const count = players.length;
  const allowed = [2, 4, 8, 16, 32];
  if (!allowed.includes(count)) {
    container.innerHTML =
      "<p class='placeholder'>Knockout currently supports 2, 4, 8, 16, or 32 players.</p>";
    return;
  }

  const shuffled = [...players];
  shuffle(shuffled);

  const state = {
    homeAway,              // global preference (used for all rounds except Final)
    initialCount: count,
    rounds: [],            // [{ name, ties: [...] }]
    players: shuffled,
    thirdPlace: {
      teamA: null,         // losing semi-finalist A (player object)
      teamB: null,         // losing semi-finalist B (player object)
      goalsA: null,
      goalsB: null,
      pensA: null,
      pensB: null
    }
  };

  // create first round
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
 * Create a round (Round of 16, Quarters, Semis, Final)
 * For Final (2 teams), we always force single-leg (twoLegged = false).
 */
function createRoundFromParticipants(participants, homeAway, depth) {
  const roundSize = participants.length;
  const name = roundNameForCount(roundSize);

  // Final is always single leg:
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
      twoLegged: twoLeggedForThisRound, // 👈 important
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

/**
 * Decide winner for a tie (single-leg or two-legged),
 * including penalties if needed.
 */
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

  // SINGLE-LEG (includes the Final)
  if (!twoLegged) {
    if (!valid(leg1HomeGoals) || !valid(leg1AwayGoals)) {
      return null;
    }

    if (leg1HomeGoals > leg1AwayGoals) {
      return { winner: tie.home, loser: tie.away };
    }
    if (leg1AwayGoals > leg1HomeGoals) {
      return { winner: tie.away, loser: tie.home };
    }

    // Draw → check penalties
    if (valid(pensHome) && valid(pensAway) && pensHome !== pensAway) {
      return pensHome > pensAway
        ? { winner: tie.home, loser: tie.away }
        : { winner: tie.away, loser: tie.home };
    }
    return null;
  }

  // TWO-LEGGED (home & away, NOT final)
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

  // Aggregate tie → penalties
  if (valid(pensHome) && valid(pensAway) && pensHome !== pensAway) {
    return pensHome > pensAway
      ? { winner: tie.home, loser: tie.away }
      : { winner: tie.away, loser: tie.home };
  }

  return null;
}

/**
 * Recompute everything:
 *  - winners of each tie
 *  - auto-generate next rounds when all ties decided
 *  - auto-fill semi-final losers into 3rd place match
 */
function recompute(state) {
  const maxRounds = Math.log2(state.initialCount); // e.g. 16 → 4

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
      // create next round from winners
      const nextRound = createRoundFromParticipants(
        winners,
        state.homeAway,
        state.rounds.length
      );
      state.rounds.push(nextRound);
    }
  }

  // after all rounds recomputed, update 3rd-place info from semi-finals
  updateThirdPlaceFromSemis(state);
}

/**
 * Fill thirdPlace.teamA & teamB from semi-final losers
 */
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
    // keep existing scores if user already entered them
  } else {
    state.thirdPlace.teamA = null;
    state.thirdPlace.teamB = null;
    state.thirdPlace.goalsA = null;
    state.thirdPlace.goalsB = null;
    state.thirdPlace.pensA = null;
    state.thirdPlace.pensB = null;
  }
}

/* ---------- helpers: view / DOM ---------- */

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

      const info = document.createElement("div");
      info.style.fontSize = "0.85rem";
      info.textContent = `Match ${tieIndex + 1}: ${tie.home.label} (${tie.home.team.name}) vs ${tie.away.label} (${tie.away.team.name})`;
      tieBlock.appendChild(info);

      // LEG 1
      const leg1Row = document.createElement("div");
      leg1Row.style.display = "flex";
      leg1Row.style.alignItems = "center";
      leg1Row.style.gap = "6px";
      leg1Row.style.fontSize = "0.85rem";

      const leg1Label = document.createElement("span");
      leg1Label.textContent = `Leg 1: ${tie.home.team.name} vs ${tie.away.team.name}`;

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

      // LEG 2 (only if tie.twoLegged is true, so NOT the final)
      let leg2HomeInput, leg2AwayInput;
      if (tie.twoLegged) {
        const leg2Row = document.createElement("div");
        leg2Row.style.display = "flex";
        leg2Row.style.alignItems = "center";
        leg2Row.style.gap = "6px";
        leg2Row.style.fontSize = "0.85rem";

        const leg2Label = document.createElement("span");
        leg2Label.textContent = `Leg 2: ${tie.away.team.name} vs ${tie.home.team.name}`;

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

      // PENALTIES
      const pensRow = document.createElement("div");
      pensRow.style.display = "flex";
      pensRow.style.alignItems = "center";
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

      // WINNER LABEL
      const winnerLabel = document.createElement("div");
      winnerLabel.style.fontSize = "0.8rem";
      winnerLabel.style.color = "#9ca3af";
      winnerLabel.style.marginTop = "2px";
      winnerLabel.textContent = tie.winner
        ? `Winner: ${tie.winner.label} (${tie.winner.team.name})`
        : "Winner: –";
      tieBlock.appendChild(winnerLabel);

      // LISTENERS
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

  // 3RD PLACE MATCH – TEAMS AUTOMATIC FROM SEMI-FINAL LOSERS (no manual override)
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
        "Semi-final losers are auto-selected here for the 3rd place match.";
    } else {
      hint.textContent =
        "Once both semi-finals are finished, the losing teams will appear here automatically.";
    }

    if (state.thirdPlace.teamA && state.thirdPlace.teamB) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.flexWrap = "wrap";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      row.style.fontSize = "0.85rem";

      const labelTeams = document.createElement("span");
      labelTeams.textContent = `${state.thirdPlace.teamA.label} (${state.thirdPlace.teamA.team.name}) vs ${state.thirdPlace.teamB.label} (${state.thirdPlace.teamB.team.name})`;
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
