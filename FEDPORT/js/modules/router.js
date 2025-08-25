/**
 * Router System for SPA Navigation
 * Handles route changes, navigation, and view transitions
 */

import { ROUTES, getSelector } from "../config.js";

export class Router {
  constructor(state, viewManager) {
    this.state = state;
    this.viewManager = viewManager;
    this.setupEventListeners();

    // Handle initial route
    this.handleRouteChange();
  }

  /**
   * Setup routing event listeners
   */
  setupEventListeners() {
    // Hash change events
    window.addEventListener("hashchange", () => {
      this.handleRouteChange();
    });

    // Handle cluster navigation in flowing 2D mode
    document.addEventListener("click", (event) => {
      if (
        event.target.matches(".liquid-node") ||
        event.target.closest(".liquid-node")
      ) {
        const node = event.target.closest(".liquid-node");
        const cluster = node.dataset.cluster;
        this.navigate(`#/${cluster}`);
      }
    });

    // Handle protocol emblem click for home navigation
    document.addEventListener("click", (event) => {
      if (
        event.target.matches(getSelector('protocolHomeButton')) ||
        event.target.closest(getSelector('protocolHomeButton'))
      ) {
        this.navigate("#/");
      }
    });

    // Handle return navigation buttons
    document.addEventListener("click", (event) => {
      if (event.target.closest(".flow-return")) {
        const button = event.target.closest(".flow-return");
        const returnTo = button.dataset.returnTo;

        if (returnTo === "starfield") {
          this.navigate("#/");
        }
      }
    });

    // Handle keyboard navigation for return buttons
    document.addEventListener("keydown", (event) => {
      if (
        event.target.matches(".flow-return") &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        const returnTo = event.target.dataset.returnTo;

        if (returnTo === "starfield") {
          this.navigate("#/");
        }
      }
    });

    // Handle keyboard navigation for protocol home button
    document.addEventListener("keydown", (event) => {
      if (
        event.target.matches(getSelector('protocolHomeButton')) &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        this.navigate("#/");
      }
    });
  }

  /**
   * Navigate to a route
   */
  navigate(hash) {
    try {
      if (hash.startsWith("#")) {
        window.location.hash = hash;
      } else {
        window.location.hash = `#${hash}`;
      }
    } catch (error) {
      console.error("Navigation error:", error, "Hash:", hash);
      // Fallback to home on navigation error
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

      this.state.set("currentRoute", route);

      // Ensure view manager is available
      if (!this.viewManager) {
        console.warn("ViewManager not available, deferring route change");
        return;
      }

      // Handle view transitions - pure mind web navigation
      if (route === "/") {
        this.viewManager.showStarfield();
      } else {
        const constellation = route.substring(1); // Remove leading slash

        // Validate constellation name to prevent null/undefined errors
        if (constellation && constellation.trim() !== "") {
          console.log("Navigating to constellation:", constellation);
          this.viewManager.showConstellation(constellation);
        } else {
          console.warn("Invalid constellation route:", route);
          this.viewManager.showStarfield();
        }
      }
    } catch (error) {
      console.error("Route change error:", error);
      // Fallback to showing starfield
      if (this.viewManager) {
        this.viewManager.showStarfield();
      }
    }
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.state.get("currentRoute");
  }

  /**
   * Get current view
   */
  getCurrentView() {
    return this.state.get("currentView");
  }

  /**
   * Check if route is valid
   */
  isValidRoute(route) {
    return ROUTES.hasOwnProperty(route);
  }

  /**
   * Go back to previous route
   */
  goBack() {
    window.history.back();
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    // Note: We don't remove these listeners as they're global and may be used by other parts
    // In a real implementation, we'd need a more sophisticated event management system
    console.log("Router destroyed");
  }
}
