(function () {
  "use strict";

  const CONFIG = {
    repo: {
      user: "mnemeory",
      name: "mnemeory.github.io",
      branch: "main",
    },
    api: {
      baseUrl: "https://api.github.com/repos",
      headers: { Accept: "application/vnd.github+json" },
    },
    storage: {
      prefix: "scc_terminal_",
      fields: "saved_fields",
      officer: "officer_id",
      shift: "shift_code",
    },
    shiftTimeout: 9000000, // 2.5 hours
  };

  const state = {
    currentTemplate: null,
    currentRaw: "",
    templates: [],
    fieldsFilled: 0,
    totalFields: 0,
    officerId: null,
    shiftCode: "",
  };

  const dom = {};

  // Utility functions
  const utils = {
    formatTime: () =>
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),

    formatDate: () => new Date().toLocaleDateString("en-CA"),

    storage: {
      save(key, value) {
        try {
          localStorage.setItem(
            CONFIG.storage.prefix + key,
            JSON.stringify(value),
          );
        } catch (e) {
          console.warn("Storage save failed:", e);
        }
      },
      load(key) {
        try {
          const item = localStorage.getItem(CONFIG.storage.prefix + key);
          return item ? JSON.parse(item) : null;
        } catch (e) {
          console.warn("Storage load failed:", e);
          return null;
        }
      },
      clear() {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(CONFIG.storage.prefix)) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.warn("Storage clear failed:", e);
        }
      },
    },

    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },

    updateElement(el, prop, val) {
      if (el) el[prop] = val;
    },
  };

  // Authentication and UI management
  const terminal = {
    initializeInputs() {
      [
        {
          input: dom.executiveAuth,
          storageKey: CONFIG.storage.officer,
          stateKey: "officerId",
        },
        {
          input: dom.commandCipher,
          storageKey: CONFIG.storage.shift,
          stateKey: "shiftCode",
        },
      ].forEach(({ input, storageKey, stateKey }) => {
        if (!input) return;

        const savedValue = utils.storage.load(storageKey);
        if (savedValue) {
          utils.updateElement(input, "value", savedValue);
          state[stateKey] = savedValue;
        }

        input.addEventListener("input", (e) => {
          const value = e.target.value.trim();
          state[stateKey] = value;
          utils.storage.save(storageKey, value);
          terminal.updateFieldsLock();
          generateOutput();
        });
      });

      terminal.updateFieldsLock();
    },

    isFieldsLocked() {
      return (
        !state.officerId?.trim() ||
        !state.shiftCode?.trim() ||
        state.shiftCode.trim().length < 7
      );
    },

    updateFieldsLock() {
      const isLocked = terminal.isFieldsLocked();

      // Update inline editable fields
      if (dom.previewSurface) {
        const fields = dom.previewSurface.querySelectorAll(
          ".paper_field[data-field-id]",
        );
        fields.forEach((field) => {
          field.contentEditable = !isLocked;
          if (isLocked) {
            field.style.cursor = "not-allowed";
            field.style.opacity = "0.5";
          } else {
            field.style.cursor = "text";
            field.style.opacity = "";
          }
        });

        // Update job buttons
        const jobButtons = dom.previewSurface.querySelectorAll(
          'button.job-button[data-field-type="job"]',
        );
        jobButtons.forEach((button) => {
          button.disabled = isLocked;
          if (isLocked) {
            button.style.cursor = "not-allowed";
            button.style.opacity = "0.5";
          } else {
            button.style.cursor = "pointer";
            button.style.opacity = "";
          }
        });
      }
    },

    startSystemClock() {
      const updateClock = () => {
        if (dom.galacticTime) dom.galacticTime.textContent = utils.formatTime();
      };
      updateClock();
      setInterval(updateClock, 1000);
    },
  };

  // Template loading and management
  const templates = {
    async loadList() {
      try {
        const apiUrl = `${CONFIG.api.baseUrl}/${CONFIG.repo.user}/${CONFIG.repo.name}/contents/templates?ref=${CONFIG.repo.branch}`;
        const response = await fetch(apiUrl, { headers: CONFIG.api.headers });

        if (!response.ok) throw new Error("Failed to load template list");

        const items = await response.json();
        const txtFiles = items.filter(
          (f) => f?.type === "file" && /\.txt$/i.test(f.name),
        );

        const processedTemplates = (
          await Promise.all(
            txtFiles.map(async ({ name }) => {
              try {
                const res = await fetch(`templates/${name}?v=${Date.now()}`);
                if (!res.ok) throw new Error("Failed to load template");

                const text = await res.text();
                const { body, name: tplName, desc } = extractHeaders(text);

                return {
                  file: name,
                  name: tplName || name.replace(/\.txt$/i, ""),
                  description: desc || "",
                  body,
                };
              } catch (err) {
                console.error(`Error loading template ${name}:`, err);
                return null;
              }
            }),
          )
        ).filter(Boolean);

        state.templates = processedTemplates;
        populateTemplateSelector();

        if (state.templates.length > 0) {
          await templates.load(
            state.templates[0].file,
            state.templates[0].description,
          );
        }
      } catch (err) {
        console.error("Error loading template list:", err);
        // Fallback: create a basic template so the UI still works
        await this.createFallbackTemplate();
      }
    },

    async createFallbackTemplate() {
      console.log("Creating fallback template due to GitHub API failure");

      // Create a basic template that will work
      state.templates = [
        {
          file: "fallback.txt",
          name: "Basic Document Template",
          description: "Emergency fallback template - GitHub unavailable",
          body: `[center][b]STELLAR CORPORATE CONGLOMERATE[/b]
[logo_scc]
EXECUTIVE COMMAND INTERFACE[/center]

[hr]

[b]Document Information:[/b]
[b]Officer:[/b] [officername]
[b]Session ID:[/b] [roundid]
[b]Date:[/b] [date] [time]

[hr]

[b]Subject:[/b] [field]

[b]Content:[/b]
[field]

[b]Additional Notes:[/b]
[field]

[hr]
[center][small]The Unbreakable Chainlink • Holding the Spur Together[/small][/center]`,
        },
      ];

      populateTemplateSelector();

      if (state.templates.length > 0) {
        await templates.load(
          state.templates[0].file,
          state.templates[0].description,
        );
      }
    },

    async load(fileName, description) {
      try {
        const template = state.templates.find((t) => t.file === fileName);
        if (!template) throw new Error("Template not found");

        state.currentTemplate = parseTemplate(template.body);
        renderFields(state.currentTemplate.fields);

        if (dom.terminalSurface)
          dom.terminalSurface.dataset.userEdited = "false";

        updateFieldCounter();
        generateOutput();

        if (dom.templateMetadata) {
          dom.templateMetadata.textContent = description || "";
        }

        loadSavedFields();
      } catch (err) {
        console.error("Error loading template:", err);
      }
    },
  };

  // Template parsing - simplified for inline editing
  function parseTemplate(text) {
    const fields = [];

    const patterns = [
      { regex: /\[field\]/g, type: "text", prefix: "field_" },
      { regex: /\[jobs\]/g, type: "job", prefix: "job_" },
    ];

    patterns.forEach(({ regex, type, prefix }) => {
      let match;
      let index = 0;

      while ((match = regex.exec(text)) !== null) {
        const pos = match.index;
        const before = text.slice(Math.max(0, pos - 200), pos);

        let label =
          type === "job" ? "Personnel Assignment" : `Field ${index + 1}`;
        const labelMatches = before.match(/\[b\]([^\[]+?):\s*\[\/b\]/g);

        if (labelMatches?.length > 0) {
          const lastMatch = labelMatches[labelMatches.length - 1];
          const m = lastMatch.match(/\[b\]([^\[]+?):\s*\[\/b\]/);
          if (m) label = m[1].trim();
        }

        fields.push({
          label,
          value: "",
          pos,
          id: `${prefix}${index}`,
          type,
          placeholder: label,
        });

        index++;
      }
    });

    fields.sort((a, b) => a.pos - b.pos);
    return { fields, originalText: text };
  }

  // Field rendering - now handled inline in preview
  function renderFields(fields) {
    // No longer needed - fields are rendered inline in the preview
    state.totalFields = fields?.length || 0;
    updateFieldCounter();
  }

  function updateFieldCounter() {
    if (!dom.fieldCounter) {
      console.warn("Field counter element not found");
      return;
    }

    if (!state.currentTemplate?.fields) {
      dom.fieldCounter.textContent = "0 / 0";
      return;
    }

    const filled = state.currentTemplate.fields.filter(
      (f) => f.value && f.value.trim() !== "",
    ).length;
    state.fieldsFilled = filled;

    dom.fieldCounter.textContent = `${filled} / ${state.totalFields}`;
    dom.fieldCounter.classList.toggle(
      "complete",
      filled === state.totalFields && state.totalFields > 0,
    );
  }

  function saveFieldsToStorage() {
    if (!state.currentTemplate) return;

    const fieldData = state.currentTemplate.fields.map((f) => ({
      label: f.label,
      value: f.value,
      type: f.type || "text",
    }));

    utils.storage.save(CONFIG.storage.fields, fieldData);
  }

  function loadSavedFields() {
    const savedFields = utils.storage.load(CONFIG.storage.fields);
    if (!savedFields || !state.currentTemplate) return;

    savedFields.forEach((saved, idx) => {
      const field = state.currentTemplate.fields[idx];
      if (field && field.label === saved.label) {
        field.value = saved.value;
      }
    });

    updateFieldCounter();
    generateOutput();
    // Note: updateFieldsLock() is now called at the end of generateOutput()
  }

  // Output generation with inline editable fields
  function generateOutput() {
    if (!state.currentTemplate) return;

    let rawResult = state.currentTemplate.originalText;
    let htmlResult = state.currentTemplate.originalText;

    // Dynamic replacements
    const dynamics = {
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
      "[time]": utils.formatTime(),
      "[date]": utils.formatDate(),
    };

    // Apply dynamic replacements
    Object.entries(dynamics).forEach(([placeholder, value]) => {
      const regex = new RegExp(
        placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g",
      );
      const htmlValue = value
        ? `<span class="understood">${value}</span>`
        : '<span class="paper_field"></span>';
      rawResult = rawResult.replace(regex, value);
      htmlResult = htmlResult.replace(regex, htmlValue);
    });

    // Apply field replacements with editable spans or buttons
    if (state.currentTemplate) {
      const sortedFields = [...state.currentTemplate.fields].sort(
        (a, b) => a.pos - b.pos,
      );

      sortedFields.forEach((field, index) => {
        const placeholder = field.type === "job" ? "[jobs]" : "[field]";
        const value = field.value || "";

        // Create HTML element - button for jobs, editable span for others
        let htmlValue;
        if (field.type === "job") {
          const buttonText = value || "Click to Select Assignment";
          const buttonClass = value ? "job-button filled" : "job-button empty";
          htmlValue = `<button class="${buttonClass}" 
            data-field-id="${field.id}" 
            data-field-index="${index}"
            data-field-type="job"
            data-placeholder="${field.placeholder}"
            type="button">${buttonText}</button>`;
        } else {
          htmlValue = `<span class="paper_field" 
            data-field-id="${field.id}" 
            data-field-index="${index}"
            data-field-type="${field.type}"
            data-placeholder="${field.placeholder}"
            spellcheck="false">${value}</span>`;
        }

        const rawIndex = rawResult.indexOf(placeholder);
        if (rawIndex !== -1) {
          rawResult =
            rawResult.substring(0, rawIndex) +
            value +
            rawResult.substring(rawIndex + placeholder.length);
        }

        const htmlIndex = htmlResult.indexOf(placeholder);
        if (htmlIndex !== -1) {
          htmlResult =
            htmlResult.substring(0, htmlIndex) +
            htmlValue +
            htmlResult.substring(htmlIndex + placeholder.length);
        }
      });
    }

    state.currentRaw = rawResult;

    if (dom.previewSurface) {
      dom.previewSurface.innerHTML = pencodeToHtml(htmlResult);
      setupInlineFieldEvents();
    }

    if (dom.terminalSurface) {
      dom.terminalSurface.value = rawResult;
      dom.terminalSurface.dataset.userEdited = "false";
    }

    // Apply field locking state after rendering
    terminal.updateFieldsLock();
  }

  // Setup event handlers for inline editable fields and buttons
  function setupInlineFieldEvents() {
    if (!dom.previewSurface) return;

    // Handle regular editable fields
    const editableFields = dom.previewSurface.querySelectorAll(
      ".paper_field[data-field-id]",
    );
    editableFields.forEach((field) => {
      const fieldIndex = parseInt(field.dataset.fieldIndex, 10);

      // Handle input events
      const handleInput = utils.debounce((e) => {
        const value = e.target.textContent || "";
        if (state.currentTemplate?.fields[fieldIndex]) {
          state.currentTemplate.fields[fieldIndex].value = value;
          updateFieldCounter();
          updateRawOutput();
        }
      }, 150);

      // Handle focus events
      const handleFocus = (e) => {
        e.target.classList.add("focused");
        if (!e.target.textContent.trim()) {
          e.target.textContent = "";
        }
      };

      // Handle blur events
      const handleBlur = (e) => {
        e.target.classList.remove("focused");
        if (!e.target.textContent.trim()) {
          e.target.textContent = "";
        }
        saveFieldsToStorage();
      };

      field.addEventListener("input", handleInput);
      field.addEventListener("focus", handleFocus);
      field.addEventListener("blur", handleBlur);
    });

    // Handle job button clicks
    const jobButtons = dom.previewSurface.querySelectorAll(
      'button.job-button[data-field-type="job"]',
    );
    jobButtons.forEach((button) => {
      const fieldId = button.dataset.fieldId;

      button.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.SCC_JOBS?.openJobSelector) {
          window.SCC_JOBS.openJobSelector(fieldId);
        }
      });
    });
  }

  // Update raw output when fields change
  function updateRawOutput() {
    if (!state.currentTemplate) return;

    let rawResult = state.currentTemplate.originalText;

    // Apply dynamic replacements
    const dynamics = {
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
      "[time]": utils.formatTime(),
      "[date]": utils.formatDate(),
    };

    Object.entries(dynamics).forEach(([placeholder, value]) => {
      const regex = new RegExp(
        placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g",
      );
      rawResult = rawResult.replace(regex, value);
    });

    // Apply field replacements
    const sortedFields = [...state.currentTemplate.fields].sort(
      (a, b) => a.pos - b.pos,
    );
    sortedFields.forEach((field) => {
      const placeholder = field.type === "job" ? "[jobs]" : "[field]";
      const value = field.value || "";

      const rawIndex = rawResult.indexOf(placeholder);
      if (rawIndex !== -1) {
        rawResult =
          rawResult.substring(0, rawIndex) +
          value +
          rawResult.substring(rawIndex + placeholder.length);
      }
    });

    state.currentRaw = rawResult;

    if (dom.terminalSurface) {
      dom.terminalSurface.value = rawResult;
      dom.terminalSurface.dataset.userEdited = "false";
    }
  }

  function handleTerminalEdit() {
    if (!dom.terminalSurface) return;

    dom.terminalSurface.dataset.userEdited = "true";
    const terminalContent = dom.terminalSurface.value || "";
    state.currentRaw = terminalContent;

    if (dom.previewSurface) {
      dom.previewSurface.innerHTML = pencodeToHtml(terminalContent);
      setupInlineFieldEvents();
      terminal.updateFieldsLock();
    }
  }

  // Pencode to HTML conversion
  function pencodeToHtml(text) {
    if (!text) return "";

    const tagMap = {
      "[b]": "<B>",
      "[/b]": "</B>",
      "[i]": "<I>",
      "[/i]": "</I>",
      "[u]": "<U>",
      "[/u]": "</U>",
      "[large]": '<font size="4">',
      "[/large]": "</font>",
      "[small]": '<font size="1">',
      "[/small]": "</font>",
      "[center]": "<center>",
      "[/center]": "</center>",
      "[br]": "<BR>",
      "[hr]": "<HR>",
      "[field]": '<span class="paper_field"></span>',
      "[jobs]": '<span class="paper_field"></span>',
      "[h1]": "<H1>",
      "[/h1]": "</H1>",
      "[h2]": "<H2>",
      "[/h2]": "</H2>",
      "[h3]": "<H3>",
      "[/h3]": "</H3>",
      "[*]": "<li>",
      "[list]": "<ul>",
      "[/list]": "</ul>",
      "[table]":
        '<table border=1 cellspacing=0 cellpadding=3 style="border: 1px solid black;">',
      "[/table]": "</td></tr></table>",
      "[grid]": "<table>",
      "[/grid]": "</td></tr></table>",
      "[row]": "</td><tr>",
      "[cell]": "<td>",
      "[barcode]": '<span class="barcode">║║│║║│││║│║║││║║│║</span>',
    };

    // Corporate logos
    const logos = [
      ["scc", "⬢", "SCC"],
      ["nt", "◆", "NT"],
      ["zh", "▣", "ZH"],
      ["idris", "◉", "IDRIS"],
      ["eridani", "⬟", "ECF"],
      ["zavod", "▲", "ZAVOD"],
      ["hp", "⬡", "HEPH"],
      ["be", "◈", "BE"],
      ["golden", "◊", "GOLDEN"],
      ["pvpolice", "★", "PKM"],
    ];

    logos.forEach(([name, symbol, text]) => {
      tagMap[`[logo_${name}]`] =
        `<span class="corp-logo">${symbol} ${text}</span>`;
      tagMap[`[logo_${name}_small]`] =
        `<span class="corp-logo">${symbol}</span>`;
    });

    const tagPattern = new RegExp(
      Object.keys(tagMap)
        .map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
      "g",
    );

    let result = text.replace(tagPattern, (match) => tagMap[match]);

    // Complex replacements
    result = result
      .replace(
        /\[redacted\](.*?)\[\/redacted\]/gs,
        (_, content) =>
          `<span class="redacted">${"|".repeat(content.length)}</span>`,
      )
      .replace(
        /\[color=([^\]]+)\](.*?)\[\/color\]/gs,
        '<span style="color: $1;">$2</span>',
      )
      .replace(
        /\[lang=([^\]]+)\](.*?)\[\/lang\]/gs,
        '<span class="language" data-lang="$1" title="Language: $1">$2</span>',
      );

    return result;
  }

  function extractHeaders(text) {
    const lines = text.split(/\r?\n/);
    let name = "",
      desc = "",
      i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith("Name:")) name = line.slice(5).trim();
      else if (line.startsWith("Desc:")) desc = line.slice(5).trim();
      else if (line !== "") break;
      i++;
    }

    return { name, desc, body: lines.slice(i).join("\n") };
  }

  function populateTemplateSelector() {
    if (!dom.templateMatrix) return;

    dom.templateMatrix.innerHTML = state.templates
      .map(
        (template, index) =>
          `<option value="${template.file}" data-description="${template.description || ""}" 
        ${index === 0 ? "selected" : ""}>${template.name}</option>`,
      )
      .join("");
  }

  function toggleTerminal() {
    const main = document.querySelector(".terminal-main");
    const toggleBtn = document.getElementById("terminalToggle");

    const isHidden = main.classList.toggle("terminal-hidden");
    toggleBtn.textContent = isHidden ? "SHOW TERMINAL" : "HIDE TERMINAL";
    toggleBtn.setAttribute("aria-pressed", isHidden);
  }

  function getCurrentOutput() {
    return state.currentRaw || dom.terminalSurface?.value || "";
  }

  async function copyOutput() {
    const content = getCurrentOutput();
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      const copyBtn = document.getElementById("transmitCommand");
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "COPIED!";
        copyBtn.style.color = "var(--state-success)";
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.color = "";
        }, 1500);
      }
    } catch (err) {
      console.error("Copy failed:", err);
      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  function downloadOutput() {
    const content = getCurrentOutput();
    if (!content) return;

    const headerContent = `STELLAR CORPORATE CONGLOMERATE
Executive Officer: ${state.officerId || "Anonymous"}
Session ID: ${state.shiftCode || "Unknown"}
Generated: ${utils.formatTime()} ${utils.formatDate()}

${content}`;
    const fileName = `SCC_Document_${state.officerId}_${Date.now()}.txt`;

    const blob = new Blob([headerContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Clear fields after download
    if (state.currentTemplate?.fields) {
      state.currentTemplate.fields.forEach((field) => {
        field.value = "";
      });
      updateFieldCounter();
      generateOutput();
      saveFieldsToStorage();
    }
  }

  function setupEventHandlers() {
    // Template selector
    dom.templateMatrix?.addEventListener("change", async (e) => {
      const option = e.target.selectedOptions[0];
      await templates.load(option.value, option.dataset.description);
    });

    // Button handlers
    const buttons = {
      processDocument: downloadOutput,
      transmitCommand: copyOutput,
      terminalToggle: toggleTerminal,
    };

    Object.entries(buttons).forEach(([id, handler]) => {
      document.getElementById(id)?.addEventListener("click", handler);
    });

    // Terminal editing
    if (dom.terminalSurface) {
      dom.terminalSurface.addEventListener("input", handleTerminalEdit);
      dom.terminalSurface.addEventListener("paste", () =>
        setTimeout(handleTerminalEdit, 0),
      );
    }

    // Data clearing
    const clearData = () => utils.storage.clear();
    window.addEventListener("beforeunload", clearData);
    window.addEventListener("unload", clearData);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearData();
    });
  }

  async function initialize() {
    // Initialize DOM references
    [
      "templateMatrix",
      "templateMetadata",
      "previewSurface",
      "terminalSurface",
      "galacticTime",
      "executiveAuth",
      "commandCipher",
      "processDocument",
      "fieldCounter",
    ].forEach((id) => (dom[id] = document.getElementById(id)));

    // Load saved authentication
    ["officer", "shift"].forEach((type, i) => {
      const key = type === "officer" ? "officerId" : "shiftCode";
      const saved = utils.storage.load(CONFIG.storage[type]);
      if (saved) state[key] = saved;
    });

    terminal.initializeInputs();
    terminal.startSystemClock();
    setupEventHandlers();
    scrollSync.init();
    await templates.loadList();
    generateOutput();
    updateFieldCounter();

    // Auto-clear shift code after timeout
    setInterval(() => {
      if (dom.commandCipher) {
        dom.commandCipher.value = "";
        state.shiftCode = "";
        utils.storage.save(CONFIG.storage.shift, "");
        terminal.updateFieldsLock();
      }
    }, CONFIG.shiftTimeout);
  }

  // Public API
  window.SCC_TERMINAL = {
    updateField(fieldId, value) {
      const field = state.currentTemplate?.fields.find((f) => f.id === fieldId);
      if (field) {
        field.value = value;
        generateOutput();
        saveFieldsToStorage();
      }
    },

    getFieldValue(fieldId) {
      return (
        state.currentTemplate?.fields.find((f) => f.id === fieldId)?.value || ""
      );
    },

    isFieldsLocked() {
      return terminal.isFieldsLocked();
    },

    clearData() {
      utils.storage.clear();
      state.officerId = null;
      state.shiftCode = "";
      state.currentTemplate = null;
      state.currentRaw = "";
      state.fieldsFilled = 0;
      state.totalFields = 0;

      if (dom.executiveAuth) dom.executiveAuth.value = "";
      if (dom.commandCipher) dom.commandCipher.value = "";
      if (dom.previewSurface) dom.previewSurface.innerHTML = "";
      if (dom.terminalSurface) dom.terminalSurface.value = "";
      if (dom.fieldCounter) dom.fieldCounter.textContent = "0 / 0";

      terminal.updateFieldsLock();
    },
  };

  // Scroll synchronization between terminal and preview panels
  const scrollSync = {
    lastScrollSource: null,
    lastScrollTime: 0,
    syncFrame: null,

    init() {
      this.setupScrollListeners();
    },

    setupScrollListeners() {
      const terminalSurface = dom.terminalSurface;
      const previewSurface = dom.previewSurface;

      if (!terminalSurface || !previewSurface) return;

      // Terminal to Preview sync
      terminalSurface.addEventListener(
        "scroll",
        () => {
          this.handleScroll(terminalSurface, previewSurface);
        },
        { passive: true },
      );

      // Preview to Terminal sync
      previewSurface.addEventListener(
        "scroll",
        () => {
          this.handleScroll(previewSurface, terminalSurface);
        },
        { passive: true },
      );
    },

    handleScroll(source, target) {
      const now = Date.now();

      // If the target just scrolled within the last 100ms, ignore this event
      // to prevent feedback loop
      if (this.lastScrollSource === target && now - this.lastScrollTime < 100) {
        return;
      }

      // Cancel any pending sync
      if (this.syncFrame) {
        cancelAnimationFrame(this.syncFrame);
      }

      // Schedule sync on next frame for smooth animation
      this.syncFrame = requestAnimationFrame(() => {
        this.syncScroll(source, target);
      });
    },

    syncScroll(source, target) {
      // Mark this source as the last one that scrolled
      this.lastScrollSource = source;
      this.lastScrollTime = Date.now();

      // Calculate scroll percentage
      const scrollTop = source.scrollTop;
      const scrollHeight = source.scrollHeight - source.clientHeight;
      const scrollPercentage = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      // Apply scroll to target
      const targetScrollHeight = target.scrollHeight - target.clientHeight;
      const targetScrollTop = targetScrollHeight * scrollPercentage;

      target.scrollTop = targetScrollTop;
    },
  };

  // Initialize when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
