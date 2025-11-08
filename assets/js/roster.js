// Family Roster - Organizational Chart

(function() {
  'use strict';
  
  // LAYOUT ENGINE - REINGOLD-TILFORD ALGORITHM
  
  class OrgChartLayout {
    constructor(options = {}) {
      this.leadershipWidth = 380;
      this.leadershipHeight = 224;
      this.crewWidth = 320;
      this.crewHeight = 189;
      
      this.horizontalSpacing = 50;
      this.verticalSpacing = 100;
      this.advisorGap = 80;
      
      this.marginLeft = 50;
      this.marginTop = 50;
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
  
  function buildTreeStructure(roster) {
    if (!roster) return null;
    
    const tree = {
      id: 'boss',
      role: 'boss',
      data: roster.boss && roster.boss[0] ? roster.boss[0] : {name: 'No Boss', status: 'vacant'},
      children: [],
      parent: null,
      mod: 0,
      isLeadership: true
    };
    
    if (roster.boss_consigliere && roster.boss_consigliere.length > 0) {
      tree.advisor = {
        id: 'boss-consigliere',
        role: 'boss_consigliere',
        data: roster.boss_consigliere[0],
        isLeadership: true,
        x: 0,
        y: 0
      };
    }
    
    const capos = roster.capo || [];
    capos.forEach(capo => {
      const capoNode = {
        id: `capo-${capo.name}`,
        role: 'capo',
        data: capo,
        children: [],
        parent: tree,
        mod: 0,
        isLeadership: true
      };
      
      const soldatos = (roster.soldato || []).filter(s => s.assigned_capo === capo.name);
      const consiglieres = (roster.consigliere || []).filter(c => c.assigned_capo === capo.name);
      
      soldatos.forEach(soldato => {
        const soldatoNode = {
          id: `soldato-${soldato.name}`,
          role: 'soldato',
          data: soldato,
          children: [],
          parent: capoNode,
          mod: 0,
          isLeadership: false
        };
        
        const associates = (roster.associate || []).filter(a => a.assigned_soldato === soldato.name);
        associates.forEach(assoc => {
          const assocNode = {
            id: `assoc-${assoc.name}`,
            role: 'associate',
            data: assoc,
            children: [],
            parent: soldatoNode,
            mod: 0,
            isLeadership: false
          };
          soldatoNode.children.push(assocNode);
        });
        
        capoNode.children.push(soldatoNode);
      });
      
      consiglieres.forEach(consigliere => {
        const consigliereNode = {
          id: `consigliere-${consigliere.name}`,
          role: 'consigliere',
          data: consigliere,
          children: [],
          parent: capoNode,
          mod: 0,
          isLeadership: false
        };
        
        const associates = (roster.associate || []).filter(a => a.assigned_consigliere === consigliere.name);
        associates.forEach(assoc => {
          const assocNode = {
            id: `assoc-${assoc.name}`,
            role: 'associate',
            data: assoc,
            children: [],
            parent: consigliereNode,
            mod: 0,
            isLeadership: false
          };
          consigliereNode.children.push(assocNode);
        });
        
        capoNode.children.push(consigliereNode);
      });
      
      tree.children.push(capoNode);
    });
    
    return tree;
  }
  
  window.buildOrgTree = function(roster) {
    if (!roster) return null;
    
    const tree = {
      boss: roster.boss && roster.boss[0] ? roster.boss[0] : null,
      bossConsigliere: roster.boss_consigliere && roster.boss_consigliere[0] ? roster.boss_consigliere[0] : null,
      capos: []
    };
    
    const capos = roster.capo || [];
    capos.forEach(capo => {
      const capoData = {
        capo: capo,
        consiglieres: [],
        soldatos: []
      };
      
      const consiglieres = (roster.consigliere || []).filter(c => c.assigned_capo === capo.name);
      consiglieres.forEach(consigliere => {
        const consData = {
          consigliere: consigliere,
          associates: (roster.associate || []).filter(a => a.assigned_consigliere === consigliere.name)
        };
        capoData.consiglieres.push(consData);
      });
      
      const soldatos = (roster.soldato || []).filter(s => s.assigned_capo === capo.name);
      soldatos.forEach(soldato => {
        const soldatoData = {
          soldato: soldato,
          associates: (roster.associate || []).filter(a => a.assigned_soldato === soldato.name)
        };
        capoData.soldatos.push(soldatoData);
      });
      
      tree.capos.push(capoData);
    });
    
    return tree;
  };
  
  // RENDERING
  
  function renderNode(node, container) {
    const div = document.createElement('div');
    div.className = `roster-plaque ${node.isLeadership ? 'leadership' : 'crew'}`;
    
    const status = node.data.status || 'active';
    div.classList.add(status);
    
    div.dataset.nodeName = node.data.name;
    
    div.style.position = 'absolute';
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'plaque-role';
    roleLabel.textContent = getRoleLabel(node.role);
    div.appendChild(roleLabel);
    
    const nameEl = document.createElement('div');
    nameEl.className = 'plaque-name';
    nameEl.textContent = node.data.name || 'Unknown';
    div.appendChild(nameEl);
    
    if (node.data.clan) {
      const clanEl = document.createElement('div');
      clanEl.className = 'plaque-detail';
      clanEl.textContent = node.data.clan;
      div.appendChild(clanEl);
    }
    
    container.appendChild(div);
    node.element = div;
  }
  
  function renderTree(node, container) {
    renderNode(node, container);
    
    if (node.advisor) {
      renderNode(node.advisor, container);
    }
    
    node.children.forEach(child => renderTree(child, container));
  }
  
  function getRoleLabel(role) {
    const labels = window.CONFIG?.DISPLAY_TEXT?.roles || {};
    return labels[role] || role.toUpperCase();
  }
  
  function getTreeDimensions(node) {
    let maxX = node.x + (node.isLeadership ? 380 : 320);
    let maxY = node.y + (node.isLeadership ? 224 : 189);
    
    if (node.advisor) {
      maxX = Math.max(maxX, node.advisor.x + (node.advisor.isLeadership ? 380 : 320));
      maxY = Math.max(maxY, node.advisor.y + (node.advisor.isLeadership ? 224 : 189));
    }
    
    const traverse = (n) => {
      maxX = Math.max(maxX, n.x + (n.isLeadership ? 380 : 320));
      maxY = Math.max(maxY, n.y + (n.isLeadership ? 224 : 189));
      n.children.forEach(traverse);
    };
    
    node.children.forEach(traverse);
    
    return { width: maxX + 50, height: maxY + 50 };
  }
  
  function shiftTreePositions(node, offset) {
    node.x += offset;
    
    if (node.advisor) {
      node.advisor.x += offset;
    }
    
    node.children.forEach(child => shiftTreePositions(child, offset));
  }
  
  // MAIN POPULATION FUNCTION
  
  window.populateFamilyRoster = function() {
    const data = window.ledgerData;
    
    if (!data || !data.familyroster) {
      console.error('Roster data not available');
      return;
    }
    
    const container = document.getElementById(window.CONFIG.SELECTORS.organizationalChart);
    if (!container) {
      console.error('Organizational chart container not found');
      return;
    }
    
    const svg = container.querySelector('.org-chart-lines-svg');
    const svgParent = svg ? svg.parentNode : null;
    if (svg && svgParent) {
      svgParent.removeChild(svg);
    }
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    const tree = buildTreeStructure(data.familyroster);
    if (!tree) {
      console.error('Failed to build tree structure');
      return;
    }
    
    const layout = new OrgChartLayout();
    layout.calculatePositions(tree);
    
    const containerWidth = container.parentElement.clientWidth;
    const dimsBeforeRender = getTreeDimensions(tree);
    const offset = Math.max((containerWidth - dimsBeforeRender.width) / 2, 0);
    shiftTreePositions(tree, offset);
    
    renderTree(tree, container);
    
    const dimsAfterRender = getTreeDimensions(tree);
    container.style.width = `${dimsAfterRender.width}px`;
    container.style.height = `${dimsAfterRender.height}px`;
    
    const svgElement = document.createElementNS(window.CONFIG.SVG_NAMESPACE, 'svg');
    svgElement.setAttribute('id', 'orgChartLines');
    svgElement.classList.add('org-chart-lines-svg');
    container.appendChild(svgElement);
    
    setTimeout(() => {
      if (typeof window.drawOrgChartLines === 'function') {
        window.drawOrgChartLines();
      }
    }, window.CONFIG.TIMING.rosterLinesDelay);
  };
  
  // RESIZE HANDLING
  
  function handleResize() {
    if (window.resizeObserverTimer) {
      clearTimeout(window.resizeObserverTimer);
    }
    
    window.resizeObserverTimer = setTimeout(() => {
      if (typeof window.drawOrgChartLines === 'function') {
        window.drawOrgChartLines();
      }
    }, window.CONFIG.TIMING.resizeDebounce);
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

