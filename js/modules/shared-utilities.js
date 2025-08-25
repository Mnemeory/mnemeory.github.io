/**
 * Shared Utilities Module
 * Common functions used across multiple modules to eliminate duplication
 */

import { CONSTANTS, getSelector, debug } from "../config.js";

/**
 * Toast Notification System - Consolidated from multiple files
 */
export class ToastManager {
  /**
   * Show a toast notification
   */
  static show(message, type = "success", duration = CONSTANTS.TOAST_DURATION) {
    const container = document.querySelector(getSelector("toastContainer"));
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    // Handle HTML content vs plain text
    if (message.includes("<")) {
      toast.innerHTML = message;
    } else {
      toast.textContent = message;
    }

    container.appendChild(toast);

    // Show toast with animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Auto-hide after specified duration
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, CONSTANTS.ANIMATION_BASE);
    }, duration);
  }

  /**
   * Show success toast
   */
  static success(message, duration) {
    this.show(message, "success", duration);
  }

  /**
   * Show error toast
   */
  static error(message, duration = CONSTANTS.WARNING_TOAST_DURATION) {
    this.show(message, "error", duration);
  }

  /**
   * Show warning toast
   */
  static warning(message, duration = CONSTANTS.WARNING_TOAST_DURATION) {
    this.show(message, "warning", duration);
  }

  /**
   * Show info toast
   */
  static info(message, duration) {
    this.show(message, "info", duration);
  }
}

/**
 * Tooltip Management System - Consolidated from starfield components
 */
export class TooltipManager {
  static activeTooltip = null;

  /**
   * Show a tooltip
   */
  static show(content, x, y, options = {}) {
    this.hide(); // Ensure only one tooltip exists

    const {
      id = "shared-tooltip",
      className = "constellation-tooltip",
      offset = { x: 15, y: -10 },
      animation = true,
    } = options;

    const tooltip = document.createElement("div");
    tooltip.id = id;
    tooltip.className = className;

    if (typeof content === "string") {
      tooltip.innerHTML = content;
    } else {
      tooltip.appendChild(content);
    }

    // Position tooltip
    tooltip.style.position = "fixed";
    tooltip.style.left = `${x + offset.x}px`;
    tooltip.style.top = `${y + offset.y}px`;
    tooltip.style.zIndex = "9999";
    tooltip.style.pointerEvents = "none";

    if (animation) {
      tooltip.style.opacity = "0";
      tooltip.style.transform = "translateY(-5px)";
      tooltip.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    }

    document.body.appendChild(tooltip);
    this.activeTooltip = tooltip;

    if (animation) {
      requestAnimationFrame(() => {
        if (tooltip && document.body.contains(tooltip)) {
          tooltip.style.opacity = "1";
          tooltip.style.transform = "translateY(0)";
        }
      });
    }

    return tooltip;
  }

  /**
   * Update tooltip position
   */
  static updatePosition(x, y, options = {}) {
    if (!this.activeTooltip) return;

    const { offset = { x: 15, y: -10 } } = options;

    this.activeTooltip.style.left = `${x + offset.x}px`;
    this.activeTooltip.style.top = `${y + offset.y}px`;
  }

  /**
   * Hide active tooltip
   */
  static hide() {
    if (!this.activeTooltip) return;

    const tooltip = this.activeTooltip;
    this.activeTooltip = null;

    if (document.body.contains(tooltip)) {
      tooltip.style.opacity = "0";
      tooltip.style.transform = "translateY(-5px)";

      setTimeout(() => {
        if (document.body.contains(tooltip)) {
          try {
            document.body.removeChild(tooltip);
          } catch (error) {
            console.warn("Tooltip removal failed:", error.message);
          }
        }
      }, 200);
    }
  }

  /**
   * Clean up any orphaned tooltips
   */
  static cleanup() {
    const orphanedTooltips = document.querySelectorAll(
      ".constellation-tooltip, #shared-tooltip"
    );
    orphanedTooltips.forEach((tooltip) => {
      if (tooltip && document.body.contains(tooltip)) {
        try {
          document.body.removeChild(tooltip);
        } catch (error) {
          console.warn("Failed to remove orphaned tooltip:", error.message);
        }
      }
    });
    this.activeTooltip = null;
  }
}

/**
 * DOM Utilities - Consolidated DOM manipulation functions
 */
export class DOMUtils {
  /**
   * Safe DOM query with error handling
   */
  static query(selector, container = document) {
    try {
      return container.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Safe DOM query all with error handling
   */
  static queryAll(selector, container = document) {
    try {
      return Array.from(container.querySelectorAll(selector));
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Remove all event listeners from an element
   */
  static removeAllListeners(element) {
    if (!element) return;

    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
  }

  /**
   * Setup event listeners with automatic cleanup tracking
   */
  static setupEventListeners(element, events, options = {}) {
    if (!element) return null;

    const { once = false, passive = false } = options;
    const cleanup = [];

    events.forEach(({ event, handler, useCapture = false }) => {
      const eventOptions = { once, passive, capture: useCapture };
      element.addEventListener(event, handler, eventOptions);

      // Track for cleanup
      cleanup.push(() => {
        element.removeEventListener(event, handler, eventOptions);
      });
    });

    // Return cleanup function
    return () => {
      cleanup.forEach((fn) => fn());
    };
  }

  /**
   * Check if element is visible in viewport
   */
  static isInViewport(element, threshold = 0) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= windowHeight + threshold &&
      rect.right <= windowWidth + threshold
    );
  }

  /**
   * Focus management for accessibility
   */
  static manageFocus(from, to) {
    // Remove focus from 'from' element and its children
    if (from) {
      const focusableElements = from.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), canvas[tabindex]:not([tabindex="-1"])'
      );

      focusableElements.forEach((element) => {
        if (element === document.activeElement) {
          element.blur();
        }
      });
    }

    // Set focus to 'to' element or its first focusable child
    if (to) {
      const firstFocusable = to.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), canvas[tabindex]:not([tabindex="-1"])'
      );

      if (firstFocusable) {
        firstFocusable.focus();
      } else if (to.tabIndex >= 0) {
        to.focus();
      }
    }
  }
}

/**
 * Animation Utilities - Helper functions for consistent animations
 */
export class AnimationUtils {
  /**
   * Debounce function execution
   */
  static debounce(func, delay = CONSTANTS.DEBOUNCE_DELAY) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Throttle function execution
   */
  static throttle(func, delay = CONSTANTS.ANIMATION_BASE) {
    let lastExec = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastExec >= delay) {
        func.apply(this, args);
        lastExec = now;
      }
    };
  }

  /**
   * Animate element with stagger effect
   */
  static staggerAnimation(elements, animationConfig, delayBetween = 100) {
    elements.forEach((element, index) => {
      // Initial state
      Object.entries(animationConfig.from).forEach(([prop, value]) => {
        element.style[prop] = value;
      });

      // Animate with stagger
      setTimeout(() => {
        const transition = `${animationConfig.properties.join(", ")} ${
          animationConfig.duration
        }ms ${animationConfig.easing || "ease-out"}`;
        element.style.transition = transition;

        Object.entries(animationConfig.to).forEach(([prop, value]) => {
          element.style[prop] = value;
        });

        // Clear transition after animation
        setTimeout(() => {
          element.style.transition = "";
        }, animationConfig.duration);
      }, index * delayBetween);
    });
  }

  /**
   * Wait for animation to complete
   */
  static waitForAnimation(element, property = "opacity") {
    return new Promise((resolve) => {
      const onTransitionEnd = () => {
        element.removeEventListener("transitionend", onTransitionEnd);
        resolve();
      };
      element.addEventListener("transitionend", onTransitionEnd);
    });
  }
}

/**
 * File Utilities - Helper for client-side downloads
 */
export class FileUtils {
  static downloadFile(content, filename, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Fetch Utilities - Consolidated fetch operations with error handling
 */
export class FetchUtils {
  /**
   * Safe fetch with standardized error handling
   */
  static async fetch(url, options = {}) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.warn(`Fetch failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch text content
   */
  static async fetchText(url, options = {}) {
    const response = await this.fetch(url, options);
    return response.text();
  }

  /**
   * Fetch JSON content
   */
  static async fetchJSON(url, options = {}) {
    const response = await this.fetch(url, options);
    return response.json();
  }

  /**
   * Check if URL is accessible
   */
  static async isAccessible(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Performance Utilities
 */
export class PerformanceUtils {
  /**
   * Measure function execution time
   */
  static measure(func, name = "function") {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    debug(`${name} execution time: ${end - start}ms`);
    return result;
  }

  /**
   * Schedule work for next idle period
   */
  static scheduleIdleWork(callback, timeout = 5000) {
    if ("requestIdleCallback" in window) {
      return requestIdleCallback(callback, { timeout });
    } else {
      return setTimeout(callback, 16); // Fallback to ~60fps
    }
  }

  /**
   * Batch DOM updates to prevent layout thrashing
   */
  static batchDOMUpdates(updates) {
    requestAnimationFrame(() => {
      updates.forEach((update) => update());
    });
  }
}

/**
 * ID Generation Utilities - Consolidated from duplicate code
 * Provides consistent ID generation patterns across the application
 */
export class IDUtils {
  /**
   * Generate session ID in format: SCS-YYYY.DDD-XXXXXX
   */
  static generateSessionId() {
    const date = new Date();
    const year = date.getFullYear();
    const dayOfYear = Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `SCS-${year}.${dayOfYear.toString().padStart(3, "0")}-${randomPart}`;
  }

  /**
   * Generate citizen ID in format: CIT-XXXXXXXXX-XXXX
   */
  static generateCitizenId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CIT-${timestamp}-${random}`;
  }

  /**
   * Generate document ID in format: DOC-XXXXXXXXX-XXXX
   */
  static generateDocumentId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `DOC-${timestamp}-${random}`;
  }

  /**
   * Generate log entry ID in format: LOG-TIMESTAMP-XXXX
   */
  static generateLogId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4);
    return `LOG-${timestamp}-${random}`;
  }

  /**
   * Generate generic ID with custom prefix
   */
  static generateId(prefix = "ID") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate filename-safe ID from text
   */
  static generateSafeId(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "-");
  }
}

/**
 * Form Handling Utilities - Consolidated form processing
 * Provides consistent form validation, submission, and data extraction
 */
export class FormUtils {
  /**
   * Extract form data as object
   */
  static extractFormData(form) {
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Invalid form element");
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric values
    Object.keys(data).forEach(key => {
      if (data[key] && !isNaN(data[key]) && data[key].trim() !== "") {
        data[key] = parseFloat(data[key]);
      }
    });

    return data;
  }

  /**
   * Validate form data against rules
   */
  static validateFormData(data, rules = {}) {
    const errors = {};

    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = data[field];

      // Required field validation
      if (rule.required && (!value || value.toString().trim() === "")) {
        errors[field] = rule.requiredMessage || `${field} is required`;
        return;
      }

      // Skip other validations if field is empty and not required
      if (!value) return;

      // Type validation
      if (rule.type === "number") {
        if (isNaN(value)) {
          errors[field] = rule.typeMessage || `${field} must be a valid number`;
          return;
        }
        
        // Range validation for numbers
        if (rule.min !== undefined && value < rule.min) {
          errors[field] = rule.minMessage || `${field} must be at least ${rule.min}`;
          return;
        }
        
        if (rule.max !== undefined && value > rule.max) {
          errors[field] = rule.maxMessage || `${field} must be at most ${rule.max}`;
          return;
        }
      }

      // Length validation for strings
      if (rule.type === "string" || typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          errors[field] = rule.minLengthMessage || `${field} must be at least ${rule.minLength} characters`;
          return;
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[field] = rule.maxLengthMessage || `${field} must be at most ${rule.maxLength} characters`;
          return;
        }
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.patternMessage || `${field} format is invalid`;
      }

      // Custom validation
      if (rule.validate && typeof rule.validate === "function") {
        const customError = rule.validate(value, data);
        if (customError) {
          errors[field] = customError;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Display form validation errors
   */
  static displayFormErrors(form, errors) {
    // Clear existing errors
    form.querySelectorAll(".field-error").forEach(error => error.remove());
    form.querySelectorAll(".error").forEach(field => field.classList.remove("error"));

    // Display new errors
    Object.keys(errors).forEach(field => {
      const fieldElement = form.querySelector(`[name="${field}"]`);
      if (fieldElement) {
        fieldElement.classList.add("error");
        
        const errorElement = document.createElement("div");
        errorElement.className = "field-error";
        errorElement.textContent = errors[field];
        errorElement.style.color = "var(--color-error)";
        errorElement.style.fontSize = "0.8rem";
        errorElement.style.marginTop = "0.25rem";
        
        fieldElement.parentNode.appendChild(errorElement);
      }
    });
  }

  /**
   * Submit form with validation
   */
  static async submitForm(form, rules = {}, onSubmit) {
    try {
      const data = FormUtils.extractFormData(form);
      const validation = FormUtils.validateFormData(data, rules);

      if (!validation.isValid) {
        FormUtils.displayFormErrors(form, validation.errors);
        return { success: false, errors: validation.errors };
      }

      // Clear any existing errors
      FormUtils.displayFormErrors(form, {});

      // Call submit handler
      const result = await onSubmit(data);
      return { success: true, data, result };

    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset form and clear errors
   */
  static resetForm(form) {
    form.reset();
    FormUtils.displayFormErrors(form, {});
  }
}

/**
 * Template Rendering Utilities - Consolidated template processing
 * Provides consistent template rendering with data binding
 */
export class TemplateUtils {
  /**
   * Render template with data
   */
  static render(template, data = {}) {
    if (!template) return "";
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * Render template with nested data support
   */
  static renderNested(template, data = {}) {
    if (!template) return "";
    
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, keyPath) => {
      const value = TemplateUtils.getNestedValue(data, keyPath);
      return value !== undefined ? value : match;
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Render template with conditionals
   */
  static renderConditional(template, data = {}) {
    if (!template) return "";
    
    // Handle {{#if condition}} blocks
    template = template.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
      return data[condition] ? content : "";
    });
    
    // Handle {{#unless condition}} blocks
    template = template.replace(/\{\{#unless\s+(\w+)\}\}(.*?)\{\{\/unless\}\}/gs, (match, condition, content) => {
      return !data[condition] ? content : "";
    });
    
    // Handle regular variables
    return TemplateUtils.renderNested(template, data);
  }

  /**
   * Render template with loops
   */
  static renderWithLoops(template, data = {}) {
    if (!template) return "";
    
    // Handle {{#each array}} blocks
    template = template.replace(/\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs, (match, arrayName, content) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return "";
      
      return array.map((item, index) => {
        const itemData = { 
          ...data, 
          this: item, 
          "@index": index, 
          "@first": index === 0, 
          "@last": index === array.length - 1 
        };
        return TemplateUtils.renderConditional(content, itemData);
      }).join("");
    });
    
    return TemplateUtils.renderConditional(template, data);
  }

  /**
   * Compile template for reuse
   */
  static compile(template) {
    return (data) => TemplateUtils.renderWithLoops(template, data);
  }

  /**
   * Create template cache
   */
  static createCache() {
    const cache = new Map();
    
    return {
      get(key, template) {
        if (!cache.has(key)) {
          cache.set(key, TemplateUtils.compile(template));
        }
        return cache.get(key);
      },
      
      render(key, template, data) {
        const compiled = this.get(key, template);
        return compiled(data);
      },
      
      clear() {
        cache.clear();
      }
    };
  }
}