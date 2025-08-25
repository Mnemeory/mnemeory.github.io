/**
 * Citizen Management System for Qu'Poxii Constellation
 * Handles Skrell citizen records, SCI tracking, and log management
 */

import { ToastManager, FileUtils, IDUtils } from "./shared-utilities.js";
import {
  DEFAULT_CITIZEN_STATUS,
  USER_PROFILE,
  getDocumentTemplate,
  getSuccessMessage,
  getInfoMessage,
  renderTemplate,
  SITE_CONFIG,
  debug
} from "../config.js";

export class CitizenManager {
  constructor() {
    this.currentSession = this.initializeSession();
    this.citizens = new Map(); // Store citizen records for current session

    // Lore-friendly behavioral tags for Skrell citizens
    this.behavioralTags = {
      "Nlom-Centered": "Exhibits strong connection to Nlom ideals",
      Cooperative: "Works well within group dynamics",
      Individualistic: "Shows tendency toward independent thought",
      Traditionalist: "Respects established Federation customs",
      Progressive: "Embraces new ideas and changes",
      "Quya-Focused": "Prioritizes family unit bonds",
      "Career-Driven": "Shows ambition in professional pursuits",
      "Academically-Inclined": "Demonstrates scholarly interests",
      "Socially-Withdrawn": "Prefers limited social interaction",
      "Community-Oriented": "Actively participates in communal activities",
      "Psionically-Sensitive": "Shows heightened psionic awareness",
      "Culturally-Adaptive": "Adapts well to non-Skrell environments",
      "Federation-Loyal": "Strong allegiance to Federation ideals",
      "Diplomatically-Minded": "Shows skills in inter-species relations",
      "Scientifically-Curious": "Exhibits research-oriented behavior",
    };
  }

  /**
   * Initialize a new session
   */
  initializeSession() {
    return {
      id: this.generateSessionId(),
      startTime: new Date(),
      roundNumber: null,
      logEntries: [],
      activeCitizen: null,
    };
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return IDUtils.generateSessionId();
  }

  /**
   * Create new citizen record
   */
  createCitizen(citizenData) {
    const citizen = {
      id: this.generateCitizenId(),
      primaryName: citizenData.primaryName || "",
      secondaryName: citizenData.secondaryName || "",
      nameExtensions: citizenData.nameExtensions || "",
      sciScore: parseFloat(citizenData.sciScore) || 5.0,
      citizenStatus: citizenData.citizenStatus || DEFAULT_CITIZEN_STATUS,
      location: citizenData.location || "",
      occupation: citizenData.occupation || "",
      quya: citizenData.quya || "",
      notes: citizenData.notes || "",
      behavioralTags: citizenData.behavioralTags || [], // Lore-friendly behavioral descriptors
      createdAt: new Date(),
      lastModified: new Date(),
      logEntries: [],
    };

    this.citizens.set(citizen.id, citizen);
    this.addLogEntry(
      `New citizen record created: ${this.getFullName(citizen)}`
    );

    return citizen;
  }

  /**
   * Generate citizen ID
   */
  generateCitizenId() {
    return IDUtils.generateCitizenId();
  }

  /**
   * Get full Skrell name with extensions
   */
  getFullName(citizen) {
    let fullName = `${citizen.primaryName}`;
    if (citizen.secondaryName) {
      fullName += ` ${citizen.secondaryName}`;
    }
    if (citizen.nameExtensions) {
      fullName += ` ${citizen.nameExtensions}`;
    }
    return fullName;
  }

  /**
   * Update citizen record
   */
  updateCitizen(citizenId, updates) {
    const citizen = this.citizens.get(citizenId);
    if (!citizen) return null;

    const oldData = { ...citizen };
    Object.assign(citizen, updates);
    citizen.lastModified = new Date();

    // Log significant changes
    this.logCitizenChanges(citizen, oldData);

    return citizen;
  }

  /**
   * Log citizen changes
   */
  logCitizenChanges(newData, oldData) {
    const changes = [];

    if (newData.sciScore !== oldData.sciScore) {
      changes.push(`SCI: ${oldData.sciScore} → ${newData.sciScore}`);
    }

    if (newData.citizenStatus !== oldData.citizenStatus) {
      changes.push(
        `Status: ${oldData.citizenStatus} → ${newData.citizenStatus}`
      );
    }

    if (changes.length > 0) {
      this.addLogEntry(`${this.getFullName(newData)} - ${changes.join(", ")}`);
    }
  }

  /**
   * Add log entry to current session
   */
  addLogEntry(entry, citizenId = null) {
    const logEntry = {
      id: IDUtils.generateLogId(),
      timestamp: new Date(),
      entry: entry,
      citizenId: citizenId,
      operator: USER_PROFILE.operator,
    };

    this.currentSession.logEntries.push(logEntry);

    // Also add to citizen's personal log if specified
    if (citizenId && this.citizens.has(citizenId)) {
      this.citizens.get(citizenId).logEntries.push(logEntry);
    }

    return logEntry;
  }

  /**
   * Get citizen by ID
   */
  getCitizen(citizenId) {
    return this.citizens.get(citizenId);
  }

  /**
   * Get all citizens
   */
  getAllCitizens() {
    return Array.from(this.citizens.values());
  }

  /**
   * Search citizens by name
   */
  searchCitizens(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const citizen of this.citizens.values()) {
      const fullName = this.getFullName(citizen).toLowerCase();
      if (fullName.includes(searchTerm)) {
        results.push(citizen);
      }
    }

    return results;
  }

  /**
   * Set round number for session
   */
  setRoundNumber(roundNumber) {
    this.currentSession.roundNumber = roundNumber;
    this.addLogEntry(`Round session initialized: ${roundNumber}`);
  }

  /**
   * Generate session report for export
   */
  generateSessionReport() {
    // Prepare citizen summary
    let citizenSummary = "";
    if (this.citizens.size > 0) {
      citizenSummary = "[h2]Citizen Records Summary[/h2]\n\n";
      
      for (const citizen of this.citizens.values()) {
        citizenSummary += `[b]${this.getFullName(citizen)}[/b]\n`;
        citizenSummary += `• ID: ${citizen.id}\n`;
        citizenSummary += `• SCI Rating: ${citizen.sciScore}/10.00\n`;
        citizenSummary += `• Status: ${citizen.citizenStatus}\n`;
        if (citizen.location) citizenSummary += `• Location: ${citizen.location}\n`;
        if (citizen.occupation) citizenSummary += `• Occupation: ${citizen.occupation}\n`;
        if (citizen.quya) citizenSummary += `• Quya: ${citizen.quya}\n`;
        if (citizen.behavioralTags && citizen.behavioralTags.length > 0) {
          citizenSummary += `• Behavioral Profile: ${citizen.behavioralTags.join(", ")}\n`;
        }
        if (citizen.notes) citizenSummary += `• Notes: ${citizen.notes}\n`;
        citizenSummary += "\n";
      }
    }

    // Prepare activity log
    let activityLog = "";
    if (this.currentSession.logEntries.length > 0) {
      activityLog = "[h2]Session Activity Log[/h2]\n\n";
      activityLog += this.formatLogEntries(this.currentSession.logEntries).join("\n");
      activityLog += "\n";
    }

    // Use template from config
    const template = getDocumentTemplate("citizenReport");
    return renderTemplate(template, {
      location: "SCCV Horizon, Stellar Corporate Conglomerate",
      sessionId: this.currentSession.id,
      roundNumber: this.currentSession.roundNumber || "Not specified",
      sessionStart: this.currentSession.startTime.toISOString(),
      reportDate: new Date().toISOString(),
      citizenCount: this.citizens.size,
      logCount: this.currentSession.logEntries.length,
      citizenSummary,
      activityLog,
      motto: "Every citizen is a star in our constellation"
    });
  }

  /**
   * Export session as text file
   */
  exportSession() {
    const content = this.generateSessionReport();
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .substr(0, 19);
    const filename = `citizen-session-${
      this.currentSession.roundNumber || "unknown"
    }-${timestamp}${SITE_CONFIG.fileSystem.defaultExtension}`;

    FileUtils.downloadFile(content, filename);

    ToastManager.show(getSuccessMessage("sessionExported", { filename }), "success");

    this.addLogEntry(`Diplomatic session report transmitted as ${filename}`);
  }

  /**
   * Export individual citizen record
   */
  exportCitizen(citizenId) {
    const citizen = this.getCitizen(citizenId);
    if (!citizen) return;

    const content = this.generateCitizenReport(citizen);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .substr(0, 19);
    const safeName = this.getFullName(citizen)
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    const filename = `citizen-${safeName}-${timestamp}${SITE_CONFIG.fileSystem.defaultExtension}`;

    FileUtils.downloadFile(content, filename);

    ToastManager.show(getSuccessMessage("citizenAdded", { filename }), "success");

    this.addLogEntry(
      `Citizen record transmitted for ${this.getFullName(citizen)}`,
      citizenId
    );
  }

  /**
   * Generate individual citizen report
   */
  generateCitizenReport(citizen) {
    // Prepare additional info
    let additionalInfo = "";
    if (citizen.location) additionalInfo += `[b]Current Location:[/b] ${citizen.location}\n`;
    if (citizen.occupation) additionalInfo += `[b]Occupation:[/b] ${citizen.occupation}\n`;
    if (citizen.quya) additionalInfo += `[b]Quya Unit:[/b] ${citizen.quya}\n`;
    additionalInfo += `[b]Record Created:[/b] ${citizen.createdAt.toISOString()}\n`;
    additionalInfo += `[b]Last Modified:[/b] ${citizen.lastModified.toISOString()}\n`;

    // Prepare behavioral profile
    let behavioralProfile = "";
    if (citizen.behavioralTags && citizen.behavioralTags.length > 0) {
      behavioralProfile = "[h2]Behavioral Profile[/h2]\n";
      citizen.behavioralTags.forEach((tag) => {
        const description = this.behavioralTags[tag];
        behavioralProfile += `[b]${tag}:[/b] ${description || "Behavioral indicator"}\n`;
      });
      behavioralProfile += "\n";
    }

    // Prepare notes
    let notes = "";
    if (citizen.notes) {
      notes = "[h2]Administrative Notes[/h2]\n";
      notes += citizen.notes + "\n\n";
    }

    // Prepare activity log
    let activityLog = "";
    if (citizen.logEntries.length > 0) {
      activityLog = "[h2]Citizen Activity Log[/h2]\n";
      activityLog += this.formatLogEntries(citizen.logEntries).join("\n") + "\n\n";
    }

    // Use template from config
    const template = getDocumentTemplate("individualCitizen");
    return renderTemplate(template, {
      location: "SCCV Horizon Diplomatic Mission",
      fullName: this.getFullName(citizen),
      citizenId: citizen.id,
      sciScore: citizen.sciScore,
      citizenStatus: citizen.citizenStatus,
      additionalInfo,
      behavioralProfile,
      notes,
      activityLog,
      motto: "The welfare of each star strengthens the constellation"
    });
  }

  formatLogEntries(logEntries) {
    return logEntries.map((entry) => {
      const timestamp = entry.timestamp
        .toISOString()
        .replace("T", " ")
        .substr(0, 19);
      return `[b]${timestamp}[/b] - ${entry.entry}`;
    });
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.citizens.clear();
    this.currentSession = this.initializeSession();
    ToastManager.show(getInfoMessage("sessionInitialized"), "info");
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const citizenArray = Array.from(this.citizens.values());

    return {
      totalCitizens: citizenArray.length,
      averageSCI:
        citizenArray.length > 0
          ? (
              citizenArray.reduce((sum, c) => sum + c.sciScore, 0) /
              citizenArray.length
            ).toFixed(2)
          : 0,
      statusBreakdown: this.getStatusBreakdown(citizenArray),
      totalLogEntries: this.currentSession.logEntries.length,
      sessionDuration: new Date() - this.currentSession.startTime,
    };
  }

  /**
   * Get status breakdown
   */
  getStatusBreakdown(citizens) {
    const breakdown = {};
    citizens.forEach((citizen) => {
      breakdown[citizen.citizenStatus] =
        (breakdown[citizen.citizenStatus] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get available behavioral tags
   */
  getAvailableBehavioralTags() {
    return this.behavioralTags;
  }

  /**
   * Check if citizen files are available from the file system
   */
  hasCitizenFiles() {
    // This will be populated by the file scanner
    return this.citizenFiles && this.citizenFiles.length > 0;
  }

  /**
   * Get citizen files from the file system
   */
  getCitizenFiles() {
    return this.citizenFiles || [];
  }

  /**
   * Set citizen files from the file system
   */
  setCitizenFiles(files) {
    this.citizenFiles = files;
    debug(`Citizen Manager: Loaded ${files.length} citizen files from file system`);
    
    // Log the available files
    files.forEach(file => {
      debug(`Citizen file available: ${file.name} (${file.metadata?.category || 'CITIZEN'})`);
    });
  }

  /**
   * Import citizen data from a file
   */
  importCitizenFromFile(fileId) {
    if (!this.citizenFiles) return null;
    
    const file = this.citizenFiles.find(f => f.id === fileId);
    if (!file) return null;

    // Parse the file content to extract citizen information
    const citizenData = this.parseCitizenFileContent(file.content);
    if (citizenData) {
      const citizen = this.createCitizen(citizenData);
      this.addLogEntry(`Imported citizen from file: ${file.name}`, citizen.id);
      return citizen;
    }
    
    return null;
  }

  /**
   * Parse citizen file content to extract structured data
   */
  parseCitizenFileContent(content) {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      const citizenData = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':').map(part => part.trim());
          
          switch (key.toLowerCase()) {
            case 'name':
              citizenData.primaryName = value;
              break;
            case 'status':
              citizenData.citizenStatus = value;
              break;
            case 'notes':
              citizenData.notes = value;
              break;
            case 'sci':
            case 'sci score':
            case 'social compatibility index':
              const sciScore = parseFloat(value);
              if (!isNaN(sciScore)) {
                citizenData.sciScore = sciScore;
              }
              break;
            case 'location':
              citizenData.location = value;
              break;
            case 'occupation':
              citizenData.occupation = value;
              break;
            case 'quya':
              citizenData.quya = value;
              break;
          }
        }
      });
      
      // Set defaults if not provided
      if (!citizenData.primaryName) return null;
      if (!citizenData.citizenStatus) citizenData.citizenStatus = DEFAULT_CITIZEN_STATUS;
      if (!citizenData.sciScore) citizenData.sciScore = 5.0;
      
      return citizenData;
    } catch (error) {
      console.warn('Failed to parse citizen file content:', error);
      return null;
    }
  }

  /**
   * Add behavioral tag to citizen
   */
  addBehavioralTag(citizenId, tagName) {
    const citizen = this.getCitizen(citizenId);
    if (!citizen) return false;

    if (!citizen.behavioralTags) {
      citizen.behavioralTags = [];
    }

    if (!citizen.behavioralTags.includes(tagName)) {
      citizen.behavioralTags.push(tagName);
      citizen.lastModified = new Date();
      this.addLogEntry(`Behavioral tag added: ${tagName}`, citizenId);
      return true;
    }
    return false;
  }

  /**
   * Remove behavioral tag from citizen
   */
  removeBehavioralTag(citizenId, tagName) {
    const citizen = this.getCitizen(citizenId);
    if (!citizen || !citizen.behavioralTags) return false;

    const index = citizen.behavioralTags.indexOf(tagName);
    if (index > -1) {
      citizen.behavioralTags.splice(index, 1);
      citizen.lastModified = new Date();
      this.addLogEntry(`Behavioral tag removed: ${tagName}`, citizenId);
      return true;
    }
    return false;
  }
}
