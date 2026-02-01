(function () {
  "use strict";

  // === IMPORTS FROM SHARED MODULES ===
  const { utils, createStorageManager, createSystemClock, createDomCache } = window.SCC_SHARED;

  // === CONFIGURATION ===
  const CONFIG = {
    storage: { prefix: "scc_calculator_" },
    inputIds: ["nameA", "nameB", "cut", "winner", "lookupBet"],
  };

  // === STATE ===
  const state = {
    nameA: "Fighter A",
    nameB: "Fighter B",
    cut: 0,
    winner: "A",
    lookupBet: 10,
    bets: [], // Array of { id, bettor, fighter, amount }
    nextBetId: 1,
  };

  // Initialize storage manager
  const storage = createStorageManager(CONFIG.storage.prefix);

  // DOM element cache
  let dom = {};

  // === BET TABLE MANAGER CLASS ===
  class BetTableManager {
    constructor(tbodyElement, onRemoveBet) {
      this.tbody = tbodyElement;
      this.onRemove = onRemoveBet;
      
      // Single delegated event listener for all remove buttons
      if (this.tbody) {
        this.tbody.addEventListener("click", this.handleClick.bind(this));
      }
    }

    handleClick(e) {
      const btn = e.target.closest(".calc-remove-btn[data-bet-id]");
      if (btn) {
        const betId = Number(btn.dataset.betId);
        this.onRemove(betId);
      }
    }

    render(bets, nameA, nameB) {
      if (!this.tbody) return;

      if (bets.length === 0) {
        this.tbody.innerHTML = '<tr class="calc-empty-row"><td colspan="4">No bets recorded</td></tr>';
        return;
      }

      this.tbody.innerHTML = bets.map(bet => `
        <tr data-bet-id="${bet.id}">
          <td>${utils.escapeHtml(bet.bettor)}</td>
          <td class="${bet.fighter === 'A' ? 'fighter-a' : 'fighter-b'}">${bet.fighter === 'A' ? utils.escapeHtml(nameA) : utils.escapeHtml(nameB)}</td>
          <td class="amount">${bet.amount}</td>
          <td><button type="button" class="calc-remove-btn" data-bet-id="${bet.id}">✕</button></td>
        </tr>
      `).join("");
      // No need to attach individual listeners - delegation handles it
    }
  }

  // Bet table manager instance (initialized in initialize())
  let betTableManager = null;

  // === BET MANAGEMENT ===
  function addBet() {
    const bettor = dom.bettor?.value.trim();
    const fighter = dom.betFighter?.value || "A";
    const amount = Math.max(0, Number(dom.betAmount?.value) || 0);

    if (!bettor) {
      dom.bettor?.focus();
      return;
    }
    if (amount <= 0) {
      dom.betAmount?.focus();
      return;
    }

    state.bets.push({
      id: state.nextBetId++,
      bettor,
      fighter,
      amount,
    });

    // Clear input and refocus
    if (dom.bettor) dom.bettor.value = "";
    if (dom.betAmount) dom.betAmount.value = "10";
    dom.bettor?.focus();

    renderBetTable();
    calculate();
    saveState();
  }

  function removeBet(betId) {
    state.bets = state.bets.filter(b => b.id !== betId);
    renderBetTable();
    calculate();
    saveState();
  }

  function clearAllBets() {
    if (state.bets.length === 0) return;
    state.bets = [];
    state.nextBetId = 1;
    renderBetTable();
    calculate();
    saveState();
  }

  function renderBetTable() {
    const nameA = dom.nameA?.value.trim() || "Fighter A";
    const nameB = dom.nameB?.value.trim() || "Fighter B";
    betTableManager?.render(state.bets, nameA, nameB);
  }

  // === CALCULATOR LOGIC ===
  function calculate() {
    const nameA = dom.nameA?.value.trim() || "Fighter A";
    const nameB = dom.nameB?.value.trim() || "Fighter B";
    const cut = utils.numFromElement(dom.cut);
    const winner = dom.winner?.value || "A";

    // Calculate totals from bets
    const betsA = state.bets.filter(b => b.fighter === "A").reduce((sum, b) => sum + b.amount, 0);
    const betsB = state.bets.filter(b => b.fighter === "B").reduce((sum, b) => sum + b.amount, 0);

    // Update state
    Object.assign(state, { nameA, nameB, cut, winner });

    // Update dropdown labels
    if (dom.winner) {
      dom.winner.options[0].text = nameA;
      dom.winner.options[1].text = nameB;
    }
    if (dom.betFighter) {
      dom.betFighter.options[0].text = nameA;
      dom.betFighter.options[1].text = nameB;
    }

    // Update totals display
    if (dom.totalA) dom.totalA.textContent = betsA;
    if (dom.totalB) dom.totalB.textContent = betsB;
    if (dom.totalALabel) dom.totalALabel.textContent = nameA;
    if (dom.totalBLabel) dom.totalBLabel.textContent = nameB;

    // Calculate payouts
    const pool = betsA + betsB;
    const house = pool * (cut / 100);
    const payout = pool - house;
    const winBets = winner === "A" ? betsA : betsB;
    const per1 = winBets > 0 ? payout / winBets : 0;

    // Calculate moneyline odds
    const oddsA = calculateMoneyline(betsA, betsB, payout);
    const oddsB = calculateMoneyline(betsB, betsA, payout);

    // Update odds display
    if (dom.oddsNameA) dom.oddsNameA.textContent = nameA;
    if (dom.oddsNameB) dom.oddsNameB.textContent = nameB;
    if (dom.oddsA) {
      dom.oddsA.textContent = oddsA;
      dom.oddsA.className = "calc-odds-value " + getOddsClass(oddsA);
    }
    if (dom.oddsB) {
      dom.oddsB.textContent = oddsB;
      dom.oddsB.className = "calc-odds-value " + getOddsClass(oddsB);
    }

    // Update output display
    if (dom.outPool) dom.outPool.textContent = pool.toFixed(0);
    if (dom.outHouse) dom.outHouse.textContent = house.toFixed(2);
    if (dom.outPayout) dom.outPayout.textContent = payout.toFixed(2);
    if (dom.outWinner) dom.outWinner.textContent = winner === "A" ? nameA : nameB;
    if (dom.outWinBets) dom.outWinBets.textContent = winBets.toFixed(0);
    if (dom.outPer1) dom.outPer1.textContent = winBets > 0 ? per1.toFixed(4) : "N/A";

    // Quick lookup calculation
    const lookupBet = utils.numFromElement(dom.lookupBet);
    state.lookupBet = lookupBet;
    const lookupPayout = winBets > 0 ? (lookupBet * per1).toFixed(2) : "N/A";
    if (dom.lookupResult) dom.lookupResult.value = lookupPayout;

    // Update bet table fighter names
    renderBetTable();
  }

  // Calculate American moneyline odds
  function calculateMoneyline(myBets, theirBets, payoutPool) {
    if (myBets <= 0 || payoutPool <= 0) return "-";
    
    // Decimal odds = what you get back per 1 unit bet (including stake)
    const decimalOdds = payoutPool / myBets;
    
    if (decimalOdds >= 2.0) {
      // Underdog: positive moneyline
      const ml = Math.round((decimalOdds - 1) * 100);
      return "+" + ml;
    } else if (decimalOdds > 1.0) {
      // Favorite: negative moneyline
      const ml = Math.round(-100 / (decimalOdds - 1));
      return ml.toString();
    } else {
      return "-";
    }
  }

  function getOddsClass(odds) {
    if (odds === "-") return "";
    return odds.startsWith("+") ? "odds-underdog" : "odds-favorite";
  }

  // === STATE PERSISTENCE ===
  function saveState() {
    storage.save("state", {
      nameA: state.nameA,
      nameB: state.nameB,
      cut: state.cut,
      winner: state.winner,
      lookupBet: state.lookupBet,
      bets: state.bets,
      nextBetId: state.nextBetId,
    });
  }

  function loadState() {
    const saved = storage.load("state");
    if (!saved) return;

    Object.assign(state, saved);

    // Restore input values
    if (dom.nameA) dom.nameA.value = state.nameA;
    if (dom.nameB) dom.nameB.value = state.nameB;
    if (dom.cut) dom.cut.value = state.cut;
    if (dom.winner) dom.winner.value = state.winner;
    if (dom.lookupBet) dom.lookupBet.value = state.lookupBet;
  }

  // === EVENT SETUP ===
  function setupEventHandlers() {
    // Input change handlers for calculator fields
    CONFIG.inputIds.forEach(id => {
      if (dom[id]) {
        dom[id].addEventListener("input", calculate);
      }
    });

    // Add bet button
    dom.addBet?.addEventListener("click", addBet);

    // New round button
    dom.newRound?.addEventListener("click", clearAllBets);

    // Enter key in bet inputs
    ["bettor", "betAmount"].forEach(id => {
      dom[id]?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addBet();
        }
      });
    });
  }

  // === INITIALIZATION ===
  function initialize() {
    // Cache DOM elements
    const domIds = [
      ...CONFIG.inputIds,
      "outPool", "outHouse", "outPayout", "outWinner", "outWinBets", "outPer1",
      "lookupResult", "galacticTime",
      "bettor", "betFighter", "betAmount", "addBet", "newRound",
      "betTableBody", "totalA", "totalB", "totalALabel", "totalBLabel",
      "oddsA", "oddsB", "oddsNameA", "oddsNameB"
    ];
    dom = createDomCache(domIds);

    // Initialize bet table manager with delegation
    betTableManager = new BetTableManager(dom.betTableBody, removeBet);

    // Load saved state
    loadState();

    // Setup event handlers
    setupEventHandlers();

    // Start system clock
    createSystemClock("galacticTime");

    // Initial render and calculation
    renderBetTable();
    calculate();
  }

  // === PUBLIC API ===
  window.SCC_CALCULATOR = {
    calculate,
    addBet,
    removeBet,
    clearAllBets,
    getBets: () => [...state.bets],
    getState: () => ({ ...state }),
    reset() {
      Object.assign(state, {
        nameA: "Fighter A",
        nameB: "Fighter B",
        cut: 0,
        winner: "A",
        lookupBet: 10,
        bets: [],
        nextBetId: 1,
      });
      if (dom.nameA) dom.nameA.value = state.nameA;
      if (dom.nameB) dom.nameB.value = state.nameB;
      if (dom.cut) dom.cut.value = state.cut;
      if (dom.winner) dom.winner.value = state.winner;
      if (dom.lookupBet) dom.lookupBet.value = state.lookupBet;
      renderBetTable();
      calculate();
      saveState();
    },
    clearStorage: () => storage.clear(),
  };

  // Start
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", initialize)
    : initialize();
})();
