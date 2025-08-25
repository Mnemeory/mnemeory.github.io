/**
 * Starfield 2D Fallback System - Accessible 2D Interface
 * Provides a 2D alternative when WebGL is not available
 */

import { CONSTELLATIONS } from "../config.js";
import { TooltipManager } from "./shared-utilities.js";

export class StarfieldFallback {
  constructor(fallback2D) {
    this.fallback2D = fallback2D;
    this.currentHover = null;
    this.onClusterActivate = null;
    this.isActivating = false; // Prevent multiple activations
  }

  /**
   * Initialize 2D fallback interface
   */
  init() {
    if (!this.fallback2D) return false;

    // Show 2D fallback
    this.fallback2D.classList.remove("hidden");

    // Setup 2D cluster interactions
    const clusterNodes = this.fallback2D.querySelectorAll(".cluster-node");
    clusterNodes.forEach((node) => {
      const handleEnter = () => {
        this.currentHover = node.dataset.cluster;
        node.style.transform = "translateY(-4px) scale(1.05)";
        node.style.boxShadow = "0 0 20px rgba(92, 231, 231, 0.3)";

        const rect = node.getBoundingClientRect();
        this.showConstellationTooltip(
          node.dataset.cluster,
          rect.left + rect.width / 2,
          rect.top
        );
      };

      const handleLeave = () => {
        if (this.currentHover === node.dataset.cluster) {
          this.currentHover = null;
        }
        node.style.transform = "";
        node.style.boxShadow = "";
        this.hideConstellationTooltip();
      };

      node.addEventListener("mouseenter", handleEnter);
      node.addEventListener("focus", handleEnter);
      node.addEventListener("mouseleave", handleLeave);
      node.addEventListener("blur", handleLeave);

      // Click/Enter activation
      const activateCluster = () => {
        // Prevent multiple activations
        if (this.isActivating) return;

        this.isActivating = true;
        this.hideConstellationTooltip(); // Hide tooltip on activation

        if (this.onClusterActivate) {
          const clusterName = node.dataset.cluster;
          // Small delay to prevent double-clicks, then activate
          setTimeout(() => {
            this.onClusterActivate(clusterName);
            this.isActivating = false;
          }, 100);
        } else {
          this.isActivating = false;
        }
      };

      node.addEventListener("click", activateCluster);
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateCluster();
        }
      });
    });

    console.log("2D Fallback starfield initialized");
    return true;
  }

  /**
   * Show constellation tooltip for 2D mode
   */
  showConstellationTooltip(clusterName, x, y) {
    const constellationData = CONSTELLATIONS[clusterName];
    if (!constellationData) return;

    const content = `
      <div class="tooltip-header">
        <div class="tooltip-resonance-indicator"></div>
        <span class="tooltip-constellation-name">${constellationData.name}</span>
      </div>
      <div class="tooltip-meaning">${constellationData.meaning}</div>
      <div class="tooltip-instruction">
        <span class="psi-glyph">◈</span> Click to access data streams
      </div>
    `;

    TooltipManager.show(content, x, y - 60, {
      id: "constellation-tooltip-2d",
      className: "constellation-tooltip",
      offset: { x: 0, y: 0 },
    });
  }

  /**
   * Hide constellation tooltip for 2D mode
   */
  hideConstellationTooltip() {
    TooltipManager.hide();
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
   * Show the 2D fallback
   */
  show() {
    if (this.fallback2D) {
      this.fallback2D.classList.remove("hidden");
    }
  }

  /**
   * Hide the 2D fallback
   */
  hide() {
    if (this.fallback2D) {
      this.fallback2D.classList.add("hidden");
    }
  }

  /**
   * Check WebGL support
   */
  static checkWebGLSupport() {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    TooltipManager.hide();
    this.isActivating = false;
    this.onClusterActivate = null;
    this.fallback2D = null;
  }
}
