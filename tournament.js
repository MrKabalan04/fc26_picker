// tournament.js
import { getLastAssignments } from "./teampicker.js";
import { generateGroups, renderGroups, computeTable } from "./groups.js";
import { generateKnockoutTournament } from "./knockout.js";

let tournamentState = null;

export function initTournament() {
  const typeEl = document.getElementById("tournament-type");
  const playerCountEl = document.getElementById("tournament-player-count"); // now only informational
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

    const groupsHomeAway = groupsHomeAwayEl
      ? !!groupsHomeAwayEl.checked
      : false;
    const knockoutHomeAway = knockoutHomeAwayEl
      ? !!knockoutHomeAwayEl.checked
      : false;

    const last = getLastAssignments(); // from teamPicker

    if (!Array.isArray(last) || last.length === 0) {
      showSetupMessage(
        "No last spin found. Spin teams first in Team Picker.",
        "error"
      );
      return;
    }

    // 🔥 Detect multi-team mode: any player that has allTeams with length > 1
    const multiTeamMode = last.some(
      (p) => Array.isArray(p.allTeams) && p.allTeams.length > 1
    );

    let participants = [];
    let mode = "players"; // or "teams"

    if (!multiTeamMode) {
      // =========================
      // SIMPLE MODE: 1 team/player
      // =========================
      const maxPlayers = last.length;

      // Just reflect it in the input so UI matches
      if (playerCountEl) {
        playerCountEl.value = String(maxPlayers);
      }

      participants = last.map((p) => ({
        id: String(p.id),
        label: p.label, // "Player 1"
        team: p.team,
        ownerId: p.id,
        ownerLabel: p.label
      }));
      mode = "players";

      showSetupMessage(
        `Using ${maxPlayers} players from last spin (1 team each).`,
        "success"
      );
    } else {
      // =========================================
      // MULTI-TEAM MODE: each TEAM is a participant
      // =========================================
      const teamEntries = [];

      last.forEach((player) => {
        const teams =
          Array.isArray(player.allTeams) && player.allTeams.length > 0
            ? player.allTeams
            : player.team
            ? [player.team]
            : [];

        teams.forEach((team, idx) => {
          teamEntries.push({
            id: `${player.id}-${idx + 1}`,
            // For display in groups/knockout, we mainly want the TEAM name
            label: team.name,
            team,
            ownerId: player.id,
            ownerLabel: player.label // "Player X"
          });
        });
      });

      const maxEntries = teamEntries.length;

      participants = teamEntries;
      mode = "teams";

      // Reflect in input just for info (number of teams)
      if (playerCountEl) {
        playerCountEl.value = String(maxEntries);
      }

      showSetupMessage(
        `Multi-team mode detected: ${last.length} players, ${maxEntries} teams from last spin.`,
        "success"
      );
    }

    // Save state
    tournamentState = {
      type: tType,
      mode, // "players" or "teams"
      participants,
      groupsHomeAway,
      knockoutHomeAway,
      groups: null
    };

    resetTournamentView();

    // ========== RENDER BASED ON TYPE ==========
    if (tType === "knockout") {
      knockoutCard.style.display = "block";
      generateKnockoutTournament(participants, knockoutContainer, {
        homeAway: knockoutHomeAway
      });
      groupsCard.style.display = "none";
    } else if (tType === "groups") {
      const groups = generateGroups(participants, "groups", {
        homeAndAway: groupsHomeAway
      });
      tournamentState.groups = groups;
      renderGroups(groups, groupsContainer, "groups");
      groupsCard.style.display = "block";
      knockoutCard.style.display = "none";
    } else if (tType === "groups-knockout") {
      const groups = generateGroups(participants, "groups-knockout", {
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
          homeAway: knockoutHomeAway
        });
      });

      knockoutContainer.appendChild(btn);
      knockoutContainer.appendChild(bracketDiv);
    }
  });
}

/**
 * World Cup style pairing:
 * For each pair of groups (A,B), take:
 *  A1 vs B2, B1 vs A2
 */
function buildQualifiedFromGroups(groups) {
  if (!groups || groups.length === 0) return [];

  const sortedGroups = [...groups].sort((a, b) =>
    a.id.toString().localeCompare(b.id.toString())
  );

  const qualified = [];

  function getEntryByStandingRow(group, row) {
    const pid = row.playerId ?? row.participantId;
    return group.teams.find((p) => p.id === pid);
  }

  for (let i = 0; i < sortedGroups.length; i += 2) {
    const gA = sortedGroups[i];
    const gB = sortedGroups[i + 1];

    // Odd number of groups → last group alone:
    if (!gB) {
      const tableA = computeTable(gA);
      if (tableA[0]) {
        const a1 = getEntryByStandingRow(gA, tableA[0]);
        if (a1) qualified.push(a1);
      }
      continue;
    }

    const tableA = computeTable(gA);
    const tableB = computeTable(gB);
    if (tableA.length < 2 || tableB.length < 2) continue;

    const a1 = getEntryByStandingRow(gA, tableA[0]);
    const a2 = getEntryByStandingRow(gA, tableA[1]);
    const b1 = getEntryByStandingRow(gB, tableB[0]);
    const b2 = getEntryByStandingRow(gB, tableB[1]);

    if (!a1 || !a2 || !b1 || !b2) continue;

    // A1 vs B2, B1 vs A2
    qualified.push(a1, b2, b1, a2);
  }

  return qualified;
}