// tournament.js
import { getLastAssignments } from "./teampicker.js";
import { generateGroups, renderGroups, computeTable } from "./groups.js";
import { generateKnockoutTournament } from "./knockout.js";

let tournamentState = null;

export function initTournament() {
  const typeEl = document.getElementById("tournament-type");
  const playerCountEl = document.getElementById("tournament-player-count");
  const groupsHomeAwayEl = document.getElementById("groups-home-away");
  const knockoutHomeAwayEl = document.getElementById("knockout-home-away");
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
    const groupsHomeAway = !!groupsHomeAwayEl.checked;
    const knockoutHomeAway = !!knockoutHomeAwayEl.checked;

    const last = getLastAssignments();
    if (!Array.isArray(last) || last.length === 0) {
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
    if (last.length < count) {
      showSetupMessage(
        `You requested ${count} players but only ${last.length} teams exist from last spin.`,
        "error"
      );
      return;
    }

    const players = last.slice(0, count).map((entry, idx) => ({
      id: idx + 1,
      label: `Player ${idx + 1}`,
      team: entry.team
    }));

    tournamentState = {
      type: tType,
      players,
      groupsHomeAway,
      knockoutHomeAway,
      groups: null
    };

    resetTournamentView();

    if (tType === "knockout") {
      knockoutCard.style.display = "block";
      generateKnockoutTournament(players, knockoutContainer, {
        homeAway: knockoutHomeAway
      });
      groupsCard.style.display = "none";
    } else if (tType === "groups") {
      const groups = generateGroups(players, "groups", {
        homeAndAway: groupsHomeAway
      });
      tournamentState.groups = groups;
      renderGroups(groups, groupsContainer, "groups");
      groupsCard.style.display = "block";
      knockoutCard.style.display = "none";
    } else if (tType === "groups-knockout") {
      const groups = generateGroups(players, "groups-knockout", {
        homeAndAway: groupsHomeAway
      });
      tournamentState.groups = groups;
      renderGroups(groups, groupsContainer, "groups-knockout");
      groupsCard.style.display = "block";
      knockoutCard.style.display = "block";

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
            "<p class='placeholder'>Not enough finished group tables to generate knockout.</p>";
          return;
        }
        generateKnockoutTournament(qualified, bracketDiv, {
          homeAway: knockoutHomeAwayEl.checked
        });
      });

      knockoutContainer.appendChild(btn);
      knockoutContainer.appendChild(bracketDiv);
    }

    showSetupMessage("Tournament created from last spin.", "success");
  });
}

// World Cup style: A1 vs B2, B1 vs A2, etc.
function buildQualifiedFromGroups(groups) {
  if (!groups || groups.length === 0) return [];

  const sortedGroups = [...groups].sort((a, b) =>
    a.id.toString().localeCompare(b.id.toString())
  );

  const qualified = [];

  for (let i = 0; i < sortedGroups.length; i += 2) {
    const gA = sortedGroups[i];
    const gB = sortedGroups[i + 1];

    if (!gB) {
      const tableA = computeTable(gA);
      if (tableA[0]) {
        const pA1 = gA.teams.find((p) => p.id === tableA[0].playerId);
        if (pA1) qualified.push(pA1);
      }
      continue;
    }

    const tableA = computeTable(gA);
    const tableB = computeTable(gB);
    if (tableA.length < 2 || tableB.length < 2) continue;

    const a1 = gA.teams.find((p) => p.id === tableA[0].playerId);
    const a2 = gA.teams.find((p) => p.id === tableA[1].playerId);
    const b1 = gB.teams.find((p) => p.id === tableB[0].playerId);
    const b2 = gB.teams.find((p) => p.id === tableB[1].playerId);

    if (!a1 || !a2 || !b1 || !b2) continue;

    qualified.push(a1, b2, b1, a2);
  }

  return qualified;
}
