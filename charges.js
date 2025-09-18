(function () {
  "use strict";

  const N4NL_CHARGES = {
    state: {
      activeField: null,
      modalOpen: false,
      searchTerm: "",
      selectedCategory: "all",
      charges: [],
      chargeMap: new Map(),
    },

    init() {
      this.loadCharges();
      this.initModal();
    },

    async loadCharges() {
      this.state.charges = [
        // Yellow Violations (i100s)
        { code: "i101", name: "Trespassing", category: "yellow", severity: 1 },
        { code: "i102", name: "Petty Theft", category: "yellow", severity: 1 },
        {
          code: "i103",
          name: "Minor Assault",
          category: "yellow",
          severity: 1,
        },
        { code: "i104", name: "Battery", category: "yellow", severity: 1 },
        {
          code: "i105",
          name: "Indecent Exposure or Hooliganism",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i107",
          name: "Misuse of Public Radio Channels",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i108",
          name: "Violation of Injunction",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i109",
          name: "Slandering a Head of Staff",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i110",
          name: "Slander or Verbal Abuse",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i111",
          name: "Failure to Execute an Order",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i113",
          name: "Animal Cruelty",
          category: "yellow",
          severity: 1,
        },
        { code: "i114", name: "Vandalism", category: "yellow", severity: 1 },
        {
          code: "i115",
          name: "Threat of Murder or Serious Injury",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i116",
          name: "Disrespect to the Dead",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i117",
          name: "Excessive Use of Force in Detainment",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i118",
          name: "Violation of Privacy Laws",
          category: "yellow",
          severity: 1,
        },
        {
          code: "i119",
          name: "Illegal Search",
          category: "yellow",
          severity: 1,
        },
        { code: "i120", name: "Littering", category: "yellow", severity: 1 },

        // Amber Violations (i200s)
        {
          code: "i201",
          name: "Failure to Execute Order w/ Serious Consequences",
          category: "amber",
          severity: 2,
        },
        {
          code: "i202",
          name: "Resisting Arrest / Sparking Manhunt",
          category: "amber",
          severity: 2,
        },
        {
          code: "i203",
          name: "Suicide Attempt",
          category: "amber",
          severity: 2,
        },
        {
          code: "i204",
          name: "Abuse of Confiscated Equipment",
          category: "amber",
          severity: 2,
        },
        {
          code: "i205",
          name: "Illegal Detention, Arrest, or Holding",
          category: "amber",
          severity: 2,
        },
        {
          code: "i206",
          name: "Neglect of Duty",
          category: "amber",
          severity: 2,
        },
        { code: "i207", name: "Infiltration", category: "amber", severity: 2 },
        { code: "i208", name: "Assault", category: "amber", severity: 2 },
        {
          code: "i209",
          name: "Escaping From Confinement",
          category: "amber",
          severity: 2,
        },
        {
          code: "i210",
          name: "Unlawful Modification of AI/Cyborg Laws",
          category: "amber",
          severity: 2,
        },
        { code: "i211", name: "Sedition", category: "amber", severity: 2 },
        { code: "i212", name: "Contraband", category: "amber", severity: 2 },
        { code: "i213", name: "Sabotage", category: "amber", severity: 2 },
        {
          code: "i214",
          name: "Exceeding Official Powers",
          category: "amber",
          severity: 2,
        },
        { code: "i215", name: "Grand Theft", category: "amber", severity: 2 },
        {
          code: "i216",
          name: "Organising a Breakout",
          category: "amber",
          severity: 2,
        },
        {
          code: "i217",
          name: "Illegal Blocking of Areas",
          category: "amber",
          severity: 2,
        },
        {
          code: "i218",
          name: "Use of Excessive Force",
          category: "amber",
          severity: 2,
        },
        {
          code: "i219",
          name: "Mistreatment of Prisoners",
          category: "amber",
          severity: 2,
        },
        { code: "i220", name: "Fraud", category: "amber", severity: 2 },
        {
          code: "i221",
          name: "Gross Negligence",
          category: "amber",
          severity: 2,
        },

        // Red Violations (i300s)
        { code: "i301", name: "Murder", category: "red", severity: 3 },
        { code: "i302", name: "Manslaughter", category: "red", severity: 3 },
        { code: "i303", name: "Mutiny", category: "red", severity: 3 },
        {
          code: "i304",
          name: "Kidnapping and Hostage Taking",
          category: "red",
          severity: 3,
        },
        { code: "i305", name: "Terrorist Acts", category: "red", severity: 3 },
        {
          code: "i306",
          name: "Assaulting a Head of Staff",
          category: "red",
          severity: 3,
        },
        {
          code: "i307",
          name: "Escaping From Holding Until Transfer",
          category: "red",
          severity: 3,
        },
        {
          code: "i308",
          name: "Corporate Espionage",
          category: "red",
          severity: 3,
        },
        { code: "i310", name: "Automacide", category: "red", severity: 3 },
        { code: "i311", name: "Fytocide", category: "red", severity: 3 },
      ];

      this.state.charges.forEach((charge) => {
        this.state.chargeMap.set(charge.code, charge);
      });
    },


    initModal() {
      const modal = document.createElement("div");
      modal.id = "chargeModal";
      modal.className = "charge-modal";
      modal.innerHTML = `
        <div class="charge-modal-content">
          <header class="charge-modal-header">
            <h2>SCC REGULATION DATABASE</h2>
            <button class="charge-close" aria-label="Close">✕</button>
          </header>
          
          <div class="charge-search">
            <input type="text" id="chargeSearch" placeholder="SEARCH: CODE OR DESCRIPTION" />
            <div class="charge-filters">
              <button data-filter="all" class="filter-btn active">ALL</button>
              <button data-filter="yellow" class="filter-btn yellow">YELLOW</button>
              <button data-filter="amber" class="filter-btn amber">AMBER</button>
              <button data-filter="red" class="filter-btn red">RED</button>
            </div>
          </div>
          
          <div class="charge-list" id="chargeList"></div>
          
          <footer class="charge-modal-footer">
            <button class="charge-cancel">CANCEL</button>
          </footer>
        </div>
      `;

      document.body.appendChild(modal);

      modal
        .querySelector(".charge-close")
        .addEventListener("click", () => this.closeModal());
      modal
        .querySelector(".charge-cancel")
        .addEventListener("click", () => this.cancelSelection());

      modal.querySelector("#chargeSearch").addEventListener("input", (e) => {
        this.state.searchTerm = e.target.value.toLowerCase();
        this.renderCharges();
      });

      modal.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          modal
            .querySelectorAll(".filter-btn")
            .forEach((b) => b.classList.remove("active"));
          e.target.classList.add("active");
          this.state.selectedCategory = e.target.dataset.filter;
          this.renderCharges();
        });
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.closeModal();
      });

      document.addEventListener("keydown", (e) => {
        if (!this.state.modalOpen) return;
        if (e.key === "Escape") this.closeModal();
      });
    },

    openChargeSelector(fieldId) {
      this.state.activeField = fieldId;
      this.state.modalOpen = true;

      const modal = document.getElementById("chargeModal");
      
      modal.classList.remove("fade-out");
      
      modal.classList.add("active");

      document.getElementById("chargeSearch").value = "";
      this.state.searchTerm = "";
      this.renderCharges();

      setTimeout(() => {
        document.getElementById("chargeSearch").focus();
      }, 100);
    },

    renderCharges() {
      const list = document.getElementById("chargeList");
      const filtered = this.state.charges.filter((charge) => {
        const categoryMatch =
          this.state.selectedCategory === "all" ||
          charge.category === this.state.selectedCategory;
        const searchMatch =
          !this.state.searchTerm ||
          charge.code.toLowerCase().includes(this.state.searchTerm) ||
          charge.name.toLowerCase().includes(this.state.searchTerm);
        return categoryMatch && searchMatch;
      });

      list.innerHTML = filtered
        .map(
          (charge) => `
        <div class="charge-item ${charge.category}" data-code="${charge.code}">
          <span class="charge-code">${charge.code}</span>
          <span class="charge-name">${charge.name}</span>
        </div>
      `,
        )
        .join("");

      list.querySelectorAll(".charge-item").forEach((item) => {
        item.addEventListener("click", () => {
          this.selectCharge(item.dataset.code);
        });
      });
    },

    selectCharge(code) {
      const charge = this.state.chargeMap.get(code);
      if (!charge) return;

      if (window.N4NL_TERMINAL && this.state.activeField) {
        window.N4NL_TERMINAL.updateField(
          this.state.activeField,
          `${charge.code} - ${charge.name}`,
        );
        
        // Update the button display in the fields panel
        this.updateChargeButton(this.state.activeField, `${charge.code} - ${charge.name}`);
      }

      this.closeModal();
    },

    cancelSelection() {
      if (window.N4NL_TERMINAL && this.state.activeField) {
        window.N4NL_TERMINAL.updateField(this.state.activeField, "");
        
        // Update the button display in the fields panel
        this.updateChargeButton(this.state.activeField, "");
      }

      this.closeModal();
    },

    updateChargeButton(fieldId, value) {
      const button = document.getElementById(fieldId);
      if (button) {
        const displayText = value || '[SELECT CHARGE]';
        button.textContent = displayText;
        button.title = displayText;
        button.className = `charge-field-button ${value ? 'filled' : 'empty'}`;
      }
    },

    closeModal() {
      this.state.modalOpen = false;
      this.state.activeField = null;
      
      const modal = document.getElementById("chargeModal");
      
      modal.classList.add("fade-out");
      
      setTimeout(() => {
        modal.classList.remove("active", "fade-out");
      }, 500);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => N4NL_CHARGES.init());
  } else {
    setTimeout(() => N4NL_CHARGES.init(), 100);
  }

  window.N4NL_CHARGES = N4NL_CHARGES;
})();
