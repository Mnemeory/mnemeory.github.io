/**
 * Citizen Management UI
 * Presents citizen session interface and handles user interactions
 */

import { INTERFACE_TEXT } from '../config.js';
import { Logger, ToastManager } from './utilities.js';
import { CitizenManager } from './citizen-manager.js';

export class CitizenUI {
  constructor(citizenManager = new CitizenManager()) {
    this.citizenManager = citizenManager;
    this.container = null;
    this.logger = new Logger('CitizenUI');
  }

  /**
   * Initialize citizen interface
   * @param {string} containerSelector
   */
  init(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      this.logger.warn('Citizen UI container not found');
      return;
    }

    this.render();
    this.setupEventListeners();
  }

  /** Render interface based on session state */
  render() {
    if (!this.container) return;

    if (!this.citizenManager.isSessionInitialized()) {
      this.renderSessionGate();
    } else {
      this.renderInterface();
    }
  }

  renderSessionGate() {
    this.container.innerHTML = `
      <div data-component="session-gate">
        <div data-component="session-gate-content">
          <div data-component="gate-emblem">
            <img src="assets/images/bond.svg" alt="" data-component="gate-emblem-icon" />
          </div>
          <h2>The Qu'Poxii</h2>
          <p>Love • Friendship • Support</p>
          <div data-component="session-gate-body">
            <h3>Diplomatic Citizen Management System</h3>
            <p>Welcome to the Federation's Citizen Oversight Interface.</p>
            <button type="button" data-action="start-session">Initialize Diplomatic Session</button>
          </div>
        </div>
      </div>`;
  }

  renderInterface() {
    const sessionId = this.citizenManager.currentSession.id;
    this.container.innerHTML = `
      <div data-component="citizen-management">
        <div data-component="citizen-header">
          <div data-component="session-info">
            <h3>${INTERFACE_TEXT.citizen.headers.session} ${sessionId}</h3>
            <div data-component="session-controls">
              <button type="button" data-action="export-session">${INTERFACE_TEXT.citizen.buttons.exportSession}</button>
              <button type="button" data-action="clear-session">${INTERFACE_TEXT.citizen.buttons.newSession}</button>
            </div>
          </div>
        </div>
        <div data-component="citizen-content">
          ${this.renderCitizenList()}
        </div>
      </div>`;
  }

  renderCitizenList() {
    const citizens = this.citizenManager.getAllCitizens();
    if (citizens.length === 0) {
      return `<p data-component="empty-message">${INTERFACE_TEXT.citizen.messages.noCitizens}</p>`;
    }

    return citizens.map((c, index) => `
      <div data-component="citizen-card" data-index="${index}">
        <h5 data-component="citizen-name">${this.citizenManager.getFullName(c)}</h5>
        <span data-component="sci-score">${c.sciScore}/10</span>
      </div>`).join('');
  }

  setupEventListeners() {
    if (!this.container) return;

    this.container.addEventListener('click', e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      switch (action) {
        case 'start-session':
          this.citizenManager.startNewSession();
          this.render();
          ToastManager.success('New session initialized');
          break;
        case 'export-session':
          this.citizenManager.exportSession();
          break;
        case 'clear-session':
          if (confirm('Clear current session?')) {
            this.citizenManager.clearSession();
            this.render();
          }
          break;
      }
    });
  }
}

// Auto-initialize when event is dispatched
document.addEventListener('app:initialize:citizenUI', e => {
  const { containerId, nodes } = e.detail || {};
  const manager = new CitizenManager();
  manager.setCitizenFiles(nodes);
  const ui = new CitizenUI(manager);
  ui.init(`#${containerId}`);
});
