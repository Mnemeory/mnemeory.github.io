// Data Loader

(function() {
  'use strict';

  const config = window.CONFIG || {};
  const dataPaths = config.DATA_PATHS || {};
  const utils = window.utils || {};
  const domCache = typeof utils.domCache === 'object' ? utils.domCache : null;
  const selectors = config.SELECTORS || {};
  const cssClasses = config.CSS_CLASSES || {};
  const displayText = config.DISPLAY_TEXT || {};
  const statusMappings = config.STATUS_MAPPINGS || {};
  const defaults = config.DEFAULTS || {};
  const timing = config.TIMING || {};

  const escapeHtml = typeof utils.escapeHtml === 'function'
    ? utils.escapeHtml
    : (value => String(value ?? ''));
  const normalizeMoneyValue = typeof utils.normalizeMoneyValue === 'function'
    ? utils.normalizeMoneyValue
    : (value => (value == null ? '' : String(value)));
  const formatStatus = typeof utils.formatStatus === 'function'
    ? utils.formatStatus
    : ((status, defaultValue) => status || defaultValue || '');
  const formatNameList = typeof utils.formatNameList === 'function'
    ? utils.formatNameList
    : (names => Array.isArray(names) ? names.join(', ') : String(names ?? ''));
  const validateArrayIndex = typeof utils.validateArrayIndex === 'function'
    ? utils.validateArrayIndex
    : (() => false);

  const resourceDefinitions = [
    { key: 'collections', path: dataPaths.collections, fallback: [] },
    { key: 'vendetta', path: dataPaths.vendetta, fallback: [] },
    { key: 'territory', path: dataPaths.territory, fallback: [] },
    { key: 'familyroster', path: dataPaths.familyroster, fallback: null }
  ];

  const data = {
    collections: [],
    vendetta: [],
    territory: [],
    familyroster: null
  };

  window.ledgerData = data;

  let loadingIndicator = null;
  let partialErrorNotice = null;
  let partialErrorTimer = null;

  if (typeof utils.onReady === 'function') {
    utils.onReady(init);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  
  async function init() {
    showLoadingState();

    try {
      await loadAllData();
      populatePage();
      updateDynamicElements();
    } catch (error) {
      if (config.DEBUG) console.error('Error loading data:', error);
      showError(error);
    } finally {
      hideLoadingState();
    }
  }
  
  async function loadAllData() {
    const errors = [];

    const results = (window.yamlLoader && typeof window.yamlLoader.loadResources === 'function')
      ? await window.yamlLoader.loadResources(resourceDefinitions)
      : await Promise.allSettled(resourceDefinitions.map(resource => fetch(resource.path).then(r => r.text()).then(t => jsyaml.load(t))));

    results.forEach((result, index) => {
      const resource = resourceDefinitions[index];
      const fallback = resource.fallback;
      const fileName = (window.yamlLoader && typeof window.yamlLoader.getFileName === 'function')
        ? window.yamlLoader.getFileName(resource.path)
        : (typeof resource.path === 'string' ? (resource.path.split('/').pop() || `${resource.key}.yml`) : `${resource.key}.yml`);

      if (result.status === 'fulfilled') {
        data[resource.key] = result.value ?? fallback;
        return;
      }

      data[resource.key] = fallback;
      errors.push({
        file: fileName,
        error: result.reason && result.reason.message ? result.reason.message : 'Unknown error'
      });

      if (config.DEBUG) console.error(`Failed to load ${resource.key}:`, result.reason);
    });

    if (errors.length === resourceDefinitions.length) {
      throw new Error(displayText.errors?.dataLoadFailed || 'Error loading data.');
    }

    if (errors.length > 0) {
      showPartialLoadErrors(errors);
    }
  }

  function populatePage() {
    populateCollections();
    populateVendetta();
    populateTerritory();

    shareDataWithIframe();
  }

  function clearChildren(element) {
    if (!element) {
      return;
    }
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
  
  function shareDataWithIframe() {
    const rosterFrame = domCache ? domCache.get(`#${selectors.familyRosterFrame}`) : document.getElementById(selectors.familyRosterFrame);
    if (!rosterFrame || !rosterFrame.contentWindow) {
      return;
    }

    const postUpdate = () => {
      try {
        rosterFrame.contentWindow.postMessage({
          action: 'dataUpdate',
          ledgerData: cloneLedgerData()
        }, '*');
      } catch (error) {
        if (config.DEBUG) console.error('Failed to postMessage to roster frame:', error);
      }
    };

    if (rosterFrame.contentDocument && rosterFrame.contentDocument.readyState === 'complete') {
      postUpdate();
      return;
    }

    rosterFrame.addEventListener('load', postUpdate, { once: true });
  }

  function cloneLedgerData() {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(data);
      } catch (error) {
        if (config.DEBUG) console.warn('structuredClone failed, falling back to JSON clone.', error);
      }
    }

    return JSON.parse(JSON.stringify(data));
  }
  
  function populateCollections() {
    const tbody = domCache ? domCache.get(`#${selectors.collectionsBody}`) : document.getElementById(selectors.collectionsBody);
    if (!tbody) {
      return;
    }

    clearChildren(tbody);

    const collections = Array.isArray(data.collections) ? data.collections : [];
    if (collections.length === 0) {
      renderTableMessage(tbody, displayText.emptyStates?.collections || 'No collections recorded.');
      return;
    }

    const fragment = document.createDocumentFragment();

    collections.forEach(biz => {
      if (!biz) {
        return;
      }

      const row = document.createElement('tr');
      row.className = cssClasses.collectionRow || '';

      if (biz.status) {
        row.setAttribute('data-status', biz.status);
      }

      const nightlyFormatted = normalizeMoneyValue(biz.nightly);
      const startDate = escapeHtml(biz.start_date || displayText.defaults?.notAvailable || '');
      const statusMapping = statusMappings.collections || {};
      const statusText = statusMapping[biz.status] || (typeof biz.status === 'string' ? biz.status.toUpperCase() : 'UNKNOWN');

      row.setAttribute('data-status-text', statusText);

      const businessName = escapeHtml(biz.name || displayText.defaults?.unknown || '');
      const businessLocation = escapeHtml(biz.location || displayText.defaults?.notAvailable || '');
      const madeBy = escapeHtml(biz.made_by || displayText.defaults?.unknown || '');
      const contact = escapeHtml(biz.contact || displayText.defaults?.notAvailable || '');
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
    const container = domCache ? domCache.get(`#${selectors.vendettaContainer}`) : document.getElementById(selectors.vendettaContainer);
    if (!container) {
      return;
    }

    clearChildren(container);

    const vendettas = Array.isArray(data.vendetta) ? data.vendetta : [];
    if (vendettas.length === 0) {
      container.appendChild(createEmptyNotice(displayText.emptyStates?.vendetta || 'No vendettas on record.'));
      return;
    }

    const fragment = document.createDocumentFragment();
    const baseClass = [cssClasses.vendettaCard, cssClasses.clickableCard]
      .filter(Boolean)
      .join(' ');

    vendettas.forEach((vendetta, index) => {
      if (!vendetta) {
        return;
      }

      const card = document.createElement('div');
      card.className = baseClass;
      card.setAttribute('data-card-type', 'vendetta');
      card.setAttribute('data-card-index', String(index));

      if (vendetta.type) {
        card.setAttribute('data-type', vendetta.type);
      }
      if (vendetta.status) {
        card.setAttribute('data-status', vendetta.status);
      }

      const typeText = displayText.vendettaTypes?.[vendetta.type] || displayText.vendettaTypes?.financial || '';
      const statusDisplay = formatStatus(vendetta.status, displayText.defaults?.unknown || '');
      const vendettaTypeClass = vendetta.type ? vendetta.type : 'financial';

      const name = escapeHtml(vendetta.name || displayText.defaults?.unknown || '');
      const nickname = escapeHtml(vendetta.nickname || '');
      const authorization = escapeHtml(vendetta.authorized_by || displayText.defaults?.unknown || '');
      const authorizationText = vendetta.authorized_by || displayText.defaults?.unknown || '';

      const detailRows = (utils && typeof utils.renderDetailRows === 'function')
        ? utils.renderDetailRows(
            [
              { label: 'Status:', value: statusDisplay, rowClass: 'card-detail-row' },
              { label: 'Authorization:', value: authorizationText, rowClass: 'card-detail-row', valueClass: 'value made-name' }
            ],
            { rowClass: 'card-detail-row', labelClass: 'label', valueClass: 'value' }
          )
        : `
          <div class="card-detail-row">
            <span class="label">Status:</span>
            <span class="value">${escapeHtml(statusDisplay)}</span>
          </div>
          <div class="card-detail-row">
            <span class="label">Authorization:</span>
            <span class="value made-name">${authorization}</span>
          </div>`;

      card.innerHTML = `
        <div class="vendetta-type ${vendettaTypeClass}">
          ${typeText}
        </div>

        <div class="vendetta-target">
          <h4 class="target-name">${name}${nickname ? ` "${nickname}"` : ''}</h4>
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
    const container = domCache ? domCache.get(`#${selectors.territoryContainer}`) : document.getElementById(selectors.territoryContainer);
    if (!container) {
      return;
    }

    clearChildren(container);

    const territories = Array.isArray(data.territory) ? data.territory : [];
    if (territories.length === 0) {
      container.appendChild(createEmptyNotice(displayText.emptyStates?.territory || 'No territory records available.'));
      return;
    }

    const fragment = document.createDocumentFragment();
    const baseClass = [cssClasses.territoryCard, cssClasses.clickableCard]
      .filter(Boolean)
      .join(' ');
    const truncateLimit = typeof defaults.businessTruncateLimit === 'number'
      ? defaults.businessTruncateLimit
      : 0;

    territories.forEach((territory, index) => {
      if (!territory) {
        return;
      }

      const card = document.createElement('div');
      card.className = baseClass;
      card.setAttribute('data-card-type', 'territory');
      card.setAttribute('data-card-index', String(index));

      if (territory.status) {
        card.setAttribute('data-status', territory.status);
      }

      let businessesDisplay = '';
      if (Array.isArray(territory.businesses) && truncateLimit > 0 && territory.businesses.length > truncateLimit) {
        const firstN = territory.businesses.slice(0, truncateLimit);
        const remaining = territory.businesses.length - truncateLimit;
        const firstNDisplay = formatNameList(firstN, displayText.defaults?.none);
        businessesDisplay = `${firstNDisplay}<br><span class="more-indicator">and ${escapeHtml(remaining)}</span>`;
      } else {
        businessesDisplay = formatNameList(territory.businesses, displayText.defaults?.none);
      }

      const territoryName = escapeHtml(territory.name || displayText.defaults?.unknown || '');
      const territoryStatus = escapeHtml(territory.status || displayText.defaults?.unknown || '');

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
    const pageNumber = domCache ? domCache.get(`#${selectors.pageNumber}`) : document.getElementById(selectors.pageNumber);
    if (!pageNumber) {
      return;
    }

    const base = typeof defaults.pageNumberBase === 'number' ? defaults.pageNumberBase : 0;
    const collectionCount = Array.isArray(data.collections) ? data.collections.length : 0;
    pageNumber.textContent = `Page ${base + collectionCount}`;
  }
  
  function showError(error) {
    const tbody = document.getElementById(selectors.collectionsBody);
    if (!tbody) {
      return;
    }

    clearChildren(tbody);

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '6');
    cell.className = 'text-center';
    cell.style.color = 'var(--ink-redpen)';
    cell.style.padding = '20px';
    cell.textContent = error && error.message
      ? error.message
      : (displayText.errors?.dataLoadFailed || 'Error loading data.');
    row.appendChild(cell);
    tbody.appendChild(row);
  }

  function showPartialLoadErrors(errors) {
    if (!errors || errors.length === 0) {
      return;
    }

    const errorMessage = errors.map(e => `${e.file}: ${e.error}`).join('\n');

    if (!document.body) {
      return;
    }

    if (!partialErrorNotice) {
      partialErrorNotice = document.createElement('div');
      partialErrorNotice.className = 'feedback-notice error-notice';

      const title = document.createElement('div');
      title.className = 'error-title';
      title.textContent = 'Warning: Some data failed to load';

      const details = document.createElement('div');
      details.className = 'error-details';

      partialErrorNotice.appendChild(title);
      partialErrorNotice.appendChild(details);
      document.body.appendChild(partialErrorNotice);
    }

    const detailsNode = partialErrorNotice.querySelector('.error-details');
    if (detailsNode) {
      detailsNode.textContent = errorMessage;
    }

    if (partialErrorTimer) {
      clearTimeout(partialErrorTimer);
    }

    partialErrorTimer = setTimeout(() => {
      if (partialErrorNotice && partialErrorNotice.parentNode) {
        partialErrorNotice.parentNode.removeChild(partialErrorNotice);
      }
      partialErrorNotice = null;
      partialErrorTimer = null;
    }, timing.errorNoticeTimeout || 10000);
  }

  function showLoadingState() {
    if (loadingIndicator || !document.body) {
      return;
    }

    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'feedback-notice loading-state';
    loadingIndicator.textContent = displayText.loading?.ledger || 'Loading...';
    document.body.appendChild(loadingIndicator);
  }

  function hideLoadingState() {
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
      loadingIndicator = null;
    }
  }
  
})();

