/**
 * App Controller
 * Orchestrates state, views, starfield, routing, and node population
 * CSS is driven purely via classes/data-attributes; no inline styling here
 */

import { StateManager } from './state-manager.js';
import { ViewManager } from './view-manager.js';
import { StarfieldManager } from './starfield.js';
import { NodeManager } from './node-manager.js';
import { FileScanner } from './file-scanner.js';
import { Router } from './router.js';
import { CONSTELLATIONS } from '../config.js';
import { Logger, EventUtils, ToastManager } from './utilities.js';
import './citizen-ui.js';

export class AppController {
  constructor() {
    this.logger = new Logger('AppController');
    this.state = new StateManager();

    this.viewManager = null;
    this.starfield = null;
    this.router = null;
    this.nodeManager = null;
    this.fileScanner = null;

    this.nodes = [];

    // Bind
    this.onRouteChange = this.onRouteChange.bind(this);
  }

  async init() {
    this.logger.info('Initializing');
    this.state.set('appState', 'loading');

    // Core systems
    this.viewManager = new ViewManager(this.state);
    await this.viewManager.init();

    this.starfield = new StarfieldManager(this.state);
    await this.starfield.init();

    this.nodeManager = new NodeManager(this.state);
    this.fileScanner = new FileScanner();

    // Router after view init so it can switch views
    this.router = new Router(this.state, this.viewManager);

    // Starfield → route activation
    this.starfield.setClusterActivationCallback((constellation) => {
      this.router.navigate(`#/${constellation}`);
    });

    // Listen for route changes
    document.addEventListener('app:route:changed', this.onRouteChange);

    // Load data (best-effort)
    await this.loadNodes();

    // Handle initial route
    this.onRouteChange({ detail: { route: window.location.hash.replace('#', '') || '/' } });

    // Ready
    this.state.set('appState', 'ready');
    ToastManager.success('Neural interface established');
  }

  async loadNodes() {
    try {
      const connected = await this.fileScanner.testConnection();
      if (!connected) {
        this.logger.warn('GitHub API unavailable, continuing without remote nodes');
      }

      const scans = [
        this.fileScanner.scanDirectory('templates', 'hatching-egg', 'Public'),
        this.fileScanner.scanDirectory('citizen', 'qu-poxii', 'Public'),
        this.fileScanner.scanDirectory('filed', 'gnarled-tree', 'Public')
      ];

      const results = await Promise.allSettled(scans);
      const nodes = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => Array.isArray(r.value) ? r.value : []);

      this.nodes = nodes;
      this.state.set('nodes', nodes);
      this.logger.info(`Loaded ${nodes.length} nodes`);
    } catch (error) {
      this.logger.warn('Failed to load nodes', error);
      this.nodes = [];
      this.state.set('nodes', []);
    }
  }

  onRouteChange(event) {
    const route = event?.detail?.route || window.location.hash.replace('#', '') || '/';
    if (route === '/' || route === '') {
      // Starfield view is handled by Router+ViewManager
      return;
    }

    // Extract constellation and populate
    const constellation = route.startsWith('/') ? route.slice(1) : route;
    if (!CONSTELLATIONS[constellation]) return;

    const nodesForCluster = this.nodes.filter(n => n.constellation === constellation);
    this.nodeManager.populateConstellation(constellation, nodesForCluster);
  }

  destroy() {
    document.removeEventListener('app:route:changed', this.onRouteChange);
    if (this.starfield) this.starfield.destroy();
    if (this.viewManager) this.viewManager.destroy();
    if (this.nodeManager) this.nodeManager.destroy();
    this.logger.info('Destroyed');
  }
}


