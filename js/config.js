/**
 * Nralakk Federation Nlom Interface - Centralized Configuration
 *
 * Shared constants and configuration data to maintain DRY principles
 * Following standards: All magic values centralized, consistent naming, DRY implementation
 */

// Magic numbers and strings extracted to constants
export const CONSTANTS = {
  // UI Constants
  MAX_SEARCH_RESULTS: 8,
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,

  // Animation Durations (ms)
  ANIMATION_FAST: 150,
  ANIMATION_BASE: 300,
  ANIMATION_SLOW: 500,
  ANIMATION_SLOWER: 800,

  // Performance Thresholds
  MAX_FPS: 60,
  // PERFORMANCE_MODE_THRESHOLD: 30, // Disabled to ensure full star visibility

  // File Extensions
  EXPORT_MD: "md",
  EXPORT_JSON: "json",

  // Timeouts
  TOAST_DURATION: 3000,
  WARNING_TOAST_DURATION: 5000,
  TENDRIL_ANIMATION_DURATION: 1200,
  SHORT_DELAY: 100,
  AUTO_SAVE_DELAY: 3000,

  // Canvas/3D
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  PARTICLE_COUNT: 800,
  CLUSTER_PARTICLES: 50,
  HOVER_DISTANCE: 60,
  SCI_PRIMARY_THRESHOLD: 7,
  SCI_SECONDARY_THRESHOLD: 4,
  RECENT_LOGS_LIMIT: 5,
};

// Keyboard key constants
export const KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
};

// Application routes and views
export const ROUTES = {
  "/": "starfield-view",
  "/gnarled-tree": "gnarled-tree-view",
  "/qu-poxii": "qu-poxii-view",
  "/star-chanter": "star-chanter-view",
  "/hatching-egg": "hatching-egg-view",
  "/void": "void-view",
};

// Constellation metadata and configuration - centralized descriptions
export const CONSTELLATIONS = {
  "gnarled-tree": {
    name: "The Gnarled Tree",
    meaning: "Age • Wisdom • Tradition",
    descriptions: {
      detailed:
        "Repository for Federation diplomatic legal codex, Grand Council directives, and interstellar protocols. Essential reference materials for diplomatic mission operations aboard non-Federation vessels.",
      accessibility:
        "Age, wisdom, tradition. Federation diplomatic legal codex and Grand Council directives for diplomatic mission operations.",
      stream:
        "Repository for filed Federation documents, legal codes, and archived protocols. These data streams form the immutable backbone of diplomatic authority and historical record.",
      shell: null, // No shell needed - has actual content
    },
    icon: "tree",
    color: "#5CE7E7",
    warmColor: "#7FFFFF",
  },
  "qu-poxii": {
    name: "The Qu'Poxii",
    meaning: "Love • Friendship • Support",
    descriptions: {
      detailed:
        "Diplomatic citizen oversight system for Social Compatibility Index management and diaspora welfare coordination. Essential services for Federation citizens operating in corporate space.",
      accessibility:
        "Love, friendship, support. Diplomatic citizen oversight for Social Compatibility Index management aboard corporate vessels.",
      stream:
        "Diplomatic citizen management system for tracking Federation Skrell abroad. Monitor Social Compatibility Index ratings, citizenship status, and maintain welfare logs for diaspora operations.",
      shell: null, // Uses citizen management interface
    },
    icon: "bond",
    color: "#1B5E55",
    warmColor: "#2A8A7F",
  },
  "star-chanter": {
    name: "The Star Chanter",
    meaning: "Wisdom • Science • Connection",
    descriptions: {
      detailed:
        "Psionic-integrated analytical matrix for Inductive & Deductive behavioral assessment. Neural algorithms process Nlom consciousness patterns to maintain societal harmony and detect psychological anomalies.",
      accessibility:
        "Wisdom, science, connection. Psionic-integrated behavioral analysis for maintaining societal harmony and detecting anomalies.",
      stream:
        "Analytical engine for Inductive & Deductive Actions Reports. Real-time data streams cascade here like pure information, providing insights into Federation citizen behavior patterns.",
      shell: {
        description:
          "This constellation is reserved for future Qeblak spiritual and analytical functionality. The Star Chanter will eventually provide insights into psionic patterns, Nlom fluctuations, and sacred astronomical data for deep-space Skrell spiritual practices.",
        subtitle: "Qeblak Spiritual Analytics • Future Implementation",
        icon: "⬢",
        features: [
          "Qeblak ritual calendar integration",
          "Psionic resonance monitoring",
          "Astronomical event tracking",
          "Sacred guidance matrices",
          "Sacred site coordination",
        ],
        status: "Status: Reserved for Sacred Implementation",
      },
    },
    icon: "chant",
    color: "#3E2E5C",
    warmColor: "#6A4A9A",
  },
  "hatching-egg": {
    name: "The Hatching Egg",
    meaning: "New Beginnings • Progress",
    descriptions: {
      detailed:
        "Diplomatic transmission protocols for interspecies communication. Grand Council-approved message templates ensuring Federation values are properly conveyed to non-Skrellian entities.",
      accessibility:
        "New beginnings, progress. Diplomatic transmission protocols for mission communications with corporate and alien entities.",
      stream:
        "Form template repository for diplomatic communications. Pre-approved document templates for interactions with other stellar entities, citizen services, and corporate partnerships.",
      shell: null, // No shell needed - has actual content
    },
    icon: "egg",
    color: "#E5C76B",
    warmColor: "#FFE195",
  },
  void: {
    name: "The Void",
    meaning: "Death • Mystery • The Unknown",
    descriptions: {
      detailed:
        "Classified Kala intelligence archives. Deep-encrypted data streams containing post-Glorsh threat assessments, synthetic monitoring protocols, and materials requiring maximum psionic security clearance.",
      accessibility:
        "Mystery, restriction. Classified Kala intelligence requiring maximum psionic security protocols.",
      stream:
        "Classified Federation intelligence repository. Consular Officer and Diplomatic Aide clearance provides access to sensitive data streams requiring maximum security protocols.",
      shell: {
        description:
          "This constellation is reserved for highly classified and dangerous information. Access to The Void requires special authorization beyond standard Aide clearance. Future implementation will handle deep intelligence, threat assessments, and sensitive data requiring the highest levels of security.",
        subtitle: "Classified Operations • Maximum Security",
        icon: "⬡",
        features: [
          "Deep intelligence archives",
          "Threat assessment protocols",
          "Synthetic intelligence monitoring",
          "Black site coordination",
          "Emergency response systems",
        ],
        status: "Status: Secured & Dormant",
        statusClass: "classified",
        securityNotice:
          "⬡ Security Protocol: This constellation contains no active data streams. Any unauthorized access attempts are logged and reported to Federation Central Authority.",
      },
    },
    icon: "void",
    color: "#0E3757",
    warmColor: "#2A5A8A",
  },
};

const hexToInt = (hex) => parseInt(hex.replace("#", ""), 16);

// Clearance level configuration
export const CLEARANCE_LEVELS = {
  open: {
    label: "Public • Federation Standard",
    class: "public-record",
    description: "Public data streams accessible to all Federation personnel",
  },
  filed: {
    label: "Secured • Diplomatic Authority",
    class: "filed-record",
    description: "Secured archives requiring Consular Officer authorization",
  },
  "black-star": {
    label: "Classified • Grand Council",
    class: "classified-data",
    description: "Classified intelligence streams requiring highest clearance",
  },
};

// User profile and citizen status configuration
export const USER_PROFILE = {
  citizenshipStatus: "Primary Numerical",
  rank: "Consular Officer",
  clearanceType: "Plenipotentiary",
  sci: 9.7,
  operator: "Consular Officer",
  staff: ["Diplomatic Aide", "Kala Bodyguard"],
};

export const CITIZEN_STATUSES = [
  { value: "Primary Numerical", label: "Primary Numerical (7.00-10.00)" },
  {
    value: "Secondary Numerical",
    label: "Secondary Numerical (4.00-6.99)",
    default: true,
  },
  { value: "Tertiary Numerical", label: "Tertiary Numerical (0.00-3.99)" },
  { value: "Under Review", label: "Under Review" },
];

export const DEFAULT_CITIZEN_STATUS = CITIZEN_STATUSES.find(
  (s) => s.default
).value;

// Derived interface messages using centralized profile
export function getLoadingSubtitle() {
  return `Establishing diplomatic mission protocols • ${USER_PROFILE.rank} authentication in progress • ${USER_PROFILE.citizenshipStatus} SCI validation confirmed`;
}

export function getClearanceMatrix() {
  return `${USER_PROFILE.rank} • ${USER_PROFILE.citizenshipStatus} • SCI: ${USER_PROFILE.sci}`;
}

export function getClearanceWelcome() {
  return `<strong>DIPLOMATIC MISSION ACCESS GRANTED</strong><br>${USER_PROFILE.rank} (${USER_PROFILE.clearanceType}) authenticated • ${USER_PROFILE.citizenshipStatus} SCI: ${USER_PROFILE.sci}/10.00 • SCCV Horizon diplomatic protocols active`;
}

// Animation and timing configuration (using centralized constants)
export const ANIMATION_CONFIG = {
  view: CONSTANTS.ANIMATION_SLOW + 100, // 400ms
  nodeBloom: CONSTANTS.ANIMATION_BASE,
  tendril: CONSTANTS.TENDRIL_ANIMATION_DURATION,
  warmTransition: CONSTANTS.ANIMATION_SLOWER,
  debounceDelay: CONSTANTS.DEBOUNCE_DELAY,
  resultAnimationDelay: 50,
  orbitAnimationDuration: 600,
};

// Search configuration (using centralized constants)
export const SEARCH_CONFIG = {
  maxResults: CONSTANTS.MAX_SEARCH_RESULTS,
  minQueryLength: CONSTANTS.MIN_QUERY_LENGTH,
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 2,
};

// Starfield visual configuration (using centralized constants)
const STARFIELD_BASE = {
  sceneWidth: 800,
  sceneHeight: 600,
  cameraFov: CONSTANTS.CAMERA_FOV,
  cameraNear: CONSTANTS.CAMERA_NEAR,
  cameraFar: CONSTANTS.CAMERA_FAR,
  particleCount: CONSTANTS.PARTICLE_COUNT,
  clusterParticles: CONSTANTS.CLUSTER_PARTICLES,
  hoverDistance: CONSTANTS.HOVER_DISTANCE,
  maxFps: CONSTANTS.MAX_FPS,
};

export const STARFIELD_CONFIG = {
  ...STARFIELD_BASE,
  clusterSize: 40,
  animationSpeed: 0.5,
  tendrilSegments: 50,
  // performanceModeThreshold: CONSTANTS.PERFORMANCE_MODE_THRESHOLD, // Disabled to ensure full star visibility
};

// Enhanced starfield configuration for Three.js (using centralized constants)
const CONSTELLATION_POSITIONS = {
  "gnarled-tree": { x: -280, y: 140, z: -30 },
  "qu-poxii": { x: 220, y: 180, z: -60 },
  "star-chanter": { x: 30, y: -120, z: -150 },
  "hatching-egg": { x: -200, y: -80, z: 40 },
  void: { x: 300, y: -140, z: -100 },
};

const ENHANCED_CONSTELLATIONS = Object.fromEntries(
  Object.entries(CONSTELLATION_POSITIONS).map(([name, pos]) => [
    name,
    {
      ...pos,
      color: hexToInt(CONSTELLATIONS[name].color),
      warm: hexToInt(CONSTELLATIONS[name].warmColor),
    },
  ])
);

export const ENHANCED_STARFIELD_CONFIG = {
  SCENE_WIDTH: STARFIELD_BASE.sceneWidth,
  SCENE_HEIGHT: STARFIELD_BASE.sceneHeight,
  CAMERA_FOV: STARFIELD_BASE.cameraFov,
  CAMERA_NEAR: STARFIELD_BASE.cameraNear,
  CAMERA_FAR: STARFIELD_BASE.cameraFar,
  CONSTELLATIONS: ENHANCED_CONSTELLATIONS,
  PARTICLE_COUNT: STARFIELD_BASE.particleCount,
  CLUSTER_SIZE: 60, // Increased from 40 for better visibility
  CLUSTER_PARTICLES: STARFIELD_BASE.clusterParticles,
  ANIMATION_SPEED: STARFIELD_CONFIG.animationSpeed,
  TENDRIL_SEGMENTS: STARFIELD_CONFIG.tendrilSegments,
  HOVER_DISTANCE: STARFIELD_BASE.hoverDistance,
  WARM_TRANSITION_TIME: CONSTANTS.ANIMATION_SLOWER,
  TENDRIL_ANIMATION_TIME: CONSTANTS.TENDRIL_ANIMATION_DURATION,
  MAX_FPS: STARFIELD_BASE.maxFps,
};

// Common utility functions following JS-04 (small, single-purpose, pure functions)
export function getConstellationDescription(cluster, type = "detailed") {
  return CONSTELLATIONS[cluster]?.descriptions?.[type] || "";
}

export function getClearanceInfo(seal) {
  return CLEARANCE_LEVELS[seal] || CLEARANCE_LEVELS["open"];
}

export function formatClearanceLevel(seal, nodeCluster) {
  const clearance = getClearanceInfo(seal);
  switch (seal) {
    case "black-star":
      return "Classified • Kala Command Authority";
    case "filed":
      return "Secured • Consular Authority Access";
    default:
      return "Public • Federation Standard Access";
  }
}

// Shared utility functions for consistent error handling (JS-05)
export function createStandardError(message, details = null, status = null) {
  return {
    message,
    details,
    status,
    timestamp: new Date().toISOString(),
  };
}

export function logError(error, context = "") {
  console.error(`[NLOM Interface${context ? ` - ${context}` : ""}]:`, error);
}

// Site Configuration - Centralized metadata and content
export const SITE_CONFIG = {
  // Meta Information
  meta: {
    siteName: "Nlom Neural Interface - Nralakk Federation Diplomatic Mission",
    description:
      "Nralakk Federation Diplomatic Mission Interface - Primary Numerical Psionic Data Stream Access Portal for SCCV Horizon Operations",
    author: "Nralakk Federation",
    canonicalUrl: "https://mnemeory.github.io/",
    ogTitle: "Nlom Neural Interface - Nralakk Federation Diplomatic Mission",
    ogDescription:
      "Primary Numerical Psionic Data Stream Portal - SCCV Horizon Diplomatic Mission Access",
    ogType: "website",
  },

  // Asset Paths
  assets: {
    favicon: "assets/images/tree.svg",
    emblem: "assets/images/tree.svg",
    images: {
      tree: "assets/images/tree.svg",
      bond: "assets/images/bond.svg",
      chant: "assets/images/chant.svg",
      egg: "assets/images/egg.svg",
      void: "assets/images/void.svg",
    },
    directories: {
      images: "assets/images/",
      templates: "templates/",
      filed: "filed/",
      citizen: "citizen/",
      data: "assets/data/",
    },
  },

  // CDN Configuration
  cdn: {
    threejs: {
      version: "0.150.1",
      baseUrl: "https://cdn.skypack.dev/three@0.150.1",
      addonsPath: "https://cdn.skypack.dev/three@0.150.1/examples/jsm/",
    },
    fonts: {
      google: "https://fonts.googleapis.com",
      googleStatic: "https://fonts.gstatic.com",
      fontFamilies:
        "Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
    },
  },

  // Interface Text and Messages
  text: {
    loading: {
      main: "Establishing psionic resonance with Federation Nlom network via SCCV Horizon...",
      subtitle: getLoadingSubtitle,
    },
    interface: {
      skipLink: "Skip to main content",
      protocolLabel: "Diplomatic Protocol",
      statusPulse: "Neural Link Stable",
      homeButtonLabel:
        "Return to diplomatic mission data constellation overview",
      emblemAlt: "Nralakk Federation Emblem",
      starfieldLabel: "Interactive Psionic Wake Data Constellations",
      constellationMapLabel:
        "Diplomatic Mission Psionic Wake Constellation Map",
    },
    modal: {
      closeLabel: "Close dialog",
      documentViewer: "Document Viewer",
      pilcrowLabel:
        "Toggle between Psionic Wake rendering and neural script encoding modes",
      extractTitle: "Extract psionic script",
      extractLabel: "Extract raw psionic script to Nlom buffer",
      downloadTitle: "Download psionic data stream",
      downloadLabel: "Download document as psionic text stream file",
      inscribeAction: "Inscribe Psionic Memory (.md)",
      transmitAction: "Encode for Psionic Wake Transmission (.json)",
    },
    footer: {
      navigationEssence:
        "Navigate through diplomatic mission Psionic Wake data constellations",
    },
  },

  // DOM Selectors - Centralized to avoid hardcoding throughout modules
  selectors: {
    // Main containers
    app: "#app",
    mainContent: "#main-content",
    loadingVeil: "#loading-veil",
    loadingClearance: "#loading-clearance",

    // Header elements
    protocolHomeButton: "#protocol-home-button",
    clearanceMatrix: "#clearance-matrix",

    // Starfield
    starfieldView: "#starfield-view",
    starfieldContainer: "#starfield-container",
    starfieldCanvas: "#starfield-canvas",
    constellationTooltip: "#constellation-tooltip",

    // Views
    gnarledTreeView: "#gnarled-tree-view",
    quPoxiiView: "#qu-poxii-view",
    starChanterView: "#star-chanter-view",
    hatchingEggView: "#hatching-egg-view",
    voidView: "#void-view",
    
    // Atmospheric system
    constellationAtmosphere: "#constellation-atmosphere",

    // Node containers
    gnarledTreeNodes: "#gnarled-tree-nodes",
    quPoxiiNodes: "#qu-poxii-nodes",
    starChanterNodes: "#star-chanter-nodes",
    hatchingEggNodes: "#hatching-egg-nodes",
    voidNodes: "#void-nodes",

    // Modal
    nodeModal: "#node-modal",
    modalTitle: "#modal-title",
    modalClose: "#modal-close",
    modalBody: "#modal-body",
    modalPaperContainer: "#modal-paper-container",
    modalPilcrow: "#modal-pilcrow",
    modalDocumentStatus: "#modal-document-status",

    modalCopy: "#modal-copy",
    modalSave: "#modal-save",
    modalPaper: "#modal-paper",
    modalInscribe: "#modal-inscribe",
    modalTransmit: "#modal-transmit",

    // Notifications
    toastContainer: "#toast-container",

    // Citizen Management
    citizenInterface: "#citizen-interface",
  },

  // File System Configuration
  fileSystem: {
    scanPaths: [
      {
        path: "templates/",
        constellation: "hatching-egg",
        seal: "open",
      },
      {
        path: "filed/",
        constellation: "gnarled-tree",
        seal: "filed",
      },
      {
        path: "citizen/",
        constellation: "qu-poxii",
        seal: "open",
      },
    ],
    supportedExtensions: [".txt", ".md", ".json"],
    defaultExtension: ".txt",
  },

  // Performance Configuration
  performance: {
    frameTimeThreshold: 16.67, // 60 FPS in milliseconds
    // performanceModeThreshold: 30, // FPS threshold to enable performance mode - Disabled to ensure full star visibility
    maxStars: 1500,
    reducedStars: 800,
    animationQuality: {
      high: 1.0,
      medium: 0.7,
      low: 0.4,
    },
  },

  // Animation Configuration - Centralized timing values
  animations: {
    // Duration values in milliseconds
    durations: {
      fast: 150,
      base: 300,
      slow: 500,
      slower: 800,
      ultra: 1200,
      tendril: 1200,
      float: 16000,
      morph: 8000,
      pulse: 3000,
      ripple: 8000,
    },
    // Easing functions
    easing: {
      organic: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
    // Delay values
    delays: {
      stagger: 100,
      debounce: 300,
      tooltip: 150,
    },
  },

  // Starfield Configuration - Star generation and positioning
  starfield: {
    // Star generation parameters
    stars: {
      count: 1500,
      spread: 100,
      brightness: 0.8,
      sizeRange: [0.5, 2.0],
      colorVariance: 0.3,
    },
    // Constellation positioning (3D coordinates)
    constellationPositions: {
      "gnarled-tree": { x: -0.8, y: 0.3, z: -0.2 },
      "qu-poxii": { x: 0.5, y: -0.4, z: 0.1 },
      "star-chanter": { x: 0.0, y: 0.6, z: -0.3 },
      "hatching-egg": { x: -0.3, y: -0.5, z: 0.2 },
      void: { x: 0.7, y: 0.2, z: -0.4 },
    },
    // Interaction settings
    interaction: {
      hoverDistance: 60,
      activationRadius: 30,
      tooltipOffset: { x: 10, y: -30 },
    },
  },

  // Templates - Centralized HTML and text templates
  templates: {
    // Error templates
    error: {
      psionicFailure: `
        <div class="error-content">
          <h3>⚠️ Diplomatic Psionic Interface Disruption</h3>
          <p>{{message}}</p>
          <button onclick="window.location.reload()" class="retry-button">
            Re-establish Diplomatic Nlom Connection
          </button>
        </div>
      `,
      accessDenied: `
        <div class="clearance-warning">
          <h4>⬡ Insufficient Clearance</h4>
          <p>{{resource}} requires {{level}} authorization.</p>
          <p>Current clearance: {{currentLevel}}</p>
        </div>
      `,
    },



    // Form templates
    forms: {
      citizenForm: `
        <form class="citizen-form" id="{{formId}}">
          <h4>{{formTitle}}</h4>
          <div class="form-grid">
            {{formFields}}
          </div>
          <div class="form-actions">
            {{formActions}}
          </div>
        </form>
      `,
    },
  },

  // Interface Text - Expanded to include all hardcoded strings
  interfaceText: {
    // Error messages
    errors: {
      psionicFailure:
        "Diplomatic psionic matrix resonance failure. Nlom connection to interface compromised. Please refresh to re-establish connection.",
      accessDenied:
        "Access denied. Insufficient clearance level for requested resource.",
      dataLoadError:
        "Unable to access constellation data matrix. Diplomatic psionic pathways to data streams compromised.",
      fileLoadError:
        "Could not load file {{filename}}. Data stream connection interrupted.",
      invalidInput:
        "Invalid input provided. Please check your data and try again.",
      networkError:
        "Network connection lost. Please check your connection and try again.",
      sessionExpired:
        "Diplomatic session expired. Please refresh to establish new connection.",
    },

    // Success messages
    success: {
      documentSaved: "Document successfully transmitted to diplomatic archive",
      citizenAdded: "Citizen record successfully created and archived",
      sessionExported: "Diplomatic session report transmitted successfully",
      dataLoaded: "Constellation data streams successfully synchronized",
    },

    // Warning messages
    warnings: {
      classifiedAccess:
        "Accessing classified data streams. Ensure proper clearance authorization.",
      sessionClear: "This will clear all current session data. Continue?",
      unsavedChanges: "You have unsaved changes. Discard changes?",
      lowClearance:
        "Your current clearance level may restrict access to some features.",
    },

    // Info messages
    info: {
      sessionInitialized: "New diplomatic session initialized",
      searchInProgress: "Searching constellation data streams...",
      loadingData: "Loading diplomatic mission data...",
      connecting:
        "Establishing psionic resonance with Federation Nlom network...",
    },

    // Form labels and placeholders
    forms: {
      labels: {
        primaryName: "Primary Name",
        secondaryName: "Secondary Name",
        nameExtensions: "Name Extensions",
        sciScore: "Social Compatibility Index",
        citizenStatus: "Citizenship Status",
        location: "Current Location",
        occupation: "Occupation",
        quya: "Quya Unit",
        notes: "Administrative Notes",
        roundNumber: "Round Number",
        logEntry: "Log Entry",
      },
      placeholders: {
        primaryName: "Enter primary Skrell name",
        secondaryName: "Enter secondary name (optional)",
        nameExtensions: "Enter name extensions (optional)",
        sciScore: "5.00",
        location: "Current station/vessel location",
        occupation: "Citizen occupation or role",
        quya: "Family unit designation",
        notes: "Additional administrative notes",
        search: "Search diplomatic data streams...",
        roundNumber: "Enter current round number",
        logEntry: "Enter activity log entry",
      },
      validation: {
        required: "{{field}} is required",
        invalidSci: "SCI score must be between 0.00 and 10.00",
        invalidFormat: "Invalid format for {{field}}",
        tooLong: "{{field}} exceeds maximum length",
        tooShort: "{{field}} is too short",
      },
    },

    // UI element text
    ui: {
      buttons: {
        save: "Archive Document",
        cancel: "Cancel Operation",
        export: "Transmit Report",
        delete: "Remove Record",
        edit: "Modify Record",
        view: "Access Record",
        add: "Create New Record",
        search: "Search Archives",
        clear: "Clear Session",
        back: "Return",
        next: "Proceed",
        confirm: "Confirm Action",
      },
      headings: {
        overview: "Diplomatic Mission Overview",
        citizens: "Citizen Management",
        documents: "Document Archive",
        session: "Current Session",
        statistics: "Mission Statistics",
        activity: "Activity Log",
      },
      status: {
        loading: "Processing...",
        ready: "System Ready",
        connected: "Connection Established",
        disconnected: "Connection Lost",
        error: "System Error",
        success: "Operation Successful",
      },
    },

    // Accessibility labels
    accessibility: {
      skipToContent: "Skip to main content",
      closeDialog: "Close dialog",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      constellationMap: "Interactive constellation data map",
      documentViewer: "Document content viewer",
      formField: "{{label}} input field",
      required: "Required field",
      optional: "Optional field",
    },

    // Citizen management interface strings
    citizen: {
      headers: {
        session: "Current Session:",
        stats: "Session Overview",
        citizens: "Citizen Records",
        activity: "Session Statistics",
        sessionFiles: "Available Session Files",
      },
      buttons: {
        setRound: "Set Round Number",
        exportSession: "Export Session",
        newSession: "New Session",
      },
      navigation: {
        overview: "Overview",
        addCitizen: "Add Citizen",
      },
      placeholders: {
        searchCitizens: "Search citizens by name...",
      },
      messages: {
        noCitizens: "No citizens registered this session.",
        noActivity: "No activity logged.",
      },
    },


  },
};

// Helper functions for site configuration
export function getSiteTitle() {
  return SITE_CONFIG.meta.siteName;
}

export function getSiteDescription() {
  return SITE_CONFIG.meta.description;
}

export function getAssetPath(type, name) {
  if (type === "image" && SITE_CONFIG.assets.images[name]) {
    return SITE_CONFIG.assets.images[name];
  }
  if (SITE_CONFIG.assets.directories[type]) {
    return SITE_CONFIG.assets.directories[type] + (name || "");
  }
  return name;
}

export function getSelector(name) {
  return SITE_CONFIG.selectors[name] || `#${name}`;
}

export function getInterfaceText(category, key) {
  return SITE_CONFIG.text[category]?.[key] || "";
}

export function getThreeJSImportMap() {
  const { threejs } = SITE_CONFIG.cdn;
  return {
    imports: {
      three: threejs.baseUrl,
      "three/addons/": threejs.addonsPath,
    },
  };
}

// Template utility functions
export function getTemplate(category, name) {
  return SITE_CONFIG.templates[category]?.[name] || "";
}

export function renderTemplate(template, data = {}) {
  if (!template) return "";

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

export function getErrorTemplate(errorType, data = {}) {
  const template = getTemplate("error", errorType);
  return renderTemplate(template, data);
}



// Interface text utility functions
export function getInterfaceMessage(category, key, data = {}) {
  const message = SITE_CONFIG.interfaceText[category]?.[key] || "";
  return renderTemplate(message, data);
}

export function getErrorMessage(key, data = {}) {
  return getInterfaceMessage("errors", key, data);
}

export function getSuccessMessage(key, data = {}) {
  return getInterfaceMessage("success", key, data);
}

export function getInfoMessage(key, data = {}) {
  return getInterfaceMessage("info", key, data);
}

// Performance utility functions
export function getPerformanceConfig(key) {
  return SITE_CONFIG.performance[key];
}
// Starfield utility functions
export function getStarfieldConfig(key) {
  return SITE_CONFIG.starfield[key];
}

export function getStarGenerationParams() {
  return SITE_CONFIG.starfield.stars;
}
