import * as THREE from './three.module.js';

/**
 * Vault3D: Interactive Three.js 3D Zero-Trust Email Gateway Simulation
 * Models the core value proposition of Mailgrant:
 * 1. 3D Mail Envelopes fly from sender towards the Mailgrant Edge Gateway.
 * 2. Authorized emails (Claude 2FA, Notion) get scanned by a laser beam.
 * 3. The 3D envelope flap opens, extracting only the glowing 6-digit OTP code or link.
 * 4. Unauthorized emails (Chase Bank, Personal) hit a crimson holographic forcefield and bounce off.
 */
export class Vault3D {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.width = container.clientWidth || 560;
    this.height = container.clientHeight || 460;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.clock = new THREE.Clock();
    this.reqId = null;

    // Scene Groups
    this.mainGroup = null;
    this.gatewayGroup = null;
    this.envelopes = {};
    this.activeScenario = 'claude';
    this.scenarioTimer = 0;
    this.autoCycle = true;
    this.autoCycleDelay = 6.0; // Auto-advance every 6 seconds if user is idle

    // Gateway Elements
    this.coreCrystal = null;
    this.gimbalRings = [];
    this.scanBeam = null;
    this.forcefield = null;
    this.particles = null;
    this.codeToken = null;

    // Interaction State
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.targetRotX = 0.15;
    this.targetRotY = -0.2;
    this.currentRotX = 0.15;
    this.currentRotY = -0.2;
    this.mouseParallaxX = 0;
    this.mouseParallaxY = 0;

    // Animation progress
    this.animProgress = 0;
    this.isDeflecting = false;
    this.deflectProgress = 0;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 1.2, 9.2);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLighting();

    // 5. Build 3D Models
    this.mainGroup = new THREE.Group();
    this.scene.add(this.mainGroup);

    this.buildGateway();
    this.buildEnvelopes();
    this.buildCodeToken();
    this.buildParticles();

    // 6. Bind User Controls (Drag, Parallax, Click)
    this.bindEvents();

    // 7. Start Scenario
    this.playScenario('claude');

    // 8. Start Loop
    this.animate();
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    // Primary Azure Cyber Light
    const dirBlue = new THREE.DirectionalLight(0x3b82f6, 3.5);
    dirBlue.position.set(6, 8, 8);
    this.scene.add(dirBlue);

    // Emerald Edge Light
    const dirGreen = new THREE.DirectionalLight(0x10b981, 2.5);
    dirGreen.position.set(-6, -4, -4);
    this.scene.add(dirGreen);

    // Central Core Point Light
    this.coreLight = new THREE.PointLight(0x60a5fa, 4, 12);
    this.coreLight.position.set(0, 0, 1);
    this.scene.add(this.coreLight);

    // Dynamic Scanning Light
    this.scanLight = new THREE.PointLight(0x38bdf8, 0, 8);
    this.scanLight.position.set(0, 0, 1.5);
    this.scene.add(this.scanLight);
  }

  // Build the Central Cryptographic Mail Gateway
  buildGateway() {
    this.gatewayGroup = new THREE.Group();
    this.mainGroup.add(this.gatewayGroup);

    // 1. Gateway Outer Hexagonal Arch / Portal
    const hexGeom = new THREE.TorusGeometry(2.2, 0.06, 16, 6);
    const hexMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
      metalness: 0.85,
      roughness: 0.2
    });
    const hexPortal = new THREE.Mesh(hexGeom, hexMat);
    hexPortal.rotation.z = Math.PI / 6;
    this.gatewayGroup.add(hexPortal);

    // 2. Gimbal Security Rings
    const ringRadii = [1.8, 1.5];
    const ringColors = [0x38bdf8, 0x10b981];

    ringRadii.forEach((r, idx) => {
      const rGeom = new THREE.TorusGeometry(r, 0.03, 16, 64);
      const rMat = new THREE.MeshStandardMaterial({
        color: ringColors[idx],
        emissive: ringColors[idx],
        emissiveIntensity: 0.7,
        metalness: 0.9,
        roughness: 0.1
      });
      const ringMesh = new THREE.Mesh(rGeom, rMat);
      ringMesh.rotation.x = (idx + 1) * 0.7;
      ringMesh.rotation.y = (idx + 1) * 0.5;
      this.gimbalRings.push({ mesh: ringMesh, speed: (idx % 2 === 0 ? 1 : -1) * (0.6 + idx * 0.2) });
      this.gatewayGroup.add(ringMesh);
    });

    // 3. Central Cryptographic Crystal / Core
    const crystalGeom = new THREE.OctahedronGeometry(0.7, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e40af,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.5,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1.0
    });
    this.coreCrystal = new THREE.Mesh(crystalGeom, crystalMat);
    this.gatewayGroup.add(this.coreCrystal);

    // 4. Wireframe Cage around crystal
    const cageGeom = new THREE.IcosahedronGeometry(1.0, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const cage = new THREE.Mesh(cageGeom, cageMat);
    this.gatewayGroup.add(cage);

    // 5. Laser Scanning Beam (Sweeps vertically when email is evaluated)
    const beamGeom = new THREE.CylinderGeometry(2.0, 2.0, 0.04, 32);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.scanBeam = new THREE.Mesh(beamGeom, beamMat);
    this.scanBeam.rotation.x = Math.PI / 2;
    this.gatewayGroup.add(this.scanBeam);

    // 6. Crimson Forcefield Shield (Activates when blocked email approaches)
    const shieldGeom = new THREE.SphereGeometry(2.2, 32, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
      roughness: 0.3
    });
    this.forcefield = new THREE.Mesh(shieldGeom, shieldMat);
    this.gatewayGroup.add(this.forcefield);
  }

  // Create a 3D Envelope Mesh with a hinged opening flap and vendor badge
  createEnvelopeMesh(vendor, colorHex, badgeText) {
    const group = new THREE.Group();

    // 1. Envelope Body (Beveled box)
    const bodyGeom = new THREE.BoxGeometry(1.6, 1.05, 0.06);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x0f172a,
      emissiveIntensity: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(bodyMesh);

    // 2. Envelope Front Trim / Edges
    const trimGeom = new THREE.EdgesGeometry(bodyGeom);
    const trimMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.75
    });
    const trim = new THREE.LineSegments(trimGeom, trimMat);
    group.add(trim);

    // 3. Hinged Triangular Flap
    // Triangle points
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-0.78, 0);
    flapShape.lineTo(0.78, 0);
    flapShape.lineTo(0, -0.55);
    flapShape.closePath();

    const flapGeom = new THREE.ShapeGeometry(flapShape);
    const flapMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.25,
      side: THREE.DoubleSide
    });
    const flapMesh = new THREE.Mesh(flapGeom, flapMat);
    // Position at top edge of envelope
    flapMesh.position.set(0, 0.52, 0.035);

    // Flap Pivot Group so it rotates outward cleanly
    const flapPivot = new THREE.Group();
    flapPivot.position.set(0, 0.52, 0.035);
    flapMesh.position.set(0, 0, 0);
    flapPivot.add(flapMesh);
    group.add(flapPivot);

    // 4. Vendor Badge Texture
    const badgeTexture = this.makeBadgeTexture(badgeText, colorHex);
    const badgeMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
    const badgeSprite = new THREE.Sprite(badgeMat);
    badgeSprite.scale.set(1.4, 0.42, 1);
    badgeSprite.position.set(0, -0.05, 0.06);
    group.add(badgeSprite);

    // 5. Vendor Logo / Stamp Cylinder
    const sealGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24);
    const sealMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2
    });
    const sealMesh = new THREE.Mesh(sealGeom, sealMat);
    sealMesh.rotation.x = Math.PI / 2;
    sealMesh.position.set(0, 0.15, 0.05);
    group.add(sealMesh);

    return {
      group,
      flapPivot,
      bodyMesh,
      trim,
      sealMesh,
      vendor,
      colorHex
    };
  }

  makeBadgeTexture(label, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Dark pill container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 72, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Label Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 40);

    return new THREE.CanvasTexture(canvas);
  }

  buildEnvelopes() {
    // 1. Claude 2FA (Allowed - Extracts OTP)
    this.envelopes.claude = this.createEnvelopeMesh('claude', 0x38bdf8, 'Claude 2FA');
    this.mainGroup.add(this.envelopes.claude.group);

    // 2. Notion Magic Link (Allowed - Extracts URL)
    this.envelopes.notion = this.createEnvelopeMesh('notion', 0x10b981, 'Notion Login');
    this.mainGroup.add(this.envelopes.notion.group);

    // 3. Chase Bank (Personal - Strictly Blocked)
    this.envelopes.chase = this.createEnvelopeMesh('chase', 0xef4444, 'Chase Banking');
    this.mainGroup.add(this.envelopes.chase.group);

    // Hide all initially
    Object.values(this.envelopes).forEach(env => {
      env.group.visible = false;
    });
  }

  // Floating 3D OTP Code Token that emerges from the scanned envelope
  buildCodeToken() {
    const group = new THREE.Group();

    // 1. Token Plate
    const plateGeom = new THREE.BoxGeometry(1.5, 0.65, 0.08);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    group.add(plate);

    // 2. Golden / Cyan Glowing Border
    const borderGeom = new THREE.EdgesGeometry(plateGeom);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
    const border = new THREE.LineSegments(borderGeom, borderMat);
    group.add(border);

    // 3. OTP Code Canvas Sprite (849 201)
    const tokenCanvas = document.createElement('canvas');
    tokenCanvas.width = 256;
    tokenCanvas.height = 100;
    const ctx = tokenCanvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 100);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('849 201', 128, 50);

    const tokenTex = new THREE.CanvasTexture(tokenCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tokenTex, transparent: true });
    this.tokenSprite = new THREE.Sprite(spriteMat);
    this.tokenSprite.scale.set(1.4, 0.55, 1);
    this.tokenSprite.position.set(0, 0, 0.06);
    group.add(this.tokenSprite);

    group.visible = false;
    this.codeToken = group;
    this.mainGroup.add(group);
  }

  // Particle cloud simulating data flow
  buildParticles() {
    const count = 280;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color(0x38bdf8);
    const c2 = new THREE.Color(0x10b981);
    const c3 = new THREE.Color(0x818cf8);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 2.4 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const picked = Math.random() < 0.5 ? c1 : Math.random() < 0.8 ? c2 : c3;
      colors[i3] = picked.r;
      colors[i3 + 1] = picked.g;
      colors[i3 + 2] = picked.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });

    this.particles = new THREE.Points(geom, mat);
    this.scene.add(this.particles);
  }

  // Play a specific interactive scenario
  playScenario(name) {
    this.activeScenario = name;
    this.animProgress = 0;
    this.scenarioTimer = 0;

    // Reset all envelopes
    Object.keys(this.envelopes).forEach(k => {
      const env = this.envelopes[k];
      env.group.visible = (k === name);
      env.group.scale.set(1, 1, 1);
      env.flapPivot.rotation.x = 0; // Closed
      env.bodyMesh.material.opacity = 1.0;
      env.bodyMesh.material.transparent = false;
    });

    if (this.codeToken) {
      this.codeToken.visible = false;
      this.codeToken.scale.set(0.1, 0.1, 0.1);
    }

    if (this.scanBeam) {
      this.scanBeam.material.opacity = 0;
    }

    if (this.forcefield) {
      this.forcefield.material.opacity = 0;
    }

    // Position starting envelope on the left (Inbound Gmail)
    if (this.envelopes[name]) {
      this.envelopes[name].group.position.set(-4.5, 0.4, -0.5);
      this.envelopes[name].group.rotation.set(0.1, 0.4, -0.1);
    }

    // Update Telemetry HUD if present
    this.updateHUD(name);
  }

  updateHUD(name) {
    const hudStatus = document.querySelector('#vault-hud-status');
    const hudRule = document.querySelector('#vault-hud-rule');
    const hudResult = document.querySelector('#vault-hud-result');

    if (!hudStatus) return;

    if (name === 'claude') {
      hudStatus.textContent = 'INBOUND: *@mail.anthropic.com';
      hudRule.textContent = 'RULE: Match -> Extract OTP Code Only';
      hudResult.innerHTML = '<span class="hud-green">✓ Extracted: 849 201 (Body Stripped)</span>';
    } else if (name === 'notion') {
      hudStatus.textContent = 'INBOUND: team@m.notion.so';
      hudRule.textContent = 'RULE: Match -> Extract Magic Link';
      hudResult.innerHTML = '<span class="hud-green">✓ Approved: notion.so/login/token (Body Stripped)</span>';
    } else if (name === 'chase') {
      hudStatus.textContent = 'INBOUND: service@chase.com (Personal)';
      hudRule.textContent = 'RULE: No Whitelist Match Found';
      hudResult.innerHTML = '<span class="hud-red">🚫 403 BLOCKED AT EDGE (0% Exposure)</span>';
    } else if (name === 'revoke') {
      hudStatus.textContent = 'KEY REVOKED BY OWNER';
      hudRule.textContent = 'RULE: Invalidate All Active Sessions';
      hudResult.innerHTML = '<span class="hud-red">🔒 Access Key mgk_... Terminated</span>';
    }
  }

  triggerSimulation() {
    // Cycle to next scenario
    const seq = ['claude', 'notion', 'chase'];
    const curIdx = seq.indexOf(this.activeScenario);
    const nextScenario = seq[(curIdx + 1) % seq.length];
    this.playScenario(nextScenario);
  }

  bindEvents() {
    const el = this.container;

    // Mouse drag for rotation
    el.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.autoCycle = false; // pause auto cycle when user interacts
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      this.mouse.x = x;
      this.mouse.y = y;

      if (this.isDragging) {
        const dx = e.clientX - this.prevMousePos.x;
        const dy = e.clientY - this.prevMousePos.y;
        this.targetRotY += dx * 0.007;
        this.targetRotX += dy * 0.007;
        this.prevMousePos = { x: e.clientX, y: e.clientY };
      } else {
        this.mouseParallaxX = x * 0.25;
        this.mouseParallaxY = y * 0.2;
      }
    });

    // Touch support for mobile
    el.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoCycle = false;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (this.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - this.prevMousePos.x;
        const dy = e.touches[0].clientY - this.prevMousePos.y;
        this.targetRotY += dx * 0.007;
        this.targetRotX += dy * 0.007;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight || 460;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
  }

  animate() {
    this.reqId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Auto Cycle between scenarios if idle
    if (this.autoCycle) {
      this.scenarioTimer += delta;
      if (this.scenarioTimer > this.autoCycleDelay) {
        this.scenarioTimer = 0;
        const seq = ['claude', 'notion', 'chase'];
        const curIdx = seq.indexOf(this.activeScenario);
        const nextScenario = seq[(curIdx + 1) % seq.length];
        this.playScenario(nextScenario);
      }
    }

    // 2. Camera & Group Damping
    const autoRot = Math.sin(elapsedTime * 0.4) * 0.05;
    const destX = this.targetRotX + this.mouseParallaxY;
    const destY = this.targetRotY + this.mouseParallaxX + autoRot;

    this.currentRotX += (destX - this.currentRotX) * 0.08;
    this.currentRotY += (destY - this.currentRotY) * 0.08;

    this.mainGroup.rotation.x = this.currentRotX;
    this.mainGroup.rotation.y = this.currentRotY;

    // 3. Gimbal Rings Rotation
    this.gimbalRings.forEach(r => {
      r.mesh.rotation.z += r.speed * delta;
      r.mesh.rotation.y += (r.speed * 0.4) * delta;
    });

    // 4. Central Crystal Pulsation
    const crystalScale = 1.0 + Math.sin(elapsedTime * 3) * 0.06;
    this.coreCrystal.scale.set(crystalScale, crystalScale, crystalScale);
    this.coreCrystal.rotation.y = elapsedTime * 0.8;
    this.coreCrystal.rotation.x = Math.sin(elapsedTime * 0.5) * 0.3;

    // 5. Particles Drift
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.04;
    }

    // 6. SCENARIO ANIMATION LOGIC
    this.updateScenarioAnimation(delta, elapsedTime);

    this.renderer.render(this.scene, this.camera);
  }

  updateScenarioAnimation(delta, elapsedTime) {
    this.animProgress += delta * 0.85; // progress runs roughly 0 -> 4 over 4.5s
    const p = this.animProgress;

    // Active Envelope
    const env = this.envelopes[this.activeScenario];

    if (this.activeScenario === 'claude' || this.activeScenario === 'notion') {
      // PHASE 1: Flight from inbound left to gateway center (0 -> 1.2)
      if (p <= 1.2) {
        const t = Math.min(1, p / 1.2);
        // Smooth easing
        const ease = 0.5 - Math.cos(t * Math.PI) / 2;
        env.group.position.x = -4.5 + ease * 4.5; // reaches x=0
        env.group.position.y = 0.4 - ease * 0.4; // reaches y=0
        env.group.position.z = -0.5 + ease * 0.5; // reaches z=0
        env.group.rotation.y = 0.4 - ease * 0.4;
      }

      // PHASE 2: Laser Scan & Flap Opens (1.2 -> 2.2)
      if (p > 1.2 && p <= 2.2) {
        const scanT = (p - 1.2) / 1.0;
        // Oscillate laser beam vertically
        this.scanBeam.material.opacity = Math.sin(scanT * Math.PI) * 0.8;
        this.scanBeam.position.y = Math.sin(scanT * Math.PI * 2) * 1.0;
        this.scanLight.intensity = Math.sin(scanT * Math.PI) * 5;

        // Open flap
        env.flapPivot.rotation.x = -scanT * Math.PI * 0.75;
      }

      // PHASE 3: Code Token floats out & Envelope Body Stripped (2.2 -> 4.0)
      if (p > 2.2) {
        const extractT = Math.min(1, (p - 2.2) / 1.5);
        const easeEx = 0.5 - Math.cos(extractT * Math.PI) / 2;

        // Code token appears and slides forward toward recipient
        this.codeToken.visible = true;
        const scale = Math.min(1, extractT * 1.2);
        this.codeToken.scale.set(scale, scale, scale);
        this.codeToken.position.set(0, 0.2 + Math.sin(elapsedTime * 3) * 0.05, 0.4 + easeEx * 2.2);

        // Envelope dissolves (demonstrating body is discarded)
        env.bodyMesh.material.transparent = true;
        env.bodyMesh.material.opacity = Math.max(0.15, 1.0 - easeEx * 0.85);
        env.trim.material.opacity = Math.max(0.2, 1.0 - easeEx * 0.8);
      }
    } else if (this.activeScenario === 'chase') {
      // CHASE BANK (BLOCKED): Envelope approaches but gets violently deflected
      // PHASE 1: Approach gateway (0 -> 1.0)
      if (p <= 1.0) {
        const t = p / 1.0;
        const ease = 0.5 - Math.cos(t * Math.PI) / 2;
        env.group.position.x = -4.5 + ease * 3.2; // stops at x=-1.3 (hits shield)
        env.group.position.y = 0.3;
        env.group.position.z = 0;
      }

      // PHASE 2: Crimson Forcefield powers up & defelects envelope (1.0 -> 2.5)
      if (p > 1.0 && p <= 2.5) {
        const shieldT = (p - 1.0) / 1.5;
        // Forcefield flash
        this.forcefield.material.opacity = Math.sin(shieldT * Math.PI) * 0.65;
        this.forcefield.scale.setScalar(1.0 + Math.sin(shieldT * Math.PI) * 0.15);

        // Envelope ricochets backwards and tumbles
        const bounce = Math.sin(shieldT * Math.PI);
        env.group.position.x = -1.3 - bounce * 2.5;
        env.group.position.y = 0.3 + bounce * 1.0;
        env.group.rotation.z = bounce * 1.5;
        env.group.rotation.x = bounce * 0.8;
      }

      // PHASE 3: Rejection state sustained
      if (p > 2.5) {
        this.forcefield.material.opacity = 0;
        env.group.position.set(-3.8, 1.2, 0);
      }
    }
  }

  destroy() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}
