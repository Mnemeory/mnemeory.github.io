// App - Consolidated main logic (data loading, rendering, modals)
(function() {
  'use strict';

  // -----------------------
  // Utilities (minimal set)
  // -----------------------

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function debounce(func, wait) {
    let timeoutId = null;
    const debounced = function(...args) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        func.apply(this, args);
      }, wait);
    };
    debounced.cancel = function() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    return debounced;
  }

  const escapeContainer = document.createElement('div');
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    escapeContainer.textContent = String(text);
    return escapeContainer.innerHTML;
  }

  const numberFormatter = typeof Intl !== 'undefined'
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : null;
  function formatMoney(num) {
    const numericValue = Number(num);
    if (!Number.isFinite(numericValue)) return '0';
    if (numberFormatter) return numberFormatter.format(numericValue);
    return numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function normalizeMoneyValue(value) {
    if (typeof value === 'number') return formatMoney(value);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return formatMoney(0);
      const cleaned = trimmed.replace(/[$,]/g, '');
      const numericValue = cleaned ? Number(cleaned) : Number.NaN;
      if (Number.isFinite(numericValue)) return formatMoney(numericValue);
      return escapeHtml(trimmed);
    }
    return formatMoney(0);
  }
  function formatStatus(status, defaultValue) {
    if (!status || typeof status !== 'string') return defaultValue || 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  function formatNameList(names, fallback, separator) {
    const sep = separator !== undefined ? separator : '<br>';
    const fb = fallback !== undefined ? fallback : 'Unassigned';
    const safeFallback = escapeHtml(fb);
    if (names === null || names === undefined) return safeFallback;
    if (Array.isArray(names)) {
      const formatted = names
        .map(name => (typeof name === 'string' || typeof name === 'number') ? escapeHtml(String(name).trim()) : '')
        .filter(Boolean);
      return formatted.length ? formatted.join(sep) : safeFallback;
    }
    if (typeof names === 'string' || typeof names === 'number') {
      const trimmed = String(names).trim();
      return trimmed ? escapeHtml(trimmed) : safeFallback;
    }
    return safeFallback;
  }
  function validateArrayIndex(arr, index) {
    if (!Array.isArray(arr)) return false;
    const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;
    if (isNaN(numIndex)) return false;
    if (numIndex < 0) return false;
    if (numIndex >= arr.length) return false;
    return true;
  }

  // -----------------------
  // Data loading
  // -----------------------

  const LEDGER_FILE = 'assets/data/ledger.json';

  const DISPLAY_TEXT = {
    emptyStates: {
      collections: 'No collections recorded.',
      vendetta: 'No vendettas on record.',
      territory: 'No territory records available.'
    },
    defaults: {
      unknown: 'Unknown',
      notAvailable: 'N/A',
      none: 'None',
      unassigned: 'Unassigned'
    },
    vendettaTypes: {
      blood: 'Blood Debt',
      financial: 'Financial Debt'
    },
    errors: {
      dataLoadFailed: 'Error loading data. Please refresh the page.'
    },
    loading: {
      ledger: 'Loading Ledger Data...'
    }
  };

  const SELECTORS = {
    collectionsBody: 'collections-tbody',
    vendettaContainer: 'vendetta-container',
    territoryContainer: 'territory-container',
    pageNumber: 'page-number',
    familyRosterFrame: 'familyRosterFrame',
    cardModal: 'cardModal',
    cardModalContent: 'cardModalContent',
    sealModal: 'sealModal',
    sealModalImage: 'sealModalImage'
  };

  const CSS_CLASSES = {
    active: 'active',
    vendettaCard: 'vendetta-card',
    territoryCard: 'territory-card',
    clickableCard: 'clickable-card',
    vendettaTheme: 'vendetta-theme',
    territoryTheme: 'territory-theme',
    rosterModalOpen: 'roster-modal-open'
  };

  const state = {
    data: {
      collections: [],
      vendetta: [],
      territory: [],
      familyroster: null
    },
    loadingIndicator: null,
    partialErrorNotice: null,
    partialErrorTimer: null
  };
  window.ledgerData = state.data;

  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${path}: HTTP ${res.status}`);
    return res.json();
  }

  async function loadAllData() {
    try {
      const result = await fetchJson(LEDGER_FILE);
      state.data.collections = Array.isArray(result?.collections) ? result.collections : [];
      state.data.vendetta = Array.isArray(result?.vendetta) ? result.vendetta : [];
      state.data.territory = Array.isArray(result?.territory) ? result.territory : [];
      state.data.familyroster = result && typeof result.familyroster === 'object' ? result.familyroster : null;
    } catch (_) {
      throw new Error(DISPLAY_TEXT.errors.dataLoadFailed);
    }
  }

  // -----------------------
  // Rendering
  // -----------------------

  function clearChildren(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createEmptyNotice(message) {
    const notice = document.createElement('div');
    notice.className = 'empty-state-message';
    notice.textContent = message;
    return notice;
  }

  function renderTableMessage(tbody, message) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '6');
    cell.className = 'text-center';
    cell.textContent = message;
    row.appendChild(cell);
    tbody.appendChild(row);
  }

  function populateCollections() {
    const tbody = document.getElementById(SELECTORS.collectionsBody);
    if (!tbody) return;

    clearChildren(tbody);
    const collections = Array.isArray(state.data.collections) ? state.data.collections : [];
    if (collections.length === 0) {
      renderTableMessage(tbody, DISPLAY_TEXT.emptyStates.collections);
      return;
    }

    const fragment = document.createDocumentFragment();
    collections.forEach(biz => {
      if (!biz) return;
      const row = document.createElement('tr');
      row.className = 'collection-row';
      if (biz.status) row.setAttribute('data-status', biz.status);

      const nightlyFormatted = normalizeMoneyValue(biz.nightly);
      const startDate = escapeHtml(biz.start_date || DISPLAY_TEXT.defaults.notAvailable);

      const businessName = escapeHtml(biz.name || DISPLAY_TEXT.defaults.unknown);
      const businessLocation = escapeHtml(biz.location || DISPLAY_TEXT.defaults.notAvailable);
      const madeBy = escapeHtml(biz.made_by || DISPLAY_TEXT.defaults.unknown);
      const contact = escapeHtml(biz.contact || DISPLAY_TEXT.defaults.notAvailable);
      const notes = escapeHtml(biz.notes || '');

      row.innerHTML = `
        <td class="collection-start">${startDate}</td>
        <td>
          <strong>${businessName}</strong>
          <br>
          <small class="collection-location">${businessLocation}</small>
        </td>
        <td class="numeric collection-nightly">${nightlyFormatted}</td>
        <td class="collection-made">${madeBy}</td>
        <td class="collection-contact">${contact}</td>
        <td class="collection-notes">${notes}</td>
      `;
      fragment.appendChild(row);
    });
    tbody.appendChild(fragment);
  }

  function populateVendetta() {
    const container = document.getElementById(SELECTORS.vendettaContainer);
    if (!container) return;
    clearChildren(container);

    const vendettas = Array.isArray(state.data.vendetta) ? state.data.vendetta : [];
    if (vendettas.length === 0) {
      container.appendChild(createEmptyNotice(DISPLAY_TEXT.emptyStates.vendetta));
      return;
    }

    const fragment = document.createDocumentFragment();
    const baseClass = [CSS_CLASSES.vendettaCard, CSS_CLASSES.clickableCard].join(' ');
    vendettas.forEach((vendetta, index) => {
      if (!vendetta) return;
      const card = document.createElement('div');
      card.className = baseClass;
      card.setAttribute('data-card-type', 'vendetta');
      card.setAttribute('data-card-index', String(index));
      if (vendetta.type) card.setAttribute('data-type', vendetta.type);
      if (vendetta.status) card.setAttribute('data-status', vendetta.status);

      const typeText = DISPLAY_TEXT.vendettaTypes[vendetta.type] || DISPLAY_TEXT.vendettaTypes.financial || '';
      const statusDisplay = formatStatus(vendetta.status, DISPLAY_TEXT.defaults.unknown);
      const vendettaTypeClass = vendetta.type ? vendetta.type : 'financial';

      const name = escapeHtml(vendetta.name || DISPLAY_TEXT.defaults.unknown);
      const nickname = vendetta.nickname ? ` "${escapeHtml(vendetta.nickname)}"` : '';
      const authorizationText = vendetta.authorized_by || DISPLAY_TEXT.defaults.unknown;

      const detailRows = `
        <div class="card-detail-row">
          <span class="label">Status:</span>
          <span class="value">${escapeHtml(statusDisplay)}</span>
        </div>
        <div class="card-detail-row">
          <span class="label">Authorization:</span>
          <span class="value made-name">${escapeHtml(authorizationText)}</span>
        </div>`;

      card.innerHTML = `
        <div class="vendetta-type ${vendettaTypeClass}">
          ${typeText}
        </div>
        <div class="vendetta-target">
          <h4 class="target-name">${name}${nickname}</h4>
        </div>
        <div class="card-preview">
          ${detailRows}
        </div>
      `;
      fragment.appendChild(card);
    });
    container.appendChild(fragment);
  }

  function populateTerritory() {
    const container = document.getElementById(SELECTORS.territoryContainer);
    if (!container) return;
    clearChildren(container);

    const territories = Array.isArray(state.data.territory) ? state.data.territory : [];
    if (territories.length === 0) {
      container.appendChild(createEmptyNotice(DISPLAY_TEXT.emptyStates.territory));
      return;
    }

    const fragment = document.createDocumentFragment();
    const baseClass = [CSS_CLASSES.territoryCard, CSS_CLASSES.clickableCard].join(' ');
    const truncateLimit = 3;

    territories.forEach((territory, index) => {
      if (!territory) return;
      const card = document.createElement('div');
      card.className = baseClass;
      card.setAttribute('data-card-type', 'territory');
      card.setAttribute('data-card-index', String(index));
      if (territory.status) card.setAttribute('data-status', territory.status);

      let businessesDisplay = '';
      if (Array.isArray(territory.businesses) && truncateLimit > 0 && territory.businesses.length > truncateLimit) {
        const firstN = territory.businesses.slice(0, truncateLimit);
        const remaining = territory.businesses.length - truncateLimit;
        const firstNDisplay = formatNameList(firstN, DISPLAY_TEXT.defaults.none);
        businessesDisplay = `${firstNDisplay}<br><span class="more-indicator">and ${escapeHtml(remaining)}</span>`;
      } else {
        businessesDisplay = formatNameList(territory.businesses, DISPLAY_TEXT.defaults.none);
      }

      const territoryName = escapeHtml(territory.name || DISPLAY_TEXT.defaults.unknown);
      const territoryStatus = escapeHtml(territory.status || DISPLAY_TEXT.defaults.unknown);

      card.innerHTML = `
        <h4 class="territory-name">${territoryName}</h4>
        <div class="territory-status">${territoryStatus}</div>
        <div class="territory-businesses">${businessesDisplay}</div>
      `;
      fragment.appendChild(card);
    });
    container.appendChild(fragment);
  }

  function updateDynamicElements() {
    const pageNumber = document.getElementById(SELECTORS.pageNumber);
    if (!pageNumber) return;
    const base = 147;
    const collectionCount = Array.isArray(state.data.collections) ? state.data.collections.length : 0;
    pageNumber.textContent = `Page ${base + collectionCount}`;
  }

  // -----------------------
  // Error and loading UI
  // -----------------------

  function showLoadingState() {
    if (state.loadingIndicator || !document.body) return;
    const el = document.createElement('div');
    el.id = 'loading-indicator';
    el.className = 'feedback-notice loading-state';
    el.textContent = DISPLAY_TEXT.loading.ledger;
    document.body.appendChild(el);
    state.loadingIndicator = el;
  }
  function hideLoadingState() {
    if (state.loadingIndicator && state.loadingIndicator.parentNode) {
      state.loadingIndicator.parentNode.removeChild(state.loadingIndicator);
      state.loadingIndicator = null;
    }
  }
  function showPartialLoadErrors(errors) {
    if (!errors || errors.length === 0) return;
    const errorMessage = errors.map(e => `${e.file}: ${e.error}`).join('\n');
    if (!document.body) return;
    if (!state.partialErrorNotice) {
      state.partialErrorNotice = document.createElement('div');
      state.partialErrorNotice.className = 'feedback-notice error-notice';
      const title = document.createElement('div');
      title.className = 'error-title';
      title.textContent = 'Warning: Some data failed to load';
      const details = document.createElement('div');
      details.className = 'error-details';
      state.partialErrorNotice.appendChild(title);
      state.partialErrorNotice.appendChild(details);
      document.body.appendChild(state.partialErrorNotice);
    }
    const detailsNode = state.partialErrorNotice.querySelector('.error-details');
    if (detailsNode) detailsNode.textContent = errorMessage;
    if (state.partialErrorTimer) clearTimeout(state.partialErrorTimer);
    state.partialErrorTimer = setTimeout(() => {
      if (state.partialErrorNotice && state.partialErrorNotice.parentNode) {
        state.partialErrorNotice.parentNode.removeChild(state.partialErrorNotice);
      }
      state.partialErrorNotice = null;
      state.partialErrorTimer = null;
    }, 10000);
  }

  // -----------------------
  // Cross-frame comms
  // -----------------------

  function shareDataWithIframe() {
    const rosterFrame = document.getElementById(SELECTORS.familyRosterFrame);
    if (!rosterFrame || !rosterFrame.contentWindow) return;
    const postUpdate = () => {
      try {
        rosterFrame.contentWindow.postMessage({
          action: 'dataUpdate',
          ledgerData: cloneLedgerData()
        }, '*');
      } catch (error) {
        console.error('Failed to postMessage to roster frame:', error);
      }
    };
    // Post immediately (may hit about:blank) and again after the iframe loads roster.html
    postUpdate();
    rosterFrame.addEventListener('load', postUpdate, { once: true });
  }

  function cloneLedgerData() {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(state.data);
      } catch (_) {}
    }
    return JSON.parse(JSON.stringify(state.data));
  }

  // -----------------------
  // Modals & interactions
  // -----------------------

  function openCardModal(cardType, index) {
    const cardModal = document.getElementById(SELECTORS.cardModal);
    const cardModalContent = document.getElementById(SELECTORS.cardModalContent);
    const data = state.data;
    if (!cardModal || !cardModalContent || !data) return;

    const modalContainer = cardModalContent.parentElement;
    if (modalContainer) {
      modalContainer.classList.remove(CSS_CLASSES.vendettaTheme, CSS_CLASSES.territoryTheme, 'paper-card', 'manila-card');
    }

    let content = '';
    if (cardType === 'vendetta' && Array.isArray(data.vendetta) && validateArrayIndex(data.vendetta, index)) {
      const vendetta = data.vendetta[index];
      if (!vendetta) return;

      const typeText = DISPLAY_TEXT.vendettaTypes[vendetta.type] || DISPLAY_TEXT.vendettaTypes.financial || '';
      const statusDisplay = formatStatus(vendetta.status, DISPLAY_TEXT.defaults.unknown);

      const detailRowsHtml = `
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value">${escapeHtml(statusDisplay)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Offense:</span>
          <span class="value">${escapeHtml(vendetta.offense || 'Not specified')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Last Seen:</span>
          <span class="value">${escapeHtml(vendetta.last_seen || 'Unknown')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Known Associates:</span>
          <span class="value">${escapeHtml(vendetta.associates || 'None')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Authorization:</span>
          <span class="value made-name">${escapeHtml(vendetta.authorized_by || 'Unknown')}</span>
        </div>`;

      content = `
        <div class="modal-card-header">
          <span class="vendetta-type ${vendetta.type || 'financial'}">${typeText}</span>
          <h3 class="modal-card-title">${escapeHtml(vendetta.name || 'Unknown')}${vendetta.nickname ? ` "${escapeHtml(vendetta.nickname)}"` : ''}</h3>
        </div>
        <div class="modal-card-body">
          ${detailRowsHtml}
        </div>
      `;
      if (modalContainer) modalContainer.classList.add(CSS_CLASSES.vendettaTheme, 'paper-card');
    } else if (cardType === 'territory' && Array.isArray(data.territory) && validateArrayIndex(data.territory, index)) {
      const territory = data.territory[index];
      if (!territory) return;

      const assignedCrew = territory.assigned_crew || {};
      const sortCrewList = list => {
        if (!Array.isArray(list)) return [];
        return list
          .slice()
          .filter(member => typeof member === 'string' || typeof member === 'number')
          .map(member => String(member).trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      };
      const sortedCapo = sortCrewList(assignedCrew.capo);
      const sortedSquadra = sortCrewList(assignedCrew.la_squadra);
      const sortedFamiglia = sortCrewList(assignedCrew.la_famiglia);

      const renderCrewGroup = (label, names, fallback, modifier) => {
        const safeFallback = escapeHtml(fallback);
        if (!Array.isArray(names) || names.length === 0) {
          return `
            <div class="crew-group crew-group-${modifier} crew-group-single crew-group-empty">
              <span class="crew-role">${label}</span>
              <span class="crew-names crew-names-single">${safeFallback}</span>
            </div>
          `;
        }
        if (names.length === 1) {
          return `
            <div class="crew-group crew-group-${modifier} crew-group-single">
              <span class="crew-role">${label}</span>
              <span class="crew-names crew-names-single">${escapeHtml(names[0])}</span>
            </div>
          `;
        }
        const namesHtml = names.map(name => `<span class="crew-name">${escapeHtml(name)}</span>`).join('');
        return `
          <div class="crew-group crew-group-${modifier} crew-group-multiple">
            <span class="crew-role">${label}</span>
            <div class="crew-names crew-names-multiple">
              ${namesHtml}
            </div>
          </div>
        `;
      };

      const capoGroup = renderCrewGroup('Capo:', sortedCapo, DISPLAY_TEXT.defaults.unassigned, 'capo');
      const squadraGroup = renderCrewGroup('La Squadra:', sortedSquadra, DISPLAY_TEXT.defaults.unassigned, 'squadra');
      const famigliaGroup = renderCrewGroup('La Famiglia:', sortedFamiglia, DISPLAY_TEXT.defaults.none, 'famiglia');
      const businessesHtml = formatNameList(territory.businesses, DISPLAY_TEXT.defaults.none);

      const businessRow = `
        <div class="detail-row">
          <span class="label">Businesses:</span>
          <span class="value">${businessesHtml}</span>
        </div>`;
      const notesRow = territory.notes ? `
        <div class="detail-row notes">
          <span class="label">Notes:</span>
          <span class="value">${escapeHtml(territory.notes)}</span>
        </div>` : '';

      content = `
        <div class="modal-card-header">
          <h3 class="modal-card-title">${escapeHtml(territory.name || 'Unknown Territory')}</h3>
          <div class="territory-status">Status: ${escapeHtml(territory.status || 'Unknown')}</div>
        </div>
        <div class="modal-card-body">
          <div class="detail-row">
            <span class="label">Assigned Crew:</span>
            <div class="value assigned-crew">
              ${capoGroup}
              ${squadraGroup}
              ${famigliaGroup}
            </div>
          </div>
          ${businessRow}
          ${notesRow}
        </div>
      `;
      if (modalContainer) modalContainer.classList.add(CSS_CLASSES.territoryTheme, 'manila-card');
    }

    cardModalContent.innerHTML = content;
    cardModal.classList.add(CSS_CLASSES.active);
    document.body.classList.add('modal-open');
  }

  function closeCardModal() {
    const cardModal = document.getElementById(SELECTORS.cardModal);
    if (cardModal) {
      cardModal.classList.remove(CSS_CLASSES.active);
      document.body.classList.remove('modal-open');
    }
    const cardModalContent = document.getElementById(SELECTORS.cardModalContent);
    if (cardModalContent) {
      cardModalContent.innerHTML = '';
    }
  }

  function openFamilyRosterModal() {
    const frame = document.getElementById(SELECTORS.familyRosterFrame);
    if (!frame) return;
    frame.classList.add(CSS_CLASSES.active);
    document.body.classList.add(CSS_CLASSES.rosterModalOpen);
    document.body.classList.add('modal-open');
    // Ensure the iframe has fresh data when opened
    shareDataWithIframe();
    if (frame.contentWindow) frame.contentWindow.postMessage({ action: 'populate' }, '*');
  }
  function closeFamilyRosterModal() {
    const frame = document.getElementById(SELECTORS.familyRosterFrame);
    if (!frame) return;
    frame.classList.remove(CSS_CLASSES.active);
    document.body.classList.remove(CSS_CLASSES.rosterModalOpen);
    document.body.classList.remove('modal-open');
  }

  function bindInteractions() {
    const rosterBtn = document.querySelector('.family-roster-button');
    if (rosterBtn) {
      rosterBtn.addEventListener('click', openFamilyRosterModal);
    }

    const sealModal = document.getElementById(SELECTORS.sealModal);
    if (sealModal) {
      sealModal.addEventListener('click', () => {
        sealModal.classList.remove(CSS_CLASSES.active);
        document.body.classList.remove('modal-open');
        const img = document.getElementById(SELECTORS.sealModalImage);
        if (img) img.removeAttribute('src');
      });
      const sealContent = sealModal.querySelector('.seal-modal-content');
      if (sealContent) {
        sealContent.addEventListener('click', e => e.stopPropagation());
      }
    }

    const cardModal = document.getElementById(SELECTORS.cardModal);
    if (cardModal) {
      cardModal.addEventListener('click', closeCardModal);
      const cardContent = document.getElementById(SELECTORS.cardModalContent);
      if (cardContent) {
        cardContent.addEventListener('click', e => e.stopPropagation());
      }
    }

    document.addEventListener('click', function(e) {
      if (!e.target) return;
      const vendettaCard = e.target.closest(`.${CSS_CLASSES.vendettaCard}[data-card-type="vendetta"]`);
      if (vendettaCard) {
        const index = parseInt(vendettaCard.dataset.cardIndex, 10);
        if (!isNaN(index)) openCardModal('vendetta', index);
        return;
      }
      const territoryCard = e.target.closest(`.${CSS_CLASSES.territoryCard}[data-card-type="territory"]`);
      if (territoryCard) {
        const index = parseInt(territoryCard.dataset.cardIndex, 10);
        if (!isNaN(index)) openCardModal('territory', index);
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeCardModal();
        closeFamilyRosterModal();
      }
    });

    window.addEventListener('message', function(event) {
      if (event.data && event.data.action === 'closeRoster') {
        closeFamilyRosterModal();
      }
    });
  }

  // -----------------------
  // Init
  // -----------------------

  async function init() {
    showLoadingState();
    try {
      await loadAllData();
      populateCollections();
      populateVendetta();
      populateTerritory();
      updateDynamicElements();
      shareDataWithIframe();
    } catch (error) {
      const tbody = document.getElementById(SELECTORS.collectionsBody);
      if (tbody) {
        clearChildren(tbody);
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.setAttribute('colspan', '6');
        cell.className = 'text-center';
        cell.style.color = 'var(--ink-redpen)';
        cell.style.padding = '20px';
        cell.textContent = error && error.message ? error.message : DISPLAY_TEXT.errors.dataLoadFailed;
        row.appendChild(cell);
        tbody.appendChild(row);
      }
    } finally {
      hideLoadingState();
    }
  }

  onReady(() => {
    bindInteractions();
    init();
  });
})();


