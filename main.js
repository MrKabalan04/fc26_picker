// main.js
import { initTeamPicker, updatePlayersFromWheel } from "./teampicker.js";
import { initTournament } from "./tournament.js";
import { SpinWheel } from "./wheel.js";

function initTabs() {
  const tabBtns = document.querySelectorAll("#mode-tabs button");
  const tabContents = document.querySelectorAll("main");

  function setMode(targetTab) {
    tabContents.forEach(content => {
      content.classList.toggle("hidden", content.id !== `tab-${targetTab}`);
    });

    tabBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === targetTab);
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.tab));
  });

  // Default mode
  setMode("wheel");

  return { setMode };
}

function initWheelUI(tabs) {
  const playerInputsContainer = document.getElementById("player-inputs");
  const addPlayerBtn = document.getElementById("add-player-btn");
  const spinWheelBtn = document.getElementById("spin-wheel-btn");
  const winnerResults = document.getElementById("winner-results");
  const winnerList = document.getElementById("winner-list");
  const clearWheelBtn = document.getElementById("clear-wheel-btn");

  let players = ["Player 1", "Player 2"];
  let spinResults = [];

  function showWinnerModal(name, rank) {
    const modal = document.getElementById("winner-modal");
    document.getElementById("modal-winner-name").textContent = name;
    document.getElementById("modal-winner-rank").textContent = `Rank #${rank}`;
    modal.classList.remove("hidden");
  }

  document.getElementById("close-modal-btn").addEventListener("click", () => {
    document.getElementById("winner-modal").classList.add("hidden");
  });

  const wheel = new SpinWheel("wheel-canvas", {
    players: players,
    onFinish: (winner) => {
      // Alert the winner
      const currentRank = spinResults.length + 1;
      showWinnerModal(winner, currentRank);

      spinResults.push(winner);

      // Remove winner from wheel
      const index = players.indexOf(winner);
      if (index > -1) {
        players.splice(index, 1);
      }

      // If only 1 player is left, they are the last rank automatically
      if (players.length === 1) {
        const lastPlayer = players[0];
        spinResults.push(lastPlayer);
        players.splice(0, 1); // Empty the array
      }

      wheel.setPlayers(players);
      updateWinnerDisplay();

      // Update Team Picker names
      updatePlayersFromWheel(spinResults);

      if (players.length === 0) {
        spinWheelBtn.disabled = true;
        spinWheelBtn.textContent = "All Ranks Assigned!";

        // Final modal adjustment
        const closeBtn = document.getElementById("close-modal-btn");
        closeBtn.textContent = "Start Picking Teams";
        closeBtn.onclick = () => {
          document.getElementById("winner-modal").classList.add("hidden");
          tabs.setMode("picker");
        };
      }
    }
  });

  function renderPlayerInputs() {
    playerInputsContainer.innerHTML = "";
    players.forEach((player, index) => {
      const div = document.createElement("div");
      div.className = "player-input-item";

      const input = document.createElement("input");
      input.type = "text";
      input.value = player;
      input.placeholder = `Player ${index + 1}`;
      input.addEventListener("input", (e) => {
        players[index] = e.target.value;
        wheel.setPlayers(players);
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-secondary";
      removeBtn.style.padding = "8px";
      removeBtn.style.borderRadius = "8px";
      removeBtn.innerHTML = "✕";
      removeBtn.addEventListener("click", () => {
        players.splice(index, 1);
        renderPlayerInputs();
        wheel.setPlayers(players);
      });

      div.appendChild(input);
      div.appendChild(removeBtn);
      playerInputsContainer.appendChild(div);
    });
    wheel.setPlayers(players);
  }

  function updateWinnerDisplay() {
    winnerResults.classList.remove("hidden");
    winnerList.innerHTML = "";
    spinResults.forEach((name, i) => {
      const item = document.createElement("div");
      item.className = "winner-item";
      item.innerHTML = `
        <span class="winner-rank">#${i + 1}</span>
        <span class="winner-name">${name}</span>
      `;
      winnerList.appendChild(item);
    });
  }

  addPlayerBtn.addEventListener("click", () => {
    players.push(`Player ${players.length + 1}`);
    renderPlayerInputs();
  });

  spinWheelBtn.addEventListener("click", () => {
    if (players.length > 0) {
      wheel.spin();
    }
  });

  clearWheelBtn.addEventListener("click", () => {
    location.reload(); // Quickest way to reset everything for the wheel
  });

  renderPlayerInputs();
}

document.addEventListener("DOMContentLoaded", () => {
  const tabs = initTabs();
  initWheelUI(tabs);
  initTeamPicker();
  initTournament();
});
