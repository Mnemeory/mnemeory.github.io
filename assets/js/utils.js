// Shared Utility Functions

(function() {
  'use strict';
  
  const escapeContainer = document.createElement('div');

  function escapeHtml(text) {
    if (text === null || text === undefined) {
      return '';
    }

    escapeContainer.textContent = String(text);
    return escapeContainer.innerHTML;
  }

  function debugLog(...args) {
    if (window.CONFIG && window.CONFIG.DEBUG) {
      console.log(...args);
    }
  }

  function debounce(func, wait) {
    let timeout;
    function debounced(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    };
    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
    return debounced;
  }

  function onReady(callback) {
    if (typeof callback !== 'function') {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  const domCacheStore = new Map();

  const domCache = {
    get(selector) {
      if (!selector || typeof selector !== 'string') {
        return null;
      }

      if (!domCacheStore.has(selector)) {
        domCacheStore.set(selector, document.querySelector(selector));
      }

      return domCacheStore.get(selector);
    },

    all(selector) {
      if (!selector || typeof selector !== 'string') {
        return [];
      }

      if (!domCacheStore.has(selector)) {
        domCacheStore.set(selector, Array.prototype.slice.call(document.querySelectorAll(selector)));
      }

      const cached = domCacheStore.get(selector);
      if (Array.isArray(cached)) {
        return cached.slice();
      }
      return cached ? [cached] : [];
    },

    clear(selector) {
      if (typeof selector === 'string') {
        domCacheStore.delete(selector);
      } else {
        domCacheStore.clear();
      }
    }
  };

  function renderDetailRows(rows, options = {}) {
    const rowDefaultClass = typeof options.rowClass === 'string' ? options.rowClass : 'detail-row';
    const labelDefaultClass = typeof options.labelClass === 'string' ? options.labelClass : 'label';
    const valueDefaultClass = typeof options.valueClass === 'string' ? options.valueClass : 'value';

    if (!Array.isArray(rows) || rows.length === 0) {
      return '';
    }

    const toHtml = (row) => {
      if (!row) return '';
      const rowClass = typeof row.rowClass === 'string' ? row.rowClass : rowDefaultClass;
      const labelClass = typeof row.labelClass === 'string' ? row.labelClass : labelDefaultClass;
      const valueClass = typeof row.valueClass === 'string' ? row.valueClass : valueDefaultClass;

      const labelHtml = escapeHtml(row.label ?? '');
      const valueHtml = row.html ? String(row.value ?? '') : escapeHtml(row.value ?? '');

      return (
        '<div class="' + rowClass + '">' +
          '<span class="' + labelClass + '">' + labelHtml + '</span>' +
          '<span class="' + valueClass + '">' + valueHtml + '</span>' +
        '</div>'
      );
    };

    return rows.map(toHtml).join('');
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
  
  const numberFormatter = typeof Intl !== 'undefined'
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : null;

  function formatMoney(num) {
    const numericValue = Number(num);
    if (!Number.isFinite(numericValue)) {
      return '0';
    }

    if (numberFormatter) {
      return numberFormatter.format(numericValue);
    }

    return numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function normalizeMoneyValue(value) {
    if (typeof value === 'number') {
      return formatMoney(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return formatMoney(0);
      }

      const cleaned = trimmed.replace(/[$,]/g, '');
      const numericValue = cleaned ? Number(cleaned) : Number.NaN;

      if (Number.isFinite(numericValue)) {
        return formatMoney(numericValue);
      }

      return escapeHtml(trimmed);
    }

    return formatMoney(0);
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
    onReady,
    domCache,
    renderDetailRows,
    formatStatus,
    createElement,
    formatMoney,
    normalizeMoneyValue,
    validateArrayIndex,
    formatNameList
  };
  
})();


