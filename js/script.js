(function () {
  "use strict";

  // === IMPORTS FROM SHARED MODULES ===
  const { utils, createStorageManager, createSystemClock, createDomCache } = window.SCC_SHARED;
  const { PencodeEngine } = window.SCC_PENCODE;

  // === CONFIGURATION ===
  const CONFIG = {
    repo: { user: "mnemeory", name: "mnemeory.github.io", branch: "main" },
    api: {
      baseUrl: "https://api.github.com/repos",
      headers: { Accept: "application/vnd.github+json" },
    },
    storage: { prefix: "scc_terminal_", keys: ["fields", "officer", "shift"] },
    shiftTimeout: 9000000, // 2.5 hours
    fieldPatterns: [
      { regex: /\[field\]/g, type: "text", prefix: "field_" },
      { regex: /\[jobs\]/g, type: "job", prefix: "job_" },
    ],
  };

  // === STATE ===
  const state = {
    currentTemplate: null,
    currentRaw: "",
    templates: [],
    fieldsFilled: 0,
    totalFields: 0,
    officerId: null,
    shiftCode: "",
  };

  const storage = createStorageManager(CONFIG.storage.prefix);
  const pencodeEngine = new PencodeEngine();

  let dom = {};
  const domIds = [
    "templateMatrix", "templateMetadata", "previewSurface", "terminalSurface",
    "galacticTime", "executiveAuth", "commandShift", "processDocument", "fieldCounter",
  ];

  // === TERMINAL MANAGEMENT ===
  const terminal = {
    isFieldsLocked: () => !state.officerId?.trim() || (state.shiftCode?.trim()?.length || 0) < 7,

    initializeInputs() {
      const inputs = [
        { el: dom.executiveAuth, key: "officer", state: "officerId" },
        { el: dom.commandShift, key: "shift", state: "shiftCode" },
      ];

      inputs.forEach(({ el, key, state: stateKey }) => {
        if (!el) return;
        const saved = storage.load(key);
        if (saved) el.value = state[stateKey] = saved;

        el.addEventListener("input", (e) => {
          state[stateKey] = e.target.value.trim();
          storage.save(key, state[stateKey]);
          this.updateFieldsLock();
          generateOutput();
        });
      });

      this.updateFieldsLock();
    },

    updateFieldsLock() {
      if (!dom.previewSurface) return;
      const isLocked = this.isFieldsLocked();
      const style = { cursor: isLocked ? "not-allowed" : "", opacity: isLocked ? "0.5" : "" };

      dom.previewSurface.querySelectorAll(".paper_field[data-field-id]").forEach(field => {
        field.contentEditable = !isLocked;
        Object.assign(field.style, { ...style, cursor: isLocked ? "not-allowed" : "text" });
      });

      dom.previewSurface.querySelectorAll('button.job-button[data-field-type="job"]').forEach(btn => {
        btn.disabled = isLocked;
        Object.assign(btn.style, { ...style, cursor: isLocked ? "not-allowed" : "pointer" });
      });
    },
  };

  // === TEMPLATE MANAGEMENT ===
  const templates = {
    async loadList() {
      try {
        const url = `${CONFIG.api.baseUrl}/${CONFIG.repo.user}/${CONFIG.repo.name}/contents/templates?ref=${CONFIG.repo.branch}`;
        const res = await fetch(url, { headers: CONFIG.api.headers });
        if (!res.ok) throw new Error("Failed to load template list");

        const items = await res.json();
        const txtFiles = items.filter(f => f?.type === "file" && /\.txt$/i.test(f.name));

        state.templates = (await Promise.all(
          txtFiles.map(async ({ name }) => {
            try {
              const res = await fetch(`templates/${name}?v=${Date.now()}`);
              if (!res.ok) throw new Error();
              const text = await res.text();
              const { body, name: tplName, desc, category } = extractHeaders(text);
              return { file: name, name: tplName || name.replace(/\.txt$/i, ""), description: desc || "", category: category || "Uncategorized", body };
            } catch { return null; }
          })
        )).filter(Boolean);

        state.templates.sort((a, b) => {
          const cat = (a.category || "Uncategorized").localeCompare(b.category || "Uncategorized");
          return cat !== 0 ? cat : (a.name || "").localeCompare(b.name || "");
        });

        this.populateSelector();
        if (state.templates.length) await this.load(state.templates[0].file, state.templates[0].description);
      } catch (err) {
        console.error("Error loading templates:", err);
        this.createFallback();
      }
    },

    createFallback() {
      state.templates = [{
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
      }];
      this.populateSelector();
      if (state.templates.length) this.load(state.templates[0].file, state.templates[0].description);
    },

    async load(fileName, description) {
      const template = state.templates.find(t => t.file === fileName);
      if (!template) return;

      state.currentTemplate = parseTemplate(template.body);
      state.totalFields = state.currentTemplate.fields.length;
      if (dom.terminalSurface) dom.terminalSurface.dataset.userEdited = "false";
      if (dom.templateMetadata) dom.templateMetadata.textContent = description || "";

      loadSavedFields();
      updateFieldCounter();
      generateOutput();
    },

    populateSelector() {
      if (!dom.templateMatrix) return;

      const groups = {};
      state.templates.forEach(t => {
        const cat = t.category || "Uncategorized";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(t);
      });

      const sortedCategories = Object.keys(groups).sort((a, b) => a.localeCompare(b));

      let html = "";
      let firstOption = true;
      sortedCategories.forEach(cat => {
        html += `<optgroup label="${cat}">`;
        groups[cat].sort((a, b) => a.name.localeCompare(b.name)).forEach(t => {
          html += `<option value="${t.file}" data-description="${t.description || ""}" ${firstOption ? "selected" : ""}>${t.name}</option>`;
          firstOption = false;
        });
        html += `</optgroup>`;
      });

      dom.templateMatrix.innerHTML = html;
    },
  };

  // === TEMPLATE PARSING ===
  function extractHeaders(text) {
    const lines = text.split(/\r?\n/);
    let name = "", desc = "", category = "", i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith("Name:")) name = line.slice(5).trim();
      else if (line.startsWith("Category:")) category = line.slice(9).trim();
      else if (line.startsWith("Desc:")) desc = line.slice(5).trim();
      else if (line) break;
      i++;
    }
    return { name, desc, category, body: lines.slice(i).join("\n") };
  }

  function parseTemplate(text) {
    const fields = [];

    CONFIG.fieldPatterns.forEach(({ regex, type, prefix }) => {
      let match, index = 0;
      const re = new RegExp(regex.source, regex.flags); // Clone regex

      while ((match = re.exec(text)) !== null) {
        const before = text.slice(Math.max(0, match.index - 200), match.index);
        const labelMatches = before.match(/\[b\]([^\[]+?):\s*\[\/b\]/g);
        let label = type === "job" ? "Personnel Assignment" : `Field ${index + 1}`;

        if (labelMatches?.length) {
          const m = labelMatches[labelMatches.length - 1].match(/\[b\]([^\[]+?):\s*\[\/b\]/);
          if (m) label = m[1].trim();
        }

        fields.push({ label, value: "", pos: match.index, id: `${prefix}${index}`, type, placeholder: label });
        index++;
      }
    });

    return { fields: fields.sort((a, b) => a.pos - b.pos), originalText: text };
  }

  // === OUTPUT GENERATION (MERGED) ===
  /**
   * Generate output - unified function that handles both HTML preview and raw output
   * @param {boolean} updateHtml - Whether to update the HTML preview (default: true)
   */
  function generateOutput(updateHtml = true) {
    if (!state.currentTemplate) return;

    const dynamics = {
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
      "[time]": utils.formatTime(),
      "[date]": utils.formatDate(),
    };

    const sortedFields = [...state.currentTemplate.fields].sort((a, b) => a.pos - b.pos);

    let raw = pencodeEngine.applyDynamics(state.currentTemplate.originalText, dynamics, false);
    raw = pencodeEngine.applyFieldReplacements(raw, sortedFields, { forHtml: false, keepPlaceholderIfEmpty: true });
    state.currentRaw = raw;

    if (dom.terminalSurface) {
      dom.terminalSurface.value = raw;
      dom.terminalSurface.dataset.userEdited = "false";
    }

    if (updateHtml && dom.previewSurface) {
      let html = pencodeEngine.applyDynamics(state.currentTemplate.originalText, dynamics, true);
      html = pencodeEngine.applyFieldReplacements(html, sortedFields, { forHtml: true });
      dom.previewSurface.innerHTML = pencodeEngine.toHtml(html);
      setupFieldEventDelegation();
      terminal.updateFieldsLock();
    }
  }

  // === FIELD MANAGEMENT ===
  function updateFieldCounter() {
    if (!dom.fieldCounter || !state.currentTemplate?.fields) {
      if (dom.fieldCounter) dom.fieldCounter.textContent = "0 / 0";
      return;
    }
    const filled = state.currentTemplate.fields.filter(f => f.value?.trim()).length;
    state.fieldsFilled = filled;
    dom.fieldCounter.textContent = `${filled} / ${state.totalFields}`;
    dom.fieldCounter.classList.toggle("complete", filled === state.totalFields && state.totalFields > 0);
  }

  function saveFieldsToStorage() {
    if (!state.currentTemplate) return;
    storage.save("fields", state.currentTemplate.fields.map(f => ({ label: f.label, value: f.value, type: f.type || "text" })));
  }

  function loadSavedFields() {
    const saved = storage.load("fields");
    if (!saved || !state.currentTemplate) return;
    saved.forEach((s, i) => {
      const field = state.currentTemplate.fields[i];
      if (field?.label === s.label) field.value = s.value;
    });
  }

  // === EVENT DELEGATION FOR FIELDS ===
  const debouncedFieldInput = utils.debounce((fieldIndex, content) => {
    if (state.currentTemplate?.fields[fieldIndex]) {
      state.currentTemplate.fields[fieldIndex].value = content;
      updateFieldCounter();
      generateOutput(false);
    }
  }, 150);

  /**
   * Setup event delegation for inline fields - single listeners on parent
   */
  function setupFieldEventDelegation() {
    if (!dom.previewSurface) return;

  }

  /**
   * Initialize event delegation on the preview surface (called once)
   */
  function initializeFieldDelegation() {
    if (!dom.previewSurface) return;

    dom.previewSurface.addEventListener("click", (e) => {
      const jobBtn = e.target.closest('button.job-button[data-field-type="job"]');
      if (jobBtn) {
        e.preventDefault();
        window.SCC_JOBS?.openJobSelector?.(jobBtn.dataset.fieldId);
      }
    });

    dom.previewSurface.addEventListener("input", (e) => {
      const field = e.target.closest('.paper_field[data-field-id]');
      if (field) {
        const idx = parseInt(field.dataset.fieldIndex, 10);
        debouncedFieldInput(idx, field.textContent || "");
      }
    });

    dom.previewSurface.addEventListener("focusin", (e) => {
      const field = e.target.closest('.paper_field[data-field-id]');
      if (field) {
        field.classList.add("focused");
        if (!field.textContent.trim()) field.textContent = "";
      }
    });

    dom.previewSurface.addEventListener("focusout", (e) => {
      const field = e.target.closest('.paper_field[data-field-id]');
      if (field) {
        field.classList.remove("focused");
        if (!field.textContent.trim()) field.textContent = "";
        saveFieldsToStorage();
      }
    });
  }

  function handleTerminalEdit() {
    if (!dom.terminalSurface) return;
    dom.terminalSurface.dataset.userEdited = "true";
    state.currentRaw = dom.terminalSurface.value || "";
    if (dom.previewSurface) {
      dom.previewSurface.innerHTML = pencodeEngine.toHtml(state.currentRaw);
      terminal.updateFieldsLock();
    }
  }

  // === ACTIONS ===
  function toggleTerminal() {
    const main = document.querySelector(".terminal-main");
    const btn = document.getElementById("terminalToggle");
    const hidden = main.classList.toggle("terminal-hidden");
    btn.textContent = hidden ? "SHOW TERMINAL" : "HIDE TERMINAL";
    btn.setAttribute("aria-pressed", hidden);
  }

  async function copyOutput() {
    const content = state.currentRaw || dom.terminalSurface?.value || "";
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const ta = Object.assign(document.createElement("textarea"), { value: content, style: "position:fixed;opacity:0" });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }

    const btn = document.getElementById("transmitCommand");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "COPIED!";
      btn.style.color = "var(--state-success)";
      setTimeout(() => { btn.textContent = orig; btn.style.color = ""; }, 1500);
    }
  }

  function downloadOutput() {
    const content = state.currentRaw || dom.terminalSurface?.value || "";
    if (!content) return;

    const header = `STELLAR CORPORATE CONGLOMERATE\nExecutive Officer: ${state.officerId || "Anonymous"}\nSession ID: ${state.shiftCode || "Unknown"}\nGenerated: ${utils.formatTime()} ${utils.formatDate()}\n\n${content}`;
    const blob = new Blob([header], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), { href: url, download: `SCC_Document_${state.officerId}_${Date.now()}.txt` });
    link.click();
    URL.revokeObjectURL(url);

    state.currentTemplate?.fields?.forEach(f => f.value = "");
    updateFieldCounter();
    generateOutput();
    saveFieldsToStorage();
  }

  // === SCROLL SYNC ===
  const scrollSync = {
    lastSource: null,
    lastTime: 0,
    frame: null,

    init() {
      if (!dom.terminalSurface || !dom.previewSurface) return;
      [dom.terminalSurface, dom.previewSurface].forEach((el, i, arr) => {
        el.addEventListener("scroll", () => this.handle(el, arr[1 - i]), { passive: true });
      });
    },

    handle(source, target) {
      const now = Date.now();
      if (this.lastSource === target && now - this.lastTime < 100) return;
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.sync(source, target));
    },

    sync(source, target) {
      this.lastSource = source;
      this.lastTime = Date.now();
      const pct = source.scrollTop / (source.scrollHeight - source.clientHeight || 1);
      target.scrollTop = (target.scrollHeight - target.clientHeight) * pct;
    },
  };

  // === EVENT SETUP ===
  function setupEventHandlers() {
    dom.templateMatrix?.addEventListener("change", async (e) => {
      const opt = e.target.selectedOptions[0];
      await templates.load(opt.value, opt.dataset.description);
    });

    const actions = { processDocument: downloadOutput, transmitCommand: copyOutput, terminalToggle: toggleTerminal };
    Object.entries(actions).forEach(([id, fn]) => document.getElementById(id)?.addEventListener("click", fn));

    if (dom.terminalSurface) {
      dom.terminalSurface.addEventListener("input", handleTerminalEdit);
      dom.terminalSurface.addEventListener("paste", () => setTimeout(handleTerminalEdit, 0));
    }

    // Data cleanup
    const clear = () => storage.clear();
    ["beforeunload", "unload"].forEach(e => window.addEventListener(e, clear));
    document.addEventListener("visibilitychange", () => document.hidden && clear());
  }

  // === INITIALIZATION ===
  async function initialize() {
    dom = createDomCache(domIds);

    const savedOfficer = storage.load("officer");
    const savedShift = storage.load("shift");
    if (savedOfficer) state.officerId = savedOfficer;
    if (savedShift) state.shiftCode = savedShift;

    terminal.initializeInputs();
    createSystemClock("galacticTime");
    setupEventHandlers();
    initializeFieldDelegation();
    scrollSync.init();
    await templates.loadList();

    setInterval(() => {
      if (dom.commandShift) {
        dom.commandShift.value = state.shiftCode = "";
        storage.save("shift", "");
        terminal.updateFieldsLock();
      }
    }, CONFIG.shiftTimeout);
  }

  // === PUBLIC API ===
  window.SCC_TERMINAL = {
    updateField(fieldId, value) {
      const field = state.currentTemplate?.fields.find(f => f.id === fieldId);
      if (field) { field.value = value; generateOutput(); saveFieldsToStorage(); }
    },
    getFieldValue: (fieldId) => state.currentTemplate?.fields.find(f => f.id === fieldId)?.value || "",
    isFieldsLocked: () => terminal.isFieldsLocked(),
    clearData() {
      storage.clear();
      Object.assign(state, { officerId: null, shiftCode: "", currentTemplate: null, currentRaw: "", fieldsFilled: 0, totalFields: 0 });
      ["executiveAuth", "commandShift"].forEach(k => dom[k] && (dom[k].value = ""));
      if (dom.previewSurface) dom.previewSurface.innerHTML = "";
      if (dom.terminalSurface) dom.terminalSurface.value = "";
      if (dom.fieldCounter) dom.fieldCounter.textContent = "0 / 0";
      terminal.updateFieldsLock();
    },
  };

  // Start
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", initialize)
    : initialize();
})();
