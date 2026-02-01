/**
 * SCC Shared Utilities Module
 * Common utilities shared across script.js and calculator.js
 */
(function () {
  "use strict";

  // === UTILITY FUNCTIONS ===
  const utils = {
    /**
     * Format current time as HH:MM:SS (24-hour)
     */
    formatTime: () => new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }),

    /**
     * Format current date as YYYY-MM-DD
     */
    formatDate: () => new Date().toLocaleDateString("en-CA"),

    /**
     * Escape special regex characters in a string
     */
    escapeRegex: (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),

    /**
     * Escape HTML special characters to prevent XSS
     */
    escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    },

    /**
     * Debounce a function call
     */
    debounce(fn, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
      };
    },

    /**
     * Get numeric value from a DOM element, with minimum of 0
     */
    numFromElement: (element) => Math.max(0, Number(element?.value) || 0),
  };

  // === STORAGE MANAGER FACTORY ===
  /**
   * Create a storage manager with a specific prefix
   * @param {string} prefix - Storage key prefix
   */
  function createStorageManager(prefix) {
    return {
      prefix,

      key(k) {
        return this.prefix + k;
      },

      save(key, value) {
        try {
          localStorage.setItem(this.key(key), JSON.stringify(value));
        } catch (e) {
          console.warn("Storage save failed:", e);
        }
      },

      load(key) {
        try {
          return JSON.parse(localStorage.getItem(this.key(key)));
        } catch {
          return null;
        }
      },

      clear() {
        const prefixToMatch = this.prefix;
        Object.keys(localStorage)
          .filter(k => k.startsWith(prefixToMatch))
          .forEach(k => localStorage.removeItem(k));
      },
    };
  }

  // === SYSTEM CLOCK ===
  /**
   * Create and start a system clock that updates an element
   * @param {string} elementId - ID of the element to update
   * @param {number} interval - Update interval in ms (default: 1000)
   * @returns {function} Stop function to clear the interval
   */
  function createSystemClock(elementId, interval = 1000) {
    const update = () => {
      const el = document.getElementById(elementId);
      if (el) el.textContent = utils.formatTime();
    };
    update();
    const intervalId = setInterval(update, interval);
    return () => clearInterval(intervalId);
  }

  // === DOM CACHE FACTORY ===
  /**
   * Create a DOM element cache from an array of IDs
   * @param {string[]} ids - Array of element IDs to cache
   * @returns {Object} Object with element IDs as keys and elements as values
   */
  function createDomCache(ids) {
    const cache = {};
    ids.forEach(id => {
      cache[id] = document.getElementById(id);
    });
    return cache;
  }

  // === EXPORT TO GLOBAL SCOPE ===
  window.SCC_SHARED = {
    utils,
    createStorageManager,
    createSystemClock,
    createDomCache,
  };
})();
