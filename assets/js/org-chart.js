// Org Chart - Reingold-Tilford layout + SVG lines (simplified)
(function() {
  'use strict';

  const SELECTORS = {
    organizationalChart: 'organizationalChart',
    orgChartLines: 'orgChartLines'
  };

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

  const ROLE_LABELS = {
    boss: 'CAPO DI TUTTI CAPI',
    boss_consigliere: 'CONSIGLIERE DI SAN FRANCISCO',
    capo: 'CAPO',
    consigliere: 'LA SQUADRA (CONSIGLIERE)',
    soldato: 'LA SQUADRA (SOLDATO)',
    associate: 'LA FAMIGLIA (ASSOCIATE)'
  };

  const DEFAULTS = {
    status: 'active',
    unknown: 'Unknown'
  };

  // -----------------------
  // Reingold-Tilford layout
  // -----------------------
  class OrgChartLayout {
    constructor(options = {}) {
      this.leadershipWidth = (options.plaqueWidths && options.plaqueWidths.leadership) || 380;
      this.leadershipHeight = options.leadershipHeight ?? 224;
      this.crewWidth = (options.plaqueWidths && options.plaqueWidths.crew) || 320;
      this.crewHeight = options.crewHeight ?? 189;
      this.horizontalSpacing = options.horizontalSpacing ?? 50;
      this.verticalSpacing = options.verticalSpacing ?? 100;
      this.advisorGap = options.advisorGap ?? 80;
      this.marginLeft = options.marginLeft ?? 50;
      this.marginTop = options.marginTop ?? 50;
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
        node.prelim = leftSibling ? leftSibling.prelim + this.getSeparation(leftSibling, node) : 0;
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
      if (!leftSibling) return defaultAncestor;
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
      if (vil.ancestor.parent === node.parent) return vil.ancestor;
      return defaultAncestor;
    }
    secondWalk(node, modSum) {
      node.finalX = node.prelim + modSum;
      modSum += node.mod;
      node.children.forEach(child => this.secondWalk(child, modSum));
    }
    assignVerticalPositions(node, currentY) {
      node.y = currentY;
      if (node.advisor) node.advisor.y = currentY;
      const nextY = currentY + this.getNodeHeight(node) + this.verticalSpacing;
      node.children.forEach(child => this.assignVerticalPositions(child, nextY));
    }
    finalizeCoordinates(node) {
      const width = this.getNodeWidth(node);
      node.x = node.finalX - width / 2;
      node.children.forEach(child => this.finalizeCoordinates(child));
    }
    adjustToPositive(node) {
      let minX = Infinity;
      const findMinX = (n) => {
        minX = Math.min(minX, n.x);
        n.children.forEach(findMinX);
        if (n.advisor) minX = Math.min(minX, n.advisor.x);
      };
      findMinX(node);
      const applyShift = (shift) => {
        const shiftNode = (n) => {
          n.x += shift;
          if (typeof n.finalX === 'number') n.finalX += shift;
          n.children.forEach(shiftNode);
          if (n.advisor) {
            n.advisor.x += shift;
            if (typeof n.advisor.finalX === 'number') n.advisor.finalX += shift;
          }
        };
        shiftNode(node);
      };
      if (minX < 0) {
        const offset = Math.abs(minX) + this.marginLeft;
        applyShift(offset);
      } else {
        applyShift(this.marginLeft);
      }
      const shiftY = (n) => {
        n.y += this.marginTop;
        n.children.forEach(shiftY);
        if (n.advisor) n.advisor.y += this.marginTop;
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

  // -----------------------
  // Data shaping helpers
  // -----------------------
  function normalizeKey(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }
  function addToGroup(map, key, item) {
    const normalized = normalizeKey(key);
    if (!normalized) return;
    const group = map.get(normalized);
    if (group) group.push(item);
    else map.set(normalized, [item]);
  }
  function groupBy(list, keySelector) {
    const map = new Map();
    if (!Array.isArray(list)) return map;
    list.forEach(item => {
      if (!item) return;
      addToGroup(map, keySelector(item), item);
    });
    return map;
  }
  function classifyAssociates(list) {
    const byCapo = new Map();
    const byConsigliere = new Map();
    const bySoldato = new Map();
    const unassigned = [];
    if (!Array.isArray(list)) return { byCapo, byConsigliere, bySoldato, unassigned };
    list.forEach(associate => {
      if (!associate) return;
      const assignedSoldato = normalizeKey(associate.assigned_soldato);
      const assignedConsigliere = normalizeKey(associate.assigned_consigliere);
      const assignedCapo = normalizeKey(associate.assigned_capo);
      if (assignedSoldato) {
        addToGroup(bySoldato, assignedSoldato, associate);
      } else if (assignedConsigliere) {
        addToGroup(byConsigliere, assignedConsigliere, associate);
      } else if (assignedCapo) {
        addToGroup(byCapo, assignedCapo, associate);
      } else {
        unassigned.push(associate);
      }
    });
    return { byCapo, byConsigliere, bySoldato, unassigned };
  }
  function createRosterIndex(roster) {
    const capos = Array.isArray(roster?.capo) ? roster.capo.slice() : [];
    const consiglieres = Array.isArray(roster?.consigliere) ? roster.consigliere.slice() : [];
    const soldatos = Array.isArray(roster?.soldato) ? roster.soldato.slice() : [];
    const associates = Array.isArray(roster?.associate) ? roster.associate.slice() : [];
    const associateGroups = classifyAssociates(associates);
    const unassignedConsiglieres = consiglieres.filter(item => !normalizeKey(item?.assigned_capo));
    const unassignedSoldatos = soldatos.filter(item => !normalizeKey(item?.assigned_capo));
    return {
      capos,
      consiglieresByCapo: groupBy(consiglieres, item => item.assigned_capo),
      soldatosByCapo: groupBy(soldatos, item => item.assigned_capo),
      associatesByConsigliere: associateGroups.byConsigliere,
      associatesBySoldato: associateGroups.bySoldato,
      associatesByCapo: associateGroups.byCapo,
      unassigned: {
        consiglieres: unassignedConsiglieres,
        soldatos: unassignedSoldatos,
        associates: associateGroups.unassigned || []
      }
    };
  }
  function getGroup(map, key) {
    if (!map) return [];
    const normalized = normalizeKey(key);
    if (!normalized) return [];
    const group = map.get(normalized);
    return group ? group.slice() : [];
  }
  function createNodeId(prefix, name) {
    const normalized = normalizeKey(name).toLowerCase();
    const safe = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const unique = safe || Math.random().toString(36).slice(2, 8);
    return `${prefix}-${unique}`;
  }

  function buildUnifiedOrgData(roster, rosterIndex) {
    if (!roster) return null;
    const index = rosterIndex || createRosterIndex(roster);
    const bossData = Array.isArray(roster.boss) && roster.boss[0] ? roster.boss[0] : { name: 'No Boss', status: 'vacant' };
    const hierarchy = {
      id: 'boss',
      role: 'boss',
      data: bossData,
      children: [],
      parent: null,
      mod: 0,
      isLeadership: true
    };
    const bossConsigliereData = Array.isArray(roster.boss_consigliere) && roster.boss_consigliere[0] ? roster.boss_consigliere[0] : null;
    if (bossConsigliereData) {
      hierarchy.advisor = {
        id: 'boss-consigliere',
        role: 'boss_consigliere',
        data: bossConsigliereData,
        isLeadership: true,
        x: 0,
        y: 0,
        mod: 0,
        parent: hierarchy,
        children: []
      };
    }
    const org = {
      boss: bossData || null,
      bossConsigliere: bossConsigliereData || null,
      capos: [],
      unassigned: {
        consiglieres: [],
        soldatos: [],
        associates: []
      }
    };
    index.capos.forEach(capo => {
      const capoNode = {
        id: createNodeId('capo', capo?.name),
        role: 'capo',
        data: capo,
        children: [],
        parent: hierarchy,
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
        const associatesForCons = getGroup(index.associatesByConsigliere, consigliere?.name);
        associatesForCons.forEach(associate => {
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
        const associatesForSoldato = getGroup(index.associatesBySoldato, soldato?.name);
        associatesForSoldato.forEach(associate => {
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
      hierarchy.children.push(capoNode);
      const capoEntry = {
        capo,
        consiglieres: [],
        soldatos: [],
        associates: directAssociates
      };
      consiglieres.forEach(consigliere => {
        capoEntry.consiglieres.push({
          consigliere,
          associates: getGroup(index.associatesByConsigliere, consigliere?.name)
        });
      });
      soldatos.forEach(soldato => {
        capoEntry.soldatos.push({
          soldato,
          associates: getGroup(index.associatesBySoldato, soldato?.name)
        });
      });
      org.capos.push(capoEntry);
    });

    const unassignedSection = index.unassigned || {};
    const unassignedConsiglieres = Array.isArray(unassignedSection.consiglieres)
      ? unassignedSection.consiglieres
      : [];
    unassignedConsiglieres.forEach(consigliere => {
      const associatesForCons = getGroup(index.associatesByConsigliere, consigliere?.name);
      org.unassigned.consiglieres.push({
        consigliere,
        associates: associatesForCons
      });
    });
    const unassignedSoldatos = Array.isArray(unassignedSection.soldatos)
      ? unassignedSection.soldatos
      : [];
    unassignedSoldatos.forEach(soldato => {
      const associatesForSoldato = getGroup(index.associatesBySoldato, soldato?.name);
      org.unassigned.soldatos.push({
        soldato,
        associates: associatesForSoldato
      });
    });
    const unassignedAssociates = Array.isArray(unassignedSection.associates)
      ? unassignedSection.associates.slice()
      : [];
    unassignedAssociates.forEach(associate => {
      org.unassigned.associates.push(associate);
    });
    return { hierarchy, org, index };
  }

  // -----------------------
  // Rendering
  // -----------------------
  function getRoleLabel(role) {
    if (!role) return '';
    return ROLE_LABELS[role] || role.toUpperCase();
  }
  function createPlaqueElement(node) {
    const element = document.createElement('div');
    element.className = `roster-plaque ${node.isLeadership ? 'leadership' : 'crew'}`;
    const status = node.data?.status || DEFAULTS.status;
    if (status) element.classList.add(status);
    if (node.data?.name) element.dataset.nodeName = node.data.name;
    element.style.position = 'absolute';
    element.style.left = `${Math.round(node.x)}px`;
    element.style.top = `${Math.round(node.y)}px`;
    const roleLabel = document.createElement('div');
    roleLabel.className = 'plaque-role';
    roleLabel.textContent = getRoleLabel(node.role);
    element.appendChild(roleLabel);
    const nameEl = document.createElement('div');
    nameEl.className = 'plaque-name';
    nameEl.textContent = node.data?.name || DEFAULTS.unknown;
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
    if (!node || !container) return;
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
  function renderUnassignedCrew(org) {
    const panel = document.getElementById('unassignedCrew');
    if (!panel) return;
    panel.innerHTML = '';
    const unassigned = org?.unassigned || {};
    const hasConsiglieres = Array.isArray(unassigned.consiglieres) && unassigned.consiglieres.length > 0;
    const hasSoldatos = Array.isArray(unassigned.soldatos) && unassigned.soldatos.length > 0;
    const hasAssociates = Array.isArray(unassigned.associates) && unassigned.associates.length > 0;
    const plaque = document.createElement('div');
    plaque.className = 'roster-plaque unassigned';
    const plaqueHeader = document.createElement('div');
    plaqueHeader.className = 'plaque-role';
    plaqueHeader.textContent = 'Unassigned Crew';
    plaque.appendChild(plaqueHeader);
    if (!hasConsiglieres && !hasSoldatos && !hasAssociates) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'plaque-detail';
      emptyMsg.textContent = 'All crew are currently assigned.';
      plaque.appendChild(emptyMsg);
      panel.appendChild(plaque);
      return;
    }
    const sections = [
      {
        key: 'consiglieres',
        label: 'Consiglieres',
        items: unassigned.consiglieres || [],
        getPerson: entry => entry?.consigliere,
        getChildren: entry => entry?.associates,
        childLabel: 'Associates'
      },
      {
        key: 'soldatos',
        label: 'Soldatos',
        items: unassigned.soldatos || [],
        getPerson: entry => entry?.soldato,
        getChildren: entry => entry?.associates,
        childLabel: 'Associates'
      },
      {
        key: 'associates',
        label: 'Associates',
        items: unassigned.associates || [],
        getPerson: entry => entry || null
      }
    ];
    const createMeta = (person) => {
      if (!person) return '';
      const parts = [];
      if (person.clan) parts.push(person.clan);
      if (person.status) parts.push(person.status);
      return parts.join(' • ');
    };
    sections.forEach(section => {
      if (!Array.isArray(section.items) || section.items.length === 0) return;
      const sectionEl = document.createElement('div');
      sectionEl.className = 'unassigned-section';
      const header = document.createElement('div');
      header.className = 'unassigned-section-title';
      header.textContent = section.label;
      sectionEl.appendChild(header);
      section.items.forEach(item => {
        const person = section.getPerson(item);
        if (!person || !person.name) return;
        const nameEl = document.createElement('div');
        nameEl.className = 'plaque-name';
        nameEl.textContent = person.name;
        sectionEl.appendChild(nameEl);
        const metaText = createMeta(person);
        if (metaText) {
          const metaEl = document.createElement('div');
          metaEl.className = 'plaque-detail';
          metaEl.textContent = metaText;
          sectionEl.appendChild(metaEl);
        }
        if (typeof section.getChildren === 'function') {
          const children = Array.isArray(section.getChildren(item)) ? section.getChildren(item) : [];
          if (children.length > 0) {
            const childHeader = document.createElement('div');
            childHeader.className = 'unassigned-entry-subtitle';
            childHeader.textContent = section.childLabel || 'Crew';
            sectionEl.appendChild(childHeader);
            const childList = document.createElement('ul');
            childList.className = 'unassigned-sublist';
            children.forEach(child => {
              if (!child || !child.name) return;
              const childItem = document.createElement('li');
              childItem.className = 'unassigned-subentry';
              childItem.textContent = child.name;
              childList.appendChild(childItem);
            });
            sectionEl.appendChild(childList);
          }
        }
      });
      plaque.appendChild(sectionEl);
    });
    panel.appendChild(plaque);
  }
  function getTreeDimensions(node, layout) {
    if (!node || !layout) return { width: 0, height: 0 };
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
    return { width: maxX + layout.marginLeft, height: maxY + layout.marginTop };
  }
  function shiftTreePositions(node, offset) {
    node.x += offset;
    if (node.advisor) node.advisor.x += offset;
    node.children.forEach(child => shiftTreePositions(child, offset));
  }

  // -----------------------
  // Lines (SVG)
  // -----------------------
  function updateSVGDimensions(svg, container) {
    const width = container.scrollWidth;
    const height = container.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
  }
  function drawPath(svg, pathData, className) {
    const path = document.createElementNS(SVG_NAMESPACE, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('class', className);
    svg.appendChild(path);
    return path;
  }
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
  function drawAdvisoryLine(svg, fromPos, toPos) {
    const yDiff = Math.abs(fromPos.centerY - toPos.centerY);
    if (yDiff < 10) {
      drawPath(svg, `M ${fromPos.right},${fromPos.centerY} L ${toPos.left},${toPos.centerY}`, 'advisory-line');
    } else {
      const midX = (fromPos.right + toPos.left) / 2;
      drawPath(svg,
        `M ${fromPos.right},${fromPos.centerY} ` +
        `L ${midX},${fromPos.centerY} ` +
        `L ${midX},${toPos.centerY} ` +
        `L ${toPos.left},${toPos.centerY}`,
        'advisory-line'
      );
    }
  }
  function drawCommandLine(svg, fromPos, toPos) {
    const midY = (fromPos.bottom + toPos.top) / 2;
    drawPath(svg,
      `M ${fromPos.centerX},${fromPos.bottom} ` +
      `L ${fromPos.centerX},${midY} ` +
      `L ${toPos.centerX},${midY} ` +
      `L ${toPos.centerX},${toPos.top}`,
      'command-line'
    );
  }
  function drawHierarchyLines(svg, parentPos, childPositions) {
    if (childPositions.length === 0) return;
    const childXs = childPositions.map(p => p.centerX);
    const leftX = Math.min(...childXs);
    const rightX = Math.max(...childXs);
    const childTopY = Math.min(...childPositions.map(p => p.top));
    const midY = (parentPos.bottom + childTopY) / 2;
    drawPath(svg, `M ${parentPos.centerX},${parentPos.bottom} L ${parentPos.centerX},${midY}`, 'command-line');
    drawPath(svg, `M ${leftX},${midY} L ${rightX},${midY}`, 'command-line');
    childPositions.forEach(childPos => {
      drawPath(svg, `M ${childPos.centerX},${midY} L ${childPos.centerX},${childPos.top}`, 'command-line');
    });
  }

  window.drawOrgChartLines = function() {
    const data = window.ledgerData;
    if (!data || !data.familyroster) return;
    const svg = document.getElementById(SELECTORS.orgChartLines);
    const container = document.getElementById(SELECTORS.organizationalChart);
    if (!svg || !container) return;
    const plaques = container.querySelectorAll('.roster-plaque');
    if (plaques.length === 0) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    updateSVGDimensions(svg, container);
    const positions = getAllPositions(container);
    if (positions.size === 0) return;
    const cached = window.__orgChartTreeCache || null;
    const orgTree = cached && cached.org
      ? cached.org
      : (cached && cached.capos ? cached : (buildOrgTree ? buildOrgTree(data.familyroster) : null));
    if (!orgTree) return;
    drawBossLevel(svg, orgTree, positions);
    drawCapoLevel(svg, orgTree, positions);
    // Keep header aligned to boss after (re)draw
    updateHeaderAlignment(container, positions, orgTree);
    // On redraw (e.g., resize), keep the boss centered
    centerViewportOnBoss(container, positions, orgTree);
  };

  function drawBossLevel(svg, orgTree, positions) {
    if (!orgTree.boss) return;
    const bossPos = positions.get(orgTree.boss.name);
    if (!bossPos) return;
    if (orgTree.bossConsigliere) {
      const consPos = positions.get(orgTree.bossConsigliere.name);
      if (consPos) drawAdvisoryLine(svg, bossPos, consPos);
    }
    orgTree.capos.forEach(capoData => {
      const capoPos = positions.get(capoData.capo.name);
      if (capoPos) drawCommandLine(svg, bossPos, capoPos);
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
          crewMembers.push({ pos: consPos, member: consData.consigliere, associates: consData.associates });
        }
      });
      capoData.soldatos.forEach(soldatoData => {
        const soldatoPos = positions.get(soldatoData.soldato.name);
        if (soldatoPos) {
          crewMembers.push({ pos: soldatoPos, member: soldatoData.soldato, associates: soldatoData.associates });
        }
      });
      if (crewMembers.length > 0) {
        drawHierarchyLines(svg, capoPos, crewMembers.map(c => c.pos));
      }
      crewMembers.forEach(crewMember => {
        if (crewMember.associates && crewMember.associates.length > 0) {
          const assocPositions = crewMember.associates.map(assoc => positions.get(assoc.name)).filter(Boolean);
          if (assocPositions.length > 0) {
            drawHierarchyLines(svg, crewMember.pos, assocPositions);
          }
        }
      });
      if (capoData.associates && capoData.associates.length > 0) {
        const directAssocPositions = capoData.associates.map(associate => positions.get(associate.name)).filter(Boolean);
        if (directAssocPositions.length > 0) {
          drawHierarchyLines(svg, capoPos, directAssocPositions);
        }
      }
    });
  }

  // Expose builder used by drawOrgChartLines fallback
  function buildTreeStructure(roster, rosterIndex) {
    const unified = buildUnifiedOrgData(roster, rosterIndex);
    return unified ? unified.hierarchy : null;
  }
  window.buildOrgTree = function(roster, rosterIndex) {
    const unified = buildUnifiedOrgData(roster, rosterIndex);
    return unified ? unified.org : null;
  };

  // -----------------------
  // Main populate
  // -----------------------
  function clearElement(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function populateFamilyRosterInternal() {
    const data = window.ledgerData;
    if (!data || !data.familyroster) {
      window.__orgChartTreeCache = null;
      console.error('Roster data not available');
      return;
    }
    const container = document.getElementById(SELECTORS.organizationalChart);
    if (!container) {
      window.__orgChartTreeCache = null;
      console.error('Organizational chart container not found');
      return;
    }
    const unified = buildUnifiedOrgData(data.familyroster);
    const tree = unified ? unified.hierarchy : null;
    if (!tree) {
      window.__orgChartTreeCache = null;
      console.error('Failed to build tree structure');
      return;
    }
    window.__orgChartTreeCache = unified;
    const existingSvg = container.querySelector('.org-chart-lines-svg');
    if (existingSvg && existingSvg.parentNode) existingSvg.parentNode.removeChild(existingSvg);
    clearElement(container);
    const layout = new OrgChartLayout({
      plaqueWidths: { leadership: 380, crew: 320 },
      horizontalSpacing: 50,
      verticalSpacing: 100,
      advisorGap: 80,
      marginLeft: 50,
      marginTop: 50
    });
    layout.calculatePositions(tree);
    const containerWidth = container.clientWidth || layout.getNodeWidth(tree);
    const dimsBeforeRender = getTreeDimensions(tree, layout);
    const offset = Math.max((containerWidth - dimsBeforeRender.width) / 2, 0);
    shiftTreePositions(tree, offset);
    renderTree(tree, container);
    renderUnassignedCrew(unified.org);
    const dimsAfterRender = getTreeDimensions(tree, layout);
    container.style.width = `${Math.ceil(dimsAfterRender.width)}px`;
    container.style.height = `${Math.ceil(dimsAfterRender.height)}px`;
    const svgElement = document.createElementNS(SVG_NAMESPACE, 'svg');
    svgElement.setAttribute('id', SELECTORS.orgChartLines);
    svgElement.classList.add('org-chart-lines-svg');
    container.appendChild(svgElement);
    setTimeout(() => {
      if (typeof window.drawOrgChartLines === 'function') {
        requestAnimationFrame(() => window.drawOrgChartLines());
      }
    }, 250);

    // Track header position on scroll
    container.addEventListener('scroll', () => {
      const positions = getAllPositions(container);
      if (window.__orgChartTreeCache && window.__orgChartTreeCache.org) {
        updateHeaderAlignment(container, positions, window.__orgChartTreeCache.org);
      }
    }, { passive: true });
  }

  window.populateFamilyRoster = function() {
    populateFamilyRosterInternal();
  };

  // -----------------------
  // Resize handling
  // -----------------------
  let resizeObserver = null;
  function initResizeObserver() {
    const container = document.getElementById(SELECTORS.organizationalChart);
    if (!container) return;
    if (typeof ResizeObserver === 'function') {
      if (resizeObserver) resizeObserver.disconnect();
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          if (window.ledgerData && window.ledgerData.familyroster) {
            window.drawOrgChartLines();
          }
        });
      });
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', debounce(() => {
        if (window.ledgerData && window.ledgerData.familyroster) {
          window.drawOrgChartLines();
        }
      }, 250));
    }
  }

  function debounce(fn, wait) {
    let id = null;
    return function() {
      if (id) clearTimeout(id);
      id = setTimeout(fn, wait);
    };
  }

  // -----------------------
  // Centering and header alignment
  // -----------------------
  function centerViewportOnBoss(container, positions, orgTree) {
    if (!container || !positions || !orgTree || !orgTree.boss) return;
    const bossPos = positions.get(orgTree.boss.name);
    if (!bossPos) return;
    const targetLeft = Math.max(0, Math.round(bossPos.centerX - (container.clientWidth / 2)));
    container.scrollTo({ left: targetLeft, behavior: 'auto' });
  }

  function updateHeaderAlignment(container, positions, orgTree) {
    if (!container || !positions || !orgTree || !orgTree.boss) return;
    const bossPos = positions.get(orgTree.boss.name);
    if (!bossPos) return;
    const header = document.querySelector('.roster-title');
    const subheader = document.querySelector('.roster-subtitle');
    if (!header && !subheader) return;
    const viewportCenterX = container.scrollLeft + (container.clientWidth / 2);
    const delta = bossPos.centerX - viewportCenterX;
    const translateValue = `translateX(${Math.round(delta)}px)`;
    if (header) header.style.transform = translateValue;
    if (subheader) subheader.style.transform = translateValue;
  }

  // -----------------------
  // Boot
  // -----------------------
  function initRoster() {
    if (window.ledgerData && window.ledgerData.familyroster) {
      window.populateFamilyRoster();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initResizeObserver();
      initRoster();
    });
  } else {
    initResizeObserver();
    initRoster();
  }

  window.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'populate') {
      window.populateFamilyRoster();
    } else if (event.data && event.data.action === 'dataUpdate') {
      if (event.data.ledgerData) {
        window.ledgerData = event.data.ledgerData;
        if (typeof window.populateFamilyRoster === 'function' && window.ledgerData && window.ledgerData.familyroster) {
          window.populateFamilyRoster();
        }
      }
    }
  });
})();


