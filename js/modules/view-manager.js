/**
 * View Manager
 * Handles view transitions and atmospheric effects
 */

import { Logger } from './utilities.js';
import { CONSTELLATIONS } from '../config.js';

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
        
        // Apply initial data attributes
        if (isInitiallyActive) {
          element.setAttribute("aria-hidden", "false");
          element.setAttribute("data-state", "active");
        } else {
          element.setAttribute("aria-hidden", "true");
          element.setAttribute("data-state", "hidden");
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
          previousView.element.setAttribute("aria-hidden", "true");
          previousView.element.setAttribute("data-state", "hidden");
        }
      }
      
      // Show new view
      const newView = this.views.get(viewId);
      newView.isActive = true;
      newView.element.setAttribute("aria-hidden", "false");
      newView.element.setAttribute("data-state", "active");
      
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

  // Convenience wrappers used by Router
  showStarfield() {
    this.showView('starfield-view');
    // Ensure we reset atmospheres when returning to starfield
    this.resetAllAtmospheres();
  }

  showConstellation(constellation) {
    const viewId = `${constellation}-view`;
    const didShow = this.showView(viewId);
    if (!didShow) return false;

    // Populate stream header content
    const data = CONSTELLATIONS[constellation];
    if (data) {
      const viewEl = this.views.get(viewId)?.element;
      if (viewEl) {
        const titleEl = viewEl.querySelector('[data-component="stream-title"]');
        const meaningEl = viewEl.querySelector('[data-component="essence-meaning"]');
        const descEl = viewEl.querySelector('[data-component="stream-description"]');
        if (titleEl) titleEl.textContent = data.name || '';
        if (meaningEl) meaningEl.textContent = data.meaning || '';
        if (descEl) descEl.textContent = data.descriptions?.stream || '';
      }
    }
    return true;
  }

  updateAtmosphere(viewId) {
    // First reset all atmospheric elements
    this.resetAllAtmospheres();
    
    // Extract constellation from view ID (e.g., "gnarled-tree-view" -> "gnarled-tree")
    const constellation = viewId.replace('-view', '');
    
    // If this is not a constellation view, we're done after reset
    if (!CONSTELLATIONS[constellation]) return;
    
    // Update specific atmospheric element
    const atmosphere = document.querySelector(`[data-atmosphere="${constellation}"]`);
    if (atmosphere) {
      atmosphere.setAttribute("data-state", "active");
      this.logger.info(`Activated atmosphere: ${constellation}`);
    }
    
    // Update constellation atmosphere with theme class
    const conAtmosphere = document.getElementById('constellation-atmosphere');
    if (conAtmosphere) {
      // Set appropriate theme attribute based on constellation
      conAtmosphere.setAttribute("data-theme", constellation);
      conAtmosphere.setAttribute("data-state", "active");
      
      // Add theme attribute to the root body element to affect all child components
      document.body.setAttribute('data-theme', constellation);
    }
  }
  
  resetAllAtmospheres() {
    // Clear all specific atmospheres
    const atmospheres = document.querySelectorAll("[data-atmosphere][data-state='active']");
    atmospheres.forEach(el => el.removeAttribute("data-state"));
    
    // Clear constellation atmosphere
    const conAtmosphere = document.getElementById('constellation-atmosphere');
    if (conAtmosphere) {
      conAtmosphere.removeAttribute('data-theme');
      conAtmosphere.removeAttribute('data-state');
    }
    
    // Remove theme from body
    document.body.removeAttribute('data-theme');
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
    announcement.setAttribute("data-component", "sr-only");
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