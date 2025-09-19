(function () {
  "use strict";
  const PersonnelDashboard = {
    data: {
      personnelCount: 0,
      departments: {
        command: 0,
        security: 0,
        medical: 0,
        engineering: 0,
        science: 0,
        service: 0,
        operations: 0,
      },
    },
    initialize() {
      this.loadSavedData();
    },
    generateContent() {
      return `
        <div class="personnel-stats">
          <div class="personnel-stat-card">
            <div class="personnel-stat-value">${this.calculateTotalPersonnel()}</div>
            <div class="personnel-stat-label">Total Personnel</div>
          </div>
          <div class="personnel-stat-card">
            <div class="personnel-stat-value">${Object.keys(this.data.departments).length}</div>
            <div class="personnel-stat-label">Departments</div>
          </div>
        </div>
        
        <div class="manifest-section">
          <h4>Department Distribution</h4>
          <div class="dashboard-grid-4">
            ${Object.entries(this.data.departments)
              .map(
                ([dept, count]) => `
                  <div class="dashboard-field-group">
                    <label>${this.formatDepartmentName(dept)}</label>
                    <input 
                      type="number" 
                      id="personnel-dept-${dept}" 
                      value="${count}" 
                      min="0" 
                      max="99"
                      placeholder="Department count"
                    >
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `;
    },
    bindEvents(popup) {
      Object.keys(this.data.departments).forEach((dept) => {
        const deptInput = popup.querySelector(`#personnel-dept-${dept}`);
        if (deptInput) {
          deptInput.addEventListener("input", (e) => {
            this.data.departments[dept] = parseInt(e.target.value) || 0;
            this.data.personnelCount = this.calculateTotalPersonnel();
            this.saveData();
            this.updateStats(popup);
          });
        }
      });
    },
    updateStats(popup) {
      const statCards = popup.querySelectorAll(".personnel-stat-card");
      if (statCards.length >= 2) {
        statCards[0].querySelector(".personnel-stat-value").textContent =
          this.calculateTotalPersonnel();
      }
    },
    formatDepartmentName(dept) {
      return dept.charAt(0).toUpperCase() + dept.slice(1);
    },
    calculateTotalPersonnel() {
      return Object.values(this.data.departments).reduce((total, count) => total + count, 0);
    },
    saveData() {
      try {
        localStorage.setItem(
          "scc_personnel_data",
          JSON.stringify({
            data: this.data,
            timestamp: Date.now(),
            version: "3.0.0",
          }),
        );
      } catch (error) {
        console.warn("Personnel data save failed:", error);
      }
    },
    loadSavedData() {
      try {
        const saved = localStorage.getItem("scc_personnel_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.data) {
            this.data = { ...this.data, ...parsed.data };
            // Ensure personnel count is calculated from departments
            this.data.personnelCount = this.calculateTotalPersonnel();
          }
        }
      } catch (error) {
        console.warn("Personnel data load failed:", error);
      }
    },
    getData() {
      return { ...this.data };
    },
    updateData(newData) {
      this.data = { ...this.data, ...newData };
      this.data.personnelCount = this.calculateTotalPersonnel();
      this.saveData();
    },
    resetData() {
      this.data = {
        personnelCount: 0, // Will be calculated from departments
        departments: {
          command: 0,
          security: 0,
          medical: 0,
          engineering: 0,
          science: 0,
          service: 0,
          operations: 0,
        },
      };
      this.data.personnelCount = this.calculateTotalPersonnel();
      this.saveData();
    },
  };
  window.SCC_PERSONNEL = PersonnelDashboard;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      PersonnelDashboard.initialize(),
    );
  } else {
    PersonnelDashboard.initialize();
  }
})();
