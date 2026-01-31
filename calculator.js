(function () {
  "use strict";

  // === CONFIGURATION ===
  const CONFIG = {
    storage: { prefix: "scc_calculator_" },
    inputIds: ["nameA", "nameB", "betsA", "betsB", "cut", "winner", "lookupBet"],
  };

  // === STATE ===
  const state = {
    nameA: "Fighter A",
    nameB: "Fighter B",
    betsA: 100,
    betsB: 150,
    cut: 0,
    winner: "A",
    lookupBet: 10,
  };

  // DOM element cache
  const dom = {};

  // === UTILITIES ===
  const utils = {
    formatTime: () => new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),

    storage: {
      key: (k) => CONFIG.storage.prefix + k,
      save(key, value) {
        try { localStorage.setItem(this.key(key), JSON.stringify(value)); }
        catch (e) { console.warn("Storage save failed:", e); }
      },
      load(key) {
        try { return JSON.parse(localStorage.getItem(this.key(key))); }
        catch { return null; }
      },
      clear() {
        Object.keys(localStorage)
          .filter(k => k.startsWith(CONFIG.storage.prefix))
          .forEach(k => localStorage.removeItem(k));
      },
    },

    num: (id) => Math.max(0, Number(dom[id]?.value) || 0),
  };

  // === CALCULATOR LOGIC ===
  function calculate() {
    const nameA = dom.nameA?.value.trim() || "Fighter A";
    const nameB = dom.nameB?.value.trim() || "Fighter B";
    const betsA = utils.num("betsA");
    const betsB = utils.num("betsB");
    const cut = utils.num("cut");
    const winner = dom.winner?.value || "A";

    // Update state
    Object.assign(state, { nameA, nameB, betsA, betsB, cut, winner });

    // Update dropdown labels
    if (dom.winner) {
      dom.winner.options[0].text = nameA;
      dom.winner.options[1].text = nameB;
    }

    // Calculate payouts
    const pool = betsA + betsB;
    const house = pool * (cut / 100);
    const payout = pool - house;
    const winBets = winner === "A" ? betsA : betsB;
    const per1 = winBets > 0 ? payout / winBets : 0;

    // Update output display
    if (dom.outPool) dom.outPool.textContent = pool.toFixed(0);
    if (dom.outHouse) dom.outHouse.textContent = house.toFixed(2);
    if (dom.outPayout) dom.outPayout.textContent = payout.toFixed(2);
    if (dom.outWinner) dom.outWinner.textContent = winner === "A" ? nameA : nameB;
    if (dom.outWinBets) dom.outWinBets.textContent = winBets.toFixed(0);
    if (dom.outPer1) dom.outPer1.textContent = winBets > 0 ? per1.toFixed(4) : "N/A";

    // Quick lookup calculation
    const lookupBet = utils.num("lookupBet");
    state.lookupBet = lookupBet;
    const lookupPayout = winBets > 0 ? (lookupBet * per1).toFixed(2) : "N/A";
    if (dom.lookupResult) dom.lookupResult.value = lookupPayout;

    // Save to storage
    saveState();
  }

  // === STATE PERSISTENCE ===
  function saveState() {
    utils.storage.save("state", state);
  }

  function loadState() {
    const saved = utils.storage.load("state");
    if (!saved) return;

    Object.assign(state, saved);

    // Restore input values
    if (dom.nameA) dom.nameA.value = state.nameA;
    if (dom.nameB) dom.nameB.value = state.nameB;
    if (dom.betsA) dom.betsA.value = state.betsA;
    if (dom.betsB) dom.betsB.value = state.betsB;
    if (dom.cut) dom.cut.value = state.cut;
    if (dom.winner) dom.winner.value = state.winner;
    if (dom.lookupBet) dom.lookupBet.value = state.lookupBet;
  }

  // === SYSTEM CLOCK ===
  function startSystemClock() {
    const update = () => {
      const el = document.getElementById("galacticTime");
      if (el) el.textContent = utils.formatTime();
    };
    update();
    setInterval(update, 1000);
  }

  // === EVENT SETUP ===
  function setupEventHandlers() {
    CONFIG.inputIds.forEach(id => {
      if (dom[id]) {
        dom[id].addEventListener("input", calculate);
      }
    });
  }

  // === INITIALIZATION ===
  function initialize() {
    // Cache DOM elements
    const domIds = [
      ...CONFIG.inputIds,
      "outPool", "outHouse", "outPayout", "outWinner", "outWinBets", "outPer1",
      "lookupResult", "galacticTime"
    ];
    domIds.forEach(id => dom[id] = document.getElementById(id));

    // Load saved state
    loadState();

    // Setup event handlers
    setupEventHandlers();

    // Start system clock
    startSystemClock();

    // Initial calculation
    calculate();
  }

  // === PUBLIC API ===
  window.SCC_CALCULATOR = {
    calculate,
    getState: () => ({ ...state }),
    reset() {
      Object.assign(state, {
        nameA: "Fighter A",
        nameB: "Fighter B",
        betsA: 100,
        betsB: 150,
        cut: 0,
        winner: "A",
        lookupBet: 10,
      });
      loadState(); // Will use defaults since we haven't saved yet
      calculate();
    },
    clearStorage: () => utils.storage.clear(),
  };

  // Start
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", initialize)
    : initialize();
})();
