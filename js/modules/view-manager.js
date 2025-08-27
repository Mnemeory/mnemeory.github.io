/**
 * View Management System
 * Handles transitions between different application views
 */

import { ROUTES, ANIMATION_CONFIG, CONSTANTS, SITE_CONFIG } from "../config.js";

export class ViewManager {
  constructor(state) {
    this.state = state;
    this.currentView = null;
    this.views = new Map();
    
    // Atmospheric system properties
    this.atmosphereElement = null;
    this.constellationThemes = {
      'tree': 'tree-theme',
      'qu-poxii': 'bond-theme', 
      'chant': 'chant-theme',
      'egg': 'egg-theme',
      'void': 'void-theme'
    };

    this.initializeViews();
    this.initializeAtmosphericSystem();
  }

  /**
   * Initialize view elements
   */
  initializeViews() {
    // Register all view elements
    Object.values(ROUTES).forEach((viewId) => {
      const element = document.getElementById(viewId);
      if (element) {
        this.views.set(viewId, element);
      }
    });
  }

  /**
   * Initialize atmospheric system
   */
  initializeAtmosphericSystem() {
    this.atmosphereElement = document.querySelector(SITE_CONFIG.selectors.constellationAtmosphere);
    if (!this.atmosphereElement) {
      console.warn('Constellation atmosphere element not found');
    }
  }

  /**
   * Activate constellation atmosphere theme
   */
  activateConstellationAtmosphere(constellation) {
    if (!this.atmosphereElement) return;
    
    // Remove all existing theme classes
    Object.values(this.constellationThemes).forEach(theme => {
      this.atmosphereElement.classList.remove(theme);
    });
    
    // Add constellation-specific theme
    const themeClass = this.constellationThemes[constellation];
    if (themeClass) {
      this.atmosphereElement.classList.add(themeClass);
      this.atmosphereElement.classList.add('active');
      console.log(`Activated ${constellation} atmosphere theme: ${themeClass}`);
    }
  }

  /**
   * Deactivate constellation atmosphere
   */
  deactivateConstellationAtmosphere() {
    if (!this.atmosphereElement) return;
    
    // Remove all theme classes and active state
    Object.values(this.constellationThemes).forEach(theme => {
      this.atmosphereElement.classList.remove(theme);
    });
    this.atmosphereElement.classList.remove('active');
    console.log('Deactivated constellation atmosphere');
  }

  /**
   * Show starfield view (home)
   */
  showStarfield() {
    this.deactivateConstellationAtmosphere();
    this.transitionToView("starfield-view");
  }

  /**
   * Show constellation view
   */
  showConstellation(constellation) {
    // Validate constellation parameter
    if (!constellation || typeof constellation !== "string") {
      console.warn("Invalid constellation parameter:", constellation);
      this.showStarfield();
      return;
    }

    const viewId = `${constellation}-view`;

    if (this.views.has(viewId)) {
      this.activateConstellationAtmosphere(constellation);
      this.transitionToView(viewId);
    } else {
      console.warn(
        `View not found: ${viewId}. Available views:`,
        Array.from(this.views.keys())
      );
      this.showStarfield();
    }
  }

  /**
   * Transition between views with fluid animation
   */
  transitionToView(newViewId) {
    const newView = this.views.get(newViewId);
    if (!newView) return;

    const currentView = this.currentView;

    // Fluid transition
    if (currentView && currentView !== newView) {
      // Remove focus from current view before hiding
      this.removeFocusFromView(currentView);

      // Flow out current view
      currentView.classList.remove("active");
      currentView.setAttribute("aria-hidden", "true");
      currentView.setAttribute("inert", "");

      setTimeout(() => {
        currentView.classList.add('view-transition-reset');
      }, CONSTANTS.TENDRIL_ANIMATION_DURATION);
    }

    // Flow in new view
    setTimeout(
      () => {
        newView.classList.add("active");
        newView.setAttribute("aria-hidden", "false");
        newView.removeAttribute("inert");

        // Trigger reflow for CSS transitions
        newView.offsetHeight;
      },
      currentView ? ANIMATION_CONFIG.view : 0
    );

    this.currentView = newView;
    this.state.set("currentView", newViewId);
  }

  /**
   * Remove focus from view elements to prevent aria-hidden conflicts
   */
  removeFocusFromView(view) {
    // Find all focusable elements in the view
    const focusableElements = view.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), canvas[tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element) => {
      if (element === document.activeElement) {
        // Move focus to the new view or body if no new view yet
        const targetView =
          this.currentView !== view ? this.currentView : document.body;
        if (targetView && targetView !== document.body) {
          // Find first focusable element in target view
          const firstFocusable = targetView.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), canvas[tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            targetView.focus();
          }
        } else {
          document.body.focus();
        }
      }
    });
  }

  /**
   * Get current view element
   */
  getCurrentView() {
    return this.currentView;
  }

  /**
   * Get view element by ID
   */
  getView(viewId) {
    return this.views.get(viewId);
  }

  /**
   * Check if view exists
   */
  hasView(viewId) {
    return this.views.has(viewId);
  }

  /**
   * Get all registered views
   */
  getAllViews() {
    return Array.from(this.views.keys());
  }

  /**
   * Hide all views
   */
  hideAllViews() {
    this.views.forEach((view) => {
      // Remove focus before hiding
      this.removeFocusFromView(view);

      view.classList.remove("active");
      view.setAttribute("aria-hidden", "true");
      view.setAttribute("inert", "");
    });
    this.currentView = null;
  }

  /**
   * Refresh view registrations (useful if DOM changes)
   */
  refreshViews() {
    this.views.clear();
    this.initializeViews();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.hideAllViews();
    this.deactivateConstellationAtmosphere();
    this.views.clear();
    this.currentView = null;
    this.atmosphereElement = null;
    console.log("ViewManager destroyed");
  }
}
