// Data Loader

(function() {
  'use strict';
  
  const data = {
    collections: [],
    vendetta: [],
    territory: [],
    familyroster: null
  };
  
  window.ledgerData = data;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  async function init() {
    try {
      showLoadingState();
      
      await loadAllData();
      
      hideLoadingState();
      
      populatePage();
      updateDynamicElements();
    } catch (error) {
      if (window.CONFIG.DEBUG) console.error('Error loading data:', error);
      hideLoadingState();
      showError();
    }
  }
  
  async function loadAllData() {
    const errors = [];
    
    try {
      data.collections = await fetchYAML(window.CONFIG.DATA_PATHS.collections);
    } catch (error) {
      errors.push({ file: 'collections.yml', error: error.message });
      data.collections = [];
      if (window.CONFIG.DEBUG) console.error('Failed to load collections:', error);
    }
    
    try {
      data.vendetta = await fetchYAML(window.CONFIG.DATA_PATHS.vendetta);
    } catch (error) {
      errors.push({ file: 'vendetta.yml', error: error.message });
      data.vendetta = [];
      if (window.CONFIG.DEBUG) console.error('Failed to load vendetta:', error);
    }
    
    try {
      data.territory = await fetchYAML(window.CONFIG.DATA_PATHS.territory);
    } catch (error) {
      errors.push({ file: 'territory.yml', error: error.message });
      data.territory = [];
      if (window.CONFIG.DEBUG) console.error('Failed to load territory:', error);
    }
    
    try {
      data.familyroster = await fetchYAML(window.CONFIG.DATA_PATHS.familyroster);
    } catch (error) {
      errors.push({ file: 'familyroster.yml', error: error.message });
      data.familyroster = null;
      if (window.CONFIG.DEBUG) console.error('Failed to load familyroster:', error);
    }
    
    if (errors.length > 0) {
      showPartialLoadErrors(errors);
    }
  }
  
  async function fetchYAML(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: HTTP ${response.status}`);
      }
      const text = await response.text();
      
      try {
        return jsyaml.load(text);
      } catch (yamlError) {
        throw new Error(`Invalid YAML syntax in ${path}: ${yamlError.message}`);
      }
    } catch (error) {
      if (window.CONFIG.DEBUG) console.error(`Error loading ${path}:`, error);
      throw error;
    }
  }
  
  function populatePage() {
    populateCollections();
    populateVendetta();
    populateTerritory();
    
    shareDataWithIframe();
  }
  
  function shareDataWithIframe() {
    const rosterFrame = document.getElementById(window.CONFIG.SELECTORS.familyRosterFrame);
    if (rosterFrame && rosterFrame.contentWindow) {
      if (rosterFrame.contentDocument && rosterFrame.contentDocument.readyState === 'complete') {
        rosterFrame.contentWindow.postMessage({
          action: 'dataUpdate',
          ledgerData: data
        }, '*');
      } else {
        rosterFrame.addEventListener('load', function() {
          rosterFrame.contentWindow.postMessage({
            action: 'dataUpdate',
            ledgerData: data
          }, '*');
        }, { once: true });
      }
    }
  }
  
  function populateCollections() {
    const tbody = document.getElementById(window.CONFIG.SELECTORS.collectionsBody);
    if (!tbody) return;
    
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    
    if (!data.collections || !Array.isArray(data.collections) || !data.collections.length) return;
    
    data.collections.forEach(biz => {
      if (!biz) return;
      const row = document.createElement('tr');
      row.className = window.CONFIG.CSS_CLASSES.collectionRow;
      row.setAttribute('data-status', biz.status);
      
      const nightlyFormatted = window.utils.normalizeMoneyValue(biz.nightly);
      const startDate = window.utils.escapeHtml(biz.start_date || window.CONFIG.DISPLAY_TEXT.defaults.notAvailable);
      
      const statusMapping = window.CONFIG.STATUS_MAPPINGS.collections;
      let statusText = statusMapping[biz.status] || (typeof biz.status === 'string' ? biz.status.toUpperCase() : 'UNKNOWN');
      
      row.setAttribute('data-status-text', statusText);
      
      row.innerHTML = `
        <td class="collection-start">${startDate}</td>
        <td>
          <strong>${window.utils.escapeHtml(biz.name)}</strong>
          <br>
          <small class="collection-location">${window.utils.escapeHtml(biz.location)}</small>
        </td>
        <td class="numeric collection-nightly">${nightlyFormatted}</td>
        <td class="collection-made">${window.utils.escapeHtml(biz.made_by || window.CONFIG.DISPLAY_TEXT.defaults.unknown)}</td>
        <td class="collection-contact">${window.utils.escapeHtml(biz.contact || window.CONFIG.DISPLAY_TEXT.defaults.notAvailable)}</td>
        <td class="collection-notes">${window.utils.escapeHtml(biz.notes || '')}</td>
      `;
      
      tbody.appendChild(row);
    });
  }
  
  function populateVendetta() {
    const container = document.getElementById(window.CONFIG.SELECTORS.vendettaContainer);
    if (!container || !data.vendetta || !Array.isArray(data.vendetta) || !data.vendetta.length) return;
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    data.vendetta.forEach((vendetta, index) => {
      if (!vendetta) return;
      const card = document.createElement('div');
      card.className = `${window.CONFIG.CSS_CLASSES.vendettaCard} ${window.CONFIG.CSS_CLASSES.clickableCard}`;
      card.setAttribute('data-type', vendetta.type);
      card.setAttribute('data-status', vendetta.status);
      card.setAttribute('data-card-type', 'vendetta');
      card.setAttribute('data-card-index', index);
      
      const typeText = window.CONFIG.DISPLAY_TEXT.vendettaTypes[vendetta.type] || window.CONFIG.DISPLAY_TEXT.vendettaTypes.financial;
      
      const statusDisplay = window.utils && window.utils.formatStatus
        ? window.utils.formatStatus(vendetta.status, window.CONFIG.DISPLAY_TEXT.defaults.unknown)
        : (vendetta.status || window.CONFIG.DISPLAY_TEXT.defaults.unknown);
      
      card.innerHTML = `
        <div class="vendetta-type ${vendetta.type}">
          ${typeText}
        </div>
        
        <div class="vendetta-target">
          <h4 class="target-name">${window.utils.escapeHtml(vendetta.name)} "${window.utils.escapeHtml(vendetta.nickname)}"</h4>
        </div>
        
        <div class="card-preview">
          <div class="card-detail-row">
            <span class="label">Status:</span>
            <span class="value">${window.utils.escapeHtml(statusDisplay)}</span>
          </div>
          <div class="card-detail-row">
            <span class="label">Authorization:</span>
            <span class="value made-name">${window.utils.escapeHtml(vendetta.authorized_by)}</span>
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
  }
  
  function populateTerritory() {
    const container = document.getElementById(window.CONFIG.SELECTORS.territoryContainer);
    if (!container || !data.territory || !Array.isArray(data.territory) || !data.territory.length) return;
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    data.territory.forEach((territory, index) => {
      if (!territory) return;
      const card = document.createElement('div');
      card.className = `${window.CONFIG.CSS_CLASSES.territoryCard} ${window.CONFIG.CSS_CLASSES.clickableCard}`;
      card.setAttribute('data-status', territory.status);
      card.setAttribute('data-card-type', 'territory');
      card.setAttribute('data-card-index', index);
      
      let businessesDisplay;
      const truncateLimit = window.CONFIG.DEFAULTS.businessTruncateLimit;
      if (Array.isArray(territory.businesses) && territory.businesses.length > truncateLimit) {
        const firstN = territory.businesses.slice(0, truncateLimit);
        const remaining = territory.businesses.length - truncateLimit;
        const firstNDisplay = window.utils.formatNameList(firstN, window.CONFIG.DISPLAY_TEXT.defaults.none);
        businessesDisplay = `${firstNDisplay}<br><span class="more-indicator">and ${remaining} more...</span>`;
      } else {
        businessesDisplay = window.utils.formatNameList(territory.businesses, window.CONFIG.DISPLAY_TEXT.defaults.none);
      }
      
      card.innerHTML = `
        <h4 class="territory-name">${window.utils.escapeHtml(territory.name)}</h4>
        
        <div class="territory-status">${window.utils.escapeHtml(territory.status)}</div>

        <div class="territory-businesses">${businessesDisplay}</div>
      `;
      
      container.appendChild(card);
    });
  }
  
  function updateDynamicElements() {
    const pageNumber = document.getElementById(window.CONFIG.SELECTORS.pageNumber);
    if (pageNumber && data.collections) {
      pageNumber.textContent = 'Page ' + (data.collections.length + window.CONFIG.DEFAULTS.pageNumberBase);
    }
  }
  
  function showError() {
    const tbody = document.getElementById(window.CONFIG.SELECTORS.collectionsBody);
    if (tbody) {
      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }
      
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.setAttribute('colspan', '6');
      cell.className = 'text-center';
      cell.style.color = 'var(--ink-redpen)';
      cell.style.padding = '20px';
      cell.textContent = window.CONFIG.DISPLAY_TEXT.errors.dataLoadFailed;
      row.appendChild(cell);
      tbody.appendChild(row);
    }
  }
  
  function showPartialLoadErrors(errors) {
    const errorMessage = errors.map(e => `${e.file}: ${e.error}`).join('\n');
    
    const notification = document.createElement('div');
    notification.className = 'feedback-notice error-notice';
    
    const title = document.createElement('div');
    title.className = 'error-title';
    title.textContent = 'Warning: Some data failed to load';
    
    const details = document.createElement('div');
    details.className = 'error-details';
    details.textContent = errorMessage;
    
    notification.appendChild(title);
    notification.appendChild(details);
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }
  
  let loadingIndicator = null;
  
  function showLoadingState() {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'feedback-notice loading-state';
    loadingIndicator.textContent = window.CONFIG.DISPLAY_TEXT.loading.ledger;
    document.body.appendChild(loadingIndicator);
  }
  
  function hideLoadingState() {
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
      loadingIndicator = null;
    }
  }
  
})();

