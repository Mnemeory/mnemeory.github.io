(function () {
  "use strict";
  const ManifestDashboard = {
    data: {
      headsOfStaff: {
        captain: "",
        executiveOfficer: "",
        headOfSecurity: "",
        chiefMedicalOfficer: "",
        chiefEngineer: "",
        researchDirector: "",
        operationsManager: "",
      },
      commandSupport: {
        bridgeCrew1: "",
        bridgeCrew2: "",
        bridgeCrew3: "",
        consularOfficerA: "",
        consularOfficerB: "",
        corporateLiaisonA: "",
        corporateLiaisonB: "",
      },
    },
    positionInfo: {
      captain: {
        description:
          "Overall command authority for the vessel and all operations",
        requirements: "Command certification, 5+ years experience",
        department: "Command",
      },
      executiveOfficer: {
        description: "Second-in-command, administrative oversight",
        requirements: "Command certification, 3+ years experience",
        department: "Command",
      },
      headOfSecurity: {
        description: "Security operations and personnel management",
        requirements: "Security certification, weapons training",
        department: "Security",
      },
      chiefMedicalOfficer: {
        description: "Medical operations and crew health oversight",
        requirements: "Medical degree, surgical certification",
        department: "Medical",
      },
      chiefEngineer: {
        description: "Engineering systems and maintenance oversight",
        requirements: "Engineering degree, systems certification",
        department: "Engineering",
      },
      researchDirector: {
        description: "Scientific research and development coordination",
        requirements: "Advanced scientific degree, research experience",
        department: "Science",
      },
      operationsManager: {
        description: "Logistical coordination and resource management",
        requirements: "Operations certification, logistics experience",
        department: "Operations",
      },
    },
    initialize() {
      this.loadSavedData();
    },
    generateContent() {
      const assignedPositions = Object.values(this.data.headsOfStaff).filter(
        (name) => name.trim() !== "",
      ).length;
      const totalPositions = Object.keys(this.data.headsOfStaff).length;
      return `
 <div class="personnel-stats">
 <div class="personnel-stat-card">
 <div class="personnel-stat-value">${assignedPositions}</div>
 <div class="personnel-stat-label">Assigned Positions</div>
 </div>
 <div class="personnel-stat-card">
 <div class="personnel-stat-value">${totalPositions}</div>
 <div class="personnel-stat-label">Total Positions</div>
 </div>
 </div>
 <div class="manifest-section">
 <h4>Command Staff</h4>
 <div class="dashboard-grid-2">
 ${Object.entries(this.data.headsOfStaff)
   .map(
     ([
       position,
       assignee,
     ]) => `<div class="manifest-position" data-position="${position}"><label>${this.formatPositionName(position)}</label><input type="text" 
 id="manifest-${position}" 
 value="${assignee}" 
 placeholder="Unassigned"></div>`,
   )
   .join("")}
 </div>
 </div>
 <div class="manifest-section">
 <h4>Command Support</h4>
 <div class="dashboard-grid-2">
 ${Object.entries(this.data.commandSupport)
   .map(
     ([
       position,
       assignee,
     ]) => `<div class="manifest-position" data-position="${position}"><label>${this.formatCommandSupportName(position)}</label><input type="text" 
 id="manifest-support-${position}" 
 value="${assignee}" 
 placeholder="Unassigned"></div>`,
   )
   .join("")}
 </div>
 </div>
 `;
    },
    bindEvents(popup) {
      Object.keys(this.data.headsOfStaff).forEach((position) => {
        const input = popup.querySelector(`#manifest-${position}`);
        if (input) {
          input.addEventListener("input", (e) => {
            this.data.headsOfStaff[position] = e.target.value.trim();
            this.saveData();
            this.updateStats(popup);
          });
        }
      });
      Object.keys(this.data.commandSupport).forEach((position) => {
        const input = popup.querySelector(`#manifest-support-${position}`);
        if (input) {
          input.addEventListener("input", (e) => {
            this.data.commandSupport[position] = e.target.value.trim();
            this.saveData();
            this.updateStats(popup);
          });
        }
      });
    },
    updateStats(popup) {
      const assignedPositions = Object.values(this.data.headsOfStaff).filter(
        (name) => name.trim() !== "",
      ).length;
      const statCards = popup.querySelectorAll(".personnel-stat-card");
      if (statCards.length >= 2) {
        statCards[0].querySelector(".personnel-stat-value").textContent =
          assignedPositions;
      }
    },
    formatPositionName(position) {
      const names = {
        captain: "Captain",
        executiveOfficer: "Executive Officer",
        headOfSecurity: "Head of Security",
        chiefMedicalOfficer: "Chief Medical Officer",
        chiefEngineer: "Chief Engineer",
        researchDirector: "Research Director",
        operationsManager: "Operations Manager",
      };
      return names[position] || position.replace(/([A-Z])/g, " $1").trim();
    },
    formatCommandSupportName(position) {
      const names = {
        bridgeCrew1: "Bridge Crew",
        bridgeCrew2: "Bridge Crew",
        bridgeCrew3: "Bridge Crew",
        consularOfficerA: "Consular Officer A",
        consularOfficerB: "Consular Officer B",
        corporateLiaisonA: "Corporate Liaison A",
        corporateLiaisonB: "Corporate Liaison B",
      };
      return names[position] || position.replace(/([A-Z])/g, " $1").trim();
    },
    clearAllAssignments() {
      if (
        confirm("Clear all staff assignments? This action cannot be undone.")
      ) {
        Object.keys(this.data.headsOfStaff).forEach((position) => {
          this.data.headsOfStaff[position] = "";
        });
        Object.keys(this.data.commandSupport).forEach((position) => {
          this.data.commandSupport[position] = "";
        });
        this.saveData();
        if (window.SCC_DASHBOARD_POPUP?.getCurrentPopup() === "manifest") {
          window.SCC_DASHBOARD_POPUP.showPopup("manifest");
        }
      }
    },
    saveData() {
      try {
        localStorage.setItem(
          "scc_manifest_data",
          JSON.stringify({
            data: this.data,
            timestamp: Date.now(),
            version: "3.0.0",
          }),
        );
      } catch (error) {
        console.warn("Manifest data save failed:", error);
      }
    },
    loadSavedData() {
      try {
        const saved = localStorage.getItem("scc_manifest_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.data) {
            this.data = { ...this.data, ...parsed.data };
          }
        }
      } catch (error) {
        console.warn("Manifest data load failed:", error);
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
        headsOfStaff: {
          captain: "",
          executiveOfficer: "",
          headOfSecurity: "",
          chiefMedicalOfficer: "",
          chiefEngineer: "",
          researchDirector: "",
          operationsManager: "",
        },
        commandSupport: {
          bridgeCrew1: "",
          bridgeCrew2: "",
          bridgeCrew3: "",
          consularOfficerA: "",
          consularOfficerB: "",
          corporateLiaisonA: "",
          corporateLiaisonB: "",
        },
      };
      this.saveData();
    },
  };
  window.SCC_MANIFEST = ManifestDashboard;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      ManifestDashboard.initialize(),
    );
  } else {
    ManifestDashboard.initialize();
  }
})();
