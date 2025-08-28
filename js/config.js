/**
 * Application Configuration
 * Centralized configuration for all application components
 */

// Animation and UI behavior
export const ANIMATION = {
  duration: {
    short: 150,
    standard: 300,
    long: 500
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)'
  },
  delay: {
    short: 100,
    standard: 200,
    stagger: 50
  }
};

// Environment and feature flags
export const ENV = {
  production: true,
  debug: true,
  features: {
    starfield3D: true,
    notifications: true
  }
};

// Site configuration
export const SITE_CONFIG = {
  meta: {
    siteName: 'Nralakk Federation Interface',
    description: 'Neural interface to the Nralakk Federation archives',
    author: 'Federation Diplomatic Corps',
    canonicalUrl: 'https://mnemeory.github.io/',
  },
  assets: {
    favicon: 'assets/images/tree.svg',
    directories: {
      images: 'assets/images/',
      css: 'css/',
      js: 'js/'
    }
  },
  selectors: {
    starfieldContainer: "[data-component='starfield-container']",
    loadingVeil: "[data-js='loading-veil']",
    toastContainer: "[data-component='toast-container']",
    modal: "[data-component='modal']",
    modalClose: "[data-component='modal-close']",
    citizenInterface: "#citizen-interface"
  },
  stationName: 'SCCV Horizon',
  fileSystem: {
    defaultExtension: '.txt'
  }
};

// Constellation data
export const CONSTELLATIONS = {
  'gnarled-tree': {
    name: 'The Gnarled Tree',
    icon: 'tree',
    meaning: 'Memory • History • Knowledge',
    viewId: 'gnarled-tree-view',
    descriptions: {
      accessibility: 'A gnarled tree with spreading branches, representing memory and knowledge',
      stream: 'The Gnarled Tree represents the accumulated wisdom and shared history of the Federation.'
    }
  },
  'qu-poxii': {
    name: 'The Qu\'Poxii',
    icon: 'bond',
    meaning: 'Love • Friendship • Support',
    viewId: 'qu-poxii-view',
    descriptions: {
      accessibility: 'Two interlinked figures representing bonds of trust and friendship',
      stream: 'The Qu\'Poxii represents the bonds of trust, friendship, and mutual support.'
    }
  },
  'star-chanter': {
    name: 'The Star Chanter',
    icon: 'chant',
    meaning: 'Communication • Understanding • Harmony',
    viewId: 'star-chanter-view',
    descriptions: {
      accessibility: 'A figure with arms raised toward the stars in song',
      stream: 'The Star Chanter represents communication, understanding, and diplomacy.'
    }
  },
  'hatching-egg': {
    name: 'The Hatching Egg',
    icon: 'egg',
    meaning: 'Potential • Creation • Beginnings',
    viewId: 'hatching-egg-view',
    descriptions: {
      accessibility: 'An egg with a crack running through it, representing new beginnings',
      stream: 'The Hatching Egg represents creation, potential, and new beginnings.'
    }
  },
  'void': {
    name: 'The Void',
    icon: 'void',
    meaning: 'Mystery • Unknown • Beyond',
    viewId: 'void-view',
    descriptions: {
      accessibility: 'A mysterious spiral representing the unknown and unexplored',
      stream: 'The Void represents the unknown, the mysterious, and what lies beyond.',
      shell: {
        subtitle: 'The Limits of Knowledge',
        icon: '✧',
        description: 'The Void constellation represents the limits of our knowledge and the mystery beyond.',
        features: [
          'Access to classified archives',
          'Temporal anomaly detection',
          'Advanced encryption protocols'
        ],
        securityNotice: 'Access restricted by Federation Council directive',
        status: 'In Development',
        statusClass: 'locked'
      }
    }
  }
};

// Enhanced starfield configuration
export const STARFIELD_CONFIG = {
  // Background starfield
  PARTICLE_COUNT: 800,
  ANIMATION_SPEED: 0.5,
  BRIGHTNESS_BASE: 0.8,
  COLOR_VARIANCE: 0.3,
  SIZE_RANGE: { min: 0.5, max: 2.0 },

  // Camera and scene
  CAMERA_FOV: 60,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,

  // Constellation cluster settings
  CLUSTER_PARTICLES: 350,
  CLUSTER_SIZE: 28,
  HOVER_DISTANCE: 22,

  // Tendril animation
  TENDRIL_SEGMENTS: 120,
  TENDRIL_ANIMATION_TIME: 800,

  // Per-constellation display configuration
  CONSTELLATIONS: {
    'gnarled-tree': {
      color: '#00BFFF',
      warm: '#FFD9A8',
      x: -120,
      y: 40,
      z: -50
    },
    'qu-poxii': {
      color: '#FF6B6B',
      warm: '#FFC6C6',
      x: 80,
      y: 20,
      z: -30
    },
    'star-chanter': {
      color: '#98FB98',
      warm: '#E6FFE6',
      x: -40,
      y: -60,
      z: -20
    },
    'hatching-egg': {
      color: '#FFD700',
      warm: '#FFF0B3',
      x: 140,
      y: -10,
      z: -60
    },
    'void': {
      color: '#DDA0DD',
      warm: '#F0D0F0',
      x: 0,
      y: 0,
      z: -80
    }
  }
};

// Citizen status options
export const CITIZEN_STATUSES = [
  { value: 'active', label: 'Active Service', variant: 'primary', default: false },
  { value: 'reserve', label: 'Reserve Status', variant: 'secondary', default: false },
  { value: 'civilian', label: 'Civilian', variant: 'tertiary', default: true },
  { value: 'diplomatic', label: 'Diplomatic Corps', variant: 'diplomatic', default: false }
];

// Constants
export const CONSTANTS = {
  SCI_PRIMARY_THRESHOLD: 85,
  SCI_SECONDARY_THRESHOLD: 70,
  RECENT_LOGS_LIMIT: 10,
  SHORT_DELAY: 300,
  TIMELINE_YEAR: 2467
};

// Keyboard constants
export const KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab'
};

// Behavioral tags for citizens
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

// Interface text
export const INTERFACE_TEXT = {
  errors: {
    invalidInput: 'Invalid input provided',
    dataLoadError: 'Failed to load neural data streams',
    connectionError: 'Neural pathway disruption detected'
  },
  citizen: {
    headers: {
      session: 'Diplomatic Session:',
      stats: 'Session Statistics',
      citizens: 'Active Citizens',
      sessionFiles: 'Session Files',
      activity: 'Recent Activity'
    },
    navigation: {
      overview: 'Overview',
      addCitizen: 'Add Citizen'
    },
    buttons: {
      setRound: 'Set Round',
      exportSession: 'Export Session',
      newSession: 'New Session'
    },
    placeholders: {
      searchCitizens: 'Search citizens...'
    },
    messages: {
      noCitizens: 'No citizens registered in this session.',
      noActivity: 'No recent activity.',
      noSessionFiles: 'No session files available.'
    }
  }
};