/**
 * Router System
 * Handles route changes, navigation, and view transitions
 * 
 * Provides centralized navigation control with no direct DOM styling
 */

import { Logger, EventUtils } from "./utilities.js";

export class Router {
  /**
   * @param {Object} state - Application state manager
   * @param {Object} viewManager - View orchestration system
   */
  constructor(state, viewManager) {
    this.state = state;
    this.viewManager = viewManager;
    this.logger = new Logger("Router");
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Handle initial route after a brief delay to ensure everything is ready
    setTimeout(() => {
      this.handleRouteChange();
    }, 100);
  }

  /**
   * Setup routing event listeners
   */
  setupEventListeners() {
    // Hash change events
    window.addEventListener("hashchange", () => {
      this.handleRouteChange();
    });

    // Handle data-nav elements
    document.addEventListener("click", event => {
      // Universal navigation attributes
      const navElement = event.target.closest("[data-nav]");
      if (navElement) {
        event.preventDefault();
        const target = navElement.getAttribute("data-nav");
        this.navigate(target);
        return;
      }
      
      // Cluster navigation
      const clusterNode = event.target.closest("[data-cluster]");
      if (clusterNode) {
        const cluster = clusterNode.getAttribute("data-cluster");
        if (cluster) {
          this.navigate(`#/${cluster}`);
          return;
        }
      }
      
      // Home navigation via protocol emblem
      const homeButton = event.target.closest("[data-component='home-button']");
      if (homeButton) {
        this.navigate("#/");
        return;
      }
      
      // Return navigation buttons
      const returnButton = event.target.closest("[data-component='flow-return']");
      if (returnButton) {
        const returnTo = returnButton.getAttribute("data-return-to");
        if (returnTo === "starfield") {
          this.navigate("#/");
        }
      }
    });

    // Handle keyboard navigation
    document.addEventListener("keydown", event => {
      // Return button keyboard activation
      if (event.target.matches("[data-component='flow-return']") && EventUtils.isActivationKey(event)) {
        event.preventDefault();
        const returnTo = event.target.getAttribute("data-return-to");
        if (returnTo === "starfield") {
          this.navigate("#/");
        }
      }
      
      // Home button keyboard activation
      if (event.target.matches("[data-component='home-button']") && 
          EventUtils.isActivationKey(event)) {
        event.preventDefault();
        this.navigate("#/");
      }
    });
  }

  /**
   * Navigate to a route
   * @param {string} path - Route path
   */
  navigate(path) {
    try {
      // Ensure proper hash format
      if (path.startsWith("#")) {
        window.location.hash = path;
      } else {
        window.location.hash = `#${path}`;
      }
      
      // Track navigation in state
      this.state.set("lastNavigation", {
        path,
        timestamp: Date.now()
      });
    } catch (error) {
      this.logger.error("Navigation error", error);
      // Fall back to home on navigation error
      window.location.hash = "#/";
    }
  }

  /**
   * Handle route changes
   */
  handleRouteChange() {
    try {
      const hash = window.location.hash || "#/";
      const route = hash.replace("#", "");
      
      // Update current route in state
      this.state.set("currentRoute", route);
      
      // Ensure view manager is available
      if (!this.viewManager) {
        this.logger.warn("ViewManager not available, deferring route change");
        return;
      }
      
      // Handle view transitions based on route
      if (route === "/") {
        this.viewManager.showStarfield();
      } else {
        const constellation = route.substring(1); // Remove leading slash
        
        // Validate constellation name to prevent errors
        if (constellation && constellation.trim() !== "") {
          this.logger.info(`Navigating to constellation: ${constellation}`);
          this.viewManager.showConstellation(constellation);
        } else {
          this.logger.warn(`Invalid constellation route: ${route}`);
          this.viewManager.showStarfield();
        }
      }
      
      // Trigger route change event for analytics or other systems
      this.triggerRouteChangeEvent(route);
    } catch (error) {
      this.logger.error("Route change error", error);
      // Fall back to showing starfield
      if (this.viewManager) {
        this.viewManager.showStarfield();
      }
    }
  }

  /**
   * Trigger custom event for route change
   * @param {string} route - Current route
   */
  triggerRouteChangeEvent(route) {
    const event = new CustomEvent("app:route:changed", {
      detail: { route, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }

  /**
   * Get current route
   * @returns {string} Current route
   */
  getCurrentRoute() {
    return this.state.get("currentRoute");
  }

  /**
   * Go back to previous route
   */
  goBack() {
    window.history.back();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.info("Router destroyed");
  }
}
