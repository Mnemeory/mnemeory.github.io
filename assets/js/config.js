// Configuration Module

(function() {
  'use strict';
  
  const DATA_PATHS = {
    collections: 'data/collections.yml',
    vendetta: 'data/vendetta.yml',
    territory: 'data/territory.yml',
    familyroster: 'data/familyroster.yml'
  };
  
  const SELECTORS = {
    sealModal: 'sealModal',
    sealModalImage: 'sealModalImage',
    cardModal: 'cardModal',
    cardModalContent: 'cardModalContent',
    familyRosterFrame: 'familyRosterFrame',
    organizationalChart: 'organizationalChart',
    orgChartLines: 'orgChartLines',
    collectionsBody: 'collections-tbody',
    vendettaContainer: 'vendetta-container',
    territoryContainer: 'territory-container',
    pageNumber: 'page-number',
    rosterButton: '.family-roster-button',
    mobRadioButton: '.mob-radio-button',
    vendettaCard: '.vendetta-card[data-card-type="vendetta"]',
    territoryCard: '.territory-card[data-card-type="territory"]',
    rosterPlaque: '.roster-plaque'
  };
  
  const STATUS_MAPPINGS = {
    collections: {
      current: 'ACTIVE',
      inactive: 'INACTIVE',
      late: 'SUSPENDED',
      terminated: 'TERMINATED',
      refusing: 'TERMINATED'
    },
    vendetta: {
      active: 'Active',
      resolved: 'Resolved',
      pending: 'Pending',
      on_hold: 'On Hold'
    },
    territory: {
      controlled: 'Controlled',
      uncontrolled: 'Uncontrolled',
      contested: 'Contested',
      neutral: 'Neutral',
      expanding: 'Expanding'
    },
    roster: {
      active: 'active',
      inactive: 'inactive',
      deceased: 'deceased',
      vacant: 'vacant',
      retired: 'retired'
    }
  };
  
  const DISPLAY_TEXT = {
    roles: {
      boss: 'CAPO DI TUTTI CAPI',
      boss_consigliere: 'CONSIGLIERE DI SAN FRANCISCO',
      capo: 'CAPO',
      consigliere: 'LA SQUADRA (CONSIGLIERE)',
      soldato: 'LA SQUADRA (SOLDATO)',
      associate: 'LA FAMIGLIA (ASSOCIATE)'
    },
    vendettaTypes: {
      blood: 'Blood Debt',
      financial: 'Financial Debt'
    },
    defaults: {
      unknown: 'Unknown',
      unassigned: 'Unassigned',
      none: 'None',
      notAvailable: 'N/A'
    },
    errors: {
      dataLoadFailed: 'Error loading data. Please refresh the page.',
      rosterDataMissing: 'Family roster data not loaded',
      chartContainerMissing: 'Organizational chart container not found',
      svgContainerMissing: 'SVG container #orgChartLines not found in DOM',
      plaqueNotFound: 'Plaque not found for name:'
    },
    loading: {
      collections: 'Loading collections...',
      ledger: 'Loading Ledger Data...'
    }
  };
  
  const TIMING = {
    rosterRenderDelay: 100,
    rosterLinesDelay: 250,
    resizeDebounce: 250,
    positionCacheTtlMs: 1000
  };
  
  const LAYOUT = {
    verticalDistanceThreshold: 100,
    horizontalDistanceThreshold: 50,
    stepYOffset: 20,
    advisoryLineOffsetX: 40,
    mergePointOffset: 30,
    branchSpacing: 20,
    minMergeDistance: 50,
    bossRowGap: 80,
    bossConsigliereOffsetX: 120,
    columnMinWidth: 320,
    columnMaxWidth: 450,
    columnGap: 40,
    rowGap: 60,
    consigliereOffsetX: 100,
    subordinateSpacing: 50,
    plaqueWidths: {
      leadership: 380,
      crew: 320
    },
    gaps: {
      crewGrid: 50,
      associatesRow: 50,
      bubbleSpacing: 60
    },
    useDocumentFragment: true,
    enableTemplateCloning: true,
    enableContainment: true,
    cachePositions: true,
    useResizeObserver: true
  };
  
  const DEFAULTS = {
    status: 'active',
    separator: '<br>',
    fallbackText: 'Unassigned',
    pageNumberBase: 147,
    businessTruncateLimit: 3
  };
  
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  
  const CSS_CLASSES = {
    active: 'active',
    collectionRow: 'collection-row',
    clickableCard: 'clickable-card',
    vendettaCard: 'vendetta-card',
    territoryCard: 'territory-card',
    rosterModalOpen: 'roster-modal-open',
    rosterPlaque: 'roster-plaque',
    commandLine: 'command-line',
    advisoryLine: 'advisory-line',
    vendettaTheme: 'vendetta-theme',
    territoryTheme: 'territory-theme'
  };
  
  let DEBUG = false;
  
  function setDebug(value) {
    DEBUG = !!value;
  }
  
  function getDebug() {
    return DEBUG;
  }
  
  window.CONFIG = {
    DATA_PATHS,
    SELECTORS,
    STATUS_MAPPINGS,
    DISPLAY_TEXT,
    TIMING,
    LAYOUT,
    DEFAULTS,
    SVG_NAMESPACE,
    CSS_CLASSES,
    setDebug,
    getDebug,
    get DEBUG() { return DEBUG; }
  };
  
})();

