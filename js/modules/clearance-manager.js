/**
 * Clearance Management System
 * Handles authentication status and security clearance indicators
 * 
 * Centralizes access control with standardized class and attribute-based UI updates
 */

import { CONFIG } from "../config.js";
import { Logger, ToastManager } from "./shared-utilities.js";

export class ClearanceManager {
  /**
   * @param {Object} state - Application state manager
   */
  constructor(state) {
    this.state = state;
    this.logger = new Logger("ClearanceManager");
    this.clearanceLevels = ["open", "filed", "black-star"];
    
    // Initialize clearance state
    this.initializeClearance();
  }

  /**
   * Initialize clearance state
   */
  initializeClearance() {
    try {
      // Show initial clearance status
      this.showClearanceStatus();
      
      // Set default clearance level in state
      this.state.set("clearanceLevel", "black-star");
      
      this.logger.info("Clearance system initialized");
    } catch (error) {
      this.logger.error("Failed to initialize clearance system", error);
    }
  }

  /**
   * Display clearance status via toasts and classes
   */
  showClearanceStatus() {
    // Find clearance status indicator element
    const statusIndicator = document.querySelector("[data-js='clearance-status']");
    if (statusIndicator) {
      // Set clearance class and data attribute
      statusIndicator.className = "clearance-status clearance-status--diplomatic";
      statusIndicator.setAttribute("data-clearance", "black-star");
    }
    
    // Show welcome toast for Consular/Aide access
    const message = this.getClearanceWelcomeMessage();
    ToastManager.success(message, 4000);
  }

  /**
   * Get welcome message based on clearance level
   * @returns {string} Welcome message
   */
  getClearanceWelcomeMessage() {
    return "CLEARANCE AUTHENTICATED • Grand Council Diplomatic Access • Welcome, Consular Officer";
  }

  /**
   * Show clearance level warning via toast and class
   * @param {string} level - Clearance level
   * @param {string} message - Warning message
   */
  showClearanceWarning(level, message) {
    const warningMessage = `
      <strong>CLEARANCE ALERT • ${level.toUpperCase()}</strong><br>
      ${message}
    `;
    ToastManager.warning(warningMessage);
    
    // Update clearance warning indicator
    const warningIndicator = document.querySelector("[data-js='clearance-warning']");
    if (warningIndicator) {
      warningIndicator.classList.add("is-active");
      warningIndicator.setAttribute("data-level", level);
      
      // Auto-hide after delay
      setTimeout(() => {
        warningIndicator.classList.remove("is-active");
      }, 5000);
    }
  }

  /**
   * Show access denied message
   * @param {string} resource - Resource that was denied
   */
  showAccessDenied(resource) {
    const errorMessage = `
      <strong>ACCESS DENIED</strong><br>
      Insufficient diplomatic clearance for ${resource} • Contact Kala Command for authorization upgrade
    `;
    ToastManager.error(errorMessage);
    
    // Update access denied indicator
    const accessDeniedIndicator = document.querySelector("[data-js='access-denied']");
    if (accessDeniedIndicator) {
      accessDeniedIndicator.classList.add("is-active");
      accessDeniedIndicator.setAttribute("data-resource", resource);
      
      // Auto-hide after delay
      setTimeout(() => {
        accessDeniedIndicator.classList.remove("is-active");
      }, 5000);
    }
  }

  /**
   * Check if user has required clearance level
   * @param {string} requiredLevel - Required clearance level
   * @returns {boolean} Whether user has clearance
   */
  hasClearance(requiredLevel) {
    // Get current clearance level from state
    const currentLevel = this.getCurrentClearanceLevel();
    
    // All levels are currently allowed for demo purposes
    const allowedLevels = ["open", "filed", "black-star"];
    return allowedLevels.includes(requiredLevel);
  }

  /**
   * Get current clearance level
   * @returns {string} Current clearance level
   */
  getCurrentClearanceLevel() {
    return this.state.get("clearanceLevel") || "black-star";
  }

  /**
   * Validate access to resource
   * @param {string} resource - Resource to access
   * @param {string} requiredLevel - Required clearance level
   * @returns {boolean} Whether access is granted
   */
  validateAccess(resource, requiredLevel) {
    if (this.hasClearance(requiredLevel)) {
      this.logAccess(resource, "granted");
      return true;
    } else {
      this.logAccess(resource, "denied");
      this.showAccessDenied(resource);
      return false;
    }
  }

  /**
   * Log access attempt
   * @param {string} resource - Resource accessed
   * @param {string} status - Access status (granted/denied)
   */
  logAccess(resource, status) {
    const timestamp = new Date().toISOString();
    const currentLevel = this.getCurrentClearanceLevel();
    
    this.logger.info(`Access ${status} - Resource: ${resource} - Level: ${currentLevel}`);
    
    // Track in state for analytics
    const accessLog = this.state.get("accessLog") || [];
    accessLog.push({
      resource,
      status,
      timestamp,
      level: currentLevel
    });
    
    this.state.set("accessLog", accessLog);
  }

  /**
   * Show neural link status
   * @param {string} status - Link status (active/unstable/disconnected)
   */
  showNeuralLinkStatus(status = "active") {
    const statusMessages = {
      active: "Diplomatic psionic link to Grand Council active • Nlom resonance stable",
      unstable: "Diplomatic psionic link fluctuating • Nlom interference detected",
      disconnected: "Diplomatic psionic link severed • Operating in autonomous mode"
    };
    
    const toastType = status === "active" ? "success" : 
                      status === "unstable" ? "warning" : "error";
    
    const message = `
      <strong>NEURAL LINK STATUS</strong><br>
      ${statusMessages[status] || statusMessages.active}
    `;
    
    ToastManager.show(message, toastType, 4000);
    
    // Update neural link status indicator
    const linkIndicator = document.querySelector("[data-js='neural-link-status']");
    if (linkIndicator) {
      // Remove all status classes
      linkIndicator.classList.remove("is-active", "is-unstable", "is-disconnected");
      
      // Add appropriate status class
      linkIndicator.classList.add(`is-${status}`);
      linkIndicator.setAttribute("data-status", status);
    }
  }

  /**
   * Format clearance level for display
   * @param {string} seal - Clearance seal
   * @param {string} cluster - Constellation cluster
   * @returns {string} Formatted clearance level
   */
  formatClearanceLevel(seal, cluster) {
    switch (seal) {
      case "open":
        return "GENERAL ACCESS";
      case "filed":
        return "RESTRICTED ARCHIVES";
      case "black-star":
        return "DIPLOMATIC CLEARANCE";
      default:
        return "UNCLASSIFIED";
    }
  }

  /**
   * Get clearance info for UI display
   * @param {string} seal - Clearance seal
   * @returns {Object} Clearance info
   */
  getClearanceInfo(seal) {
    const clearanceMap = {
      "open": {
        class: "clearance-open",
        label: "Open"
      },
      "filed": {
        class: "clearance-filed",
        label: "Filed"
      },
      "black-star": {
        class: "clearance-diplomatic",
        label: "Diplomatic"
      }
    };
    
    return clearanceMap[seal] || clearanceMap.open;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.info("ClearanceManager destroyed");
  }
}
