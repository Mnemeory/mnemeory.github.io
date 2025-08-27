/**
 * Citizen Management UI for Qu'Poxii Constellation
 * Handles the interface for managing Skrell citizen records
 */

import { CitizenManager } from "./citizen-manager.js";
import { ToastManager } from "./shared-utilities.js";
import { CITIZEN_STATUSES, SITE_CONFIG, CONSTANTS } from "../config.js";

export class CitizenUI {
  constructor() {
    this.citizenManager = new CitizenManager();
    this.container = null;
    this.currentView = "overview"; // overview, add-citizen, edit-citizen, view-citizen
    this.editingCitizenId = null;
  }

  renderStatusOptions(selectedStatus) {
    return CITIZEN_STATUSES.map(
      (status) =>
        `<option value="${status.value}" ${
          selectedStatus
            ? selectedStatus === status.value
              ? "selected"
              : ""
            : status.default
              ? "selected"
              : ""
        }>${status.label}</option>`
    ).join("");
  }

  /**
   * Initialize the citizen management interface
   */
  init(containerSelector = SITE_CONFIG.selectors.citizenInterface) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      console.error(SITE_CONFIG.interfaceText.errors.invalidInput);
      return;
    }

    this.render();
    this.setupEventListeners();

    // Log initialization
    console.log("Citizen UI initialized for Qu'Poxii constellation");
  }

  /**
   * Render the citizen management interface
   */
  render() {
    if (!this.container) return;

    // Check if session has been initialized
    if (!this.citizenManager.isSessionInitialized()) {
      this.container.innerHTML = this.renderSessionGate();
      return;
    }

    // Render normal interface if session is initialized
    this.container.innerHTML = `
      <div class="citizen-management">
        <div class="citizen-header">
          <div class="session-info">
            <h3>${SITE_CONFIG.interfaceText.citizen.headers.session} ${this.citizenManager.currentSession.id}</h3>
            <div class="session-controls">
              <button type="button" class="neural-button" id="set-round-btn">
                ${SITE_CONFIG.interfaceText.citizen.buttons.setRound}
              </button>
              <button type="button" class="neural-button" id="export-session-btn">
                ${SITE_CONFIG.interfaceText.citizen.buttons.exportSession}
              </button>
              <button type="button" class="neural-button neural-button--warning" id="clear-session-btn">
                ${SITE_CONFIG.interfaceText.citizen.buttons.newSession}
              </button>
            </div>
          </div>
        </div>

        <div class="citizen-navigation">
          <button type="button" class="neural-button nav-btn ${
            this.currentView === "overview" ? "active" : ""
          }" data-view="overview">${SITE_CONFIG.interfaceText.citizen.navigation.overview}</button>
          <button type="button" class="neural-button nav-btn ${
            this.currentView === "add-citizen" ? "active" : ""
          }" data-view="add-citizen">${SITE_CONFIG.interfaceText.citizen.navigation.addCitizen}</button>
        </div>

        <div class="citizen-content">
          ${this.renderCurrentView()}
        </div>
      </div>
    `;
  }

  /**
   * Render session gate screen
   */
  renderSessionGate() {
    return `
      <div class="session-gate">
        <div class="session-gate-content">
          <div class="session-gate-header">
            <div class="gate-emblem">
              <img src="assets/images/bond.svg" alt="" aria-hidden="true" class="gate-emblem-icon" />
              <div class="gate-ripples"></div>
            </div>
            <h2 class="gate-title">The Qu'Poxii</h2>
            <p class="gate-subtitle">Love • Friendship • Support</p>
          </div>

          <div class="session-gate-body">
            <div class="gate-welcome">
              <h3>Diplomatic Citizen Management System</h3>
              <p>Welcome to the Federation's Citizen Oversight Interface. This system provides essential services for Social Compatibility Index management and diaspora welfare coordination aboard corporate vessels.</p>

              <div class="gate-features">
                <div class="gate-feature">
                  <span class="feature-icon">⬡</span>
                  <div class="feature-text">
                    <h4>Citizen Registration</h4>
                    <p>Maintain Federation citizen records and Social Compatibility Index assessments</p>
                  </div>
                </div>
                <div class="gate-feature">
                  <span class="feature-icon">⬢</span>
                  <div class="feature-text">
                    <h4>Diplomatic Session Protocols</h4>
                    <p>Record welfare operations and maintain Grand Council compliance</p>
                  </div>
                </div>
                <div class="gate-feature">
                  <span class="feature-icon">⬣</span>
                  <div class="feature-text">
                    <h4>Nlom Network Integration</h4>
                    <p>Synchronized with Federation Central Authority via secure psionic channels</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="gate-session-start">
              <div class="session-requirement">
                <p><strong>Session Required:</strong> A new diplomatic session must be initiated before accessing citizen management features.</p>
                <p class="session-note">This ensures proper logging and maintains Federation protocols for citizen welfare operations.</p>
              </div>

              <button type="button" class="neural-button neural-button--large" id="start-new-session-btn">
                <span class="btn-icon">⬢</span>
                Initialize Diplomatic Session
              </button>
            </div>
          </div>

          <div class="session-gate-footer">
            <p class="gate-authority">Nralakk Federation Diplomatic Mission • SCCV Horizon</p>
            <p class="gate-motto">"Every citizen is a star in our constellation"</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render current view content
   */
  renderCurrentView() {
    switch (this.currentView) {
      case "overview":
        return this.renderOverview();
      case "add-citizen":
        return this.renderAddCitizen();
      case "edit-citizen":
        return this.renderEditCitizen();
      case "view-citizen":
        return this.renderViewCitizen();
      default:
        return this.renderOverview();
    }
  }

  /**
   * Render overview page
   */
  renderOverview() {
    const stats = this.citizenManager.getSessionStats();
    const citizens = this.citizenManager.getAllCitizens();
    const recentLogs = this.citizenManager.currentSession.logEntries
      .slice(-CONSTANTS.RECENT_LOGS_LIMIT)
      .reverse();

    return `
      <div class="overview-grid">
        <div class="stats-panel">
          <h4>${SITE_CONFIG.interfaceText.citizen.headers.stats}</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total Citizens:</span>
              <span class="stat-value">${stats.totalCitizens}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Average SCI:</span>
              <span class="stat-value">${stats.averageSCI}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Log Entries:</span>
              <span class="stat-value">${stats.totalLogEntries}</span>
            </div>
          </div>
        </div>

        <div class="citizens-panel">
          <h4>${SITE_CONFIG.interfaceText.citizen.headers.citizens}</h4>
          <div class="citizen-search">
            <input type="search" id="citizen-search" placeholder="${SITE_CONFIG.interfaceText.citizen.placeholders.searchCitizens}"
                   class="search-input">
          </div>
          <div class="citizens-list">
            ${
              citizens.length === 0
                ? `<p class=\"empty-state\">${SITE_CONFIG.interfaceText.citizen.messages.noCitizens}</p>`
                : citizens
                    .map((citizen) => this.renderCitizenCard(citizen))
                    .join("")
            }
          </div>
        </div>

        <div class="session-files-panel">
          <h4>${SITE_CONFIG.interfaceText.citizen.headers.sessionFiles}</h4>
          <div class="session-files-bubbles" id="session-files-bubbles">
            <p class="empty-state">Session files will be populated dynamically</p>
          </div>
        </div>

        <div class="activity-panel">
          <h4>${SITE_CONFIG.interfaceText.citizen.headers.activity}</h4>
          <div class="activity-log">
            ${
              recentLogs.length === 0
                ? `<p class=\"empty-state\">${SITE_CONFIG.interfaceText.citizen.messages.noActivity}</p>`
                : recentLogs
                    .map(
                      (log) => `
                <div class="log-entry">
                  <span class="log-time">${log.timestamp.toLocaleTimeString()}</span>
                  <span class="log-text">${log.entry}</span>
                </div>
              `
                    )
                    .join("")
            }
          </div>
        </div>

        <div class="files-panel">
          <h4>Available Citizen Files</h4>
          <div class="citizen-files-bubbles" id="citizen-files-bubbles">
            <p class="empty-state">Citizen files will be populated by node manager</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render citizen card
   */
  renderCitizenCard(citizen) {
    const sciClass =
      citizen.sciScore >= CONSTANTS.SCI_PRIMARY_THRESHOLD
        ? "primary"
        : citizen.sciScore >= CONSTANTS.SCI_SECONDARY_THRESHOLD
          ? "secondary"
          : "tertiary";
    const behavioralTags = citizen.behavioralTags || [];

    return `
      <div class="citizen-card" data-citizen-id="${citizen.id}">
        <div class="citizen-card-header">
          <h5 class="citizen-name">${this.citizenManager.getFullName(
            citizen
          )}</h5>
          <span class="sci-badge sci-${sciClass}">${citizen.sciScore}/10</span>
        </div>
        <div class="citizen-card-info">
          <p class="citizen-status">${citizen.citizenStatus}</p>
          ${
            citizen.location
              ? `<p class="citizen-location">📍 ${citizen.location}</p>`
              : ""
          }
          ${
            behavioralTags.length > 0
              ? `
            <div class="citizen-tags">
              ${behavioralTags
                .map((tag) => `<span class="tag-bubble">${tag}</span>`)
                .join("")}
            </div>
          `
              : ""
          }
        </div>
        <div class="citizen-card-actions">
          <button type="button" class="neural-button neural-button--small"
                  data-citizen-id="${citizen.id}">View</button>
          <button type="button" class="neural-button neural-button--small"
                  data-citizen-id="${citizen.id}">Edit</button>
          <button type="button" class="neural-button neural-button--small neural-button--success"
                  data-citizen-id="${citizen.id}">Print</button>
        </div>
      </div>
    `;
  }

  /**
   * Render add citizen form
   */
  renderAddCitizen() {
    return `
      <div class="citizen-form">
        <h4>Register New Citizen</h4>
        <form id="add-citizen-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="primary-name">Primary Name *</label>
              <input type="text" id="primary-name" name="primaryName" required
                     placeholder="e.g., Weashbi">
            </div>

            <div class="form-group">
              <label for="secondary-name">Secondary Name *</label>
              <input type="text" id="secondary-name" name="secondaryName" required
                     placeholder="e.g., Jrugl">
            </div>

            <div class="form-group">
              <label for="name-extensions">Name Extensions</label>
              <input type="text" id="name-extensions" name="nameExtensions"
                     placeholder="e.g., -Qvorth'qi (honorific)">
              <small>Use hyphen (-) for respect, apostrophe (') for personal connection</small>
            </div>

            <div class="form-group">
              <label for="sci-score">Social Compatibility Index *</label>
              <input type="number" id="sci-score" name="sciScore" min="0" max="10" step="0.01"
                     value="5.00" required>
              <small>Scale: 0.00 - 10.00</small>
            </div>

              <div class="form-group">
                <label for="citizen-status">Citizen Status *</label>
                <select id="citizen-status" name="citizenStatus" required>
                  ${this.renderStatusOptions()}
                </select>
              </div>

            <div class="form-group">
              <label for="location">Current Location</label>
              <input type="text" id="location" name="location"
                     placeholder="e.g., Biesel Station, Tau Ceti">
            </div>

            <div class="form-group">
              <label for="occupation">Occupation</label>
              <input type="text" id="occupation" name="occupation"
                     placeholder="e.g., Research Scientist, Corporate Liaison">
            </div>

            <div class="form-group">
              <label for="quya">Quya (Family Unit)</label>
              <input type="text" id="quya" name="quya"
                     placeholder="Family unit composition">
            </div>

            <div class="form-group form-group--full">
              <label for="notes">Administrative Notes</label>
              <textarea id="notes" name="notes" rows="3"
                        placeholder="Additional notes about this citizen..."></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="neural-button" id="cancel-add-btn">
              Cancel
            </button>
            <button type="submit" class="neural-button">
              Register Citizen
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Render edit citizen form
   */
  renderEditCitizen() {
    const citizen = this.citizenManager.getCitizen(this.editingCitizenId);
    if (!citizen) return "<p>Citizen not found.</p>";

    return `
      <div class="citizen-form">
        <h4>Edit Citizen Record: ${this.citizenManager.getFullName(
          citizen
        )}</h4>
        <form id="edit-citizen-form">
          <input type="hidden" name="citizenId" value="${citizen.id}">

          <div class="form-grid">
            <div class="form-group">
              <label for="edit-primary-name">Primary Name *</label>
              <input type="text" id="edit-primary-name" name="primaryName" required
                     value="${citizen.primaryName}">
            </div>

            <div class="form-group">
              <label for="edit-secondary-name">Secondary Name *</label>
              <input type="text" id="edit-secondary-name" name="secondaryName" required
                     value="${citizen.secondaryName}">
            </div>

            <div class="form-group">
              <label for="edit-name-extensions">Name Extensions</label>
              <input type="text" id="edit-name-extensions" name="nameExtensions"
                     value="${citizen.nameExtensions}">
            </div>

            <div class="form-group">
              <label for="edit-sci-score">Social Compatibility Index *</label>
              <input type="number" id="edit-sci-score" name="sciScore" min="0" max="10" step="0.01"
                     value="${citizen.sciScore}" required>
            </div>

            <div class="form-group">
              <label for="edit-citizen-status">Citizen Status *</label>
              <select id="edit-citizen-status" name="citizenStatus" required>
                ${this.renderStatusOptions(citizen.citizenStatus)}
              </select>
            </div>

            <div class="form-group">
              <label for="edit-location">Current Location</label>
              <input type="text" id="edit-location" name="location" value="${
                citizen.location
              }">
            </div>

            <div class="form-group">
              <label for="edit-occupation">Occupation</label>
              <input type="text" id="edit-occupation" name="occupation" value="${
                citizen.occupation
              }">
            </div>

            <div class="form-group">
              <label for="edit-quya">Quya (Family Unit)</label>
              <input type="text" id="edit-quya" name="quya" value="${
                citizen.quya
              }">
            </div>

            <div class="form-group form-group--full">
              <label for="edit-notes">Administrative Notes</label>
              <textarea id="edit-notes" name="notes" rows="3">${
                citizen.notes
              }</textarea>
            </div>
          </div>

          <div class="form-section">
            <h5>Add Log Entry</h5>
            <div class="form-group">
              <input type="text" id="new-log-entry" placeholder="Add new log entry for this citizen...">
              <button type="button" class="neural-button" id="add-log-btn">
                Add Entry
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="neural-button" id="cancel-edit-btn">
              Cancel
            </button>
            <button type="submit" class="neural-button">
              Update Record
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Render view citizen page
   */
  renderViewCitizen() {
    const citizen = this.citizenManager.getCitizen(this.editingCitizenId);
    if (!citizen) return "<p>Citizen not found.</p>";

    const availableTags = this.citizenManager.getAvailableBehavioralTags();
    const citizenTags = citizen.behavioralTags || [];

    return `
      <div class="citizen-view">
        <div class="citizen-view-header">
          <h4>Citizen Record: ${this.citizenManager.getFullName(citizen)}</h4>
          <div class="view-actions">
            <button type="button" class="neural-button" id="edit-from-view-btn" data-citizen-id="${
              citizen.id
            }">
              Edit Record
            </button>
            <button type="button" class="neural-button neural-button--success" id="print-from-view-btn" data-citizen-id="${
              citizen.id
            }">
              Print Record
            </button>
            <button type="button" class="neural-button" id="back-to-overview-btn">
              Back to Overview
            </button>
          </div>
        </div>

        <div class="citizen-details-grid">
          <div class="detail-section">
            <h5>Personal Information</h5>
            <div class="detail-item">
              <span class="detail-label">Full Name:</span>
              <span class="detail-value">${this.citizenManager.getFullName(
                citizen
              )}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Citizen ID:</span>
              <span class="detail-value">${citizen.id}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Social Compatibility Index:</span>
              <span class="detail-value sci-${
                citizen.sciScore >= 7
                  ? "primary"
                  : citizen.sciScore >= 4
                    ? "secondary"
                    : "tertiary"
              }">${citizen.sciScore}/10.00</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Citizen Status:</span>
              <span class="detail-value">${citizen.citizenStatus}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Current Location:</span>
              <span class="detail-value">${
                citizen.location || "Not specified"
              }</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Occupation:</span>
              <span class="detail-value">${
                citizen.occupation || "Not specified"
              }</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Quya (Family Unit):</span>
              <span class="detail-value">${
                citizen.quya || "Not specified"
              }</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Record Created:</span>
              <span class="detail-value">${citizen.createdAt.toLocaleString()}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Modified:</span>
              <span class="detail-value">${citizen.lastModified.toLocaleString()}</span>
            </div>
          </div>

          <div class="behavioral-tags-section">
            <h5>Behavioral Profile</h5>
            <div class="current-tags">
              <h6>Current Behavioral Tags:</h6>
              <div class="tags-list">
                ${
                  citizenTags.length === 0
                    ? '<p class="empty-state">No behavioral tags assigned.</p>'
                    : citizenTags
                        .map(
                          (tag) => `
                    <div class="behavior-tag">
                      <span class="tag-name">${tag}</span>
                      <span class="tag-description">${
                        availableTags[tag] || ""
                      }</span>
                      <button type="button" class="remove-tag-btn" data-tag="${tag}" data-citizen-id="${
                        citizen.id
                      }">×</button>
                    </div>
                  `
                        )
                        .join("")
                }
              </div>
            </div>

            <div class="add-tags">
              <h6>Add Behavioral Tag:</h6>
              <select id="tag-selector" class="tag-selector">
                <option value="">Select a behavioral tag...</option>
                ${Object.entries(availableTags)
                  .map(([tagName, description]) =>
                    citizenTags.includes(tagName)
                      ? ""
                      : `<option value="${tagName}">${tagName} - ${description}</option>`
                  )
                  .join("")}
              </select>
              <button type="button" class="neural-button neural-button--small" id="add-tag-btn" data-citizen-id="${
                citizen.id
              }">
                Add Tag
              </button>
            </div>
          </div>

          <div class="notes-section">
            <h5>Administrative Notes</h5>
            <div class="notes-content">
              ${
                citizen.notes
                  ? `<p>${citizen.notes}</p>`
                  : '<p class="empty-state">No administrative notes.</p>'
              }
            </div>
          </div>

          <div class="activity-section">
            <h5>Activity Log</h5>
            <div class="citizen-activity-log">
              ${
                citizen.logEntries.length === 0
                  ? '<p class="empty-state">No activity logged for this citizen.</p>'
                  : citizen.logEntries
                      .map(
                        (entry) => `
                  <div class="log-entry">
                    <span class="log-time">${entry.timestamp.toLocaleString()}</span>
                    <span class="log-text">${entry.entry}</span>
                  </div>
                `
                      )
                      .join("")
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.container) return;

    // Navigation
    this.container.addEventListener("click", (e) => {
      if (e.target.matches(".nav-btn")) {
        this.currentView = e.target.dataset.view;
        this.render();
      }

      // Session gate controls
      if (e.target.matches("#start-new-session-btn")) {
        this.handleStartNewSession();
      }

      // Session controls
      if (e.target.matches("#set-round-btn")) {
        this.handleSetRound();
      }

      if (e.target.matches("#export-session-btn")) {
        this.citizenManager.exportSession();
      }

      if (e.target.matches("#clear-session-btn")) {
        this.handleClearSession();
      }

      // Citizen actions
      if (e.target.matches(".view-citizen-btn")) {
        this.viewCitizen(e.target.dataset.citizenId);
      }

      if (e.target.matches(".edit-citizen-btn")) {
        this.editCitizen(e.target.dataset.citizenId);
      }

      if (e.target.matches(".print-citizen-btn")) {
        this.printCitizenRecord(e.target.dataset.citizenId);
      }

      // Form actions
      if (e.target.matches("#cancel-add-btn")) {
        this.currentView = "overview";
        this.render();
      }

      if (e.target.matches("#cancel-edit-btn")) {
        this.currentView = "overview";
        this.editingCitizenId = null;
        this.render();
      }

      if (e.target.matches("#add-log-btn")) {
        this.handleAddLogEntry();
      }

      // Behavioral tag management
      if (e.target.matches("#add-tag-btn")) {
        this.handleAddBehavioralTag();
      }

      if (e.target.matches(".remove-tag-btn")) {
        this.handleRemoveBehavioralTag(
          e.target.dataset.tag,
          e.target.dataset.citizenId
        );
      }

      // View citizen navigation
      if (e.target.matches("#back-to-overview-btn")) {
        this.currentView = "overview";
        this.editingCitizenId = null;
        this.render();
      }

      if (e.target.matches("#edit-from-view-btn")) {
        this.editCitizen(e.target.dataset.citizenId);
      }

      if (e.target.matches("#print-from-view-btn")) {
        this.printCitizenRecord(e.target.dataset.citizenId);
      }

      // File viewing
      if (e.target.matches(".view-file-btn")) {
        this.viewCitizenFile(e.target.dataset.fileId);
      }

      // File importing
      if (e.target.matches(".import-file-btn")) {
        this.importCitizenFile(e.target.dataset.fileId);
      }
    });

    // Form submissions
    this.container.addEventListener("submit", (e) => {
      if (e.target.matches("#add-citizen-form")) {
        e.preventDefault();
        this.handleAddCitizen(e.target);
      }

      if (e.target.matches("#edit-citizen-form")) {
        e.preventDefault();
        this.handleEditCitizen(e.target);
      }
    });

    // Search
    this.container.addEventListener("input", (e) => {
      if (e.target.matches("#citizen-search")) {
        this.handleSearch(e.target.value);
      }
    });
  }

  /**
   * Handle starting a new session
   */
  handleStartNewSession() {
    try {
      const session = this.citizenManager.startNewSession();
      this.currentView = "overview"; // Reset to overview when starting new session
      this.render();
      ToastManager.show(
        `New diplomatic session initiated: ${session.id}`,
        "success"
      );
    } catch (error) {
      ToastManager.show("Error starting new session: " + error.message, "error");
    }
  }

  /**
   * Handle setting round number
   */
  handleSetRound() {
    const roundNumber = prompt("Enter round number:");
    if (roundNumber) {
      this.citizenManager.setRoundNumber(roundNumber);
      this.render();
      ToastManager.show(`Round number set: ${roundNumber}`, "success");
    }
  }

  /**
   * Handle clearing session
   */
  handleClearSession() {
    if (
      confirm(
        "Clear current session? This will remove all citizen records and logs."
      )
    ) {
      this.citizenManager.clearSession();
      this.currentView = "overview";
      this.render(); // This will now show the session gate since sessionInitialized is false
    }
  }

  /**
   * Handle adding citizen
   */
  handleAddCitizen(form) {
    const formData = new FormData(form);
    const citizenData = Object.fromEntries(formData.entries());

    try {
      const citizen = this.citizenManager.createCitizen(citizenData);
      ToastManager.show(
        `Citizen registered: ${this.citizenManager.getFullName(citizen)}`,
        "success"
      );
      this.currentView = "overview";
      this.render();
    } catch (error) {
      ToastManager.show("Error registering citizen: " + error.message, "error");
    }
  }

  /**
   * Handle editing citizen
   */
  handleEditCitizen(form) {
    const formData = new FormData(form);
    const citizenData = Object.fromEntries(formData.entries());
    const citizenId = citizenData.citizenId;
    delete citizenData.citizenId;

    try {
      const citizen = this.citizenManager.updateCitizen(citizenId, citizenData);
      ToastManager.show(
        `Citizen updated: ${this.citizenManager.getFullName(citizen)}`,
        "success"
      );
      this.currentView = "overview";
      this.editingCitizenId = null;
      this.render();
    } catch (error) {
      ToastManager.show("Error updating citizen: " + error.message, "error");
    }
  }

  /**
   * Handle adding log entry
   */
  handleAddLogEntry() {
    const input = this.container.querySelector("#new-log-entry");
    const entry = input.value.trim();

    if (entry) {
      this.citizenManager.addLogEntry(entry, this.editingCitizenId);
      input.value = "";
      ToastManager.show("Log entry added", "success");
    }
  }

  /**
   * View citizen details
   */
  viewCitizen(citizenId) {
    const citizen = this.citizenManager.getCitizen(citizenId);
    if (!citizen) return;

    this.editingCitizenId = citizenId;
    this.currentView = "view-citizen";
    this.render();
  }

  /**
   * Edit citizen
   */
  editCitizen(citizenId) {
    this.editingCitizenId = citizenId;
    this.currentView = "edit-citizen";
    this.render();
  }

  /**
   * Handle search
   */
  handleSearch(query) {
    // Simple search implementation - could be enhanced
    const cards = this.container.querySelectorAll(".citizen-card");
    cards.forEach((card) => {
      const name = card
        .querySelector(".citizen-name")
        .textContent.toLowerCase();
      if (name.includes(query.toLowerCase())) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  /**
   * Handle adding behavioral tag
   */
  handleAddBehavioralTag() {
    const selector = this.container.querySelector("#tag-selector");
    const tagName = selector.value;

    if (!tagName || !this.editingCitizenId) return;

    const success = this.citizenManager.addBehavioralTag(
      this.editingCitizenId,
      tagName
    );
    if (success) {
      ToastManager.show(`Behavioral tag added: ${tagName}`, "success");
      this.render(); // Re-render to update the display
    } else {
      ToastManager.show("Tag already exists or could not be added", "warning");
    }
  }

  /**
   * Handle removing behavioral tag
   */
  handleRemoveBehavioralTag(tagName, citizenId) {
    if (confirm(`Remove behavioral tag "${tagName}"?`)) {
      const success = this.citizenManager.removeBehavioralTag(
        citizenId,
        tagName
      );
      if (success) {
        ToastManager.show(`Behavioral tag removed: ${tagName}`, "success");
        this.render(); // Re-render to update the display
      } else {
        ToastManager.show("Could not remove tag", "error");
      }
    }
  }

  /**
   * Import citizen from file
   */
  importCitizenFile(fileId) {
    try {
      const citizen = this.citizenManager.importCitizenFromFile(fileId);

      if (citizen) {
        ToastManager.show(
          `Successfully imported citizen: ${this.citizenManager.getFullName(citizen)}`,
          "success"
        );
        this.render(); // Refresh the UI to show the new citizen
      } else {
        ToastManager.show("Failed to import citizen from file", "error");
      }
    } catch (error) {
      ToastManager.show("Error importing citizen: " + error.message, "error");
    }
  }

  /**
   * View citizen file from the file system
   */
  viewCitizenFile(fileId) {
    const citizenFiles = this.citizenManager.getCitizenFiles();
    const file = citizenFiles.find((f) => f.id === fileId);

    if (!file) {
      ToastManager.show("Citizen file not found", "error");
      return;
    }

    // Open the file in the document system modal
    if (window.nlomInterface && window.nlomInterface.getSubsystem("nodes")) {
      const nodeManager = window.nlomInterface.getSubsystem("nodes");
      if (nodeManager && nodeManager.modalDocument) {
        nodeManager.modalDocument.setContent(file.content, file.name);

        // Show the modal
        const modal = document.querySelector(SITE_CONFIG.selectors.nodeModal);
        if (modal) {
          modal.setAttribute("aria-hidden", "false");
        }

        ToastManager.show(`Opened citizen file: ${file.name}`, "success");
      } else {
        // Fallback: show content in alert
        alert(`Citizen File: ${file.name}\n\n${file.content}`);
      }
    } else {
      // Fallback: show content in alert
      alert(`Citizen File: ${file.name}\n\n${file.content}`);
    }
  }

  /**
   * Print citizen record (copy to clipboard)
   */
  async printCitizenRecord(citizenId) {
    const citizen = this.citizenManager.getCitizen(citizenId);
    if (!citizen) return;

    const content = this.citizenManager.generateCitizenReport(citizen);

    try {
      await navigator.clipboard.writeText(content);
      ToastManager.show(
        `Citizen record copied to clipboard: ${this.citizenManager.getFullName(
          citizen
        )}`,
        "success"
      );
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      ToastManager.show(
        `Citizen record copied to clipboard: ${this.citizenManager.getFullName(
          citizen
        )}`,
        "success"
      );
    }
  }
}
