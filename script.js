(function () {
  "use strict";

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

  // DOM element cache
  const dom = {};
  const domIds = [
    "templateMatrix", "templateMetadata", "previewSurface", "terminalSurface",
    "galacticTime", "executiveAuth", "commandCipher", "processDocument", "fieldCounter",
  ];

  // === UTILITIES ===
  const utils = {
    formatTime: () => new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    formatDate: () => new Date().toLocaleDateString("en-CA"),

    storage: {
      key: (k) => CONFIG.storage.prefix + k,
      save(key, value) {
        try { localStorage.setItem(this.key(key), JSON.stringify(value)); }
        catch (e) { console.warn("Storage save failed:", e); }
      },
      load(key) {
        try { return JSON.parse(localStorage.getItem(this.key(key))); }
        catch { return null; }
      },
      clear() {
        Object.keys(localStorage)
          .filter(k => k.startsWith(CONFIG.storage.prefix))
          .forEach(k => localStorage.removeItem(k));
      },
    },

    debounce(fn, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
      };
    },

    escapeRegex: (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  };

  // === TERMINAL MANAGEMENT ===
  const terminal = {
    isFieldsLocked: () => !state.officerId?.trim() || (state.shiftCode?.trim()?.length || 0) < 7,

    initializeInputs() {
      const inputs = [
        { el: dom.executiveAuth, key: "officer", state: "officerId" },
        { el: dom.commandCipher, key: "shift", state: "shiftCode" },
      ];

      inputs.forEach(({ el, key, state: stateKey }) => {
        if (!el) return;
        const saved = utils.storage.load(key);
        if (saved) el.value = state[stateKey] = saved;

        el.addEventListener("input", (e) => {
          state[stateKey] = e.target.value.trim();
          utils.storage.save(key, state[stateKey]);
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

    startSystemClock() {
      const update = () => dom.galacticTime && (dom.galacticTime.textContent = utils.formatTime());
      update();
      setInterval(update, 1000);
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
              const { body, name: tplName, desc } = extractHeaders(text);
              return { file: name, name: tplName || name.replace(/\.txt$/i, ""), description: desc || "", body };
            } catch { return null; }
          })
        )).filter(Boolean);

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
      dom.templateMatrix.innerHTML = state.templates
        .map((t, i) => `<option value="${t.file}" data-description="${t.description || ""}" ${i === 0 ? "selected" : ""}>${t.name}</option>`)
        .join("");
    },
  };

  // === TEMPLATE PARSING ===
  function extractHeaders(text) {
    const lines = text.split(/\r?\n/);
    let name = "", desc = "", i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith("Name:")) name = line.slice(5).trim();
      else if (line.startsWith("Desc:")) desc = line.slice(5).trim();
      else if (line) break;
      i++;
    }
    return { name, desc, body: lines.slice(i).join("\n") };
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

  // === OUTPUT GENERATION ===
  const PENCODE_MAP = {
    "[b]": "<B>", "[/b]": "</B>", "[i]": "<I>", "[/i]": "</I>",
    "[u]": "<U>", "[/u]": "</U>", "[large]": '<font size="4">', "[/large]": "</font>",
    "[small]": '<font size="1">', "[/small]": "</font>", "[center]": "<center>",
    "[/center]": "</center>", "[br]": "<BR>", "[hr]": "<HR>",
    "[field]": '<span class="paper_field"></span>', "[jobs]": '<span class="paper_field"></span>',
    "[h1]": "<H1>", "[/h1]": "</H1>", "[h2]": "<H2>", "[/h2]": "</H2>",
    "[h3]": "<H3>", "[/h3]": "</H3>", "[*]": "<li>", "[list]": "<ul>", "[/list]": "</ul>",
    "[table]": '<table border=1 cellspacing=0 cellpadding=3 style="border: 1px solid black;">',
    "[/table]": "</td></tr></table>", "[grid]": "<table>", "[/grid]": "</td></tr></table>",
    "[row]": "</td><tr>", "[cell]": "<td>", "[barcode]": '<span class="barcode">║║│║║│││║│║║││║║│║</span>',
  };

  // Add corporate logos
  [["scc", "⬢", "SCC"], ["nt", "◆", "NT"], ["zh", "▣", "ZH"], ["idris", "◉", "IDRIS"],
   ["eridani", "⬟", "ECF"], ["zavod", "▲", "ZAVOD"], ["hp", "⬡", "HEPH"], ["be", "◈", "BE"],
   ["golden", "◊", "GOLDEN"], ["pvpolice", "★", "PKM"]
  ].forEach(([name, sym, txt]) => {
    PENCODE_MAP[`[logo_${name}]`] = `<span class="corp-logo">${sym} ${txt}</span>`;
    PENCODE_MAP[`[logo_${name}_small]`] = `<span class="corp-logo">${sym}</span>`;
  });

  const PENCODE_REGEX = new RegExp(Object.keys(PENCODE_MAP).map(utils.escapeRegex).join("|"), "g");

  function pencodeToHtml(text) {
    if (!text) return "";
    return text
      .replace(PENCODE_REGEX, m => PENCODE_MAP[m])
      .replace(/\[redacted\](.*?)\[\/redacted\]/gs, (_, c) => `<span class="redacted">${"|".repeat(c.length)}</span>`)
      .replace(/\[color=([^\]]+)\](.*?)\[\/color\]/gs, '<span style="color: $1;">$2</span>')
      .replace(/\[lang=([^\]]+)\](.*?)\[\/lang\]/gs, '<span class="language" data-lang="$1" title="Language: $1">$2</span>');
  }

  function generateOutput() {
    if (!state.currentTemplate) return;

    const dynamics = {
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
      "[time]": utils.formatTime(),
      "[date]": utils.formatDate(),
    };

    let raw = state.currentTemplate.originalText;
    let html = raw;

    // Apply dynamic replacements
    Object.entries(dynamics).forEach(([ph, val]) => {
      const re = new RegExp(utils.escapeRegex(ph), "g");
      raw = raw.replace(re, val);
      html = html.replace(re, val ? `<span class="understood">${val}</span>` : '<span class="paper_field"></span>');
    });

    // Apply field replacements
    [...state.currentTemplate.fields].sort((a, b) => a.pos - b.pos).forEach((field, idx) => {
      const ph = field.type === "job" ? "[jobs]" : "[field]";
      const val = field.value || "";

      const htmlVal = field.type === "job"
        ? `<button class="job-button ${val ? "filled" : "empty"}" data-field-id="${field.id}" data-field-index="${idx}" data-field-type="job" data-placeholder="${field.placeholder}" type="button">${val || "Click to Select Assignment"}</button>`
        : `<span class="paper_field" data-field-id="${field.id}" data-field-index="${idx}" data-field-type="${field.type}" data-placeholder="${field.placeholder}" spellcheck="false">${val}</span>`;

      const rawIdx = raw.indexOf(ph);
      if (rawIdx !== -1) raw = raw.slice(0, rawIdx) + val + raw.slice(rawIdx + ph.length);

      const htmlIdx = html.indexOf(ph);
      if (htmlIdx !== -1) html = html.slice(0, htmlIdx) + htmlVal + html.slice(htmlIdx + ph.length);
    });

    state.currentRaw = raw;
    if (dom.previewSurface) {
      dom.previewSurface.innerHTML = pencodeToHtml(html);
      setupInlineFieldEvents();
    }
    if (dom.terminalSurface) {
      dom.terminalSurface.value = raw;
      dom.terminalSurface.dataset.userEdited = "false";
    }
    terminal.updateFieldsLock();
  }

  function updateRawOutput() {
    if (!state.currentTemplate) return;

    const dynamics = {
      "[officername]": state.officerId || "",
      "[roundid]": state.shiftCode || "",
      "[time]": utils.formatTime(),
      "[date]": utils.formatDate(),
    };

    let raw = state.currentTemplate.originalText;
    Object.entries(dynamics).forEach(([ph, val]) => {
      raw = raw.replace(new RegExp(utils.escapeRegex(ph), "g"), val);
    });

    [...state.currentTemplate.fields].sort((a, b) => a.pos - b.pos).forEach(field => {
      const ph = field.type === "job" ? "[jobs]" : "[field]";
      const idx = raw.indexOf(ph);
      if (idx !== -1) raw = raw.slice(0, idx) + (field.value || "") + raw.slice(idx + ph.length);
    });

    state.currentRaw = raw;
    if (dom.terminalSurface) {
      dom.terminalSurface.value = raw;
      dom.terminalSurface.dataset.userEdited = "false";
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
    utils.storage.save("fields", state.currentTemplate.fields.map(f => ({ label: f.label, value: f.value, type: f.type || "text" })));
  }

  function loadSavedFields() {
    const saved = utils.storage.load("fields");
    if (!saved || !state.currentTemplate) return;
    saved.forEach((s, i) => {
      const field = state.currentTemplate.fields[i];
      if (field?.label === s.label) field.value = s.value;
    });
  }

  function setupInlineFieldEvents() {
    if (!dom.previewSurface) return;

    // Editable text fields
    const handleInput = utils.debounce((e, idx) => {
      if (state.currentTemplate?.fields[idx]) {
        state.currentTemplate.fields[idx].value = e.target.textContent || "";
        updateFieldCounter();
        updateRawOutput();
      }
    }, 150);

    dom.previewSurface.querySelectorAll(".paper_field[data-field-id]").forEach(field => {
      const idx = parseInt(field.dataset.fieldIndex, 10);
      field.addEventListener("input", (e) => handleInput(e, idx));
      field.addEventListener("focus", (e) => { e.target.classList.add("focused"); if (!e.target.textContent.trim()) e.target.textContent = ""; });
      field.addEventListener("blur", (e) => { e.target.classList.remove("focused"); if (!e.target.textContent.trim()) e.target.textContent = ""; saveFieldsToStorage(); });
    });

    // Job buttons
    dom.previewSurface.querySelectorAll('button.job-button[data-field-type="job"]').forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        window.SCC_JOBS?.openJobSelector?.(btn.dataset.fieldId);
      });
    });
  }

  function handleTerminalEdit() {
    if (!dom.terminalSurface) return;
    dom.terminalSurface.dataset.userEdited = "true";
    state.currentRaw = dom.terminalSurface.value || "";
    if (dom.previewSurface) {
      dom.previewSurface.innerHTML = pencodeToHtml(state.currentRaw);
      setupInlineFieldEvents();
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

    // Clear fields
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
    const clear = () => utils.storage.clear();
    ["beforeunload", "unload"].forEach(e => window.addEventListener(e, clear));
    document.addEventListener("visibilitychange", () => document.hidden && clear());
  }

  // === INITIALIZATION ===
  async function initialize() {
    domIds.forEach(id => dom[id] = document.getElementById(id));

    // Load saved auth
    const saved = { officer: utils.storage.load("officer"), shift: utils.storage.load("shift") };
    if (saved.officer) state.officerId = saved.officer;
    if (saved.shift) state.shiftCode = saved.shift;

    terminal.initializeInputs();
    terminal.startSystemClock();
    setupEventHandlers();
    scrollSync.init();
    await templates.loadList();

    // Auto-clear shift
    setInterval(() => {
      if (dom.commandCipher) {
        dom.commandCipher.value = state.shiftCode = "";
        utils.storage.save("shift", "");
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
      utils.storage.clear();
      Object.assign(state, { officerId: null, shiftCode: "", currentTemplate: null, currentRaw: "", fieldsFilled: 0, totalFields: 0 });
      ["executiveAuth", "commandCipher"].forEach(k => dom[k] && (dom[k].value = ""));
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
