/**
 * Citizen Manager
 * Handles citizen session data and record management
 */

import { Logger, FileUtils, IDUtils } from './utilities.js';

export class CitizenManager {
  constructor() {
    this.logger = new Logger('CitizenManager');
    this.citizens = [];
    this.citizenFiles = [];
    this.currentSession = null;
  }

  /**
   * Check if a session has been initialized
   * @returns {boolean}
   */
  isSessionInitialized() {
    return this.currentSession !== null;
  }

  /**
   * Begin a new citizen management session
   * @returns {Object} Session data
   */
  startNewSession() {
    this.currentSession = {
      id: IDUtils.generateSessionId(),
      start: new Date().toISOString()
    };
    this.logger.info(`Session started: ${this.currentSession.id}`);
    return this.currentSession;
  }

  /**
   * Clear current session data
   */
  clearSession() {
    this.currentSession = null;
    this.citizens = [];
  }

  /**
   * Export current session data as JSON
   */
  exportSession() {
    if (!this.currentSession) return;
    const data = {
      ...this.currentSession,
      citizens: this.citizens
    };
    FileUtils.downloadFile(
      JSON.stringify(data, null, 2),
      `${this.currentSession.id}.json`,
      'application/json'
    );
  }

  /**
   * Provide available citizen files
   * @param {Array} files - Array of node objects
   */
  setCitizenFiles(files = []) {
    this.citizenFiles = files;
    this.citizens = files.map(file => ({
      citizenId: file.metadata?.citizenId || file.name,
      fullName: file.metadata?.fullName || file.name,
      sciScore: file.metadata?.sciScore || 0,
      citizenStatus: file.metadata?.citizenStatus || file.metadata?.status || 'Unknown',
      ...file.metadata
    }));
  }

  /**
   * Get all citizens
   * @returns {Array}
   */
  getAllCitizens() {
    return [...this.citizens];
  }

  /**
   * Get formatted full name for a citizen
   * @param {Object} citizen
   * @returns {string}
   */
  getFullName(citizen) {
    return citizen.fullName || citizen.name || citizen.citizenId;
  }
}
