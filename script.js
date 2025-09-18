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
      prefix: "n4nl_terminal_",
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

  // Unified utility functions
  const utils = {
    formatTime: () => new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),

    formatDate: () => new Date().toLocaleDateString("en-CA"),

    storage: {
      save(key, value) {
        try {
          localStorage.setItem(CONFIG.storage.prefix + key, JSON.stringify(value));
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
          // Clear all data with our prefix
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CONFIG.storage.prefix)) {
              localStorage.removeItem(key);
            }
          });
          console.log("Terminal data cleared");
        } catch (e) {
          console.warn("Storage clear failed:", e);
        }
      }
    },

    getTextContent: (el) => el?.innerText || el?.textContent || "",

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

  // Terminal authentication and UI management
  const terminal = {
    initializeInputs() {
      [
        { input: dom.officerInput, storageKey: CONFIG.storage.officer, stateKey: "officerId" },
        { input: dom.shiftInput, storageKey: CONFIG.storage.shift, stateKey: "shiftCode" }
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
      return !state.officerId?.trim() || 
             !state.shiftCode?.trim() || 
             state.shiftCode.trim().length < 7;
    },

    updateFieldsLock() {
      const isLocked = terminal.isFieldsLocked();
      
      dom.fieldControls?.querySelectorAll("input, button").forEach(
        el => el.disabled = isLocked
      );

      dom.fieldControls?.querySelectorAll(".charge-field-button").forEach(
        button => {
          button.disabled = isLocked;
          if (isLocked) {
            button.style.cursor = "not-allowed";
            button.style.opacity = "0.5";
          } else {
            button.style.cursor = "pointer";
            button.style.opacity = "";
          }
        }
      );

      // Update visual states
      [
        { selector: ".fields-panel", lockedClass: "panel-locked" },
        { selector: ".header-meta", lockedClass: "auth-required" }
      ].forEach(({ selector, lockedClass }) => {
        const element = document.querySelector(selector);
        if (!element) return;

        if (isLocked) {
          element.classList.remove("fade-out");
          element.classList.add(lockedClass);
        } else {
          element.classList.add("fade-out");
          setTimeout(() => element.classList.remove(lockedClass, "fade-out"), 500);
        }
      });
    },

    startSystemClock() {
      const updateClock = () => {
        if (dom.systemTime) dom.systemTime.textContent = utils.formatTime();
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
        const txtFiles = items.filter(f => f?.type === "file" && /\.txt$/i.test(f.name));

        const processedTemplates = (await Promise.all(
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
          })
        )).filter(Boolean);

        state.templates = processedTemplates;
        populateTemplateSelector();

        if (state.templates.length > 0) {
          await templates.load(state.templates[0].file, state.templates[0].description);
        }
      } catch (err) {
        console.error("Error loading template list:", err);
      }
    },

    async load(fileName, description) {
      try {
        const template = state.templates.find(t => t.file === fileName);
        if (!template) throw new Error("Template not found");

        state.currentTemplate = parseTemplate(template.body);
        renderFields(state.currentTemplate.fields);

        if (dom.outputTerminal) dom.outputTerminal.dataset.userEdited = "false";

        updateFieldCounter();
        generateOutput();

        if (dom.templateDescription) {
          dom.templateDescription.textContent = description || "";
        }

        loadSavedFields();
      } catch (err) {
        console.error("Error loading template:", err);
      }
    },
  };

  // Unified template parsing
  function parseTemplate(text) {
    const fields = [];
    
    // Combined regex for both field types
    const patterns = [
      { regex: /\[field\]/g, type: "text", prefix: "field_" },
      { regex: /\[charges\]/g, type: "charge", prefix: "charge_" }
    ];
    
    patterns.forEach(({ regex, type, prefix }) => {
      let match;
      let index = 0;
      
      while ((match = regex.exec(text)) !== null) {
        const pos = match.index;
        const before = text.slice(Math.max(0, pos - 200), pos);
        
        // Extract label from preceding bold text
        let label = type === "charge" ? "Charges" : `Field ${index + 1}`;
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
          type
        });
        
        index++;
      }
    });
    
    fields.sort((a, b) => a.pos - b.pos);
    return { fields, originalText: text };
  }

  // Unified field rendering
  function renderFields(fields) {
    if (!dom.fieldControls) return;

    dom.fieldControls.innerHTML = "";

    if (!fields?.length) {
      dom.fieldControls.innerHTML = `
        <div class="empty-state">
          <p>No editable fields in this template.</p>
        </div>
      `;
      state.totalFields = 0;
      updateFieldCounter();
      return;
    }

    state.totalFields = fields.length;

    fields.forEach((field, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "field-group";
      
      if (field.type === "charge") {
        // Charge field button
        wrapper.innerHTML = `
          <label for="${field.id}">${field.label}</label>
          <button 
            type="button"
            class="charge-field-button ${field.value ? 'filled' : 'empty'}"
            id="${field.id}"
            data-index="${idx}"
            title="${field.value || '[SELECT CHARGE]'}"
          >
            ${field.value || '[SELECT CHARGE]'}
          </button>
        `;

        wrapper.querySelector("button").addEventListener("click", (e) => {
          e.preventDefault();
          if (e.target.disabled) return;
          if (window.N4NL_CHARGES?.openChargeSelector) {
            window.N4NL_CHARGES.openChargeSelector(field.id);
          }
        });
      } else {
        // Regular text field
        wrapper.innerHTML = `
          <label for="${field.id}">${field.label}</label>
          <input 
            type="text" 
            id="${field.id}"
            data-index="${idx}"
            value="${field.value}"
            placeholder="Enter ${field.label.toLowerCase()}"
            autocomplete="off"
          >
        `;

        const input = wrapper.querySelector("input");
        const handleInput = utils.debounce((e) => {
          const index = parseInt(e.target.dataset.index, 10);
          if (state.currentTemplate?.fields[index]) {
            state.currentTemplate.fields[index].value = e.target.value;
            generateOutput();
            updateFieldCounter();
          }
        }, 150);
        
        input.addEventListener("input", handleInput);
        input.addEventListener("change", saveFieldsToStorage);
      }

      dom.fieldControls.appendChild(wrapper);
    });

    updateFieldCounter();
    terminal.updateFieldsLock();
  }

  function updateFieldCounter() {
    if (!dom.fieldCounter) return;

    const filled = state.currentTemplate?.fields?.filter(f => f.value.trim() !== "").length || 0;
    state.fieldsFilled = filled;
    
    dom.fieldCounter.textContent = `${filled} / ${state.totalFields}`;
    dom.fieldCounter.classList.toggle("complete", filled === state.totalFields && state.totalFields > 0);
  }

  function saveFieldsToStorage() {
    if (!state.currentTemplate) return;

    const fieldData = state.currentTemplate.fields.map(f => ({
      label: f.label,
      value: f.value,
      type: f.type || "text"
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

        // Update UI element
        if (saved.type === "charge") {
          const button = document.getElementById(field.id);
          if (button) {
            button.textContent = saved.value || '[SELECT CHARGE]';
            button.title = saved.value || '[SELECT CHARGE]';
            button.className = `charge-field-button ${saved.value ? 'filled' : 'empty'}`;
          }
        } else {
          const input = document.getElementById(field.id);
          if (input) input.value = saved.value;
        }
      }
    });

    updateFieldCounter();
    generateOutput();
    terminal.updateFieldsLock();
  }

  // Simplified output generation
  function generateOutput() {
    if (!state.currentTemplate) return;

    let rawResult = state.currentTemplate.originalText;
    let htmlResult = state.currentTemplate.originalText;

    // Dynamic replacements
    const dynamics = {
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
    };

    // Apply dynamic replacements
    Object.entries(dynamics).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const htmlValue = value ? `<span class="understood">${value}</span>` : '<span class="paper_field"></span>';
      rawResult = rawResult.replace(regex, value);
      htmlResult = htmlResult.replace(regex, htmlValue);
    });

    // Apply field replacements
    if (state.currentTemplate) {
      const sortedFields = [...state.currentTemplate.fields].sort((a, b) => a.pos - b.pos);
      
      sortedFields.forEach(field => {
        const placeholder = field.type === "charge" ? "[charges]" : "[field]";
        const value = field.value || "";
        const htmlValue = value ? `<span class="understood">${value}</span>` : '<span class="paper_field"></span>';
        
        // Replace first occurrence
        const rawIndex = rawResult.indexOf(placeholder);
        if (rawIndex !== -1) {
          rawResult = rawResult.substring(0, rawIndex) + value + 
                     rawResult.substring(rawIndex + placeholder.length);
        }
        
        const htmlIndex = htmlResult.indexOf(placeholder);
        if (htmlIndex !== -1) {
          htmlResult = htmlResult.substring(0, htmlIndex) + htmlValue + 
                      htmlResult.substring(htmlIndex + placeholder.length);
        }
      });
    }

    state.currentRaw = rawResult;

    if (dom.previewRender) {
      dom.previewRender.innerHTML = pencodeToHtml(htmlResult);
    }

    if (dom.outputTerminal) {
      dom.outputTerminal.innerText = rawResult;
      dom.outputTerminal.dataset.userEdited = "false";
    }
  }

  function handleTerminalEdit() {
    if (!dom.outputTerminal) return;

    dom.outputTerminal.dataset.userEdited = "true";
    const terminalContent = utils.getTextContent(dom.outputTerminal);
    state.currentRaw = terminalContent;

    if (dom.previewRender) {
      dom.previewRender.innerHTML = pencodeToHtml(terminalContent);
    }
  }

  // Optimized pencode to HTML conversion
  function pencodeToHtml(text) {
    if (!text) return "";

    // Build tag map with all replacements
    const tagMap = {
      // Basic formatting
      "[b]": "<B>", "[/b]": "</B>",
      "[i]": "<I>", "[/i]": "</I>",
      "[u]": "<U>", "[/u]": "</U>",
      "[large]": '<font size="4">', "[/large]": "</font>",
      "[small]": '<font size="1">', "[/small]": "</font>",
      "[center]": "<center>", "[/center]": "</center>",
      "[br]": "<BR>",
      "[hr]": "<HR>",
      "[field]": '<span class="paper_field"></span>',
      "[charges]": '<span class="paper_field"></span>',
      
      // Headers and lists
      "[h1]": "<H1>", "[/h1]": "</H1>",
      "[h2]": "<H2>", "[/h2]": "</H2>",
      "[h3]": "<H3>", "[/h3]": "</H3>",
      "[*]": "<li>",
      "[list]": "<ul>", "[/list]": "</ul>",
      
      // Tables
      "[table]": '<table border=1 cellspacing=0 cellpadding=3 style="border: 1px solid black;">',
      "[/table]": "</td></tr></table>",
      "[grid]": "<table>",
      "[/grid]": "</td></tr></table>",
      "[row]": "</td><tr>",
      "[cell]": "<td>",
      
      // Special elements
      "[barcode]": '<span class="barcode">║║│║║│││║│║║││║║│║</span>',
    };

    // Corporate logos
    const logos = [
      ["scc", "⬢", "SCC"], ["nt", "◆", "NT"], ["zh", "▣", "ZH"],
      ["idris", "◉", "IDRIS"], ["eridani", "⬟", "ECF"], ["zavod", "▲", "ZAVOD"],
      ["hp", "⬡", "HEPH"], ["be", "◈", "BE"], ["golden", "◊", "GOLDEN"],
      ["pvpolice", "★", "PKM"]
    ];
    
    logos.forEach(([name, symbol, text]) => {
      tagMap[`[logo_${name}]`] = `<span class="corp-logo">${symbol} ${text}</span>`;
      tagMap[`[logo_${name}_small]`] = `<span class="corp-logo">${symbol}</span>`;
    });

    // Apply replacements
    const tagPattern = new RegExp(
      Object.keys(tagMap).map(key => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
      "g"
    );

    let result = text.replace(tagPattern, match => tagMap[match]);

    // Complex replacements
    result = result
      .replace(/\[redacted\](.*?)\[\/redacted\]/gs, (_, content) => 
        `<span class="redacted">${"|".repeat(content.length)}</span>`)
      .replace(/\[color=([^\]]+)\](.*?)\[\/color\]/gs, 
        '<span style="color: $1;">$2</span>')
      .replace(/\[lang=([^\]]+)\](.*?)\[\/lang\]/gs, 
        '<span class="language" data-lang="$1" title="Language: $1">$2</span>');

    // Apply dynamic values
    Object.entries({ "[officername]": state.officerId || "", "[roundid]": state.shiftCode || "" })
      .forEach(([placeholder, replacement]) => {
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
        result = result.replace(regex, replacement);
      });

    return result;
  }

  function extractHeaders(text) {
    const lines = text.split(/\r?\n/);
    let name = "", desc = "", i = 0;

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
    if (!dom.templateSelector) return;

    dom.templateSelector.innerHTML = state.templates.map((template, index) => 
      `<option value="${template.file}" data-description="${template.description || ""}" 
        ${index === 0 ? 'selected' : ''}>${template.name}</option>`
    ).join('');
  }

  function toggleTerminal() {
    const main = document.querySelector(".terminal-main");
    const toggleBtn = document.getElementById("terminalToggle");

    const isHidden = main.classList.toggle("terminal-hidden");
    toggleBtn.textContent = isHidden ? "SHOW TERMINAL" : "HIDE TERMINAL";
    toggleBtn.setAttribute("aria-pressed", isHidden);
  }

  function getCurrentOutput() {
    return state.currentRaw || utils.getTextContent(dom.outputTerminal) || "";
  }

  async function copyOutput() {
    const content = getCurrentOutput();
    if (!content) {
      console.warn("No content to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      if (dom.copyButton) {
        const originalText = dom.copyButton.textContent;
        dom.copyButton.textContent = "COPIED!";
        dom.copyButton.style.color = "var(--state-success)";
        setTimeout(() => {
          dom.copyButton.textContent = originalText;
          dom.copyButton.style.color = "";
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

    const headerContent = `Name: ${state.shiftCode || "Unknown"}\nDesc: A finished document.\n\n${content}`;
    const fileName = `citation_${state.officerId}_${Date.now()}.txt`;
    
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
      state.currentTemplate.fields.forEach(field => {
        field.value = "";
        const element = document.getElementById(field.id);
        if (element) {
          if (field.type === "charge") {
            element.textContent = '[SELECT CHARGE]';
            element.title = '[SELECT CHARGE]';
            element.className = 'charge-field-button empty';
          } else {
            element.value = "";
          }
        }
      });
      updateFieldCounter();
      generateOutput();
      saveFieldsToStorage();
    }
  }

  function setupEventHandlers() {
    // Template selector
    dom.templateSelector?.addEventListener("change", async (e) => {
      const option = e.target.selectedOptions[0];
      await templates.load(option.value, option.dataset.description);
    });

    // Button handlers
    const buttons = {
      terminalToggle: toggleTerminal,
      copyButton: copyOutput,
      downloadButton: downloadOutput,
    };

    Object.entries(buttons).forEach(([id, handler]) => {
      document.getElementById(id)?.addEventListener("click", handler);
    });

    // Terminal editing
    if (dom.outputTerminal) {
      dom.outputTerminal.addEventListener("input", handleTerminalEdit);
      dom.outputTerminal.addEventListener("paste", () => setTimeout(handleTerminalEdit, 0));
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey) {
        if (e.key === "s") {
          e.preventDefault();
          downloadOutput();
        } else if (e.key === "c" && !window.getSelection().toString()) {
          e.preventDefault();
          copyOutput();
        }
      }
    });

    // Data clearing on window close
    window.addEventListener("beforeunload", () => {
      utils.storage.clear();
    });

    // Data clearing when tab becomes hidden (mobile/background)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        utils.storage.clear();
      }
    });

    // Data clearing on page unload (additional safety)
    window.addEventListener("unload", () => {
      utils.storage.clear();
    });
  }

  async function initialize() {
    // Initialize DOM references
    [
      "templateSelector", "templateDescription", "fieldControls",
      "previewRender", "outputTerminal", "fieldCounter",
      "systemTime", "officerInput", "shiftInput", "copyButton"
    ].forEach(id => dom[id] = document.getElementById(id));

    // Load saved authentication
    ["officer", "shift"].forEach((type, i) => {
      const key = type === "officer" ? "officerId" : "shiftCode";
      const saved = utils.storage.load(CONFIG.storage[type]);
      if (saved) state[key] = saved;
    });

    terminal.initializeInputs();
    terminal.startSystemClock();
    setupEventHandlers();
    await templates.loadList();
    generateOutput();

    // Auto-clear shift code after timeout
    setInterval(() => {
      if (dom.shiftInput) {
        dom.shiftInput.value = "";
        state.shiftCode = "";
        utils.storage.save(CONFIG.storage.shift, "");
        terminal.updateFieldsLock();
      }
    }, CONFIG.shiftTimeout);
  }

  // Public API
  window.N4NL_TERMINAL = {
    updateField(fieldId, value) {
      const field = state.currentTemplate?.fields.find(f => f.id === fieldId);
      if (field) {
        field.value = value;
        generateOutput();
        saveFieldsToStorage();
      }
    },
    
    getFieldValue(fieldId) {
      return state.currentTemplate?.fields.find(f => f.id === fieldId)?.value || "";
    },

    clearData() {
      utils.storage.clear();
      // Reset state
      state.officerId = null;
      state.shiftCode = "";
      state.currentTemplate = null;
      state.currentRaw = "";
      state.fieldsFilled = 0;
      state.totalFields = 0;
      
      // Clear UI
      if (dom.officerInput) dom.officerInput.value = "";
      if (dom.shiftInput) dom.shiftInput.value = "";
      if (dom.fieldControls) dom.fieldControls.innerHTML = "";
      if (dom.previewRender) dom.previewRender.innerHTML = "";
      if (dom.outputTerminal) dom.outputTerminal.innerHTML = "";
      if (dom.fieldCounter) dom.fieldCounter.textContent = "0 / 0";
      
      terminal.updateFieldsLock();
    }
  };

  // Initialize when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();