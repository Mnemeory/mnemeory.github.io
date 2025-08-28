/**
 * Document System
 * Manages document creation, editing, and rendering
 * 
 * Uses class toggles and data attributes for all visual state changes,
 * with no direct DOM styling.
 */

import { Logger, EventUtils } from "./utilities.js";
import { TemplateEngine } from "./template-engine.js";

export class DocumentSystem {
  constructor() {
    this.logger = new Logger("DocumentSystem");
    this.instances = new Map();
    this.templateEngine = new TemplateEngine();
    
    // Initialize system
    this.init();
  }

  /**
   * Initialize document system
   */
  init() {
    // Setup global keyboard shortcuts
    this.setupGlobalShortcuts();
    
    // Discover existing document containers
    this.discoverDocumentContainers();
    
    this.logger.info("Document system initialized");
  }

  /**
   * Setup global keyboard shortcuts
   */
  setupGlobalShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Global Ctrl+T for template insertion
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        const activeDocument = this.getActiveDocument();
        if (activeDocument && !activeDocument.config.readOnly) {
          event.preventDefault();
          activeDocument.showTemplateSelector();
        }
      }
    });
  }

  /**
   * Discover existing document containers in DOM
   */
  discoverDocumentContainers() {
    const containers = document.querySelectorAll('[data-document-container]');
    
    containers.forEach(container => {
      const containerId = container.dataset.documentContainer;
      
      if (!this.instances.has(containerId)) {
        const options = this.parseContainerOptions(container);
        this.createDocument(containerId, options);
      }
    });
    
    this.logger.info(`Discovered ${containers.length} document containers`);
  }

  /**
   * Parse options from container data attributes
   */
  parseContainerOptions(container) {
    return {
      readOnly: container.dataset.readonly === 'true',
      theme: container.dataset.theme || 'neural',
      templateCategory: container.dataset.templateCategory || 'federation',
      autoSave: container.dataset.autoSave === 'true',
      fileName: container.dataset.fileName || 'untitled-document.txt'
    };
  }

  /**
   * Create new document instance
   * @param {string} containerId - Container element ID
   * @param {Object} options - Document options
   * @returns {DocumentInstance} Document instance
   */
  createDocument(containerId, options = {}) {
    const config = {
      containerId,
      readOnly: options.readOnly || false,
      theme: options.theme || 'neural',
      templateCategory: options.templateCategory || 'federation',
      enableValidation: options.enableValidation !== false,
      autoSave: options.autoSave || false,
      fileName: options.fileName || 'untitled-document.txt',
      ...options
    };
    
    const document = new DocumentInstance(config, this);
    this.instances.set(containerId, document);
    
    return document;
  }

  /**
   * Get existing document instance
   * @param {string} containerId - Container element ID
   * @returns {DocumentInstance|null} Document instance
   */
  getDocument(containerId) {
    return this.instances.get(containerId) || null;
  }

  /**
   * Get currently active document
   * @returns {DocumentInstance|null} Active document
   */
  getActiveDocument() {
    const activeElement = document.activeElement;
    
    for (const [id, instance] of this.instances) {
      if (instance.elements.editor && instance.elements.editor.contains(activeElement)) {
        return instance;
      }
    }
    
    return null;
  }

  /**
   * Clean up document system
   */
  destroy() {
    // Destroy all document instances
    for (const instance of this.instances.values()) {
      instance.destroy();
    }
    
    this.instances.clear();
    this.logger.info("Document system destroyed");
  }
}

/**
 * Individual Document Instance
 */
class DocumentInstance {
  /**
   * @param {Object} config - Document configuration
   * @param {DocumentSystem} system - Parent document system
   */
  constructor(config, system) {
    this.config = config;
    this.system = system;
    this.logger = new Logger(`Document(${config.containerId})`);
    
    this.content = '';
    this.isEditMode = false;
    this.isDirty = false;
    
    // Get DOM elements
    this.elements = this.getElements();
    
    // Setup document
    this.setupDocument();
  }

  /**
   * Get DOM elements
   * @returns {Object} DOM elements
   */
  getElements() {
    const container = document.getElementById(this.config.containerId) ||
                     document.querySelector(`[data-document-container="${this.config.containerId}"]`);
    
    if (!container) {
      this.logger.warn(`Document container not found: ${this.config.containerId}`);
      return {};
    }
    
    return {
      container,
      editor: container.querySelector('[data-component="document-editor"]'),
      toolbar: container.querySelector('[data-component="document-toolbar"]'),
      toggleButton: container.querySelector('[data-action="toggle-view"]'),
      copyButton: container.querySelector('[data-action="copy-content"]'),
      saveButton: container.querySelector('[data-action="download-document"]'),
      templateButton: container.querySelector('[data-action="document-templates"]'),
      statusBar: container.querySelector('[data-component="document-status"]')
    };
  }

  /**
   * Setup document instance
   */
  setupDocument() {
    if (!this.elements.container) return;
    
    // Add theme classes using new design system
    this.elements.container.classList.add(
      'neural-document',
      `theme-${this.config.theme}`
    );
    this.elements.container.setAttribute('data-component', 'document-container');
    
    // Setup read-only mode
    if (this.config.readOnly) {
      this.elements.container.classList.add('document-readonly');
      this.hideEditControls();
    }
    
    // Bind events
    this.bindEvents();
    
    // Load initial content
    this.loadInitialContent();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const { elements } = this;
    
    // Toggle edit mode using neural button
    if (elements.toggleButton) {
      elements.toggleButton.classList.add('neural-button--toolbar');
      elements.toggleButton.setAttribute('data-component', 'neural-button');
      elements.toggleButton.addEventListener('click', () => this.toggleEditMode());
    }
    
    // Copy content with neural styling
    if (elements.copyButton) {
      elements.copyButton.classList.add('neural-button--toolbar');
      elements.copyButton.setAttribute('data-component', 'neural-button');
      elements.copyButton.addEventListener('click', () => this.copyContent());
    }
    
    // Save content with primary styling
    if (elements.saveButton) {
      elements.saveButton.classList.add('neural-button--toolbar', 'neural-button--primary');
      elements.saveButton.setAttribute('data-component', 'neural-button');
      elements.saveButton.addEventListener('click', () => this.saveContent());
    }
    
    // Template selector with secondary styling
    if (elements.templateButton) {
      elements.templateButton.classList.add('neural-button--toolbar');
      elements.templateButton.setAttribute('data-component', 'neural-button');
      elements.templateButton.addEventListener('click', () => this.showTemplateSelector());
    }
    
    // Editor events
    if (elements.editor) {
      elements.editor.addEventListener('input', (e) => this.handleEditorInput(e));
      elements.editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
      elements.editor.addEventListener('paste', (e) => this.handleEditorPaste(e));
      elements.editor.addEventListener('focus', () => this.handleEditorFocus());
      elements.editor.addEventListener('blur', () => this.handleEditorBlur());
    }
  }

  /**
   * Load initial content
   */
  loadInitialContent() {
    const placeholder = this.system.templateEngine.getPlaceholder(this.config.templateCategory);
    this.setContent(placeholder);
  }

  /**
   * Set document content
   * @param {string} content - Document content
   * @param {string} fileName - Optional filename
   */
  setContent(content, fileName = null) {
    this.content = content || '';
    
    if (fileName) {
      this.config.fileName = fileName;
    }
    
    this.isDirty = false;
    this.renderContent();
    this.updateStatusBar();
  }

  /**
   * Get document content
   * @returns {string} Document content
   */
  getContent() {
    return this.content;
  }

  /**
   * Toggle between edit and preview modes
   */
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      this.enterEditMode();
    } else {
      this.enterPreviewMode();
    }
    
    this.updateToolbarState();
    this.renderContent();
  }

  /**
   * Enter edit mode
   */
  enterEditMode() {
    this.elements.container.classList.add('edit-mode');
    this.elements.editor.setAttribute('contenteditable', 'true');
    this.elements.editor.focus();
    
    // Update accessibility
    this.elements.toggleButton?.setAttribute('aria-pressed', 'true');
    this.elements.toggleButton?.setAttribute('title', 'Switch to preview mode');
  }

  /**
   * Enter preview mode
   */
  enterPreviewMode() {
    this.elements.container.classList.remove('edit-mode');
    this.elements.editor.setAttribute('contenteditable', 'false');
    
    // Update accessibility
    this.elements.toggleButton?.setAttribute('aria-pressed', 'false');
    this.elements.toggleButton?.setAttribute('title', 'Switch to edit mode');
  }

  /**
   * Render content based on current mode
   */
  renderContent() {
    if (!this.elements.editor) return;
    
    // In a real implementation, this would use the PencodeRenderer
    // For now, we'll just show the raw content in edit mode and a simple display in preview mode
    if (this.isEditMode) {
      // For edit mode, keep it simple with escaped HTML
      this.elements.editor.textContent = this.content;
    } else {
      // For preview mode, do minimal formatting
      this.elements.editor.innerHTML = this.content
        .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
        .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
        .replace(/\[h1\](.*?)\[\/h1\]/g, '<h1 class="neural-heading neural-heading--primary">$1</h1>')
        .replace(/\[h2\](.*?)\[\/h2\]/g, '<h2 class="neural-heading neural-heading--secondary">$1</h2>')
        .replace(/\[h3\](.*?)\[\/h3\]/g, '<h3 class="neural-heading neural-heading--tertiary">$1</h3>')
        .replace(/\n/g, '<br>');
    }
  }

  /**
   * Update toolbar state
   */
  updateToolbarState() {
    // Update button states based on current mode
    if (this.elements.toggleButton) {
      this.elements.toggleButton.setAttribute('aria-pressed', this.isEditMode.toString());
    }
  }

  /**
   * Update status bar
   */
  updateStatusBar() {
    if (!this.elements.statusBar) return;
    
    const status = [];
    if (this.isDirty) status.push('Modified');
    if (this.isEditMode) status.push('Edit Mode');
    else status.push('Preview Mode');
    
    this.elements.statusBar.textContent = status.join(' • ');
  }

  /**
   * Handle editor input
   */
  handleEditorInput() {
    if (!this.elements.editor) return;
    
    // In a real implementation, this would use the PencodeRenderer's extract function
    this.content = this.elements.editor.textContent || '';
    
    this.isDirty = true;
    this.updateStatusBar();
  }

  /**
   * Handle editor keyboard shortcuts
   */
  handleEditorKeydown(event) {
    // Ctrl/Cmd + Enter: Toggle edit mode
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.toggleEditMode();
      return;
    }
    
    // Ctrl/Cmd + S: Save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.saveContent();
      return;
    }
  }

  /**
   * Handle paste events
   */
  handleEditorPaste(event) {
    if (!this.isEditMode) return;
    
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    
    if (text) {
      // Insert text at cursor position
      document.execCommand('insertText', false, text);
    }
  }

  /**
   * Handle editor focus
   */
  handleEditorFocus() {
    this.elements.container.classList.add('focused');
  }

  /**
   * Handle editor blur
   */
  handleEditorBlur() {
    this.elements.container.classList.remove('focused');
  }

  /**
   * Copy document content
   */
  async copyContent() {
    try {
      await navigator.clipboard.writeText(this.content);
      
      // Show success indicator using new design system
      this.elements.copyButton?.classList.add('is-success', 'shadow-neural-sm');
      setTimeout(() => {
        this.elements.copyButton?.classList.remove('is-success', 'shadow-neural-sm');
      }, 1500);
      
      // Return success message to caller
      return { success: true, message: 'Document copied to neural archive' };
    } catch (error) {
      this.logger.error('Copy failed:', error);
      
      // Show error indicator using new design system
      this.elements.copyButton?.classList.add('is-error', 'shadow-neural-lg');
      setTimeout(() => {
        this.elements.copyButton?.classList.remove('is-error', 'shadow-neural-lg');
      }, 1500);
      
      return { success: false, error: 'Failed to copy document' };
    }
  }

  /**
   * Save document content
   */
  saveContent() {
    try {
      // Download file
      this.downloadContent();
      this.isDirty = false;
      this.updateStatusBar();
      
      // Show success indicator using new design system
      this.elements.saveButton?.classList.add('is-success', 'shadow-neural-sm');
      setTimeout(() => {
        this.elements.saveButton?.classList.remove('is-success', 'shadow-neural-sm');
      }, 1500);
      
      return { success: true, message: 'Document transmitted to local neural storage' };
    } catch (error) {
      this.logger.error('Save failed:', error);
      
      // Show error indicator via class toggle
      this.elements.saveButton?.classList.add('is-error');
      setTimeout(() => {
        this.elements.saveButton?.classList.remove('is-error');
      }, 1500);
      
      return { success: false, error: 'Failed to save document' };
    }
  }

  /**
   * Download content as file
   */
  downloadContent() {
    const blob = new Blob([this.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = this.config.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Show template selector
   */
  showTemplateSelector() {
    // In a real implementation, this would show a UI for selecting templates
    this.logger.info('Template selector requested');
    
    // Dispatch custom event for template selector
    EventUtils.dispatch('document:template:select', {
      documentId: this.config.containerId,
      category: this.config.templateCategory
    });
  }

  /**
   * Hide edit controls for read-only mode
   */
  hideEditControls() {
    const controls = [
      this.elements.toggleButton,
      this.elements.saveButton,
      this.elements.templateButton
    ];
    
    controls.forEach(control => {
      if (control) control.classList.add('hidden');
    });
  }

  /**
   * Cleanup document instance
   */
  destroy() {
    this.logger.info('Document instance destroyed');
  }
}


