/**
 * Main Application Controller - NlomInterface
 * Central orchestration system for the constellation-based interface
 * Coordinates all subsystems and manages application lifecycle
 */

import { StarfieldManager } from "./starfield-manager.js";

import { PaperDocumentEditor } from "../paper-editor.js";
import { AppState } from "./state-manager.js";
import { Router } from "./router.js";
import { ViewManager } from "./view-manager.js";
import { NodeManager } from "./node-manager.js";
import { ClearanceManager } from "./clearance-manager.js";
import {
  CONSTELLATIONS,
  SITE_CONFIG,
  getSiteTitle,
  getSiteDescription,
  getAssetPath,
  getInterfaceText,
  getThreeJSImportMap,
  getConstellationDescription,
  createStandardError,
  logError,
  getLoadingSubtitle,
  getClearanceMatrix,
  getErrorMessage,
  getErrorTemplate,
  getSelector,
} from "../config.js";

export class NlomInterface {
  constructor() {
    this.state = new AppState();
    this.starfieldManager = null;

    this.viewManager = null;
    this.router = null;
    this.nodeManager = null;
    this.clearanceManager = null;
    this.paperEditor = null;

    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log("Initializing Nlom Interface...");

      // First populate HTML with configuration values
      this.populateHTMLConfiguration();

      this.setDynamicText();

      // Show loading screen
      this.showLoading();

      // Initialize core systems
      this.viewManager = new ViewManager(this.state);
      this.paperEditor = new PaperDocumentEditor();
      this.nodeManager = new NodeManager(this.state, this.paperEditor);
      this.clearanceManager = new ClearanceManager(this.state);

      // Initialize modal paper editor
      this.paperEditor.init("modal", {
        readOnly: false,
        defaultName: "document.txt",
      });

      // Initialize starfield
      this.starfieldManager = new StarfieldManager();
      await this.starfieldManager.init();

      // Set up starfield cluster activation
      this.starfieldManager.setClusterActivationCallback((cluster) => {
        this.router.navigate(`#/${cluster}`);
      });

      // Load data
      await this.loadData();

      // Initialize router (must be last to handle initial route)
      this.router = new Router(this.state, this.viewManager);

      // Setup accessibility features
      this.setupAccessibility();

      // Hide loading screen
      this.hideLoading();

      this.isInitialized = true;
      console.log("Nlom Interface initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Nlom Interface:", error);
      this.showError(getErrorMessage("psionicFailure"));
    }
  }

  /**
   * Populate HTML elements with configuration values
   */
  populateHTMLConfiguration() {
    try {
      const { meta, assets, cdn } = SITE_CONFIG;
      
      // Meta information
      const pageTitle = document.getElementById('page-title');
      const metaDescription = document.getElementById('meta-description');
      const metaAuthor = document.getElementById('meta-author');
      const canonicalLink = document.getElementById('canonical-link');
      
      if (pageTitle) pageTitle.textContent = meta.siteName;
      if (metaDescription) metaDescription.setAttribute('content', meta.description);
      if (metaAuthor) metaAuthor.setAttribute('content', meta.author);
      if (canonicalLink) canonicalLink.setAttribute('href', meta.canonicalUrl);
      
      // Open Graph
      const ogTitle = document.getElementById('og-title');
      const ogDescription = document.getElementById('og-description');
      const ogUrl = document.getElementById('og-url');
      
      if (ogTitle) ogTitle.setAttribute('content', meta.ogTitle);
      if (ogDescription) ogDescription.setAttribute('content', meta.ogDescription);
      if (ogUrl) ogUrl.setAttribute('content', meta.canonicalUrl);
      
      // Assets
      const faviconLink = document.getElementById('favicon-link');
      if (faviconLink) faviconLink.setAttribute('href', assets.favicon);
      
      // Fonts
      const fontPreconnect1 = document.getElementById('font-preconnect-1');
      const fontPreconnect2 = document.getElementById('font-preconnect-2');
      const fontStylesheet = document.getElementById('font-stylesheet');
      
      if (fontPreconnect1) fontPreconnect1.setAttribute('href', cdn.fonts.google);
      if (fontPreconnect2) fontPreconnect2.setAttribute('href', cdn.fonts.googleStatic);
      if (fontStylesheet) {
        fontStylesheet.setAttribute('href', 
          `${cdn.fonts.google}/css2?family=${cdn.fonts.fontFamilies}`);
      }
      
      // Import map for Three.js
      const importMapScript = document.getElementById('importmap-script');
      if (importMapScript) {
        const importMap = getThreeJSImportMap();
        importMapScript.textContent = JSON.stringify(importMap, null, 2);
      }
      
      // Populate constellation descriptions
      this.populateConstellationDescriptions();
      
    } catch (error) {
      console.warn('Failed to populate HTML configuration:', error);
    }
  }

  /**
   * Populate constellation descriptions from centralized configuration
   */
  populateConstellationDescriptions() {
    try {
      // Map constellation IDs to their accessibility description element IDs
      const accessibilityIdMap = {
        'gnarled-tree': 'tree-desc',
        'qu-poxii': 'bond-desc',
        'star-chanter': 'chant-desc',
        'hatching-egg': 'egg-desc',
        'void': 'void-desc'
      };

      Object.keys(CONSTELLATIONS).forEach(constellationId => {
        const constellation = CONSTELLATIONS[constellationId];
        
        // Populate accessibility descriptions
        const accessibilityId = accessibilityIdMap[constellationId];
        if (accessibilityId) {
          const accessibilityDesc = document.getElementById(accessibilityId);
          if (accessibilityDesc) {
            accessibilityDesc.textContent = constellation.descriptions.accessibility;
          }
        }
        
        // Populate stream views
        const streamView = document.getElementById(`${constellationId}-view`);
        if (streamView) {
          const titleElement = streamView.querySelector('.stream-title');
          const meaningElement = streamView.querySelector('.essence-meaning');
          const descriptionElement = streamView.querySelector('.stream-description');
          
          if (titleElement) titleElement.textContent = constellation.name;
          if (meaningElement) meaningElement.textContent = constellation.meaning;
          if (descriptionElement) descriptionElement.textContent = constellation.descriptions.stream;
        }
      });
    } catch (error) {
      console.warn('Failed to populate constellation descriptions:', error);
    }
  }

  setDynamicText() {
    const loading = document.querySelector(getSelector("loadingClearance"));
    if (loading) loading.textContent = getLoadingSubtitle();
    const matrix = document.querySelector(getSelector("clearanceMatrix"));
    if (matrix) matrix.textContent = getClearanceMatrix();
  }

  /**
   * Load data from file system
   */
  async loadData() {
    try {
      // Import the file scanner
      const { FileScanner } = await import("./file-scanner.js");
      const scanner = new FileScanner();

      // Configure GitHub repository settings
      // These should match your actual GitHub repository
      scanner.setGitHubConfig('Mnemeory', 'mnemeory.github.io');
      
      // Log repository configuration
      const repoInfo = scanner.getRepositoryInfo();
      console.log('GitHub repository configuration:', repoInfo);

      // Test GitHub API connection first
      console.log('Testing GitHub API connection...');
      const connectionTest = await scanner.testGitHubConnection();
      if (!connectionTest) {
        throw new Error('Failed to connect to GitHub API. Please check your repository configuration and internet connection.');
      }

      // Define the directories to scan based on the user's naming conventions
      // Map folder paths to constellation IDs and seals
      const scanPaths = [
        { path: 'filed', constellation: 'gnarled-tree', seal: 'filed' },
        { path: 'templates', constellation: 'hatching-egg', seal: 'open' },
        { path: 'citizen', constellation: 'qu-poxii', seal: 'open' }
      ];

      const allNodes = [];

      // Scan each directory for files
      for (const pathConfig of scanPaths) {
        try {
          console.log(`\n--- Scanning ${pathConfig.path} directory ---`);
          const nodes = await scanner.scanDirectory(
            pathConfig.path,
            pathConfig.constellation,
            pathConfig.seal
          );
          allNodes.push(...nodes);
          console.log(`✅ Scanned ${pathConfig.path}: found ${nodes.length} files`);
        } catch (error) {
          console.warn(`❌ Could not scan directory ${pathConfig.path}:`, error);
          // Continue with other directories even if one fails
        }
      }

      // Sort and group nodes appropriately
      const sortedNodes = scanner.sortNodes(allNodes);
      this.state.set("nodes", sortedNodes);

      // Populate constellations with data
      Object.keys(CONSTELLATIONS).forEach((constellation) => {
        this.nodeManager.populateConstellation(constellation, sortedNodes);
      });

      console.log(`\n🎉 Successfully loaded ${sortedNodes.length} nodes from GitHub repository`);
      console.log('Node summary:', sortedNodes.map(node => ({
        name: node.name,
        constellation: node.constellation,
        seal: node.seal
      })));
      
    } catch (error) {
      console.error('❌ Data loading failed:', error);
      const standardError = createStandardError(
        getErrorMessage("dataLoadError"),
        error,
        error.status || "DATA_LOAD_ERROR"
      );
      logError(standardError, "DataLoader");
      this.showError(standardError.message);
    }
  }

  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    // Focus management for single-page app
    this.state.subscribe("currentView", (newView) => {
      // Announce view changes to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = `Navigated to ${newView
        .replace("-view", "")
        .replace("-", " ")} section`;

      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    });
  }

  /**
   * Show loading screen
   */
  showLoading() {
    const loadingVeil = document.querySelector(getSelector("loadingVeil"));
    if (loadingVeil) {
      loadingVeil.classList.remove("hidden");
    }
  }

  /**
   * Hide loading screen
   */
  hideLoading() {
    const loadingVeil = document.querySelector(getSelector("loadingVeil"));
    if (loadingVeil) {
      loadingVeil.classList.add("hidden");
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Replace loading content with error
    const loadingContent = document.querySelector(".loading-content");
    if (loadingContent) {
      loadingContent.innerHTML = getErrorTemplate("psionicFailure", { message });
    }
  }

  /**
   * Get application state
   */
  getState() {
    return this.state.getAll();
  }

  /**
   * Get specific subsystem
   */
  getSubsystem(name) {
    const subsystems = {
      state: this.state,
      starfield: this.starfieldManager,
      view: this.viewManager,
      router: this.router,
      nodes: this.nodeManager,
      clearance: this.clearanceManager,
      paper: this.paperEditor,
    };

    return subsystems[name];
  }

  /**
   * Check if application is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get performance information
   */
  getPerformanceInfo() {
    return {
      isInitialized: this.isInitialized,
      starfield: this.starfieldManager?.getPerformanceStats(),
      currentView: this.state.get("currentView"),
      currentRoute: this.state.get("currentRoute"),
      nodeCount: this.state.get("nodes")?.length || 0,
    };
  }

  /**
   * Navigate to a specific route
   */
  navigateTo(route) {
    if (this.router) {
      this.router.navigate(route);
    }
  }

  /**
   * Open a specific node by ID
   */
  openNode(nodeId) {
    const nodes = this.state.get("nodes");
    if (!nodes) return;

    const node = nodes.find((n) => n.id === nodeId);
    if (node && this.nodeManager) {
      this.nodeManager.openNode(node);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.starfieldManager) {
      this.starfieldManager.destroy();
    }

    if (this.nodeManager) {
      this.nodeManager.destroy();
    }

    if (this.viewManager) {
      this.viewManager.destroy();
    }

    if (this.router) {
      this.router.destroy();
    }

    if (this.clearanceManager) {
      this.clearanceManager.destroy();
    }

    console.log("Nlom Interface destroyed");
  }
}
