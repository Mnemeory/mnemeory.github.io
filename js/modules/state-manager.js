/**
 * State Manager
 * Centralized application state with subscription system
 */

export class StateManager {
  constructor() {
    this._state = {};
    this._subscribers = {};
  }

  get(key) {
    return this._state[key];
  }

  getAll() {
    return { ...this._state };
  }

  set(key, value, silent = false) {
    if (this._state[key] === value) return false;

    this._state[key] = value;

    if (!silent && this._subscribers[key]) {
      this._subscribers[key].forEach(callback => {
        try {
          callback(value, key, this._state);
        } catch (error) {
          console.error(`Error in state subscriber for ${key}:`, error);
        }
      });
    }

    return true;
  }

  subscribe(key, callback) {
    if (!this._subscribers[key]) {
      this._subscribers[key] = [];
    }

    this._subscribers[key].push(callback);

    return () => {
      this._subscribers[key] = this._subscribers[key].filter(cb => cb !== callback);
      if (this._subscribers[key].length === 0) {
        delete this._subscribers[key];
      }
    };
  }

  batchUpdate(updates) {
    if (!updates || typeof updates !== 'object') return false;

    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value, true);
    });

    // Notify all affected subscribers
    Object.keys(updates).forEach(key => {
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

    return true;
  }

  reset(initialState = {}) {
    this._state = { ...initialState };
    
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