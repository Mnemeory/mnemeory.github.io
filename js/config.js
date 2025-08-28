/**
 * Application Configuration
 * Centralized configuration for all application components
 * 
 * Provides a single source of truth for application constants,
 * routes, and environment configuration.
 */

// Constants for animation and UI behavior
const ANIMATION = {
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
const ENV = {
  production: window.location.hostname !== 'localhost',
  debug: false,
  features: {
    starfield3D: true,
    notifications: true
  }
};

// Text constants used throughout the application
const TEXT = {
  general: {
    appName: 'Nralakk Federation Interface',
    loading: 'Establishing psionic link...',
    error: 'Psionic disruption detected'
  },
  errors: {
    dataLoadError: 'Failed to load neural data streams',
    connectionError: 'Neural pathway disruption detected'
  },
  interface: {
    starfield: 'Neural Starfield',
    return: 'Return to Consciousness',
    explore: 'Explore Neural Pathway'
  }
};

// Route configuration
const ROUTES = {
  '/': {
    id: 'starfield',
    title: 'Neural Starfield',
    viewId: 'starfield-view'
  },
  '/gnarled-tree': {
    id: 'gnarled-tree',
    title: 'Gnarled Tree',
    viewId: 'gnarled-tree-view'
  },
  '/qu-poxii': {
    id: 'qu-poxii',
    title: 'Qu\'Poxii',
    viewId: 'qu-poxii-view'
  },
  '/star-chanter': {
    id: 'star-chanter',
    title: 'Star Chanter',
    viewId: 'star-chanter-view'
  },
  '/hatching-egg': {
    id: 'hatching-egg',
    title: 'Hatching Egg',
    viewId: 'hatching-egg-view'
  },
  '/void': {
    id: 'void',
    title: 'Void',
    viewId: 'void-view'
  }
};

// Constellation data
const CONSTELLATIONS = {
  'gnarled-tree': {
    name: 'The Gnarled Tree',
    icon: 'tree',
    meaning: 'Memory • History • Knowledge',
    descriptions: {
      accessibility: 'A gnarled tree with spreading branches, representing memory and knowledge',
      stream: 'The Gnarled Tree represents the accumulated wisdom and shared history of the Federation.'
    }
  },
  'qu-poxii': {
    name: 'The Qu\'Poxii',
    icon: 'bond',
    meaning: 'Love • Friendship • Support',
    descriptions: {
      accessibility: 'Two interlinked figures representing bonds of trust and friendship',
      stream: 'The Qu\'Poxii represents the bonds of trust, friendship, and mutual support.'
    }
  },
  'star-chanter': {
    name: 'The Star Chanter',
    icon: 'chant',
    meaning: 'Communication • Understanding • Harmony',
    descriptions: {
      accessibility: 'A figure with arms raised toward the stars in song',
      stream: 'The Star Chanter represents communication, understanding, and diplomacy.'
    }
  },
  'hatching-egg': {
    name: 'The Hatching Egg',
    icon: 'egg',
    meaning: 'Potential • Creation • Beginnings',
    descriptions: {
      accessibility: 'An egg with a crack running through it, representing new beginnings',
      stream: 'The Hatching Egg represents creation, potential, and new beginnings.'
    }
  },
  'void': {
    name: 'The Void',
    icon: 'void',
    meaning: 'Mystery • Unknown • Beyond',
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

// Site configuration
const SITE_CONFIG = {
  meta: {
    siteName: 'Nralakk Federation Interface',
    description: 'Neural interface to the Nralakk Federation archives',
    author: 'Federation Diplomatic Corps',
    canonicalUrl: 'https://mnemeory.github.io/',
    ogTitle: 'Nralakk Federation Neural Interface',
    ogDescription: 'Access the collective wisdom of the Federation'
  },
  assets: {
    favicon: 'assets/images/tree.svg',
    directories: {
      images: 'assets/images/',
      css: 'css/',
      js: 'js/'
    }
  },
  cdn: {
    fonts: {
      google: 'https://fonts.googleapis.com',
      googleStatic: 'https://fonts.gstatic.com',
      fontFamilies: 'Roboto:wght@300;400;500&family=Roboto+Mono:wght@400;500&display=swap'
    }
  },
  selectors: {
    starfieldContainer: "[data-component='starfield-container']",
    loadingVeil: "[data-js='loading-veil']",
    toastContainer: "[data-component='toast-container']",
    modal: "[data-component='modal']",
    citizenInterface: "#citizen-interface"
  },
  fileSystem: {
    defaultExtension: '.txt'
  },
  stationName: 'SCCV Horizon',

  // Interface text for citizen management
  interfaceText: {
    errors: {
      invalidInput: 'Invalid input provided'
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
  }
};



// Logging configuration
const LOGGING = {
  enabled: true,
  level: ENV.production ? 'warn' : 'debug'
};

// Timeline settings
const TIMELINE = {
  year: 2467,
  era: 'Federation Standard'
};

// Constants used across the application
const CONSTANTS = {
  SCI_PRIMARY_THRESHOLD: 85,
  SCI_SECONDARY_THRESHOLD: 70,
  RECENT_LOGS_LIMIT: 10,
  SHORT_DELAY: 300
};

// Keyboard constants
const KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab'
};

// Enhanced starfield configuration
// This structure is consumed by starfield-scene/interactions and must include
// camera, cluster and tendril parameters, as well as per-constellation positions.
const ENHANCED_STARFIELD_CONFIG = {
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
const CITIZEN_STATUSES = [
  { value: 'active', label: 'Active Service', color: 'primary' },
  { value: 'reserve', label: 'Reserve Status', color: 'secondary' },
  { value: 'civilian', label: 'Civilian', color: 'tertiary' },
  { value: 'diplomatic', label: 'Diplomatic Corps', color: 'diplomatic' }
];

// Default citizen status
const DEFAULT_CITIZEN_STATUS = 'civilian';

// User profile template
const USER_PROFILE = {
  name: 'Diplomatic Officer',
  station: 'SCCV Horizon'
};

// Helper functions
function getStarfieldConfig() {
  return ENHANCED_STARFIELD_CONFIG;
}

function getStarGenerationParams() {
  return {
    count: ENHANCED_STARFIELD_CONFIG.PARTICLE_COUNT,
    brightness: ENHANCED_STARFIELD_CONFIG.BRIGHTNESS_BASE,
    colorVariance: ENHANCED_STARFIELD_CONFIG.COLOR_VARIANCE,
    sizeRange: [ENHANCED_STARFIELD_CONFIG.SIZE_RANGE.min, ENHANCED_STARFIELD_CONFIG.SIZE_RANGE.max],
    spread: 200 // Default spread for star positioning
  };
}

function getSuccessMessage(action) {
  return `${action} completed successfully`;
}

function getInfoMessage(info) {
  return `Information: ${info}`;
}

// Export combined configuration
export const CONFIG = {
  animation: ANIMATION,
  env: ENV,
  text: TEXT,
  routes: ROUTES,
  constellations: CONSTELLATIONS,
  site: SITE_CONFIG,
  logging: LOGGING,
  timeline: TIMELINE
};

// Export individual constants and configurations
export { 
  CONSTANTS,
  KEYS,
  ENHANCED_STARFIELD_CONFIG,
  CITIZEN_STATUSES,
  DEFAULT_CITIZEN_STATUS,
  USER_PROFILE,
  CONSTELLATIONS,
  SITE_CONFIG,
  getStarfieldConfig,
  getStarGenerationParams,
  getSuccessMessage,
  getInfoMessage
};
