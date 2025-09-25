(function () {
  "use strict";
  const OperationsDashboard = {
    data: {
      accessRequests: 0,
      reassignments: 0,
      bridgeCrew: 0,
      serviceStaff: 0,
      alertLevel: "Green",
      systemsStatus: {
        lifeSupportSystems: "Nominal",
        powerGrid: "Nominal",
        communicationsArray: "Nominal",
        navigationSystems: "Nominal",
        defensiveSystems: "Nominal",
        emergencySystems: "Nominal",
      },
      ianStatus: "",
    },
    alertLevels: {
      Green: {
        color: "#10b981",
        description: "Normal operations",
        restrictions: "None",
      },
      Blue: {
        color: "#3b82f6",
        description: "Elevated awareness",
        restrictions: "Restricted access to sensitive areas",
      },
      Yellow: {
        color: "#f59e0b",
        description: "Potential threat detected",
        restrictions: "Security teams on standby",
      },
      Red: {
        color: "#ef4444",
        description: "Confirmed threat",
        restrictions: "Emergency protocols active",
      },
      Delta: {
        color: "#8b5cf6",
        description: "Vessel-wide emergency",
        restrictions: "All personnel report to emergency stations",
      },
    },
    initialize() {
      this.loadSavedData();
    },
    generateContent() {
      const totalSystemsOperational = Object.values(
        this.data.systemsStatus,
      ).filter(
        (status) => status === "Nominal",
      ).length;
      const totalSystems = Object.keys(this.data.systemsStatus).length;
      const systemsHealth = Math.round(
        (totalSystemsOperational / totalSystems) * 100,
      );
      return `
 <div class="personnel-stats">
 <div class="personnel-stat-card">
 <div class="personnel-stat-value alert-level-${this.data.alertLevel.toLowerCase()}">${this.data.alertLevel}</div>
 <div class="personnel-stat-label">Alert Level</div>
 </div>
 <div class="personnel-stat-card">
 <div class="personnel-stat-value">${systemsHealth}%</div>
 <div class="personnel-stat-label">Systems Health</div>
 </div>
 </div>
 <div class="dashboard-grid-4">
 <div class="dashboard-field-group">
 <label>Access Requests</label>
 <input type="number" 
 id="operations-access-requests" 
 value="${this.data.accessRequests}" 
 min="0" 
 max="99"
 placeholder="Pending access requests">
 </div>
 <div class="dashboard-field-group">
 <label>Reassignments</label>
 <input type="number" 
 id="operations-reassignments" 
 value="${this.data.reassignments}" 
 min="0" 
 max="99"
 placeholder="Personnel reassignments">
 </div>
 <div class="dashboard-field-group">
 <label>Bridge Crew</label>
 <input type="number" 
 id="operations-bridge-crew" 
 value="${this.data.bridgeCrew}" 
 min="0" 
 max="20"
 placeholder="Active bridge personnel">
 </div>
 <div class="dashboard-field-group">
 <label>Service Staff</label>
 <input type="number" 
 id="operations-service-staff" 
 value="${this.data.serviceStaff}" 
 min="0" 
 max="50"
 placeholder="Service staff count">
 </div>
 </div>
 <div class="manifest-section">
 <h4>Alert Level & Systems</h4>
 <div class="dashboard-grid-2">
 <div class="dashboard-field-group">
 <label>Current Alert Level</label>
 <select id="operations-alert-level">
 ${Object.entries(this.alertLevels)
   .map(
     ([level, config]) =>
       `<option value="${level}" ${this.data.alertLevel === level ? "selected" : ""}style="color: ${config.color};">${level}-${config.description}</option>`,
   )
   .join("")}
 </select>
 <div class="alert-info" style="margin-top: 8px; padding: 8px; background: var(--glass-secondary); border-radius: 4px;">
 <div style="color: var(--cyan-primary); font-weight: 600; font-size: 0.75rem;">Restrictions:</div>
 <div style="color: var(--neutral-dark); font-size: 0.75rem;">${this.alertLevels[this.data.alertLevel]?.restrictions || "None"}</div>
 </div>
 </div>
 <div class="operations-status">
 ${Object.entries(this.data.systemsStatus)
   .map(
     ([system, status]) =>
       `<div class="operations-metric clickable-system" data-system="${system}" onclick="window.SCC_OPERATIONS.cycleSystemStatus('${system}')"><div class="operations-metric-label">${this.getSystemIdentifier(system)}</div><div class="operations-metric-value ${this.getStatusClass(status)}">${status}</div></div>`,
   )
   .join("")}
 </div>
 </div>
 </div>
 <div class="manifest-section">
 <h4>Special Operations</h4>
 <div class="ian-status" onclick="window.SCC_OPERATIONS.toggleIanStatus()">
 <div>Ian the Corgi Status: ${this.data.ianStatus}</div>
 </div>
 </div>
 `;
    },
    getSystemIdentifier(system) {
      const identifiers = {
        lifeSupportSystems: "LIFE_SUP",
        powerGrid: "PWR_GRID",
        communicationsArray: "COMM_ARY",
        navigationSystems: "NAV_SYS",
        defensiveSystems: "DEF_SYS",
        emergencySystems: "EMRG_SYS",
      };
      return identifiers[system] || "SYS_UNK";
    },
    getStatusClass(status) {
      const classes = {
        OPTIMAL: "alert-level-green",
        OPERATIONAL: "alert-level-green",
        STANDBY: "alert-level-blue",
        READY: "alert-level-blue",
        MAINTENANCE: "alert-level-yellow",
        WARNING: "alert-level-yellow",
        CRITICAL: "alert-level-red",
        OFFLINE: "alert-level-red",
      };
      return classes[status] || "";
    },
    formatSystemName(system) {
      return system
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    },
    bindEvents(popup) {
      const accessInput = popup.querySelector("#operations-access-requests");
      if (accessInput) {
        accessInput.addEventListener("input", (e) => {
          this.data.accessRequests = parseInt(e.target.value) || 0;
          this.saveData();
        });
      }
      const reassignInput = popup.querySelector("#operations-reassignments");
      if (reassignInput) {
        reassignInput.addEventListener("input", (e) => {
          this.data.reassignments = parseInt(e.target.value) || 0;
          this.saveData();
        });
      }
      const bridgeInput = popup.querySelector("#operations-bridge-crew");
      if (bridgeInput) {
        bridgeInput.addEventListener("input", (e) => {
          this.data.bridgeCrew = parseInt(e.target.value) || 0;
          this.saveData();
        });
      }
      const serviceInput = popup.querySelector("#operations-service-staff");
      if (serviceInput) {
        serviceInput.addEventListener("input", (e) => {
          this.data.serviceStaff = parseInt(e.target.value) || 0;
          this.saveData();
        });
      }
      const alertSelect = popup.querySelector("#operations-alert-level");
      if (alertSelect) {
        alertSelect.addEventListener("change", (e) => {
          this.data.alertLevel = e.target.value;
          this.saveData();
          this.updateAlertDisplay(popup);
        });
      }
    },
    updateAlertDisplay(popup) {
      const alertMetric = popup.querySelector(
        ".operations-metric .alert-level-green, .operations-metric .alert-level-blue, .operations-metric .alert-level-yellow, .operations-metric .alert-level-red, .operations-metric .alert-level-delta",
      );
      if (alertMetric) {
        alertMetric.className = `operations-metric-value alert-level-${this.data.alertLevel.toLowerCase()}`;
        alertMetric.textContent = this.data.alertLevel;
      }
      const alertInfo = popup.querySelector(".alert-info div:last-child");
      if (alertInfo) {
        alertInfo.textContent =
          this.alertLevels[this.data.alertLevel]?.restrictions || "None";
      }
      const statCards = popup.querySelectorAll(".personnel-stat-card");
      if (statCards.length > 0) {
        const alertCard = statCards[0];
        const alertValue = alertCard.querySelector(".personnel-stat-value");
        if (alertValue) {
          alertValue.className = `personnel-stat-value alert-level-${this.data.alertLevel.toLowerCase()}`;
          alertValue.textContent = this.data.alertLevel;
        }
      }
    },
    cycleSystemStatus(system) {
      const statuses = ["Nominal", "Strained", "Failed"];
      const currentIndex = statuses.indexOf(this.data.systemsStatus[system]);
      this.data.systemsStatus[system] = statuses[(currentIndex + 1) % statuses.length];
      this.saveData();
      this.updatePopupContent();
      if (window.ExecutiveInterface?.showNotification) {
        window.ExecutiveInterface.showNotification(
          `${this.getSystemIdentifier(system)} status changed to ${this.data.systemsStatus[system]}`,
          this.data.systemsStatus[system] === "Failed" ? "error" : "info",
        );
      }
    },
    toggleIanStatus() {
      const statuses = ["Good Boy", "Very Good Boy", "Best Boy", "Good Boy"];
      const currentIndex = statuses.indexOf(this.data.ianStatus);
      this.data.ianStatus = statuses[(currentIndex + 1) % statuses.length];
      this.saveData();
      this.updatePopupContent();
      if (window.ExecutiveInterface?.showNotification) {
        window.ExecutiveInterface.showNotification(
          `Ian the Corgi is a ${this.data.ianStatus}! 🐕`,
          "success",
        );
      }
    },
    updatePopupContent() {
      // Only update if the operations popup is currently open
      if (window.SCC_DASHBOARD_POPUP?.getCurrentPopup() === "operations") {
        const popupContent = document.querySelector('.dashboard-popup-content');
        if (popupContent) {
          // Generate new content
          const newContent = this.generateContent();
          
          // Update the content
          popupContent.innerHTML = newContent;
          
          // Re-bind events for the new content
          this.bindEvents(document.querySelector('.dashboard-popup-overlay'));
        }
      }
    },
    saveData() {
      try {
        localStorage.setItem(
          "scc_operations_data",
          JSON.stringify({
            data: this.data,
            timestamp: Date.now(),
            version: "3.0.0",
          }),
        );
      } catch (error) {
        console.warn("Operations data save failed:", error);
      }
    },
    loadSavedData() {
      try {
        const saved = localStorage.getItem("scc_operations_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.data) {
            this.data = { ...this.data, ...parsed.data };
          }
        }
      } catch (error) {
        console.warn("Operations data load failed:", error);
      }
    },
    getData() {
      return { ...this.data };
    },
    updateData(newData) {
      this.data = { ...this.data, ...newData };
      this.saveData();
    },
    resetData() {
      this.data = {
        accessRequests: 0,
        reassignments: 0,
        bridgeCrew: 0,
        serviceStaff: 0,
        alertLevel: "Green",
        systemsStatus: {
          lifeSupportSystems: "Nominal",
          powerGrid: "Nominal",
          communicationsArray: "Nominal",
          navigationSystems: "Nominal",
          defensiveSystems: "Nominal",
          emergencySystems: "Nominal",
        },
        ianStatus: "",
      };
      this.saveData();
    },
  };
  window.SCC_OPERATIONS = OperationsDashboard;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      OperationsDashboard.initialize(),
    );
  } else {
    OperationsDashboard.initialize();
  }
})();
