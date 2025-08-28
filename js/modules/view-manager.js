/**
 * View Manager
 * Handles view transitions and atmospheric effects
 */

import { Logger } from './utilities.js';
import { CONSTELLATIONS } from './config.js';

export class ViewManager {
  constructor(state) {
    this.state = state;
    this.logger = new Logger("ViewManager");
    this.views = new Map();
    this.currentViewId = null;
    this.transitionInProgress = false;
  }

  async init() {
    try {
      this.logger.info("Initializing ViewManager");
      
      // Discover all views
      this.initializeViews();
      
      // Initialize atmospheric system
      this.initializeAtmosphericSystem();
      
      // Set initial view
      const activeView = this.findActiveView();
      if (activeView) {
        this.currentViewId = activeView.id;
        this.state.set("currentView", activeView.id);
      } else {
        this.showView('starfield-view');
      }
      
      this.state.set("viewManagerReady", true);
      this.logger.info("ViewManager initialized");
      
      return true;
    } catch (error) {
      this.logger.error("ViewManager initialization failed", error);
      this.state.set("viewManagerReady", false);
      throw error;
    }
  }

  initializeViews() {
    const viewElements = document.querySelectorAll("[data-view]");
    
    viewElements.forEach(element => {
      const viewId = element.getAttribute("data-view");
      if (viewId) {
        const initialState = element.getAttribute("data-state");
        const isInitiallyActive = initialState === "active";
        
        this.views.set(viewId, {
          id: viewId,
          element,
          isActive: isInitiallyActive,
          type: element.getAttribute("data-view-type") || "standard"
        });
        
        // Apply initial classes
        if (isInitiallyActive) {
          element.classList.add("active");
          element.setAttribute("aria-hidden", "false");
        } else {
          element.classList.remove("active");
          element.setAttribute("aria-hidden", "true");
        }
      }
    });
    
    this.logger.info(`Discovered ${this.views.size} views`);
  }

  initializeAtmosphericSystem() {
    const atmosphericSystem = document.querySelector("[data-js='atmospheric-system']");
    if (!atmosphericSystem) {
      this.logger.warn("Atmospheric system not found");
      return;
    }
    
    const atmospheres = document.querySelectorAll("[data-atmosphere]");
    atmospheres.forEach(element => {
      const constellation = element.getAttribute("data-atmosphere");
      if (constellation) {
        this.logger.info(`Registered atmosphere for: ${constellation}`);
      }
    });
  }

  findActiveView() {
    return Array.from(this.views.values()).find(view => view.isActive);
  }

  showView(viewId) {
    if (this.currentViewId === viewId) {
      this.logger.info(`Already on view: ${viewId}`);
      return false;
    }
    
    if (!this.views.has(viewId)) {
      this.logger.warn(`View not found: ${viewId}`);
      return false;
    }
    
    if (this.transitionInProgress) {
      this.logger.warn("Transition already in progress");
      return false;
    }
    
    try {
      this.transitionInProgress = true;
      
      // Hide previous view
      if (this.currentViewId) {
        const previousView = this.views.get(this.currentViewId);
        if (previousView) {
          previousView.isActive = false;
          previousView.element.classList.remove("active");
          previousView.element.setAttribute("aria-hidden", "true");
        }
      }
      
      // Show new view
      const newView = this.views.get(viewId);
      newView.isActive = true;
      newView.element.classList.add("active");
      newView.element.setAttribute("aria-hidden", "false");
      
      // Update current view
      this.currentViewId = viewId;
      this.state.set("currentView", viewId);
      
      // Update atmosphere
      this.updateAtmosphere(viewId);
      
      // Manage focus
      this.manageFocus(newView);
      
      this.logger.info(`Transitioned to view: ${viewId}`);
      return true;
    } catch (error) {
      this.logger.error(`View transition error for ${viewId}`, error);
      return false;
    } finally {
      this.transitionInProgress = false;
    }
  }

  updateAtmosphere(viewId) {
    // Clear all atmospheres
    const atmospheres = document.querySelectorAll("[data-atmosphere].active");
    atmospheres.forEach(el => el.classList.remove("active"));
    
    // Extract constellation from view ID (e.g., "gnarled-tree-view" -> "gnarled-tree")
    const constellation = viewId.replace('-view', '');
    
    if (CONSTELLATIONS[constellation]) {
      const atmosphere = document.querySelector(`[data-atmosphere="${constellation}"]`);
      if (atmosphere) {
        atmosphere.classList.add("active");
        this.logger.info(`Activated atmosphere: ${constellation}`);
      }
    }
  }

  manageFocus(view) {
    if (!view || !view.element) return;
    
    // Find first focusable element
    const firstFocusable = view.element.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (firstFocusable) {
      firstFocusable.focus();
    } else if (view.element.tabIndex >= 0) {
      view.element.focus();
    }
    
    // Announce view change for screen readers
    this.announceViewChange(view);
  }

  announceViewChange(view) {
    const viewName = view.element.getAttribute("aria-label") || 
                    view.id.replace("-view", "").replace(/-/g, " ");
    
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.classList.add("sr-only");
    announcement.textContent = `Navigated to ${viewName}`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  getCurrentView() {
    return this.currentViewId;
  }

  hasView(viewId) {
    return this.views.has(viewId);
  }

  destroy() {
    this.views.clear();
    this.logger.info("ViewManager destroyed");
  }
}