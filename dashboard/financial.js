(function () {
  "use strict";
  const FinancialDashboard = {
    data: {
      treasuryBalance: 0,
      accounts: {
        serviceDepartment: 0,
        operationsDepartment: 0,
        bridgeOperations: 0,
        emergencyReserve: 0,
        researchGrants: 0,
        maintenanceBudget: 0,
        securityAllocation: 0,
        medicalSupplies: 0,
      },
      monthlyBudget: 0,
      spending: {
        personnel: 0,
        operations: 0,
        maintenance: 0,
        research: 0,
        emergency: 0,
      },
    },
    initialize() {
      this.loadSavedData();
      this.calculateTotals();
    },
    generateContent() {
      const totalAssets = this.calculateTotalAssets();
      const monthlySpending = Object.values(this.data.spending).reduce(
        (sum, val) => sum + val,
        0,
      );
      return `
 <div class="personnel-stats">
 <div class="personnel-stat-card">
 <div class="personnel-stat-label">Total Assets</div>
 <div class="personnel-stat-value">${this.formatCurrency(totalAssets)}</div>
 </div>
 <div class="personnel-stat-card">
 <div class="personnel-stat-label">Treasury Balance</div>
 <div class="personnel-stat-value">${this.formatCurrency(this.data.treasuryBalance)}</div>
 </div>
 </div>
 <div class="dashboard-grid-3">
 <div class="dashboard-field-group">
 <label>Treasury Balance</label>
 <div class="dashboard-currency-input">
 <input type="number" 
 id="financial-treasury-balance" 
 value="${this.data.treasuryBalance}" 
 min="0" 
 step="100"
 placeholder="Treasury balance">
 <span class="dashboard-currency-symbol">cr</span>
 </div>
 </div>
 <div class="dashboard-field-group">
 <label>Monthly Budget</label>
 <div class="dashboard-currency-input">
 <input type="number" 
 id="financial-monthly-budget" 
 value="${this.data.monthlyBudget}" 
 min="0" 
 step="1000"
 placeholder="Monthly budget">
 <span class="dashboard-currency-symbol">cr</span>
 </div>
 </div>
 </div>
 <div class="manifest-section">
 <h4>Department Accounts</h4>
 <div class="dashboard-grid-4">
 ${Object.entries(this.data.accounts)
   .map(
     ([
       account,
       balance,
     ]) => `<div class="financial-account"><span class="financial-account-label">${this.formatAccountName(account)}</span><div class="dashboard-currency-input"><input type="number" 
 id="financial-account-${account}" 
 value="${balance}" 
 min="0" 
 step="100"
 style="width: 100px; text-align: right; background: transparent; border: 1px solid transparent; padding: 2px 4px;"><span class="dashboard-currency-symbol">cr</span></div></div>`,
   )
   .join("")}
 </div>
 </div>
 <div class="manifest-section">
 <h4>Spending Categories</h4>
 <div class="dashboard-grid-3">
 ${Object.entries(this.data.spending)
   .map(
     ([
       category,
       amount,
     ]) => `<div class="dashboard-field-group"><label>${this.formatCategoryName(category)}</label><div class="dashboard-currency-input"><input type="number" 
 id="financial-spending-${category}" 
 value="${amount}" 
 min="0" 
 step="1000"
 placeholder="${category} spending"><span class="dashboard-currency-symbol">cr</span></div></div>`,
   )
   .join("")}
 </div>
 </div>
 `;
    },
    bindEvents(popup) {
      const treasuryInput = popup.querySelector("#financial-treasury-balance");
      if (treasuryInput) {
        treasuryInput.addEventListener("input", (e) => {
          this.data.treasuryBalance = parseInt(e.target.value) || 0;
          this.saveData();
          this.updateStats(popup);
        });
      }
      const budgetInput = popup.querySelector("#financial-monthly-budget");
      if (budgetInput) {
        budgetInput.addEventListener("input", (e) => {
          this.data.monthlyBudget = parseInt(e.target.value) || 0;
          this.saveData();
          this.updateStats(popup);
        });
      }
      Object.keys(this.data.accounts).forEach((account) => {
        const accountInput = popup.querySelector(
          `#financial-account-${account}`,
        );
        if (accountInput) {
          accountInput.addEventListener("input", (e) => {
            this.data.accounts[account] = parseInt(e.target.value) || 0;
            this.saveData();
            this.updateStats(popup);
          });
        }
      });
      Object.keys(this.data.spending).forEach((category) => {
        const categoryInput = popup.querySelector(
          `#financial-spending-${category}`,
        );
        if (categoryInput) {
          categoryInput.addEventListener("input", (e) => {
            this.data.spending[category] = parseInt(e.target.value) || 0;
            this.saveData();
            this.updateStats(popup);
          });
        }
      });
    },
    updateStats(popup) {
      const totalAssets = this.calculateTotalAssets();
      const statCards = popup.querySelectorAll(".personnel-stat-card");
      if (statCards.length >= 2) {
        statCards[0].querySelector(".personnel-stat-value").textContent =
          this.formatCurrency(totalAssets);
        statCards[1].querySelector(".personnel-stat-value").textContent =
          this.formatCurrency(this.data.treasuryBalance);
      }
    },
    calculateTotalAssets() {
      const accountTotal = Object.values(this.data.accounts).reduce(
        (sum, balance) => sum + balance,
        0,
      );
      return this.data.treasuryBalance + accountTotal;
    },
    formatCurrency(amount) {
      if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + "M";
      }
      if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + "K";
      }
      return amount.toLocaleString();
    },
    formatAccountName(account) {
      return account
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    },
    formatCategoryName(category) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    },
    saveData() {
      try {
        localStorage.setItem(
          "scc_financial_data",
          JSON.stringify({
            data: this.data,
            timestamp: Date.now(),
            version: "3.0.0",
          }),
        );
      } catch (error) {
        console.warn("Financial data save failed:", error);
      }
    },
    loadSavedData() {
      try {
        const saved = localStorage.getItem("scc_financial_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.data) {
            this.data = { ...this.data, ...parsed.data };
          }
        }
      } catch (error) {
        console.warn("Financial data load failed:", error);
      }
    },
    calculateTotals() {
      this.calculateTotalAssets();
    },
    getData() {
      return { ...this.data };
    },
    updateData(newData) {
      this.data = { ...this.data, ...newData };
      this.calculateTotals();
      this.saveData();
    },
    resetData() {
      this.data = {
        treasuryBalance: 0,
        accounts: {
          serviceDepartment: 0,
          operationsDepartment: 0,
          bridgeOperations: 0,
          emergencyReserve: 0,
          researchGrants: 0,
          maintenanceBudget: 0,
          securityAllocation: 0,
          medicalSupplies: 0,
        },
        monthlyBudget: 0,
        spending: {
          personnel: 0,
          operations: 0,
          maintenance: 0,
          research: 0,
          emergency: 0,
        },
      };
      this.calculateTotals();
      this.saveData();
    },
  };
  window.SCC_FINANCIAL = FinancialDashboard;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      FinancialDashboard.initialize(),
    );
  } else {
    FinancialDashboard.initialize();
  }
})();
