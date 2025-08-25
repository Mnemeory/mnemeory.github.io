/**
 * Application State Management System
 * Centralized reactive state with subscription-based updates
 */

export class AppState {
  constructor() {
    this.data = {
      currentRoute: "/",
      currentView: "starfield-view",
      nodes: [],
      loading: true,
    };

    this.listeners = new Map();
  }

  /**
   * Get state value
   */
  get(key) {
    return this.data[key];
  }

  /**
   * Set state value and notify listeners
   */
  set(key, value) {
    const oldValue = this.data[key];
    this.data[key] = value;

    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach((callback) => {
        callback(value, oldValue);
      });
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    return () => {
      this.listeners.get(key).delete(callback);
    };
  }

  /**
   * Get all state data
   */
  getAll() {
    return { ...this.data };
  }

  /**
   * Reset state to initial values
   */
  reset() {
    const initialState = {
      currentRoute: "/",
      currentView: "starfield-view",
      nodes: [],
      loading: true,
    };

    Object.keys(initialState).forEach((key) => {
      this.set(key, initialState[key]);
    });
  }

  /**
   * Batch update multiple state values
   */
  batchUpdate(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
}
