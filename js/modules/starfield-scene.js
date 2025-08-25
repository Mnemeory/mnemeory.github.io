/**
 * Starfield Scene Management - 3D Scene Creation and Rendering
 * Handles Three.js scene setup, geometries, materials, and rendering
 */

import * as THREE from "three";
import {
  CONSTELLATIONS,
  ENHANCED_STARFIELD_CONFIG,
  CONSTANTS,
  getStarfieldConfig,
  getStarGenerationParams,
} from "../config.js";

const LOCAL_CONFIG = ENHANCED_STARFIELD_CONFIG;

export class StarfieldScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
    this.clock = new THREE.Clock();

    // Scene objects
    this.backgroundStars = null;
    this.constellations = new Map();
    this.nlomNode = null;
    this.activeTendril = null;

    // Performance
    this.performanceMode = false;

    // Texture cache to prevent flickering
    this.textureCache = new Map();
  }

  setAttributes(geometry, positions, colors, sizes) {
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  }

  /**
   * Initialize 3D scene
   */
  init(canvas, container) {
    this.canvas = canvas;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x071422, 400, 1200); // Reduced fog to make stars more visible
    
    console.log("Scene created with fog:", {
      fog: this.scene.fog,
      children: this.scene.children.length
    });

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    // Create camera
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(
      LOCAL_CONFIG.CAMERA_FOV,
      aspect,
      LOCAL_CONFIG.CAMERA_NEAR,
      LOCAL_CONFIG.CAMERA_FAR
    );
    this.camera.position.set(0, 0, 300);
    
    console.log("Camera created:", {
      fov: LOCAL_CONFIG.CAMERA_FOV,
      aspect,
      near: LOCAL_CONFIG.CAMERA_NEAR,
      far: LOCAL_CONFIG.CAMERA_FAR,
      position: this.camera.position,
      aspect: this.camera.aspect
    });

    // Create renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !this.performanceMode,
        alpha: true,
        powerPreference: "high-performance",
      });
      
      if (!this.renderer) {
        throw new Error("Failed to create WebGL renderer");
      }
      
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x0a1f2a, 0.9); // Slightly lighter background for better star visibility
      this.renderer.sortObjects = true; // Enable render order sorting
      
      console.log("WebGL renderer created successfully:", {
        canvas: this.canvas,
        width,
        height,
        pixelRatio: this.renderer.getPixelRatio(),
        context: this.renderer.getContext()
      });
    } catch (error) {
      console.error("Failed to create WebGL renderer:", error);
      throw error;
    }

    // Create scene content
    this.createBackgroundStars();
    this.createConstellations();
    this.createNlomNode();

    return true;
  }

  /**
   * Create background star field
   */
  createBackgroundStars() {
    const starConfig = getStarGenerationParams();
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(LOCAL_CONFIG.PARTICLE_COUNT * 3);
    const colors = new Float32Array(LOCAL_CONFIG.PARTICLE_COUNT * 3);
    const sizes = new Float32Array(LOCAL_CONFIG.PARTICLE_COUNT);

    // Generate random stars
    for (let i = 0; i < LOCAL_CONFIG.PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Position - using config spread
      const spread = starConfig.spread * 20; // Scale up for proper distribution
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * (spread * 0.5) + 100; // Position stars in front of camera

      // Color (various blues and cyans) - using config brightness and color variance
      const colorChoice = Math.random();
      const brightness = starConfig.brightness;
      const variance = starConfig.colorVariance;
      
      if (colorChoice < 0.6) {
        // Cyan stars
        colors[i3] = 0.36 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 1] = 0.91 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 2] = 0.91 * (brightness + (Math.random() - 0.5) * variance);
      } else if (colorChoice < 0.8) {
        // Blue stars
        colors[i3] = 0.06 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 1] = 0.22 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 2] = 0.34 * (brightness + (Math.random() - 0.5) * variance);
      } else {
        // Dim white stars
        const baseBrightness = brightness * 0.4;
        const brightVariance = baseBrightness + Math.random() * (brightness * 0.5);
        colors[i3] = brightVariance;
        colors[i3 + 1] = brightVariance;
        colors[i3 + 2] = brightVariance;
      }

      // Size - using config size range
      const [minSize, maxSize] = starConfig.sizeRange;
      sizes[i] = minSize + Math.random() * (maxSize - minSize);
    }

    this.setAttributes(geometry, positions, colors, sizes);

    // Star material with organic twinkling
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          // Organic twinkling based on position and time
          float twinkle = sin(time * 0.5 + position.x * 0.01 + position.y * 0.007) * 0.3 + 0.7;
          vAlpha = twinkle * (0.7 + size * 0.3); // Increased alpha for better visibility
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
          alpha *= vAlpha;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });

    this.backgroundStars = new THREE.Points(geometry, material);
    this.scene.add(this.backgroundStars);
    
    console.log("Background stars added to scene:", {
      stars: this.backgroundStars,
      geometry: this.backgroundStars.geometry,
      material: this.backgroundStars.material,
      sceneChildren: this.scene.children.length,
      starCount: LOCAL_CONFIG.PARTICLE_COUNT
    });
    
    // Debug: Log star creation
    console.log(`Created ${LOCAL_CONFIG.PARTICLE_COUNT} background stars at positions:`, {
      minX: Math.min(...Array.from({length: LOCAL_CONFIG.PARTICLE_COUNT}, (_, i) => positions[i * 3])),
      maxX: Math.max(...Array.from({length: LOCAL_CONFIG.PARTICLE_COUNT}, (_, i) => positions[i * 3])),
      minY: Math.min(...Array.from({length: LOCAL_CONFIG.PARTICLE_COUNT}, (_, i) => positions[i * 3 + 1])),
      maxY: Math.max(...Array.from({length: LOCAL_CONFIG.PARTICLE_COUNT}, (_, i) => positions[i * 3 + 1])),
      minZ: Math.min(...Array.from({length: LOCAL_CONFIG.PARTICLE_COUNT}, (_, i) => positions[i * 3 + 2])),
      maxZ: Math.max(...Array.from({length: LOCAL_CONFIG.PARTICLE_COUNT}, (_, i) => positions[i * 3 + 2])),
      cameraZ: this.camera.position.z
    });
  }

  /**
   * Create constellation clusters
   */
  createConstellations() {
    Object.entries(LOCAL_CONFIG.CONSTELLATIONS).forEach(([name, config]) => {
      const constellation = this.createConstellationCluster(name, config);
      this.constellations.set(name, constellation);
      this.scene.add(constellation.group);
    });
  }

  /**
   * Create individual constellation cluster
   */
  createConstellationCluster(name, config) {
    const group = new THREE.Group();
    group.position.set(config.x, config.y, config.z);
    group.userData = { name, config, isWarmed: false };

    // Create cluster particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(LOCAL_CONFIG.CLUSTER_PARTICLES * 3);
    const colors = new Float32Array(LOCAL_CONFIG.CLUSTER_PARTICLES * 3);
    const sizes = new Float32Array(LOCAL_CONFIG.CLUSTER_PARTICLES);

    const color = new THREE.Color(config.color);
    const warmColor = new THREE.Color(config.warm);

    for (let i = 0; i < LOCAL_CONFIG.CLUSTER_PARTICLES; i++) {
      const i3 = i * 3;

      // Organic cluster distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const starConfig = getStarGenerationParams();
      const radiusPower = 0.7; // Concentration factor for cluster distribution
      const radius = Math.pow(Math.random(), radiusPower) * LOCAL_CONFIG.CLUSTER_SIZE;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Color
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Size with variation - using config size range
      const [minSize, maxSize] = starConfig.sizeRange;
      const constellationSizeMultiplier = 3; // Constellation stars are larger than background
      sizes[i] = (minSize + Math.random() * (maxSize - minSize)) * constellationSizeMultiplier;
    }

    this.setAttributes(geometry, positions, colors, sizes);

    // Cluster material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        warmth: { value: 0 },
        baseColor: { value: color },
        warmColor: { value: warmColor },
      },
      vertexShader: `
        uniform float time;
        uniform float warmth;
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Organic pulsing
          float pulse = sin(time * 0.8 + position.x * 0.02 + position.y * 0.015) * 0.2 + 0.8;
          
          // Warmth effect
          vColor = mix(color, vec3(1.0, 0.8, 0.6), warmth * 0.3);
          vAlpha = pulse * (0.6 + warmth * 0.4);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (1.0 + warmth * 0.5) * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
          alpha *= vAlpha;
          
          // Soft glow effect
          vec3 glow = vColor * (1.0 + alpha * 0.5);
          
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    // Create constellation icon sprite at the center
    this.createConstellationIcon(group, name, config);

    // Add invisible interaction sphere
    const sphereGeometry = new THREE.SphereGeometry(
      LOCAL_CONFIG.HOVER_DISTANCE,
      8,
      8
    );
    const sphereMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.userData = { isInteractionSphere: true, clusterName: name };
    group.add(sphere);

    return {
      group,
      points,
      material,
      sphere,
      warmth: 0,
      targetWarmth: 0,
    };
  }

  /**
   * Create constellation icon sprite
   */
  createConstellationIcon(group, name, config) {
    // Get constellation data for icon name
    const constellationData = CONSTELLATIONS[name];
    if (!constellationData) return;

    // Create a glowing circle background for the icon (increased size)
    const circleGeometry = new THREE.CircleGeometry(18, 32);
    const circleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        warmth: { value: 0 },
        color: { value: new THREE.Color(config.color) },
      },
      vertexShader: `
         uniform float time;
         uniform float warmth;
         varying vec2 vUv;
         varying float vWarmth;
         
         void main() {
           vUv = uv;
           vWarmth = warmth;
           
           // Subtle pulsing animation
           vec3 pos = position * (1.0 + sin(time * 1.2) * 0.08 + warmth * 0.15);
           
           gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
         }
       `,
      fragmentShader: `
         uniform vec3 color;
         uniform float time;
         varying vec2 vUv;
         varying float vWarmth;
         
         void main() {
           float dist = distance(vUv, vec2(0.5));
           
           // Create soft circular gradient
           float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
           
           // Add gentle pulsing
           alpha *= 0.4 + sin(time * 1.5) * 0.1;
           
           // Warmth effect
           vec3 finalColor = mix(color, vec3(1.0, 0.9, 0.7), vWarmth * 0.4);
           
           gl_FragColor = vec4(finalColor, alpha * (0.6 + vWarmth * 0.4));
         }
       `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const iconCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    iconCircle.userData = { isIcon: true, warmthMaterial: circleMaterial };
    iconCircle.renderOrder = 999; // Ensure icon circles render above other elements
    group.add(iconCircle);

    // Create initial sprite with a stable fallback texture
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 128;
    canvas.height = 128;

    // Create a stable fallback texture first - make it more visible
    context.fillStyle = new THREE.Color(config.color).getStyle();
    context.globalAlpha = 0.8;
    context.beginPath();
    context.arc(64, 64, 40, 0, 2 * Math.PI);
    context.fill();

    // Add a simple symbol as fallback
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.font = "48px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("●", 64, 64);

    const fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.needsUpdate = true;
    fallbackTexture.flipY = false; // Prevent texture flipping

    // Create sprite material with fallback texture
    const spriteMaterial = new THREE.SpriteMaterial({
      map: fallbackTexture,
      transparent: true,
      blending: THREE.NormalBlending,
      opacity: 1.0, // Full opacity for better visibility
      depthWrite: false, // Prevent depth conflicts
      depthTest: false, // Always render on top
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(24, 24, 1); // Increased from 16 for better visibility
    sprite.userData = { isIconSprite: true };
    sprite.renderOrder = 1000; // Ensure SVG sprites render on top
    sprite.position.z = 1; // Slight forward position to prevent z-fighting
    group.add(sprite);

    // Load SVG texture for constellation icon (async, won't cause flickering)
    const iconName = constellationData?.icon || "tree";
    const svgPath = `assets/images/${iconName}.svg`;

    // Check if we already have this texture cached
    if (this.textureCache.has(svgPath)) {
      const cachedTexture = this.textureCache.get(svgPath);
      sprite.material.map = cachedTexture;
      sprite.material.needsUpdate = true;
      return { iconCircle, sprite };
    }

    // Create an image element to load the SVG
    const img = new Image();
    img.crossOrigin = "anonymous"; // Prevent CORS issues

    img.onload = () => {
      try {
        // Create new canvas for SVG to avoid modifying fallback
        const svgCanvas = document.createElement("canvas");
        const svgContext = svgCanvas.getContext("2d");
        svgCanvas.width = 128;
        svgCanvas.height = 128;

        // Clear canvas with transparent background
        svgContext.clearRect(0, 0, 128, 128);

        // Draw the SVG image centered and larger
        svgContext.drawImage(img, 8, 8, 112, 112);

        // Create new texture from SVG canvas
        const svgTexture = new THREE.CanvasTexture(svgCanvas);
        svgTexture.needsUpdate = true;
        svgTexture.flipY = false; // Prevent texture flipping
        svgTexture.generateMipmaps = false; // Prevent blur
        svgTexture.minFilter = THREE.LinearFilter;
        svgTexture.magFilter = THREE.LinearFilter;

        // Cache the texture to prevent recreation
        this.textureCache.set(svgPath, svgTexture);

        // Update sprite material with new texture smoothly
        if (sprite.material) {
          // Create new material to avoid flickering
          const newMaterial = new THREE.SpriteMaterial({
            map: svgTexture,
            transparent: true,
            blending: THREE.NormalBlending,
            opacity: 1.0,
            depthWrite: false,
            depthTest: false,
          });

          // Replace material atomically
          const oldMaterial = sprite.material;
          sprite.material = newMaterial;

          // Clean up old material after a brief delay
          setTimeout(() => {
            if (oldMaterial && oldMaterial !== newMaterial) {
              oldMaterial.dispose();
            }
          }, 100);
        }
      } catch (error) {
        console.warn(`Failed to load SVG for ${name}:`, error);
        // Keep fallback texture if SVG loading fails
      }
    };

    // Handle error silently - keep fallback texture
    img.onerror = () => {
      console.warn(`Could not load SVG ${svgPath} for ${name}, using fallback`);
      // Fallback texture is already set, no flickering
    };

    // Set the SVG source
    img.src = svgPath;

    return { iconCircle, sprite };
  }

  /**
   * Create central Nlom node (representing the Consular)
   */
  createNlomNode() {
    const geometry = new THREE.SphereGeometry(8, 16, 16);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          // Subtle pulsing
          vec3 pos = position * (1.0 + sin(time * 1.5) * 0.05);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          // Core glow
          float fresnel = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          fresnel = pow(fresnel, 2.0);
          
          vec3 color = vec3(0.36, 0.91, 0.91);
          float alpha = fresnel * (0.6 + sin(time * 2.0) * 0.2);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    this.nlomNode = new THREE.Mesh(geometry, material);
    this.nlomNode.position.set(0, 0, 100);
    this.scene.add(this.nlomNode);
  }

  /**
   * Create tendril connection between Nlom node and target constellation
   */
  createTendril(targetPosition) {
    if (this.activeTendril) {
      this.scene.remove(this.activeTendril);
    }

    const startPos = this.nlomNode.position.clone();
    const endPos = new THREE.Vector3().copy(targetPosition);

    // Create organic curve points
    const points = [];
    const segments = LOCAL_CONFIG.TENDRIL_SEGMENTS;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // Bezier curve with organic deviation
      const mid = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);
      mid.y += Math.sin(t * Math.PI) * 30; // Arch upward
      mid.x += (Math.random() - 0.5) * 20 * Math.sin(t * Math.PI); // Organic sway

      const point = new THREE.Vector3()
        .lerpVectors(startPos, mid, t * 2)
        .lerp(endPos, Math.max(0, (t - 0.5) * 2));

      points.push(point);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, segments, 0.5, 8, false);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        progress: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        uniform float progress;
        varying float vProgress;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          vProgress = uv.x;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float progress;
        varying float vProgress;
        varying vec2 vUv;
        
        void main() {
          // Energy flow effect
          float flow = sin(vProgress * 6.28 - time * 8.0) * 0.5 + 0.5;
          
          // Fade based on progress
          float alpha = smoothstep(progress, progress + 0.1, vProgress) * 
                       (1.0 - smoothstep(progress + 0.1, progress + 0.3, vProgress));
          
          // Edge fade
          float edgeFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
          alpha *= edgeFade;
          
          vec3 color = vec3(0.36, 0.91, 0.91) * (1.0 + flow * 0.5);
          
          gl_FragColor = vec4(color, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    this.activeTendril = new THREE.Mesh(geometry, material);
    this.scene.add(this.activeTendril);

    return this.activeTendril;
  }

  /**
   * Update scene animations
   */
  update() {
    const time = this.clock.getElapsedTime();

    // Update background stars
    if (this.backgroundStars) {
      this.backgroundStars.material.uniforms.time.value = time;
      this.backgroundStars.rotation.y = time * 0.02;
      this.backgroundStars.rotation.z = time * 0.01;
    }

    // Update constellations
    this.constellations.forEach((constellation, name) => {
      // Smooth warmth transitions
      const warmthSpeed = 3.0;
      constellation.warmth +=
        (constellation.targetWarmth - constellation.warmth) *
        warmthSpeed *
        0.016;

      constellation.material.uniforms.time.value = time;
      constellation.material.uniforms.warmth.value = constellation.warmth;

      // Update icon materials
      constellation.group.traverse((child) => {
        if (child.userData.isIcon && child.userData.warmthMaterial) {
          child.userData.warmthMaterial.uniforms.time.value = time;
          child.userData.warmthMaterial.uniforms.warmth.value =
            constellation.warmth;
        }

        // Ensure sprites maintain stable visibility
        if (child.userData.isIconSprite && child.material) {
          // Ensure sprites always render
          child.material.opacity = 1.0;
          child.visible = true;

          // Prevent unnecessary texture updates
          if (child.material.map) {
            child.material.map.needsUpdate = false;
          }
        }
      });

      // Organic floating motion
      const offset = name.length * 0.5; // Unique offset per constellation
      constellation.group.position.y += Math.sin(time * 0.3 + offset) * 0.2;
      constellation.group.rotation.z = Math.sin(time * 0.2 + offset) * 0.05;
    });

    // Update Nlom node
    if (this.nlomNode) {
      this.nlomNode.material.uniforms.time.value = time;
      this.nlomNode.rotation.y = time * 0.5;
    }

    // Update active tendril
    if (this.activeTendril) {
      this.activeTendril.material.uniforms.time.value = time;
    }

    // Gentle camera sway
    if (this.camera) {
      this.camera.position.x = Math.sin(time * 0.1) * 5;
      this.camera.position.y = Math.cos(time * 0.15) * 3;
      this.camera.lookAt(0, 0, 0);
    }
  }

  /**
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
      
      // Debug: Log render info
      if (this.backgroundStars) {
        console.log('Rendering scene with background stars:', {
          visible: this.backgroundStars.visible,
          count: this.backgroundStars.geometry.attributes.position.count,
          position: this.backgroundStars.position,
          material: this.backgroundStars.material
        });
      }
    }
  }

  /**
   * Handle window resize
   */
  handleResize(width, height) {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Enable performance mode (reduced quality)
   */
  enablePerformanceMode() {
    if (this.performanceMode) return;

    this.performanceMode = true;

    if (this.renderer) {
      this.renderer.setPixelRatio(1);

      // Keep background stars visible - don't hide them for performance
      // if (this.backgroundStars) {
      //   this.backgroundStars.visible = false;
      // }
    }
  }

  /**
   * Get constellation by name
   */
  getConstellation(name) {
    return this.constellations.get(name);
  }

  /**
   * Get all interaction spheres for raycasting
   */
  getInteractionSpheres() {
    const spheres = [];
    this.constellations.forEach((constellation) => {
      spheres.push(constellation.sphere);
    });
    return spheres;
  }

  /**
   * Animate tendril growth
   */
  animateTendril() {
    if (!this.activeTendril) return;

    const startTime = this.clock.getElapsedTime();
    const duration = LOCAL_CONFIG.TENDRIL_ANIMATION_TIME / 1000;

    const animate = () => {
      if (!this.activeTendril) return;

      const elapsed = this.clock.getElapsedTime() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.activeTendril.material.uniforms.progress.value = progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Dispose Three.js resources
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    // Dispose cached textures
    this.textureCache.forEach((texture) => {
      if (texture && texture.dispose) {
        texture.dispose();
      }
    });
    this.textureCache.clear();

    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.constellations.clear();
    this.activeTendril = null;
    this.nlomNode = null;
  }
}
