// Roster Lines - SVG Connection Lines

(function() {
  'use strict';

  const config = window.CONFIG || {};
  const selectors = config.SELECTORS || {};
  const cssClasses = config.CSS_CLASSES || {};
  const svgNamespace = config.SVG_NAMESPACE || 'http://www.w3.org/2000/svg';
  const timing = config.TIMING || {};
  const organizationalChartId = selectors.organizationalChart || 'organizationalChart';
  const orgChartLinesId = selectors.orgChartLines || 'orgChartLines';

  // POSITION CALCULATION
  
  function getAllPositions(container) {
    const positions = new Map();
    const containerRect = container.getBoundingClientRect();
    
    const plaques = container.querySelectorAll('.roster-plaque');
    
    plaques.forEach(plaque => {
      const nameEl = plaque.querySelector('.plaque-name');
      if (!nameEl) return;
      
      const name = nameEl.textContent.trim();
      const rect = plaque.getBoundingClientRect();
      
      const pos = {
        centerX: (rect.left - containerRect.left) + (rect.width / 2),
        centerY: (rect.top - containerRect.top) + (rect.height / 2),
        top: rect.top - containerRect.top,
        bottom: rect.bottom - containerRect.top,
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        width: rect.width,
        height: rect.height
      };
      
      positions.set(name, pos);
    });
    
    return positions;
  }

  // SVG LINE DRAWING
  
  window.drawOrgChartLines = function() {
    const data = window.ledgerData;
    if (!data || !data.familyroster) {
      return;
    }

    const svg = document.getElementById(orgChartLinesId);
    const container = document.getElementById(organizationalChartId);
    
    if (!svg || !container) {
      return;
    }

    const plaques = container.querySelectorAll('.roster-plaque');
    if (plaques.length === 0) {
      return;
    }

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    updateSVGDimensions(svg, container);

    const positions = getAllPositions(container);
    
    if (positions.size === 0) {
      return;
    }

    const cachedTree = window.__orgChartTreeCache || null;
    const orgTree = cachedTree || (window.buildOrgTree ? window.buildOrgTree(data.familyroster) : null);
    if (!orgTree) return;

    drawBossLevel(svg, orgTree, positions);
    drawCapoLevel(svg, orgTree, positions);
  };

  function drawBossLevel(svg, orgTree, positions) {
    if (!orgTree.boss) return;

    const bossPos = positions.get(orgTree.boss.name);
    if (!bossPos) return;

    if (orgTree.bossConsigliere) {
      const consPos = positions.get(orgTree.bossConsigliere.name);
      if (consPos) {
        drawAdvisoryLine(svg, bossPos, consPos);
      }
    }

    orgTree.capos.forEach(capoData => {
      const capoPos = positions.get(capoData.capo.name);
      if (capoPos) {
        drawCommandLine(svg, bossPos, capoPos);
      }
    });
  }

  function drawCapoLevel(svg, orgTree, positions) {
    orgTree.capos.forEach(capoData => {
      const capoPos = positions.get(capoData.capo.name);
      if (!capoPos) return;

      const crewMembers = [];

      capoData.consiglieres.forEach(consData => {
        const consPos = positions.get(consData.consigliere.name);
        if (consPos) {
          crewMembers.push({
            pos: consPos,
            member: consData.consigliere,
            associates: consData.associates
          });
        }
      });

      capoData.soldatos.forEach(soldatoData => {
        const soldatoPos = positions.get(soldatoData.soldato.name);
        if (soldatoPos) {
          crewMembers.push({
            pos: soldatoPos,
            member: soldatoData.soldato,
            associates: soldatoData.associates
          });
        }
      });

      if (crewMembers.length > 0) {
        drawHierarchyLines(svg, capoPos, crewMembers.map(c => c.pos));
      }

      crewMembers.forEach(crewMember => {
        if (crewMember.associates && crewMember.associates.length > 0) {
          const assocPositions = crewMember.associates
            .map(assoc => positions.get(assoc.name))
            .filter(pos => pos);

          if (assocPositions.length > 0) {
            drawHierarchyLines(svg, crewMember.pos, assocPositions);
          }
        }
      });

      if (capoData.associates && capoData.associates.length > 0) {
        const directAssocPositions = capoData.associates
          .map(associate => positions.get(associate.name))
          .filter(pos => pos);

        if (directAssocPositions.length > 0) {
          drawHierarchyLines(svg, capoPos, directAssocPositions);
        }
      }
    });
  }

  function drawHierarchyLines(svg, parentPos, childPositions) {
    if (childPositions.length === 0) return;

    const childXs = childPositions.map(p => p.centerX);
    const leftX = Math.min(...childXs);
    const rightX = Math.max(...childXs);

    const childTopY = Math.min(...childPositions.map(p => p.top));
    const midY = (parentPos.bottom + childTopY) / 2;

    drawPath(svg, `M ${parentPos.centerX},${parentPos.bottom} L ${parentPos.centerX},${midY}`);
    drawPath(svg, `M ${leftX},${midY} L ${rightX},${midY}`);

    childPositions.forEach(childPos => {
      drawPath(svg, `M ${childPos.centerX},${midY} L ${childPos.centerX},${childPos.top}`);
    });
  }

  function drawCommandLine(svg, fromPos, toPos) {
    const midY = (fromPos.bottom + toPos.top) / 2;
    
    drawPath(svg,
      `M ${fromPos.centerX},${fromPos.bottom} ` +
      `L ${fromPos.centerX},${midY} ` +
      `L ${toPos.centerX},${midY} ` +
      `L ${toPos.centerX},${toPos.top}`
    );
  }

  function drawAdvisoryLine(svg, fromPos, toPos) {
    const path = document.createElementNS(svgNamespace, 'path');
    
    const yDiff = Math.abs(fromPos.centerY - toPos.centerY);
    
    if (yDiff < 10) {
      path.setAttribute('d',
        `M ${fromPos.right},${fromPos.centerY} L ${toPos.left},${toPos.centerY}`
      );
    } else {
      const midX = (fromPos.right + toPos.left) / 2;
      path.setAttribute('d',
        `M ${fromPos.right},${fromPos.centerY} ` +
        `L ${midX},${fromPos.centerY} ` +
        `L ${midX},${toPos.centerY} ` +
        `L ${toPos.left},${toPos.centerY}`
      );
    }
    
    const advisoryClass = cssClasses.advisoryLine || 'advisory-line';
    path.setAttribute('class', advisoryClass);
    svg.appendChild(path);
  }

  function drawPath(svg, pathData) {
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', pathData);
    const commandClass = cssClasses.commandLine || 'command-line';
    path.setAttribute('class', commandClass);
    svg.appendChild(path);
    return path;
  }

  function updateSVGDimensions(svg, container) {
    const width = container.scrollWidth;
    const height = container.scrollHeight;
    
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
  }

  // RESIZE HANDLING
  
  let resizeObserver = null;
  let resizeFallbackHandler = null;

  function initResizeObserver() {
    const container = document.getElementById(organizationalChartId);
    if (!container) {
      return;
    }

    if (typeof ResizeObserver === 'function') {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          if (window.ledgerData && window.ledgerData.familyroster) {
            window.drawOrgChartLines();
          }
        });
      });

      resizeObserver.observe(container);
    } else {
      setupResizeFallback();
    }
  }

  window.cleanupOrgChartListeners = function() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (resizeFallbackHandler) {
      window.removeEventListener('resize', resizeFallbackHandler);
      resizeFallbackHandler = null;
    }
  };

  function setupResizeFallback() {
    if (resizeFallbackHandler) {
      return;
    }

    let timeoutId = null;
    const debounceDelay = typeof timing.resizeDebounce === 'number' ? timing.resizeDebounce : 150;
    resizeFallbackHandler = function() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        if (window.ledgerData && window.ledgerData.familyroster) {
          window.drawOrgChartLines();
        }
      }, debounceDelay);
    };

    window.addEventListener('resize', resizeFallbackHandler);
  }

  // INITIALIZATION

  function scheduleObserverInit() {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(initResizeObserver);
    } else {
      setTimeout(initResizeObserver, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleObserverInit);
  } else {
    scheduleObserverInit();
  }

})();
