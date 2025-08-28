/**
 * Application Controller
 * Central orchestration system for the Nralakk Federation Interface
 * 
 * Coordinates all subsystems and manages application lifecycle
 * with strict separation between business logic and presentation.
 */

import { StateManager } from "./state-manager.js";
import { Router } from "./router.js";
import { ViewManager } from "./view-manager.js";
import { NodeManager } from "./node-manager.js";
import { DocumentSystem } from "./document-system.js";
import { StarfieldManager } from "./starfield-manager.js";
import { Logger } from "./shared-utilities.js";
import { CONFIG } from "../config.js";

export class AppController {
  constructor() {
    // Core systems
    this.state = new StateManager();
    this.logger = new Logger("AppController");
    
    // Initialize with uninitialized subsystems
    this.router = null;
    this.viewManager = null;
    this.nodeManager = null;
    this.documentSystem = null;
    this.starfieldManager = null;
    
    // Track initialization status
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   * Follows dependency order for subsystem initialization
   */
  async init() {
    try {
      this.logger.info("Initializing application");
      
      // Set up HTML configuration from centralized config
      this.setupHTMLConfiguration();
      
      // Update loading state
      this.state.set("appState", "loading");
      
      // Initialize core systems in dependency order
      // 1. State and view manager first
      this.viewManager = new ViewManager(this.state);
      await this.viewManager.init();
      
      // 2. Domain services
      this.documentSystem = new DocumentSystem(this.state);

      // 3. Node management system
      this.nodeManager = new NodeManager(this.state);

      // 4. Starfield visualization
      this.starfieldManager = new StarfieldManager(this.state);
      await this.starfieldManager.init();

      // Connect starfield to navigation
      this.starfieldManager.setClusterActivationCallback((constellation) => {
        if (this.router) {
          this.router.navigate(`#/${constellation}`);
        }
      });

      // 5. Load content data
      await this.loadData();
      
      // 6. Initialize router (must be last to handle initial route)
      this.router = new Router(this.state, this.viewManager);

      // Setup constellation population listener
      this.setupConstellationPopulation();

      // Setup accessibility features
      this.setupAccessibility();
      
      // Mark initialization complete
      this.isInitialized = true;
      this.state.set("appState", "ready");
      
      // Hide loading screen now that initialization is complete
      this.hideLoadingScreen();
      
      this.logger.info("Application initialized successfully");
      
      return true;
    } catch (error) {
      this.logger.error("Application initialization failed", error);
      this.state.set("appState", "error");
      this.state.set("lastError", {
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
      
      // Update UI with error state via class toggle
      this.setErrorState(error);
      
      throw error;
    }
  }

  /**
   * Set up HTML configuration from centralized config
   */
  setupHTMLConfiguration() {
    try {
      // Configure document metadata
      this.setMetadata();
      
      // Configure Open Graph tags
      this.setOpenGraphTags();
      
      // Configure assets and resources
      this.setAssetLinks();
      
      // Set dynamic texts
      this.setDynamicText();
    } catch (error) {
      this.logger.warn("Failed to set up HTML configuration", error);
    }
  }

  /**
   * Set document metadata
   */
  setMetadata() {
    const { meta } = CONFIG.site;
    
    const selectors = {
      title: document.getElementById("page-title"),
      description: document.getElementById("meta-description"),
      author: document.getElementById("meta-author"),
      canonical: document.getElementById("canonical-link")
    };
    
    if (selectors.title) selectors.title.textContent = meta.siteName;
    if (selectors.description) selectors.description.setAttribute("content", meta.description);
    if (selectors.author) selectors.author.setAttribute("content", meta.author);
    if (selectors.canonical) selectors.canonical.setAttribute("href", meta.canonicalUrl);
  }

  /**
   * Set Open Graph tags
   */
  setOpenGraphTags() {
    const { meta } = CONFIG.site;
    
    const selectors = {
      ogTitle: document.getElementById("og-title"),
      ogDescription: document.getElementById("og-description"),
      ogUrl: document.getElementById("og-url")
    };
    
    if (selectors.ogTitle) selectors.ogTitle.setAttribute("content", meta.ogTitle);
    if (selectors.ogDescription) selectors.ogDescription.setAttribute("content", meta.ogDescription);
    if (selectors.ogUrl) selectors.ogUrl.setAttribute("content", meta.canonicalUrl);
  }

  /**
   * Set asset links
   */
  setAssetLinks() {
    const { assets, cdn } = CONFIG.site;
    
    // Favicon
    const favicon = document.getElementById("favicon-link");
    if (favicon) favicon.setAttribute("href", assets.favicon);
    
    // Fonts
    const fontPreconnect1 = document.getElementById("font-preconnect-1");
    const fontPreconnect2 = document.getElementById("font-preconnect-2");
    const fontStylesheet = document.getElementById("font-stylesheet");
    
    if (fontPreconnect1) fontPreconnect1.setAttribute("href", cdn.fonts.google);
    if (fontPreconnect2) fontPreconnect2.setAttribute("href", cdn.fonts.googleStatic);
    if (fontStylesheet) {
      fontStylesheet.setAttribute("href", 
        `${cdn.fonts.google}/css2?family=${cdn.fonts.fontFamilies}`);
    }
    

  }

  /**
   * Set dynamic text content
   */
  setDynamicText() {
    // Apply text from configuration
    const textElements = document.querySelectorAll("[data-text-key]");
    textElements.forEach(element => {
      const key = element.getAttribute("data-text-key");
      const section = element.getAttribute("data-text-section") || "general";
      
      const text = this.getTextFromConfig(section, key);
      if (text) element.textContent = text;
    });
    
    // Apply constellation descriptions
    this.setConstellationDescriptions();
  }

  /**
   * Get text from configuration
   */
  getTextFromConfig(section, key) {
    try {
      return CONFIG.text[section]?.[key] || key;
    } catch (error) {
      return key;
    }
  }

  /**
   * Set constellation descriptions from configuration
   */
  setConstellationDescriptions() {
    try {
      // Map constellation IDs to their description element IDs
      const descriptionMap = {
        "gnarled-tree": "tree-desc",
        "qu-poxii": "bond-desc",
        "star-chanter": "chant-desc",
        "hatching-egg": "egg-desc",
        "void": "void-desc"
      };
      
      Object.entries(CONFIG.constellations).forEach(([id, data]) => {
        const descriptionId = descriptionMap[id];
        if (descriptionId) {
          const element = document.getElementById(descriptionId);
          if (element) element.textContent = data.descriptions.accessibility;
        }
        
        // Update stream views - updated to use new data-component attributes
        const streamView = document.getElementById(`${id}-view`);
        if (streamView) {
          const titleEl = streamView.querySelector('[data-component="stream-title"]');
          const meaningEl = streamView.querySelector('[data-component="essence-meaning"]');
          const descriptionEl = streamView.querySelector('[data-component="stream-description"]');
          
          if (titleEl) titleEl.textContent = data.name;
          if (meaningEl) meaningEl.textContent = data.meaning;
          if (descriptionEl) descriptionEl.textContent = data.descriptions.stream;
        }
      });
    } catch (error) {
      this.logger.warn("Failed to set constellation descriptions", error);
    }
  }

  /**
   * Load data from external sources
   */
  async loadData() {
    try {
      this.logger.info("Loading application data");
      this.state.set("dataState", "loading");
      
      // Skip GitHub API in development mode (localhost)
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        this.logger.info("Development mode detected - skipping GitHub API and using empty data");
        this.state.set("dataState", "ready");
        this.logger.info("Application initialized in development mode");
        return [];
      }
      
      // Import the file scanner dynamically
      const { FileScanner } = await import("./file-scanner.js");
      const scanner = new FileScanner();
      
      // Configure repository
      scanner.setRepositoryConfig("Mnemeory", "mnemeory.github.io");
      
      // Test connection - but don't fail if GitHub API is unavailable
      const connectionTest = await scanner.testConnection();
      if (!connectionTest) {
        this.logger.warn("GitHub API not accessible - continuing with empty data");
        this.state.set("dataState", "ready");
        this.logger.info("Application initialized with empty data state");
        return [];
      }
      
      // Define scan paths mapped to constellations
      const scanPaths = [
        { path: "templates", constellation: "hatching-egg", seal: "open" },
        { path: "citizen", constellation: "qu-poxii", seal: "open" }
      ];
      
      // Scan each directory
      const allNodes = [];
      for (const pathConfig of scanPaths) {
        try {
          this.logger.info(`Scanning ${pathConfig.path} for ${pathConfig.constellation}`);
          const nodes = await scanner.scanDirectory(
            pathConfig.path, 
            pathConfig.constellation, 
            pathConfig.seal
          );
          allNodes.push(...nodes);
          this.logger.info(`Found ${nodes.length} files in ${pathConfig.path}`);
        } catch (error) {
          this.logger.warn(`Failed to scan ${pathConfig.path}`, error);
          // Continue with other directories
        }
      }
      
      // Process nodes
      const sortedNodes = scanner.sortNodes(allNodes);
      this.state.set("nodes", sortedNodes);

      // Note: Constellations will be populated when their views are shown
      this.logger.info(`Loaded ${sortedNodes.length} nodes - constellations will populate when viewed`);
      
      // Process specific node types
      this.processCitizenNodes(sortedNodes);
      this.processSessionNodes(sortedNodes);
      
      // Update data state
      this.state.set("dataState", "ready");
      this.logger.info(`Successfully loaded ${sortedNodes.length} nodes`);
      
      return sortedNodes;
    } catch (error) {
      this.logger.warn("Data loading failed - continuing with empty data", error);
      this.state.set("dataState", "ready");
      this.state.set("dataError", {
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
      
      // Return empty array instead of throwing - app can continue without external data
      return [];
    }
  }

  /**
   * Process citizen nodes
   */
  processCitizenNodes(allNodes) {
    const citizenNodes = allNodes.filter(
      node => node.constellation === "qu-poxii" && node.metadata?.type === "citizen"
    );
    
    if (citizenNodes.length > 0) {
      this.logger.info(`Found ${citizenNodes.length} citizen files`);
      this.state.set("citizenFiles", citizenNodes);
    } else {
      this.logger.info("No citizen files found");
    }
  }

  /**
   * Process session nodes
   */
  processSessionNodes(allNodes) {
    const sessionNodes = allNodes.filter(
      node => node.metadata?.type === "session"
    );
    
    if (sessionNodes.length > 0) {
      this.logger.info(`Found ${sessionNodes.length} session files`);
      this.state.set("sessionFiles", sessionNodes);
    } else {
      this.logger.info("No session files found");
    }
  }

  /**
   * Setup constellation population listener
   */
  setupConstellationPopulation() {
    // Listen for constellation view shown events
    document.addEventListener("app:constellation:shown", (event) => {
      const { constellation } = event.detail;
      this.populateConstellationView(constellation);
    });
  }

  /**
   * Populate constellation view with data
   * @param {string} constellation - Constellation ID
   */
  populateConstellationView(constellation) {
    if (!this.nodeManager) {
      this.logger.warn("Node manager not available for constellation population");
      return;
    }

    try {
      // Get nodes for this constellation from state
      const allNodes = this.state.get("nodes") || [];
      const constellationNodes = allNodes.filter(
        node => node.constellation === constellation
      );

      // Always populate constellation, even with empty data (will show empty state)
      this.logger.info(`Populating constellation ${constellation} with ${constellationNodes.length} nodes`);
      this.nodeManager.populateConstellation(constellation, constellationNodes);
    } catch (error) {
      this.logger.error(`Failed to populate constellation ${constellation}`, error);
    }
  }

  /**
   * Set up accessibility features
   */
  setupAccessibility() {
    // Focus management for view changes
    this.state.subscribe("currentView", newView => {
      // Announce view changes to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = `Navigated to ${newView.replace("-view", "").replace("-", " ")} section`;
      
      document.body.appendChild(announcement);
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    });
  }

  /**
   * Hide loading screen when initialization is complete
   */
  hideLoadingScreen() {
    const loadingVeil = document.querySelector("[data-js='loading-veil']");
    if (loadingVeil) {
      // Add hidden class for CSS transition
      loadingVeil.classList.add("hidden");
      loadingVeil.setAttribute("aria-hidden", "true");
      
      // Remove from DOM after transition completes
      setTimeout(() => {
        if (loadingVeil.parentNode) {
          loadingVeil.parentNode.removeChild(loadingVeil);
        }
      }, 1000); // Match CSS transition duration
      
      this.logger.info("Loading screen hidden");
    } else {
      this.logger.warn("Loading screen element not found");
    }
  }

  /**
   * Set error state on UI via class toggles
   */
  setErrorState(error) {
    const errorMessage = error?.message || "Application error";
    
    // Hide loading screen and show error instead
    this.hideLoadingScreen();
    
    // Find error container
    const errorContainer = document.querySelector("[data-js='app-error']");
    if (errorContainer) {
      // Update error state via class and attributes
      errorContainer.classList.add("is-visible");
      errorContainer.setAttribute("data-state", "error");
      
      // Set message via text content
      const messageEl = errorContainer.querySelector("[data-js='error-message']");
      if (messageEl) messageEl.textContent = errorMessage;
    }
  }

  /**
   * Get application state
   */
  getState() {
    return this.state.getAll();
  }

  /**
   * Get subsystem by name
   */
  getSubsystem(name) {
    const subsystems = {
      state: this.state,
      router: this.router,
      view: this.viewManager,
      nodes: this.nodeManager,
      starfield: this.starfieldManager,
      documents: this.documentSystem
    };
    
    return subsystems[name];
  }

  /**
   * Navigate to route
   */
  navigateTo(route) {
    if (this.router) {
      this.router.navigate(route);
    }
  }

  /**
   * Open node by ID
   */
  openNode(nodeId) {
    const nodes = this.state.get("nodes");
    if (!nodes) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (node && this.nodeManager) {
      this.nodeManager.openNode(node);
    }
  }

  /**
   * Get performance information
   */
  getPerformanceInfo() {
    return {
      isInitialized: this.isInitialized,
      currentView: this.state.get("currentView"),
      currentRoute: this.state.get("currentRoute"),
      nodeCount: this.state.get("nodes")?.length || 0,
      starfield: this.starfieldManager?.getPerformanceStats()
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clean up subsystems in reverse order
    if (this.router) this.router.destroy();
    if (this.viewManager) this.viewManager.destroy();
    if (this.starfieldManager) this.starfieldManager.destroy();
    if (this.nodeManager) this.nodeManager.destroy();
    if (this.documentSystem) this.documentSystem.destroy();
    
    this.logger.info("Application destroyed");
  }
}
