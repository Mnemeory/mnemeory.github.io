/**
 * SCC Pencode Engine
 * Handles parsing and rendering of pencode markup format
 */
(function () {
  "use strict";

  const { utils } = window.SCC_SHARED;

  // === PENCODE TAG MAPPINGS ===
  const PENCODE_MAP = {
    // Text formatting
    "[b]": "<B>", "[/b]": "</B>",
    "[i]": "<I>", "[/i]": "</I>",
    "[u]": "<U>", "[/u]": "</U>",
    "[large]": '<font size="4">', "[/large]": "</font>",
    "[small]": '<font size="1">', "[/small]": "</font>",
    
    // Layout
    "[center]": "<center>", "[/center]": "</center>",
    "[br]": "<BR>", "[hr]": "<HR>",
    
    // Placeholders (will be replaced with actual fields)
    "[field]": '<span class="paper_field"></span>',
    "[jobs]": '<span class="paper_field"></span>',
    
    // Headings
    "[h1]": "<H1>", "[/h1]": "</H1>",
    "[h2]": "<H2>", "[/h2]": "</H2>",
    "[h3]": "<H3>", "[/h3]": "</H3>",
    
    // Lists - Note: [*] handled specially in post-processing
    "[list]": "<ul>", "[/list]": "</ul>",
    
    // Tables
    "[table]": '<table border=1 cellspacing=0 cellpadding=3 style="border: 1px solid black;">',
    "[/table]": "</td></tr></table>",
    "[grid]": "<table>", "[/grid]": "</td></tr></table>",
    "[row]": "</td><tr>", "[cell]": "<td>",
    
    // Special elements
    "[barcode]": '<span class="barcode">║║│║║│││║│║║││║║│║</span>',
  };

  // Add corporate logos
  const CORPORATE_LOGOS = [
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

  CORPORATE_LOGOS.forEach(([name, sym, txt]) => {
    PENCODE_MAP[`[logo_${name}]`] = `<span class="corp-logo">${sym} ${txt}</span>`;
    PENCODE_MAP[`[logo_${name}_small]`] = `<span class="corp-logo">${sym}</span>`;
  });

  // Pre-compile the main regex once (optimization)
  const PENCODE_REGEX = new RegExp(
    Object.keys(PENCODE_MAP).map(utils.escapeRegex).join("|"),
    "g"
  );

  // Pattern-based regex for special tags
  const SPECIAL_PATTERNS = [
    {
      regex: /\[redacted\](.*?)\[\/redacted\]/gs,
      replace: (_, content) => `<span class="redacted">${"|".repeat(content.length)}</span>`
    },
    {
      regex: /\[color=([^\]]+)\](.*?)\[\/color\]/gs,
      replace: '<span style="color: $1;">$2</span>'
    },
    {
      regex: /\[lang=([^\]]+)\](.*?)\[\/lang\]/gs,
      replace: '<span class="language" data-lang="$1" title="Language: $1">$2</span>'
    },
  ];

  /**
   * Process list items [*] with proper <li></li> wrapping
   * This handles the complex case of list items that can span multiple lines
   * and may contain nested content.
   * 
   * @param {string} html - HTML string with <ul> tags but raw [*] markers
   * @returns {string} HTML with properly wrapped <li> elements
   */
  function processListItems(html) {
    // Process each <ul>...</ul> block separately
    return html.replace(/<ul>([\s\S]*?)<\/ul>/gi, (match, content) => {
      // Split on [*] markers
      const parts = content.split(/\[\*\]/);
      
      // First part is content before any [*] (usually whitespace or nothing)
      const beforeFirstItem = parts[0];
      
      // Remaining parts are the actual list items
      const items = parts.slice(1);
      
      if (items.length === 0) {
        // No [*] markers found - return content as-is (might be inline list usage)
        return `<ul>${content}</ul>`;
      }
      
      // Build the list with proper <li> tags
      const listItems = items.map(item => {
        // Trim leading/trailing whitespace from each item
        const trimmed = item.trim();
        return trimmed ? `<li>${trimmed}</li>` : '';
      }).filter(Boolean).join('\n');
      
      return `<ul>\n${listItems}\n</ul>`;
    });
  }

  // === PENCODE ENGINE CLASS ===
  class PencodeEngine {
    /**
     * Convert pencode markup to HTML
     * @param {string} text - Pencode text to convert
     * @returns {string} HTML output
     */
    toHtml(text) {
      if (!text) return "";
      
      // Apply basic tag replacements (except [*] which is handled separately)
      let result = text.replace(PENCODE_REGEX, m => PENCODE_MAP[m]);
      
      // Apply special pattern replacements
      SPECIAL_PATTERNS.forEach(({ regex, replace }) => {
        result = result.replace(regex, replace);
      });
      
      // Process list items with proper wrapping
      result = processListItems(result);
      
      return result;
    }

    /**
     * Apply dynamic placeholder replacements to text
     * @param {string} text - Source text
     * @param {Object} dynamics - Object with placeholder keys and values
     * @param {boolean} forHtml - Whether to wrap values in HTML spans
     * @returns {string} Text with replacements applied
     */
    applyDynamics(text, dynamics, forHtml = false) {
      let result = text;
      
      Object.entries(dynamics).forEach(([placeholder, value]) => {
        const regex = new RegExp(utils.escapeRegex(placeholder), "g");
        
        if (forHtml) {
          const htmlValue = value
            ? `<span class="understood">${value}</span>`
            : '<span class="paper_field"></span>';
          result = result.replace(regex, htmlValue);
        } else {
          result = result.replace(regex, value);
        }
      });
      
      return result;
    }

    /**
     * Replace field placeholders with actual field elements
     * @param {string} text - Source text (raw or html)
     * @param {Array} fields - Array of field objects sorted by position
     * @param {Object} options - Options for replacement
     * @param {boolean} options.forHtml - Generate HTML field elements
     * @param {boolean} options.keepPlaceholderIfEmpty - When true (raw output), keep [field]/[jobs] visible when value is empty
     * @returns {string} Text with field replacements
     */
    applyFieldReplacements(text, fields, { forHtml = false, keepPlaceholderIfEmpty = false } = {}) {
      let result = text;
      
      fields.forEach((field, idx) => {
        const placeholder = field.type === "job" ? "[jobs]" : "[field]";
        const value = field.value || "";
        const index = result.indexOf(placeholder);
        
        if (index === -1) return;
        
        let replacement;
        if (forHtml) {
          if (field.type === "job") {
            replacement = `<button class="job-button ${value ? "filled" : "empty"}" data-field-id="${field.id}" data-field-index="${idx}" data-field-type="job" data-placeholder="${field.placeholder}" type="button">${value || "Click to Select Assignment"}</button>`;
          } else {
            replacement = `<span class="paper_field" data-field-id="${field.id}" data-field-index="${idx}" data-field-type="${field.type}" data-placeholder="${field.placeholder}" spellcheck="false">${value}</span>`;
          }
        } else {
          replacement = (keepPlaceholderIfEmpty && !value) ? placeholder : value;
        }
        
        result = result.slice(0, index) + replacement + result.slice(index + placeholder.length);
      });
      
      return result;
    }

    /**
     * Get the static PENCODE_MAP for reference
     */
    static get MAP() {
      return PENCODE_MAP;
    }
  }

  // === EXPORT TO GLOBAL SCOPE ===
  window.SCC_PENCODE = {
    PencodeEngine,
    PENCODE_MAP,
  };
})();
