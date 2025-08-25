/**
 * Starfield Manager - Main Orchestrator for 3D/2D Starfield System
 * Coordinates scene, interactions, and fallback systems
 */

import { StarfieldScene } from "./starfield-scene.js";
import { StarfieldInteractions } from "./starfield-interactions.js";
import { StarfieldFallback } from "./starfield-fallback.js";
import {
  ENHANCED_STARFIELD_CONFIG,
  CONSTANTS,
  SITE_CONFIG,
  getSelector,
  createStandardError,
  logError,
  getPerformanceConfig,
  // shouldEnablePerformanceMode, // No longer used - disabled performance mode switching
  debug
} from "../config.js";

const LOCAL_CONFIG = ENHANCED_STARFIELD_CONFIG;

export class StarfieldManager {
  constructor() {
    this.scene = null;
    this.interactions = null;
    this.fallback = null;
    this.canvas = null;
    this.container = null;
    this.fallback2D = null;

    // State
    this.isInitialized = false;
    this.is3DEnabled = true;
    this.animationId = null;

    // Performance monitoring
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.performanceMode = false;

    // Event handlers
    this.onResize = this.handleResize.bind(this);
    this.onVisibilityChange = this.handleVisibilityChange.bind(this);

    // Check WebGL support
    this.is3DEnabled = StarfieldFallback.checkWebGLSupport();
    debug("WebGL support check:", {
      is3DEnabled: this.is3DEnabled,
      webglSupported: StarfieldFallback.checkWebGLSupport()
    });
  }

  /**
   * Initialize the starfield system
   */
  async init(containerSelector = getSelector('starfieldContainer')) {
    try {
      this.container = document.querySelector(containerSelector);
      this.canvas = document.querySelector(getSelector('starfieldCanvas'));
      this.fallback2D = document.querySelector(getSelector('starfield2D'));

      if (!this.container) {
        console.warn("Starfield container not found");
        return false;
      }

      if (!this.is3DEnabled) {
        debug("WebGL not supported, falling back to 2D");
        return this.initFallback2D();
      }

      debug("WebGL supported, initializing 3D starfield");
      return await this.init3D();
    } catch (error) {
      const standardError = createStandardError(
        "Starfield initialization failed",
        error,
        "STARFIELD_INIT_ERROR"
      );
      logError(standardError, "StarfieldManager");
      return this.initFallback2D();
    }
  }

  /**
   * Initialize 3D starfield
   */
  async init3D() {
    try {
      // Create and initialize scene
      debug("Creating StarfieldScene...");
      this.scene = new StarfieldScene();
      debug("Initializing scene with canvas and container...");
      const sceneInitialized = this.scene.init(this.canvas, this.container);

      if (!sceneInitialized) {
        throw new Error("Scene initialization failed");
      }
      
      debug("Scene initialized successfully");

      // Create and initialize interactions
      debug("Creating StarfieldInteractions...");
      this.interactions = new StarfieldInteractions(this.scene, this.canvas);
      debug("Initializing interactions...");
      this.interactions.init();
      debug("Interactions initialized successfully");

      // Setup event listeners
      debug("Setting up event listeners...");
      this.setupEventListeners();

      // Start animation loop
      debug("Starting animation loop...");
      this.startAnimation();

      this.isInitialized = true;
      debug("3D Starfield initialized successfully");
      debug("Final initialization state:", {
        isInitialized: this.isInitialized,
        is3DEnabled: this.is3DEnabled,
        scene: !!this.scene,
        interactions: !!this.interactions,
        animationId: this.animationId
      });
      return true;
    } catch (error) {
      const standardError = createStandardError(
        "3D initialization failed",
        error,
        "STARFIELD_3D_ERROR"
      );
      logError(standardError, "StarfieldManager");
      return this.initFallback2D();
    }
  }

  /**
   * Initialize 2D fallback interface
   */
  initFallback2D() {
    if (!this.fallback2D) {
      console.warn("2D fallback element not found");
      return false;
    }

    // Hide 3D canvas and show 2D fallback
    if (this.canvas) this.canvas.style.display = "none";

    this.fallback = new StarfieldFallback(this.fallback2D);
    const fallbackInitialized = this.fallback.init();

    if (fallbackInitialized) {
      this.isInitialized = true;
      this.is3DEnabled = false;
      debug("2D Fallback starfield initialized");
      return true;
    }

    return false;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener("resize", this.onResize);

    // Visibility change
    document.addEventListener(
      "starfield-visibility-change",
      this.onVisibilityChange
    );
    document.addEventListener("starfield-resize", this.onResize);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (this.scene) {
      this.scene.handleResize(width, height);
    }
  }

  /**
   * Handle visibility change (pause when tab hidden)
   */
  handleVisibilityChange(event) {
    const isHidden = event.detail.hidden;

    if (isHidden && this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    } else if (!isHidden && !this.animationId && this.is3DEnabled) {
      this.startAnimation();
    }
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    if (this.animationId || !this.is3DEnabled) return;

    debug("Starting starfield animation loop");

    const animate = (currentTime) => {
      this.animationId = requestAnimationFrame(animate);

      // Remove automatic performance mode switching to ensure full star visibility
      // const performanceInterval = 1000; // 1 second
      // if (currentTime - this.lastFrameTime > performanceInterval) {
      //   const fps = this.frameCount;
      //   this.frameCount = 0;
      //   this.lastFrameTime = currentTime;

      //   // Switch to performance mode if FPS drops
      //   if (shouldEnablePerformanceMode(fps) && !this.performanceMode) {
      //     this.enablePerformanceMode();
      //   }
      // }
      // this.frameCount++;

      this.update();
      this.render();
    };

    this.animationId = requestAnimationFrame(animate);
    debug("Animation loop started with ID:", this.animationId);
  }

  /**
   * Update scene animations
   */
  update() {
    if (this.scene) {
      this.scene.update();
      // debug("Scene updated"); // Uncomment for verbose logging
    }
  }

  /**
   * Render the scene
   */
  render() {
    if (this.scene) {
      this.scene.render();
      // debug("Scene rendered"); // Uncomment for verbose logging
    }
  }

  /**
   * Enable performance mode (reduced quality)
   */
  enablePerformanceMode() {
    if (this.performanceMode) return;

    this.performanceMode = true;
    debug("Starfield: Enabling performance mode");

    if (this.scene) {
      this.scene.enablePerformanceMode();
    }
  }

  /**
   * Set cluster activation callback
   */
  setClusterActivationCallback(callback) {
    if (this.interactions) {
      this.interactions.setClusterActivationCallback(callback);
    }

    if (this.fallback) {
      this.fallback.setClusterActivationCallback(callback);
    }
  }

  /**
   * Get current hover state
   */
  getCurrentHover() {
    if (this.interactions) {
      return this.interactions.getCurrentHover();
    }

    if (this.fallback) {
      return this.fallback.getCurrentHover();
    }

    return null;
  }

  /**
   * Check if system is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Check if 3D mode is enabled
   */
  is3DModeEnabled() {
    return this.is3DEnabled;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      is3DEnabled: this.is3DEnabled,
      performanceMode: this.performanceMode,
      frameCount: this.frameCount,
      isAnimating: !!this.animationId,
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove event listeners
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener(
      "starfield-visibility-change",
      this.onVisibilityChange
    );
    document.removeEventListener("starfield-resize", this.onResize);

    // Destroy subsystems
    if (this.interactions) {
      this.interactions.destroy();
      this.interactions = null;
    }

    if (this.scene) {
      this.scene.destroy();
      this.scene = null;
    }

    if (this.fallback) {
      this.fallback.destroy();
      this.fallback = null;
    }

    // Clear references
    this.canvas = null;
    this.container = null;
    this.fallback2D = null;

    debug("Starfield destroyed");
  }
}
