/**
 * Unified Document System - Nralakk Federation Neural Interface
 *
 * Comprehensive document management system with integrated template engine,
 * pencode rendering, and theme-consistent UI components.
 *
 * Follows DRY principles and modular architecture with clear separation of concerns.
 */

import { SITE_CONFIG, getSelector, CONSTANTS, KEYS } from "../config.js";
import { ToastManager, EventUtils } from "./shared-utilities.js";
import { TemplateEngine } from "./template-engine.js";
import { PencodeRenderEngine, DocumentValidator } from "./pencode-renderer.js";

/**
 * Document System Manager - Central orchestrator for all document operations
 */
export class DocumentSystem {
  constructor() {
    this.instances = new Map();
    this.templateEngine = new TemplateEngine();
    this.renderEngine = new PencodeRenderEngine();
    this.validator = new DocumentValidator();
    this.cache = new Map();

    // Initialize system
    this.init();
  }

  init() {
    // Setup global keyboard shortcuts
    this.setupGlobalShortcuts();

    // Initialize any existing document containers
    this.discoverDocumentContainers();
  }

  /**
   * Create new document instance
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
   */
  getDocument(containerId) {
    return this.instances.get(containerId);
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
   * Get currently active document
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
}

/**
 * Individual Document Instance
 */
export class DocumentInstance {
  constructor(config, system) {
    this.config = config;
    this.system = system;
    this.content = '';
    this.isEditMode = false;
    this.isDirty = false;
    this.scrollState = null;
    this.renderTimeout = null;
    this.saveTimeout = null;

    // Get DOM elements
    this.elements = this.getElements();

    // Setup document
    this.setupDocument();
  }

  /**
   * Get DOM elements for this document
   */
  getElements() {
    const container = document.getElementById(this.config.containerId) ||
                     document.querySelector(`[data-document-container="${this.config.containerId}"]`);

    if (!container) {
      console.warn(`Document container not found: ${this.config.containerId}`);
      return {};
    }

    return {
      container,
      editor: container.querySelector('.document-editor'),
      toolbar: container.querySelector('.document-toolbar'),
      toggleButton: container.querySelector('.document-toggle') || document.querySelector(getSelector('modalPilcrow')),
      copyButton: container.querySelector('.document-copy') || document.querySelector(getSelector('modalCopy')),
      saveButton: container.querySelector('.document-save') || document.querySelector(getSelector('modalSave')),
      templateButton: container.querySelector('.document-templates'),
      statusBar: container.querySelector('.document-status') || document.querySelector(getSelector('modalDocumentStatus'))
    };
  }

  /**
   * Setup document instance
   */
  setupDocument() {
    if (!this.elements.container) return;

    // Add theme classes
    this.elements.container.classList.add(
      'neural-document',
      `theme-${this.config.theme}`
    );

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

    // Toggle edit mode
    if (elements.toggleButton) {
      elements.toggleButton.addEventListener('click', () => this.toggleEditMode());
    }

    // Copy content
    if (elements.copyButton) {
      elements.copyButton.addEventListener('click', () => this.copyContent());
    }

    // Save content
    if (elements.saveButton) {
      elements.saveButton.addEventListener('click', () => this.saveContent());
    }

    // Template selector
    if (elements.templateButton) {
      elements.templateButton.addEventListener('click', () => this.showTemplateSelector());
    }

    // Editor events
    if (elements.editor) {
      elements.editor.addEventListener('input', (e) => this.handleEditorInput(e));
      elements.editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
      elements.editor.addEventListener('paste', (e) => this.handleEditorPaste(e));
      elements.editor.addEventListener('scroll', (e) => this.handleEditorScroll(e));
      elements.editor.addEventListener('focus', () => this.handleEditorFocus());
      elements.editor.addEventListener('blur', () => this.handleEditorBlur());
    }
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
    this.elements.editor.contentEditable = true;
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
    this.elements.editor.contentEditable = false;

    // Update accessibility
    this.elements.toggleButton?.setAttribute('aria-pressed', 'false');
    this.elements.toggleButton?.setAttribute('title', 'Switch to edit mode');
  }

  /**
   * Load initial content
   */
  loadInitialContent() {
    // Check for auto-saved content first
    const autoSavedData = this.restoreAutoSave();
    if (autoSavedData && this.config.autoSave) {
      this.showAutoSavePrompt(autoSavedData);
    } else {
      const placeholder = this.system.templateEngine.getPlaceholder(this.config.templateCategory);
      this.setContent(placeholder);
    }
  }

  /**
   * Show prompt to restore auto-saved content
   */
  showAutoSavePrompt(autoSavedData) {
    const message = `Auto-saved document found from ${autoSavedData.ageMinutes} minutes ago. Restore it?`;

    // Use a simple confirm for now - could be enhanced with a proper UI
    if (confirm(message)) {
      this.setContent(autoSavedData.content, autoSavedData.fileName);
      ToastManager.success('Auto-saved document restored');
    } else {
      // Clear old auto-save and load placeholder
      this.clearAutoSave();
      const placeholder = this.system.templateEngine.getPlaceholder(this.config.templateCategory);
      this.setContent(placeholder);
    }
  }

  /**
   * Set document content
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
   */
  getContent() {
    return this.content;
  }

  /**
   * Render content based on current mode
   */
  renderContent() {
    if (!this.elements.editor) return;

    this.preserveScrollState();

    try {
      const rendered = this.system.renderEngine.render(this.content, {
        showTags: this.isEditMode,
        theme: this.config.theme,
        fileName: this.config.fileName
      });

      this.elements.editor.innerHTML = rendered;

      // Apply theme-specific styling
      this.applyThemeStyles();

      this.restoreScrollState();
    } catch (error) {
      console.error('Document render error:', error);
      this.showError('Document rendering failed', error.message);
    }
  }

  /**
   * Apply theme-specific styling
   */
  applyThemeStyles() {
    // Add theme-specific classes and effects based on current theme
    const themeClass = `neural-theme-${this.config.theme}`;
    this.elements.editor.classList.add(themeClass);
  }

  /**
   * Handle editor input
   */
  handleEditorInput(event) {
    this.content = this.system.renderEngine.extractPencode(this.elements.editor, this.isEditMode);
    this.isDirty = true;
    this.updateStatusBar();

    // Debounced re-rendering
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }

    this.renderTimeout = setTimeout(() => {
      if (this.isEditMode) {
        this.renderContent();
      }
    }, CONSTANTS.SHORT_DELAY);

    // Auto-save if enabled
    if (this.config.autoSave && this.isDirty) {
      this.debouncedSave();
    }
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

    // Tab: Insert spaces
    if (event.key === KEYS.TAB && this.isEditMode) {
      event.preventDefault();
      document.execCommand('insertText', false, '  ');
    }

    // Enter: Insert line break
    if (event.key === KEYS.ENTER && this.isEditMode) {
      event.preventDefault();
      document.execCommand('insertHTML', false, '<br>');
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
      const sanitized = this.system.renderEngine.sanitizeText(text);
      document.execCommand('insertText', false, sanitized);
    }
  }

  /**
   * Copy document content
   */
  async copyContent() {
    try {
      // Validate before copying
      const validation = this.system.validator.validate(this.content);
      if (!validation.isValid) {
        ToastManager.warning(`Validation warnings: ${validation.warnings.join(', ')}`);
      }

      await navigator.clipboard.writeText(this.content);
      ToastManager.success('Document copied to neural archive');
    } catch (error) {
      console.error('Copy failed:', error);
      ToastManager.error('Failed to copy document');
    }
  }

  /**
   * Save document content
   */
  saveContent() {
    try {
      // Validate before saving
      const validation = this.system.validator.validate(this.content);
      if (!validation.isValid && validation.errors.length > 0) {
        ToastManager.error(`Cannot save: ${validation.errors.join(', ')}`);
        return;
      }

      // Download file
      this.downloadContent();
      this.isDirty = false;
      this.updateStatusBar();

      // Clear auto-save when manually saved
      this.clearAutoSave();

      ToastManager.success('Document transmitted to local neural storage');
    } catch (error) {
      console.error('Save failed:', error);
      ToastManager.error('Failed to save document');
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
    const templates = this.system.templateEngine.getAvailableTemplates(this.config.templateCategory);
    const templateNames = Object.keys(templates);

    if (templateNames.length === 0) {
      ToastManager.info('No templates available for this document type');
      return;
    }

    // Show template selector in a temporary UI overlay within the current editor
    this.showTemplateChooser(templates, templateNames);
  }

  /**
   * Show template chooser UI within the document editor
   */
  showTemplateChooser(templates, templateNames) {
    if (!this.elements.editor) return;

    // Create template selector overlay
    const overlay = document.createElement('div');
    overlay.className = 'template-selector-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--gradient-neural-primary);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      z-index: 10;
      backdrop-filter: blur(10px);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    `;

    const title = document.createElement('h4');
    title.textContent = 'Select Template';
    title.style.cssText = `
      margin: 0;
      color: var(--color-pale-turquoise);
      font-family: var(--font-primary);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: 1px solid var(--glass-border);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      color: var(--color-pale-turquoise);
      cursor: pointer;
      font-size: var(--text-lg);
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3);
      max-height: 300px;
      overflow-y: auto;
    `;

    // Create template buttons
    templateNames.forEach(templateName => {
      const button = document.createElement('button');
      button.className = 'flow-action';
      button.style.cssText = `
        padding: var(--space-3);
        text-align: center;
        min-width: auto;
        height: auto;
      `;

      const name = document.createElement('div');
      name.textContent = templateName.charAt(0).toUpperCase() + templateName.slice(1);
      name.style.cssText = `
        font-weight: 600;
        margin-bottom: var(--space-1);
      `;

      const desc = document.createElement('div');
      desc.textContent = this.getTemplateDescription(templateName);
      desc.style.cssText = `
        font-size: var(--text-xs);
        opacity: 0.8;
      `;

      button.appendChild(name);
      button.appendChild(desc);

      button.addEventListener('click', () => {
        this.selectTemplate(templateName, templates[templateName]);
        this.removeTemplateChooser();
      });

      grid.appendChild(button);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    overlay.appendChild(header);
    overlay.appendChild(grid);

    // Position relative to editor
    this.elements.container.style.position = 'relative';
    this.elements.container.appendChild(overlay);

    // Event listeners
    closeBtn.addEventListener('click', () => this.removeTemplateChooser());

    // Close on escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.removeTemplateChooser();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Store reference for cleanup
    this._templateOverlay = overlay;
    this._templateEscapeHandler = escapeHandler;
  }

  /**
   * Remove template chooser
   */
  removeTemplateChooser() {
    if (this._templateOverlay && this._templateOverlay.parentNode) {
      this._templateOverlay.parentNode.removeChild(this._templateOverlay);
    }
    if (this._templateEscapeHandler) {
      document.removeEventListener('keydown', this._templateEscapeHandler);
    }
    this._templateOverlay = null;
    this._templateEscapeHandler = null;
  }

  /**
   * Get template description for display
   */
  getTemplateDescription(templateName) {
    const descriptions = {
      memo: 'Diplomatic memorandum format',
      report: 'Mission analysis report',
      letter: 'Official correspondence',
      briefing: 'Classified mission briefing',
      standard: 'Standard Federation document',
      citizenReport: 'Citizen services report',
      individualCitizen: 'Individual citizen record'
    };
    return descriptions[templateName] || 'Template document';
  }

  /**
   * Select and insert template
   */
  selectTemplate(templateName, templateConfig) {
    const template = this.system.templateEngine.getTemplate(this.config.templateCategory, templateName);
    this.setContent(template);

    // Clear auto-save when template is inserted (fresh start)
    this.clearAutoSave();

    ToastManager.success(`Template "${templateName}" inserted`);
  }

  /**
   * Preserve scroll state
   */
  preserveScrollState() {
    if (!this.elements.editor) return;

    this.scrollState = {
      scrollTop: this.elements.editor.scrollTop,
      scrollLeft: this.elements.editor.scrollLeft,
      scrollHeight: this.elements.editor.scrollHeight,
      clientHeight: this.elements.editor.clientHeight
    };
  }

  /**
   * Restore scroll state
   */
  restoreScrollState() {
    if (!this.elements.editor || !this.scrollState) return;

    requestAnimationFrame(() => {
      const { scrollState } = this;
      const editor = this.elements.editor;

      // Simple restoration for now
      editor.scrollTop = scrollState.scrollTop;
      editor.scrollLeft = scrollState.scrollLeft;
    });
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
   * Show error message
   */
  showError(title, message) {
    ToastManager.error(`${title}: ${message}`);
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
      if (control) control.style.display = 'none';
    });
  }

  // Additional handler methods
  handleEditorScroll() { this.preserveScrollState(); }
  handleEditorFocus() { this.elements.container.classList.add('focused'); }
  handleEditorBlur() { this.elements.container.classList.remove('focused'); }

  debouncedSave() {
    // Clear any existing save timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout for auto-save
    this.saveTimeout = setTimeout(() => {
      if (this.isDirty && this.config.autoSave) {
        this.performAutoSave();
      }
    }, CONSTANTS.AUTO_SAVE_DELAY || 3000); // Default to 3 seconds if not defined in config
  }

  /**
   * Perform auto-save operation
   */
  performAutoSave() {
    try {
      // Validate content before auto-saving
      const validation = this.system.validator.validate(this.content);
      if (!validation.isValid && validation.errors.length > 0) {
        console.warn('Auto-save skipped due to validation errors:', validation.errors);
        return;
      }

      // Save to localStorage as backup
      const autoSaveKey = `autoSave_${this.config.containerId}`;
      const autoSaveData = {
        content: this.content,
        fileName: this.config.fileName,
        timestamp: Date.now(),
        version: 1
      };

      localStorage.setItem(autoSaveKey, JSON.stringify(autoSaveData));

      // Update status
      this.isDirty = false;
      this.updateStatusBar();

      // Show subtle notification
      ToastManager.info('Document auto-saved to local neural cache', { duration: 2000 });

      console.log(`Auto-saved document: ${this.config.fileName}`);
    } catch (error) {
      console.error('Auto-save failed:', error);
      ToastManager.warning('Auto-save failed - manual save recommended');
    }
  }

  /**
   * Restore auto-saved content if available
   */
  restoreAutoSave() {
    try {
      const autoSaveKey = `autoSave_${this.config.containerId}`;
      const autoSaveData = localStorage.getItem(autoSaveKey);

      if (autoSaveData) {
        const parsed = JSON.parse(autoSaveData);
        const ageMinutes = (Date.now() - parsed.timestamp) / (1000 * 60);

        // Only restore if less than 24 hours old
        if (ageMinutes < 1440) {
          return {
            content: parsed.content,
            fileName: parsed.fileName,
            timestamp: new Date(parsed.timestamp),
            ageMinutes: Math.round(ageMinutes)
          };
        } else {
          // Clean up old auto-save data
          localStorage.removeItem(autoSaveKey);
        }
      }
    } catch (error) {
      console.error('Failed to restore auto-save:', error);
    }

    return null;
  }

  /**
   * Clear auto-save data
   */
  clearAutoSave() {
    const autoSaveKey = `autoSave_${this.config.containerId}`;
    localStorage.removeItem(autoSaveKey);
  }

  /**
   * Cleanup document instance
   */
  destroy() {
    // Clear any active timeouts
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Remove template overlay if active
    this.removeTemplateChooser();

    // Clear auto-save
    this.clearAutoSave();
  }
}

// Export singleton instance - lazy initialization
let _documentSystemInstance = null;

export const documentSystem = {
  get instance() {
    if (!_documentSystemInstance) {
      _documentSystemInstance = new DocumentSystem();
    }
    return _documentSystemInstance;
  }
};
