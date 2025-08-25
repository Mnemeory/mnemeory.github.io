/**
 * Nralakk Federation Nlom Interface - Main Entry Point
 *
 * Entry point for the modular ES6 application following JS standards.
 * Initializes the application when DOM is ready and handles global lifecycle.
 */

import { NlomInterface } from "./modules/app-controller.js";

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.nlomInterface = new NlomInterface();
  window.nlomInterface.init();
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (window.nlomInterface) {
    window.nlomInterface.destroy();
  }
});

// Export for debugging and testing
export { NlomInterface };
