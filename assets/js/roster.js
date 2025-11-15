// Family Roster - Organizational Chart

(function() {
  'use strict';

  const config = window.CONFIG || {};
  const layoutConfig = config.LAYOUT || {};
  const displayText = config.DISPLAY_TEXT || {};
  const defaults = config.DEFAULTS || {};
  const selectors = config.SELECTORS || {};
  const cssClasses = config.CSS_CLASSES || {};
  const timing = config.TIMING || {};
  const ORG_TREE_CACHE_KEY = '__orgChartTreeCache';

  function setOrgTreeCache(tree) {
    window[ORG_TREE_CACHE_KEY] = tree || null;
  }

  // LAYOUT ENGINE - REINGOLD-TILFORD ALGORITHM

  class OrgChartLayout {
    constructor(options = {}) {
      const plaqueWidths = options.plaqueWidths || layoutConfig.plaqueWidths || {};
      const resolvedOptions = {
        horizontalSpacing: options.horizontalSpacing ?? layoutConfig.subordinateSpacing,
        verticalSpacing: options.verticalSpacing ?? layoutConfig.rowGap,
        advisorGap: options.advisorGap ?? layoutConfig.advisoryLineOffsetX,
        leadershipHeight: options.leadershipHeight ?? layoutConfig.leadershipHeight,
        crewHeight: options.crewHeight ?? layoutConfig.crewHeight,
        marginLeft: options.marginLeft,
        marginTop: options.marginTop
      };

      this.leadershipWidth = plaqueWidths.leadership ?? 380;
      this.leadershipHeight = resolvedOptions.leadershipHeight ?? 224;
      this.crewWidth = plaqueWidths.crew ?? 320;
      this.crewHeight = resolvedOptions.crewHeight ?? 189;

      this.horizontalSpacing = resolvedOptions.horizontalSpacing ?? 50;
      this.verticalSpacing = resolvedOptions.verticalSpacing ?? 100;
      this.advisorGap = resolvedOptions.advisorGap ?? 80;

      this.marginLeft = resolvedOptions.marginLeft ?? 50;
      this.marginTop = resolvedOptions.marginTop ?? 50;
    }
    
    getNodeWidth(node) {
      return node.isLeadership ? this.leadershipWidth : this.crewWidth;
    }
    
    getNodeHeight(node) {
      return node.isLeadership ? this.leadershipHeight : this.crewHeight;
    }
    
    getPreviousSibling(node) {
      if (!node.parent) return null;
      const index = node.parent.children.indexOf(node);
      return index > 0 ? node.parent.children[index - 1] : null;
    }
    
    getSeparation(leftNode, rightNode) {
      return (this.getNodeWidth(leftNode) / 2) +
             this.horizontalSpacing +
             (this.getNodeWidth(rightNode) / 2);
    }
    
    initializeNodes(node, depth = 0) {
      node.prelim = 0;
      node.mod = 0;
      node.shift = 0;
      node.change = 0;
      node.thread = null;
      node.ancestor = node;
      node.depth = depth;
      node.children.forEach((child, index) => {
        child.number = index + 1;
        this.initializeNodes(child, depth + 1);
      });
      if (node.advisor) {
        node.advisor.prelim = 0;
        node.advisor.mod = 0;
        node.advisor.shift = 0;
        node.advisor.change = 0;
        node.advisor.thread = null;
        node.advisor.ancestor = node.advisor;
        node.advisor.depth = depth;
      }
    }
    
    firstWalk(node) {
      if (node.children.length === 0) {
        const leftSibling = this.getPreviousSibling(node);
        node.prelim = leftSibling
          ? leftSibling.prelim + this.getSeparation(leftSibling, node)
          : 0;
      } else {
        let defaultAncestor = node.children[0];
        node.children.forEach(child => {
          this.firstWalk(child);
          defaultAncestor = this.apportion(child, defaultAncestor);
        });
        this.executeShifts(node);
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        const midPoint = (firstChild.prelim + lastChild.prelim) / 2;
        const leftSibling = this.getPreviousSibling(node);
        if (leftSibling) {
          node.prelim = leftSibling.prelim + this.getSeparation(leftSibling, node);
          node.mod = node.prelim - midPoint;
        } else {
          node.prelim = midPoint;
        }
      }
    }
    
    apportion(node, defaultAncestor) {
      const leftSibling = this.getPreviousSibling(node);
      if (!leftSibling) {
        return defaultAncestor;
      }
      
      let vir = node;
      let vor = node;
      let vil = leftSibling;
      let vol = node.parent.children[0];
      
      let sir = node.mod;
      let sor = node.mod;
      let sil = vil.mod;
      let sol = vol.mod;
      
      let nextRightVil = this.nextRight(vil);
      let nextLeftVir = this.nextLeft(vir);
      
      while (nextRightVil && nextLeftVir) {
        vil = nextRightVil;
        vir = nextLeftVir;
        vol = this.nextLeft(vol);
        vor = this.nextRight(vor);
        vor.ancestor = node;
        
        const shift = (vil.prelim + sil) - (vir.prelim + sir) + this.getSeparation(vil, vir);
        if (shift > 0) {
          const ancestor = this.ancestor(vil, node, defaultAncestor);
          this.moveSubtree(ancestor, node, shift);
          sir += shift;
          sor += shift;
        }
        
        sil += vil.mod;
        sir += vir.mod;
        sol += vol.mod;
        sor += vor.mod;
        
        nextRightVil = this.nextRight(vil);
        nextLeftVir = this.nextLeft(vir);
      }
      
      if (nextRightVil && !this.nextRight(vor)) {
        vor.thread = nextRightVil;
        vor.mod += sil - sor;
      }
      
      if (nextLeftVir && !this.nextLeft(vol)) {
        vol.thread = nextLeftVir;
        vol.mod += sir - sol;
        defaultAncestor = node;
      }
      
      return defaultAncestor;
    }
    
    nextLeft(node) {
      if (!node) return null;
      return node.children.length > 0 ? node.children[0] : node.thread;
    }
    
    nextRight(node) {
      if (!node) return null;
      return node.children.length > 0 ? node.children[node.children.length - 1] : node.thread;
    }
    
    moveSubtree(wl, wr, shift) {
      const subtrees = wr.number - wl.number;
      if (subtrees <= 0) return;
      const shiftPerSubtree = shift / subtrees;
      wr.change -= shiftPerSubtree;
      wr.shift += shift;
      wr.prelim += shift;
      wr.mod += shift;
      wl.change += shiftPerSubtree;
    }
    
    executeShifts(node) {
      let shift = 0;
      let change = 0;
      
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i];
        child.prelim += shift;
        child.mod += shift;
        change += child.change;
        shift += child.shift + change;
      }
    }
    
    ancestor(vil, node, defaultAncestor) {
      if (vil.ancestor.parent === node.parent) {
        return vil.ancestor;
      }
      return defaultAncestor;
    }
    
    secondWalk(node, modSum) {
      node.finalX = node.prelim + modSum;
      modSum += node.mod;
      node.children.forEach(child => this.secondWalk(child, modSum));
    }
    
    adjustToPositive(node) {
      let minX = Infinity;
      
      const findMinX = (n) => {
        minX = Math.min(minX, n.x);
        n.children.forEach(findMinX);
        if (n.advisor) {
          minX = Math.min(minX, n.advisor.x);
        }
      };
      
      findMinX(node);
      
      if (minX < 0) {
        const offset = Math.abs(minX) + this.marginLeft;
        const shiftX = (n) => {
          n.x += offset;
          if (typeof n.finalX === 'number') {
            n.finalX += offset;
          }
          n.children.forEach(shiftX);
          if (n.advisor) {
            n.advisor.x += offset;
            if (typeof n.advisor.finalX === 'number') {
              n.advisor.finalX += offset;
            }
          }
        };
        shiftX(node);
      } else {
        const shiftX = (n) => {
          n.x += this.marginLeft;
          if (typeof n.finalX === 'number') {
            n.finalX += this.marginLeft;
          }
          n.children.forEach(shiftX);
          if (n.advisor) {
            n.advisor.x += this.marginLeft;
            if (typeof n.advisor.finalX === 'number') {
              n.advisor.finalX += this.marginLeft;
            }
          }
        };
        shiftX(node);
      }
      
      const shiftY = (n) => {
        n.y += this.marginTop;
        n.children.forEach(shiftY);
        if (n.advisor) {
          n.advisor.y += this.marginTop;
        }
      };
      shiftY(node);
    }
    
    positionAdvisor(node) {
      if (node.advisor) {
        node.advisor.x = node.x + this.getNodeWidth(node) + this.advisorGap;
        node.advisor.y = node.y;
      }
      node.children.forEach(child => this.positionAdvisor(child));
    }
    
    assignVerticalPositions(node, currentY) {
      node.y = currentY;
      if (node.advisor) {
        node.advisor.y = currentY;
      }
      const nextY = currentY + this.getNodeHeight(node) + this.verticalSpacing;
      node.children.forEach(child => this.assignVerticalPositions(child, nextY));
    }
    
    finalizeCoordinates(node) {
      const width = this.getNodeWidth(node);
      node.x = node.finalX - width / 2;
      node.children.forEach(child => this.finalizeCoordinates(child));
    }
    
    calculatePositions(tree) {
      this.initializeNodes(tree, 0);
      tree.number = 1;
      this.firstWalk(tree);
      this.secondWalk(tree, 0);
      this.finalizeCoordinates(tree);
      this.assignVerticalPositions(tree, 0);
      this.positionAdvisor(tree);
      this.adjustToPositive(tree);
    }
  }
  
  // TREE BUILDING
  
  function buildTreeStructure(roster, rosterIndex) {
    if (!roster) return null;

    const index = rosterIndex || createRosterIndex(roster);

    const bossData = Array.isArray(roster.boss) && roster.boss[0]
      ? roster.boss[0]
      : { name: 'No Boss', status: 'vacant' };

    const tree = {
      id: 'boss',
      role: 'boss',
      data: bossData,
      children: [],
      parent: null,
      mod: 0,
      isLeadership: true
    };

    if (Array.isArray(roster.boss_consigliere) && roster.boss_consigliere.length > 0) {
      const advisorData = roster.boss_consigliere[0];
      tree.advisor = {
        id: 'boss-consigliere',
        role: 'boss_consigliere',
        data: advisorData,
        isLeadership: true,
        x: 0,
        y: 0,
        mod: 0,
        parent: tree,
        children: []
      };
    }

    index.capos.forEach(capo => {
      const capoNode = {
        id: createNodeId('capo', capo?.name),
        role: 'capo',
        data: capo,
        children: [],
        parent: tree,
        mod: 0,
        isLeadership: true
      };

      const capoName = capo?.name;

      const consiglieres = getGroup(index.consiglieresByCapo, capoName);
      consiglieres.forEach(consigliere => {
        const consigliereNode = {
          id: createNodeId('consigliere', consigliere?.name),
          role: 'consigliere',
          data: consigliere,
          children: [],
          parent: capoNode,
          mod: 0,
          isLeadership: false
        };

        const associates = getGroup(index.associatesByConsigliere, consigliere?.name);
        associates.forEach(associate => {
          const associateNode = {
            id: createNodeId('associate', associate?.name),
            role: 'associate',
            data: associate,
            children: [],
            parent: consigliereNode,
            mod: 0,
            isLeadership: false
          };
          consigliereNode.children.push(associateNode);
        });

        capoNode.children.push(consigliereNode);
      });

      const soldatos = getGroup(index.soldatosByCapo, capoName);
      soldatos.forEach(soldato => {
        const soldatoNode = {
          id: createNodeId('soldato', soldato?.name),
          role: 'soldato',
          data: soldato,
          children: [],
          parent: capoNode,
          mod: 0,
          isLeadership: false
        };

        const associates = getGroup(index.associatesBySoldato, soldato?.name);
        associates.forEach(associate => {
          const associateNode = {
            id: createNodeId('associate', associate?.name),
            role: 'associate',
            data: associate,
            children: [],
            parent: soldatoNode,
            mod: 0,
            isLeadership: false
          };
          soldatoNode.children.push(associateNode);
        });

        capoNode.children.push(soldatoNode);
      });

      const directAssociates = getGroup(index.associatesByCapo, capoName);
      directAssociates.forEach(associate => {
        const associateNode = {
          id: createNodeId('associate', associate?.name),
          role: 'associate',
          data: associate,
          children: [],
          parent: capoNode,
          mod: 0,
          isLeadership: false
        };
        capoNode.children.push(associateNode);
      });

      tree.children.push(capoNode);
    });

    return tree;
  }
  
  window.buildOrgTree = function(roster, rosterIndex) {
    if (!roster) return null;

    const index = rosterIndex || createRosterIndex(roster);

    const tree = {
      boss: Array.isArray(roster.boss) && roster.boss[0] ? roster.boss[0] : null,
      bossConsigliere: Array.isArray(roster.boss_consigliere) && roster.boss_consigliere[0] ? roster.boss_consigliere[0] : null,
      capos: []
    };

    index.capos.forEach(capo => {
      const capoEntry = {
        capo,
        consiglieres: [],
        soldatos: [],
        associates: getGroup(index.associatesByCapo, capo?.name)
      };

      const capoName = capo?.name;

      const consiglieres = getGroup(index.consiglieresByCapo, capoName);
      consiglieres.forEach(consigliere => {
        capoEntry.consiglieres.push({
          consigliere,
          associates: getGroup(index.associatesByConsigliere, consigliere?.name)
        });
      });

      const soldatos = getGroup(index.soldatosByCapo, capoName);
      soldatos.forEach(soldato => {
        capoEntry.soldatos.push({
          soldato,
          associates: getGroup(index.associatesBySoldato, soldato?.name)
        });
      });

      tree.capos.push(capoEntry);
    });

    return tree;
  };
  
  // RENDERING
  
  function createPlaqueElement(node) {
    const element = document.createElement('div');
    element.className = `roster-plaque ${node.isLeadership ? 'leadership' : 'crew'}`;

    const status = node.data?.status || defaults.status || 'active';
    if (status) {
      element.classList.add(status);
    }

    if (node.data?.name) {
      element.dataset.nodeName = node.data.name;
    }

    element.style.position = 'absolute';
    element.style.left = `${Math.round(node.x)}px`;
    element.style.top = `${Math.round(node.y)}px`;

    const roleLabel = document.createElement('div');
    roleLabel.className = 'plaque-role';
    roleLabel.textContent = getRoleLabel(node.role);
    element.appendChild(roleLabel);

    const nameEl = document.createElement('div');
    nameEl.className = 'plaque-name';
    nameEl.textContent = node.data?.name || displayText.defaults?.unknown || 'Unknown';
    element.appendChild(nameEl);

    if (node.data?.clan) {
      const clanEl = document.createElement('div');
      clanEl.className = 'plaque-detail';
      clanEl.textContent = node.data.clan;
      element.appendChild(clanEl);
    }

    return element;
  }

  function renderTree(node, container) {
    if (!node || !container) {
      return;
    }

    const fragment = document.createDocumentFragment();

    const appendNode = (current) => {
      fragment.appendChild(createPlaqueElement(current));
      if (current.advisor) {
        fragment.appendChild(createPlaqueElement(current.advisor));
      }
      current.children.forEach(appendNode);
    };

    appendNode(node);
    container.appendChild(fragment);
  }
  
  function getRoleLabel(role) {
    if (!role) {
      return '';
    }
    const labels = displayText.roles || {};
    return labels[role] || role.toUpperCase();
  }
  
  function getTreeDimensions(node, layout) {
    if (!node || !layout) {
      return { width: 0, height: 0 };
    }

    let maxX = node.x + layout.getNodeWidth(node);
    let maxY = node.y + layout.getNodeHeight(node);

    const evaluateNode = (current) => {
      maxX = Math.max(maxX, current.x + layout.getNodeWidth(current));
      maxY = Math.max(maxY, current.y + layout.getNodeHeight(current));

      if (current.advisor) {
        maxX = Math.max(maxX, current.advisor.x + layout.getNodeWidth(current.advisor));
        maxY = Math.max(maxY, current.advisor.y + layout.getNodeHeight(current.advisor));
      }

      current.children.forEach(evaluateNode);
    };

    evaluateNode(node);

    return {
      width: maxX + layout.marginLeft,
      height: maxY + layout.marginTop
    };
  }
  
  function shiftTreePositions(node, offset) {
    node.x += offset;

    if (node.advisor) {
      node.advisor.x += offset;
    }

    node.children.forEach(child => shiftTreePositions(child, offset));
  }

  function normalizeKey(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  function addToGroup(map, key, item) {
    const normalized = normalizeKey(key);
    if (!normalized) {
      return;
    }
    const group = map.get(normalized);
    if (group) {
      group.push(item);
    } else {
      map.set(normalized, [item]);
    }
  }

  function groupBy(list, keySelector) {
    const map = new Map();
    if (!Array.isArray(list)) {
      return map;
    }
    list.forEach(item => {
      if (!item) {
        return;
      }
      addToGroup(map, keySelector(item), item);
    });
    return map;
  }

  function classifyAssociates(list) {
    const byCapo = new Map();
    const byConsigliere = new Map();
    const bySoldato = new Map();

    if (!Array.isArray(list)) {
      return { byCapo, byConsigliere, bySoldato };
    }

    list.forEach(associate => {
      if (!associate) {
        return;
      }

      if (associate.assigned_soldato) {
        addToGroup(bySoldato, associate.assigned_soldato, associate);
      } else if (associate.assigned_consigliere) {
        addToGroup(byConsigliere, associate.assigned_consigliere, associate);
      } else if (associate.assigned_capo) {
        addToGroup(byCapo, associate.assigned_capo, associate);
      }
    });

    return { byCapo, byConsigliere, bySoldato };
  }

  function createRosterIndex(roster) {
    const capos = Array.isArray(roster?.capo) ? roster.capo.slice() : [];
    const consiglieres = Array.isArray(roster?.consigliere) ? roster.consigliere.slice() : [];
    const soldatos = Array.isArray(roster?.soldato) ? roster.soldato.slice() : [];
    const associates = Array.isArray(roster?.associate) ? roster.associate.slice() : [];

    const associateGroups = classifyAssociates(associates);

    return {
      capos,
      consiglieresByCapo: groupBy(consiglieres, item => item.assigned_capo),
      soldatosByCapo: groupBy(soldatos, item => item.assigned_capo),
      associatesByConsigliere: associateGroups.byConsigliere,
      associatesBySoldato: associateGroups.bySoldato,
      associatesByCapo: associateGroups.byCapo
    };
  }

  function getGroup(map, key) {
    if (!map) {
      return [];
    }
    const normalized = normalizeKey(key);
    if (!normalized) {
      return [];
    }
    const group = map.get(normalized);
    return group ? group.slice() : [];
  }

  function createNodeId(prefix, name) {
    const normalized = normalizeKey(name).toLowerCase();
    const safe = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const unique = safe || Math.random().toString(36).slice(2, 8);
    return `${prefix}-${unique}`;
  }

  function clearElement(element) {
    if (!element) {
      return;
    }
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  let resizeTimerId = null;

  // MAIN POPULATION FUNCTION

  window.populateFamilyRoster = function() {
    const data = window.ledgerData;

    if (!data || !data.familyroster) {
      setOrgTreeCache(null);
      if (config.DEBUG) console.error(displayText.errors?.rosterDataMissing || 'Roster data not available');
      return;
    }

    const container = document.getElementById(selectors.organizationalChart);
    if (!container) {
      setOrgTreeCache(null);
      if (config.DEBUG) console.error(displayText.errors?.chartContainerMissing || 'Organizational chart container not found');
      return;
    }

    const rosterIndex = createRosterIndex(data.familyroster);
    const tree = buildTreeStructure(data.familyroster, rosterIndex);

    if (!tree) {
      setOrgTreeCache(null);
      if (config.DEBUG) console.error('Failed to build tree structure');
      return;
    }

    const orgTree = window.buildOrgTree(data.familyroster, rosterIndex);
    setOrgTreeCache(orgTree);

    const existingSvg = container.querySelector('.org-chart-lines-svg');
    if (existingSvg && existingSvg.parentNode) {
      existingSvg.parentNode.removeChild(existingSvg);
    }

    clearElement(container);

    const layout = new OrgChartLayout(layoutConfig);
    layout.calculatePositions(tree);

    const containerWidth = container.parentElement ? container.parentElement.clientWidth : layout.getNodeWidth(tree);
    const dimsBeforeRender = getTreeDimensions(tree, layout);
    const offset = Math.max((containerWidth - dimsBeforeRender.width) / 2, 0);
    shiftTreePositions(tree, offset);

    renderTree(tree, container);

    const dimsAfterRender = getTreeDimensions(tree, layout);
    container.style.width = `${Math.ceil(dimsAfterRender.width)}px`;
    container.style.height = `${Math.ceil(dimsAfterRender.height)}px`;

    const svgElement = document.createElementNS(config.SVG_NAMESPACE || 'http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('id', selectors.orgChartLines || 'orgChartLines');
    svgElement.classList.add('org-chart-lines-svg');
    container.appendChild(svgElement);

    const delay = timing.rosterLinesDelay ?? 250;
    setTimeout(() => {
      if (typeof window.drawOrgChartLines === 'function') {
        requestAnimationFrame(() => window.drawOrgChartLines());
      }
    }, delay);
  };

  // RESIZE HANDLING

  function handleResize() {
    if (resizeTimerId) {
      clearTimeout(resizeTimerId);
    }

    resizeTimerId = setTimeout(() => {
      if (typeof window.drawOrgChartLines === 'function') {
        window.drawOrgChartLines();
      }
    }, timing.resizeDebounce ?? 250);
  }
  
  window.addEventListener('resize', handleResize);
  
  // INITIALIZATION
  
  function initRoster() {
    if (window.ledgerData && window.ledgerData.familyroster) {
      window.populateFamilyRoster();
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRoster);
  } else {
    initRoster();
  }
  
  window.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'populate') {
      window.populateFamilyRoster();
    }
  });
  
})();

