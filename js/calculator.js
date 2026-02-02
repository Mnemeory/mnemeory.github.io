(function () {
  "use strict";

  // === IMPORTS FROM SHARED MODULES ===
  const { utils, createStorageManager, createSystemClock, createDomCache } = window.SCC_SHARED;

  // === CONFIGURATION ===
  const CONFIG = {
    storage: { prefix: "scc_calculator_" },
    inputIds: ["nameA", "nameB", "cut", "winner", "lookupBet", "roundNum"],
  };

  // === STATE ===
  const state = {
    roundNum: 1,
    nameA: "Fighter A",
    nameB: "Fighter B",
    cut: 0,
    winner: "",
    lookupBet: 10,
    bets: [], // Array of { id, bettor, fighter, amount }
    nextBetId: 1,
    event: { location: "", clerk: "", firstBell: "", betClose: "", serviceLead: "" },
    savedRounds: [],
  };

  const storage = createStorageManager(CONFIG.storage.prefix);

  let dom = {};

  // === BET TABLE MANAGER CLASS ===
  class BetTableManager {
    constructor(tbodyElement, onRemoveBet) {
      this.tbody = tbodyElement;
      this.onRemove = onRemoveBet;
      
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
    }
  }

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
    const winner = dom.winner?.value || "";
    const roundNum = Number(dom.roundNum?.value) || 1;

    const betsA = state.bets.filter(b => b.fighter === "A").reduce((sum, b) => sum + b.amount, 0);
    const betsB = state.bets.filter(b => b.fighter === "B").reduce((sum, b) => sum + b.amount, 0);

    Object.assign(state, { nameA, nameB, cut, winner, roundNum });

    if (dom.winner) {
      dom.winner.options[1].text = nameA;
      dom.winner.options[2].text = nameB;
    }
    if (dom.betFighter) {
      dom.betFighter.options[0].text = nameA;
      dom.betFighter.options[1].text = nameB;
    }

    if (dom.totalA) dom.totalA.textContent = betsA;
    if (dom.totalB) dom.totalB.textContent = betsB;
    if (dom.totalALabel) dom.totalALabel.textContent = nameA;
    if (dom.totalBLabel) dom.totalBLabel.textContent = nameB;

    const pool = betsA + betsB;
    const house = pool * (cut / 100);
    const payout = pool - house;
    const winBets = winner === "A" ? betsA : winner === "B" ? betsB : 0;
    const per1 = winBets > 0 ? payout / winBets : 0;

    const oddsA = calculateMoneyline(betsA, betsB, payout);
    const oddsB = calculateMoneyline(betsB, betsA, payout);

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

    if (dom.outPool) dom.outPool.textContent = pool.toFixed(0);
    if (dom.outHouse) dom.outHouse.textContent = house.toFixed(2);
    if (dom.outPayout) dom.outPayout.textContent = payout.toFixed(2);
    if (dom.outWinner) dom.outWinner.textContent = winner === "A" ? nameA : winner === "B" ? nameB : "—";
    if (dom.outWinBets) dom.outWinBets.textContent = winner ? winBets.toFixed(0) : "—";
    if (dom.outPer1) dom.outPer1.textContent = winner && winBets > 0 ? per1.toFixed(4) : "—";

    const lookupBet = utils.numFromElement(dom.lookupBet);
    state.lookupBet = lookupBet;
    if (dom.lookupResult) dom.lookupResult.value = winner && winBets > 0 ? (lookupBet * per1).toFixed(2) : "—";

    renderBetTable();
  }

  function calculateMoneyline(myBets, theirBets, payoutPool) {
    if (myBets <= 0 || payoutPool <= 0) return "-";
    
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

  // === EVENT CONFIGURATION ===
  function syncEventConfig() {
    state.event = {
      location: dom.eventLocation?.value.trim() || "",
      clerk: dom.eventClerk?.value.trim() || "",
      firstBell: dom.eventFirstBell?.value.trim() || "",
      betClose: dom.eventBetClose?.value.trim() || "",
      serviceLead: dom.eventServiceLead?.value.trim() || "",
    };
  }

  // === EXPORT: ROUND SNAPSHOT ===
  function generateSnapshot() {
    syncEventConfig();
    const { roundNum, nameA, nameB, cut, bets, event } = state;
    const betsA = bets.filter(b => b.fighter === "A").reduce((s, b) => s + b.amount, 0);
    const betsB = bets.filter(b => b.fighter === "B").reduce((s, b) => s + b.amount, 0);
    const pool = betsA + betsB;
    const payout = pool - pool * (cut / 100);
    const oddsA = calculateMoneyline(betsA, betsB, payout);
    const oddsB = calculateMoneyline(betsB, betsA, payout);

    const betRows = bets.length > 0
      ? bets.map(b => `[row][cell]${b.bettor}[cell]${b.fighter === "A" ? nameA : nameB}[cell]${b.amount} cr`).join("\n")
      : "[row][cell]—[cell]No bets[cell]—";

    return `[center][logo_scc_small]
[b]SCCV HORIZON FIGHT NIGHT[/b]
[b]ROUND ${roundNum} — ${nameA} vs ${nameB}[/b]
[small]${event.location ? `Location: ${event.location} | ` : ""}Posted: ${utils.formatTime()}[/small]
[/center]
[hr]
[b]MONEYLINE ODDS[/b]
[table][row][cell]${nameA}[cell]${oddsA}
[row][cell]${nameB}[cell]${oddsB}[/table]

[b]BET LOG[/b]
[table][row][cell][b]Bettor[/b][cell][b]Fighter[/b][cell][b]Wager[/b]
${betRows}
[/table]

[b]POOL STATUS[/b]
[table][row][cell]${nameA} Total:[cell]${betsA} cr
[row][cell]${nameB} Total:[cell]${betsB} cr
[row][cell][b]Combined Pool:[/b][cell][b]${pool} cr[/b][/table]
[hr]
[small]House Cut: ${cut}%${event.clerk ? ` | Clerk: ${event.clerk}` : ""}[/small]`;
  }

  // === EXPORT: COVER SHEET ===
  function generateCoverSheet() {
    syncEventConfig();
    const { event, savedRounds } = state;
    const totals = savedRounds.reduce((t, r) => ({
      stakes: t.stakes + r.pool,
      paid: t.paid + r.paidOut,
      house: t.house + r.houseTake
    }), { stakes: 0, paid: 0, house: 0 });

    const roundRows = [];
    for (let i = 0; i < 6; i++) {
      const r = savedRounds[i];
      roundRows.push(r
        ? `[row][cell]${r.roundNum}[cell]${r.nameA}[cell]${r.nameB}[cell]${r.oddsA} / ${r.oddsB}[cell]${r.winner || "—"}[cell]${r.initials || "—"}`
        : `[row][cell]${i + 1}[cell][cell][cell][cell][cell]`);
    }

    return `[center][logo_scc_small]
[b]SCCV HORIZON[/b]
[b]SERVICE DEPARTMENT — FIGHT NIGHT[/b]
[i]"The Unbreakable Chainlink, Holding the Spur Together."[/i]
[hr]
[b]BETTING CONTROL SHEET[/b]
[/center]
[small][table][row][cell][b]Event Date:[/b] ${utils.formatDate()}[cell][b]Location:[/b] ${event.location || "—"}
[row][cell][b]First Bell:[/b] ${event.firstBell || "—"}[cell][b]Bet Close:[/b] ${event.betClose || "—"}
[row][cell][b]Clerk/Bookie:[/b] ${event.clerk || "—"}[cell][b]Service Lead:[/b] ${event.serviceLead || "—"}
[/table]

[center][b]ROUNDS — POSTED ODDS & RESULTS[/b][/center]
[table][row][cell][b]#[/b][cell][b]Fighter A[/b][cell][b]Fighter B[/b][cell][b]Odds (A/B)[/b][cell][b]Winner[/b][cell][b]Initials[/b]
${roundRows.join("\n")}
[/table]

[center][b]TOTALS & PAYOUT CONFIRMATION[/b][/center]
[table][row][cell][b]Total Stakes (cr):[/b] ${totals.stakes}[cell][b]Total Paid Out (cr):[/b] ${totals.paid.toFixed(2)}
[row][cell][b]House Net (+/-):[/b] ${totals.house.toFixed(2)}[cell][b]Rounds Completed:[/b] ${savedRounds.length}
[/table]
[hr][/small]`;
  }

  // === ROUND MANAGEMENT ===
  function saveRound() {
    syncEventConfig();
    if (state.bets.length === 0) {
      alert("No bets to save.");
      return;
    }
    if (!state.winner) {
      alert("Select a winner before saving.");
      return;
    }

    const { roundNum, nameA, nameB, cut, winner, bets } = state;
    const betsA = bets.filter(b => b.fighter === "A").reduce((s, b) => s + b.amount, 0);
    const betsB = bets.filter(b => b.fighter === "B").reduce((s, b) => s + b.amount, 0);
    const pool = betsA + betsB;
    const houseTake = pool * (cut / 100);
    const payout = pool - houseTake;
    const winBets = winner === "A" ? betsA : betsB;
    const paidOut = winBets > 0 ? payout : 0;

    state.savedRounds.push({
      roundNum,
      nameA,
      nameB,
      oddsA: calculateMoneyline(betsA, betsB, payout),
      oddsB: calculateMoneyline(betsB, betsA, payout),
      winner: winner === "A" ? nameA : nameB,
      pool,
      houseTake,
      paidOut,
      bets: [...bets],
      initials: "",
    });

    updateRoundHistory();

    state.roundNum++;
    state.bets = [];
    state.nextBetId = 1;
    state.winner = "";
    if (dom.roundNum) dom.roundNum.value = state.roundNum;
    if (dom.nameA) dom.nameA.value = "Fighter A";
    if (dom.nameB) dom.nameB.value = "Fighter B";
    if (dom.winner) dom.winner.value = "";
    renderBetTable();
    calculate();
    saveState();
    flashBtn(dom.saveRound, "Saved!");
  }

  function clearEvent() {
    if (state.savedRounds.length > 0 && !confirm("Clear all saved rounds?")) return;
    state.savedRounds = [];
    state.roundNum = 1;
    if (dom.roundNum) dom.roundNum.value = 1;
    updateRoundHistory();
    saveState();
  }

  function updateRoundHistory() {
    if (dom.savedCount) dom.savedCount.textContent = state.savedRounds.length;
    if (dom.savedList) dom.savedList.textContent = state.savedRounds.map(r => `R${r.roundNum}`).join(", ");
  }

  // === CLIPBOARD UTILITIES ===
  async function copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = Object.assign(document.createElement("textarea"), {
        value: text,
        style: "position:fixed;opacity:0"
      });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    flashBtn(btn, "Copied!");
  }

  function flashBtn(btn, msg) {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.style.color = "var(--state-success)";
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = "";
    }, 1500);
  }

  // === COLLAPSIBLE SECTIONS ===
  function setupCollapsibles() {
    document.querySelectorAll(".calc-toggle").forEach(toggle => {
      toggle.addEventListener("click", () => {
        const target = document.getElementById(toggle.dataset.target);
        if (target) {
          const collapsed = target.classList.toggle("collapsed");
          const titleEl = toggle.querySelector(".calc-section-title");
          if (titleEl) titleEl.textContent = (collapsed ? "▸" : "▾") + " Event Configuration";
          const hint = toggle.querySelector(".calc-collapse-hint");
          if (hint) hint.textContent = collapsed ? "click to expand" : "click to collapse";
        }
      });
    });
  }

  // === STATE PERSISTENCE ===
  function saveState() {
    storage.save("state", {
      roundNum: state.roundNum,
      nameA: state.nameA,
      nameB: state.nameB,
      cut: state.cut,
      winner: state.winner,
      lookupBet: state.lookupBet,
      bets: state.bets,
      nextBetId: state.nextBetId,
      event: state.event,
      savedRounds: state.savedRounds,
    });
  }

  function loadState() {
    const saved = storage.load("state");
    if (!saved) return;

    Object.assign(state, saved);

    if (dom.roundNum) dom.roundNum.value = state.roundNum;
    if (dom.nameA) dom.nameA.value = state.nameA;
    if (dom.nameB) dom.nameB.value = state.nameB;
    if (dom.cut) dom.cut.value = state.cut;
    if (dom.winner) dom.winner.value = state.winner;
    if (dom.lookupBet) dom.lookupBet.value = state.lookupBet;

    if (dom.eventLocation) dom.eventLocation.value = state.event?.location || "";
    if (dom.eventClerk) dom.eventClerk.value = state.event?.clerk || "";
    if (dom.eventFirstBell) dom.eventFirstBell.value = state.event?.firstBell || "";
    if (dom.eventBetClose) dom.eventBetClose.value = state.event?.betClose || "";
    if (dom.eventServiceLead) dom.eventServiceLead.value = state.event?.serviceLead || "";
  }

  // === EVENT SETUP ===
  function setupEventHandlers() {
    CONFIG.inputIds.forEach(id => {
      if (dom[id]) {
        dom[id].addEventListener("input", calculate);
      }
    });

    dom.addBet?.addEventListener("click", addBet);

    dom.newRound?.addEventListener("click", clearAllBets);

    ["bettor", "betAmount"].forEach(id => {
      dom[id]?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addBet();
        }
      });
    });

    dom.exportSnapshot?.addEventListener("click", () => copyToClipboard(generateSnapshot(), dom.exportSnapshot));
    dom.exportCover?.addEventListener("click", () => copyToClipboard(generateCoverSheet(), dom.exportCover));

    dom.saveRound?.addEventListener("click", saveRound);
    dom.clearEvent?.addEventListener("click", clearEvent);
  }

  // === INITIALIZATION ===
  function initialize() {
    const domIds = [
      ...CONFIG.inputIds,
      "outPool", "outHouse", "outPayout", "outWinner", "outWinBets", "outPer1",
      "lookupResult", "galacticTime",
      "bettor", "betFighter", "betAmount", "addBet", "newRound",
      "betTableBody", "totalA", "totalB", "totalALabel", "totalBLabel",
      "oddsA", "oddsB", "oddsNameA", "oddsNameB",
      "eventLocation", "eventClerk", "eventFirstBell", "eventBetClose", "eventServiceLead",
      "exportSnapshot", "exportCover", "saveRound", "clearEvent",
      "savedCount", "savedList"
    ];
    dom = createDomCache(domIds);

    betTableManager = new BetTableManager(dom.betTableBody, removeBet);

    setupCollapsibles();

    loadState();

    setupEventHandlers();

    createSystemClock("galacticTime");

    updateRoundHistory();

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
        roundNum: 1,
        nameA: "Fighter A",
        nameB: "Fighter B",
        cut: 0,
        winner: "",
        lookupBet: 10,
        bets: [],
        nextBetId: 1,
        event: { location: "", clerk: "", firstBell: "", betClose: "", serviceLead: "" },
        savedRounds: [],
      });
      if (dom.roundNum) dom.roundNum.value = state.roundNum;
      if (dom.nameA) dom.nameA.value = state.nameA;
      if (dom.nameB) dom.nameB.value = state.nameB;
      if (dom.cut) dom.cut.value = state.cut;
      if (dom.winner) dom.winner.value = state.winner;
      if (dom.lookupBet) dom.lookupBet.value = state.lookupBet;
      if (dom.eventLocation) dom.eventLocation.value = "";
      if (dom.eventClerk) dom.eventClerk.value = "";
      if (dom.eventFirstBell) dom.eventFirstBell.value = "";
      if (dom.eventBetClose) dom.eventBetClose.value = "";
      if (dom.eventServiceLead) dom.eventServiceLead.value = "";
      updateRoundHistory();
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
