/**
 * Node Management System for Data Cards
 * Handles data node interactions, modal system, and export functionality
 */

import {
  CONSTELLATIONS,
  ANIMATION_CONFIG,
  CONSTANTS,
  SITE_CONFIG,
  getSelector,
  getAssetPath,
  getInterfaceText,
  getClearanceInfo,
  formatClearanceLevel,
  createStandardError,
  logError,
  getDocumentTemplate,
  renderTemplate,
} from "../config.js";
import { ToastManager, FileUtils, IDUtils } from "./shared-utilities.js";
import { CitizenUI } from "./citizen-ui.js";

export class NodeManager {
  constructor(state, paperEditor) {
    this.state = state;
    this.paperEditor = paperEditor;
    this.modal = null;
    this.modalPaperInstance = null;
    this.currentNode = null;
    this.citizenUI = new CitizenUI();
    this.setupModal();
  }

  /**
   * Setup modal system
   */
  setupModal() {
    this.modal = document.querySelector(getSelector("nodeModal"));
    if (!this.modal) return;

    // Initialize paper editor for modal
    this.modalPaperInstance = this.paperEditor.init("modal", {
      readOnly: false,
      defaultName: "document.txt",
    });

    // Close button
    const closeBtn = document.querySelector(getSelector("modalClose"));
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    // Backdrop click
    const backdrop = this.modal.querySelector(".bubble-ocean");
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeModal());
    }

    // Escape key
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        this.modal.getAttribute("aria-hidden") === "false"
      ) {
        this.closeModal();
      }
    });

    // Export buttons
    const inscribeBtn = document.querySelector(getSelector("modalInscribe"));
    const transmitBtn = document.querySelector(getSelector("modalTransmit"));

    if (inscribeBtn) {
      inscribeBtn.addEventListener("click", () => this.exportNode("md"));
    }

    if (transmitBtn) {
      transmitBtn.addEventListener("click", () => this.exportNode("json"));
    }
  }

  /**
   * Populate constellation with data nodes
   */
  populateConstellation(constellation, nodes) {
    const container = document.getElementById(`${constellation}-nodes`);
    if (!container) return;

    container.innerHTML = "";

    // Special handling for Qu'Poxii constellation - show citizen management interface
    if (constellation === "qu-poxii") {
      const citizenInterfaceId = "citizen-interface";
      container.innerHTML = `
        <div class="citizen-management-container">
          <div id="${citizenInterfaceId}" class="citizen-interface-wrapper"></div>
        </div>
      `;

      // Initialize citizen UI
      setTimeout(() => {
        this.citizenUI.init(`#${citizenInterfaceId}`);

        // Pass citizen files to the citizen manager if available
        const citizenFiles = this.state.get("citizenFiles");
        if (citizenFiles && citizenFiles.length > 0) {
          this.citizenUI.citizenManager.setCitizenFiles(citizenFiles);
          console.log(
            `Node Manager: Passed ${citizenFiles.length} citizen files to Citizen Manager`
          );
        }
      }, 100);

      // Also show citizen files as thought bubble documents below the management interface
      const filteredNodes = nodes.filter(
        (node) => node.constellation === constellation
      );

      if (filteredNodes.length > 0) {
        const citizenFilesContainer = document.createElement("div");
        citizenFilesContainer.className = "citizen-files-section";
        citizenFilesContainer.innerHTML = `
          <div class="citizen-files-header">
            <h4>Citizen Records</h4>
            <p>Available citizen data files from the repository</p>
          </div>
        `;

        const thoughtBubbleContainer = document.createElement("div");
        thoughtBubbleContainer.className = "thought-bubble-documents";
        thoughtBubbleContainer.setAttribute(
          "data-constellation",
          constellation
        );
        thoughtBubbleContainer.setAttribute("role", "region");
        thoughtBubbleContainer.setAttribute(
          "aria-label",
          `${constellationData?.name || constellation} citizen files collection`
        );

        // Create thought bubble documents for citizen files
        filteredNodes.forEach((node, index) => {
          const thoughtBubble = this.createThoughtBubbleDocument(
            node,
            constellation
          );

          // Stagger animations
          thoughtBubble.style.opacity = "0";
          thoughtBubble.style.transform = "translateY(20px) scale(0.9)";

          setTimeout(() => {
            thoughtBubble.style.transition = `opacity ${ANIMATION_CONFIG.nodeBloom}ms ease-out, transform ${ANIMATION_CONFIG.nodeBloom}ms ease-out`;
            thoughtBubble.style.opacity = "1";
            thoughtBubble.style.transform = "translateY(0) scale(1)";

            setTimeout(() => {
              thoughtBubble.style.transition = "";
            }, ANIMATION_CONFIG.nodeBloom);
          }, index * 100);

          thoughtBubbleContainer.appendChild(thoughtBubble);
        });

        citizenFilesContainer.appendChild(thoughtBubbleContainer);
        container.appendChild(citizenFilesContainer);
      }

      return;
    }

    // Special handling for constellations with shell configurations
    const constellationData = CONSTELLATIONS[constellation];
    if (constellationData?.descriptions?.shell) {
      const shell = constellationData.descriptions.shell;
      container.innerHTML = `
        <div class="constellation-shell">
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
        </div>
      `;
      return;
    }

    const filteredNodes = nodes.filter(
      (node) => node.constellation === constellation
    );

    if (filteredNodes.length === 0) {
      container.innerHTML = `
        <div class="empty-constellation">
          <p>No psionic data streams available in this constellation.</p>
          <p class="text-shimmer">The Nlom-linked stars are dormant here, for now.</p>
        </div>
      `;
      return;
    }

    // Create thought bubble document layout
    const thoughtBubbleContainer = document.createElement("div");
    thoughtBubbleContainer.className = "thought-bubble-documents";
    thoughtBubbleContainer.setAttribute("data-constellation", constellation);
    thoughtBubbleContainer.setAttribute("role", "region");
    thoughtBubbleContainer.setAttribute(
      "aria-label",
      `${constellationData?.name || constellation} document collection`
    );

    // Create thought bubble documents
    filteredNodes.forEach((node, index) => {
      const thoughtBubble = this.createThoughtBubbleDocument(
        node,
        constellation
      );

      // Stagger animations
      thoughtBubble.style.opacity = "0";
      thoughtBubble.style.transform = "translateY(20px) scale(0.9)";

      setTimeout(() => {
        thoughtBubble.style.transition = `opacity ${ANIMATION_CONFIG.nodeBloom}ms ease-out, transform ${ANIMATION_CONFIG.nodeBloom}ms ease-out`;
        thoughtBubble.style.opacity = "1";
        thoughtBubble.style.transform = "translateY(0) scale(1)";

        setTimeout(() => {
          thoughtBubble.style.transition = "";
        }, ANIMATION_CONFIG.nodeBloom);
      }, index * 100);

      thoughtBubbleContainer.appendChild(thoughtBubble);
    });

    container.appendChild(thoughtBubbleContainer);
  }

  /**
   * Create individual thought bubble document
   */
  createThoughtBubbleDocument(node, constellation) {
    const bubble = document.createElement("button");
    bubble.className = "thought-bubble-document";
    bubble.setAttribute("type", "button");
    bubble.setAttribute("role", "button");
    bubble.setAttribute("tabindex", "0");
    bubble.setAttribute("aria-label", `Open ${node.name}`);

    // Determine clearance styling using centralized config
    const clearanceInfo = getClearanceInfo(node.seal);
    const clearanceClass = clearanceInfo.class;
    const clearanceText = clearanceInfo.label;

    // Get constellation icon for the document
    const constellationData = CONSTELLATIONS[constellation];
    const iconPath = constellationData?.icon
      ? `assets/images/${constellationData.icon}.svg`
      : "assets/images/tree.svg";

    bubble.innerHTML = `
      <div class="document-bubble">
        <img src="${iconPath}" alt="" class="document-icon" aria-hidden="true" />
        <div class="document-ripples"></div>
        <div class="document-seal ${clearanceClass}">${clearanceText.charAt(0)}</div>
      </div>
      <span class="document-label">${node.name}</span>
    `;

    // Add interaction handlers
    const activate = () => this.openNode(node);

    bubble.addEventListener("click", activate);
    bubble.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });

    return bubble;
  }

  /**
   * Create individual node card
   */
  createNodeCard(node) {
    const card = document.createElement("div");
    card.className = "data-node";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Open ${node.name}`);

    // Determine clearance styling using centralized config
    const clearanceInfo = getClearanceInfo(node.seal);
    const clearanceClass = clearanceInfo.class;
    const clearanceText = clearanceInfo.label;

    // Generate tags from metadata if available
    const tags = node.tags || [];
    if (node.metadata && node.metadata.type) {
      tags.push(node.metadata.type);
    }
    if (node.metadata && node.metadata.category) {
      tags.push(node.metadata.category);
    }

    card.innerHTML = `
      <div class="node-header">
        <span class="node-seal ${clearanceClass}">${clearanceText}</span>
      </div>
      <h3 class="node-title">${node.name}</h3>
      <p class="node-description">${
        node.metadata?.description ||
        "Psionic data stream available for diplomatic access."
      }</p>
      <div class="node-tags">
        ${tags.map((tag) => `<span class="node-tag">${tag}</span>`).join("")}
      </div>
    `;

    // Add interaction handlers
    const activate = () => this.openNode(node);

    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });

    return card;
  }

  /**
   * Open node in modal
   */
  async openNode(node) {
    if (!this.modal) return;

    // Set modal title
    const title = document.getElementById("modal-title");
    if (title) {
      title.textContent = node.name;
    }

    try {
      // Load document content
      const content = await this.loadNodeContent(node);

      // Load content into paper editor
      this.paperEditor.loadDocument("modal", content, node.name);
      this.currentNode = node;
    } catch (error) {
      const standardError = createStandardError(
        "Data stream temporarily inaccessible.",
        error,
        "DATA_LOAD_ERROR"
      );
      logError(standardError, "NodeModal");

      // Load error message into paper editor
      const errorContent = `[h1]⚠️ PSIONIC DATA STREAM DISRUPTED[/h1]\n\n${standardError.message}\n\nNlom resonance error: ${error.message}\n\nAttempting automatic psionic pathway re-establishment...`;
      this.paperEditor.loadDocument("modal", errorContent, "Psionic Error");
    }

    // Show modal
    this.modal.setAttribute("aria-hidden", "false");

    // Focus management
    const closeBtn = document.getElementById("modal-close");
    if (closeBtn) {
      closeBtn.focus();
    }

    // Add toast notification
    this.showToast(
      `Diplomatic access granted: "${node.name}" • Data stream connected`,
      "success"
    );
  }

  /**
   * Load node content - for dynamic files, load directly; fallback to templates
   */
  async loadNodeContent(node) {
    // If this is a dynamically generated node with actual file, try to load it
    if (node._dynamicallyGenerated) {
      try {
        const response = await fetch(node.url);
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn(`Could not load file ${node.url}, using template:`, error);
      }
    }

    // Fall back to generated template content
    return this.generateDocumentTemplate(node);
  }

  /**
   * Generate document template content in pencode format
   */
  generateDocumentTemplate(node) {
    const cluster = node.constellation;

    // Get template from config - try cluster-specific first, then fallback to generic
    const template =
      getDocumentTemplate(cluster) || getDocumentTemplate("generic");

    // Generate tags from metadata if available
    const tags = node.tags || [];
    if (node.metadata && node.metadata.type) {
      tags.push(node.metadata.type);
    }
    if (node.metadata && node.metadata.category) {
      tags.push(node.metadata.category);
    }

    // Prepare data for template rendering
    const templateData = {
      // Common data for all templates
      documentId: node.id.toUpperCase(),
      date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format

      // Cluster-specific data
      clearanceLevel: formatClearanceLevel(node.seal, cluster),
      templateId: `DIPL-${IDUtils.generateId("DIPL").split("-")[1]}`, // For hatching-egg
      reportPeriod: "2465.140 - 2465.147", // For star-chanter

      // Generic fallback data
      title: node.name,
      constellationName: CONSTELLATIONS[cluster]?.name || "Unknown",
      url: node.url,
      id: node.id,
      cluster: cluster,
      seal: node.seal,
      tags: tags.join(", "),
    };

    return renderTemplate(template, templateData);
  }

  /**
   * Close modal
   */
  closeModal() {
    if (!this.modal) return;

    this.modal.setAttribute("aria-hidden", "true");
    this.currentNode = null;
  }

  /**
   * Export node content
   */
  exportNode(format) {
    if (!this.currentNode) return;

    const node = this.currentNode;
    let content, filename, mimeType;

    if (format === "md") {
      content = this.nodeToMarkdown(node);
      filename = `${node.id}.md`;
      mimeType = "text/markdown";
      this.showToast(
        "Psionic echo successfully inscribed to personal memory engrams (.md)",
        "success"
      );
    } else if (format === "json") {
      content = JSON.stringify(node, null, 2);
      filename = `${node.id}.json`;
      mimeType = "application/json";
      this.showToast(
        "Data stream encoded for Psionic Wake transmission (.json)",
        "success"
      );
    }

    FileUtils.downloadFile(content, filename, mimeType);
  }

  /**
   * Convert node to Markdown format
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
> — Traditional Skrellian Diplomatic Wisdom
`;
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    ToastManager.show(message, type);
  }

  /**
   * Get current node
   */
  getCurrentNode() {
    return this.currentNode;
  }

  /**
   * Check if modal is open
   */
  isModalOpen() {
    return this.modal && this.modal.getAttribute("aria-hidden") === "false";
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.closeModal();
    this.currentNode = null;
    this.modal = null;
    this.modalPaperInstance = null;
    console.log("NodeManager destroyed");
  }
}
