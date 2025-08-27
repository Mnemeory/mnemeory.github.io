/**
 * Neural Pencode Rendering Engine - Nralakk Federation Interface
 *
 * Advanced pencode processing with theme integration, validation,
 * and extensible markup features. Integrates with the main website's
 * neural design system and glow effects.
 */

import { SITE_CONFIG } from "../config.js";

/**
 * Pencode Processing Engine with Neural Theme Integration
 */
export class PencodeRenderEngine {
  constructor() {
    this.tagRegistry = this.initializeTagRegistry();
    this.themeStyles = this.initializeThemeStyles();
    this.cache = new Map();
  }

  /**
   * Initialize tag registry with neural-themed processors
   */
  initializeTagRegistry() {
    return {
      // Basic formatting tags
      'b': {
        tag: 'strong',
        class: 'neural-bold',
        processor: null
      },
      'i': {
        tag: 'em',
        class: 'neural-italic',
        processor: null
      },
      'u': {
        tag: 'u',
        class: 'neural-underline',
        processor: null
      },

      // Heading tags with neural styling
      'h1': {
        tag: 'h1',
        class: 'neural-heading neural-heading--primary',
        processor: null
      },
      'h2': {
        tag: 'h2',
        class: 'neural-heading neural-heading--secondary',
        processor: null
      },
      'h3': {
        tag: 'h3',
        class: 'neural-heading neural-heading--tertiary',
        processor: null
      },

      // Size modifiers
      'small': {
        tag: 'span',
        class: 'neural-text-small',
        processor: null,
        htmlTag: 'font',
        htmlAttrs: 'size="1"'
      },
      'large': {
        tag: 'span',
        class: 'neural-text-large',
        processor: null,
        htmlTag: 'font',
        htmlAttrs: 'size="4"'
      },

      // Layout tags
      'center': {
        tag: 'div',
        class: 'neural-center',
        processor: null
      },
      'list': {
        tag: 'ul',
        class: 'neural-list',
        processor: null
      },

      // Table tags
      'table': {
        tag: 'table',
        class: 'neural-table',
        processor: null,
        htmlTag: 'table',
        htmlAttrs: 'border="1" cellspacing="0" cellpadding="3" style="border: 1px solid black;"'
      },
      'grid': {
        tag: 'table',
        class: 'neural-grid',
        processor: null
      },
      'row': {
        tag: 'tr',
        class: 'neural-row',
        standalone: true,
        processor: this.processRowTag.bind(this)
      },
      'cell': {
        tag: 'td',
        class: 'neural-cell',
        standalone: true,
        processor: null
      },

      // Special content tags
      'field': {
        tag: 'span',
        class: 'neural-field paper_field',
        processor: this.processFieldTag.bind(this)
      },
      'station': {
        tag: 'span',
        class: 'neural-station',
        standalone: true,
        processor: this.processStationTag.bind(this)
      },
      'redacted': {
        tag: 'span',
        class: 'neural-redacted redacted',
        processor: this.processRedactedTag.bind(this)
      },
      'time': {
        tag: 'span',
        class: 'neural-time',
        standalone: true,
        processor: this.processTimeTag.bind(this)
      },
      'date': {
        tag: 'span',
        class: 'neural-date',
        standalone: true,
        processor: this.processDateTag.bind(this)
      },
      'barcode': {
        tag: 'img',
        class: 'neural-barcode',
        standalone: true,
        processor: this.processBarcodeTag.bind(this)
      },
      'editorbr': {
        tag: 'br',
        standalone: true,
        processor: null
      },

      // Logo tags
      'logo_scc': {
        tag: 'img',
        class: 'neural-logo neural-logo--scc',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_scc_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--scc neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_nt': {
        tag: 'img',
        class: 'neural-logo neural-logo--nt',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_nt_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--nt neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_zh': {
        tag: 'img',
        class: 'neural-logo neural-logo--zh',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_zh_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--zh neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_idris': {
        tag: 'img',
        class: 'neural-logo neural-logo--idris',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_idris_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--idris neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_eridani': {
        tag: 'img',
        class: 'neural-logo neural-logo--eridani',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_eridani_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--eridani neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_zavod': {
        tag: 'img',
        class: 'neural-logo neural-logo--zavod',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_zavod_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--zavod neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_hp_large': {
        tag: 'img',
        class: 'neural-logo neural-logo--hp neural-logo--large',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_hp': {
        tag: 'img',
        class: 'neural-logo neural-logo--hp',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_hp_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--hp neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_orion': {
        tag: 'img',
        class: 'neural-logo neural-logo--orion',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_orion_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--orion neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_pmcg': {
        tag: 'img',
        class: 'neural-logo neural-logo--pmcg',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_pmcg_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--pmcg neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_golden': {
        tag: 'img',
        class: 'neural-logo neural-logo--golden',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_golden_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--golden neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_pvpolice': {
        tag: 'img',
        class: 'neural-logo neural-logo--pvpolice',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },
      'logo_pvpolice_small': {
        tag: 'img',
        class: 'neural-logo neural-logo--pvpolice neural-logo--small',
        standalone: true,
        processor: this.processLogoTag.bind(this)
      },

      // Flag tags
      'flag_be': {
        tag: 'img',
        class: 'neural-flag neural-flag--be',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_be_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--be neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_elyra': {
        tag: 'img',
        class: 'neural-flag neural-flag--elyra',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_elyra_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--elyra neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_sol': {
        tag: 'img',
        class: 'neural-flag neural-flag--sol',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_sol_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--sol neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_coc': {
        tag: 'img',
        class: 'neural-flag neural-flag--coc',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_coc_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--coc neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_dom': {
        tag: 'img',
        class: 'neural-flag neural-flag--dom',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_dom_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--dom neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_nralakk': {
        tag: 'img',
        class: 'neural-flag neural-flag--nralakk',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_nralakk_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--nralakk neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_pra': {
        tag: 'img',
        class: 'neural-flag neural-flag--pra',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_pra_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--pra neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_dpra': {
        tag: 'img',
        class: 'neural-flag neural-flag--dpra',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_dpra_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--dpra neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_nka': {
        tag: 'img',
        class: 'neural-flag neural-flag--nka',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_nka_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--nka neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_izweski': {
        tag: 'img',
        class: 'neural-flag neural-flag--izweski',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },
      'flag_izweski_small': {
        tag: 'img',
        class: 'neural-flag neural-flag--izweski neural-flag--small',
        standalone: true,
        processor: this.processFlagTag.bind(this)
      },

      // Standalone tags
      'br': {
        tag: 'br',
        standalone: true,
        processor: null
      },
      'hr': {
        tag: 'hr',
        class: 'neural-divider',
        standalone: true,
        processor: null
      },
      '*': {
        tag: 'li',
        class: 'neural-list-item',
        standalone: true,
        processor: null
      }
    };
  }

  /**
   * Initialize theme-specific styling configurations
   */
  initializeThemeStyles() {
    return {
      neural: {
        containerClass: 'neural-document',
        contentClass: 'neural-content',
        editModeClass: 'neural-edit-mode'
      },
      diplomatic: {
        containerClass: 'diplomatic-document',
        contentClass: 'diplomatic-content',
        editModeClass: 'diplomatic-edit-mode'
      },
      federation: {
        containerClass: 'federation-document',
        contentClass: 'federation-content',
        editModeClass: 'federation-edit-mode'
      }
    };
  }

  /**
   * Main render method - convert pencode to themed HTML
   */
  render(rawText, options = {}) {
    if (!rawText) return '';

    const {
      showTags = false,
      theme = 'neural',
      fileName = null,
      enableStamps = false
    } = options;

    try {
      // Cache key
      const cacheKey = `${rawText}:${showTags}:${theme}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Process pencode
      let html = this.processPencode(rawText, { showTags, theme });

      // Wrap in themed container
      html = this.wrapInContainer(html, theme, showTags);

      // Add stamps if enabled
      if (enableStamps && fileName) {
        html = this.addDocumentStamp(html, fileName);
      }

      // Cache result
      this.cache.set(cacheKey, html);

      return html;
    } catch (error) {
      console.error('Pencode render error:', error);
      return this.renderError(error, rawText);
    }
  }

  /**
   * Process pencode markup to HTML
   */
  processPencode(text, options) {
    const { showTags, theme } = options;

    // In edit mode, return the raw pencode with minimal processing
    if (showTags) {
      return this.processEditMode(text);
    }

    // Process special patterns first
    text = this.processSpecialPatterns(text);

    // Process paired tags
    text = this.processPairedTags(text);

    // Process standalone tags
    text = this.processStandaloneTags(text);

    // Convert line breaks
    text = text.replace(/\n/g, '<br>');

    // Post-process for theme-specific enhancements
    text = this.applyThemeEnhancements(text, theme);

    return text;
  }

  /**
   * Process text for edit mode - show raw pencode
   */
  processEditMode(text) {
    // In edit mode, we want to show the actual pencode tags
    // Just escape HTML and preserve line breaks
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>');
  }

  /**
   * Process special patterns like redacted text and images
   */
  processSpecialPatterns(text) {
    // Process redacted text pattern
    text = this.processRedactedTag(text, 'redacted', { class: 'neural-redacted redacted' });

    // Process image tags with dynamic IDs
    const imageRegex = /\[image id=([\w]*?\.[\w]*?)\]/gi;
    text = text.replace(imageRegex, (match, filename) => {
      const imageHost = SITE_CONFIG.docsImageHost || `${SITE_CONFIG.assets.directories.images}documents/`;
      return `<img src="${imageHost}${filename}" alt="Document Image" class="neural-document-image">`;
    });

    return text;
  }



  /**
   * Process paired tags (opening and closing)
   */
  processPairedTags(text) {
    const pairedTags = ['b', 'i', 'u', 'h1', 'h2', 'h3', 'center', 'list', 'small', 'large', 'table', 'grid'];

    pairedTags.forEach(tagName => {
      const config = this.tagRegistry[tagName];
      if (!config) return;

      const openRegex = new RegExp(`\\[${tagName}\\]`, 'gi');
      const closeRegex = new RegExp(`\\[\\/${tagName}\\]`, 'gi');
      const classAttr = config.class ? ` class="${config.class}"` : '';

      // Handle special HTML attributes for certain tags
      let htmlAttrs = '';
      if (config.htmlAttrs) {
        htmlAttrs = ` ${config.htmlAttrs}`;
      }

      // Handle special table closing tags
      if (tagName === 'table') {
        text = text
          .replace(openRegex, `<${config.tag}${htmlAttrs}${classAttr}>`)
          .replace(closeRegex, `</td></tr></${config.tag}>`);
      } else if (tagName === 'grid') {
        text = text
          .replace(openRegex, `<${config.tag}${classAttr}>`)
          .replace(closeRegex, `</td></tr></${config.tag}>`);
      } else {
        text = text
          .replace(openRegex, `<${config.tag}${htmlAttrs}${classAttr}>`)
          .replace(closeRegex, `</${config.tag}>`);
      }
    });

    return text;
  }

  /**
   * Process standalone tags
   */
  processStandaloneTags(text) {
    // Basic standalone tags
    const basicStandaloneTags = ['br', 'hr', '*', 'field', 'station', 'time', 'date', 'barcode', 'editorbr', 'row', 'cell'];

    // All flag tags
    const flagTags = [
      'flag_be', 'flag_be_small', 'flag_elyra', 'flag_elyra_small', 'flag_sol', 'flag_sol_small',
      'flag_coc', 'flag_coc_small', 'flag_dom', 'flag_dom_small', 'flag_nralakk', 'flag_nralakk_small',
      'flag_pra', 'flag_pra_small', 'flag_dpra', 'flag_dpra_small', 'flag_nka', 'flag_nka_small',
      'flag_izweski', 'flag_izweski_small'
    ];

    // All logo tags
    const logoTags = [
      'logo_scc', 'logo_scc_small', 'logo_nt', 'logo_nt_small', 'logo_zh', 'logo_zh_small',
      'logo_idris', 'logo_idris_small', 'logo_eridani', 'logo_eridani_small', 'logo_zavod', 'logo_zavod_small',
      'logo_hp_large', 'logo_hp', 'logo_hp_small', 'logo_orion', 'logo_orion_small', 'logo_pmcg', 'logo_pmcg_small',
      'logo_golden', 'logo_golden_small', 'logo_pvpolice', 'logo_pvpolice_small'
    ];

    // Combine all standalone tags
    const allStandaloneTags = [...basicStandaloneTags, ...flagTags, ...logoTags];

    allStandaloneTags.forEach(tagName => {
      const config = this.tagRegistry[tagName];
      if (!config) return;

      if (config.processor) {
        text = config.processor(text, tagName, config);
      } else {
        const regex = new RegExp(`\\[${tagName.replace('*', '\\*')}\\]`, 'gi');
        const classAttr = config.class ? ` class="${config.class}"` : '';

        if (config.tag === 'br' || config.tag === 'hr') {
          text = text.replace(regex, `<${config.tag}${classAttr}>`);
        } else {
          text = text.replace(regex, `<${config.tag}${classAttr}></${config.tag}>`);
        }
      }
    });

    return text;
  }

  /**
   * Process field tags
   */
  processFieldTag(text, tagName, config) {
    const regex = /\[field\]/gi;
    return text.replace(regex, `<span class="${config.class}">__________</span>`);
  }

  /**
   * Process flag tags
   */
  processFlagTag(text, tagName, config) {
    const flagMappings = {
      'flag_nralakk_small': { file: 'tree.svg', alt: 'Nralakk Federation Flag (Small)' },
      'flag_nralakk': { file: 'tree.svg', alt: 'Nralakk Federation Flag' },
      'flag_be': { file: 'beflag.png', alt: 'Biesel Flag' },
      'flag_be_small': { file: 'beflag_small.png', alt: 'Biesel Flag (Small)' },
      'flag_elyra': { file: 'elyraflag.png', alt: 'Elyra Flag' },
      'flag_elyra_small': { file: 'elyraflag_small.png', alt: 'Elyra Flag (Small)' },
      'flag_sol': { file: 'solflag.png', alt: 'Sol Alliance Flag' },
      'flag_sol_small': { file: 'solflag_small.png', alt: 'Sol Alliance Flag (Small)' },
      'flag_coc': { file: 'cocflag.png', alt: 'Coalition of Colonies Flag' },
      'flag_coc_small': { file: 'cocflag_small.png', alt: 'Coalition of Colonies Flag (Small)' },
      'flag_dom': { file: 'domflag.png', alt: 'Dominian Flag' },
      'flag_dom_small': { file: 'domflag_small.png', alt: 'Dominian Flag (Small)' },
      'flag_pra': { file: 'praflag.png', alt: 'PRA Flag' },
      'flag_pra_small': { file: 'praflag_small.png', alt: 'PRA Flag (Small)' },
      'flag_dpra': { file: 'dpraflag.png', alt: 'DPRA Flag' },
      'flag_dpra_small': { file: 'dpraflag_small.png', alt: 'DPRA Flag (Small)' },
      'flag_nka': { file: 'nkaflag.png', alt: 'NKA Flag' },
      'flag_nka_small': { file: 'nkaflag_small.png', alt: 'NKA Flag (Small)' },
      'flag_izweski': { file: 'izweskiflag.png', alt: 'Izweski Flag' },
      'flag_izweski_small': { file: 'izweskiflag_small.png', alt: 'Izweski Flag (Small)' }
    };

    const regex = new RegExp(`\\[${tagName}\\]`, 'gi');
    const flagInfo = flagMappings[tagName];

    if (!flagInfo) {
      return text.replace(regex, `<span class="error">[Unknown flag: ${tagName}]</span>`);
    }

        // Use existing asset or fallback to placeholder
    const flagPath = SITE_CONFIG.assets?.images?.[flagInfo.file.replace('.png', '').replace('.svg', '')] ||
                    `${SITE_CONFIG.assets.directories.images}flags/${flagInfo.file}`;

    return text.replace(regex,
      `<img src="${flagPath}" alt="${flagInfo.alt}" class="${config.class}" aria-hidden="true">`
    );
  }

  /**
   * Process logo tags
   */
  processLogoTag(text, tagName, config) {
    const logoMappings = {
      'logo_scc': { file: 'scclogo.png', alt: 'SCC Logo' },
      'logo_scc_small': { file: 'scclogo_small.png', alt: 'SCC Logo (Small)' },
      'logo_nt': { file: 'nanotrasenlogo.png', alt: 'NanoTrasen Logo' },
      'logo_nt_small': { file: 'nanotrasenlogo_small.png', alt: 'NanoTrasen Logo (Small)' },
      'logo_zh': { file: 'zhlogo.png', alt: 'Zavodskoi Interstellar Logo' },
      'logo_zh_small': { file: 'zhlogo_small.png', alt: 'Zavodskoi Interstellar Logo (Small)' },
      'logo_idris': { file: 'idrislogo.png', alt: 'Idris Incorporated Logo' },
      'logo_idris_small': { file: 'idrislogo_small.png', alt: 'Idris Incorporated Logo (Small)' },
      'logo_eridani': { file: 'eridanilogo.png', alt: 'Eridani Corporate Federation Logo' },
      'logo_eridani_small': { file: 'eridanilogo_small.png', alt: 'Eridani Corporate Federation Logo (Small)' },
      'logo_zavod': { file: 'zavodlogo.png', alt: 'Zavod Logo' },
      'logo_zavod_small': { file: 'zavodlogo_small.png', alt: 'Zavod Logo (Small)' },
      'logo_hp_large': { file: 'hplogolarge.png', alt: 'Hephaestus Industries Logo (Large)' },
      'logo_hp': { file: 'hplogo.png', alt: 'Hephaestus Industries Logo' },
      'logo_hp_small': { file: 'hplogo_small.png', alt: 'Hephaestus Industries Logo (Small)' },
      'logo_orion': { file: 'orionlogo.png', alt: 'Orion Express Logo' },
      'logo_orion_small': { file: 'orionlogo_small.png', alt: 'Orion Express Logo (Small)' },
      'logo_pmcg': { file: 'pmcglogo.png', alt: 'PMCG Logo' },
      'logo_pmcg_small': { file: 'pmcglogo_small.png', alt: 'PMCG Logo (Small)' },
      'logo_golden': { file: 'goldenlogo.png', alt: 'Golden Deep Logo' },
      'logo_golden_small': { file: 'goldenlogo_small.png', alt: 'Golden Deep Logo (Small)' },
      'logo_pvpolice': { file: 'pvpolicelogo.png', alt: 'Port Vel Police Logo' },
      'logo_pvpolice_small': { file: 'pvpolicelogo_small.png', alt: 'Port Vel Police Logo (Small)' }
    };

    const regex = new RegExp(`\\[${tagName}\\]`, 'gi');
    const logoInfo = logoMappings[tagName];

    if (!logoInfo) {
      return text.replace(regex, `<span class="error">[Unknown logo: ${tagName}]</span>`);
    }

        // Use existing asset or fallback to placeholder
    const logoPath = SITE_CONFIG.assets?.images?.[logoInfo.file.replace('.png', '')] ||
                    `${SITE_CONFIG.assets.directories.images}logos/${logoInfo.file}`;

    return text.replace(regex,
      `<img src="${logoPath}" alt="${logoInfo.alt}" class="${config.class}" aria-hidden="true">`
    );
  }

  /**
   * Process row tags for table structure
   */
  processRowTag(text, tagName, config) {
    const regex = /\[row\]/gi;
    return text.replace(regex, '</td><tr>');
  }

  /**
   * Process station tags
   */
  processStationTag(text, tagName, config) {
    const regex = /\[station\]/gi;
    const stationName = SITE_CONFIG.stationName || 'SCCV Horizon';
    return text.replace(regex, `<span class="${config.class}">${stationName}</span>`);
  }

  /**
   * Process redacted tags
   */
  processRedactedTag(text, tagName, config) {
    const regex = /\[redacted\](.*?)\[\/redacted\]/gi;
    return text.replace(regex, (match, content) => {
      const redactedContent = content.replace(/./g, '|');
      return `<span class="${config.class}">${redactedContent}</span>`;
    });
  }

  /**
   * Process time tags
   */
  processTimeTag(text, tagName, config) {
    const regex = /\[time\]/gi;
    const currentTime = new Date().toLocaleTimeString();
    return text.replace(regex, `<span class="${config.class}">${currentTime}</span>`);
  }

  /**
   * Process date tags
   */
  processDateTag(text, tagName, config) {
    const regex = /\[date\]/gi;
    const currentDate = new Date().toLocaleDateString();
    return text.replace(regex, `<span class="${config.class}">${currentDate}</span>`);
  }

  /**
   * Process barcode tags
   */
  processBarcodeTag(text, tagName, config) {
    const regex = /\[barcode\]/gi;
    const barcodeNum = Math.floor(Math.random() * 4); // 0-3 like in original code
    const barcodePath = `${SITE_CONFIG.assets.directories.images}barcodes/barcode${barcodeNum}.png`;
    return text.replace(regex,
      `<img src="${barcodePath}" alt="Barcode" class="${config.class}" aria-hidden="true">`
    );
  }

  /**
   * Apply theme-specific enhancements
   */
  applyThemeEnhancements(html, theme) {
    switch (theme) {
      case 'neural':
        return this.applyNeuralEnhancements(html);
      case 'diplomatic':
        return this.applyDiplomaticEnhancements(html);
      case 'federation':
        return this.applyFederationEnhancements(html);
      default:
        return html;
    }
  }

  /**
   * Apply neural theme enhancements
   */
  applyNeuralEnhancements(html) {
    // Add neural glow effects to headings
    html = html.replace(/<h([123])([^>]*)>/g, '<h$1$2 class="neural-heading">');

    // Enhance lists with neural indicators
    html = html.replace(/<li([^>]*)>/g, '<li$1 data-neural-marker="▸">');

    return html;
  }

  /**
   * Apply diplomatic theme enhancements
   */
  applyDiplomaticEnhancements(html) {
    // Add diplomatic authority styling
    html = html.replace(/<strong([^>]*)>/g, '<strong$1 class="neural-strong">');
    return html;
  }

  /**
   * Apply federation theme enhancements
   */
  applyFederationEnhancements(html) {
    // Add federation-specific styling
    html = html.replace(/<h1([^>]*)>/g, '<h1$1 class="neural-h1">');
    return html;
  }

  /**
   * Wrap content in themed container
   */
  wrapInContainer(html, theme, editMode) {
    const themeConfig = this.themeStyles[theme] || this.themeStyles.neural;
    const editClass = editMode ? ` ${themeConfig.editModeClass}` : '';

    return `<div class="${themeConfig.containerClass}${editClass}" data-theme="${theme}">
      <div class="${themeConfig.contentClass}">
        ${html}
      </div>
    </div>`;
  }

  /**
   * Add document stamp
   */
  addDocumentStamp(html, fileName) {
    const stampInfo = this.parseDocumentName(fileName);
    const stamp = this.generateStamp(stampInfo);

    // Insert stamp into container
    return html.replace(
      '<div class="neural-content">',
      `<div class="neural-content">${stamp}`
    );
  }

  /**
   * Generate document stamp HTML
   */
  generateStamp(stampInfo) {
    return `<div class="neural-stamp">
      <div class="stamp-header">NRALAKK FEDERATION</div>
      <div class="stamp-certification">CERTIFIED DOCUMENT</div>
      <div class="stamp-details">
        <div class="stamp-date">FILED ON: ${stampInfo.date}</div>
        <div class="stamp-round ${stampInfo.round === 'EXEC_OVR' ? 'exec-override' : ''}">${stampInfo.round}</div>
        <div class="stamp-name">Grand Council Archives • Qerrbalak</div>
      </div>
      <div class="stamp-authority">PRIMARY NUMERICAL - CONSULAR OFFICE</div>
    </div>`;
  }

  /**
   * Parse document filename for stamp information
   */
  parseDocumentName(fileName) {
    try {
      const name = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
      const parts = name.split('-');

      let date = parts[0] || 'UNKNOWN DATE';
      let roundId = parts[1] || 'N/A';
      let personName = parts[2] ? this.titleCase(parts[2]) : 'UNKNOWN';

      // Handle executive override
      if (roundId.toUpperCase() === 'EO') {
        roundId = 'EXEC_OVR';
      }

      // Format date if it's numeric
      if (date && date.length === 8 && /^\d{8}$/.test(date)) {
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        date = `${year}-${month}-${day}`;
      }

      return {
        date,
        round: roundId,
        person: personName,
        category: roundId
      };
    } catch (error) {
      console.error('Document name parsing error:', error);
      return {
        date: 'ERROR',
        round: 'N/A',
        person: 'UNKNOWN',
        category: 'ERROR'
      };
    }
  }

  /**
   * Title case utility
   */
  titleCase(str) {
    return str
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

    /**
   * Extract pencode from HTML or text content
   */
  extractPencode(htmlElement, isEditMode = false) {
    const clone = htmlElement.cloneNode(true);

    if (isEditMode) {
      // In edit mode - just get the text content and decode entities
      let pencode = clone.textContent
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      return this.normalizeWhitespace(pencode);
    }

    // In preview mode - convert HTML back to pencode
    let pencode = this.htmlToPencode(clone.innerHTML);

    // Normalize whitespace
    pencode = this.normalizeWhitespace(pencode);

    return pencode;
  }

    /**
   * Convert HTML back to pencode
   */
  htmlToPencode(html) {
    if (!html) return '';

    // First, decode HTML entities back to original characters
    html = html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Remove theme classes and attributes before processing
    html = html.replace(/\s*(class|style|data-[^=]*|aria-[^=]*|alt|src)="[^"]*"/gi, '');

    // Convert basic formatting tags
    html = html
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '[b]$1[/b]')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '[i]$1[/i]')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '[u]$1[/u]')

      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '[h1]$1[/h1]')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '[h2]$1[/h2]')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '[h3]$1[/h3]')

      // Size modifiers - check for specific classes first
      .replace(/<font[^>]*size\s*=\s*["']?1["']?[^>]*>(.*?)<\/font>/gi, '[small]$1[/small]')
      .replace(/<font[^>]*size\s*=\s*["']?4["']?[^>]*>(.*?)<\/font>/gi, '[large]$1[/large]')
      .replace(/<small[^>]*>(.*?)<\/small>/gi, '[small]$1[/small]')

      // Layout tags
      .replace(/<center[^>]*>(.*?)<\/center>/gi, '[center]$1[/center]')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '[list]$1[/list]')

      // Table tags - handle in correct order
      .replace(/<table[^>]*border[^>]*>(.*?)<\/td><\/tr><\/table>/gi, '[table]$1[/table]')
      .replace(/<table[^>]*>(.*?)<\/td><\/tr><\/table>/gi, '[grid]$1[/grid]')
      .replace(/<\/td><tr[^>]*>/gi, '[row]')
      .replace(/<td[^>]*>/gi, '[cell]')
      .replace(/<\/td>/gi, '')
      .replace(/<\/tr>/gi, '')

      // List items
      .replace(/<li[^>]*>/gi, '[*]')
      .replace(/<\/li>/gi, '')

      // Line breaks and dividers
      .replace(/<hr[^>]*>/gi, '[hr]')
      .replace(/<br\s*\/?>/gi, '\n')

      // Special span tags
      .replace(/<span[^>]*>(.*?)<\/span>/gi, (match, content) => {
        // Check original match for class hints
        const originalMatch = match;
        if (originalMatch.includes('neural-text-large') || originalMatch.includes('font') && originalMatch.includes('4')) {
          return `[large]${content}[/large]`;
        }
        if (originalMatch.includes('neural-field') || originalMatch.includes('paper_field') || content.trim() === '__________') {
          return '[field]';
        }
        if (originalMatch.includes('neural-station')) return '[station]';
        if (originalMatch.includes('neural-time')) return '[time]';
        if (originalMatch.includes('neural-date')) return '[date]';
        if (originalMatch.includes('neural-redacted') || originalMatch.includes('redacted')) {
          return `[redacted]${content}[/redacted]`;
        }
        return content;
      })

      // Div tags
      .replace(/<div[^>]*>(.*?)<\/div>/gi, (match, content) => {
        if (match.includes('neural-center')) return `[center]${content}[/center]`;
        if (match.includes('neural-document') || match.includes('neural-content')) return content;
        return content;
      })

      // Images - convert back to appropriate pencode tags
      .replace(/<img[^>]*>/gi, (match) => {
        // Flag detection
        if (match.includes('neural-flag')) {
          if (match.includes('--nralakk')) return match.includes('--small') ? '[flag_nralakk_small]' : '[flag_nralakk]';
          if (match.includes('--be')) return match.includes('--small') ? '[flag_be_small]' : '[flag_be]';
          if (match.includes('--elyra')) return match.includes('--small') ? '[flag_elyra_small]' : '[flag_elyra]';
          if (match.includes('--sol')) return match.includes('--small') ? '[flag_sol_small]' : '[flag_sol]';
          if (match.includes('--coc')) return match.includes('--small') ? '[flag_coc_small]' : '[flag_coc]';
          if (match.includes('--dom')) return match.includes('--small') ? '[flag_dom_small]' : '[flag_dom]';
          if (match.includes('--pra') && !match.includes('dpra')) return match.includes('--small') ? '[flag_pra_small]' : '[flag_pra]';
          if (match.includes('--dpra')) return match.includes('--small') ? '[flag_dpra_small]' : '[flag_dpra]';
          if (match.includes('--nka')) return match.includes('--small') ? '[flag_nka_small]' : '[flag_nka]';
          if (match.includes('--izweski')) return match.includes('--small') ? '[flag_izweski_small]' : '[flag_izweski]';
        }

        // Logo detection
        if (match.includes('neural-logo')) {
          if (match.includes('--scc')) return match.includes('--small') ? '[logo_scc_small]' : '[logo_scc]';
          if (match.includes('--nt')) return match.includes('--small') ? '[logo_nt_small]' : '[logo_nt]';
          if (match.includes('--zh')) return match.includes('--small') ? '[logo_zh_small]' : '[logo_zh]';
          if (match.includes('--idris')) return match.includes('--small') ? '[logo_idris_small]' : '[logo_idris]';
          if (match.includes('--eridani')) return match.includes('--small') ? '[logo_eridani_small]' : '[logo_eridani]';
          if (match.includes('--zavod')) return match.includes('--small') ? '[logo_zavod_small]' : '[logo_zavod]';
          if (match.includes('--hp')) {
            if (match.includes('--large')) return '[logo_hp_large]';
            return match.includes('--small') ? '[logo_hp_small]' : '[logo_hp]';
          }
          if (match.includes('--orion')) return match.includes('--small') ? '[logo_orion_small]' : '[logo_orion]';
          if (match.includes('--pmcg')) return match.includes('--small') ? '[logo_pmcg_small]' : '[logo_pmcg]';
          if (match.includes('--golden')) return match.includes('--small') ? '[logo_golden_small]' : '[logo_golden]';
          if (match.includes('--pvpolice')) return match.includes('--small') ? '[logo_pvpolice_small]' : '[logo_pvpolice]';
        }

        if (match.includes('neural-barcode')) return '[barcode]';

        if (match.includes('neural-document-image')) {
          // Try to extract filename from src
          const srcMatch = match.match(/src="[^"]*\/([^"\/]+)"/);
          if (srcMatch) {
            return `[image id=${srcMatch[1]}]`;
          }
        }

        return '';
      })

      // Clean up remaining HTML and normalize whitespace
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();

    return html;
  }

  /**
   * Normalize whitespace
   */
  normalizeWhitespace(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n\n+/g, '\n\n')
      .replace(/[ ]{3,}/g, '  ')
      .replace(/^[ \t]+/gm, '')
      .replace(/[ \t]+$/gm, '')
      .replace(/\t+/g, '  ');
  }

  /**
   * Sanitize text input
   */
  sanitizeText(text) {
    // Basic text sanitization
    return text
      .replace(/[<>&]/g, char => {
        const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
        return map[char];
      })
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  /**
   * Render error state
   */
  renderError(error, originalText) {
    return `<div class="neural-document error-state">
      <div class="neural-content">
        <h1 class="neural-heading neural-heading--primary">⚠️ NEURAL RENDERING ERROR</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Original Text:</strong></p>
        <pre class="neural-error-container">${originalText}</pre>
      </div>
    </div>`;
  }

  /**
   * Clear render cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Document Validator - Validates pencode syntax and structure
 */
export class DocumentValidator {
  constructor() {
    this.rules = this.initializeValidationRules();
  }

  /**
   * Initialize validation rules
   */
  initializeValidationRules() {
    // Paired tags that require opening and closing
    const pairedTags = ['b', 'i', 'u', 'h1', 'h2', 'h3', 'center', 'list', 'small', 'large', 'table', 'grid', 'redacted'];

    // All standalone tags
    const standaloneTags = [
      'br', 'hr', '*', 'field', 'station', 'time', 'date', 'barcode', 'editorbr', 'row', 'cell',
      // Flag tags
      'flag_be', 'flag_be_small', 'flag_elyra', 'flag_elyra_small', 'flag_sol', 'flag_sol_small',
      'flag_coc', 'flag_coc_small', 'flag_dom', 'flag_dom_small', 'flag_nralakk', 'flag_nralakk_small',
      'flag_pra', 'flag_pra_small', 'flag_dpra', 'flag_dpra_small', 'flag_nka', 'flag_nka_small',
      'flag_izweski', 'flag_izweski_small',
      // Logo tags
      'logo_scc', 'logo_scc_small', 'logo_nt', 'logo_nt_small', 'logo_zh', 'logo_zh_small',
      'logo_idris', 'logo_idris_small', 'logo_eridani', 'logo_eridani_small', 'logo_zavod', 'logo_zavod_small',
      'logo_hp_large', 'logo_hp', 'logo_hp_small', 'logo_orion', 'logo_orion_small', 'logo_pmcg', 'logo_pmcg_small',
      'logo_golden', 'logo_golden_small', 'logo_pvpolice', 'logo_pvpolice_small'
    ];

    return {
      balancedTags: {
        pairedTags: pairedTags,
        severity: 'error'
      },
      validTags: {
        allowedTags: [...pairedTags, ...standaloneTags],
        severity: 'warning'
      },
      fieldPlacement: {
        severity: 'info'
      },
      imagePatterns: {
        severity: 'info'
      }
    };
  }

  /**
   * Validate pencode content
   */
  validate(content) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      info: []
    };

    if (!content) {
      return result;
    }

    // Check balanced tags
    this.validateBalancedTags(content, result);

    // Check valid tags
    this.validateTagSyntax(content, result);

    // Check field placement
    this.validateFieldPlacement(content, result);

    // Determine overall validity
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Validate balanced paired tags
   */
  validateBalancedTags(content, result) {
    const openTags = [];
    const { pairedTags } = this.rules.balancedTags;

    const tagRegex = /\[(\/?)([^\]]+)\]/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();

      if (pairedTags.includes(tagName)) {
        if (isClosing) {
          if (openTags.length === 0 || openTags.pop() !== tagName) {
            result.errors.push(`Unmatched closing tag: [/${tagName}]`);
          }
        } else {
          openTags.push(tagName);
        }
      }
    }

    // Check for unclosed tags
    openTags.forEach(tag => {
      result.errors.push(`Unclosed tag: [${tag}]`);
    });
  }

  /**
   * Validate tag syntax
   */
  validateTagSyntax(content, result) {
    const { allowedTags } = this.rules.validTags;
    const tagRegex = /\[(\/?[^\]]+)\]/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const fullTag = match[1];
      const tagName = fullTag.replace('/', '').toLowerCase();

      if (!allowedTags.includes(tagName)) {
        result.warnings.push(`Unknown tag: [${match[1]}]`);
      }
    }
  }

  /**
   * Validate field placement
   */
  validateFieldPlacement(content, result) {
    const fieldCount = (content.match(/\[field\]/g) || []).length;
    if (fieldCount > 10) {
      result.info.push(`Document contains ${fieldCount} fields - consider breaking into sections`);
    }
  }
}
