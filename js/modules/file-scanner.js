/**
 * File Scanner
 * Dynamic file detection system for GitHub-hosted content
 * 
 * Handles repository access and file discovery while maintaining
 * separation of concerns with display logic.
 */

import { CONFIG } from "../config.js";
import { Logger, NetworkUtils } from "./shared-utilities.js";

export class FileScanner {
  constructor() {
    this.logger = new Logger("FileScanner");
    this.supportedExtensions = [".txt", ".md", ".json"];
    this.fileCache = new Map();
    
    // GitHub repository configuration
    this.repoConfig = {
      username: "Mnemeory",
      repo: "mnemeory.github.io",
      apiBase: "https://api.github.com/repos",
      branch: "main"
    };
  }

  /**
   * Set GitHub repository configuration
   * @param {string} username - GitHub username
   * @param {string} repo - GitHub repository
   * @param {string} branch - Repository branch
   */
  setRepositoryConfig(username, repo, branch = "main") {
    this.repoConfig = {
      ...this.repoConfig,
      username,
      repo,
      branch
    };
    
    this.logger.info(`Repository configured: ${username}/${repo} (${branch})`);
  }

  /**
   * Get GitHub API URL for directory contents
   * @param {string} path - Directory path
   * @returns {string} GitHub API URL
   */
  getApiUrl(path) {
    const { apiBase, username, repo } = this.repoConfig;
    return `${apiBase}/${username}/${repo}/contents/${path}`;
  }

  /**
   * Get GitHub raw content URL
   * @param {string} path - File path
   * @returns {string} Raw content URL
   */
  getRawUrl(path) {
    const { username, repo, branch } = this.repoConfig;
    return `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${path}`;
  }

  /**
   * Get repository information
   * @returns {Object} Repository information
   */
  getRepositoryInfo() {
    const { username, repo, apiBase, branch } = this.repoConfig;
    
    return {
      username,
      repo,
      branch,
      apiBase,
      rootUrl: this.getApiUrl(""),
      filedUrl: this.getApiUrl("filed"),
      templatesUrl: this.getApiUrl("templates"),
      citizenUrl: this.getApiUrl("citizen")
    };
  }

  /**
   * Test GitHub API connection
   * @returns {Promise<boolean>} Connection success
   */
  async testConnection() {
    try {
      const apiUrl = this.getApiUrl("");
      this.logger.info(`Testing GitHub API connection to: ${apiUrl}`);
      
      const response = await NetworkUtils.fetchWithTimeout(apiUrl);
      const contents = await response.json();
      
      this.logger.info(
        `GitHub API connection successful. Repository root contains ${contents.length} items.`
      );
      
      return true;
    } catch (error) {
      // Handle 403 specifically (rate limiting or auth issues)
      if (error.message.includes('403')) {
        this.logger.warn("GitHub API access restricted (403) - this is normal for unauthenticated requests. Application will continue with local data only.");
      } else {
        this.logger.warn("GitHub API connection unavailable", error.message);
      }
      return false;
    }
  }

  /**
   * Scan directory for files
   * @param {string} directoryPath - Directory path
   * @param {string} constellation - Constellation ID
   * @param {string} seal - Clearance seal
   * @returns {Promise<Array>} Array of node objects
   */
  async scanDirectory(directoryPath, constellation, seal) {
    const nodes = [];
    
    try {
      // Get directory contents from GitHub API
      const files = await this.listDirectoryFiles(directoryPath);
      
      this.logger.info(`Found ${files.length} files in ${directoryPath}`);
      
      // Process each file
      for (const file of files) {
        // Check if file extension is supported
        if (this.hasValidExtension(file.name)) {
          const node = await this.generateNodeFromFile(
            file,
            constellation,
            seal
          );
          
          if (node) {
            nodes.push(node);
          }
        }
      }
      
      this.logger.info(`Successfully processed ${nodes.length} files from ${directoryPath}`);
      
      return nodes;
    } catch (error) {
      this.logger.error(`Failed to scan directory ${directoryPath}`, error);
      return [];
    }
  }

  /**
   * Check if file has valid extension
   * @param {string} filename - File name
   * @returns {boolean} Whether file has valid extension
   */
  hasValidExtension(filename) {
    return this.supportedExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
  }

  /**
   * List files in directory
   * @param {string} directoryPath - Directory path
   * @returns {Promise<Array>} Array of file objects
   */
  async listDirectoryFiles(directoryPath) {
    try {
      const apiUrl = this.getApiUrl(directoryPath);
      this.logger.info(`Fetching directory contents from: ${apiUrl}`);
      
      // Add headers to help with rate limiting
      const response = await NetworkUtils.fetchWithTimeout(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Mnemeory-GitHub-Pages"
        }
      });
      
      const contents = await response.json();
      
      // Filter for files only (not directories)
      const files = contents.filter((item) => item.type === "file");
      
      this.logger.info(`Found ${files.length} files in ${directoryPath}`);
      
      return files;
    } catch (error) {
      if (error.message && error.message.includes("404")) {
        this.logger.warn(`Directory ${directoryPath} not found in GitHub repository`);
      } else if (error.message && error.message.includes("403")) {
        this.logger.warn(`GitHub API rate limited. Please try again later.`);
      } else {
        this.logger.error(`Failed to list directory ${directoryPath}`, error);
      }
      
      return [];
    }
  }

  /**
   * Generate node from file
   * @param {Object} file - File object from GitHub API
   * @param {string} constellation - Constellation ID
   * @param {string} seal - Clearance seal
   * @returns {Promise<Object|null>} Node object or null
   */
  async generateNodeFromFile(file, constellation, seal) {
    try {
      // Get raw content URL
      const rawUrl = this.getRawUrl(file.path);
      this.logger.debug(`Fetching file content from: ${rawUrl}`);
      
      // Check cache first
      if (this.fileCache.has(rawUrl)) {
        const cachedData = this.fileCache.get(rawUrl);
        this.logger.debug(`Using cached content for: ${file.name}`);
        
        return this.createNodeFromContent(
          file,
          constellation,
          seal,
          cachedData.content
        );
      }
      
      // Fetch file content
      const response = await NetworkUtils.fetchWithTimeout(rawUrl);
      const content = await response.text();
      
      this.logger.debug(`Successfully fetched file: ${file.name}`);
      
      // Cache content
      this.fileCache.set(rawUrl, {
        content,
        timestamp: Date.now()
      });
      
      return this.createNodeFromContent(file, constellation, seal, content);
    } catch (error) {
      this.logger.warn(`Failed to process file ${file.name}`, error);
      return null;
    }
  }

  /**
   * Create node from file content
   * @param {Object} file - File object
   * @param {string} constellation - Constellation ID
   * @param {string} seal - Clearance seal
   * @param {string} content - File content
   * @returns {Object|null} Node object
   */
  createNodeFromContent(file, constellation, seal, content) {
    try {
      // Parse file name to extract metadata
      const nodeData = this.parseFileName(file.name, constellation);
      
      if (!nodeData) {
        this.logger.warn(`Could not parse filename: ${file.name}`);
        return null;
      }
      
      // Create node object
      const node = {
        id: `${constellation}-${file.name}`,
        name: nodeData.displayName,
        url: this.getRawUrl(file.path),
        constellation: constellation,
        seal: seal,
        content: content,
        metadata: nodeData,
        _dynamicallyGenerated: true,
        _lastModified: file.sha ? new Date().toISOString() : new Date().toISOString(),
        _githubData: {
          path: file.path,
          sha: file.sha,
          size: file.size
        }
      };
      
      return node;
    } catch (error) {
      this.logger.warn(`Failed to create node for ${file.name}`, error);
      return null;
    }
  }

  /**
   * Parse file name to extract metadata
   * @param {string} fileName - File name
   * @param {string} constellation - Constellation ID
   * @returns {Object|null} File metadata
   */
  parseFileName(fileName, constellation) {
    const nameWithoutExt = fileName.replace(/\.(txt|md|json)$/i, "");
    
    switch (constellation) {
      case "gnarled-tree":
        return this.parseFiledFileName(nameWithoutExt);
      case "hatching-egg":
        return this.parseTemplateFileName(nameWithoutExt);
      case "qu-poxii":
        // Check for session file pattern first
        if (this.isSessionFile(nameWithoutExt)) {
          return this.parseSessionFileName(nameWithoutExt);
        }
        return this.parseCitizenFileName(nameWithoutExt);
      default:
        return null;
    }
  }

  /**
   * Parse filed document name
   * @param {string} nameWithoutExt - File name without extension
   * @returns {Object} File metadata
   */
  parseFiledFileName(nameWithoutExt) {
    const parts = nameWithoutExt.split("-");
    
    if (parts.length < 4) {
      // Handle shorter filenames gracefully
      const roundId = parts[0] || "UNKNOWN";
      const dateStr = parts[1] || "UNKNOWN";
      const personName = parts[2] || "UNKNOWN";
      const fileName = parts.slice(3).join("-") || "Document";
      
      return this.formatFiledMetadata(roundId, dateStr, personName, fileName);
    }
    
    const roundId = parts[0];
    const dateStr = parts[1];
    const personName = parts[2];
    const fileName = parts.slice(3).join("-");
    
    return this.formatFiledMetadata(roundId, dateStr, personName, fileName);
  }

  /**
   * Format filed document metadata
   * @param {string} roundId - Round ID
   * @param {string} dateStr - Date string
   * @param {string} personName - Person name
   * @param {string} fileName - File name
   * @returns {Object} Formatted metadata
   */
  formatFiledMetadata(roundId, dateStr, personName, fileName) {
    // Parse date (YYYYMMDD format)
    let formattedDate = dateStr;
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      formattedDate = `${year}-${month}-${day}`;
    }
    
    // Handle executive override
    let displayRoundId = roundId;
    if (roundId.toUpperCase() === "EO") {
      displayRoundId = "EXEC_OVR";
    }
    
    return {
      type: "filed",
      roundId: roundId,
      date: formattedDate,
      personName: personName,
      fileName: fileName,
      displayName: `${formattedDate} • ${displayRoundId} • ${personName} — ${fileName}`,
      category: displayRoundId,
      sortKey: `${displayRoundId}-${formattedDate}-${personName}-${fileName}`,
      description: `Filed document created by ${personName} on ${formattedDate}`
    };
  }

  /**
   * Parse template file name
   * @param {string} nameWithoutExt - File name without extension
   * @returns {Object} Template metadata
   */
  parseTemplateFileName(nameWithoutExt) {
    const parts = nameWithoutExt.split("-");
    
    if (parts.length < 2) {
      // Handle single-word template names
      return {
        type: "template",
        category: "GENERAL",
        fileName: nameWithoutExt,
        displayName: this.titleCase(nameWithoutExt),
        sortKey: `GENERAL-${nameWithoutExt}`,
        description: `General template: ${this.titleCase(nameWithoutExt)}`
      };
    }
    
    const category = parts[0];
    const fileName = parts.slice(1).join("-");
    
    return {
      type: "template",
      category: category,
      fileName: fileName,
      displayName: this.titleCase(fileName),
      sortKey: `${category}-${fileName}`,
      description: `${this.titleCase(category)} template: ${this.titleCase(fileName)}`
    };
  }

  /**
   * Parse citizen file name
   * @param {string} nameWithoutExt - File name without extension
   * @returns {Object} Citizen metadata
   */
  parseCitizenFileName(nameWithoutExt) {
    if (!nameWithoutExt || nameWithoutExt.trim() === "") {
      return null;
    }
    
    // Handle different citizen file naming patterns
    let displayName = nameWithoutExt;
    let category = "CITIZEN";
    
    // Check if it's a sample or test file
    if (nameWithoutExt.toLowerCase().includes("sample") ||
        nameWithoutExt.toLowerCase().includes("test")) {
      category = "SAMPLE";
      displayName = `${nameWithoutExt} (Test Record)`;
    }
    
    // Check if it's a template
    if (nameWithoutExt.toLowerCase().includes("template")) {
      category = "TEMPLATE";
      displayName = `${nameWithoutExt} (Template)`;
    }
    
    return {
      type: "citizen",
      name: nameWithoutExt,
      displayName: displayName,
      category: category,
      sortKey: `${category}-${nameWithoutExt}`,
      description: "Citizen record from the Qu'Poxii constellation"
    };
  }

  /**
   * Check if file is a session file
   * @param {string} nameWithoutExt - File name without extension
   * @returns {boolean} Whether file is a session file
   */
  isSessionFile(nameWithoutExt) {
    // Pattern: SF followed by digits, hyphen, then date
    const sessionPattern = /^SF\d{2}-\d{8}$/;
    return sessionPattern.test(nameWithoutExt);
  }

  /**
   * Parse session file name
   * @param {string} nameWithoutExt - File name without extension
   * @returns {Object} Session metadata
   */
  parseSessionFileName(nameWithoutExt) {
    const parts = nameWithoutExt.split("-");
    
    if (parts.length !== 2) {
      return null;
    }
    
    const sessionId = parts[0]; // SF##
    const dateStr = parts[1]; // YYYYMMDD
    
    // Parse date (YYYYMMDD format)
    let formattedDate = dateStr;
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      formattedDate = `${year}-${month}-${day}`;
    }
    
    return {
      type: "session",
      sessionId: sessionId,
      date: formattedDate,
      displayName: `${sessionId} • ${formattedDate}`,
      category: "SESSION",
      sortKey: `${sessionId}-${dateStr}`,
      description: "Session file from diplomatic mission operations"
    };
  }

  /**
   * Sort nodes by sort key
   * @param {Array} nodes - Array of nodes
   * @returns {Array} Sorted nodes
   */
  sortNodes(nodes) {
    return nodes.slice().sort((a, b) => {
      if (!a.metadata || !b.metadata) return 0;
      
      const aKey = a.metadata.sortKey || "";
      const bKey = b.metadata.sortKey || "";
      
      return aKey.localeCompare(bKey);
    });
  }

  /**
   * Group nodes by category
   * @param {Array} nodes - Array of nodes
   * @returns {Map} Grouped nodes
   */
  groupNodesByCategory(nodes) {
    const groups = new Map();
    
    nodes.forEach((node) => {
      if (node.metadata && node.metadata.category) {
        const category = node.metadata.category;
        
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        
        groups.get(category).push(node);
      }
    });
    
    // Sort each group
    groups.forEach((group) => {
      group.sort((a, b) => {
        const aKey = a.metadata?.sortKey || "";
        const bKey = b.metadata?.sortKey || "";
        return aKey.localeCompare(bKey);
      });
    });
    
    return groups;
  }

  /**
   * Title case a string
   * @param {string} str - String to title case
   * @returns {string} Title cased string
   */
  titleCase(str) {
    return str
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Clear file cache
   */
  clearCache() {
    this.fileCache.clear();
    this.logger.info("File cache cleared");
  }
}
