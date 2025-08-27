/**
 * Shared Utilities
 * Common functions and helpers used across modules
 * 
 * Following DRY principles, these utilities provide consistent
 * behavior for common operations without duplicating code.
 */

import { CONFIG } from "../config.js";

/**
 * Logging system with standardized output
 */
export class Logger {
  /**
   * @param {string} context - Logger context name
   */
  constructor(context) {
    this.context = context;
    this.enabled = CONFIG.logging.enabled;
    this.level = CONFIG.logging.level;
    
    // Log level priority (higher = more important)
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  /**
   * Check if level should be logged
   * @param {string} level - Log level
   * @returns {boolean} Whether level should be logged
   */
  shouldLog(level) {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.level];
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @returns {string} Formatted log message
   */
  formatMessage(level, message) {
    return `[${this.context}] ${message}`;
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  debug(message, data) {
    if (!this.shouldLog("debug")) return;
    const formattedMessage = this.formatMessage("debug", message);
    if (data !== undefined) {
      console.debug(formattedMessage, data);
    } else {
      console.debug(formattedMessage);
    }
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  info(message, data) {
    if (!this.shouldLog("info")) return;
    const formattedMessage = this.formatMessage("info", message);
    if (data !== undefined) {
      console.info(formattedMessage, data);
    } else {
      console.info(formattedMessage);
    }
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  warn(message, data) {
    if (!this.shouldLog("warn")) return;
    const formattedMessage = this.formatMessage("warn", message);
    if (data !== undefined) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {*} error - Optional error object
   */
  error(message, error) {
    if (!this.shouldLog("error")) return;
    const formattedMessage = this.formatMessage("error", message);
    if (error !== undefined) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  }
}

/**
 * Event utility helpers
 */
export class EventUtils {
  /**
   * Check if event is an activation key (Enter or Space)
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} Whether key is an activation key
   */
  static isActivationKey(event) {
    return event.key === "Enter" || event.key === " ";
  }

  /**
   * Check if event is Escape key
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} Whether key is Escape
   */
  static isEscapeKey(event) {
    return event.key === "Escape";
  }
  
  /**
   * Create and dispatch a custom event
   * @param {string} name - Event name
   * @param {*} detail - Event detail
   * @param {Element} target - Target element (defaults to document)
   * @returns {boolean} Whether event was not canceled
   */
  static dispatch(name, detail, target = document) {
    const event = new CustomEvent(name, {
      detail,
      bubbles: true,
      cancelable: true
    });
    
    return target.dispatchEvent(event);
  }
  
  /**
   * Add namespaced event listener with automatic cleanup tracking
   * @param {Element} element - DOM element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   * @returns {Function} Cleanup function
   */
  static addListener(element, event, handler, options = {}) {
    if (!element) return () => {};
    
    element.addEventListener(event, handler, options);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(event, handler, options);
    };
  }
  
  /**
   * Bind multiple listeners with a single cleanup function
   * @param {Array} bindings - Array of {element, event, handler, options} objects
   * @returns {Function} Cleanup function for all bindings
   */
  static bindListeners(bindings) {
    const cleanupFunctions = bindings.map(binding => {
      const { element, event, handler, options } = binding;
      return this.addListener(element, event, handler, options);
    });
    
    // Return combined cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }
}

/**
 * DOM utilities
 */
export class DOMUtils {
  /**
   * Query selector with error handling
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (defaults to document)
   * @returns {Element|null} Matched element or null
   */
  static query(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Query all elements with error handling
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (defaults to document)
   * @returns {Array} Array of matched elements
   */
  static queryAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Check if element is in viewport
   * @param {Element} element - DOM element
   * @param {number} threshold - Threshold in pixels
   * @returns {boolean} Whether element is in viewport
   */
  static isInViewport(element, threshold = 0) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= windowHeight + threshold &&
      rect.right <= windowWidth + threshold
    );
  }
  
  /**
   * Set element state via class and data attribute
   * @param {Element} element - DOM element
   * @param {string} state - State name
   * @param {boolean} active - Whether state is active
   */
  static setState(element, state, active) {
    if (!element) return;
    
    if (active) {
      element.classList.add(`is-${state}`);
      element.setAttribute(`data-state-${state}`, "true");
    } else {
      element.classList.remove(`is-${state}`);
      element.removeAttribute(`data-state-${state}`);
    }
  }
}

/**
 * Animation utilities
 */
export class AnimationUtils {
  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, delay = 150) {
    let timeout;
    
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit = 100) {
    let lastCall = 0;
    
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }
  
  /**
   * Wait for next animation frame
   * @returns {Promise} Promise that resolves on next animation frame
   */
  static nextFrame() {
    return new Promise(resolve => {
      requestAnimationFrame(resolve);
    });
  }
  
  /**
   * Wait for element animation to complete
   * @param {Element} element - DOM element
   * @returns {Promise} Promise that resolves when animation completes
   */
  static waitForAnimation(element) {
    return new Promise(resolve => {
      if (!element) {
        resolve();
        return;
      }
      
      const onAnimationEnd = () => {
        element.removeEventListener("animationend", onAnimationEnd);
        resolve();
      };
      
      if (getComputedStyle(element).animationName !== "none") {
        element.addEventListener("animationend", onAnimationEnd);
      } else {
        resolve();
      }
    });
  }
  
  /**
   * Wait for element transition to complete
   * @param {Element} element - DOM element
   * @returns {Promise} Promise that resolves when transition completes
   */
  static waitForTransition(element) {
    return new Promise(resolve => {
      if (!element) {
        resolve();
        return;
      }
      
      const onTransitionEnd = () => {
        element.removeEventListener("transitionend", onTransitionEnd);
        resolve();
      };
      
      if (getComputedStyle(element).transitionProperty !== "none") {
        element.addEventListener("transitionend", onTransitionEnd);
      } else {
        resolve();
      }
    });
  }
}

/**
 * File utilities
 */
export class FileUtils {
  /**
   * Download file
   * @param {string|Blob} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType = "text/plain") {
    try {
      // Create blob from content if it's a string
      const blob = content instanceof Blob ? 
        content : new Blob([content], { type: mimeType });
      
      // Create object URL
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      
      // Append, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Release URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("File download failed:", error);
      throw error;
    }
  }
  
  /**
   * Read file as text
   * @param {File} file - File object
   * @returns {Promise<string>} File contents as text
   */
  static readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = event => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Parse file extension from filename
   * @param {string} filename - File name
   * @returns {string} File extension
   */
  static getExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  }
}

/**
 * Network utilities
 */
export class NetworkUtils {
  /**
   * Fetch with timeout and error handling
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Fetch promise
   */
  static async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      
      throw error;
    }
  }
  
  /**
   * Fetch JSON with error handling
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} JSON promise
   */
  static async fetchJSON(url, options = {}) {
    const response = await this.fetchWithTimeout(url, options);
    return response.json();
  }
  
  /**
   * Fetch text with error handling
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} Text promise
   */
  static async fetchText(url, options = {}) {
    const response = await this.fetchWithTimeout(url, options);
    return response.text();
  }
}

/**
 * ID generation utilities
 */
export class IDUtils {
  /**
   * Generate unique ID
   * @param {string} prefix - ID prefix
   * @returns {string} Unique ID
   */
  static generateId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate session ID in format: SCS-YYYY.DDD-XXXXXX
   * @returns {string} Session ID
   */
  static generateSessionId() {
    const date = new Date();
    const year = CONFIG.timeline.year || 2467; // Federation timeline year
    const dayOfYear = Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `SCS-${year}.${dayOfYear.toString().padStart(3, "0")}-${randomPart}`;
  }
  
  /**
   * Generate citizen ID
   * @returns {string} Citizen ID
   */
  static generateCitizenId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CIT-${timestamp}-${random}`;
  }
  
  /**
   * Generate log entry ID
   * @returns {string} Log ID
   */
  static generateLogId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4);
    return `LOG-${timestamp}-${random}`;
  }
}

/**
 * Tooltip Management System
 */
export class TooltipManager {
  static tooltip = null;
  static hideTimeout = null;
  
  /**
   * Show tooltip
   * @param {string} content - HTML content to display
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Tooltip options
   */
  static show(content, x, y, options = {}) {
    // Hide existing tooltip
    this.hide();
    
    // Create tooltip element
    this.tooltip = document.createElement("div");
    this.tooltip.className = `tooltip ${options.className || ""}`;
    this.tooltip.setAttribute("role", "tooltip");
    this.tooltip.setAttribute("aria-hidden", "false");
    
    if (options.id) {
      this.tooltip.id = options.id;
    }
    
    // Set content safely
    this.tooltip.innerHTML = content;
    
    // Position tooltip
    this.tooltip.style.position = "fixed";
    this.tooltip.style.left = `${x + 15}px`;
    this.tooltip.style.top = `${y - 10}px`;
    this.tooltip.style.zIndex = "10000";
    
    // Add to document
    document.body.appendChild(this.tooltip);
    
    // Show tooltip after a frame for animation
    requestAnimationFrame(() => {
      if (this.tooltip) {
        this.tooltip.classList.add("is-visible");
      }
    });
  }
  
  /**
   * Update tooltip position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static updatePosition(x, y) {
    if (this.tooltip) {
      this.tooltip.style.left = `${x + 15}px`;
      this.tooltip.style.top = `${y - 10}px`;
    }
  }
  
  /**
   * Hide tooltip
   */
  static hide() {
    if (this.tooltip) {
      this.tooltip.classList.remove("is-visible");
      this.tooltip.setAttribute("aria-hidden", "true");
      
      // Remove after animation
      setTimeout(() => {
        if (this.tooltip && document.body.contains(this.tooltip)) {
          document.body.removeChild(this.tooltip);
        }
        this.tooltip = null;
      }, 150);
    }
  }
  
  /**
   * Clean up all tooltips
   */
  static cleanup() {
    this.hide();
    clearTimeout(this.hideTimeout);
  }
}

/**
 * Toast notification system
 */
export class ToastManager {
  static container = null;
  
  /**
   * Initialize toast container
   */
  static initialize() {
    // Check if container already exists
    if (this.container) return;
    
    // Find or create container
    this.container = document.querySelector("[data-component='toast-container']");
    
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.setAttribute("data-component", "toast-container");
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  }
  
  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Display duration in milliseconds
   * @returns {Element} Toast element
   */
  static show(message, type = "info", duration = 3000) {
    // Initialize container if needed
    this.initialize();
    
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "alert");
    
    // Set content safely (no innerHTML)
    toast.textContent = message;
    
    // Add to container
    this.container.appendChild(toast);
    
    // Add show class after a frame for animation
    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });
    
    // Hide after duration
    setTimeout(() => {
      toast.classList.remove("is-visible");
      
      // Remove from DOM after transition
      toast.addEventListener("transitionend", () => {
        if (this.container.contains(toast)) {
          this.container.removeChild(toast);
        }
      });
    }, duration);
    
    return toast;
  }
  
  /**
   * Show success toast
   * @param {string} message - Toast message
   * @param {number} duration - Display duration in milliseconds
   * @returns {Element} Toast element
   */
  static success(message, duration) {
    return this.show(message, "success", duration);
  }
  
  /**
   * Show error toast
   * @param {string} message - Toast message
   * @param {number} duration - Display duration in milliseconds
   * @returns {Element} Toast element
   */
  static error(message, duration) {
    return this.show(message, "error", duration || 5000);
  }
  
  /**
   * Show warning toast
   * @param {string} message - Toast message
   * @param {number} duration - Display duration in milliseconds
   * @returns {Element} Toast element
   */
  static warning(message, duration) {
    return this.show(message, "warning", duration || 4000);
  }
  
  /**
   * Show info toast
   * @param {string} message - Toast message
   * @param {number} duration - Display duration in milliseconds
   * @returns {Element} Toast element
   */
  static info(message, duration) {
    return this.show(message, "info", duration);
  }
}
