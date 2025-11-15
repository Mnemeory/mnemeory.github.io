// Navigation & Modal Management

(function() {
  'use strict';

  const config = window.CONFIG || {};
  const selectors = config.SELECTORS || {};
  const cssClasses = config.CSS_CLASSES || {};
  const displayText = config.DISPLAY_TEXT || {};
  const utils = window.utils || {};
  const domCache = typeof utils.domCache === 'object' ? utils.domCache : null;
  const validateArrayIndex = typeof utils.validateArrayIndex === 'function'
    ? utils.validateArrayIndex
    : (() => false);
  const escapeHtml = typeof utils.escapeHtml === 'function'
    ? utils.escapeHtml
    : (value => String(value ?? ''));
  const formatStatus = typeof utils.formatStatus === 'function'
    ? utils.formatStatus
    : ((status, defaultValue) => status || defaultValue || '');
  const formatNameList = typeof utils.formatNameList === 'function'
    ? utils.formatNameList
    : (names => Array.isArray(names) ? names.join(', ') : String(names ?? ''));

  let cachedElements = null;

  function getCachedElements() {
    if (!cachedElements) {
      cachedElements = {
        sealModal: domCache ? domCache.get(`#${selectors.sealModal}`) : document.getElementById(selectors.sealModal),
        sealModalImage: domCache ? domCache.get(`#${selectors.sealModalImage}`) : document.getElementById(selectors.sealModalImage),
        sealModalContent: domCache ? domCache.get(`#${selectors.sealModal} .seal-modal-content`) : document.querySelector(`#${selectors.sealModal} .seal-modal-content`),
        cardModal: domCache ? domCache.get(`#${selectors.cardModal}`) : document.getElementById(selectors.cardModal),
        cardModalContent: domCache ? domCache.get(`#${selectors.cardModalContent}`) : document.getElementById(selectors.cardModalContent),
        familyRosterFrame: domCache ? domCache.get(`#${selectors.familyRosterFrame}`) : document.getElementById(selectors.familyRosterFrame),
        rosterButton: domCache ? domCache.get(selectors.rosterButton) : document.querySelector(selectors.rosterButton)
      };
    }
    return cachedElements;
  }
  
  // SEAL MODAL
  
  function openSealModal(imageSrc) {
    const { sealModal, sealModalImage } = getCachedElements();
    if (sealModal && sealModalImage) {
      sealModalImage.src = imageSrc;
      sealModal.classList.add(cssClasses.active);
      document.body.classList.add('modal-open');
    }
  }

  function closeSealModal() {
    const { sealModal, sealModalImage } = getCachedElements();
    if (sealModal) {
      sealModal.classList.remove(cssClasses.active);
      document.body.classList.remove('modal-open');
    }
    if (sealModalImage) {
      sealModalImage.removeAttribute('src');
    }
  }
  
  // CARD DETAILS MODAL
  
  function openCardModal(cardType, index) {
    const { cardModal, cardModalContent } = getCachedElements();
    const data = window.ledgerData;
    const renderDetailRows = (utils && typeof utils.renderDetailRows === 'function') ? utils.renderDetailRows : null;

    if (!cardModal || !cardModalContent || !data) return;

    const modalContainer = cardModalContent.parentElement;
    if (modalContainer) {
      modalContainer.classList.remove(cssClasses.vendettaTheme, cssClasses.territoryTheme, 'paper-card', 'manila-card');
    }

    let content = '';
    
    if (cardType === 'vendetta' && Array.isArray(data.vendetta) && validateArrayIndex(data.vendetta, index)) {
      const vendetta = data.vendetta[index];
      if (!vendetta) return;

      const typeText = displayText.vendettaTypes?.[vendetta.type] || displayText.vendettaTypes?.financial || '';

      const statusDisplay = formatStatus(vendetta.status, displayText.defaults?.unknown);

      const detailRowsHtml = renderDetailRows
        ? renderDetailRows([
            { label: 'Status:', value: statusDisplay },
            { label: 'Offense:', value: vendetta.offense || 'Not specified' },
            { label: 'Last Seen:', value: vendetta.last_seen || 'Unknown' },
            { label: 'Known Associates:', value: vendetta.associates || 'None' },
            { label: 'Authorization:', value: vendetta.authorized_by || 'Unknown', valueClass: 'value made-name' }
          ], { rowClass: 'detail-row' })
        : `
        <div class="modal-card-header">
          <span class="vendetta-type ${vendetta.type || 'financial'}">${typeText}</span>
          <h3 class="modal-card-title">${escapeHtml(vendetta.name || 'Unknown')}${vendetta.nickname ? ` "${escapeHtml(vendetta.nickname)}"` : ''}</h3>
        </div>
        <div class="modal-card-body">
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
          </div>
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
      if (modalContainer) {
        modalContainer.classList.add(cssClasses.vendettaTheme, 'paper-card');
      }
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

        const namesHtml = names
          .map(name => `<span class="crew-name">${escapeHtml(name)}</span>`)
          .join('');

        return `
          <div class="crew-group crew-group-${modifier} crew-group-multiple">
            <span class="crew-role">${label}</span>
            <div class="crew-names crew-names-multiple">
              ${namesHtml}
            </div>
          </div>
        `;
      };

      const capoGroup = renderCrewGroup('Capo:', sortedCapo, displayText.defaults?.unassigned, 'capo');
      const squadraGroup = renderCrewGroup('La Squadra:', sortedSquadra, displayText.defaults?.unassigned, 'squadra');
      const famigliaGroup = renderCrewGroup('La Famiglia:', sortedFamiglia, displayText.defaults?.none, 'famiglia');
      const businessesHtml = formatNameList(territory.businesses, displayText.defaults?.none);

      const businessRow = renderDetailRows
        ? renderDetailRows([{ label: 'Businesses:', value: businessesHtml, html: true }], { rowClass: 'detail-row' })
        : `
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
          <div class="detail-row">
            <span class="label">Businesses:</span>
            <span class="value">${businessesHtml}</span>
          </div>
        </div>`;

      const notesRow = territory.notes && renderDetailRows
        ? renderDetailRows([{ label: 'Notes:', value: territory.notes, rowClass: 'detail-row notes' }], { rowClass: 'detail-row notes' })
        : (territory.notes ? `
          <div class="detail-row notes">
            <span class="label">Notes:</span>
            <span class="value">${escapeHtml(territory.notes)}</span>
          </div>` : '');

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
      if (modalContainer) {
        modalContainer.classList.add(cssClasses.territoryTheme, 'manila-card');
      }
    }

    cardModalContent.innerHTML = content;
    cardModal.classList.add(cssClasses.active);
    document.body.classList.add('modal-open');
  }

  function closeCardModal() {
    const { cardModal } = getCachedElements();
    if (cardModal) {
      cardModal.classList.remove(cssClasses.active);
      document.body.classList.remove('modal-open');
    }
    const { cardModalContent } = getCachedElements();
    if (cardModalContent) {
      cardModalContent.innerHTML = '';
    }
  }
  
  // FAMILY ROSTER MODAL
  
  function openFamilyRosterModal() {
    const { familyRosterFrame } = getCachedElements();
    if (familyRosterFrame) {
      familyRosterFrame.classList.add(cssClasses.active);
      document.body.classList.add(cssClasses.rosterModalOpen);
      document.body.classList.add('modal-open');

      if (familyRosterFrame.contentWindow) {
        familyRosterFrame.contentWindow.postMessage({action: 'populate'}, '*');
      }
    }
  }
  
  function closeFamilyRosterModal() {
    const { familyRosterFrame } = getCachedElements();
    if (familyRosterFrame) {
      familyRosterFrame.classList.remove(cssClasses.active);
      document.body.classList.remove(cssClasses.rosterModalOpen);
      document.body.classList.remove('modal-open');
    }
  }
  
  // INITIALIZATION
  
  function init() {
    const elements = getCachedElements();
    
    if (elements.rosterButton) {
      elements.rosterButton.addEventListener('click', openFamilyRosterModal);
    }

    if (elements.sealModal) {
      elements.sealModal.addEventListener('click', closeSealModal);
    }

    if (elements.sealModalContent) {
      elements.sealModalContent.addEventListener('click', event => event.stopPropagation());
    }

    if (elements.cardModal) {
      elements.cardModal.addEventListener('click', closeCardModal);
    }

    if (elements.cardModalContent) {
      elements.cardModalContent.addEventListener('click', event => event.stopPropagation());
    }
    
    window.addEventListener('message', function(event) {
      if (event.data && event.data.action === 'closeRoster') {
        closeFamilyRosterModal();
      }
    });
    
    document.addEventListener('click', function(e) {
      if (!e.target) {
        return;
      }

      const vendettaCard = e.target.closest(selectors.vendettaCard);
      if (vendettaCard) {
        const index = parseInt(vendettaCard.dataset.cardIndex, 10);
        if (!isNaN(index)) {
          openCardModal('vendetta', index);
        }
        return;
      }

      const territoryCard = e.target.closest(selectors.territoryCard);
      if (territoryCard) {
        const index = parseInt(territoryCard.dataset.cardIndex, 10);
        if (!isNaN(index)) {
          openCardModal('territory', index);
        }
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeSealModal();
        closeCardModal();
        closeFamilyRosterModal();
      }
    });
  }
  
  if (typeof utils.onReady === 'function') {
    utils.onReady(init);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  
})();
