(function () {
  "use strict";

  // Job Database - organized by department
  const JOBS_DATABASE = {
    command: {
      name: "Command",
      color: "#d4a04a",
      jobs: [
        { title: "Captain", dept: "Command" },
        { title: "Executive Officer", dept: "Command" },
        { title: "Operations Manager", dept: "Command" },
        { title: "Head of Security", dept: "Command" },
        { title: "Chief Engineer", dept: "Command" },
        { title: "Research Director", dept: "Command" },
        { title: "Chief Medical Officer", dept: "Command" },
      ],
    },
    command_support: {
      name: "Command Support",
      color: "#6bb8d4",
      jobs: [
        { title: "Bridge Crewman", dept: "Command Support" },
        { title: "Corporate Liaison", dept: "Command Support" },
        { title: "Consular Officer", dept: "Command Support" },
      ],
    },
    security: {
      name: "Security",
      color: "#e76f51",
      jobs: [
        { title: "Security Officer", dept: "Security" },
        { title: "Warden", dept: "Security" },
        { title: "Investigator", dept: "Security" },
        { title: "Security Cadet", dept: "Security" },
      ],
    },
    engineering: {
      name: "Engineering",
      color: "#f4a261",
      jobs: [
        { title: "Engineer", dept: "Engineering" },
        { title: "Atmospheric Technician", dept: "Engineering" },
        { title: "Engineering Apprentice", dept: "Engineering" },
      ],
    },
    operations: {
      name: "Operations",
      color: "#4a8fb9",
      jobs: [
        { title: "Hangar Technician", dept: "Operations" },
        { title: "Shaft Miner", dept: "Operations" },
        { title: "Machinist", dept: "Operations" },
      ],
    },
    medical: {
      name: "Medical",
      color: "#52b788",
      jobs: [
        { title: "Surgeon", dept: "Medical" },
        { title: "Physician", dept: "Medical" },
        { title: "Paramedic", dept: "Medical" },
        { title: "Psychologist", dept: "Medical" },
        { title: "Pharmacist", dept: "Medical" },
        { title: "Medical Intern", dept: "Medical" },
      ],
    },
    science: {
      name: "Science",
      color: "#a78bfa",
      jobs: [
        { title: "Scientist", dept: "Science" },
        { title: "Xenobiologist", dept: "Science" },
        { title: "Xenobotanist", dept: "Science" },
        { title: "Xenoarcheologist", dept: "Science" },
        { title: "Research Intern", dept: "Science" },
      ],
    },
    service: {
      name: "Service",
      color: "#7a95b3",
      jobs: [
        { title: "Assistant", dept: "Service" },
        { title: "Off-Duty Crew Member", dept: "Service" },
        { title: "Passenger", dept: "Service" },
        { title: "Bartender", dept: "Service" },
        { title: "Chef", dept: "Service" },
        { title: "Botanist", dept: "Service" },
        { title: "Chaplain", dept: "Service" },
        { title: "Janitor", dept: "Service" },
        { title: "Librarian", dept: "Service" },
        { title: "Corporate Reporter", dept: "Service" },
      ],
    },
    synthetic: {
      name: "Synthetic",
      color: "#94a3b8",
      jobs: [
        { title: "AI", dept: "Synthetic" },
        { title: "Cyborg", dept: "Synthetic" },
        { title: "Personal AI", dept: "Synthetic" },
      ],
    },
  };

  // State management
  const state = {
    isOpen: false,
    currentFieldId: null,
    selectedJobs: [],
  };

  // Create the job selector modal
  function createJobSelectorModal() {
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
          <input 
            type="text" 
            id="jobSearchInput" 
            class="job-search-input" 
            placeholder="Search assignments..."
            autocomplete="off"
          />
        </div>

        <div class="job-modal-body" id="jobModalBody"></div>
        
        <div class="job-modal-footer">
          <div class="job-selected-count" id="jobSelectedCount">0 assignments selected</div>
          <div class="job-modal-actions">
            <button class="job-btn job-btn-secondary" id="jobClearBtn">Clear</button>
            <button class="job-btn job-btn-primary" id="jobConfirmBtn">Confirm Selection</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    renderJobCategories();
    attachModalEvents();
  }

  // Render job categories and jobs
  function renderJobCategories() {
    const container = document.getElementById("jobModalBody");
    if (!container) return;

    container.innerHTML = Object.entries(JOBS_DATABASE)
      .map(
        ([key, category]) => `
        <div class="job-category" data-category="${key}">
          <div class="job-category-header">
            <span class="job-category-icon" style="color: ${category.color}">▸</span>
            <h3 class="job-category-title">${category.name}</h3>
            <span class="job-category-count">${category.jobs.length}</span>
          </div>
          <div class="job-list">
            ${category.jobs
              .map(
                (job) => `
              <button 
                class="job-item" 
                data-job-title="${job.title}"
                data-job-dept="${job.dept}"
              >
                <span class="job-item-icon">◆</span>
                <span class="job-item-title">${job.title}</span>
                <span class="job-item-check">✓</span>
              </button>
            `,
              )
              .join("")}
          </div>
        </div>
      `,
      )
      .join("");

    attachJobEvents();
  }

  // Attach event handlers to job items
  function attachJobEvents() {
    const jobItems = document.querySelectorAll(".job-item");
    jobItems.forEach((item) => {
      item.addEventListener("click", () => {
        const jobTitle = item.dataset.jobTitle;
        toggleJobSelection(jobTitle, item);
      });
    });

    // Category collapse/expand
    const categoryHeaders = document.querySelectorAll(".job-category-header");
    categoryHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const category = header.parentElement;
        category.classList.toggle("collapsed");
      });
    });
  }

  // Toggle job selection
  function toggleJobSelection(jobTitle, element) {
    const index = state.selectedJobs.indexOf(jobTitle);

    if (index > -1) {
      state.selectedJobs.splice(index, 1);
      element.classList.remove("selected");
    } else {
      state.selectedJobs.push(jobTitle);
      element.classList.add("selected");
    }

    updateSelectedCount();
  }

  // Update selected count
  function updateSelectedCount() {
    const countEl = document.getElementById("jobSelectedCount");
    if (countEl) {
      const count = state.selectedJobs.length;
      countEl.textContent = `${count} assignment${count !== 1 ? "s" : ""} selected`;
    }
  }

  // Search functionality
  function handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    const jobItems = document.querySelectorAll(".job-item");
    const categories = document.querySelectorAll(".job-category");

    if (!searchTerm) {
      jobItems.forEach((item) => (item.style.display = ""));
      categories.forEach((cat) => {
        cat.style.display = "";
        cat.classList.remove("collapsed");
      });
      return;
    }

    categories.forEach((category) => {
      let hasVisibleJobs = false;
      const jobs = category.querySelectorAll(".job-item");

      jobs.forEach((job) => {
        const title = job.dataset.jobTitle.toLowerCase();
        const dept = job.dataset.jobDept.toLowerCase();
        const matches = title.includes(searchTerm) || dept.includes(searchTerm);

        job.style.display = matches ? "" : "none";
        if (matches) hasVisibleJobs = true;
      });

      category.style.display = hasVisibleJobs ? "" : "none";
      if (hasVisibleJobs) {
        category.classList.remove("collapsed");
      }
    });
  }

  // Attach modal event handlers
  function attachModalEvents() {
    const modal = document.getElementById("jobSelectorModal");
    const overlay = modal.querySelector(".job-modal-overlay");
    const closeBtn = document.getElementById("jobModalClose");
    const confirmBtn = document.getElementById("jobConfirmBtn");
    const clearBtn = document.getElementById("jobClearBtn");
    const searchInput = document.getElementById("jobSearchInput");

    const closeModal = () => {
      state.isOpen = false;
      modal.classList.remove("active");
      document.body.style.overflow = "";
    };

    const confirmSelection = () => {
      if (state.selectedJobs.length === 0) {
        closeModal();
        return;
      }

      const formattedJobs = state.selectedJobs.join(", ");

      if (state.currentFieldId && window.SCC_TERMINAL) {
        window.SCC_TERMINAL.updateField(state.currentFieldId, formattedJobs);

        // Update the visual button directly
        const buttonElement = document.querySelector(
          `button.job-button[data-field-id="${state.currentFieldId}"]`,
        );
        if (buttonElement) {
          buttonElement.textContent = formattedJobs;
          buttonElement.classList.remove("empty");
          buttonElement.classList.add("filled");
        }
      }

      closeModal();
    };

    const clearSelection = () => {
      state.selectedJobs = [];
      document.querySelectorAll(".job-item.selected").forEach((item) => {
        item.classList.remove("selected");
      });
      updateSelectedCount();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
    confirmBtn.addEventListener("click", confirmSelection);
    clearBtn.addEventListener("click", clearSelection);

    searchInput.addEventListener("input", (e) => {
      handleSearch(e.target.value);
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.isOpen) {
        closeModal();
      }
    });
  }

  // Open job selector for a specific field
  function openJobSelector(fieldId) {
    // Prevent opening if fields are locked (no officer ID or shift code)
    if (
      window.SCC_TERMINAL?.isFieldsLocked &&
      window.SCC_TERMINAL.isFieldsLocked()
    ) {
      return;
    }

    state.currentFieldId = fieldId;
    state.selectedJobs = [];

    // Get current value if exists
    if (window.SCC_TERMINAL) {
      const currentValue = window.SCC_TERMINAL.getFieldValue(fieldId);
      if (currentValue) {
        state.selectedJobs = currentValue
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const modal = document.getElementById("jobSelectorModal");
    if (!modal) {
      createJobSelectorModal();
    }

    // Update UI to reflect current selections
    setTimeout(() => {
      const jobItems = document.querySelectorAll(".job-item");
      jobItems.forEach((item) => {
        const jobTitle = item.dataset.jobTitle;
        if (state.selectedJobs.includes(jobTitle)) {
          item.classList.add("selected");
        } else {
          item.classList.remove("selected");
        }
      });
      updateSelectedCount();
    }, 0);

    const finalModal = document.getElementById("jobSelectorModal");
    finalModal.classList.add("active");
    state.isOpen = true;
    document.body.style.overflow = "hidden";

    // Focus search input
    const searchInput = document.getElementById("jobSearchInput");
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
      handleSearch("");
    }
  }

  // Initialize on page load
  function initialize() {
    createJobSelectorModal();
  }

  // Public API
  window.SCC_JOBS = {
    openJobSelector,
    getJobs: () => JOBS_DATABASE,
    getSelectedJobs: () => [...state.selectedJobs],
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
