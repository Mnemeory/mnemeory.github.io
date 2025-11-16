// Org Chart - Reingold-Tilford layout + Canvas lines (center-based)
(function() {
  'use strict';

  const SELECTORS = {
    organizationalChart: 'organizationalChart',
    orgChartLinesCanvas: 'orgChartLinesCanvas'
  };

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

  /**
   * @typedef {Object} RosterPerson
   * @property {string} [name]
   * @property {string} [status]
   * @property {string} [clan]
   * @property {string} [assigned_capo]
   * @property {string} [assigned_consigliere]
   * @property {string} [assigned_soldato]
   */

  /**
   * @typedef {Object} OrgNode
   * @property {string} id
   * @property {string} role
   * @property {RosterPerson|null} data
   * @property {OrgNode[]} children
   * @property {OrgNode|null} parent
   * @property {boolean} isLeadership
   * @property {boolean} [isIndependentRoot]
   * @property {string|null} [independentRootId]
   * @property {Object<string, RosterPerson[]>} [childSources]
   * @property {OrgNode} [advisor]
   * @property {number} [width]
   * @property {number} [height]
   * @property {number} [x]
   * @property {number} [y]
   */

  const INDEPENDENT_CAPO_DATA = Object.freeze({
    name: 'Independent',
    clan: 'Independent Crew',
    status: DEFAULTS.status
  });

  const ROLE_TREE_SPEC = {
    capo: [
      {
        role: 'consigliere',
        source: (index, node) => getGroup(index.consiglieresByCapo, node?.data?.name),
        isLeadership: false
      },
      {
        role: 'soldato',
        source: (index, node) => getGroup(index.soldatosByCapo, node?.data?.name),
        isLeadership: false
      },
      {
        role: 'associate',
        source: (index, node) => getGroup(index.associatesByCapo, node?.data?.name),
        isLeadership: false
      }
    ],
    consigliere: [
      {
        role: 'associate',
        source: (index, node) => getGroup(index.associatesByConsigliere, node?.data?.name),
        isLeadership: false
      }
    ],
    soldato: [
      {
        role: 'associate',
        source: (index, node) => getGroup(index.associatesBySoldato, node?.data?.name),
        isLeadership: false
      }
    ]
  };

  function assignIndependentRoot(parent, explicitRootId) {
    if (typeof explicitRootId === 'string') return explicitRootId;
    if (parent?.isIndependentRoot) return parent.id;
    if (parent?.independentRootId) return parent.independentRootId;
    return null;
  }

  /**
   * @param {string} role
   * @param {RosterPerson|null} data
   * @param {OrgNode|null} parent
   * @param {Object} [options]
   * @param {boolean} [options.isLeadership]
   * @param {boolean} [options.isIndependentRoot]
   * @param {string} [options.id]
   * @param {Object<string, RosterPerson[]>} [options.childSources]
   * @returns {OrgNode}
   */
  function createPersonNode(role, data, parent, options = {}) {
    const node = {
      id: options.id || createNodeId(role, data?.name),
      role,
      data,
      children: [],
      parent: parent || null,
      mod: 0,
      isLeadership: !!options.isLeadership,
      childSources: options.childSources || null,
      isIndependentRoot: !!options.isIndependentRoot
    };
    node.independentRootId = node.isIndependentRoot
      ? node.id
      : assignIndependentRoot(parent, options.independentRootId);
    return node;
  }

  function buildRoleChildren(node, index) {
    const specs = ROLE_TREE_SPEC[node.role];
    if (!specs || specs.length === 0) return;
    const overrides = node.childSources || null;
    specs.forEach(spec => {
      const hasOverride = overrides && Object.prototype.hasOwnProperty.call(overrides, spec.role);
      const sourceList = hasOverride ? overrides[spec.role] : (spec.source ? spec.source(index, node) : []);
      const list = Array.isArray(sourceList) ? sourceList : [];
      list.forEach(person => {
        const child = createPersonNode(spec.role, person, node, {
          isLeadership: !!spec.isLeadership
        });
        node.children.push(child);
        buildRoleChildren(child, index);
      });
    });
  }

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
    annotateNodeSizes(node) {
      node.width = this.getNodeWidth(node);
      node.height = this.getNodeHeight(node);
      if (node.advisor) {
        node.advisor.width = this.getNodeWidth(node.advisor);
        node.advisor.height = this.getNodeHeight(node.advisor);
      }
      node.children.forEach(child => this.annotateNodeSizes(child));
    }
    applyHorizontalShift(node, shift) {
      if (!node || !shift) return;
      const shiftNode = (current) => {
        current.x += shift;
        if (typeof current.finalX === 'number') current.finalX += shift;
        current.children.forEach(shiftNode);
        if (current.advisor) {
          current.advisor.x += shift;
          if (typeof current.advisor.finalX === 'number') current.advisor.finalX += shift;
        }
      };
      shiftNode(node);
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
      this.annotateNodeSizes(tree);
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
    const independentConsiglieres = consiglieres.filter(item => !normalizeKey(item?.assigned_capo));
    const independentSoldatos = soldatos.filter(item => !normalizeKey(item?.assigned_capo));
    return {
      capos,
      consiglieresByCapo: groupBy(consiglieres, item => item.assigned_capo),
      soldatosByCapo: groupBy(soldatos, item => item.assigned_capo),
      associatesByConsigliere: associateGroups.byConsigliere,
      associatesBySoldato: associateGroups.bySoldato,
      associatesByCapo: associateGroups.byCapo,
      independent: {
        consiglieres: independentConsiglieres,
        soldatos: independentSoldatos,
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

  function createCapoOrgEntry(capo, index) {
    const capoName = capo?.name;
    const consiglieres = getGroup(index.consiglieresByCapo, capoName);
    const soldatos = getGroup(index.soldatosByCapo, capoName);
    const directAssociates = getGroup(index.associatesByCapo, capoName);
    const summary = {
      capo,
      consiglieres: consiglieres.map(consigliere => ({
        consigliere,
        associates: getGroup(index.associatesByConsigliere, consigliere?.name)
      })),
      soldatos: soldatos.map(soldato => ({
        soldato,
        associates: getGroup(index.associatesBySoldato, soldato?.name)
      })),
      associates: directAssociates
    };
    return {
      summary,
      nodeConfig: {
        capo,
        isIndependent: false,
        childSources: null
      }
    };
  }

  function createIndependentOrgEntry(index) {
    const independent = index.independent || {};
    const consiglieres = Array.isArray(independent.consiglieres) ? independent.consiglieres.slice() : [];
    const soldatos = Array.isArray(independent.soldatos) ? independent.soldatos.slice() : [];
    const associates = Array.isArray(independent.associates) ? independent.associates.slice() : [];
    const hasCrew = consiglieres.length > 0 || soldatos.length > 0 || associates.length > 0;
    if (!hasCrew) return null;
    const summary = {
      capo: INDEPENDENT_CAPO_DATA,
      consiglieres: consiglieres.map(consigliere => ({
        consigliere,
        associates: getGroup(index.associatesByConsigliere, consigliere?.name)
      })),
      soldatos: soldatos.map(soldato => ({
        soldato,
        associates: getGroup(index.associatesBySoldato, soldato?.name)
      })),
      associates: associates.slice()
    };
    return {
      summary,
      nodeConfig: {
        capo: INDEPENDENT_CAPO_DATA,
        isIndependent: true,
        childSources: {
          consigliere: consiglieres,
          soldato: soldatos,
          associate: associates
        }
      }
    };
  }

  function buildUnifiedOrgData(roster, rosterIndex) {
    if (!roster) return null;
    const index = rosterIndex || createRosterIndex(roster);
    const bossData = Array.isArray(roster.boss) && roster.boss[0] ? roster.boss[0] : { name: 'No Boss', status: 'vacant' };
    const hierarchy = createPersonNode('boss', bossData, null, { isLeadership: true, id: 'boss' });
    const bossConsigliereData = Array.isArray(roster.boss_consigliere) && roster.boss_consigliere[0]
      ? roster.boss_consigliere[0]
      : null;
    if (bossConsigliereData) {
      hierarchy.advisor = createPersonNode('boss_consigliere', bossConsigliereData, hierarchy, {
        isLeadership: true,
        id: 'boss-consigliere'
      });
    }
    const org = {
      boss: bossData || null,
      bossConsigliere: bossConsigliereData || null,
      capos: []
    };
    const capoConfigs = [];
    index.capos.forEach(capo => {
      const entry = createCapoOrgEntry(capo, index);
      org.capos.push(entry.summary);
      capoConfigs.push(entry.nodeConfig);
    });
    const independentEntry = createIndependentOrgEntry(index);
    if (independentEntry) {
      org.capos.unshift(independentEntry.summary);
      capoConfigs.unshift(independentEntry.nodeConfig);
    }
    capoConfigs.forEach(config => {
      const node = createPersonNode('capo', config.capo, hierarchy, {
        isLeadership: true,
        isIndependentRoot: !!config.isIndependent,
        childSources: config.childSources || null
      });
      hierarchy.children.push(node);
      buildRoleChildren(node, index);
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
  // -----------------------
  // Lines (Canvas)
  // -----------------------
  function getAccentGold() {
    const root = document.documentElement;
    const style = root ? getComputedStyle(root) : null;
    const color = style ? style.getPropertyValue('--accent-gold') : '';
    return (color && color.trim()) || '#D4AF37';
  }
  function ensureCanvas(container) {
    let canvas = document.getElementById(SELECTORS.orgChartLinesCanvas);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = SELECTORS.orgChartLinesCanvas;
      canvas.className = 'org-chart-lines-canvas';
      container.appendChild(canvas);
    }
    return canvas;
  }
  function sizeCanvas(canvas, container) {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.ceil(container.scrollWidth);
    const height = Math.ceil(container.scrollHeight);
    if (canvas.style.width !== `${width}px`) {
      canvas.style.width = `${width}px`;
    }
    if (canvas.style.height !== `${height}px`) {
      canvas.style.height = `${height}px`;
    }
    const targetW = Math.ceil(width * dpr);
    const targetH = Math.ceil(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }
  const COMMAND_LINE_STYLE = Object.freeze({ width: 2.5, dash: [] });
  const ADVISOR_LINE_STYLE = Object.freeze({ width: 2, dash: [8, 4] });

  function setStroke(ctx, style, color) {
    ctx.lineWidth = style.width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (ctx.setLineDash) ctx.setLineDash(style.dash || []);
  }
  function drawChildrenConnector(ctx, parent, children) {
    if (!children || children.length === 0) return;
    const p = { x: parent.x + parent.width / 2, y: parent.y + parent.height / 2 };
    const centers = children.map(c => ({ x: c.x + c.width / 2, y: c.y + c.height / 2 }));
    const minChildY = Math.min(...centers.map(c => c.y));
    const midY = (p.y + minChildY) / 2;
    const minX = Math.min(...centers.map(c => c.x));
    const maxX = Math.max(...centers.map(c => c.x));
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, midY);
    ctx.moveTo(minX, midY);
    ctx.lineTo(maxX, midY);
    centers.forEach(c => {
      ctx.moveTo(c.x, midY);
      ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();
  }
  function drawAdvisorConnector(ctx, a, b) {
    const pa = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const pb = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    const sameY = Math.abs(pa.y - pb.y) < 10;
    ctx.beginPath();
    if (sameY) {
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
    } else {
      const midX = (pa.x + pb.x) / 2;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(midX, pa.y);
      ctx.lineTo(midX, pb.y);
      ctx.lineTo(pb.x, pb.y);
    }
    ctx.stroke();
  }
  function drawTreeConnectors(ctx, node, color) {
    if (!node) return;
    const children = Array.isArray(node.children) ? node.children : [];
    const skipChildrenConnectors = Boolean(node.independentRootId && !node.isIndependentRoot);
    if (!skipChildrenConnectors && children.length > 0) {
      setStroke(ctx, COMMAND_LINE_STYLE, color);
      drawChildrenConnector(ctx, node, children);
    }
    children.forEach(child => drawTreeConnectors(ctx, child, color));
    if (node.advisor) {
      setStroke(ctx, ADVISOR_LINE_STYLE, color);
      drawAdvisorConnector(ctx, node, node.advisor);
    }
  }
  function drawIndependentAssociateConnectors(ctx, node, color) {
    if (!node) return;
    const independentRoots = [];
    (function collectRoots(current) {
      if (!current) return;
      if (current.isIndependentRoot) independentRoots.push(current);
      current.children.forEach(collectRoots);
    })(node);
    independentRoots.forEach(root => {
      const associates = [];
      (function collectAssociates(current) {
        current.children.forEach(child => {
          if (
            child.independentRootId === root.id &&
            child.parent !== root &&
            child.role === 'associate'
          ) {
            associates.push(child);
          }
          collectAssociates(child);
        });
      })(root);
      if (associates.length > 0) {
        setStroke(ctx, COMMAND_LINE_STYLE, color);
        drawChildrenConnector(ctx, root, associates);
      }
    });
  }
  window.drawOrgChartLines = function() {
    const data = window.ledgerData;
    if (!data || !data.familyroster) return;
    const container = document.getElementById(SELECTORS.organizationalChart);
    if (!container) return;
    const cached = window.__orgChartTreeCache || null;
    const tree = cached && cached.hierarchy
      ? cached.hierarchy
      : (buildTreeStructure ? buildTreeStructure(data.familyroster) : null);
    if (!tree) return;
    const canvas = ensureCanvas(container);
    const ctx = sizeCanvas(canvas, container);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = getAccentGold();
    drawTreeConnectors(ctx, tree, color);
    drawIndependentAssociateConnectors(ctx, tree, color);
    // Keep header aligned and boss centered
    updateHeaderAlignment(container, tree);
    centerViewportOnBoss(container, tree);
  };

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
    layout.applyHorizontalShift(tree, offset);
    renderTree(tree, container);
    const dimsAfterRender = getTreeDimensions(tree, layout);
    container.style.width = `${Math.ceil(dimsAfterRender.width)}px`;
    container.style.height = `${Math.ceil(dimsAfterRender.height)}px`;
    if (typeof window.drawOrgChartLines === 'function') {
      requestAnimationFrame(() => window.drawOrgChartLines());
    }

    // Track header position on scroll
    container.addEventListener('scroll', () => {
      if (window.__orgChartTreeCache && window.__orgChartTreeCache.hierarchy) {
        updateHeaderAlignment(container, window.__orgChartTreeCache.hierarchy);
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
  function centerViewportOnBoss(container, tree) {
    if (!container || !tree || !tree.data || !tree.width) return;
    const bossCenterX = tree.x + (tree.width / 2);
    const targetLeft = Math.max(0, Math.round(bossCenterX - (container.clientWidth / 2)));
    container.scrollTo({ left: targetLeft, behavior: 'auto' });
  }

  function updateHeaderAlignment(container, tree) {
    if (!container || !tree || !tree.width) return;
    const bossCenterX = tree.x + (tree.width / 2);
    const header = document.querySelector('.roster-title');
    const subheader = document.querySelector('.roster-subtitle');
    if (!header && !subheader) return;
    const viewportCenterX = container.scrollLeft + (container.clientWidth / 2);
    const delta = bossCenterX - viewportCenterX;
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


