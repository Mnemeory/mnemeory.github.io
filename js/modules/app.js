/**
 * Main Application Controller
 * Central orchestration for the Nralakk Federation Interface
 */

import { StateManager } from './state-manager.js';
import { StarfieldManager } from './starfield.js';
import { ViewManager } from './view-manager.js';
import { DocumentManager } from './document-manager.js';
import { CitizenManager } from './citizen-manager.js';
import { 
  CONSTELLATIONS, 
  SITE_CONFIG, 
  INTERFACE_TEXT 
} from './config.js';
import { 
  Logger, 
  EventUtils, 
  ToastManager,
  NetworkUtils 
} from './utilities.js';

export class Application {
  constructor() {
    this.state = new StateManager();
    this.logger = new Logger("Application");
    
    // Core modules
    this.starfield = null;
    this.viewManager = null;
    this.documentManager = null;
    this.citizenManager = null;
    this.router = null;
    
    // Data
    this.nodes = [];
    this.currentConstellation = null;
    
    // Status
    this.isInitialized = false;
  }

  async init() {
    try {
      this.logger.info("Initializing application");
      
      // Update loading state
      this.state.set("appState", "loading");
      
      // Initialize core systems
      await this.initializeViews();
      await this.initializeStarfield();
      await this.initializeDocuments();
      await this.initializeCitizens();
      await this.initializeRouter();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      // Mark as initialized
      this.isInitialized = true;
      this.state.set("appState", "ready");
      
      this.logger.info("Application initialized successfully");
      return true;
    } catch (error) {
      this.logger.error("Application initialization failed", error);
      this.state.set("appState", "error");
      this.showError(error);
      throw error;
    }
  }

  async initializeViews() {
    this.viewManager = new ViewManager(this.state);
    await this.viewManager.init();
    this.logger.info("View manager initialized");
  }

  async initializeStarfield() {
    this.starfield = new StarfieldManager(this.state);
    await this.starfield.init();
    
    // Connect starfield to navigation
    this.starfield.setClusterActivationCallback((constellation) => {
      this.navigateToConstellation(constellation);
    });
    
    this.logger.info("Starfield initialized");
  }

  async initializeDocuments() {
    this.documentManager = new DocumentManager(this.state);
    this.documentManager.init();
    this.logger.info("Document manager initialized");
  }

  async initializeCitizens() {
    this.citizenManager = new CitizenManager();
    this.logger.info("Citizen manager initialized");
  }

  async initializeRouter() {
    // Simple hash-based routing
    this.router = {
      navigate: (path) => {
        window.location.hash = path.startsWith('#') ? path : `#${path}`;
      }
    };
    
    // Handle hash changes
    window.addEventListener('hashchange', () => this.handleRouteChange());
    
    // Handle initial route
    setTimeout(() => this.handleRouteChange(), 100);
    
    this.logger.info("Router initialized");
  }

  handleRouteChange() {
    const hash = window.location.hash || '#/';
    const route = hash.replace('#', '');
    
    this.state.set("currentRoute", route);
    
    if (route === '/' || route === '') {
      this.viewManager.showView('starfield-view');
      this.currentConstellation = null;
    } else {
      const constellation = route.substring(1);
      if (CONSTELLATIONS[constellation]) {
        this.navigateToConstellation(constellation);
      } else {
        this.viewManager.showView('starfield-view');
      }
    }
  }

  navigateToConstellation(constellation) {
    if (!CONSTELLATIONS[constellation]) {
      this.logger.warn(`Invalid constellation: ${constellation}`);
      return;
    }
    
    this.currentConstellation = constellation;
    const viewId = `${constellation}-view`;
    
    // Show constellation view
    this.viewManager.showView(viewId);
    
    // Update URL
    if (window.location.hash !== `#/${constellation}`) {
      this.router.navigate(`#/${constellation}`);
    }
    
    // Populate constellation content
    this.populateConstellation(constellation);
    
    // Dispatch event
    EventUtils.dispatch('app:constellation:shown', { constellation });
  }

  async loadData() {
    try {
      this.logger.info("Loading application data");
      
      // Try to load from GitHub
      const nodes = await this.loadGitHubData();
      
      if (nodes && nodes.length > 0) {
        this.nodes = nodes;
        this.state.set("nodes", nodes);
        this.logger.info(`Loaded ${nodes.length} nodes from GitHub`);
      } else {
        // Fall back to mock data
        this.nodes = this.createMockData();
        this.state.set("nodes", this.nodes);
        this.logger.info(`Using ${this.nodes.length} mock nodes`);
      }
      
      this.state.set("dataState", "ready");
    } catch (error) {
      this.logger.warn("Data loading failed, using mock data", error);
      this.nodes = this.createMockData();
      this.state.set("nodes", this.nodes);
      this.state.set("dataState", "ready");
    }
  }

  async loadGitHubData() {
    try {
      const apiBase = "https://api.github.com/repos/Mnemeory/mnemeory.github.io/contents";
      
      // Test connection
      const response = await NetworkUtils.fetchWithTimeout(apiBase, {}, 5000);
      if (!response.ok) return null;
      
      const nodes = [];
      
      // Load templates
      try {
        const templatesResponse = await NetworkUtils.fetchJSON(`${apiBase}/templates`);
        if (Array.isArray(templatesResponse)) {
          for (const file of templatesResponse) {
            if (file.type === 'file' && file.name.endsWith('.txt')) {
              nodes.push({
                id: `template-${file.name}`,
                name: file.name.replace('.txt', ''),
                url: file.download_url,
                constellation: 'hatching-egg',
                content: '',
                metadata: { type: 'template' }
              });
            }
          }
        }
      } catch (e) {
        this.logger.warn("Could not load templates", e);
      }
      
      // Load citizen files
      try {
        const citizenResponse = await NetworkUtils.fetchJSON(`${apiBase}/citizen`);
        if (Array.isArray(citizenResponse)) {
          for (const file of citizenResponse) {
            if (file.type === 'file' && file.name.endsWith('.txt')) {
              nodes.push({
                id: `citizen-${file.name}`,
                name: file.name.replace('.txt', ''),
                url: file.download_url,
                constellation: 'qu-poxii',
                content: '',
                metadata: { type: 'citizen' }
              });
            }
          }
        }
      } catch (e) {
        this.logger.warn("Could not load citizen files", e);
      }
      
      return nodes;
    } catch (error) {
      this.logger.warn("GitHub API error", error);
      return null;
    }
  }

  createMockData() {
    return [
      {
        id: 'mock-citizen-1',
        name: 'SF01-24670825',
        constellation: 'qu-poxii',
        content: 'Mock citizen record content',
        metadata: { type: 'citizen' }
      },
      {
        id: 'mock-template-1',
        name: 'CLERICAL-BusinessCard',
        constellation: 'hatching-egg',
        content: 'Mock template content',
        metadata: { type: 'template' }
      },
      {
        id: 'mock-tree-1',
        name: 'Diplomatic Protocol',
        constellation: 'gnarled-tree',
        content: 'Mock diplomatic protocol',
        metadata: { type: 'protocol' }
      },
      {
        id: 'mock-chant-1',
        name: 'Star Chanter Record',
        constellation: 'star-chanter',
        content: 'Mock ceremonial record',
        metadata: { type: 'ceremonial' }
      }
    ];
  }

  populateConstellation(constellation) {
    const container = document.getElementById(`${constellation}-nodes`);
    if (!container) {
      this.logger.warn(`Container not found for constellation: ${constellation}`);
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Special handling for Qu'Poxii (citizens)
    if (constellation === 'qu-poxii') {
      this.setupCitizenInterface(container);
      return;
    }
    
    // Special handling for void (under development)
    if (constellation === 'void') {
      const voidData = CONSTELLATIONS.void;
      if (voidData.descriptions?.shell) {
        this.renderShellConstellation(container, voidData);
        return;
      }
    }
    
    // Get nodes for this constellation
    const constellationNodes = this.nodes.filter(node => node.constellation === constellation);
    
    if (constellationNodes.length === 0) {
      container.innerHTML = `
        <div class="empty-constellation">
          <p>No psionic data streams available in this constellation.</p>
          <p class="text-shimmer">The Nlom-linked stars are dormant here, for now.</p>
        </div>
      `;
      return;
    }
    
    // Create card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';
    cardContainer.setAttribute('data-constellation', constellation);
    
    // Create cards for each node
    constellationNodes.forEach((node, index) => {
      const card = this.createNodeCard(node, constellation);
      card.setAttribute('data-index', index);
      card.classList.add('animate-in');
      cardContainer.appendChild(card);
    });
    
    container.appendChild(cardContainer);
  }

  createNodeCard(node, constellation) {
    const card = document.createElement('button');
    card.className = 'card--document';
    card.setAttribute('type', 'button');
    card.setAttribute('aria-label', `Open ${node.name}`);
    
    const constellationData = CONSTELLATIONS[constellation];
    const iconPath = constellationData?.icon ? 
      `assets/images/${constellationData.icon}.svg` : 
      'assets/images/tree.svg';
    
    card.innerHTML = `
      <div class="card--bubble">
        <img src="${iconPath}" alt="" class="document-icon" aria-hidden="true" />
      </div>
      <span class="document-label">${node.name}</span>
    `;
    
    card.addEventListener('click', () => this.openNode(node));
    
    return card;
  }

  setupCitizenInterface(container) {
    container.innerHTML = `
      <div class="citizen-management-container">
        <div id="citizen-interface" class="citizen-interface-wrapper"></div>
      </div>
    `;
    
    // Initialize citizen UI
    setTimeout(() => {
      const citizenUI = new CitizenUI(this.citizenManager);
      citizenUI.init('#citizen-interface');
      
      // Set citizen files
      const citizenFiles = this.nodes.filter(node => node.metadata?.type === 'citizen');
      this.citizenManager.setCitizenFiles(citizenFiles);
    }, 100);
  }

  renderShellConstellation(container, constellationData) {
    const shell = constellationData.descriptions.shell;
    
    container.innerHTML = `
      <div class="constellation-shell">
        <div class="shell-header">
          <h3>${constellationData.name}</h3>
          <p class="shell-subtitle">${shell.subtitle}</p>
        </div>
        <div class="shell-content">
          <div class="shell-icon">${shell.icon}</div>
          <p class="shell-description">${shell.description}</p>
          <div class="shell-features">
            <h4>Planned Features:</h4>
            <ul>
              ${shell.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          ${shell.securityNotice ? `
            <div class="security-notice">
              <p><strong>${shell.securityNotice}</strong></p>
            </div>
          ` : ''}
          <div class="shell-status">
            <span class="status-indicator ${shell.statusClass || ''}">${shell.status}</span>
          </div>
        </div>
      </div>
    `;
  }

  async openNode(node) {
    // Get modal
    const modal = document.querySelector(SITE_CONFIG.selectors.modal);
    if (!modal) {
      this.logger.error("Modal not found");
      return;
    }
    
    // Set title
    const title = modal.querySelector("[data-component='modal-title']");
    if (title) {
      title.textContent = node.name;
    }
    
    // Load content
    let content = node.content;
    if (node.url && !content) {
      try {
        content = await NetworkUtils.fetchText(node.url);
      } catch (error) {
        this.logger.warn(`Could not load node content from ${node.url}`, error);
        content = this.generateNodeTemplate(node);
      }
    } else if (!content) {
      content = this.generateNodeTemplate(node);
    }
    
    // Set content in document editor
    const editor = modal.querySelector('[data-component="document-editor"]');
    if (editor && this.documentManager) {
      this.documentManager.setContent('modal-document', content, node.name);
    }
    
    // Show modal
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus close button
    const closeBtn = modal.querySelector("[data-component='modal-close']");
    if (closeBtn) closeBtn.focus();
    
    // Show toast
    ToastManager.success(`Diplomatic access granted: "${node.name}"`);
  }

  generateNodeTemplate(node) {
    const constellation = CONSTELLATIONS[node.constellation];
    return `[h1]${node.name}[/h1]

[b]Constellation:[/b] ${constellation?.name || node.constellation}
[b]Node ID:[/b] ${node.id}

[h2]Content[/h2]
This data stream contains archived Federation diplomatic information accessed via the Nlom neural interface.

[hr]

[center][small]Generated by Federation Diplomatic Mission Nlom Interface[/small][/center]`;
  }

  setupEventListeners() {
    // Home button navigation
    document.addEventListener('click', (e) => {
      const homeButton = e.target.closest("[data-component='home-button']");
      if (homeButton) {
        this.router.navigate('#/');
      }
      
      // Modal close
      const modalClose = e.target.closest("[data-component='modal-close']");
      if (modalClose) {
        const modal = modalClose.closest("[data-component='modal']");
        if (modal) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }
      }
      
      // Modal backdrop click
      const backdrop = e.target.closest("[data-component='modal-backdrop']");
      if (backdrop && e.target === backdrop) {
        const modal = backdrop.closest("[data-component='modal']");
        if (modal) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }
      }
    });
    
    // Escape key for modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector("[data-component='modal'].is-open");
        if (modal) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }
      }
    });
    
    // Constellation shown event
    document.addEventListener('app:constellation:shown', (e) => {
      this.logger.info(`Constellation shown: ${e.detail.constellation}`);
    });
  }

  hideLoadingScreen() {
    const loadingVeil = document.querySelector(SITE_CONFIG.selectors.loadingVeil);
    if (loadingVeil) {
      loadingVeil.classList.add('hidden');
      loadingVeil.setAttribute('aria-hidden', 'true');
      
      setTimeout(() => {
        if (loadingVeil.parentNode) {
          loadingVeil.parentNode.removeChild(loadingVeil);
        }
      }, 1000);
    }
  }

  showError(error) {
    const errorContainer = document.querySelector("[data-js='app-error']");
    if (errorContainer) {
      errorContainer.classList.add('is-visible');
      errorContainer.setAttribute('data-state', 'error');
      
      const messageEl = errorContainer.querySelector("[data-js='error-message']");
      if (messageEl) {
        messageEl.textContent = error?.message || INTERFACE_TEXT.errors.connectionError;
      }
    }
  }

  destroy() {
    if (this.starfield) this.starfield.destroy();
    if (this.viewManager) this.viewManager.destroy();
    if (this.documentManager) this.documentManager.destroy();
    
    this.logger.info("Application destroyed");
  }
}

// Citizen UI Component
class CitizenUI {
  constructor(citizenManager) {
    this.citizenManager = citizenManager;
    this.container = null;
    this.currentView = 'overview';
  }

  init(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    
    this.render();
    this.setupEventListeners();
  }

  render() {
    if (!this.container) return;
    
    if (!this.citizenManager.isSessionInitialized()) {
      this.renderSessionGate();
      return;
    }
    
    this.renderInterface();
  }

  renderSessionGate() {
    this.container.innerHTML = `
      <div class="session-gate">
        <div class="session-gate-content">
          <div class="gate-emblem">
            <img src="assets/images/bond.svg" alt="" class="gate-emblem-icon" />
          </div>
          <h2>The Qu'Poxii</h2>
          <p>Love • Friendship • Support</p>
          
          <div class="session-gate-body">
            <h3>Diplomatic Citizen Management System</h3>
            <p>Welcome to the Federation's Citizen Oversight Interface.</p>
            
            <button type="button" data-action="start-session">
              Initialize Diplomatic Session
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderInterface() {
    this.container.innerHTML = `
      <div class="citizen-management">
        <div class="citizen-header">
          <div class="session-info">
            <h3>${INTERFACE_TEXT.citizen.headers.session} ${this.citizenManager.currentSession.id}</h3>
            <div class="session-controls">
              <button type="button" data-action="export-session">
                ${INTERFACE_TEXT.citizen.buttons.exportSession}
              </button>
              <button type="button" data-action="clear-session">
                ${INTERFACE_TEXT.citizen.buttons.newSession}
              </button>
            </div>
          </div>
        </div>
        
        <div class="citizen-content">
          ${this.renderCurrentView()}
        </div>
      </div>
    `;
  }

  renderCurrentView() {
    const citizens = this.citizenManager.getAllCitizens();
    
    if (citizens.length === 0) {
      return `<p>${INTERFACE_TEXT.citizen.messages.noCitizens}</p>`;
    }
    
    return citizens.map(citizen => `
      <div data-component="citizen-card">
        <h5>${this.citizenManager.getFullName(citizen)}</h5>
        <span>${citizen.sciScore}/10</span>
      </div>
    `).join('');
  }

  setupEventListeners() {
    if (!this.container) return;
    
    this.container.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      
      switch(action) {
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
      