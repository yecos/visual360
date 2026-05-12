/**
 * Three.js-based equirectangular panorama renderer.
 * Renders 360° panorama images with interactive camera controls,
 * hotspot support, and view state management.
 */

import * as THREE from 'three';

export interface HotspotData {
  id: string;
  position: THREE.Vector3;
  label: string;
  onClick?: () => void;
}

export class PanoramaRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sphere: THREE.Mesh;
  private container: HTMLElement;
  private hotspots: Map<string, { mesh: THREE.Mesh; sprite: THREE.Sprite; data: HotspotData }> = new Map();
  private hotspotGroup: THREE.Group;

  // Interaction state
  private isUserInteracting = false;
  private lon = 0;
  private lat = 0;
  private onPointerDownLon = 0;
  private onPointerDownLat = 0;
  private onPointerDownMouseX = 0;
  private onPointerDownMouseY = 0;
  private fov = 75;

  // Touch support
  private touchStartDistance = 0;
  private touchStartFov = 75;

  // Animation
  private animationFrameId = 0;

  // Event handler references (for cleanup)
  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: () => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnTouchStart: (e: TouchEvent) => void;
  private boundOnTouchMove: (e: TouchEvent) => void;
  private boundOnTouchEnd: () => void;
  private boundOnResize: () => void;
  private boundOnClick: (e: MouseEvent) => void;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.fov, aspect, 0.1, 1100);
    this.camera.target = new THREE.Vector3(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Sphere geometry for panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Invert so texture renders on inside

    const material = new THREE.MeshBasicMaterial({ color: 0x222222 });
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);

    // Hotspot group
    this.hotspotGroup = new THREE.Group();
    this.scene.add(this.hotspotGroup);

    // Bind event handlers
    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnClick = this.onClick.bind(this);

    // Add event listeners
    this.renderer.domElement.addEventListener('pointerdown', this.boundOnPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.boundOnPointerMove);
    this.renderer.domElement.addEventListener('pointerup', this.boundOnPointerUp);
    this.renderer.domElement.addEventListener('wheel', this.boundOnWheel);
    this.renderer.domElement.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });
    this.renderer.domElement.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    this.renderer.domElement.addEventListener('touchend', this.boundOnTouchEnd);
    this.renderer.domElement.addEventListener('click', this.boundOnClick);
    window.addEventListener('resize', this.boundOnResize);

    // Start render loop
    this.animate();
  }

  /**
   * Load an equirectangular panorama image from URL.
   */
  async loadPanorama(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const material = new THREE.MeshBasicMaterial({ map: texture });
          this.sphere.material.dispose();
          this.sphere.material = material;
          resolve();
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load panorama: ${error}`));
        },
      );
    });
  }

  /**
   * Load a panorama from a base64 data URL.
   */
  async loadPanoramaFromBase64(base64: string, mimeType: string = 'image/jpeg'): Promise<void> {
    const dataUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
    return this.loadPanorama(dataUrl);
  }

  /**
   * Set the camera view by pitch, yaw, and field of view.
   */
  setView(pitch: number, yaw: number, fov: number): void {
    this.lat = pitch;
    this.lon = yaw;
    this.fov = fov;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Get the current camera view as pitch, yaw, fov.
   */
  getView(): { pitch: number; yaw: number; fov: number } {
    return {
      pitch: this.lat,
      yaw: this.lon,
      fov: this.fov,
    };
  }

  /**
   * Add a clickable hotspot at a 3D position in the panorama sphere.
   */
  addHotspot(data: HotspotData): void {
    // Hotspot marker - small sphere
    const geometry = new THREE.SphereGeometry(8, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(data.position);
    mesh.userData = { hotspotId: data.id };

    // Label sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.roundRect(0, 0, 256, 64, 8);
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(data.label, 128, 32);

    const spriteMaterial = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(data.position);
    sprite.position.y += 20;
    sprite.scale.set(40, 10, 1);
    sprite.userData = { hotspotId: data.id };

    this.hotspotGroup.add(mesh);
    this.hotspotGroup.add(sprite);

    this.hotspots.set(data.id, { mesh, sprite, data });
  }

  /**
   * Remove all hotspots from the scene.
   */
  removeHotspots(): void {
    this.hotspots.forEach(({ mesh, sprite }) => {
      this.hotspotGroup.remove(mesh);
      this.hotspotGroup.remove(sprite);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      sprite.material.map?.dispose();
      sprite.material.dispose();
    });
    this.hotspots.clear();
  }

  /**
   * Remove a specific hotspot by ID.
   */
  removeHotspot(id: string): void {
    const hotspot = this.hotspots.get(id);
    if (hotspot) {
      this.hotspotGroup.remove(hotspot.mesh);
      this.hotspotGroup.remove(hotspot.sprite);
      hotspot.mesh.geometry.dispose();
      (hotspot.mesh.material as THREE.Material).dispose();
      hotspot.sprite.material.map?.dispose();
      hotspot.sprite.material.dispose();
      this.hotspots.delete(id);
    }
  }

  /**
   * Dispose of all resources and remove event listeners.
   */
  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);

    this.renderer.domElement.removeEventListener('pointerdown', this.boundOnPointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.boundOnPointerMove);
    this.renderer.domElement.removeEventListener('pointerup', this.boundOnPointerUp);
    this.renderer.domElement.removeEventListener('wheel', this.boundOnWheel);
    this.renderer.domElement.removeEventListener('touchstart', this.boundOnTouchStart);
    this.renderer.domElement.removeEventListener('touchmove', this.boundOnTouchMove);
    this.renderer.domElement.removeEventListener('touchend', this.boundOnTouchEnd);
    this.renderer.domElement.removeEventListener('click', this.boundOnClick);
    window.removeEventListener('resize', this.boundOnResize);

    this.removeHotspots();

    this.sphere.geometry.dispose();
    (this.sphere.material as THREE.Material).dispose();

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  // ─── Private: Event Handlers ────────────────────────────────────────────

  private onPointerDown(event: PointerEvent): void {
    this.isUserInteracting = true;
    this.onPointerDownMouseX = event.clientX;
    this.onPointerDownMouseY = event.clientY;
    this.onPointerDownLon = this.lon;
    this.onPointerDownLat = this.lat;
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isUserInteracting) return;

    this.lon = (this.onPointerDownMouseX - event.clientX) * 0.1 + this.onPointerDownLon;
    this.lat = (event.clientY - this.onPointerDownMouseY) * 0.1 + this.onPointerDownLat;
  }

  private onPointerUp(): void {
    this.isUserInteracting = false;
  }

  private onWheel(event: WheelEvent): void {
    this.fov += event.deltaY * 0.05;
    this.fov = THREE.MathUtils.clamp(this.fov, 30, 110);
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isUserInteracting = true;
      this.onPointerDownMouseX = event.touches[0].pageX;
      this.onPointerDownMouseY = event.touches[0].pageY;
      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;
    } else if (event.touches.length === 2) {
      this.touchStartDistance = this.getTouchDistance(event.touches);
      this.touchStartFov = this.fov;
    }
    event.preventDefault();
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isUserInteracting) {
      this.lon = (this.onPointerDownMouseX - event.touches[0].pageX) * 0.1 + this.onPointerDownLon;
      this.lat = (event.touches[0].pageY - this.onPointerDownMouseY) * 0.1 + this.onPointerDownLat;
    } else if (event.touches.length === 2) {
      const distance = this.getTouchDistance(event.touches);
      const delta = this.touchStartDistance - distance;
      this.fov = THREE.MathUtils.clamp(this.touchStartFov + delta * 0.1, 30, 110);
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    event.preventDefault();
  }

  private onTouchEnd(): void {
    this.isUserInteracting = false;
  }

  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const hotspotMeshes = Array.from(this.hotspots.values()).map((h) => h.mesh);
    const intersects = this.raycaster.intersectObjects(hotspotMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const hotspotId = hitMesh.userData.hotspotId;
      const hotspot = this.hotspots.get(hotspotId);
      if (hotspot?.data.onClick) {
        hotspot.data.onClick();
      }
    }
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ─── Private: Render Loop ──────────────────────────────────────────────

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Clamp latitude
    this.lat = Math.max(-85, Math.min(85, this.lat));

    // Calculate camera target based on spherical coordinates
    const phi = THREE.MathUtils.degToRad(90 - this.lat);
    const theta = THREE.MathUtils.degToRad(this.lon);

    const target = this.camera.target!;
    target.x = 500 * Math.sin(phi) * Math.cos(theta);
    target.y = 500 * Math.cos(phi);
    target.z = 500 * Math.sin(phi) * Math.sin(theta);

    this.camera.lookAt(target);

    // Make hotspots always face the camera
    this.hotspots.forEach(({ mesh }) => {
      mesh.lookAt(this.camera.position);
    });

    this.renderer.render(this.scene, this.camera);
  }
}
