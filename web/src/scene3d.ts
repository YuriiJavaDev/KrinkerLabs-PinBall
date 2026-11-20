// @ts-nocheck
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from '../vendor/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/examples/jsm/postprocessing/OutputPass.js';
import { Sim, FIELD_W, FIELD_H } from './core';
import { playfieldTexture, woodTexture, backglassTexture, skyTexture } from './textures';

const S = 0.01;                                   // field unit -> world unit
const wx = (x: number) => x * S - FIELD_W * S / 2;
const wz = (y: number) => y * S - FIELD_H * S / 2;

function canvasTex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class View {
  renderer: any; scene = new THREE.Scene(); camera: any; composer: any; bloom: any;
  ball: any; flippers: any[] = []; bumpers: any[] = []; plunger: any; fireflies: any; backglassMat: any;
  shake = 0; time = 0; sim: Sim;

  constructor(private canvas: HTMLCanvasElement, sim: Sim) {
    this.sim = sim;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.85;

    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.35;
    const sky = canvasTex(skyTexture()); this.scene.background = sky;

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.buildLights(); this.buildTable(); this.buildDynamic(); this.buildFireflies();

    const size = r.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, type: THREE.HalfFloatType });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.35, 0.5, 0.92);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.resize();
  }

  private buildLights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0x9fb8ff, 0x2a1a10, 0.35));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.7);
    sun.position.set(-3, 12, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 10, bottom: -10, near: 1, far: 30 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4; s.add(sun);
    const p1 = new THREE.PointLight(0xff4fa0, 9, 7, 2); p1.position.set(-1.2, 1.2, -2.6); s.add(p1);
    const p2 = new THREE.PointLight(0x4fd0ff, 14, 8, 2); p2.position.set(2.2, 1.4, 0.8); s.add(p2);
    const p3 = new THREE.PointLight(0xffc860, 10, 7, 2); p3.position.set(0, 1.4, 5.2); s.add(p3);
    this.bumperLights = [p1, p2];
  }
  bumperLights: any[] = [];

  private buildTable() {
    const s = this.scene, t = this.sim.table;
    const pfTex = canvasTex(playfieldTexture());
    const field = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W * S, FIELD_H * S),
      new THREE.MeshPhysicalMaterial({ map: pfTex, roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 }));
    field.rotation.x = -Math.PI / 2; field.receiveShadow = true; s.add(field);

    const steel = new THREE.MeshStandardMaterial({ color: 0xaab2bb, metalness: 1, roughness: 0.3 });
    const plastic = new THREE.MeshPhysicalMaterial({ color: 0x0f2f4a, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0xff6a3a, roughness: 0.55, emissive: 0x6a1a00, emissiveIntensity: 0.6 });

    // wall rails
    for (const w of t.walls) {
      const ax = wx(w.ax), az = wz(w.ay), bx = wx(w.bx), bz = wz(w.by);
      const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
      const g = new THREE.Group(); g.position.set((ax + bx) / 2, 0, (az + bz) / 2); g.rotation.y = -ang;
      if (w.kick) {
        const rub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 10), rubber);
        rub.rotation.z = Math.PI / 2; rub.position.y = 0.2; rub.castShadow = true; g.add(rub);
      } else {
        const body = new THREE.Mesh(new THREE.BoxGeometry(len + 0.1, 0.42, 0.16), plastic); body.position.y = 0.21; body.castShadow = body.receiveShadow = true; g.add(body);
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, len + 0.08, 12), steel);
        rail.rotation.z = Math.PI / 2; rail.position.y = 0.46; rail.castShadow = true; g.add(rail);
      }
      s.add(g);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(w.kick ? 0.07 : 0.075, 12, 8), w.kick ? rubber : steel);
      ball.position.set(ax, w.kick ? 0.2 : 0.46, az); s.add(ball);
    }

    // slingshot plastic triangles
    const tri = (pts: number[][], col: number) => {
      const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(wx(x), -wz(y)) : sh.moveTo(wx(x), -wz(y)));
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, 0.02, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.3, clearcoat: 1, emissive: col, emissiveIntensity: 0.25 }));
      m.castShadow = m.receiveShadow = true; s.add(m);
    };
    tri([[158, 1052], [158, 1178], [236, 1246]], 0xff8a2a); tri([[657, 1052], [657, 1178], [579, 1246]], 0xff8a2a);

    // cabinet
    const wood = canvasTex(woodTexture()); wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(1, 3);
    const woodMat = new THREE.MeshPhysicalMaterial({ map: wood, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: any) => {
      const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; s.add(me); return me;
    };
    const W2 = FIELD_W * S / 2, H2 = FIELD_H * S / 2;
    box(0.5, 1.1, H2 * 2 + 0.7, -W2 - 0.25, 0.35, 0, woodMat); box(0.5, 1.1, H2 * 2 + 0.7, W2 + 0.25, 0.35, 0, woodMat);
    box(W2 * 2 + 1.0, 0.7, 0.5, 0, 0.15, H2 + 0.25, woodMat);
    box(0.12, 0.08, H2 * 2 + 0.7, -W2 - 0.5, 0.92, 0, steel); box(0.12, 0.08, H2 * 2 + 0.7, W2 + 0.5, 0.92, 0, steel);
    box(W2 * 2 + 1.0, 0.08, 0.12, 0, 0.52, H2 + 0.5, steel);
    box(W2 * 2 + 3.0, 0.2, H2 * 2 + 4, 0, -1.2, 0, new THREE.MeshStandardMaterial({ color: 0x0b0f1a, roughness: 0.9 }));

    // backbox with the backglass
    const bgTex = canvasTex(backglassTexture());
    this.backglassMat = new THREE.MeshStandardMaterial({ map: bgTex, emissiveMap: bgTex, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.2 });
    const bb = new THREE.Group(); bb.position.set(0, 0.5, -H2 - 0.1); bb.rotation.x = -0.12;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(W2 * 2 + 1.0, 3.8, 0.7), woodMat); frame.position.y = 1.9; frame.castShadow = true; bb.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2 + 0.1, 3.5), this.backglassMat); glass.position.set(0, 1.95, 0.36); bb.add(glass);
    s.add(bb);
  }

  private buildDynamic() {
    const s = this.scene, t = this.sim.table;

    // pop bumpers (mushrooms) and stones
    const prof = [[0.0, 0.0], [0.62, 0.0], [0.62, 0.06], [0.5, 0.16], [0.42, 0.34], [0.46, 0.5], [0.34, 0.62], [0.16, 0.68], [0, 0.69]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    for (const b of t.bumpers) {
      const g = new THREE.Group(); g.position.set(wx(b.x), 0, wz(b.y));
      if (b.kind === 'pop') {
        const sc = b.r * S / 0.55;
        const geo = new THREE.LatheGeometry(prof, 40);
        const mat = new THREE.MeshPhysicalMaterial({ color: 0xff5fa8, roughness: 0.25, clearcoat: 1, emissive: 0xff2f8a, emissiveIntensity: 0.22 });
        const body = new THREE.Mesh(geo, mat); body.scale.setScalar(sc); body.castShadow = body.receiveShadow = true; g.add(body);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58 * sc, 0.045, 10, 48), new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: 0.2 }));
        ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; g.add(ring);
        const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
        for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05 * sc, 8, 6), dotMat); const a = i * 1.047; d.position.set(Math.cos(a) * 0.3 * sc, 0.62 * sc, Math.sin(a) * 0.3 * sc); g.add(d); }
        this.bumpers.push({ b, g, mat, body, sc, kind: 'pop' });
      } else {
        const geo = new THREE.IcosahedronGeometry(b.r * S, 4), pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const n = Math.sin(x * 9 + y * 5) * Math.cos(z * 8 - y * 4) * 0.13 + Math.sin(x * 21 + z * 17) * 0.05 + Math.sin(x * 47 + y * 39 + z * 31) * 0.02;
          const l = Math.hypot(x, y, z), f = 1 + n, up = y / l > 0.35;
          pos.setXYZ(i, x * f * 1.05, Math.max(y * f * 1.0, -0.02) * 1.15 + 0.1, z * f * 1.05);
          const m = up ? 0.55 + n : 0.5 + n; col[i * 3] = up ? 0.12 : m * 0.42; col[i * 3 + 1] = up ? 0.3 + n * 1.5 : m * 0.4; col[i * 3 + 2] = up ? 0.1 : m * 0.45;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
        mesh.castShadow = mesh.receiveShadow = true; g.add(mesh);
        this.bumpers.push({ b, g, mat: mesh.material, body: mesh, sc: 1, kind: 'stone' });
      }
      s.add(g);
    }

    // flippers
    const fl = new THREE.MeshPhysicalMaterial({ color: 0xff7a3d, roughness: 0.35, clearcoat: 1, emissive: 0x7a2000, emissiveIntensity: 0.45 });
    for (const f of this.sim.table.flippers) {
      const L = f.length * S, R0 = 0.17, R1 = 0.12, sh = new THREE.Shape();
      sh.absarc(0, 0, R0, Math.PI / 2, -Math.PI / 2, false);
      sh.lineTo(L, -R1); sh.absarc(L, 0, R1, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, R0);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04, bevelSegments: 4, curveSegments: 20 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, 0.04, 0);
      const g = new THREE.Group(); g.position.set(wx(f.px), 0, wz(f.py));
      const m = new THREE.Mesh(geo, fl); m.castShadow = m.receiveShadow = true; g.add(m);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: 0.2 }));
      cap.position.y = 0.27; g.add(cap);
      s.add(g); this.flippers.push(g);
    }

    // ball
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(this.sim.table.ballRadius * S, 48, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08, envMapIntensity: 1.6 }));
    this.ball.castShadow = true; s.add(this.ball);

    // plunger
    const pg = new THREE.Group(); pg.position.set(wx(817), 0, wz(1540));
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 1, roughness: 0.25 }));
    rod.rotation.x = Math.PI / 2; rod.position.set(0, 0.22, 0.6); pg.add(rod);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xd33a2a, roughness: 0.3, clearcoat: 1 }));
    knob.position.set(0, 0.22, 1.25); pg.add(knob);
    s.add(pg); this.plunger = pg;
  }

  private buildFireflies() {
    const n = 90, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 8; pos[i * 3 + 1] = 0.6 + Math.random() * 1.6; pos[i * 3 + 2] = (Math.random() - 0.5) * 14; seed[i] = Math.random() * 6.28; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), rg = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,250,170,1)'); rg.addColorStop(0.3, 'rgba(255,230,120,0.5)'); rg.addColorStop(1, 'rgba(255,230,120,0)'); x.fillStyle = rg; x.fillRect(0, 0, 32, 32);
    this.fireflies = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.28, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    this.fireflies.userData = { base: pos.slice(), seed }; this.scene.add(this.fireflies);
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    // fit the whole table in view
    const fov = THREE.MathUtils.degToRad(this.camera.fov), aspect = w / h;
    const elev = THREE.MathUtils.degToRad(aspect < 0.8 ? 66 : 58);
    const needV = 20.5 / 2 / Math.tan(fov / 2), needH = 11.2 / 2 / (Math.tan(fov / 2) * aspect);
    this.camDist = Math.max(needV * 0.8, needH);
    this.camElev = elev;
  }
  camDist = 22; camElev = 1;

  nudgeShake(dir: number) { this.shake = 1; this.shakeDir = dir; }
  shakeDir = 0;

  render(dt: number, charge: number) {
    this.time += dt; const sim = this.sim, ball = sim.ball;
    this.ball.visible = ball.alive; this.ball.position.set(wx(ball.x), ball.r * S, wz(ball.y));
    sim.table.flippers.forEach((f, i) => { this.flippers[i].rotation.y = -f.angle; });
    for (const o of this.bumpers) {
      const f = Math.min(1, o.b.flash / 0.18);
      if (o.kind === 'pop') { o.mat.emissiveIntensity = 0.22 + f * 2.4; const s = o.sc * (1 + f * 0.12); o.body.scale.set(s, o.sc * (1 - f * 0.08), s); }
    }
    const pull = charge * 0.55; this.plunger.position.z = wz(1540) + pull;
    this.bumperLights[0].intensity = 9 + Math.sin(this.time * 2) * 1.5;
    // fireflies
    const p = this.fireflies.geometry.attributes.position, d = this.fireflies.userData;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, d.base[i * 3] + Math.sin(this.time * 0.5 + d.seed[i]) * 0.5, d.base[i * 3 + 1] + Math.sin(this.time * 0.9 + d.seed[i] * 2) * 0.25, d.base[i * 3 + 2] + Math.cos(this.time * 0.4 + d.seed[i]) * 0.5);
    }
    p.needsUpdate = true;
    this.fireflies.material.opacity = 0.55 + 0.25 * Math.sin(this.time * 1.7);
    // camera
    this.shake = Math.max(0, this.shake - dt * 5);
    const sx = Math.sin(this.time * 90) * 0.05 * this.shake + this.shakeDir * this.shake * 0.12;
    const cx = THREE.MathUtils.clamp(wx(ball.x) * 0.06, -0.3, 0.3);
    const cy = Math.sin(this.camElev) * this.camDist, cz = Math.cos(this.camElev) * this.camDist + 0.8;
    this.camera.position.set(cx + sx, cy, cz);
    this.camera.lookAt(cx * 0.5 + sx, 0.4, 0.8);
    this.bloom.strength = 0.35 + (sim.tilted ? 0.2 : 0);
    this.composer.render();
  }
}
