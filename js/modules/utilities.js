/**
 * Shared Utilities
 * Common functions and helpers used throughout the application
 */

// Logging system
export class Logger {
  constructor(context) {
    this.context = context;
    this.enabled = true;
  }

  formatMessage(level, message) {
    return `[${this.context}] ${message}`;
  }

  info(message, data) {
    if (!this.enabled) return;
    const formatted = this.formatMessage('info', message);
    data !== undefined ? console.info(formatted, data) : console.info(formatted);
  }

  warn(message, data) {
    if (!this.enabled) return;
    const formatted = this.formatMessage('warn', message);
    data !== undefined ? console.warn(formatted, data) : console.warn(formatted);
  }

  error(message, error) {
    if (!this.enabled) return;
    const formatted = this.formatMessage('error', message);
    error !== undefined ? console.error(formatted, error) : console.error(formatted);
  }

  debug(message, data) {
    if (!this.enabled) return;
    const formatted = this.formatMessage('debug', message);
    data !== undefined ? console.debug(formatted, data) : console.debug(formatted);
  }
}

// Event utilities
export class EventUtils {
  static isActivationKey(event) {
    return event.key === "Enter" || event.key === " ";
  }

  static isEscapeKey(event) {
    return event.key === "Escape";
  }
  
  static dispatch(name, detail, target = document) {
    const event = new CustomEvent(name, {
      detail,
      bubbles: true,
      cancelable: true
    });
    return target.dispatchEvent(event);
  }
}

// DOM utilities
export class DOMUtils {
  static query(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  static queryAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  static setState(element, state, active) {
    if (!element) return;
    
    if (active) {
      element.setAttribute("data-state", state);
    } else {
      // If removing this state, and it's the current state, reset to default
      if (element.getAttribute("data-state") === state) {
        element.setAttribute("data-state", "default");
      }
    }
  }
}

// Animation utilities
export class AnimationUtils {
  static debounce(func, delay = 150) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

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
  
  static nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }
}

// File utilities
export class FileUtils {
  static downloadFile(content, filename, mimeType = "text/plain") {
    try {
      const blob = content instanceof Blob ? 
        content : new Blob([content], { type: mimeType });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("File download failed:", error);
      throw error;
    }
  }
  
  static readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }
}

// Network utilities
export class NetworkUtils {
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
  
  static async fetchJSON(url, options = {}) {
    const response = await this.fetchWithTimeout(url, options);
    return response.json();
  }
  
  static async fetchText(url, options = {}) {
    const response = await this.fetchWithTimeout(url, options);
    return response.text();
  }
}

// ID generation utilities
export class IDUtils {
  static generateId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static generateSessionId() {
    const date = new Date();
    const year = 2467; // Federation timeline year
    const dayOfYear = Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `SCS-${year}.${dayOfYear.toString().padStart(3, "0")}-${randomPart}`;
  }
  
  static generateCitizenId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CIT-${timestamp}-${random}`;
  }
  
  static generateLogId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4);
    return `LOG-${timestamp}-${random}`;
  }
}

// Tooltip Management
export class TooltipManager {
  static tooltip = null;
  static hideTimeout = null;
  
  static show(content, x, y, options = {}) {
    this.hide();
    
    this.tooltip = document.createElement("div");
    this.tooltip.setAttribute("role", "tooltip");
    this.tooltip.setAttribute("aria-hidden", "false");
    this.tooltip.setAttribute("data-component", options.component || "tooltip");

    if (options.className) {
      this.tooltip.className = options.className;
    }

    if (options.id) {
      this.tooltip.id = options.id;
    }
    
    this.tooltip.innerHTML = content;
    
    // Position using CSS custom properties instead of inline styles
    this.tooltip.style.setProperty('--tooltip-x', `${x + 15}px`);
    this.tooltip.style.setProperty('--tooltip-y', `${y - 10}px`);
    document.body.appendChild(this.tooltip);
    
    requestAnimationFrame(() => {
      if (this.tooltip) {
        this.tooltip.classList.add('is-visible');
      }
    });
  }
  
  static updatePosition(x, y) {
    if (this.tooltip) {
      // Update position using CSS custom properties
      this.tooltip.style.setProperty('--tooltip-x', `${x + 15}px`);
      this.tooltip.style.setProperty('--tooltip-y', `${y - 10}px`);
    }
  }
  
  static hide() {
    if (this.tooltip) {
      this.tooltip.classList.remove('is-visible');
      this.tooltip.setAttribute("aria-hidden", "true");
      
      setTimeout(() => {
        if (this.tooltip && document.body.contains(this.tooltip)) {
          document.body.removeChild(this.tooltip);
        }
        this.tooltip = null;
      }, 150);
    }
  }
  
  static cleanup() {
    this.hide();
    clearTimeout(this.hideTimeout);
  }
}

// Toast notification system
export class ToastManager {
  static container = null;
  
  static initialize() {
    if (this.container) return;
    
    this.container = document.querySelector("[data-component='toast-container']");
    
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.setAttribute("data-component", "toast-container");
      document.body.appendChild(this.container);
    }
  }
  
  static show(message, type = "info", duration = 3000) {
    this.initialize();
    
    const toast = document.createElement("div");
    toast.setAttribute("role", "alert");
    toast.setAttribute("data-component", "toast");
    toast.setAttribute("data-type", type);
    toast.textContent = message;
    
    this.container.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });
    
    setTimeout(() => {
      toast.classList.remove('is-visible');
      
      toast.addEventListener("transitionend", () => {
        if (this.container.contains(toast)) {
          this.container.removeChild(toast);
        }
      });
    }, duration);
    
    return toast;
  }
  
  static success(message, duration) {
    return this.show(message, "success", duration);
  }
  
  static error(message, duration) {
    return this.show(message, "error", duration || 5000);
  }
  
  static warning(message, duration) {
    return this.show(message, "warning", duration || 4000);
  }
  
  static info(message, duration) {
    return this.show(message, "info", duration);
  }
}