// Navigation & Modal Management

(function() {
  'use strict';
  
  let cachedElements = null;
  
  function getCachedElements() {
    if (!cachedElements) {
      cachedElements = {
        sealModal: document.getElementById(window.CONFIG.SELECTORS.sealModal),
        sealModalImage: document.getElementById(window.CONFIG.SELECTORS.sealModalImage),
        cardModal: document.getElementById(window.CONFIG.SELECTORS.cardModal),
        cardModalContent: document.getElementById(window.CONFIG.SELECTORS.cardModalContent),
        familyRosterFrame: document.getElementById(window.CONFIG.SELECTORS.familyRosterFrame),
        rosterButton: document.querySelector(window.CONFIG.SELECTORS.rosterButton)
      };
    }
    return cachedElements;
  }
  
  // SEAL MODAL
  
  function openSealModal(imageSrc) {
    const { sealModal, sealModalImage } = getCachedElements();
    if (sealModal && sealModalImage) {
      sealModalImage.src = imageSrc;
      sealModal.classList.add(window.CONFIG.CSS_CLASSES.active);
      document.body.classList.add('modal-open');
    }
  }
  
  function closeSealModal() {
    const { sealModal } = getCachedElements();
    if (sealModal) {
      sealModal.classList.remove(window.CONFIG.CSS_CLASSES.active);
      document.body.classList.remove('modal-open');
    }
  }
  
  // CARD DETAILS MODAL
  
  function openCardModal(cardType, index) {
    const { cardModal, cardModalContent } = getCachedElements();
    const data = window.ledgerData;
    
    if (!cardModal || !cardModalContent || !data) return;

    const modalContainer = cardModalContent.parentElement;
    if (modalContainer) {
      modalContainer.classList.remove(window.CONFIG.CSS_CLASSES.vendettaTheme, window.CONFIG.CSS_CLASSES.territoryTheme);
    }

    let content = '';
    
    if (cardType === 'vendetta' && data.vendetta && Array.isArray(data.vendetta) && window.utils.validateArrayIndex(data.vendetta, index)) {
      const vendetta = data.vendetta[index];
      if (!vendetta) return;
      
      const typeText = window.CONFIG.DISPLAY_TEXT.vendettaTypes[vendetta.type] || window.CONFIG.DISPLAY_TEXT.vendettaTypes.financial;
      
      const statusDisplay = window.utils && window.utils.formatStatus
        ? window.utils.formatStatus(vendetta.status, window.CONFIG.DISPLAY_TEXT.defaults.unknown)
        : (vendetta.status || window.CONFIG.DISPLAY_TEXT.defaults.unknown);
      
      content = `
        <div class="modal-card-header">
          <span class="vendetta-type ${vendetta.type || 'financial'}">${typeText}</span>
          <h3 class="modal-card-title">${window.utils.escapeHtml(vendetta.name || 'Unknown')} "${window.utils.escapeHtml(vendetta.nickname || 'Unknown')}"</h3>
        </div>
        <div class="modal-card-body">
          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="value">${window.utils.escapeHtml(statusDisplay)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Offense:</span>
            <span class="value">${window.utils.escapeHtml(vendetta.offense || 'Not specified')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Last Seen:</span>
            <span class="value">${window.utils.escapeHtml(vendetta.last_seen || 'Unknown')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Known Associates:</span>
            <span class="value">${window.utils.escapeHtml(vendetta.associates || 'None')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Authorization:</span>
            <span class="value made-name">${window.utils.escapeHtml(vendetta.authorized_by || 'Unknown')}</span>
          </div>
        </div>
      `;
      if (modalContainer) {
        modalContainer.classList.add(window.CONFIG.CSS_CLASSES.vendettaTheme);
      }
    } else if (cardType === 'territory' && data.territory && Array.isArray(data.territory) && window.utils.validateArrayIndex(data.territory, index)) {
      const territory = data.territory[index];
      if (!territory) return;
      
      const squadraHtml = window.utils.formatNameList(territory.la_squadra, window.CONFIG.DISPLAY_TEXT.defaults.unassigned);
      const famigliaHtml = window.utils.formatNameList(territory.la_famiglia, window.CONFIG.DISPLAY_TEXT.defaults.none);
      const businessesHtml = window.utils.formatNameList(territory.businesses, window.CONFIG.DISPLAY_TEXT.defaults.none);
      
      content = `
        <div class="modal-card-header">
          <h3 class="modal-card-title">${window.utils.escapeHtml(territory.name || 'Unknown Territory')}</h3>
          <div class="territory-status">Status: ${window.utils.escapeHtml(territory.status || 'Unknown')}</div>
        </div>
        <div class="modal-card-body">
          <div class="detail-row">
            <span class="label">La Squadra:</span>
            <span class="value made-name">${squadraHtml}</span>
          </div>
          <div class="detail-row">
            <span class="label">La Famiglia:</span>
            <span class="value">${famigliaHtml}</span>
          </div>
          <div class="detail-row">
            <span class="label">Businesses:</span>
            <span class="value">${businessesHtml}</span>
          </div>
          ${territory.notes ? `
          <div class="detail-row notes">
            <span class="label">Notes:</span>
            <span class="value">${window.utils.escapeHtml(territory.notes)}</span>
          </div>
          ` : ''}
        </div>
      `;
      if (modalContainer) {
        modalContainer.classList.add(window.CONFIG.CSS_CLASSES.territoryTheme);
      }
    }
    
    cardModalContent.innerHTML = content;
    cardModal.classList.add(window.CONFIG.CSS_CLASSES.active);
    document.body.classList.add('modal-open');
  }
  
  function closeCardModal() {
    const { cardModal } = getCachedElements();
    if (cardModal) {
      cardModal.classList.remove(window.CONFIG.CSS_CLASSES.active);
      document.body.classList.remove('modal-open');
    }
  }
  
  // FAMILY ROSTER MODAL
  
  function openFamilyRosterModal() {
    const { familyRosterFrame } = getCachedElements();
    if (familyRosterFrame) {
      familyRosterFrame.classList.add(window.CONFIG.CSS_CLASSES.active);
      document.body.classList.add(window.CONFIG.CSS_CLASSES.rosterModalOpen);
      document.body.classList.add('modal-open');
      
      if (familyRosterFrame.contentWindow) {
        familyRosterFrame.contentWindow.postMessage({action: 'populate'}, '*');
      }
    }
  }
  
  function closeFamilyRosterModal() {
    const { familyRosterFrame } = getCachedElements();
    if (familyRosterFrame) {
      familyRosterFrame.classList.remove(window.CONFIG.CSS_CLASSES.active);
      document.body.classList.remove(window.CONFIG.CSS_CLASSES.rosterModalOpen);
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
    
    if (elements.cardModal) {
      elements.cardModal.addEventListener('click', closeCardModal);
    }
    
    window.addEventListener('message', function(event) {
      if (event.data && event.data.action === 'closeRoster') {
        closeFamilyRosterModal();
      }
    });
    
    document.addEventListener('click', function(e) {
      const vendettaCard = e.target.closest(window.CONFIG.SELECTORS.vendettaCard);
      if (vendettaCard) {
        const index = parseInt(vendettaCard.dataset.cardIndex, 10);
        if (!isNaN(index)) {
          openCardModal('vendetta', index);
        }
        return;
      }
      
      const territoryCard = e.target.closest(window.CONFIG.SELECTORS.territoryCard);
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
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
