// Shared Utility Functions

(function() {
  'use strict';
  
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function debugLog(...args) {
    if (window.CONFIG && window.CONFIG.DEBUG) {
      console.log(...args);
    }
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  function formatStatus(status, defaultValue = 'Unknown') {
    if (!status) return defaultValue;
    if (typeof status !== 'string') return defaultValue;
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.keys(attrs).forEach(key => {
      if (key === 'className') {
        element.className = attrs[key];
      } else if (key === 'textContent') {
        element.textContent = attrs[key];
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, attrs[key]);
      } else {
        element[key] = attrs[key];
      }
    });
    
    if (typeof children === 'string') {
      element.textContent = children;
    } else if (children instanceof Node) {
      element.appendChild(children);
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          element.appendChild(child);
        }
      });
    }
    
    return element;
  }
  
  function normalizeMoneyValue(value) {
    if (typeof value === 'string') {
      const numericValue = value.replace(/[$,]/g, '');
      if (!isNaN(numericValue) && numericValue.trim() !== '') {
        if (value.startsWith('$')) {
          return formatMoney(parseFloat(numericValue));
        }
      }
      return value;
    }
    
    if (typeof value === 'number') {
      return formatMoney(value);
    }
    
    return '0';
  }
  
  function formatMoney(num) {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  function validateArrayIndex(arr, index) {
    if (!Array.isArray(arr)) return false;
    
    const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;
    
    if (isNaN(numIndex)) return false;
    if (numIndex < 0) return false;
    if (numIndex >= arr.length) return false;
    
    return true;
  }

  function formatNameList(names, fallback, separator) {
    const defaultFallback = (window.CONFIG && window.CONFIG.DEFAULTS.fallbackText) || 'Unassigned';
    const defaultSeparator = (window.CONFIG && window.CONFIG.DEFAULTS.separator) || '<br>';
    
    const actualFallback = fallback !== undefined ? fallback : defaultFallback;
    const actualSeparator = separator !== undefined ? separator : defaultSeparator;
    
    const safeFallback = escapeHtml(actualFallback);

    if (!names && names !== 0) {
      return safeFallback;
    }

    if (Array.isArray(names)) {
      const formatted = names
        .map(name => (typeof name === 'string' || typeof name === 'number')
          ? escapeHtml(String(name).trim())
          : '')
        .filter(Boolean);

      if (formatted.length === 0) {
        return safeFallback;
      }

      return formatted.join(actualSeparator);
    }

    if (typeof names === 'string' || typeof names === 'number') {
      const trimmed = String(names).trim();
      return trimmed ? escapeHtml(trimmed) : safeFallback;
    }

    return safeFallback;
  }
  
  window.utils = {
    escapeHtml,
    debugLog,
    debounce,
    formatStatus,
    createElement,
    formatMoney,
    normalizeMoneyValue,
    validateArrayIndex,
    formatNameList
  };
  
})();


