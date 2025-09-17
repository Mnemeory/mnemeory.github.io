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

  const dom = {
    templateSelector: null,
    templateDescription: null,
    fieldControls: null,
    previewRender: null,
    outputTerminal: null,
    fieldCounter: null,
    systemTime: null,
    officerInput: null,
    shiftInput: null,
    copyButton: null,
  };

  const utils = {
    formatTime() {
      return new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },

    formatDate() {
      return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format
    },

    saveToStorage(key, value) {
      try {
        localStorage.setItem(
          CONFIG.storage.prefix + key,
          JSON.stringify(value),
        );
      } catch (e) {
        console.warn("Storage save failed:", e);
      }
    },

    loadFromStorage(key) {
      try {
        const item = localStorage.getItem(CONFIG.storage.prefix + key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.warn("Storage load failed:", e);
        return null;
      }
    },

    getTextContent(element) {
      return element?.innerText || element?.textContent || "";
    },

    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },

    updateElement(element, property, value) {
      if (!element) return;
      element[property] = value;
    },

    toggleClass(element, className, condition) {
      if (!element) return;
      element.classList.toggle(className, condition);
    },
  };

  const terminal = {
    initializeInputs() {
      const inputConfigs = [
        {
          input: dom.officerInput,
          storageKey: CONFIG.storage.officer,
          stateKey: "officerId",
        },
        {
          input: dom.shiftInput,
          storageKey: CONFIG.storage.shift,
          stateKey: "shiftCode",
        },
      ];

      inputConfigs.forEach(({ input, storageKey, stateKey }) => {
        if (!input) return;

        // Load saved value
        const savedValue = utils.loadFromStorage(storageKey);
        if (savedValue) {
          utils.updateElement(input, "value", savedValue);
          state[stateKey] = savedValue;
        }

        // Add event listener
        input.addEventListener("input", (e) => {
          const value = e.target.value.trim();
          state[stateKey] = value;
          utils.saveToStorage(storageKey, value);
          terminal.updateFieldsLock();
          generateOutput();
        });
      });

      terminal.updateFieldsLock();
    },

    isFieldsLocked() {
      return (
        !state.officerId ||
        state.officerId.trim() === "" ||
        !state.shiftCode ||
        state.shiftCode.trim() === "" ||
        state.shiftCode.trim().length < 7
      );
    },

    updateFieldsLock() {
      const isLocked = terminal.isFieldsLocked();
      const inputs = dom.fieldControls?.querySelectorAll("input") || [];

      inputs.forEach((input) => (input.disabled = isLocked));

      // Update visual states with fade transition
      const elementsToUpdate = [
        { selector: ".fields-panel", lockedClass: "panel-locked" },
        { selector: ".header-meta", lockedClass: "auth-required" },
      ];

      elementsToUpdate.forEach(({ selector, lockedClass }) => {
        const element = document.querySelector(selector);
        if (!element) return;

        if (isLocked) {
          element.classList.remove("fade-out");
          element.classList.add(lockedClass);
        } else {
          element.classList.add("fade-out");
          setTimeout(() => {
            element.classList.remove(lockedClass, "fade-out");
          }, 500);
        }
      });
    },

    startSystemClock() {
      const updateClock = () => {
        if (dom.systemTime) {
          dom.systemTime.textContent = utils.formatTime();
        }
      };
      updateClock();
      setInterval(updateClock, 1000);
    },
  };

  const templates = {
    async loadList() {
      try {
        const apiUrl = `${CONFIG.api.baseUrl}/${CONFIG.repo.user}/${CONFIG.repo.name}/contents/templates?ref=${CONFIG.repo.branch}`;
        const response = await fetch(apiUrl, { headers: CONFIG.api.headers });

        if (!response.ok) throw new Error("Failed to load template list");

        const items = await response.json();
        const txtFiles = items
          .filter((f) => f && f.type === "file" && /\.txt$/i.test(f.name))
          .map((f) => ({ name: f.name, path: f.path }));

        const processedTemplates = await Promise.all(
          txtFiles.map(async (file) => {
            try {
              const res = await fetch(`templates/${file.name}?v=${Date.now()}`);
              if (!res.ok) throw new Error("Failed to load template");

              const text = await res.text();
              const { body, name, desc } = extractHeaders(text);

              return {
                file: file.name,
                name: name || file.name.replace(/\.txt$/i, ""),
                description: desc || "",
                body,
              };
            } catch (err) {
              console.error(`Error loading template ${file.name}:`, err);
              return null;
            }
          }),
        );

        state.templates = processedTemplates.filter((t) => t !== null);
        populateTemplateSelector();

        if (state.templates.length > 0) {
          await templates.load(
            state.templates[0].file,
            state.templates[0].description,
          );
        }
      } catch (err) {
        console.error("Error loading template list:", err);
      }
    },

    async load(fileName, description) {
      try {
        const template = state.templates.find((t) => t.file === fileName);
        if (!template) throw new Error("Template not found");

        state.currentTemplate = parseTemplate(template.body);
        renderFields(state.currentTemplate.fields);

        if (dom.outputTerminal) {
          dom.outputTerminal.dataset.userEdited = "false";
        }

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

  function parseTemplate(text) {
    const fields = [];
    const regex = /\[field\]/g;
    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
      const pos = match.index;
      const before = text.slice(Math.max(0, pos - 200), pos);

      let label = null;
      const labelMatches = before.match(/\[b\]([^\[]+?):\s*\[\/b\]/g);

      if (labelMatches && labelMatches.length > 0) {
        const lastMatch = labelMatches[labelMatches.length - 1];
        const m = lastMatch.match(/\[b\]([^\[]+?):\s*\[\/b\]/);
        if (m) {
          label = m[1].trim();
        }
      }

      if (!label) {
        label = `Field ${index + 1}`;
      }

      fields.push({
        label,
        value: "",
        pos,
        id: `field_${index}`,
      });

      index++;
    }

    return { fields, originalText: text };
  }

  function renderFields(fields) {
    if (!dom.fieldControls) return;

    dom.fieldControls.innerHTML = "";

    if (!fields || fields.length === 0) {
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
      input.addEventListener("input", handleFieldInput);
      input.addEventListener("change", saveFieldsToStorage);

      dom.fieldControls.appendChild(wrapper);
    });

    updateFieldCounter();

    // Update lock state after rendering fields
    terminal.updateFieldsLock();
  }

  const handleFieldInput = utils.debounce((e) => {
    const index = parseInt(e.target.dataset.index, 10);
    if (state.currentTemplate && state.currentTemplate.fields[index]) {
      state.currentTemplate.fields[index].value = e.target.value;
      generateOutput();
      updateFieldCounter();
    }
  }, 150);

  function updateFieldCounter() {
    if (!dom.fieldCounter) return;

    let filled = 0;
    if (state.currentTemplate && state.currentTemplate.fields) {
      filled = state.currentTemplate.fields.filter(
        (f) => f.value.trim() !== "",
      ).length;
    }

    state.fieldsFilled = filled;
    dom.fieldCounter.textContent = `${filled} / ${state.totalFields}`;

    if (filled === state.totalFields && state.totalFields > 0) {
      dom.fieldCounter.classList.add("complete");
    } else {
      dom.fieldCounter.classList.remove("complete");
    }
  }

  function saveFieldsToStorage() {
    if (!state.currentTemplate) return;

    const fieldData = state.currentTemplate.fields.map((f) => ({
      label: f.label,
      value: f.value,
    }));

    utils.saveToStorage(CONFIG.storage.fields, fieldData);
  }

  function loadSavedFields() {
    const savedFields = utils.loadFromStorage(CONFIG.storage.fields);
    if (!savedFields || !state.currentTemplate) return;

    savedFields.forEach((saved, idx) => {
      if (
        state.currentTemplate.fields[idx] &&
        state.currentTemplate.fields[idx].label === saved.label
      ) {
        state.currentTemplate.fields[idx].value = saved.value;

        const input = document.querySelector(`#field_${idx}`);
        if (input) {
          input.value = saved.value;
        }
      }
    });

    updateFieldCounter();
    generateOutput();

    // Check lock state after loading saved fields
    terminal.updateFieldsLock();
  }

  function generateOutput() {
    if (!state.currentTemplate) return;

    let rawResult = state.currentTemplate.originalText;
    let htmlResult = state.currentTemplate.originalText;

    // Replace field placeholders in order - this ensures each [field] gets replaced with the correct value
    state.currentTemplate.fields.forEach((field, index) => {
      const value = field.value || "";
      // Use a more specific replacement to ensure we replace the right field
      const fieldPlaceholder = "[field]";
      const fieldIndex = rawResult.indexOf(fieldPlaceholder);
      if (fieldIndex !== -1) {
        rawResult =
          rawResult.substring(0, fieldIndex) +
          value +
          rawResult.substring(fieldIndex + fieldPlaceholder.length);
      }

      const htmlFieldIndex = htmlResult.indexOf(fieldPlaceholder);
      if (htmlFieldIndex !== -1) {
        const htmlValue = value
          ? `<span class="understood">${value}</span>`
          : '<span class="paper_field"></span>';
        htmlResult =
          htmlResult.substring(0, htmlFieldIndex) +
          htmlValue +
          htmlResult.substring(htmlFieldIndex + fieldPlaceholder.length);
      }
    });

    // Replace dynamic placeholders
    const replacements = {
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
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

    state.currentRaw = rawResult;

    if (dom.previewRender) {
      dom.previewRender.innerHTML = pencodeToHtml(htmlResult);
    }

    if (dom.outputTerminal) {
      // Always update the terminal output to ensure fields populate correctly
      dom.outputTerminal.innerText = rawResult;
      // Reset the user-edited flag when we programmatically update
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

  function pencodeToHtml(text) {
    if (!text) return "";

    // Tag replacements using optimized lookup map
    const tagMap = {
      // Basic formatting
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

      // Headers and lists
      "[h1]": "<H1>",
      "[/h1]": "</H1>",
      "[h2]": "<H2>",
      "[/h2]": "</H2>",
      "[h3]": "<H3>",
      "[/h3]": "</H3>",
      "[*]": "<li>",
      "[list]": "<ul>",
      "[/list]": "</ul>",

      // Tables
      "[table]":
        '<table border=1 cellspacing=0 cellpadding=3 style="border: 1px solid black;">',
      "[/table]": "</td></tr></table>",
      "[grid]": "<table>",
      "[/grid]": "</td></tr></table>",
      "[row]": "</td><tr>",
      "[cell]": "<td>",

      // Special elements
      "[barcode]": '<span class="barcode">║║│║║│││║│║║││║║│║</span>',
      "[sign]": '<span class="signature">[Signature Required]</span>',
    };

    // Corporate logos
    [
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
    ].forEach(([name, symbol, text]) => {
      tagMap[`[logo_${name}]`] =
        `<span class="corp-logo">${symbol} ${text}</span>`;
      tagMap[`[logo_${name}_small]`] =
        `<span class="corp-logo">${symbol}</span>`;
    });

    let t = text;

    // Apply simple tag replacements using single regex
    const tagPattern = new RegExp(
      Object.keys(tagMap)
        .map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
      "g",
    );

    t = t.replace(tagPattern, (match) => tagMap[match]);

    // Handle complex replacements that require custom logic
    t = t.replace(
      /\[redacted\](.*?)\[\/redacted\]/gs,
      (match, content) =>
        `<span class="redacted">${"|".repeat(content.length)}</span>`,
    );

    // Dynamic replacements
    const dynamics = {
      "[time]": utils.formatTime(),
      "[date]": utils.formatDate(),
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
    };

    Object.entries(dynamics).forEach(([placeholder, replacement]) => {
      const regex = new RegExp(
        placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g",
      );
      t = t.replace(regex, replacement);
    });

    // Complex pattern replacements
    t = t.replace(
      /\[color=([^\]]+)\](.*?)\[\/color\]/gs,
      '<span style="color: $1;">$2</span>',
    );
    t = t.replace(
      /\[lang=([^\]]+)\](.*?)\[\/lang\]/gs,
      '<span class="language" data-lang="$1" title="Language: $1">$2</span>',
    );

    return t;
  }

  function extractHeaders(text) {
    const lines = text.split(/\r?\n/);
    let name = "";
    let desc = "";
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith("Name:")) {
        name = line.slice(5).trim();
        i++;
        continue;
      }
      if (line.startsWith("Desc:")) {
        desc = line.slice(5).trim();
        i++;
        continue;
      }
      if (line === "") {
        i++;
        continue;
      }
      break;
    }

    const body = lines.slice(i).join("\n");
    return { name, desc, body };
  }

  function populateTemplateSelector() {
    if (!dom.templateSelector) return;

    dom.templateSelector.innerHTML = "";

    state.templates.forEach((template, index) => {
      const option = document.createElement("option");
      option.value = template.file;
      option.textContent = template.name;
      option.dataset.description = template.description || "";

      if (index === 0) option.selected = true;

      dom.templateSelector.appendChild(option);
    });
  }

  function toggleTerminal() {
    const main = document.querySelector(".terminal-main");
    const toggleBtn = document.getElementById("terminalToggle");

    if (main.classList.contains("terminal-hidden")) {
      main.classList.remove("terminal-hidden");
      toggleBtn.textContent = "HIDE TERMINAL";
      toggleBtn.setAttribute("aria-pressed", "false");
    } else {
      main.classList.add("terminal-hidden");
      toggleBtn.textContent = "SHOW TERMINAL";
      toggleBtn.setAttribute("aria-pressed", "true");
    }
  }

  function getCurrentOutput() {
    return (
      state.currentRaw ||
      (dom.outputTerminal ? utils.getTextContent(dom.outputTerminal) : "")
    );
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
      try {
        const textArea = document.createElement("textarea");
        textArea.value = content;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (fallbackErr) {
        console.error("Fallback copy also failed:", fallbackErr);
      }
    }
  }

  function downloadOutput() {
    const content = getCurrentOutput();
    if (!content) return;

    const fileName = `citation_${state.officerId}_${Date.now()}.txt`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (state.currentTemplate?.fields) {
      state.currentTemplate.fields.forEach((field, i) => {
        field.value = "";
        const input = document.querySelector(`#field_${i}`);
        if (input) input.value = "";
      });
      updateFieldCounter();
      generateOutput();
      saveFieldsToStorage();
    }
  }

  function setupEventHandlers() {
    // Template selector
    dom.templateSelector?.addEventListener("change", async (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const file = selectedOption.value;
      const desc = selectedOption.dataset.description;
      await templates.load(file, desc);
    });

    // Button event handlers
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
      dom.outputTerminal.addEventListener("paste", () => {
        setTimeout(handleTerminalEdit, 0);
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        downloadOutput();
      }

      if (e.ctrlKey && e.key === "c" && !window.getSelection().toString()) {
        e.preventDefault();
        copyOutput();
      }
    });
  }

  async function initialize() {
    const elementIds = [
      "templateSelector",
      "templateDescription",
      "fieldControls",
      "previewRender",
      "outputTerminal",
      "fieldCounter",
      "systemTime",
      "officerInput",
      "shiftInput",
      "copyButton",
    ];
    elementIds.forEach((id) => (dom[id] = document.getElementById(id)));

    const storedOfficer = utils.loadFromStorage(CONFIG.storage.officer);
    const storedShift = utils.loadFromStorage(CONFIG.storage.shift);

    if (storedOfficer) {
      state.officerId = storedOfficer;
      console.log("Restored officer:", storedOfficer);
    }
    if (storedShift) {
      state.shiftCode = storedShift;
      console.log("Restored shift:", storedShift);
    }

    terminal.initializeInputs();
    terminal.startSystemClock();

    setupEventHandlers();

    await templates.loadList();

    generateOutput();

    setInterval(() => {
      if (dom.shiftInput) {
        dom.shiftInput.value = "";
        state.shiftCode = "";
        utils.saveToStorage(CONFIG.storage.shift, "");
        terminal.updateFieldsLock();
      }
    }, 9000000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
