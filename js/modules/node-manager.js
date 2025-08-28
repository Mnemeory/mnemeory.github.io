/**
 * Node Management System
 * Handles data node interactions, modal system, and export functionality
 * 
 * Responsible for node presentation and interaction without any styling manipulation
 */

import { CONSTELLATIONS } from "../config.js";
import { Logger, ToastManager, EventUtils, FileUtils, IDUtils } from "./utilities.js";
import { DocumentSystem } from "./document-system.js";

export class NodeManager {
  /**
   * @param {Object} state - Application state manager
   */
  constructor(state) {
    this.state = state;
    this.logger = new Logger("NodeManager");
    this.currentNode = null;
    this.documentSystem = null;
    
    // Initialize modal once DOM is ready
    this.setupModal();
  }

  /**
   * Setup modal system
   */
  setupModal() {
    // Find modal element using new data-component selector
    this.modal = document.querySelector("[data-component='modal']");
    if (!this.modal) {
      this.logger.warn("Node modal not found in DOM");
      return;
    }
    
    // Initialize document system for modal content
    this.documentSystem = new DocumentSystem();
    // Target the modal's document container wrapper, not the editor element itself
    this.modalDocument = this.documentSystem.createDocument("modal-document", {
      readOnly: false,
      theme: 'neural',
      templateCategory: 'constellations'
    });
    
    // Set up event listeners
    this.setupModalEvents();
    
    this.logger.info("Modal system initialized");
  }

  /**
   * Setup modal event listeners
   */
  setupModalEvents() {
    if (!this.modal) return;
    
    // Close button using new data-component selector
    const closeBtn = this.modal.querySelector("[data-component='modal-close']");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }
    
    // Backdrop click using new data-component attribute
    const backdrop = this.modal.querySelector("[data-component='modal-backdrop']");
    if (backdrop) {
      backdrop.addEventListener("click", (event) => {
        // Only close if clicking directly on backdrop (not its children)
        if (event.target === backdrop) {
          this.closeModal();
        }
      });
    }
    
    // Escape key
    document.addEventListener("keydown", (event) => {
      if (EventUtils.isEscapeKey(event) && this.isModalOpen()) {
        this.closeModal();
      }
    });
    
    // Export buttons
    const inscribeBtn = this.modal.querySelector("[data-action='inscribe']");
    const transmitBtn = this.modal.querySelector("[data-action='transmit']");
    
    if (inscribeBtn) {
      inscribeBtn.addEventListener("click", () => this.exportNode("md"));
    }
    
    if (transmitBtn) {
      transmitBtn.addEventListener("click", () => this.exportNode("json"));
    }
  }

  /**
   * Populate constellation with data nodes
   * @param {string} constellation - Constellation ID
   * @param {Array} nodes - Array of node data
   */
  populateConstellation(constellation, nodes) {
    // Find container for this constellation's nodes
    const container = document.getElementById(`${constellation}-nodes`);
    if (!container) {
      this.logger.warn(`Container not found for constellation: ${constellation}`);
      return;
    }
    
    // Clear container
    container.innerHTML = "";
    
    // Special handling for Qu'Poxii constellation with citizen management
    if (constellation === "qu-poxii") {
      this.populateQuPoxiiConstellation(container, nodes, constellation);
      return;
    }
    
    // Special handling for constellations with shell configurations
    const constellationData = CONSTELLATIONS[constellation];
    if (constellationData?.descriptions?.shell) {
      this.populateShellConstellation(container, constellationData);
      return;
    }
    
    // For other constellations, show the actual nodes
    if (nodes.length === 0) {
      this.renderEmptyConstellation(container);
      return;
    }
    
    // Create thought bubble document layout
    this.renderThoughtBubbleLayout(container, nodes, constellation);
  }

  /**
   * Populate Qu'Poxii constellation with citizen management interface
   * @param {Element} container - Container element
   * @param {Array} nodes - Array of node data
   * @param {string} constellation - Constellation ID
   */
  populateQuPoxiiConstellation(container, nodes, constellation) {
    // Create citizen interface container
    const citizenInterfaceId = "citizen-interface";
    container.innerHTML = `
      <div class="citizen-management-container">
        <div id="${citizenInterfaceId}" class="citizen-interface-wrapper"></div>
      </div>
    `;
    
    // Dispatch event for citizen UI initialization
    // This avoids direct import dependency on CitizenUI
    setTimeout(() => {
      EventUtils.dispatch("app:initialize:citizenUI", {
        containerId: citizenInterfaceId,
        nodes
      });
      
      // Separate citizen and session files
      const citizenFilesOnly = nodes.filter(node => node.metadata?.type === "citizen");
      const sessionFilesOnly = nodes.filter(node => node.metadata?.type === "session");
      
      if (citizenFilesOnly.length > 0) {
        this.populateCitizenFileBubbles(citizenFilesOnly, constellation);
      }
      
      if (sessionFilesOnly.length > 0) {
        this.populateSessionFileBubbles(sessionFilesOnly, constellation);
      }
    }, 100);
  }

  /**
   * Populate shell constellation (void, etc.)
   * @param {Element} container - Container element
   * @param {Object} constellationData - Constellation configuration
   */
  populateShellConstellation(container, constellationData) {
    const shell = constellationData.descriptions.shell;
    
    // Create shell container with appropriate class
    const shellContainer = document.createElement("div");
    shellContainer.className = "constellation-shell";
    
    // Populate shell content - no inline styles, all class-based
    shellContainer.innerHTML = `
      <div class="shell-header">
        <h3>${constellationData.name}</h3>
        <p class="shell-subtitle">${shell.subtitle}</p>
      </div>
      <div class="shell-content">
        <div class="shell-icon">${shell.icon}</div>
        <p class="shell-description">${shell.description}</p>
        <div class="shell-features">
          <h4>Planned Features:</h4>
          <ul>
            ${shell.features.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
        </div>
        ${
          shell.securityNotice
            ? `
          <div class="security-notice">
            <p><strong>${shell.securityNotice}</strong></p>
          </div>
        `
            : ""
        }
        <div class="shell-status">
          <span class="status-indicator ${shell.statusClass || ""}">${shell.status}</span>
        </div>
      </div>
    `;
    
    // Append to container
    container.appendChild(shellContainer);
  }

  /**
   * Render empty constellation message
   * @param {Element} container - Container element
   */
  renderEmptyConstellation(container) {
    const emptyContainer = document.createElement("div");
    emptyContainer.className = "empty-constellation";
    emptyContainer.innerHTML = `
      <p>No psionic data streams available in this constellation.</p>
      <p class="text-shimmer">The Nlom-linked stars are dormant here, for now.</p>
    `;
    
    container.appendChild(emptyContainer);
  }

  /**
   * Render thought bubble layout for nodes
   * @param {Element} container - Container element
   * @param {Array} nodes - Array of node data
   * @param {string} constellation - Constellation ID
   */
  renderThoughtBubbleLayout(container, nodes, constellation) {
    const constellationData = CONSTELLATIONS[constellation];
    
      // Create thought bubble container using new design system
      const thoughtBubbleContainer = document.createElement("div");
      thoughtBubbleContainer.className = "thought-bubble-documents";
      thoughtBubbleContainer.setAttribute("data-constellation", constellation);
    thoughtBubbleContainer.setAttribute("role", "region");
    thoughtBubbleContainer.setAttribute(
      "aria-label",
      `${constellationData?.name || constellation} document collection`
    );
    
    // Create thought bubble documents
    nodes.forEach((node, index) => {
      const thoughtBubble = this.createThoughtBubbleDocument(node, constellation);
      
      // Set data attribute for staggered animation via CSS
      thoughtBubble.setAttribute("data-index", index);
      thoughtBubble.classList.add("animate-in");
      
      thoughtBubbleContainer.appendChild(thoughtBubble);
    });
    
    container.appendChild(thoughtBubbleContainer);
  }

  /**
   * Populate citizen file bubbles
   * @param {Array} nodes - Array of citizen node data
   * @param {string} constellation - Constellation ID
   */
  populateCitizenFileBubbles(nodes, constellation) {
    setTimeout(() => {
      let bubblesContainer = document.getElementById("citizen-files-bubbles");
      if (!bubblesContainer) {
        // Try to find or create container within the constellation view
        const constellationContainer = document.getElementById(`${constellation}-nodes`);
        if (constellationContainer) {
          bubblesContainer = document.createElement("div");
          bubblesContainer.id = "citizen-files-bubbles";
          bubblesContainer.setAttribute("data-component", "citizen-files-container");
          bubblesContainer.className = "citizen-files-container";
          constellationContainer.appendChild(bubblesContainer);
          this.logger.info("Created citizen files bubbles container");
        } else {
          this.logger.warn("Citizen files bubbles container not found and cannot create fallback");
          return;
        }
      }
      
      // Clear container
      bubblesContainer.innerHTML = "";
      
      // Create citizen files container using new design system
      const thoughtBubbleContainer = document.createElement("div");
      thoughtBubbleContainer.className = "citizen-files-grid";
      thoughtBubbleContainer.setAttribute("data-constellation", constellation);
      thoughtBubbleContainer.setAttribute("role", "region");
      thoughtBubbleContainer.setAttribute(
        "aria-label",
        `${CONSTELLATIONS[constellation]?.name || constellation} citizen files collection`
      );
      
      // Create thought bubble documents
      nodes.forEach((node, index) => {
        const thoughtBubble = this.createThoughtBubbleDocument(node, constellation);
        
        // Set data attribute for staggered animation via CSS
        thoughtBubble.setAttribute("data-index", index);
        thoughtBubble.classList.add("animate-in");
        
        thoughtBubbleContainer.appendChild(thoughtBubble);
      });
      
      bubblesContainer.appendChild(thoughtBubbleContainer);
    }, 200);
  }

  /**
   * Populate session file bubbles
   * @param {Array} nodes - Array of session node data
   * @param {string} constellation - Constellation ID
   */
  populateSessionFileBubbles(nodes, constellation) {
    setTimeout(() => {
      let bubblesContainer = document.getElementById("session-files-bubbles");
      if (!bubblesContainer) {
        // Try to find or create container within the constellation view
        const constellationContainer = document.getElementById(`${constellation}-nodes`);
        if (constellationContainer) {
          bubblesContainer = document.createElement("div");
          bubblesContainer.id = "session-files-bubbles";
          bubblesContainer.setAttribute("data-component", "session-files-container");
          bubblesContainer.className = "session-files-container";
          constellationContainer.appendChild(bubblesContainer);
          this.logger.info("Created session files bubbles container");
        } else {
          this.logger.warn("Session files bubbles container not found and cannot create fallback");
          return;
        }
      }
      
      // Clear container
      bubblesContainer.innerHTML = "";
      
      // Create session files container using new design system
      const thoughtBubbleContainer = document.createElement("div");
      thoughtBubbleContainer.className = "session-files-grid";
      thoughtBubbleContainer.setAttribute("data-constellation", constellation);
      thoughtBubbleContainer.setAttribute("role", "region");
      thoughtBubbleContainer.setAttribute(
        "aria-label",
        "Available session files collection"
      );
      
      // Create thought bubble documents
      nodes.forEach((node, index) => {
        const thoughtBubble = this.createThoughtBubbleDocument(node, constellation);
        
        // Set data attribute for staggered animation via CSS
        thoughtBubble.setAttribute("data-index", index);
        thoughtBubble.classList.add("animate-in");
        
        thoughtBubbleContainer.appendChild(thoughtBubble);
      });
      
      bubblesContainer.appendChild(thoughtBubbleContainer);
    }, 300);
  }

  /**
   * Create individual thought bubble document
   * @param {Object} node - Node data
   * @param {string} constellation - Constellation ID
   * @returns {Element} Thought bubble element
   */
  createThoughtBubbleDocument(node, constellation) {
    // Create bubble button using new card system
    const bubble = document.createElement("button");
    bubble.className = "card--document";
    bubble.setAttribute("data-component", "card");
    bubble.setAttribute("type", "button");
    bubble.setAttribute("role", "button");
    bubble.setAttribute("tabindex", "0");
    bubble.setAttribute("aria-label", `Open ${node.name}`);
    bubble.setAttribute("data-node-id", node.id);
    
    // Get constellation icon
    const constellationData = CONSTELLATIONS[constellation];
    const iconPath = constellationData?.icon
      ? `assets/images/${constellationData.icon}.svg`
      : "assets/images/tree.svg";
    
    // Create bubble content using new design system
    bubble.innerHTML = `
      <div class="card--bubble">
        <img src="${iconPath}" alt="" class="document-icon" aria-hidden="true" />
        <div class="document-ripples"></div>
      </div>
      <span class="document-label">${node.name}</span>
    `;
    
    // Add click handler to open node
    bubble.addEventListener("click", () => this.openNode(node));
    
    // Add keyboard handler
    bubble.addEventListener("keydown", (event) => {
      if (EventUtils.isActivationKey(event)) {
        event.preventDefault();
        this.openNode(node);
      }
    });
    
    return bubble;
  }



  /**
   * Open node in modal
   * @param {Object} node - Node data
   */
  async openNode(node) {
    if (!this.modal || !this.modalDocument) {
      this.logger.error("Modal or document system not initialized");
      return;
    }
    
    try {
      // Set modal title
      const title = this.modal.querySelector("[data-component='modal-title']");
      if (title) {
        title.textContent = node.name;
      }
      
      // Show modal using new design system classes
      this.modal.classList.add("is-open");
      this.modal.setAttribute("aria-hidden", "false");
      
      // Load document content
      const content = await this.loadNodeContent(node);
      
      // Set content in document system
      this.modalDocument.setContent(content, node.name);
      
      // Store current node
      this.currentNode = node;
      
      // Focus management
      const closeBtn = this.modal.querySelector("[data-component='modal-close']");
      if (closeBtn) {
        closeBtn.focus();
      }
      
      // Update state
      this.state.set("currentNode", node);
      
      // Show notification
      ToastManager.success(
        `Diplomatic access granted: "${node.name}" • Data stream connected`
      );
    } catch (error) {
      this.logger.error("Failed to open node", error);
      
      // Load error message into document
      const errorContent = this.generateErrorContent(error);
      this.modalDocument.setContent(errorContent, "Psionic Error");
      
      // Show error notification
      ToastManager.error("Data stream temporarily inaccessible");
    }
  }

  /**
   * Generate error content
   * @param {Error} error - Error object
   * @returns {string} Error content in pencode format
   */
  generateErrorContent(error) {
    return `[h1]⚠️ PSIONIC DATA STREAM DISRUPTED[/h1]

Data stream temporarily inaccessible.

Nlom resonance error: ${error.message}

Attempting automatic psionic pathway re-establishment...`;
  }

  /**
   * Load node content
   * @param {Object} node - Node data
   * @returns {Promise<string>} Node content
   */
  async loadNodeContent(node) {
    // If this is a dynamically generated node with content, return it
    if (node._dynamicallyGenerated && node.content) {
      return node.content;
    }
    
    // If node has URL, try to load from URL
    if (node.url) {
      try {
        const response = await fetch(node.url);
        if (response.ok) {
          return await response.text();
        } else {
          throw new Error(`Failed to load node content: ${response.status}`);
        }
      } catch (error) {
        this.logger.warn(`Could not load file ${node.url}, using template:`, error);
      }
    }
    
    // Fall back to generated template content
    return this.generateDocumentTemplate(node);
  }

  /**
   * Generate document template
   * @param {Object} node - Node data
   * @returns {string} Template content
   */
  generateDocumentTemplate(node) {
    const cluster = node.constellation;
    const templateEngine = this.documentSystem.templateEngine;
    
    // Try constellation-specific template first, then fallback to generic
    let content;
    try {
      content = templateEngine.getTemplate('constellations', cluster, this.getTemplateData(node));
    } catch (error) {
      this.logger.warn(`No constellation template for ${cluster}, using generic`);
      content = templateEngine.getTemplate('constellations', 'generic', this.getTemplateData(node));
    }
    
    return content;
  }

  /**
   * Get template data for document
   * @param {Object} node - Node data
   * @returns {Object} Template data
   */
  getTemplateData(node) {
    const cluster = node.constellation;
    
    // Generate tags from metadata if available
    const tags = node.tags || [];
    if (node.metadata && node.metadata.type) {
      tags.push(node.metadata.type);
    }
    if (node.metadata && node.metadata.category) {
      tags.push(node.metadata.category);
    }
    
    return {
      // Common data for all templates
      documentId: node.id.toUpperCase(),
      date: `2467-${new Date().toISOString().split("T")[0].substring(5)}`, // Federation year format
      
      // Cluster-specific data
      templateId: `DIPL-${IDUtils.generateId("DIPL").split("-")[1]}`, // For hatching-egg
      reportPeriod: "2465.140 - 2465.147", // For star-chanter
      
      // Generic fallback data
      title: node.name,
      constellationName: CONSTELLATIONS[cluster]?.name || "Unknown",
      url: node.url,
      id: node.id,
      cluster: cluster,
      tags: tags.join(", "),
      
      // Additional required data for templates
      content: node.metadata?.description || "This data stream contains archived Federation diplomatic information accessed via the Nlom neural interface.",
      authority: "Nralakk Federation Diplomatic Mission",
      location: "SCCV Horizon, Stellar Corporate Conglomerate",
    };
  }



  /**
   * Close modal
   */
  closeModal() {
    if (!this.modal) return;
    
    // Hide modal using new design system classes
    this.modal.classList.remove("is-open");
    this.modal.setAttribute("aria-hidden", "true");
    
    // Clear current node
    this.currentNode = null;
    
    // Update state
    this.state.set("currentNode", null);
  }

  /**
   * Export node content
   * @param {string} format - Export format (md or json)
   */
  exportNode(format) {
    if (!this.currentNode) return;
    
    const node = this.currentNode;
    let content, filename, mimeType;
    
    if (format === "md") {
      content = this.nodeToMarkdown(node);
      filename = `${node.id}.md`;
      mimeType = "text/markdown";
      ToastManager.success(
        "Psionic echo successfully inscribed to personal memory engrams (.md)"
      );
    } else if (format === "json") {
      content = JSON.stringify(node, null, 2);
      filename = `${node.id}.json`;
      mimeType = "application/json";
      ToastManager.success(
        "Data stream encoded for Psionic Wake transmission (.json)"
      );
    }
    
    FileUtils.downloadFile(content, filename, mimeType);
  }

  /**
   * Convert node to Markdown format
   * @param {Object} node - Node data
   * @returns {string} Markdown content
   */
  nodeToMarkdown(node) {
    const constellation = CONSTELLATIONS[node.constellation];
    
    // Generate tags from metadata if available
    const tags = node.tags || [];
    if (node.metadata && node.metadata.type) {
      tags.push(node.metadata.type);
    }
    if (node.metadata && node.metadata.category) {
      tags.push(node.metadata.category);
    }
    
    return `# ${node.name}

**Constellation:** ${constellation?.name || node.constellation}
**Seal Level:** ${node.seal}
**Node ID:** ${node.id}
**Tags:** ${tags.join(", ")}

## Description

${node.metadata?.description || "No description available."}

## Source

**URL:** ${node.url}
**Cluster:** ${node.constellation}

---

*Exported from Nralakk Federation Diplomatic Mission Interface*
*Date: ${new Date().toISOString()}*
*Location: SCCV Horizon, Stellar Corporate Conglomerate*
*By: Diplomatic Mission Staff*

> "In the constellation of psionic data, every node is a star that guides the way to understanding through Nlom resonance."
> — Traditional Skrellian Diplomatic Wisdom`;
  }

  /**
   * Check if modal is open
   * @returns {boolean} Whether modal is open
   */
  isModalOpen() {
    return this.modal && this.modal.classList.contains("is-open");
  }

  /**
   * Get current node
   * @returns {Object|null} Current node
   */
  getCurrentNode() {
    return this.currentNode;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.closeModal();
    this.currentNode = null;
    this.modal = null;
    this.modalDocument = null;
    
    this.logger.info("NodeManager destroyed");
  }
}
