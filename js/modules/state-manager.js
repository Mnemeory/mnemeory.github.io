/**
 * State Manager
 * Centralized immutable application state with subscription system
 * 
 * Provides a single source of truth for the application state
 * with controlled update paths and notification system.
 */

export class StateManager {
  constructor() {
    this._state = {};
    this._subscribers = {};
    this._batchMode = false;
    this._pendingUpdates = {};
    this._notificationQueue = new Set();
  }

  /**
   * Get state value by key
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Get entire state object (immutable copy)
   */
  getAll() {
    return { ...this._state };
  }

  /**
   * Update state for a single key
   * @param {string} key - State property key
   * @param {*} value - New value
   * @param {boolean} silent - If true, don't notify subscribers
   * @returns {boolean} - Whether update was successful
   */
  set(key, value, silent = false) {
    // Don't update if value is unchanged
    if (this._state[key] === value) return false;

    // If in batch mode, queue the update
    if (this._batchMode) {
      this._pendingUpdates[key] = value;
      this._notificationQueue.add(key);
      return true;
    }

    // Otherwise, update immediately
    this._state[key] = value;

    // Notify subscribers unless silent
    if (!silent && this._subscribers[key]) {
      this._subscribers[key].forEach(callback => {
        try {
          callback(value, this._state[key], this._state);
        } catch (error) {
          console.error(`Error in state subscriber for ${key}:`, error);
        }
      });
    }

    return true;
  }

  /**
   * Subscribe to changes in a specific state key
   * @param {string} key - State property to subscribe to
   * @param {function} callback - Function to call when state changes
   * @returns {function} - Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this._subscribers[key]) {
      this._subscribers[key] = [];
    }

    this._subscribers[key].push(callback);

    // Return unsubscribe function
    return () => {
      this._subscribers[key] = this._subscribers[key].filter(cb => cb !== callback);
      if (this._subscribers[key].length === 0) {
        delete this._subscribers[key];
      }
    };
  }

  /**
   * Batch multiple state updates into a single notification cycle
   * @param {Object} updates - Key/value pairs to update
   * @returns {boolean} - Whether any updates were made
   */
  batchUpdate(updates) {
    if (!updates || typeof updates !== 'object') return false;

    // Enter batch mode
    this._batchMode = true;
    this._pendingUpdates = {};
    this._notificationQueue.clear();

    // Process all updates
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value, true); // Silent update
    });

    // Exit batch mode and process notifications
    this._batchMode = false;
    this._commitPendingUpdates();

    return this._notificationQueue.size > 0;
  }

  /**
   * Commit any pending updates and notify subscribers
   */
  _commitPendingUpdates() {
    // Apply all pending updates
    Object.entries(this._pendingUpdates).forEach(([key, value]) => {
      this._state[key] = value;
    });

    // Notify subscribers for each changed key
    this._notificationQueue.forEach(key => {
      if (this._subscribers[key]) {
        const value = this._state[key];
        this._subscribers[key].forEach(callback => {
          try {
            callback(value, key, this._state);
          } catch (error) {
            console.error(`Error in state subscriber for ${key}:`, error);
          }
        });
      }
    });

    // Clear pending updates
    this._pendingUpdates = {};
    this._notificationQueue.clear();
  }

  /**
   * Reset state to initial values
   * @param {Object} initialState - Optional initial state
   */
  reset(initialState = {}) {
    this._state = { ...initialState };
    
    // Notify all subscribers of reset
    Object.keys(this._subscribers).forEach(key => {
      if (this._subscribers[key] && this._state[key] !== undefined) {
        this._subscribers[key].forEach(callback => {
          try {
            callback(this._state[key], key, this._state);
          } catch (error) {
            console.error(`Error in state subscriber for ${key} during reset:`, error);
          }
        });
      }
    });
  }
}
