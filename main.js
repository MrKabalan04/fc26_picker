// main.js
import { initTeamPicker } from "./teampicker.js";
import { initTournament } from "./tournament.js";

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

  setMode("picker");
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initTeamPicker();
  initTournament();
});
