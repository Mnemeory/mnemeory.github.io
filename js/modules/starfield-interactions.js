/**
 * Starfield Interaction Management - Event Handling and User Interactions
 * Handles mouse, keyboard, touch events for the 3D starfield
 * Standardized version with CSS-driven styling
 */

// Three.js ES module imports
import { Vector2, Raycaster } from 'three';

import {
  CONSTELLATIONS,
  ENHANCED_STARFIELD_CONFIG,
  CONSTANTS,
  KEYS,
} from "../config.js";
import { TooltipManager } from "./shared-utilities.js";

const LOCAL_CONFIG = ENHANCED_STARFIELD_CONFIG;

export class StarfieldInteractions {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;

    // State
    this.currentHover = null;
    this.onClusterActivate = null;
    this.isActivating = false; // Prevent multiple activations

    // Event handlers - bind methods to preserve context
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onClick = this.handleClick.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onResize = this.handleResize.bind(this);
  }

  /**
   * Setup event listeners for interaction
   */
  init() {
    if (!this.canvas) return;

    // Mouse events
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );
    this.canvas.addEventListener("click", this.onClick);

    // Keyboard navigation
    this.canvas.addEventListener("keydown", this.onKeyDown);
    this.canvas.setAttribute("tabindex", "0"); // Make focusable

    // Window resize
    window.addEventListener("resize", this.onResize);

    // Visibility change (pause when tab hidden)
    document.addEventListener("visibilitychange", () => {
      // Handle visibility changes at manager level
      const event = new CustomEvent("starfield-visibility-change", {
        detail: { hidden: document.hidden },
      });
      document.dispatchEvent(event);
    });
  }

  /**
   * Handle mouse movement for hover effects
   */
  handleMouseMove(event) {
    if (!this.scene.camera || !this.scene.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouse = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, this.scene.camera);

    // Check intersections with interaction spheres
    const intersectables = this.scene.getInteractionSpheres();
    const intersects = raycaster.intersectObjects(intersectables);

    // Update hover state
    const newHover =
      intersects.length > 0 ? intersects[0].object.userData.clusterName : null;

    if (newHover !== this.currentHover) {
      // Cool down previous
      if (this.currentHover) {
        const prevConstellation = this.scene.getConstellation(
          this.currentHover
        );
        if (prevConstellation) {
          prevConstellation.targetWarmth = 0;
        }
        TooltipManager.hide();
      }

      // Warm up new
      if (newHover) {
        const constellation = this.scene.getConstellation(newHover);
        if (constellation) {
          constellation.targetWarmth = 1;
          // Use classes for cursor styling
          this.canvas.setAttribute('data-hover-state', 'active');
          this.showConstellationTooltip(newHover, event.clientX, event.clientY);
        }
      } else {
        this.canvas.setAttribute('data-hover-state', 'default');
        TooltipManager.hide();
      }

      this.currentHover = newHover;
    } else if (newHover) {
      // Update tooltip position if still hovering
      TooltipManager.updatePosition(event.clientX, event.clientY);
    }
  }

  /**
   * Show constellation tooltip with psionic terminology
   */
  showConstellationTooltip(clusterName, x, y) {
    const constellationData = CONSTELLATIONS[clusterName];
    if (!constellationData) return;

    const content = `
      <div data-component="tooltip-header">
        <div data-component="tooltip-resonance-indicator"></div>
        <span data-component="tooltip-constellation-name">${constellationData.name}</span>
      </div>
      <div data-component="tooltip-meaning">${constellationData.meaning}</div>
      <div data-component="tooltip-instruction">
        <span data-component="psi-glyph">◈</span> Focus your consciousness to access data streams
      </div>
    `;

    TooltipManager.show(content, x, y, {
      id: "constellation-tooltip",
      className: "constellation-tooltip",
      component: "constellation-tooltip",
    });
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    if (this.isActivating || !this.currentHover || !this.onClusterActivate) {
      return;
    }

    TooltipManager.hide();
    this.activateCurrentCluster();
  }

  activateCurrentCluster() {
    this.isActivating = true;
    const constellation = this.scene.getConstellation(this.currentHover);
    if (constellation) {
      const targetCluster = this.currentHover;
      this.scene.createTendril(constellation.group.position);
      this.scene.animateTendril();
      setTimeout(() => {
        this.onClusterActivate(targetCluster);
        this.isActivating = false;
      }, 500);
    } else {
      this.isActivating = false;
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event) {
    if (!this.scene.constellations.size) return;

    const clusters = Array.from(this.scene.constellations.keys());
    let currentIndex = this.currentHover
      ? clusters.indexOf(this.currentHover)
      : -1;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        currentIndex = (currentIndex + 1) % clusters.length;
        this.setKeyboardFocus(clusters[currentIndex]);
        break;

      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        currentIndex =
          currentIndex <= 0 ? clusters.length - 1 : currentIndex - 1;
        this.setKeyboardFocus(clusters[currentIndex]);
        break;

      case KEYS.ENTER:
      case KEYS.SPACE:
        event.preventDefault();
        if (
          this.isActivating ||
          !this.currentHover ||
          !this.onClusterActivate
        ) {
          break;
        }
        TooltipManager.hide();
        this.activateCurrentCluster();
        break;
    }
  }

  /**
   * Set keyboard focus on constellation
   */
  setKeyboardFocus(clusterName) {
    // Clear previous hover
    if (this.currentHover && this.currentHover !== clusterName) {
      const prevConstellation = this.scene.getConstellation(this.currentHover);
      if (prevConstellation) {
        prevConstellation.targetWarmth = 0;
      }
    }

    // Set new hover
    this.currentHover = clusterName;
    const constellation = this.scene.getConstellation(clusterName);
    if (constellation) {
      constellation.targetWarmth = 1;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Emit resize event for manager to handle
    const event = new CustomEvent("starfield-resize");
    document.dispatchEvent(event);
  }

  /**
   * Set cluster activation callback
   */
  setClusterActivationCallback(callback) {
    this.onClusterActivate = callback;
  }

  /**
   * Get current hover state
   */
  getCurrentHover() {
    return this.currentHover;
  }

  /**
   * Clear hover state
   */
  clearHover() {
    if (this.currentHover) {
      const constellation = this.scene.getConstellation(this.currentHover);
      if (constellation) {
        constellation.targetWarmth = 0;
      }
      TooltipManager.hide();
      this.currentHover = null;
      this.canvas.setAttribute('data-hover-state', 'default');
    }
  }

  /**
   * Cleanup method to safely remove any existing tooltips
   */
  cleanup() {
    TooltipManager.cleanup();
  }

  /**
   * Handle mouse leave - ensure tooltips are cleaned up
   */
  handleMouseLeave() {
    if (this.currentHover) {
      const prevConstellation = this.scene.getConstellation(this.currentHover);
      if (prevConstellation) {
        prevConstellation.targetWarmth = 0;
      }
      this.currentHover = null;
      this.canvas.setAttribute('data-hover-state', 'default');
      TooltipManager.hide();
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
      this.canvas.removeEventListener("click", this.onClick);
      this.canvas.removeEventListener("keydown", this.onKeyDown);
    }
    window.removeEventListener("resize", this.onResize);

    // Clear hover state
    this.clearHover();

    // Clean up tooltips
    this.cleanup();

    // Reset activation state
    this.isActivating = false;

    // Clear references
    this.scene = null;
    this.canvas = null;
    this.onClusterActivate = null;
  }
}
