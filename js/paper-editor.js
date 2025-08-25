/**
 * Paper Document Editor - Integrated with Nlom Interface
 * Dynamic document management for Nralakk Federation
 */

import { PencodeCompat } from "./pencode-compat.js";
import { ToastManager } from "./modules/shared-utilities.js";
import { SITE_CONFIG, getSelector, CONSTANTS, KEYS } from "./config.js";

/**
 * Pencode Renderer - wrapper around compatibility mapper
 */
export class PencodeRenderer {
  static render(rawText, opts = {}) {
    const formatted = PencodeCompat.toHtml(rawText, opts);
    return `<div class="nlom-paper federation-document"><div class="paper-content">${formatted}</div></div>`;
  }

  static renderCombined(rawText) {
    let formatted = PencodeCompat.toHtml(rawText);
    formatted = formatted
      .replace(/<B>/g, "[b]<B>")
      .replace(/<I>/g, "[i]<I>")
      .replace(/<U>/g, "[u]<U>")
      .replace(/<H1>/g, "[h1]<H1>")
      .replace(/<H2>/g, "[h2]<H2>")
      .replace(/<H3>/g, "[h3]<H3>")
      .replace(/<center>/g, "[center]<center>")
      .replace(/<ul>/g, "[list]<ul>")
      .replace(/<li>/g, "[*]<li>")
      .replace(/<\/B>/g, "</B>[/b]")
      .replace(/<\/I>/g, "</I>[/i]")
      .replace(/<\/U>/g, "</U>[/u]")
      .replace(/<\/H1>/g, "</H1>[/h1]")
      .replace(/<\/H2>/g, "</H2>[/h2]")
      .replace(/<\/H3>/g, "</H3>[/h3]")
      .replace(/<\/center>/g, "</center>[/center]")
      .replace(/<\/ul>/g, "</ul>[/list]")
      .replace(/<BR>/g, "[br]<BR>")
      .replace(/<HR>/g, "[hr]<HR>");
    return `<div class="nlom-paper federation-document edit-mode"><div class="paper-content">${formatted}</div></div>`;
  }

  static toPencode(html, opts = {}) {
    return PencodeCompat.htmlToPencode(html, opts);
  }
}

/**
 * Document Stamp Manager - Handles filing stamps for Federation documents
 */
export class StampManager {
  static addStamp(container, filename) {
    if (!container || !filename) return;

    const existingStamp = container.querySelector(".federation-stamp");
    if (existingStamp) {
      existingStamp.remove();
    }

    const stampInfo = this.parseDocumentName(filename);
    const formattedDate = stampInfo.date;

    const stamp = document.createElement("div");
    stamp.className = "federation-stamp";

    stamp.innerHTML = `
      <div class="stamp-header">NRALAKK FEDERATION</div>
      <div class="stamp-certification">CERTIFIED DOCUMENT</div>
      <div class="stamp-details">
        <div class="stamp-date">FILED ON: ${formattedDate}</div>
        <div class="stamp-round ${
          stampInfo.round === "EXEC_OVR" ? "exec-override" : ""
        }">${stampInfo.round}</div>
        <div class="stamp-name">Grand Council Archives • Qerrbalak</div>
      </div>
      <div class="stamp-authority">PRIMARY NUMERICAL - CONSULAR OFFICE</div>
    `;

    container.appendChild(stamp);
  }

  static parseDocumentName(filename) {
    try {
      const ext = SITE_CONFIG.fileSystem.defaultExtension;
      const name = filename.replace(
        new RegExp(`${ext.replace(".", "\\.")}$`, "i"),
        ""
      );
      const parts = name.split("-");

      let date = parts[0] || "UNKNOWN DATE";
      let roundId = parts[1] || "N/A";
      let personName = parts[2] ? this.titleCase(parts[2]) : "UNKNOWN";
      let fileName = parts.slice(3).join(" ")
        ? this.titleCase(parts.slice(3).join(" "))
        : "";

      if (roundId.toUpperCase() === "EO") {
        roundId = "EXEC_OVR";
      }

      if (date && date.length === 8 && /^\d{8}$/.test(date)) {
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        date = `${year}-${month}-${day}`;
      }

      return {
        category: roundId,
        round: roundId,
        date: date,
        person: personName,
        name: personName.toUpperCase(),
        file: fileName,
      };
    } catch (error) {
      console.error(
        SITE_CONFIG.interfaceText.errors.fileLoadError.replace(
          "{{filename}}",
          filename
        ),
        error
      );
      return {
        category: filename.split("-")[1] || "N/A",
        round: filename.split("-")[1] || "N/A",
        date: filename.split("-")[0] || "ERROR",
        person: "UNKNOWN",
        name: "UNKNOWN",
        file: filename,
      };
    }
  }

  static titleCase(str) {
    return str
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

/**
 * Paper Document Editor - Main editing interface for Federation documents
 */
export class PaperDocumentEditor {
  constructor() {
    this.instances = new Map();
  }

  init(key, options = {}) {
    const document = {
      key,
      isReadOnly: options.readOnly || false,
      currentName:
        options.defaultName ||
        `document${SITE_CONFIG.fileSystem.defaultExtension}`,
      elements: this.getElements(key),
      currentContent: "",
      isEditMode: false,
      scrollState: null,
    };

    if (!document.elements.container) {
      console.warn(SITE_CONFIG.interfaceText.errors.invalidInput);
      return null;
    }

    this.instances.set(key, document);
    this.setupDocument(document);

    return document;
  }

  getElements(key) {
    // Handle the modal case specifically
    if (key === "modal") {
      return {
        container: document.querySelector(getSelector("modalPaperContainer")),
        paper: document.querySelector(getSelector("modalPaper")),
        pilcrow: document.querySelector(getSelector("modalPilcrow")),
        copyBtn: document.querySelector(getSelector("modalCopy")),
        saveBtn: document.querySelector(getSelector("modalSave")),
      };
    }

    return {
      container: document.getElementById(`${key}-paper-container`),
      paper: document.getElementById(`${key}-paper`),
      pilcrow: document.getElementById(`${key}-pilcrow`),
      copyBtn: document.getElementById(`${key}-copy`),
      saveBtn: document.getElementById(`${key}-save`),
    };
  }

  setupDocument(doc) {
    if (doc.isReadOnly) {
      doc.elements.container?.classList.add("paper-readonly");
      if (doc.elements.pilcrow) doc.elements.pilcrow.style.display = "none";
      if (doc.elements.copyBtn) doc.elements.copyBtn.style.display = "none";
      if (doc.elements.saveBtn) doc.elements.saveBtn.style.display = "none";
    }

    this.bindEvents(doc);

    if (!doc.isReadOnly) {
      const placeholderText = this.getPlaceholderText(doc.key);
      doc.currentContent = placeholderText;
    }

    this.renderContent(doc);
    this.initializeScrollbar(doc);
  }

  getPlaceholderText(key) {
    const placeholders = SITE_CONFIG.interfaceText.paperEditor.placeholders;
    return placeholders[key] || placeholders.default;
  }

  bindEvents(doc) {
    const { elements } = doc;

    if (elements.pilcrow) {
      elements.pilcrow.addEventListener("click", () => {
        this.toggleEditMode(doc);
      });
    }

    if (elements.copyBtn) {
      elements.copyBtn.addEventListener("click", () => {
        this.copyContent(doc);
      });
    }

    if (elements.saveBtn) {
      elements.saveBtn.addEventListener("click", () => {
        this.saveContent(doc);
      });
    }

    if (elements.paper) {
      elements.paper.addEventListener("input", (event) => {
        this.handlePaperEdit(doc, event);
      });

      elements.paper.addEventListener("keydown", (event) => {
        this.handlePaperKeydown(doc, event);
      });

      elements.paper.addEventListener("click", (event) => {
        this.handlePaperClick(doc, event);
      });

      elements.paper.addEventListener("focusin", (event) => {
        this.handlePaperFocusIn(doc, event);
      });

      elements.paper.addEventListener("focusout", (event) => {
        this.handlePaperFocusOut(doc, event);
      });

      elements.paper.addEventListener("paste", (event) => {
        this.handlePaperPaste(doc, event);
      });

      elements.paper.addEventListener("scroll", (event) => {
        this.handlePaperScroll(doc, event);
      });
    }
  }

  toggleEditMode(doc) {
    const { elements } = doc;

    this.preserveScrollState(doc);

    doc.isEditMode = !doc.isEditMode;

    if (doc.isEditMode) {
      elements.container.classList.add("edit-mode");
      elements.pilcrow.classList.add("active");
      elements.paper.contentEditable = true;
      elements.paper.focus();

      this.renderContent(doc, true);

      elements.pilcrow.title =
        SITE_CONFIG.interfaceText.paperEditor.pilcrow.showPreview;
      elements.pilcrow.setAttribute(
        "aria-label",
        SITE_CONFIG.interfaceText.paperEditor.pilcrow.previewMode
      );
    } else {
      elements.container.classList.remove("edit-mode");
      elements.pilcrow.classList.remove("active");
      elements.paper.contentEditable = false;

      this.renderContent(doc, false);

      elements.pilcrow.title =
        SITE_CONFIG.interfaceText.paperEditor.pilcrow.showTags;
      elements.pilcrow.setAttribute(
        "aria-label",
        SITE_CONFIG.interfaceText.paperEditor.pilcrow.tagView
      );
    }

    this.restoreScrollState(doc);
  }

  renderContent(doc, showPencode = false) {
    const { elements } = doc;
    const content = doc.currentContent || "";

    if (!elements.paper) return;

    this.preserveScrollState(doc);

    if (showPencode) {
      elements.paper.innerHTML = PencodeRenderer.renderCombined(content);
    } else {
      elements.paper.innerHTML = PencodeRenderer.render(content);
    }

    this.restoreScrollState(doc);
    this.updateScrollbarStyle(doc);
  }

  handlePaperEdit(doc, event) {
    const currentText = this.extractTextFromPaper(doc.elements.paper);
    doc.currentContent = currentText;

    if (doc.isEditMode) {
      this.renderContent(doc, true);
    }
  }

  handlePaperKeydown(doc, event) {
    if (event.key === KEYS.TAB) {
      event.preventDefault();
      document.execCommand("insertText", false, "  ");
    }

    if (event.key === KEYS.ENTER) {
      event.preventDefault();
      document.execCommand("insertHTML", false, "<BR>");
    }
  }

  handlePaperClick(doc, event) {
    if (event.target.classList.contains("pencode-tag")) {
      event.target.focus();
      event.preventDefault();
      return;
    }

    if (
      event.target === doc.elements.paper ||
      event.target.classList.contains("paper-content") ||
      event.target.classList.contains("nlom-paper")
    ) {
      if (!doc.elements.paper.contains(document.activeElement)) {
        doc.elements.paper.focus();
      }
      return;
    }
  }

  handlePaperFocusIn(doc, event) {
    if (event.target.classList.contains("pencode-tag")) {
      event.target.classList.add("editing");
      doc.elements.paper.classList.add("editing-tag");
    } else if (
      event.target === doc.elements.paper ||
      event.target.closest(".paper-content")
    ) {
      doc.elements.paper.classList.remove("editing-tag");
      doc.elements.paper.classList.add("editing-document");
    }
  }

  handlePaperFocusOut(doc, event) {
    if (event.target.classList.contains("pencode-tag")) {
      event.target.classList.remove("editing");
      const focusedTags =
        doc.elements.paper.querySelectorAll(".pencode-tag:focus");
      if (focusedTags.length === 0) {
        doc.elements.paper.classList.remove("editing-tag");
      }
      this.processPencodeTagChanges(doc, event.target);
    } else if (
      event.target === doc.elements.paper ||
      event.target.closest(".paper-content")
    ) {
      doc.elements.paper.classList.remove("editing-document");
    }
  }

  handlePaperPaste(doc, event) {
    event.preventDefault();

    const text = event.clipboardData.getData("text/plain");
    if (text) {
      const normalizedText = this.normalizeWhitespace(text);
      document.execCommand("insertText", false, normalizedText);
    }
  }

  handlePaperScroll(doc, event) {
    this.preserveScrollState(doc);
  }

  processPencodeTagChanges(doc, tagElement) {
    const tagContent = tagElement.textContent;

    if (tagContent.match(/^\[.*?\]$/)) {
      const tagMatch = tagContent.match(/^\[(\/?)([^\]]+)\]?$/);
      if (tagMatch) {
        const isClosing = tagMatch[1] === "/";
        const tagName = tagMatch[2];

        if (isClosing) {
          tagElement.textContent = `[/${tagName}]`;
        } else {
          tagElement.textContent = `[${tagName}]`;
        }

        setTimeout(() => {
          this.renderContent(doc, doc.isEditMode);
        }, CONSTANTS.SHORT_DELAY);
      }
    }
  }

  extractTextFromPaper(paperElement) {
    const clone = paperElement.cloneNode(true);

    const pencodeTags = clone.querySelectorAll(".pencode-tag");
    pencodeTags.forEach((tag) => tag.remove());

    let text = clone.innerHTML;

    // Convert HTML back to pencode
    const conversions = [
      [/<B>/g, "[b]"],
      [/<\/B>/g, "[/b]"],
      [/<I>/g, "[i]"],
      [/<\/I>/g, "[/i]"],
      [/<U>/g, "[u]"],
      [/<\/U>/g, "[/u]"],
      [/<H1>/g, "[h1]"],
      [/<\/H1>/g, "[/h1]"],
      [/<H2>/g, "[h2]"],
      [/<\/H2>/g, "[/h2]"],
      [/<H3>/g, "[h3]"],
      [/<\/H3>/g, "[/h3]"],
      [/<center>/g, "[center]"],
      [/<\/center>/g, "[/center]"],
      [/<ul>/g, "[list]"],
      [/<\/ul>/g, "[/list]"],
      [/<li>/g, "[*]"],
      [/<\/li>/g, ""],
      [/<BR>/g, "\n"],
      [/<HR>/g, "[hr]"],
      [/<font size="4">/g, "[large]"],
      [/<font size="1">/g, "[small]"],
      [/<\/font>/g, "[/font]"],
      [/<span class="paper_field">__________<\/span>/g, "[field]"],
    ];

    conversions.forEach(([regex, replacement]) => {
      text = text.replace(regex, replacement);
    });

    text = text.replace(/<[^>]*>/g, "");
    text = this.normalizeWhitespace(text);

    return text;
  }

  normalizeWhitespace(text) {
    text = text.replace(/\r\n/g, "\n");
    text = text.replace(/\r/g, "\n");
    text = text.replace(/\n\n+/g, "\n\n");

    // Preserve intentional spacing but clean up excessive spaces
    text = text.replace(/[ ]{3,}/g, "  ");

    // Preserve line-specific formatting
    text = text.replace(/^[ \t]+/gm, "");
    text = text.replace(/[ \t]+$/gm, "");

    // Clean up tabs but preserve intentional spaces
    text = text.replace(/\t+/g, "  ");

    return text;
  }

  preserveScrollState(doc) {
    const { paper } = doc.elements;
    if (!paper) return;

    doc.scrollState = {
      scrollTop: paper.scrollTop,
      scrollLeft: paper.scrollLeft,
      scrollHeight: paper.scrollHeight,
      clientHeight: paper.clientHeight,
    };
  }

  restoreScrollState(doc) {
    const { paper } = doc.elements;
    if (!paper || !doc.scrollState) return;

    requestAnimationFrame(() => {
      const { scrollState } = doc;
      const heightRatio = scrollState.scrollHeight / scrollState.clientHeight;
      const currentHeightRatio = paper.scrollHeight / paper.clientHeight;

      if (Math.abs(heightRatio - currentHeightRatio) < 0.1) {
        paper.scrollTop = scrollState.scrollTop;
        paper.scrollLeft = scrollState.scrollLeft;
      } else {
        const relativePosition =
          scrollState.scrollTop /
          (scrollState.scrollHeight - scrollState.clientHeight);
        const newScrollTop =
          relativePosition * (paper.scrollHeight - paper.clientHeight);
        paper.scrollTop = Math.max(0, newScrollTop);
      }
    });
  }

  initializeScrollbar(doc) {
    const { paper } = doc.elements;
    if (!paper) return;

    paper.style.overflowY = "auto";
    paper.style.overflowX = "hidden";

    paper.offsetHeight;

    this.updateScrollbarStyle(doc);
  }

  updateScrollbarStyle(doc) {
    const { paper } = doc.elements;
    if (!paper) return;

    const hasOverflow = paper.scrollHeight > paper.clientHeight;

    if (hasOverflow) {
      paper.classList.add("has-scrollbar");
    } else {
      paper.classList.remove("has-scrollbar");
    }
  }

  async copyContent(doc) {
    const content = doc.currentContent || "";

    try {
      await navigator.clipboard.writeText(content);
      this.showToast("Document copied to personal archive");
    } catch (error) {
      console.error("Copy failed:", error);
      this.showToast("Copy operation failed");
    }
  }

  saveContent(doc) {
    const content = doc.currentContent || "";
    const filename =
      doc.currentName || `document${SITE_CONFIG.fileSystem.defaultExtension}`;

    this.downloadText(content, filename);
    this.showToast("Document inscribed to local records");
  }

  loadDocument(key, text, filename) {
    const doc = this.instances.get(key);
    if (!doc) return;

    doc.currentName = filename || doc.currentName;
    doc.currentContent = text || "";

    if (doc.isReadOnly) {
      this.renderContent(doc, false);

      if (key === "completed" && filename) {
        StampManager.addStamp(doc.elements.paper, filename);
      }
    } else {
      this.renderContent(doc, doc.isEditMode);
    }

    this.updateScrollbarStyle(doc);
  }

  getContent(key) {
    const doc = this.instances.get(key);
    return doc ? doc.currentContent : "";
  }

  setContent(key, text) {
    const doc = this.instances.get(key);
    if (doc) {
      doc.currentContent = text || "";
      this.renderContent(doc, doc.isEditMode);
      this.updateScrollbarStyle(doc);
    }
  }

  // Utility methods
  showToast(message, duration = 1800) {
    ToastManager.success(message, duration);
  }

  downloadText(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
