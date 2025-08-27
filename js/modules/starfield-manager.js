/**
 * Starfield Management System
 * Coordinates starfield visualization and interactions
 * 
 * Handles WebGL rendering without manipulating DOM styles directly.
 * Visual updates are handled via class toggles and data attributes.
 */

import { CONFIG } from "../config.js";
import { Logger, AnimationUtils } from "./shared-utilities.js";

export class StarfieldManager {
  /**
   * @param {Object} state - Application state manager
   */
  constructor(state) {
    this.state = state;
    this.logger = new Logger("StarfieldManager");
    
    // Core components
    this.scene = null;
    this.interactions = null;
    
    // WebGL canvas
    this.canvas = null;
    this.container = null;
    
    // State tracking
    this.isInitialized = false;
    this.isRendering = false;
    this.isVisible = false;
    this.is3DEnabled = CONFIG.env.features.starfield3D;
    
    // Performance monitoring
    this.performanceStats = {
      fps: 0,
      frameTime: 0,
      frameCount: 0,
      lastFrameTime: 0
    };
    
    // Animation frame handling
    this.animationFrameId = null;
    
    // Callback for cluster activation
    this.clusterActivationCallback = null;
  }

  /**
   * Check WebGL support
   * @returns {boolean} Whether WebGL is supported
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return gl !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize starfield
   * @param {string} containerSelector - Container selector
   * @returns {Promise<boolean>} Initialization success
   */
  async init(containerSelector = "[data-component='starfield-container']") {
    try {
      // Check if already initialized
      if (this.isInitialized) {
        this.logger.warn("Starfield already initialized");
        return true;
      }
      
      this.logger.info("Initializing starfield");
      
      // Find container
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        throw new Error(`Starfield container not found: ${containerSelector}`);
      }
      
      // Check WebGL support
      const hasWebGL = this.checkWebGLSupport();
      if (!hasWebGL) {
        throw new Error("WebGL not supported");
      }
      
      // Update container state
      this.container.classList.add("is-loading");
      this.container.setAttribute("data-state", "loading");
      
      // Create canvas
      this.canvas = document.createElement("canvas");
      this.canvas.className = "starfield-canvas";
      this.canvas.setAttribute("aria-label", "Neural Starfield Visualization");
      this.canvas.setAttribute("role", "img");
      this.container.appendChild(this.canvas);
      
      // Initialize 3D scene
      if (this.is3DEnabled) {
        await this.init3D();
      } else {
        this.initFallback();
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start animation loop
      this.startAnimation();
      
      // Update container state
      this.container.classList.remove("is-loading");
      this.container.classList.add("is-ready");
      this.container.setAttribute("data-state", "ready");
      
      // Mark as initialized
      this.isInitialized = true;
      this.isVisible = true;
      
      // Update state
      if (this.state) {
        this.state.set("starfieldReady", true);
      }
      
      this.logger.info("Starfield initialization complete");
      return true;
    } catch (error) {
      this.logger.error("Failed to initialize starfield", error);
      
      // Show error state via class toggle
      if (this.container) {
        this.container.classList.remove("is-loading");
        this.container.classList.add("is-error");
        this.container.setAttribute("data-state", "error");
        this.container.setAttribute("data-error", error.message);
      }
      
      // Update state
      if (this.state) {
        this.state.set("starfieldReady", false);
        this.state.set("starfieldError", {
          message: error.message,
          stack: error.stack,
          time: new Date().toISOString()
        });
      }
      
      return false;
    }
  }

  /**
   * Initialize 3D starfield
   * @returns {Promise<void>} Initialization promise
   */
  async init3D() {
    try {
      this.logger.info("Initializing 3D starfield");
      
      // Import Three.js components dynamically
      const [
        { StarfieldScene }, 
        { StarfieldInteractions }
      ] = await Promise.all([
        import("./starfield-scene.js"),
        import("./starfield-interactions.js")
      ]);
      
      // Create scene
      this.scene = new StarfieldScene();
      await this.scene.init(this.canvas, this.container);
      
      // Create interactions
      this.interactions = new StarfieldInteractions(this.scene, this.canvas);
      this.interactions.init();
      
      // Connect interactions to callback
      this.interactions.setClusterActivationCallback((cluster) => {
        if (this.clusterActivationCallback) {
          this.clusterActivationCallback(cluster);
        }
      });
      
      this.logger.info("3D starfield initialized");
    } catch (error) {
      this.logger.error("Failed to initialize 3D starfield", error);
      
      // Fall back to 2D mode
      this.logger.info("Falling back to 2D mode");
      this.is3DEnabled = false;
      this.initFallback();
    }
  }

  /**
   * Initialize fallback 2D starfield
   */
  initFallback() {
    this.logger.info("Initializing 2D starfield");
    
    // Create CSS-based starfield
    const starsContainer = document.createElement("div");
    starsContainer.className = "stars-fallback";
    
    // Create star layers with different parallax speeds
    for (let i = 1; i <= 3; i++) {
      const starLayer = document.createElement("div");
      starLayer.className = `star-layer star-layer-${i}`;
      starsContainer.appendChild(starLayer);
    }
    
    // Create constellation markers
    const constellations = Object.keys(CONFIG.constellations);
    constellations.forEach((constellation, index) => {
      const marker = document.createElement("button");
      marker.className = "constellation-marker";
      marker.setAttribute("data-constellation", constellation);
      marker.setAttribute("aria-label", CONFIG.constellations[constellation].name);
      
      // Position marker (CSS handles actual positioning)
      marker.setAttribute("data-position", index);
      
      // Add click handler
      marker.addEventListener("click", () => {
        if (this.clusterActivationCallback) {
          this.clusterActivationCallback(constellation);
        }
      });
      
      starsContainer.appendChild(marker);
    });
    
    // Insert into container
    this.container.appendChild(starsContainer);
    
    this.logger.info("2D starfield initialized");
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Resize handler
    window.addEventListener("resize", AnimationUtils.debounce(() => {
      this.handleResize();
    }, 250));
    
    // Visibility change
    document.addEventListener("visibilitychange", (event) => {
      this.handleVisibilityChange(event);
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.isInitialized) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // Update canvas size
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    
    // Update 3D scene
    if (this.scene && this.is3DEnabled) {
      this.scene.handleResize(width, height);
    }
    
    // Update interactions
    if (this.interactions) {
      this.interactions.handleResize();
    }
    
    this.logger.debug(`Resize: ${width}x${height}`);
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    const isVisible = document.visibilityState === "visible";
    
    // Pause/resume rendering based on visibility
    if (isVisible && !this.isRendering) {
      this.logger.debug("Page visible, resuming rendering");
      this.startAnimation();
    } else if (!isVisible && this.isRendering) {
      this.logger.debug("Page hidden, pausing rendering");
      this.stopAnimation();
    }
    
    this.isVisible = isVisible;
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    if (this.isRendering) return;
    
    this.isRendering = true;
    this.lastFrameTime = performance.now();
    this.performanceStats.frameCount = 0;
    
    const animate = (currentTime) => {
      if (!this.isRendering) return;
      
      // Calculate FPS
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
      this.performanceStats.frameTime = deltaTime;
      this.performanceStats.frameCount++;
      
      if (this.performanceStats.frameCount % 30 === 0) {
        this.performanceStats.fps = Math.round(1000 / deltaTime);
      }
      
      // Update and render
      this.update();
      this.render();
      
      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stopAnimation() {
    if (!this.isRendering) return;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.isRendering = false;
  }

  /**
   * Update starfield state
   */
  update() {
    if (!this.isInitialized) return;
    
    // Update 3D scene
    if (this.scene && this.is3DEnabled) {
      this.scene.update();
    }
  }

  /**
   * Render starfield
   */
  render() {
    if (!this.isInitialized) return;
    
    // Render 3D scene
    if (this.scene && this.is3DEnabled) {
      this.scene.render();
    }
  }

  /**
   * Enable performance mode for low-end devices
   */
  enablePerformanceMode() {
    this.logger.info("Enabling performance mode");
    
    // Update container class
    if (this.container) {
      this.container.classList.add("performance-mode");
    }
    
    // Apply performance optimizations to scene
    if (this.scene && this.is3DEnabled) {
      this.scene.enablePerformanceMode();
    }
    
    // Update state
    if (this.state) {
      this.state.set("starfieldPerformanceMode", true);
    }
  }

  /**
   * Set callback for cluster activation
   * @param {Function} callback - Callback function
   */
  setClusterActivationCallback(callback) {
    this.clusterActivationCallback = callback;
    
    // Pass to interactions if available
    if (this.interactions) {
      this.interactions.setClusterActivationCallback(callback);
    }
  }

  /**
   * Get current hover target
   * @returns {string|null} Hover target
   */
  getCurrentHover() {
    return this.interactions ? this.interactions.getCurrentHover() : null;
  }

  /**
   * Check if starfield is ready
   * @returns {boolean} Whether starfield is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Check if 3D mode is enabled
   * @returns {boolean} Whether 3D mode is enabled
   */
  is3DModeEnabled() {
    return this.is3DEnabled;
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      is3D: this.is3DEnabled,
      isRendering: this.isRendering,
      isVisible: this.isVisible
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Stop animation
    this.stopAnimation();
    
    // Clean up interactions
    if (this.interactions) {
      this.interactions.destroy();
    }
    
    // Clean up scene
    if (this.scene) {
      this.scene.destroy();
    }
    
    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    // Reset state
    this.isInitialized = false;
    this.isRendering = false;
    this.isVisible = false;
    
    this.logger.info("StarfieldManager destroyed");
  }
}
