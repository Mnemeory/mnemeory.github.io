/**
 * Unified Template Engine - Nralakk Federation Neural Interface
 *
 * Centralized template management system with inheritance, caching,
 * and validation. Eliminates template duplication and provides
 * maintainable template architecture.
 * 
 * Standardized version with CSS-driven styling
 */


/**
 * Template Component Registry - Reusable template building blocks
 */
const TEMPLATE_COMPONENTS = {
  headers: {
    neural: `[center][flag_nralakk_small]
[h1]{{title}}[/h1]
{{subtitle}}[/center]`,

    diplomatic: `[center][flag_nralakk_small]
[h1]{{title}}[/h1]
[b]{{department}}[/b]
[b]Location:[/b] {{location}}[/center]`,

    classified: `[center][flag_nralakk_small]
[h1]{{title}}[/h1]
[b]{{classification}}[/b][/center]`,

    simple: `[h1]{{title}}[/h1]`
  },

  metadata: {
    standard: `[b]Document ID:[/b] {{documentId}}
[b]Date:[/b] {{date}}
[b]Classification:[/b] {{classification}}
[b]Authority:[/b] {{authority}}`,

    citizen: `[b]Citizen ID:[/b] {{citizenId}}
[b]Full Name:[/b] {{fullName}}
[b]SCI Rating:[/b] {{sciScore}}/10.00
[b]Status:[/b] {{citizenStatus}}`,

    session: `[b]Session ID:[/b] {{sessionId}}
[b]Round Number:[/b] {{roundNumber}}
[b]Start Time:[/b] {{sessionStart}}
[b]Report Generated:[/b] {{reportDate}}`
  },

  sections: {
    divider: `[hr]`,

    purpose: `[h2]Purpose[/h2]
{{content}}`,

    background: `[h2]Background[/h2]
{{content}}`,

    summary: `[h2]Executive Summary[/h2]
{{content}}`,

    recommendations: `[h2]Recommendations[/h2]
[list]
{{items}}
[/list]`,

    notes: `[h2]Administrative Notes[/h2]
{{content}}`,

    activity: `[h2]{{title}}[/h2]
{{entries}}`
  },

  footers: {
    neural: `[center][small]{{source}}
{{authority}} • {{location}}
"{{motto}}"[/small][/center]`,

    classified: `[center][b]⚠️ {{securityLevel}}[/b]
{{securityNotice}}[/center]`,

    diplomatic: `[center][small]{{documentType}} • {{status}}[/small][/center]`,

    generated: `[center][small]Generated via {{system}}
{{timestamp}} • {{operator}}[/small][/center]`
  },

  fields: {
    input: `[b]{{label}}:[/b] [field]`,
    filled: `[b]{{label}}:[/b] {{value}}`,
    list: `• {{label}}: {{value}}`
  }
};

/**
 * Template Configurations - Define templates using component system
 */
const TEMPLATE_CONFIGS = {
  // Quick-insert templates for document creation
  quickInsert: {
    memo: {
      structure: [
        {
          component: 'headers',
          type: 'diplomatic',
          data: {
            title: 'NRALAKK FEDERATION DIPLOMATIC MEMORANDUM',
            department: 'SCCV Horizon Diplomatic Mission',
            location: '{{location}}'
          }
        },
        { component: 'sections', type: 'divider' },
        '[b]To:[/b] [field]\n[b]From:[/b] Consular Officer (Ambassador Plenipotentiary)\n[b]Date:[/b] {{currentDate}}\n[b]Subject:[/b] [field]',
        { component: 'sections', type: 'purpose', data: { content: '[field]' } },
        { component: 'sections', type: 'background', data: { content: '[field]' } },
        { component: 'sections', type: 'recommendations', data: { items: '[*] [field]\n[*] [field]\n[*] [field]' } },
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'neural',
          data: {
            source: 'Federation Diplomatic Mission',
            authority: 'Consular Officer Authority',
            location: 'SCCV Horizon',
            motto: 'In the light of distant stars'
          }
        }
      ]
    },

    report: {
      structure: [
        {
          component: 'headers',
          type: 'neural',
          data: {
            title: 'FEDERATION DIPLOMATIC MISSION REPORT',
            subtitle: '[b]Social Compatibility Index Analysis[/b]'
          }
        },
        { component: 'sections', type: 'divider' },
        '[b]Report ID:[/b] {{reportId}}\n[b]Mission Date:[/b] {{currentDate}}\n[b]Prepared By:[/b] [field]\n[b]Subject:[/b] [field]',
        { component: 'sections', type: 'summary', data: { content: '[field]' } },
        { component: 'sections', type: 'recommendations', data: { items: '[*] [field]\n[*] [field]\n[*] [field]' } },
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'neural',
          data: {
            source: 'Nralakk Federation Diplomatic Mission',
            authority: 'Mission Analysis Division',
            location: 'SCCV Horizon',
            motto: 'Knowledge guides the way forward'
          }
        }
      ]
    },

    letter: {
      structure: [
        {
          component: 'headers',
          type: 'neural',
          data: {
            title: 'OFFICIAL DIPLOMATIC CORRESPONDENCE',
            subtitle: ''
          }
        },
        '[b]From:[/b] Nralakk Federation Diplomatic Mission, SCCV Horizon\n[b]To:[/b] [field]\n[b]Date:[/b] {{currentDate}}\n[b]Re:[/b] [field]',
        'Greetings,\n\n[field]\n\nWe appreciate your continued cooperation and look forward to maintaining our positive relationship.\n\nIn the light of distant stars,\n\n[field]\nConsular Officer (Ambassador Plenipotentiary)\nNralakk Federation Diplomatic Mission\nSCCV Horizon',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'diplomatic',
          data: {
            documentType: 'Official Correspondence',
            status: 'Diplomatic Protocol Active'
          }
        }
      ]
    },

    briefing: {
      structure: [
        {
          component: 'headers',
          type: 'classified',
          data: {
            title: 'DIPLOMATIC MISSION BRIEFING',
            classification: 'Classified: Consular Officer Access'
          }
        },
        { component: 'sections', type: 'divider' },
        '[b]Briefing Date:[/b] {{currentDate}}\n[b]Prepared For:[/b] [field]\n[b]Classification:[/b] [field]\n[b]Subject:[/b] [field]',
        '[h2]Situation Overview[/h2]\n[field]',
        '[h2]Key Personnel[/h2]\n[list]\n[*] [field]\n[*] [field]\n[/list]',
        '[h2]Objectives[/h2]\n[list]\n[*] [field]\n[*] [field]\n[/list]',
        '[h2]Protocols[/h2]\n[field]',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'classified',
          data: {
            securityLevel: 'Restricted Access',
            securityNotice: 'Distribution limited to authorized personnel'
          }
        }
      ]
    }
  },

  // Document templates for different constellations
  federation: {
    standard: {
      structure: [
        {
          component: 'headers',
          type: 'diplomatic',
          data: {
            title: 'FEDERATION DIPLOMATIC MISSION DOCUMENT',
            department: 'Transmitted via Nlom Interface',
            location: '{{location}}'
          }
        },
        { component: 'sections', type: 'divider' },
        {
          component: 'metadata',
          type: 'standard',
          data: {
            documentId: '{{documentId}}',
            date: '{{date}}',
            classification: '{{classification}}',
            authority: '{{authority}}'
          }
        },
        '[b]Constellation Source:[/b] {{constellation}}',
        '[h2]Document Content[/h2]\n{{content}}',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'generated',
          data: {
            system: 'Federation Diplomatic Mission Nlom Interface',
            timestamp: '{{date}}',
            operator: '{{authority}}'
          }
        }
      ]
    },

    citizenReport: {
      structure: [
        {
          component: 'headers',
          type: 'diplomatic',
          data: {
            title: 'FEDERATION DIPLOMATIC MISSION CITIZEN SERVICES REPORT',
            department: 'Social Compatibility Index Monitoring Session',
            location: '{{location}}'
          }
        },
        { component: 'sections', type: 'divider' },
        {
          component: 'metadata',
          type: 'session',
          data: {
            sessionId: '{{sessionId}}',
            roundNumber: '{{roundNumber}}',
            sessionStart: '{{sessionStart}}',
            reportDate: '{{reportDate}}'
          }
        },
        '[b]Total Citizens Processed:[/b] {{citizenCount}}\n[b]Total Log Entries:[/b] {{logCount}}',
        '{{citizenSummary}}',
        '{{activityLog}}',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'neural',
          data: {
            source: 'Federation Diplomatic Mission Citizen Services System',
            authority: 'Consular Officer Staff Report',
            location: '{{location}}',
            motto: '{{motto}}'
          }
        }
      ]
    },

    individualCitizen: {
      structure: [
        {
          component: 'headers',
          type: 'diplomatic',
          data: {
            title: 'FEDERATION DIPLOMATIC MISSION CITIZEN RECORD',
            department: 'Individual Citizen Services Report',
            location: '{{location}}'
          }
        },
        { component: 'sections', type: 'divider' },
        '[h2]Citizen Information[/h2]',
        {
          component: 'metadata',
          type: 'citizen',
          data: {
            citizenId: '{{citizenId}}',
            fullName: '{{fullName}}',
            sciScore: '{{sciScore}}',
            citizenStatus: '{{citizenStatus}}'
          }
        },
        '{{additionalInfo}}',
        '{{behavioralProfile}}',
        '{{notes}}',
        '{{activityLog}}',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'neural',
          data: {
            source: 'Individual Citizen Record',
            authority: 'Consular Officer Authority',
            location: '{{location}}',
            motto: '{{motto}}'
          }
        }
      ]
    }
  },

  // Constellation-specific templates
  constellations: {
    'gnarled-tree': {
      structure: [
        {
          component: 'headers',
          type: 'neural',
          data: {
            title: 'NRALAKK FEDERATION AUTHORITY DOCUMENT',
            subtitle: ''
          }
        },
        '[b]Issued By:[/b] Grand Council of the Nralakk Federation\n[b]Authorized For:[/b] Consular Officer and Staff Personnel\n[b]Date:[/b] {{date}}\n[b]Document ID:[/b] {{documentId}}',
        '[h2]Executive Summary[/h2]\nThis document outlines the foundational protocols for Consular Officers operating aboard corporate vessels. All diplomatic staff must adhere to these guidelines when representing Federation interests aboard the SCCV Horizon and in Stellar Corporate Conglomerate space.',
        '[h2]Core Directives[/h2]\n[list]\n[*] Maintain constant Psionic Wake-network connection to the Grand Council via secure channels\n[*] Submit Inductive and Deductive Actions Reports weekly per SCI protocols\n[*] Monitor Social Compatibility Index of Federation citizens operating in corporate space\n[*] Coordinate with Diplomatic Aide and Kala Bodyguard staff\n[*] Liaise with SCCV Horizon crew and Stellar Corporate Conglomerate entities\n[*] Report any signs of synthetic intelligence activity immediately\n[*] Maintain diplomatic neutrality while aboard non-Federation vessels\n[/list]',
        { component: 'sections', type: 'divider' },
        '[center][b]Authority Seal[/b]\nSealed by the Grand Council • Qerrbalak Prime • Nralakk System[/center]'
      ]
    },

    'qu-poxii': {
      structure: [
        {
          component: 'headers',
          type: 'neural',
          data: {
            title: 'CITIZEN WELFARE MANAGEMENT PROTOCOL',
            subtitle: ''
          }
        },
        '[b]Service Type:[/b] Social Compatibility Index Management\n[b]Document ID:[/b] {{documentId}}',
        '[h2]Current Statistics[/h2]\n[b]Active Citizens Abroad:[/b] 847,329\n[b]Average SCI Rating:[/b] 7.3/10.0\n[b]Primary Numericals:[/b] 12.4% of population\n[b]Secondary Numericals:[/b] 74.2% of population\n[b]Tertiary Numericals:[/b] 13.4% of population\n[b]Stipend Distribution:[/b] 98.7% completion',
        '[h2]Recent Welfare Actions[/h2]\n[list]\n[*] Processed 234 stipend adjustments based on SCI updates\n[*] Coordinated medical support for 67 citizens with Zeng-Hu Pharmaceuticals\n[*] Facilitated 12 emergency repatriation requests from corporate space\n[*] Provided diplomatic assistance for 89 Federation citizens aboard SCC vessels\n[*] Maintained liaison protocols with SCCV Horizon command staff\n[/list]',
        { component: 'sections', type: 'divider' },
        '[center][i]Remember: Every Skrell abroad is a star in our constellation. Their welfare reflects the strength of our bonds.[/i][/center]'
      ]
    },

    'star-chanter': {
      structure: [
        {
          component: 'headers',
          type: 'neural',
          data: {
            title: 'INDUCTIVE & DEDUCTIVE ACTIONS REPORT',
            subtitle: ''
          }
        },
        '[b]Report Period:[/b] {{reportPeriod}}\n[b]Compiled By:[/b] Consular Analytics Engine\n[b]Document ID:[/b] {{documentId}}',
        '[h2]Inductive Patterns (Collective Trends)[/h2]\n[b]Emerging Trend:[/b] Increased social clustering among Skrell in Sol Alliance territories\n[b]Analysis:[/b] 23% increase in community formation, potentially driven by economic uncertainties\n[b]Recommended Action:[/b] Enhanced welfare outreach and SCI reassessment',
        '[h2]Deductive Events (Specific Incidents)[/h2]\n[b]Incident A-1:[/b] Skrell researcher on Europa publicly criticized Federation psionic research ethics\n[b]Response:[/b] Diplomatic counseling session scheduled, SCI under review for potential Tertiary classification',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'generated',
          data: {
            system: 'Federation analytical protocols',
            timestamp: '{{date}}',
            operator: 'Consular Analytics Engine'
          }
        }
      ]
    },

    'hatching-egg': {
      structure: [
        {
          component: 'headers',
          type: 'neural',
          data: {
            title: 'DIPLOMATIC COMMUNICATION TEMPLATE',
            subtitle: ''
          }
        },
        '[b]Template ID:[/b] {{templateId}}\n[b]Approved For:[/b] External Entities\n[b]Document ID:[/b] {{documentId}}',
        '[h2]Message Template[/h2]\n[b]To:[/b] [field]\n[b]From:[/b] Nralakk Federation Diplomatic Mission, SCCV Horizon\n[b]From Rank:[/b] Consular Officer (Ambassador Plenipotentiary)\n[b]Ship Registry:[/b] SCCV Horizon (Stellar Corporate Conglomerate)\n[b]Re:[/b] [field]',
        'Greetings from the Nralakk Federation,\n\nWe acknowledge your [field] dated [field]. The Federation values our ongoing relationship and wishes to address this matter with appropriate consideration.\n\n[field]\n\nWe look forward to your response and continued cooperation.\n\nIn the light of distant stars,\n[field]\nConsular Officer (Ambassador Plenipotentiary)\nNralakk Federation Diplomatic Mission\nSCCV Horizon, Stellar Corporate Conglomerate',
        '[h2]Usage Guidelines[/h2]\n[list]\n[*] Always maintain diplomatic neutrality\n[*] Reference Federation values without imposing them\n[*] Include traditional Skrellian closing phrases\n[/list]'
      ]
    },

    'void': {
      structure: [
        {
          component: 'headers',
          type: 'classified',
          data: {
            title: 'CLASSIFIED INTELLIGENCE REPORT',
            classification: 'CLASSIFIED • AIDE ACCESS GRANTED'
          }
        },
        '[b]Warning:[/b] Classified material - handle according to Federation security protocols\n[b]Document ID:[/b] {{documentId}}\n[b]Glorsh-Omega Classification:[/b] Post-Singularity Intelligence',
        '[h2]Access Status[/h2]\nThis intelligence data stream is available for review. All synthetic intelligence indicators must be reported immediately.',
        '[h2]Historical Context[/h2]\nIntelligence regarding covert operations during the Glorsh-Omega Singularity (2056-2192 CE). Analysis of Collaborator networks and post-Tri-Qyu Calamity security protocols.',
        '[h2]Current Threat Assessment[/h2]\nAnalysis of ongoing synthetic intelligence threats in Tau Ceti space and aboard corporate vessels. X\'Lu\'oa genetic monitoring protocols. Updated weekly for Consular and Aide personnel per Grand Council directive. Special focus on SCC synthetic worker programs.',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'classified',
          data: {
            securityLevel: 'Security Protocol',
            securityNotice: 'This information is classified and should be handled according to Federation security directives\nDo not share outside authorized personnel'
          }
        }
      ]
    },

    // Generic fallback template for unknown constellations
    'generic': {
      structure: [
        {
          component: 'headers',
          type: 'neural',
          data: {
            title: 'FEDERATION DIPLOMATIC DATA STREAM',
            subtitle: ''
          }
        },
        '[b]Data Stream:[/b] {{constellationName}}\n[b]Document ID:[/b] {{documentId}}\n[b]Date:[/b] {{date}}',
        '[h2]Content[/h2]\n{{content}}\n\n[h2]Source Information[/h2]\n[b]URL:[/b] {{url}}\n[b]Node ID:[/b] {{id}}\n[b]Tags:[/b] {{tags}}',
        { component: 'sections', type: 'divider' },
        {
          component: 'footers',
          type: 'generated',
          data: {
            system: 'Federation Diplomatic Mission Nlom Interface',
            timestamp: '{{date}}',
            operator: 'Diplomatic Mission Staff'
          }
        }
      ]
    }
  }
};

/**
 * Template Placeholders for different contexts
 */
const TEMPLATE_PLACEHOLDERS = {
  federation: `[h1]NRALAKK FEDERATION DOCUMENT[/h1]

[center]Neural Interface Template[/center]

This is a Federation document template. Use the edit controls to toggle between psionic script view and neural encoding display modes.

[field] Enter content here [/field]

[hr]

[list]
[*] First item
[*] Second item
[*] Third item
[/list]

[small]Additional notes can go here[/small]`,

  quickInsert: `[h1]DOCUMENT TEMPLATE[/h1]

Select a template from the template menu to get started, or begin typing your own content.

Use [field] tags to create fillable fields in your documents.`,

  constellations: `[h1]CONSTELLATION DATA STREAM[/h1]

This data stream is connected to the {{constellationName}} constellation.

Content will be loaded based on the selected node configuration.`,

  empty: `[center][small]No content available[/small][/center]

This neural data stream is currently empty. Use the editor controls to add content.`
};

/**
 * Main Template Engine Class
 */
export class TemplateEngine {
  constructor() {
    this.components = TEMPLATE_COMPONENTS;
    this.configs = TEMPLATE_CONFIGS;
    this.placeholders = TEMPLATE_PLACEHOLDERS;
    this.cache = new Map();
    this.builder = new TemplateBuilder(this.components);
  }

  /**
   * Get rendered template
   */
  getTemplate(category, templateName, data = {}) {
    const cacheKey = `${category}.${templateName}`;

    if (!this.cache.has(cacheKey)) {
      const template = this.buildTemplate(category, templateName);
      if (template) {
        this.cache.set(cacheKey, template);
      }
    }

    const template = this.cache.get(cacheKey);
    if (!template) {
      console.warn(`Template not found: ${category}.${templateName}`);
      return this.getErrorTemplate('templateNotFound', { category, templateName });
    }

    return this.renderTemplate(template, this.enrichData(data));
  }

  /**
   * Build template from configuration
   */
  buildTemplate(category, templateName) {
    const config = this.configs[category]?.[templateName];
    if (!config) return null;

    return this.builder.build(config);
  }

  /**
   * Render template with data substitution
   */
  renderTemplate(template, data = {}) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * Enrich data with common variables
   */
  enrichData(data) {
    return {
      currentDate: new Date().toISOString().split('T')[0],
      reportId: Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
      operator: 'Consular Officer',
      location: 'SCCV Horizon',
      motto: 'In the light of distant stars',
      ...data
    };
  }

  /**
   * Get placeholder for category
   */
  getPlaceholder(category) {
    return this.placeholders[category] || this.placeholders.empty;
  }

  /**
   * Get available templates for category
   */
  getAvailableTemplates(category) {
    return this.configs[category] || {};
  }

  /**
   * Get error template
   */
  getErrorTemplate(errorType, data = {}) {
    const errorTemplates = {
      templateNotFound: `[h1]TEMPLATE ERROR[/h1]

Template not found: {{category}}.{{templateName}}

Please contact system administrator.`,

      psionicDisruption: `[h1]PSIONIC DATA STREAM DISRUPTED[/h1]

{{message}}

Nlom resonance error: {{error}}

Attempting automatic psionic pathway re-establishment...`
    };

    const template = errorTemplates[errorType] || errorTemplates.templateNotFound;
    return this.renderTemplate(template, data);
  }

  /**
   * Validate template configuration
   */
  validateTemplate(config) {
    if (!config.structure || !Array.isArray(config.structure)) {
      return { valid: false, error: 'Template must have a structure array' };
    }

    for (const section of config.structure) {
      if (typeof section === 'object' && section.component) {
        const component = this.components[section.component]?.[section.type];
        if (!component) {
          return {
            valid: false,
            error: `Component not found: ${section.component}.${section.type}`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Template Builder - Constructs templates from component configurations
 */
class TemplateBuilder {
  constructor(components) {
    this.components = components;
  }

  build(config) {
    let template = '';

    config.structure.forEach(section => {
      if (typeof section === 'string') {
        template += section + '\n\n';
      } else {
        const component = this.getComponent(section.component, section.type);
        if (component) {
          template += this.renderComponent(component, section.data || {}) + '\n\n';
        }
      }
    });

    return template.trim();
  }

  getComponent(type, name) {
    return this.components[type]?.[name];
  }

  renderComponent(component, data) {
    return component.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}

// Behavioral tags for citizen templates (consolidated, no duplication)
export const BEHAVIORAL_TAGS = {
  "Nlom-Centered": "Exhibits strong connection to Nlom ideals",
  "Cooperative": "Works well within group dynamics",
  "Individualistic": "Shows tendency toward independent thought",
  "Traditionalist": "Respects established Federation customs",
  "Progressive": "Embraces new ideas and changes",
  "Quya-Focused": "Prioritizes family unit bonds",
  "Career-Driven": "Shows ambition in professional pursuits",
  "Academically-Inclined": "Demonstrates scholarly interests",
  "Socially-Withdrawn": "Prefers limited social interaction",
  "Community-Oriented": "Actively participates in communal activities",
  "Psionically-Sensitive": "Shows heightened psionic awareness",
  "Culturally-Adaptive": "Adapts well to non-Skrell environments",
  "Federation-Loyal": "Strong allegiance to Federation ideals",
  "Diplomatically-Minded": "Shows skills in inter-species relations",
  "Scientifically-Curious": "Exhibits research-oriented behavior"
};

// Content formatting utilities
export const CONTENT_FORMATTERS = {
  citizenSummary(citizen) {
    let entry = `[b]${citizen.fullName}[/b]\n`;
    entry += `• ID: ${citizen.citizenId}\n`;
    entry += `• SCI Rating: ${citizen.sciScore}/10.00\n`;
    entry += `• Status: ${citizen.citizenStatus}\n`;

    if (citizen.location) entry += `• Location: ${citizen.location}\n`;
    if (citizen.occupation) entry += `• Occupation: ${citizen.occupation}\n`;
    if (citizen.quya) entry += `• Quya: ${citizen.quya}\n`;
    if (citizen.behavioralTags?.length) {
      entry += `• Behavioral Profile: ${citizen.behavioralTags.join(", ")}\n`;
    }
    if (citizen.notes) entry += `• Notes: ${citizen.notes}\n`;

    return entry + '\n';
  },

  logEntries(entries, title = 'Activity Log') {
    if (!entries?.length) return '';

    let log = `[h2]${title}[/h2]\n`;
    entries.forEach(entry => {
      const timestamp = entry.timestamp.toISOString().replace('T', ' ').substr(0, 19);
      log += `[b]${timestamp}[/b] - ${entry.entry}\n`;
    });
    return log + '\n';
  }
};
