(function () {
  "use strict";

  // === JOB DATABASE ===
  const JOBS = {
    command: { name: "Command", color: "#d4a04a", jobs: ["Captain", "Executive Officer", "Operations Manager", "Head of Security", "Chief Engineer", "Research Director", "Chief Medical Officer"] },
    command_support: { name: "Command Support", color: "#6bb8d4", jobs: ["Bridge Crewman", "Corporate Liaison", "Consular Officer"] },
    security: { name: "Security", color: "#e76f51", jobs: ["Security Officer", "Warden", "Investigator", "Security Cadet"] },
    engineering: { name: "Engineering", color: "#f4a261", jobs: ["Engineer", "Atmospheric Technician", "Engineering Apprentice"] },
    operations: { name: "Operations", color: "#4a8fb9", jobs: ["Hangar Technician", "Shaft Miner", "Machinist"] },
    medical: { name: "Medical", color: "#52b788", jobs: ["Surgeon", "Physician", "Paramedic", "Psychologist", "Pharmacist", "Medical Intern"] },
    science: { name: "Science", color: "#a78bfa", jobs: ["Scientist", "Xenobiologist", "Xenobotanist", "Xenoarcheologist", "Research Intern"] },
    service: { name: "Service", color: "#7a95b3", jobs: ["Assistant", "Off-Duty Crew Member", "Passenger", "Bartender", "Chef", "Botanist", "Chaplain", "Janitor", "Librarian", "Corporate Reporter"] },
    synthetic: { name: "Synthetic", color: "#94a3b8", jobs: ["AI", "Cyborg", "Personal AI"] },
  };

  // === STATE ===
  const state = { isOpen: false, currentFieldId: null, selectedJobs: [] };

  // === MODAL CREATION ===
  function createModal() {
    if (document.getElementById("jobSelectorModal")) return;

    const modal = document.createElement("div");
    modal.id = "jobSelectorModal";
    modal.className = "job-modal";
    modal.innerHTML = `
      <div class="job-modal-overlay"></div>
      <div class="job-modal-container">
        <div class="job-modal-header">
          <h2 class="job-modal-title">Personnel Assignment Selection</h2>
          <button class="job-modal-close" id="jobModalClose" aria-label="Close">✕</button>
        </div>
        <div class="job-modal-search">
          <input type="text" id="jobSearchInput" class="job-search-input" placeholder="Search assignments..." autocomplete="off" />
        </div>
        <div class="job-modal-body" id="jobModalBody"></div>
        <div class="job-modal-footer">
          <div class="job-selected-count" id="jobSelectedCount">0 assignments selected</div>
          <div class="job-modal-actions">
            <button class="job-btn job-btn-secondary" id="jobClearBtn">Clear</button>
            <button class="job-btn job-btn-primary" id="jobConfirmBtn">Confirm Selection</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);
    renderCategories();
    attachEvents();
  }

  // === RENDERING ===
  function renderCategories() {
    const container = document.getElementById("jobModalBody");
    if (!container) return;

    container.innerHTML = Object.entries(JOBS).map(([key, cat]) => `
      <div class="job-category" data-category="${key}">
        <div class="job-category-header">
          <span class="job-category-icon" style="color: ${cat.color}">▸</span>
          <h3 class="job-category-title">${cat.name}</h3>
          <span class="job-category-count">${cat.jobs.length}</span>
        </div>
        <div class="job-list">
          ${cat.jobs.map(job => `
            <button class="job-item" data-job-title="${job}" data-job-dept="${cat.name}">
              <span class="job-item-icon">◆</span>
              <span class="job-item-title">${job}</span>
              <span class="job-item-check">✓</span>
            </button>`).join("")}
        </div>
      </div>`).join("");

    container.addEventListener("click", (e) => {
      const jobItem = e.target.closest(".job-item");
      if (jobItem) {
        toggleSelection(jobItem.dataset.jobTitle, jobItem);
        return;
      }
      const header = e.target.closest(".job-category-header");
      if (header) header.parentElement.classList.toggle("collapsed");
    });
  }

  // === SELECTION ===
  function toggleSelection(title, el) {
    const idx = state.selectedJobs.indexOf(title);
    if (idx > -1) {
      state.selectedJobs.splice(idx, 1);
      el.classList.remove("selected");
    } else {
      state.selectedJobs.push(title);
      el.classList.add("selected");
    }
    updateCount();
  }

  function updateCount() {
    const el = document.getElementById("jobSelectedCount");
    if (el) el.textContent = `${state.selectedJobs.length} assignment${state.selectedJobs.length !== 1 ? "s" : ""} selected`;
  }

  function clearSelection() {
    state.selectedJobs = [];
    document.querySelectorAll(".job-item.selected").forEach(el => el.classList.remove("selected"));
    updateCount();
  }

  // === SEARCH ===
  function handleSearch(query) {
    const term = query.toLowerCase().trim();
    const items = document.querySelectorAll(".job-item");
    const cats = document.querySelectorAll(".job-category");

    if (!term) {
      items.forEach(el => el.style.display = "");
      cats.forEach(el => { el.style.display = ""; el.classList.remove("collapsed"); });
      return;
    }

    cats.forEach(cat => {
      let visible = false;
      cat.querySelectorAll(".job-item").forEach(job => {
        const match = job.dataset.jobTitle.toLowerCase().includes(term) || job.dataset.jobDept.toLowerCase().includes(term);
        job.style.display = match ? "" : "none";
        if (match) visible = true;
      });
      cat.style.display = visible ? "" : "none";
      if (visible) cat.classList.remove("collapsed");
    });
  }

  // === MODAL CONTROLS ===
  function closeModal() {
    const modal = document.getElementById("jobSelectorModal");
    if (modal) {
      state.isOpen = false;
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  function confirmSelection() {
    if (state.selectedJobs.length && state.currentFieldId && window.SCC_TERMINAL) {
      const val = state.selectedJobs.join(", ");
      window.SCC_TERMINAL.updateField(state.currentFieldId, val);

      const btn = document.querySelector(`button.job-button[data-field-id="${state.currentFieldId}"]`);
      if (btn) {
        btn.textContent = val;
        btn.classList.remove("empty");
        btn.classList.add("filled");
      }
    }
    closeModal();
  }

  // === EVENT ATTACHMENT ===
  function attachEvents() {
    const modal = document.getElementById("jobSelectorModal");
    modal.querySelector(".job-modal-overlay").addEventListener("click", closeModal);
    document.getElementById("jobModalClose").addEventListener("click", closeModal);
    document.getElementById("jobConfirmBtn").addEventListener("click", confirmSelection);
    document.getElementById("jobClearBtn").addEventListener("click", clearSelection);
    document.getElementById("jobSearchInput").addEventListener("input", (e) => handleSearch(e.target.value));
    document.addEventListener("keydown", (e) => e.key === "Escape" && state.isOpen && closeModal());
  }

  // === PUBLIC API ===
  function openJobSelector(fieldId) {
    if (window.SCC_TERMINAL?.isFieldsLocked?.()) return;

    state.currentFieldId = fieldId;
    state.selectedJobs = [];

    const current = window.SCC_TERMINAL?.getFieldValue(fieldId);
    if (current) state.selectedJobs = current.split(",").map(s => s.trim()).filter(Boolean);

    createModal();

    setTimeout(() => {
      document.querySelectorAll(".job-item").forEach(el => {
        el.classList.toggle("selected", state.selectedJobs.includes(el.dataset.jobTitle));
      });
      updateCount();
    }, 0);

    const modal = document.getElementById("jobSelectorModal");
    modal.classList.add("active");
    state.isOpen = true;
    document.body.style.overflow = "hidden";

    const search = document.getElementById("jobSearchInput");
    if (search) { search.value = ""; search.focus(); handleSearch(""); }
  }

  window.SCC_JOBS = {
    openJobSelector,
    getJobs: () => JOBS,
    getSelectedJobs: () => [...state.selectedJobs],
  };

  // Initialize
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", createModal)
    : createModal();
})();
