/**
 * View Manager
 * Orchestrates view composition and transitions
 * 
 * Handles all view updates through class toggles and data attributes.
 * No direct style manipulation is performed here.
 */

import { CONFIG } from "../config.js";
import { Logger } from "./shared-utilities.js";

export class ViewManager {
  /**
   * @param {Object} state - Application state manager
   */
  constructor(state) {
    this.state = state;
    this.logger = new Logger("ViewManager");
    this.views = new Map();
    this.currentViewId = null;
    this.transitionInProgress = false;
  }

  /**
   * Initialize view manager
   */
  async init() {
    try {
      this.logger.info("Initializing ViewManager");
      
      // Discover and register all views
      this.initializeViews();
      
      // Setup atmospheric system for view transitions
      this.initializeAtmosphericSystem();
      
      // Set initial view state and activate starfield by default
      this.state.set("viewManagerReady", true);
      
      // Activate the starfield view initially (should match HTML default)
      this.transitionToView("starfield-view");
      
      this.logger.info("ViewManager initialized");
      
      return true;
    } catch (error) {
      this.logger.error("ViewManager initialization failed", error);
      this.state.set("viewManagerReady", false);
      throw error;
    }
  }

  /**
   * Initialize and register all views
   */
  initializeViews() {
    // Find all view containers
    const viewElements = document.querySelectorAll("[data-view]");
    
    viewElements.forEach(element => {
      const viewId = element.getAttribute("data-view");
      if (viewId) {
        // Register view
        this.views.set(viewId, {
          id: viewId,
          element,
          isActive: false,
          type: element.getAttribute("data-view-type") || "standard"
        });
        
        this.logger.info(`Registered view: ${viewId}`);
      }
    });
    
    // Log summary of discovered views
    this.logger.info(`Discovered ${this.views.size} views`);
  }

  /**
   * Initialize atmospheric system for view transitions
   */
  initializeAtmosphericSystem() {
    // Find atmospheric system elements
    const atmosphericSystem = document.querySelector("[data-js='atmospheric-system']");
    if (!atmosphericSystem) {
      this.logger.warn("Atmospheric system not found");
      return;
    }
    
    // Register view-specific atmospheric overlays
    const atmospheres = document.querySelectorAll("[data-atmosphere]");
    atmospheres.forEach(element => {
      const constellation = element.getAttribute("data-atmosphere");
      if (constellation) {
        // Store reference to constellation-specific atmosphere
        this.logger.info(`Registered atmosphere for: ${constellation}`);
      }
    });
  }

  /**
   * Activate constellation-specific atmosphere
   * @param {string} constellation - Constellation ID
   */
  activateConstellationAtmosphere(constellation) {
    // Remove all active atmospheres first
    this.deactivateConstellationAtmosphere();
    
    // Find and activate the appropriate atmosphere
    const atmosphere = document.querySelector(`[data-atmosphere="${constellation}"]`);
    if (atmosphere) {
      // Toggle class to activate (no direct style manipulation)
      atmosphere.classList.add("is-active");
      
      // Set atmospheric data attributes
      const atmosphericSystem = document.querySelector("[data-js='atmospheric-system']");
      if (atmosphericSystem) {
        atmosphericSystem.setAttribute("data-active-atmosphere", constellation);
      }
      
      this.logger.info(`Activated atmosphere: ${constellation}`);
    } else {
      this.logger.warn(`No atmosphere found for: ${constellation}`);
    }
  }

  /**
   * Deactivate all constellation atmospheres
   */
  deactivateConstellationAtmosphere() {
    // Remove active class from all atmospheres
    const activeAtmospheres = document.querySelectorAll("[data-atmosphere].is-active");
    activeAtmospheres.forEach(element => {
      element.classList.remove("is-active");
    });
    
    // Clear atmospheric data attributes
    const atmosphericSystem = document.querySelector("[data-js='atmospheric-system']");
    if (atmosphericSystem) {
      atmosphericSystem.removeAttribute("data-active-atmosphere");
    }
  }

  /**
   * Show starfield view
   */
  showStarfield() {
    this.transitionToView("starfield-view");
    
    // Clear active constellation atmosphere
    this.deactivateConstellationAtmosphere();
    
    // Update state
    this.state.set("activeConstellation", null);
  }

  /**
   * Show constellation view
   * @param {string} constellation - Constellation ID
   */
  showConstellation(constellation) {
    // Validate constellation exists
    if (!CONFIG.constellations[constellation]) {
      this.logger.warn(`Invalid constellation: ${constellation}`);
      this.showStarfield();
      return;
    }
    
    // Get view ID for constellation
    const viewId = `${constellation}-view`;
    
    // Check if view exists
    if (!this.hasView(viewId)) {
      this.logger.warn(`View not found for constellation: ${constellation}`);
      this.showStarfield();
      return;
    }
    
    // Transition to view
    this.transitionToView(viewId);
    
    // Set atmosphere for constellation
    this.activateConstellationAtmosphere(constellation);
    
    // Update state
    this.state.set("activeConstellation", constellation);
  }

  /**
   * Transition to a specific view
   * @param {string} newViewId - ID of view to transition to
   * @returns {boolean} Whether transition was successful
   */
  transitionToView(newViewId) {
    // Don't transition if already on this view
    if (this.currentViewId === newViewId) {
      this.logger.info(`Already on view: ${newViewId}`);
      return false;
    }
    
    // Check if view exists
    if (!this.hasView(newViewId)) {
      this.logger.warn(`View not found: ${newViewId}`);
      return false;
    }
    
    // Don't allow concurrent transitions
    if (this.transitionInProgress) {
      this.logger.warn("Cannot transition while another transition is in progress");
      return false;
    }
    
    try {
      this.transitionInProgress = true;
      
      // Get previous view
      const previousViewId = this.currentViewId;
      const previousView = previousViewId ? this.views.get(previousViewId) : null;
      
      // Get new view
      const newView = this.views.get(newViewId);
      
      // Hide previous view
      if (previousView) {
        this.removeFocusFromView(previousView);
        previousView.isActive = false;
        previousView.element.classList.remove("is-active");
        previousView.element.setAttribute("aria-hidden", "true");
      }
      
      // Show new view
      newView.isActive = true;
      newView.element.classList.add("is-active");
      newView.element.setAttribute("aria-hidden", "false");
      
      // Set current view
      this.currentViewId = newViewId;
      
      // Update state
      this.state.set("currentView", newViewId);
      this.state.set("previousView", previousViewId);
      
      // Manage focus for accessibility
      this.manageFocusForView(newView);
      
      this.logger.info(`Transitioned to view: ${newViewId}`);
      return true;
    } catch (error) {
      this.logger.error(`View transition error for ${newViewId}`, error);
      return false;
    } finally {
      this.transitionInProgress = false;
    }
  }

  /**
   * Remove focus from a view
   * @param {Object} view - View object
   */
  removeFocusFromView(view) {
    if (!view || !view.element) return;
    
    // Find all focusable elements
    const focusableElements = view.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Remove focus
    focusableElements.forEach(element => {
      if (element === document.activeElement) {
        element.blur();
      }
    });
  }

  /**
   * Manage focus for new view
   * @param {Object} view - View object
   */
  manageFocusForView(view) {
    if (!view || !view.element) return;
    
    // Find first focusable element
    const firstFocusable = view.element.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Focus first focusable element or view container
    if (firstFocusable) {
      firstFocusable.focus();
    } else if (view.element.tabIndex >= 0) {
      view.element.focus();
    }
    
    // Announce view change for screen readers
    this.announceViewChange(view);
  }

  /**
   * Announce view change for screen readers
   * @param {Object} view - View object
   */
  announceViewChange(view) {
    const viewName = view.element.getAttribute("aria-label") || 
                    view.id.replace("-view", "").replace(/-/g, " ");
    
    // Create and append announcement element
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.classList.add("sr-only");
    announcement.textContent = `Navigated to ${viewName}`;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement is read
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Get current view
   * @returns {string|null} Current view ID
   */
  getCurrentView() {
    return this.currentViewId;
  }

  /**
   * Get view by ID
   * @param {string} viewId - View ID
   * @returns {Object|null} View object
   */
  getView(viewId) {
    return this.views.get(viewId) || null;
  }

  /**
   * Check if view exists
   * @param {string} viewId - View ID
   * @returns {boolean} Whether view exists
   */
  hasView(viewId) {
    return this.views.has(viewId);
  }

  /**
   * Get all views
   * @returns {Array} Array of view objects
   */
  getAllViews() {
    return Array.from(this.views.values());
  }

  /**
   * Hide all views
   */
  hideAllViews() {
    this.views.forEach(view => {
      view.isActive = false;
      view.element.classList.remove("is-active");
      view.element.setAttribute("aria-hidden", "true");
    });
    
    // Update state
    this.state.set("currentView", null);
    this.currentViewId = null;
  }

  /**
   * Refresh views after DOM updates
   */
  refreshViews() {
    // Re-initialize views
    this.initializeViews();
    
    // If a view is active, make sure it's properly shown
    if (this.currentViewId) {
      const currentView = this.views.get(this.currentViewId);
      if (currentView) {
        currentView.isActive = true;
        currentView.element.classList.add("is-active");
        currentView.element.setAttribute("aria-hidden", "false");
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.hideAllViews();
    this.views.clear();
    this.logger.info("ViewManager destroyed");
  }
}
