// Collections Ledger - pagination, sorting, filter
(function() {
  'use strict';

  const state = {
    rowsPerPage: 12,
    currentPage: 1,
    currentSort: { key: 'start_date', dir: 'desc' },
    currentFilter: '',
    data: []
  };

  const numberFormatter = typeof Intl !== 'undefined'
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : null;

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  function formatMoney(num) {
    const numericValue = Number(num);
    if (!Number.isFinite(numericValue)) return '0';
    if (numberFormatter) return numberFormatter.format(numericValue);
    return numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function parseNightly(value) {
    // Supports "$150", "150", "10%", 150
    if (typeof value === 'number') return { numeric: value, isPercent: false, display: `$${formatMoney(value)}` };
    if (typeof value !== 'string') return { numeric: 0, isPercent: false, display: '$0' };
    const trimmed = value.trim();
    if (!trimmed) return { numeric: 0, isPercent: false, display: '$0' };
    if (/%$/.test(trimmed)) {
      const pct = Number(trimmed.replace(/%/g, '').trim());
      return {
        numeric: isNaN(pct) ? 0 : pct,
        isPercent: true,
        display: isNaN(pct) ? escapeHtml(trimmed) : `${pct}%`
      };
    }
    const cleaned = trimmed.replace(/[$,]/g, '');
    const numericValue = cleaned ? Number(cleaned) : Number.NaN;
    if (Number.isFinite(numericValue)) {
      return { numeric: numericValue, isPercent: false, display: `$${formatMoney(numericValue)}` };
    }
    return { numeric: 0, isPercent: false, display: escapeHtml(trimmed) };
  }

  function getCollections() {
    const list = (window.ledgerData && Array.isArray(window.ledgerData.collections)) ? window.ledgerData.collections : [];
    return list.map(item => {
      const nightly = parseNightly(item?.nightly);
      return {
        name: item?.name || '',
        location: item?.location || '',
        nightly,
        made_by: item?.made_by || '',
        start_date: item?.start_date || '',
        contact: item?.contact || '',
        notes: item?.notes || '',
        status: (item?.status || '').toLowerCase()
      };
    });
  }

  function applyFilterSort(data) {
    const filter = state.currentFilter.toLowerCase().trim();
    const filtered = filter
      ? data.filter(d =>
          (d.name && d.name.toLowerCase().includes(filter)) ||
          (d.made_by && d.made_by.toLowerCase().includes(filter)))
      : data.slice();
    const { key, dir } = state.currentSort;
    const factor = dir === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const isNightly = key === 'nightly';
      const aVal = isNightly ? av.numeric : (typeof av === 'string' ? av.toLowerCase() : av);
      const bVal = isNightly ? bv.numeric : (typeof bv === 'string' ? bv.toLowerCase() : bv);
      if (aVal < bVal) return -1 * factor;
      if (aVal > bVal) return 1 * factor;
      return 0;
    });
    return filtered;
  }

  function paginate(data) {
    const start = (state.currentPage - 1) * state.rowsPerPage;
    return data.slice(start, start + state.rowsPerPage);
  }

  function updateTotals(filtered) {
    const totalAll = filtered.reduce((sum, item) => sum + (item.nightly.isPercent ? 0 : item.nightly.numeric), 0);
    const pageItems = paginate(filtered);
    const totalPage = pageItems.reduce((sum, item) => sum + (item.nightly.isPercent ? 0 : item.nightly.numeric), 0);
    const totalsEl = document.getElementById('collections-totals');
    if (totalsEl) {
      totalsEl.textContent = `Page: $${formatMoney(totalPage)} | Grand: $${formatMoney(totalAll)}`;
    }
  }

  function renderTable(filtered) {
    const tbody = document.getElementById('collections-ledger-body');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    if (filtered.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.setAttribute('colspan', '6');
      cell.className = 'text-center';
      cell.textContent = 'No collections recorded.';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }
    const pageRows = paginate(filtered);
    const fragment = document.createDocumentFragment();
    pageRows.forEach(item => {
      const row = document.createElement('tr');
      row.className = 'collection-row';
      if (item.status) row.setAttribute('data-status', item.status);
      row.innerHTML = `
        <td class="collection-start">${escapeHtml(item.start_date || 'N/A')}</td>
        <td>
          <strong>${escapeHtml(item.name || 'Unknown')}</strong>
          <br>
          <small class="collection-location">${escapeHtml(item.location || 'N/A')}</small>
        </td>
        <td class="numeric collection-nightly">${item.nightly.display}</td>
        <td class="collection-made">${escapeHtml(item.made_by || 'Unknown')}</td>
        <td class="collection-contact">${escapeHtml(item.contact || 'N/A')}</td>
        <td class="collection-notes">${escapeHtml(item.notes || '')}</td>
      `;
      fragment.appendChild(row);
    });
    tbody.appendChild(fragment);
  }

  function renderPagination(filtered) {
    const info = document.getElementById('page-info');
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.rowsPerPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (info) info.textContent = `Page ${state.currentPage} of ${totalPages}`;
    const prev = document.getElementById('page-prev');
    const next = document.getElementById('page-next');
    if (prev) prev.disabled = state.currentPage <= 1;
    if (next) next.disabled = state.currentPage >= totalPages;
  }

  function rerender() {
    const data = state.data;
    const filtered = applyFilterSort(data);
    renderTable(filtered);
    renderPagination(filtered);
    updateTotals(filtered);
  }

  function setSort(key) {
    if (state.currentSort.key === key) {
      state.currentSort.dir = state.currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      state.currentSort.key = key;
      state.currentSort.dir = 'asc';
    }
    state.currentPage = 1;
    // Update aria-sort on headers
    const headers = document.querySelectorAll('.collections-table thead th[data-sort]');
    headers.forEach(th => {
      const k = th.getAttribute('data-sort');
      const sortState = (k === state.currentSort.key) ? state.currentSort.dir : 'none';
      th.setAttribute('aria-sort', sortState);
    });
    rerender();
  }

  function attachEvents() {
    const headers = document.querySelectorAll('.collections-table thead th[data-sort]');
    headers.forEach(th => {
      th.addEventListener('click', () => setSort(th.getAttribute('data-sort')));
    });
    const prev = document.getElementById('page-prev');
    const next = document.getElementById('page-next');
    if (prev) prev.addEventListener('click', () => { state.currentPage = Math.max(1, state.currentPage - 1); rerender(); });
    if (next) next.addEventListener('click', () => { state.currentPage = state.currentPage + 1; rerender(); });
    const input = document.getElementById('collections-search');
    if (input) {
      let timer = null;
      input.addEventListener('input', function() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          state.currentFilter = String(input.value || '');
          state.currentPage = 1;
          rerender();
        }, 200);
      });
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        state.currentPage = Math.max(1, state.currentPage - 1);
        rerender();
      } else if (e.key === 'ArrowRight') {
        state.currentPage = state.currentPage + 1;
        rerender();
      }
    });
  }

  function init() {
    state.data = getCollections();
    attachEvents();
    rerender();
  }

  window.populateCollectionsLedger = function() {
    state.data = getCollections();
    state.currentPage = 1;
    rerender();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


