/**
 * File Scanner - Dynamic file detection system
 * Automatically scans directories and detects files based on naming patterns
 * Uses GitHub API for dynamic file discovery with proper error handling
 */

export class FileScanner {
  constructor() {
    this.supportedExtensions = ['.txt', '.md', '.json'];
    this.fileCache = new Map();
    
    // GitHub repository configuration
    this.githubConfig = {
      username: 'Mnemeory',
      repo: 'mnemeory.github.io',
      apiBase: 'https://api.github.com/repos'
    };
  }

  /**
   * Set GitHub repository configuration
   */
  setGitHubConfig(username, repo) {
    this.githubConfig.username = username;
    this.githubConfig.repo = repo;
  }

  /**
   * Get GitHub API URL for directory listing
   */
  getGitHubApiUrl(path) {
    return `${this.githubConfig.apiBase}/${this.githubConfig.username}/${this.githubConfig.repo}/contents/${path}`;
  }

  /**
   * Get GitHub raw content URL
   */
  getGitHubRawUrl(path) {
    return `https://raw.githubusercontent.com/${this.githubConfig.username}/${this.githubConfig.repo}/main/${path}`;
  }

  /**
   * Scan a directory for files and generate node data
   */
  async scanDirectory(directoryPath, constellation, seal) {
    const nodes = [];

    try {
      // Use GitHub API to get actual directory contents
      const files = await this.listDirectoryFiles(directoryPath);
      
      console.log(`Found ${files.length} files in ${directoryPath}`);

      // Process each file
      for (const file of files) {
        if (this.supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
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

      console.log(`Successfully loaded ${nodes.length} files from ${directoryPath}`);
      
      // Log details about each node for debugging
      nodes.forEach(node => {
        console.log(`  - ${node.name} (${node.constellation}/${node.seal})`);
        if (node.metadata) {
          console.log(`    Metadata:`, node.metadata);
        }
      });
      
      return nodes;
    } catch (error) {
      console.warn(`Could not scan directory ${directoryPath}:`, error);
      return [];
    }
  }

  /**
   * List files in a directory using GitHub API
   */
  async listDirectoryFiles(directoryPath) {
    try {
      const apiUrl = this.getGitHubApiUrl(directoryPath);
      console.log(`Fetching directory contents from: ${apiUrl}`);
      
      // Add headers to help with CORS and rate limiting
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Mnemeory-GitHub-Pages'
        }
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Directory ${directoryPath} not found in GitHub repository`);
          return [];
        }
        if (response.status === 403) {
          console.warn(`GitHub API rate limited. Please try again later.`);
          return [];
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contents = await response.json();
      console.log(`GitHub API response for ${directoryPath}:`, contents);
      
      // Filter for files only (not directories)
      const files = contents.filter(item => item.type === 'file');
      console.log(`Found ${files.length} files in ${directoryPath}:`, files.map(f => f.name));
      
      return files;
    } catch (error) {
      console.warn(`Failed to fetch directory ${directoryPath}:`, error);
      throw error;
    }
  }

  /**
   * Generate a node from a file
   */
  async generateNodeFromFile(file, constellation, seal) {
    try {
      // Get the raw content URL
      const rawUrl = this.getGitHubRawUrl(file.path);
      console.log(`Fetching file content from: ${rawUrl}`);
      
      // Fetch the file content with better error handling
      const response = await fetch(rawUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain,text/html',
          'User-Agent': 'Mnemeory-GitHub-Pages'
        }
      });
      
      console.log(`Raw content response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`File ${file.path} not found at raw URL`);
          return null;
        }
        console.warn(`Could not fetch file ${file.path}: ${response.status} ${response.statusText}`);
        return null;
      }

      const content = await response.text();
      console.log(`Successfully fetched file ${file.name}, content length: ${content.length} characters`);
      
      const nodeData = this.parseFileName(file.name, constellation);
      
      if (!nodeData) {
        console.warn(`Could not parse filename: ${file.name}`);
        return null;
      }

      const node = {
        id: `${constellation}-${file.name}`,
        name: nodeData.displayName,
        url: rawUrl,
        constellation: constellation,
        seal: seal,
        content: content,
        metadata: nodeData,
        _dynamicallyGenerated: true,
        _lastModified: file.updated_at || new Date().toISOString(),
        _githubData: {
          path: file.path,
          sha: file.sha,
          size: file.size
        }
      };

      console.log(`Created node for ${file.name}:`, {
        id: node.id,
        name: node.name,
        constellation: node.constellation,
        seal: node.seal,
        metadata: node.metadata
      });

      return node;
    } catch (error) {
      console.warn(`Could not process file ${file.name}:`, error);
      return null;
    }
  }

  /**
   * Parse filename based on naming conventions
   */
  parseFileName(fileName, constellation) {
    const nameWithoutExt = fileName.replace(/\.(txt|md|json)$/i, '');
    
    switch (constellation) {
      case 'gnarled-tree':
        return this.parseFiledFileName(nameWithoutExt);
      case 'hatching-egg':
        return this.parseTemplateFileName(nameWithoutExt);
      case 'qu-poxii':
        return this.parseCitizenFileName(nameWithoutExt);
      default:
        return null;
    }
  }

  /**
   * Parse filed document names: [ROUNDID]-[DATE]-[NAME]-[FILE-NAME]
   * Example: cBgcwAo-20250825-Test-Contract
   */
  parseFiledFileName(nameWithoutExt) {
    const parts = nameWithoutExt.split('-');
    
    if (parts.length < 4) {
      // Handle shorter filenames gracefully
      const roundId = parts[0] || 'UNKNOWN';
      const dateStr = parts[1] || 'UNKNOWN';
      const personName = parts[2] || 'UNKNOWN';
      const fileName = parts.slice(3).join('-') || 'Document';
      
      return this.formatFiledMetadata(roundId, dateStr, personName, fileName);
    }

    const roundId = parts[0];
    const dateStr = parts[1];
    const personName = parts[2];
    const fileName = parts.slice(3).join('-');

    return this.formatFiledMetadata(roundId, dateStr, personName, fileName);
  }

  /**
   * Format filed document metadata consistently
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
    if (roundId.toUpperCase() === 'EO') {
      displayRoundId = 'EXEC_OVR';
    }

    return {
      type: 'filed',
      roundId: roundId,
      date: formattedDate,
      personName: personName,
      fileName: fileName,
      displayName: `${formattedDate} • ${displayRoundId} • ${personName} — ${fileName}`,
      category: displayRoundId,
      sortKey: `${displayRoundId}-${formattedDate}-${personName}-${fileName}`
    };
  }

  /**
   * Parse template names: [CATEGORY]-[FILE-NAME]
   * Example: LAW-Contract
   */
  parseTemplateFileName(nameWithoutExt) {
    const parts = nameWithoutExt.split('-');
    
    if (parts.length < 2) {
      // Handle single-word template names
      return {
        type: 'template',
        category: 'GENERAL',
        fileName: nameWithoutExt,
        displayName: nameWithoutExt,
        sortKey: `GENERAL-${nameWithoutExt}`
      };
    }

    const category = parts[0];
    const fileName = parts.slice(1).join('-');

    return {
      type: 'template',
      category: category,
      fileName: fileName,
      displayName: fileName,
      sortKey: `${category}-${fileName}`
    };
  }

  /**
   * Parse citizen names: [NAME]
   * Example: Name
   */
  parseCitizenFileName(nameWithoutExt) {
    if (!nameWithoutExt || nameWithoutExt.trim() === '') {
      return null;
    }

    // Handle different citizen file naming patterns
    let displayName = nameWithoutExt;
    let category = 'CITIZEN';
    
    // Check if it's a sample or test file
    if (nameWithoutExt.toLowerCase().includes('sample') || 
        nameWithoutExt.toLowerCase().includes('test')) {
      category = 'SAMPLE';
      displayName = `${nameWithoutExt} (Test Record)`;
    }
    
    // Check if it's a template
    if (nameWithoutExt.toLowerCase().includes('template')) {
      category = 'TEMPLATE';
      displayName = `${nameWithoutExt} (Template)`;
    }

    return {
      type: 'citizen',
      name: nameWithoutExt,
      displayName: displayName,
      category: category,
      sortKey: `${category}-${nameWithoutExt}`,
      description: 'Citizen record from the Qu\'Poxii constellation'
    };
  }

  /**
   * Sort nodes by their sort keys
   */
  sortNodes(nodes, type = 'template') {
    return nodes.slice().sort((a, b) => {
      if (!a.metadata || !b.metadata) return 0;
      
      const aKey = a.metadata.sortKey || '';
      const bKey = b.metadata.sortKey || '';
      
      return aKey.localeCompare(bKey);
    });
  }

  /**
   * Group template nodes by category
   */
  groupTemplateNodes(nodes) {
    const groups = new Map();

    nodes.forEach(node => {
      if (node.metadata && node.metadata.category) {
        const category = node.metadata.category;
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category).push(node);
      }
    });

    // Sort each group
    groups.forEach(group => {
      group.sort((a, b) => {
        const aKey = a.metadata?.sortKey || '';
        const bKey = b.metadata?.sortKey || '';
        return aKey.localeCompare(bKey);
      });
    });

    return groups;
  }

  /**
   * Test GitHub API connectivity
   */
  async testGitHubConnection() {
    try {
      const apiUrl = this.getGitHubApiUrl('');
      console.log(`Testing GitHub API connection to: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const contents = await response.json();
        console.log(`✅ GitHub API connection successful. Repository root contains:`, contents.map(item => item.name));
        return true;
      } else {
        console.error(`❌ GitHub API connection failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ GitHub API connection error:`, error);
      return false;
    }
  }

  /**
   * Get repository information
   */
  getRepositoryInfo() {
    return {
      username: this.githubConfig.username,
      repo: this.githubConfig.repo,
      apiBase: this.githubConfig.apiBase,
      rootUrl: this.getGitHubApiUrl(''),
      filedUrl: this.getGitHubApiUrl('filed'),
      templatesUrl: this.getGitHubApiUrl('templates'),
      citizenUrl: this.getGitHubApiUrl('citizen')
    };
  }
}

