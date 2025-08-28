/**
 * Starfield Module - Combined Scene, Interactions, and Management
 * Handles 3D starfield visualization with Three.js
 */

import { 
  Scene, PerspectiveCamera, WebGLRenderer, Clock, BufferGeometry, BufferAttribute,
  ShaderMaterial, Points, Color, Group, CircleGeometry, Mesh, CanvasTexture,
  SpriteMaterial, Sprite, SphereGeometry, MeshBasicMaterial, Vector3, Vector2,
  CatmullRomCurve3, TubeGeometry, LinearFilter, NormalBlending, AdditiveBlending,
  DoubleSide, Raycaster
} from 'three';

import { CONSTELLATIONS, STARFIELD_CONFIG, KEYS } from '../config.js';
import { Logger, AnimationUtils, TooltipManager, EventUtils } from './utilities.js';

export class StarfieldManager {
  constructor(state) {
    this.state = state;
    this.logger = new Logger("StarfieldManager");
    
    // Core components
    this.canvas = null;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new Clock();
    
    // Scene objects
    this.backgroundStars = null;
    this.constellations = new Map();
    this.nlomNode = null;
    this.activeTendril = null;
    
    // Interaction state
    this.currentHover = null;
    this.isActivating = false;
    this.onClusterActivate = null;
    
    // Performance
    this.isInitialized = false;
    this.isRendering = false;
    this.animationFrameId = null;
    this.performanceMode = false;
    this.textureCache = new Map();
    
    // Event handlers bound to preserve context
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onClick = this.handleClick.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onResize = AnimationUtils.debounce(this.handleResize.bind(this), 250);
    this.onMouseLeave = this.handleMouseLeave.bind(this);
  }

  async init(containerSelector = "[data-component='starfield-container']") {
    try {
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
      if (!this.checkWebGLSupport()) {
        throw new Error("WebGL not supported");
      }
      
      // Update container state
      this.container.setAttribute("data-state", "loading");
      
      // Create canvas
      this.canvas = document.createElement("canvas");
      this.canvas.setAttribute("data-component", "starfield-canvas");
      this.canvas.setAttribute("aria-label", "Neural Starfield Visualization");
      this.canvas.setAttribute("role", "img");
      this.canvas.setAttribute("tabindex", "0");
      this.container.appendChild(this.canvas);
      
      // Initialize 3D scene
      await this.init3D();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start animation loop
      this.startAnimation();
      
      // Update container state
      this.container.setAttribute("data-state", "ready");
      
      this.isInitialized = true;
      
      if (this.state) {
        this.state.set("starfieldReady", true);
      }
      
      this.logger.info("Starfield initialization complete");
      return true;
    } catch (error) {
      this.logger.error("Failed to initialize starfield", error);
      
      if (this.container) {
        this.container.setAttribute("data-state", "error");
      }
      
      return false;
    }
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return gl !== null;
    } catch (error) {
      return false;
    }
  }

  async init3D() {
    const containerRect = this.container.getBoundingClientRect();
    const width = Math.max(containerRect.width, 800);
    const height = Math.max(containerRect.height, 600);

    // Create scene
    this.scene = new Scene();

    // Create camera
    const aspect = width / height;
    this.camera = new PerspectiveCamera(
      STARFIELD_CONFIG.CAMERA_FOV,
      aspect,
      STARFIELD_CONFIG.CAMERA_NEAR,
      STARFIELD_CONFIG.CAMERA_FAR
    );
    this.camera.position.set(0, 0, 300);

    // Create renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.performanceMode,
      alpha: true,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0.0);
    this.renderer.sortObjects = true;

    // Create scene content
    this.createBackgroundStars();
    this.createConstellations();
    this.createNlomNode();

    // Perform initial test render
    this.render();
  }

  createBackgroundStars() {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(STARFIELD_CONFIG.PARTICLE_COUNT * 3);
    const colors = new Float32Array(STARFIELD_CONFIG.PARTICLE_COUNT * 3);
    const sizes = new Float32Array(STARFIELD_CONFIG.PARTICLE_COUNT);

    const spread = 200;
    for (let i = 0; i < STARFIELD_CONFIG.PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() * 2 - 1) * spread + (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() * 2 - 1) * spread + (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() * 2 - 1) * spread - 100 + (Math.random() - 0.5) * 50;

      const colorChoice = Math.random();
      const brightness = STARFIELD_CONFIG.BRIGHTNESS_BASE;
      const variance = STARFIELD_CONFIG.COLOR_VARIANCE;

      if (colorChoice < 0.6) {
        colors[i3] = 0.36 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 1] = 0.91 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 2] = 0.91 * (brightness + (Math.random() - 0.5) * variance);
      } else if (colorChoice < 0.8) {
        colors[i3] = 0.06 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 1] = 0.22 * (brightness + (Math.random() - 0.5) * variance);
        colors[i3 + 2] = 0.34 * (brightness + (Math.random() - 0.5) * variance);
      } else {
        const baseBrightness = brightness * 0.4;
        const brightVariance = baseBrightness + Math.random() * (brightness * 0.5);
        colors[i3] = brightVariance;
        colors[i3 + 1] = brightVariance;
        colors[i3 + 2] = brightVariance;
      }

      const { min: minSize, max: maxSize } = STARFIELD_CONFIG.SIZE_RANGE;
      sizes[i] = minSize + Math.random() * (maxSize - minSize);
    }

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1));

    const material = new ShaderMaterial({
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
          float twinkle = sin(time * 0.5 + position.x * 0.01 + position.y * 0.007) * 0.2 + 0.8;
          vAlpha = twinkle * (0.9 + size * 0.4);
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
      blending: AdditiveBlending,
    });

    this.backgroundStars = new Points(geometry, material);
    this.scene.add(this.backgroundStars);
  }

  createConstellations() {
    Object.entries(STARFIELD_CONFIG.CONSTELLATIONS).forEach(([name, config]) => {
      const constellation = this.createConstellationCluster(name, config);
      this.constellations.set(name, constellation);
      this.scene.add(constellation.group);
    });
  }

  createConstellationCluster(name, config) {
    const group = new Group();
    group.position.set(config.x, config.y, config.z);
    group.userData = { name, config };

    const geometry = new BufferGeometry();
    const positions = new Float32Array(STARFIELD_CONFIG.CLUSTER_PARTICLES * 3);
    const colors = new Float32Array(STARFIELD_CONFIG.CLUSTER_PARTICLES * 3);
    const sizes = new Float32Array(STARFIELD_CONFIG.CLUSTER_PARTICLES);

    const color = new Color(config.color);
    const warmColor = new Color(config.warm);

    for (let i = 0; i < STARFIELD_CONFIG.CLUSTER_PARTICLES; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radiusPower = 0.7;
      const radius = Math.pow(Math.random(), radiusPower) * STARFIELD_CONFIG.CLUSTER_SIZE;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      const { min: minSize, max: maxSize } = STARFIELD_CONFIG.SIZE_RANGE;
      sizes[i] = (minSize + Math.random() * (maxSize - minSize)) * 3;
    }

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1));

    const material = new ShaderMaterial({
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
          float pulse = sin(time * 0.8 + position.x * 0.02 + position.y * 0.015) * 0.2 + 0.8;
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
          vec3 glow = vColor * (1.0 + alpha * 0.5);
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: AdditiveBlending,
    });

    const points = new Points(geometry, material);
    group.add(points);

    // Add interaction sphere
    const sphereGeometry = new SphereGeometry(STARFIELD_CONFIG.HOVER_DISTANCE, 8, 8);
    const sphereMaterial = new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    sphere.userData = { isInteractionSphere: true, clusterName: name };
    group.add(sphere);

    // Create icon
    this.createConstellationIcon(group, name, config);

    return {
      group,
      points,
      material,
      sphere,
      warmth: 0,
      targetWarmth: 0,
    };
  }

  createConstellationIcon(group, name, config) {
    const constellationData = CONSTELLATIONS[name];
    if (!constellationData) return;

    // Create glowing circle background
    const circleGeometry = new CircleGeometry(18, 32);
    const circleMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        warmth: { value: 0 },
        color: { value: new Color(config.color) },
      },
      vertexShader: `
        uniform float time;
        uniform float warmth;
        varying vec2 vUv;
        varying float vWarmth;
        void main() {
          vUv = uv;
          vWarmth = warmth;
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
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          alpha *= 0.4 + sin(time * 1.5) * 0.1;
          vec3 finalColor = mix(color, vec3(1.0, 0.9, 0.7), vWarmth * 0.4);
          gl_FragColor = vec4(finalColor, alpha * (0.6 + vWarmth * 0.4));
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
      side: DoubleSide,
    });

    const iconCircle = new Mesh(circleGeometry, circleMaterial);
    iconCircle.userData = { isIcon: true, warmthMaterial: circleMaterial };
    iconCircle.renderOrder = 999;
    group.add(iconCircle);

    // Create sprite with icon
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 128;
    canvas.height = 128;

    // Fallback texture
    context.fillStyle = new Color(config.color).getStyle();
    context.globalAlpha = 0.8;
    context.beginPath();
    context.arc(64, 64, 40, 0, 2 * Math.PI);
    context.fill();

    const fallbackTexture = new CanvasTexture(canvas);
    fallbackTexture.needsUpdate = true;
    fallbackTexture.flipY = false;

    const spriteMaterial = new SpriteMaterial({
      map: fallbackTexture,
      transparent: true,
      blending: NormalBlending,
      opacity: 1.0,
      depthWrite: false,
      depthTest: false,
    });

    const sprite = new Sprite(spriteMaterial);
    sprite.scale.set(24, 24, 1);
    sprite.userData = { isIconSprite: true };
    sprite.renderOrder = 1000;
    sprite.position.z = 1;
    group.add(sprite);

    // Load SVG icon
    const iconName = constellationData?.icon || "tree";
    const svgPath = `assets/images/${iconName}.svg`;

    if (!this.textureCache.has(svgPath)) {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const svgCanvas = document.createElement("canvas");
          const svgContext = svgCanvas.getContext("2d");
          svgCanvas.width = 128;
          svgCanvas.height = 128;
          svgContext.clearRect(0, 0, 128, 128);
          svgContext.drawImage(img, 8, 8, 112, 112);

          const svgTexture = new CanvasTexture(svgCanvas);
          svgTexture.needsUpdate = true;
          svgTexture.flipY = false;
          svgTexture.generateMipmaps = false;
          svgTexture.minFilter = LinearFilter;
          svgTexture.magFilter = LinearFilter;

          this.textureCache.set(svgPath, svgTexture);

          if (sprite.material) {
            const newMaterial = new SpriteMaterial({
              map: svgTexture,
              transparent: true,
              blending: NormalBlending,
              opacity: 1.0,
              depthWrite: false,
              depthTest: false,
            });
            sprite.material = newMaterial;
          }
        } catch (error) {
          console.warn(`Failed to load SVG for ${name}:`, error);
        }
      };

      img.onerror = () => {
        console.warn(`Could not load SVG ${svgPath} for ${name}`);
      };

      img.src = svgPath;
    }

    return { iconCircle, sprite };
  }

  createNlomNode() {
    const geometry = new SphereGeometry(8, 16, 16);
    const material = new ShaderMaterial({
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
          vec3 pos = position * (1.0 + sin(time * 1.5) * 0.05);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float fresnel = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          fresnel = pow(fresnel, 2.0);
          vec3 color = vec3(0.36, 0.91, 0.91);
          float alpha = fresnel * (0.6 + sin(time * 2.0) * 0.2);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
    });

    this.nlomNode = new Mesh(geometry, material);
    this.nlomNode.position.set(0, 0, 100);
    this.scene.add(this.nlomNode);
  }

  setupEventListeners() {
    if (!this.canvas) return;

    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseleave", this.onMouseLeave);
    this.canvas.addEventListener("click", this.onClick);
    this.canvas.addEventListener("keydown", this.onKeyDown);
    
    window.addEventListener("resize", this.onResize);
    
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopAnimation();
      } else if (this.isInitialized && !this.isRendering) {
        this.startAnimation();
      }
    });
  }

  handleMouseMove(event) {
    if (!this.camera || !this.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouse = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersectables = this.getInteractionSpheres();
    const intersects = raycaster.intersectObjects(intersectables);

    const newHover = intersects.length > 0 ? intersects[0].object.userData.clusterName : null;

    if (newHover !== this.currentHover) {
      if (this.currentHover) {
        const prevConstellation = this.constellations.get(this.currentHover);
        if (prevConstellation) {
          prevConstellation.targetWarmth = 0;
        }
        TooltipManager.hide();
      }

      if (newHover) {
        const constellation = this.constellations.get(newHover);
        if (constellation) {
          constellation.targetWarmth = 1;
          this.container.setAttribute('data-hover-state', 'active');
          this.showConstellationTooltip(newHover, event.clientX, event.clientY);
        }
      } else {
        this.container.setAttribute('data-hover-state', 'default');
        TooltipManager.hide();
      }

      this.currentHover = newHover;
    } else if (newHover) {
      TooltipManager.updatePosition(event.clientX, event.clientY);
    }
  }

  handleMouseLeave() {
    if (this.currentHover) {
      const constellation = this.constellations.get(this.currentHover);
      if (constellation) {
        constellation.targetWarmth = 0;
      }
      this.currentHover = null;
      this.container.setAttribute('data-hover-state', 'default');
      TooltipManager.hide();
    }
  }

  handleClick() {
    if (this.isActivating || !this.currentHover || !this.onClusterActivate) return;

    TooltipManager.hide();
    this.activateCurrentCluster();
  }

  handleKeyDown(event) {
    if (!this.constellations.size) return;

    const clusters = Array.from(this.constellations.keys());
    let currentIndex = this.currentHover ? clusters.indexOf(this.currentHover) : -1;

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
        currentIndex = currentIndex <= 0 ? clusters.length - 1 : currentIndex - 1;
        this.setKeyboardFocus(clusters[currentIndex]);
        break;

      case KEYS.ENTER:
      case KEYS.SPACE:
        event.preventDefault();
        if (!this.isActivating && this.currentHover && this.onClusterActivate) {
          TooltipManager.hide();
          this.activateCurrentCluster();
        }
        break;
    }
  }

  handleResize() {
    if (!this.isInitialized) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  setKeyboardFocus(clusterName) {
    if (this.currentHover && this.currentHover !== clusterName) {
      const prevConstellation = this.constellations.get(this.currentHover);
      if (prevConstellation) {
        prevConstellation.targetWarmth = 0;
      }
    }

    this.currentHover = clusterName;
    const constellation = this.constellations.get(clusterName);
    if (constellation) {
      constellation.targetWarmth = 1;
    }
  }

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
      component: "constellation-tooltip"
    });
  }

  activateCurrentCluster() {
    this.isActivating = true;
    const constellation = this.constellations.get(this.currentHover);
    if (constellation) {
      const targetCluster = this.currentHover;
      this.createTendril(constellation.group.position);
      this.animateTendril();
      setTimeout(() => {
        this.onClusterActivate(targetCluster);
        this.isActivating = false;
      }, 500);
    } else {
      this.isActivating = false;
    }
  }

  createTendril(targetPosition) {
    if (this.activeTendril) {
      this.scene.remove(this.activeTendril);
    }

    const startPos = this.nlomNode.position.clone();
    const endPos = new Vector3().copy(targetPosition);

    const points = [];
    const segments = STARFIELD_CONFIG.TENDRIL_SEGMENTS;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const mid = new Vector3().lerpVectors(startPos, endPos, 0.5);
      mid.y += Math.sin(t * Math.PI) * 30;
      mid.x += (Math.random() - 0.5) * 20 * Math.sin(t * Math.PI);

      const point = new Vector3()
        .lerpVectors(startPos, mid, t * 2)
        .lerp(endPos, Math.max(0, (t - 0.5) * 2));

      points.push(point);
    }

    const curve = new CatmullRomCurve3(points);
    const geometry = new TubeGeometry(curve, segments, 0.5, 8, false);

    const material = new ShaderMaterial({
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
          float flow = sin(vProgress * 6.28 - time * 8.0) * 0.5 + 0.5;
          float alpha = smoothstep(progress, progress + 0.1, vProgress) *
                       (1.0 - smoothstep(progress + 0.1, progress + 0.3, vProgress));
          float edgeFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
          alpha *= edgeFade;
          vec3 color = vec3(0.36, 0.91, 0.91) * (1.0 + flow * 0.5);
          gl_FragColor = vec4(color, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
    });

    this.activeTendril = new Mesh(geometry, material);
    this.scene.add(this.activeTendril);
    return this.activeTendril;
  }

  animateTendril() {
    if (!this.activeTendril) return;

    const startTime = this.clock.getElapsedTime();
    const duration = STARFIELD_CONFIG.TENDRIL_ANIMATION_TIME / 1000;

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

  getInteractionSpheres() {
    const spheres = [];
    this.constellations.forEach((constellation) => {
      spheres.push(constellation.sphere);
    });
    return spheres;
  }

  update() {
    const time = this.clock.getElapsedTime();

    if (this.backgroundStars) {
      this.backgroundStars.material.uniforms.time.value = time;
      this.backgroundStars.rotation.y = time * 0.02;
      this.backgroundStars.rotation.z = time * 0.01;
    }

    this.constellations.forEach((constellation, name) => {
      const warmthSpeed = 3.0;
      constellation.warmth += (constellation.targetWarmth - constellation.warmth) * warmthSpeed * 0.016;

      constellation.material.uniforms.time.value = time;
      constellation.material.uniforms.warmth.value = constellation.warmth;

      constellation.group.traverse((child) => {
        if (child.userData.isIcon && child.userData.warmthMaterial) {
          child.userData.warmthMaterial.uniforms.time.value = time;
          child.userData.warmthMaterial.uniforms.warmth.value = constellation.warmth;
        }
      });

      const offset = name.length * 0.5;
      constellation.group.position.y += Math.sin(time * 0.3 + offset) * 0.2;
      constellation.group.rotation.z = Math.sin(time * 0.2 + offset) * 0.05;
    });

    if (this.nlomNode) {
      this.nlomNode.material.uniforms.time.value = time;
      this.nlomNode.rotation.y = time * 0.5;
    }

    if (this.activeTendril) {
      this.activeTendril.material.uniforms.time.value = time;
    }

    if (this.camera) {
      this.camera.position.x = Math.sin(time * 0.1) * 5;
      this.camera.position.y = Math.cos(time * 0.15) * 3;
      this.camera.lookAt(0, 0, 0);
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  startAnimation() {
    if (this.isRendering) return;
    
    this.isRendering = true;
    const animate = () => {
      if (!this.isRendering) return;
      this.update();
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  stopAnimation() {
    if (!this.isRendering) return;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.isRendering = false;
  }

  setClusterActivationCallback(callback) {
    this.onClusterActivate = callback;
  }

  destroy() {
    this.stopAnimation();
    
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
      this.canvas.removeEventListener("mouseleave", this.onMouseLeave);
      this.canvas.removeEventListener("click", this.onClick);
      this.canvas.removeEventListener("keydown", this.onKeyDown);
    }
    
    window.removeEventListener("resize", this.onResize);
    
    TooltipManager.cleanup();
    
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

    this.textureCache.forEach((texture) => {
      if (texture && texture.dispose) {
        texture.dispose();
      }
    });
    this.textureCache.clear();
    
    this.logger.info("StarfieldManager destroyed");
  }
}