/**
 * Clearance Management for RP Elements
 * Handles authentication status and security clearance indicators
 */

import { CONSTANTS, getClearanceWelcome } from "../config.js";
import { ToastManager } from "./shared-utilities.js";

export class ClearanceManager {
  constructor(state) {
    this.state = state;
    this.initializeClearanceIndicators();
  }

  /**
   * Initialize clearance indicators across the interface
   */
  initializeClearanceIndicators() {
    // Show clearance status on load
    this.showClearanceStatus();
  }

  /**
   * Display clearance status indicators
   */
  showClearanceStatus() {
    // Show welcome toast for Consular/Aide access
    const message = getClearanceWelcome();
    ToastManager.success(message, 4000);
  }

  /**
   * Show clearance level warning
   */
  showClearanceWarning(level, message) {
    const warningMessage = `
      <strong>CLEARANCE ALERT • ${level.toUpperCase()}</strong><br>
      ${message}
    `;
    ToastManager.warning(warningMessage);
  }

  /**
   * Show access denied message
   */
  showAccessDenied(resource) {
    const errorMessage = `
      <strong>ACCESS DENIED</strong><br>
      Insufficient diplomatic clearance for ${resource} • Contact Kala Command for authorization upgrade
    `;
    ToastManager.error(errorMessage);
  }

  /**
   * Check if user has required clearance level
   */
  hasClearance(requiredLevel) {
    // In a real implementation, this would check actual user permissions
    // For this demo, we assume Consular/Aide level access
    const allowedLevels = ["open", "filed", "black-star"];
    return allowedLevels.includes(requiredLevel);
  }

  /**
   * Get current clearance level
   */
  getCurrentClearanceLevel() {
    // For demo purposes, return highest available clearance
    return "black-star"; // Diplomatic Aide level
  }

  /**
   * Validate access to resource
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
   */
  logAccess(resource, status) {
    const timestamp = new Date().toISOString();
    const currentLevel = this.getCurrentClearanceLevel();

    console.log(
      `[Clearance Log] ${timestamp} - Access ${status} - Resource: ${resource} - Level: ${currentLevel}`
    );
  }

  /**
   * Show neural link status
   */
  showNeuralLinkStatus(status = "active") {
    const statusMessages = {
      active: "Diplomatic psionic link to Grand Council active • Nlom resonance stable",
      unstable: "Diplomatic psionic link fluctuating • Nlom interference detected",
      disconnected: "Diplomatic psionic link severed • Operating in autonomous mode",
    };

    const toastType =
      status === "active"
        ? "success"
        : status === "unstable"
        ? "warning"
        : "error";

    const message = `
      <strong>NEURAL LINK STATUS</strong><br>
      ${statusMessages[status] || statusMessages.active}
    `;

    ToastManager.show(message, toastType, CONSTANTS.TOAST_DURATION);
  }

  /**
   * Clean up resources
   */
  destroy() {
    console.log("ClearanceManager destroyed");
  }
}
