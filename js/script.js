/**
 * Nralakk Federation Nlom Interface - Main Entry Point
 * 
 * Bootstraps the application by importing and initializing the app controller.
 * No direct DOM manipulation, styling, or business logic present.
 */

import { AppController } from "./modules/app-controller.js";

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Create the main application controller
  window.appInstance = new AppController();
  // Back-compat alias used by legacy UI modules
  window.nlomInterface = window.appInstance;
  
  // Initialize the application
  window.appInstance.init().catch(error => {
    console.error("Application initialization failed:", error);
    
    // Show error message via class toggle only - no inline styles
    const errorContainer = document.querySelector("[data-js='app-error']");
    if (errorContainer) {
      errorContainer.classList.add("is-visible");
      errorContainer.setAttribute("data-state", "error");
    }
  });
});
