// @ts-nocheck
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from '../vendor/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/examples/jsm/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from '../vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildRoom, FLOOR } from './room';
import { Sim, FIELD_W, FIELD_H } from './core';
import { playfieldTexture, woodTexture, backglassTexture, skyTexture, brickTexture, floorTexture, frontTexture } from './textures';

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
    this.scene.environment = pm.fromScene(this.studioEnv(), 0.02).texture;
    this.scene.environmentIntensity = 0.35;
    const sky = canvasTex(skyTexture()); this.scene.background = sky;

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.buildLights(); this.buildTable(); this.buildDynamic(); this.buildFireflies(); this.attachOrbit();

    const size = r.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, type: THREE.HalfFloatType });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.35, 0.5, 0.92);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.resize();
  }

  /** Reflection environment: a dark room with coloured softboxes, so lacquer and chrome get long highlights. */
  private studioEnv() {
    const e = new THREE.Scene(); e.background = new THREE.Color(0.02, 0.025, 0.04);
    const panel = (x: number, y: number, z: number, w: number, h: number, d: number, c: number[]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0], c[1], c[2]) }));
      m.position.set(x, y, z); e.add(m);
    };
    panel(0, 9, 0, 12, 0.3, 7, [7, 6.4, 5.6]); panel(-9, 3, 2, 0.3, 5, 8, [1.4, 3, 7]); panel(9, 3, -2, 0.3, 5, 8, [7, 2.2, 3.6]);
    panel(0, 3, 11, 9, 4, 0.3, [4.5, 3.8, 2.6]); panel(0, 3, -11, 12, 5, 0.3, [1, 1.6, 3.5]); panel(-4, 6, -6, 3, 0.3, 3, [5, 5, 6]);
    return e;
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
    const pfTex = canvasTex(playfieldTexture(t, (matchMedia('(pointer: coarse)').matches || window.innerWidth < 700) ? 1024 : 2048));
    const field = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W * S, FIELD_H * S),
      new THREE.MeshPhysicalMaterial({ map: pfTex, roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 }));
    field.rotation.x = -Math.PI / 2; field.receiveShadow = true; s.add(field);

    const steel = new THREE.MeshStandardMaterial({ color: 0xaab2bb, metalness: 1, roughness: 0.3 });
    const plastic = new THREE.MeshPhysicalMaterial({ color: 0x0f2f4a, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0xff6a3a, roughness: 0.55, emissive: 0x6a1a00, emissiveIntensity: 0.6 });

    // the big arc: one smooth chrome tube
    const arcPts: any[] = []; t.walls.slice(0, 28).forEach((w, i) => { arcPts.push(new THREE.Vector3(wx(w.ax), 0.46, wz(w.ay))); if (i === 27) arcPts.push(new THREE.Vector3(wx(w.bx), 0.46, wz(w.by))); });
    const arcTube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 160, 0.085, 14), steel); arcTube.castShadow = true; s.add(arcTube);
    // wall rails
    for (const [wi, w] of t.walls.entries()) {
      const ax = wx(w.ax), az = wz(w.ay), bx = wx(w.bx), bz = wz(w.by);
      const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
      const g = new THREE.Group(); g.position.set((ax + bx) / 2, 0, (az + bz) / 2); g.rotation.y = -ang;
      if (w.kick) {
        const rub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 10), rubber);
        rub.rotation.z = Math.PI / 2; rub.position.y = 0.2; rub.castShadow = true; g.add(rub);
      } else {
        const body = new THREE.Mesh(new THREE.BoxGeometry(len + 0.1, 0.42, 0.16), plastic); body.position.y = 0.21; body.castShadow = body.receiveShadow = true; g.add(body);
        if (wi >= 28) { const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, len + 0.08, 14), steel);
        rail.rotation.z = Math.PI / 2; rail.position.y = 0.46; rail.castShadow = true; g.add(rail); }
      }
      s.add(g);
      if (wi >= 28) { const post = new THREE.Mesh(new THREE.SphereGeometry(w.kick ? 0.07 : 0.088, 14, 10), w.kick ? rubber : steel);
      post.position.set(ax, w.kick ? 0.2 : 0.46, az); s.add(post); }
    }

    // slingshot plastic triangles
    const tri = (pts: number[][], col: number) => {
      const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(wx(x), -wz(y)) : sh.moveTo(wx(x), -wz(y)));
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, 0.02, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.25, clearcoat: 1, emissive: col, emissiveIntensity: 0.18 }));
      m.castShadow = m.receiveShadow = true; s.add(m);
    };
    tri([[158, 1052], [158, 1178], [236, 1246]], 0x1b4f8a); tri([[657, 1052], [657, 1178], [579, 1246]], 0x1b4f8a);

    buildRoom(this.scene);
    // cabinet
    const wood = canvasTex(woodTexture()); wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(1, 3);
    const woodMat = new THREE.MeshPhysicalMaterial({ map: wood, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: any, shadow = true) => {
      const me = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = shadow; s.add(me); return me;
    };
    const W2 = FIELD_W * S / 2, H2 = FIELD_H * S / 2, FRONT = H2 + 0.85, TOP = 0.9, BOT = -2.6, LEN = FRONT * 2;
    // cabinet: two side panels full length, front and back panels flush with their ends, a base board under everything; all edges rounded
    for (const sx of [-1, 1]) {
      rbox(0.5, TOP - BOT, LEN, 0.2, sx * (W2 + 0.25), (TOP + BOT) / 2, 0, woodMat);
      rbox(0.6, 0.1, LEN - 0.1, 0.045, sx * (W2 + 0.25), TOP + 0.04, 0, steel);                 // chrome cap rail sits exactly on top of the panel
    }
    rbox(W2 * 2 + 1.0, 0.3 + 0.1, LEN, 0.15, 0, BOT + 0.2, 0, woodMat);                              // base board
    rbox(W2 * 2 + 1.0, 0.5 - BOT, 0.85, 0.2, 0, (0.5 + BOT) / 2, H2 + 0.425, woodMat);                // front panel (lower than the sides so the field is visible)
    rbox(W2 * 2 + 1.0, TOP - BOT, 0.85, 0.2, 0, (TOP + BOT) / 2, -H2 - 0.425, woodMat);               // back panel
    rbox(W2 * 2, 0.16, 0.34, 0.07, 0, 0.56, H2 + 0.5, steel);                                           // lockdown bar along the top of the front panel
    const frontTex = canvasTex(frontTexture());
    const front = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2 + 0.3, 1.75), new THREE.MeshPhysicalMaterial({ map: frontTex, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 }));
    front.position.set(0, -0.62, FRONT + 0.002); s.add(front);
    // legs: bolted under the side panels with a mounting plate, tapered, with rubber feet
    const legMat = new THREE.MeshStandardMaterial({ color: 0xc9d0d8, metalness: 1, roughness: 0.25 });
    const legLen = BOT - FLOOR - 0.1;
    for (const lx of [-W2 - 0.25, W2 + 0.25]) for (const lz of [-H2 + 0.2, H2 - 0.2]) {
      rbox(0.9, 0.14, 0.9, 0.05, lx, BOT - 0.02, lz, legMat);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, legLen, 28), legMat); leg.position.set(lx, BOT - 0.09 - legLen / 2, lz); leg.castShadow = true; s.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.14, 28), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })); foot.position.set(lx, FLOOR + 0.07, lz); s.add(foot);
    }
    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2, H2 * 2),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.03, roughness: 0.02, metalness: 0, envMapIntensity: 2.2, depthWrite: false, clearcoat: 1 }));
    glassPane.rotation.x = -Math.PI / 2; glassPane.position.y = 1.0; glassPane.renderOrder = 5; s.add(glassPane);
    // plunger: collar where the rod leaves the front panel
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 24), steel); collar.rotation.x = Math.PI / 2; collar.position.set(wx(817), 0.22, FRONT + 0.1); s.add(collar);

    // backbox with the backglass: sits on the back panel, flush with its rear edge
    const bgTex = canvasTex(backglassTexture());
    this.backglassMat = new THREE.MeshStandardMaterial({ map: bgTex, emissiveMap: bgTex, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.2 });
    const bb = new THREE.Group(); bb.position.set(0, TOP, -H2 - 0.45); bb.rotation.x = -0.08;
    const frame = new THREE.Mesh(new RoundedBoxGeometry(W2 * 2 + 1.0, 3.8, 0.8, 5, 0.18), woodMat); frame.position.y = 1.9; frame.castShadow = true; bb.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2 + 0.1, 3.4), this.backglassMat); glass.position.set(0, 1.95, 0.405); bb.add(glass);
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
    const fl = new THREE.MeshPhysicalMaterial({ color: 0xe8451f, roughness: 0.3, clearcoat: 1, emissive: 0x501000, emissiveIntensity: 0.3 });
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

    this.buildFeatures();

    // ball
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(this.sim.table.ballRadius * S, 48, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08, envMapIntensity: 1.6 }));
    this.ball.castShadow = true; s.add(this.ball);

    // plunger
    const pg = new THREE.Group(); pg.position.set(wx(817), 0, wz(1540));
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 1, roughness: 0.25 }));
    rod.rotation.x = Math.PI / 2; rod.position.set(0, 0.22, 1.25); rod.scale.y = 2.1; pg.add(rod);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xd33a2a, roughness: 0.3, clearcoat: 1 }));
    knob.position.set(0, 0.22, 2.45); pg.add(knob);
    s.add(pg); this.plunger = pg;
  }

  inserts: any[] = []; dropMeshes: any[] = []; standMeshes: any[] = []; spinners: any[] = []; saucerObjs: any[] = []; stars: any[] = [];
  private insertMat(col: number) { return new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.1, roughness: 0.25, metalness: 0 }); }

  /** Lanes, stars, targets, saucer, spinner and props: the classic furniture of a pinball table. */
  private buildFeatures() {
    const s = this.scene, t = this.sim.table;
    const steel = new THREE.MeshStandardMaterial({ color: 0xaab2bb, metalness: 1, roughness: 0.28 });
    // rollover lane lights
    for (const n of t.sensors) if (n.kind === 'lane') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 32), this.insertMat(0x7affc6)); m.position.set(wx(n.x), 0.02, wz(n.y)); s.add(m); this.inserts.push({ n, m });
    }
    // star lights above the flippers, lit by progress
    const starShape = (r: number) => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? sh.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); } return sh; };
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.ExtrudeGeometry(starShape(0.3), { depth: 0.03, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, this.insertMat(i % 2 ? 0xffd34d : 0xff7ab6)); m.position.set(wx(230 + i * 105), 0.02, wz(1010 + (i % 2 ? 36 : 0))); s.add(m); this.stars.push(m);
    }
    // drop targets and standup targets
    for (const tg of t.targets) {
      const len = Math.hypot(tg.bx - tg.ax, tg.by - tg.ay) * S, drop = tg.kind === 'drop';
      const mat = new THREE.MeshPhysicalMaterial({ color: drop ? 0xffc83a : 0x4fd8ff, roughness: 0.25, clearcoat: 1, emissive: drop ? 0xff9a00 : 0x00a0ff, emissiveIntensity: 0.25 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, len), mat); m.castShadow = true;
      m.position.set(wx((tg.ax + tg.bx) / 2), 0.25, wz((tg.ay + tg.by) / 2)); s.add(m);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, len + 0.1), steel); base.position.set(m.position.x, 0.03, m.position.z); s.add(base);
      (drop ? this.dropMeshes : this.standMeshes).push({ tg, m, mat });
    }
    // saucer: a dark pit with a chrome rim and a glow
    for (const u of t.saucers) {
      const g = new THREE.Group(); g.position.set(wx(u.x), 0, wz(u.y));
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.06, 14, 40), steel); rim.rotation.x = Math.PI / 2; rim.position.y = 0.06; g.add(rim);
      const pit = new THREE.Mesh(new THREE.CircleGeometry(0.31, 32), new THREE.MeshBasicMaterial({ color: 0x010306 })); pit.rotation.x = -Math.PI / 2; pit.position.y = 0.03; g.add(pit);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0 }); const glow = new THREE.Mesh(new THREE.CircleGeometry(0.31, 32), glowMat); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.04; g.add(glow);
      const light = new THREE.PointLight(0x66ddff, 0, 4, 2); light.position.y = 0.6; g.add(light);
      s.add(g); this.saucerObjs.push({ u, glowMat, light });
    }
    // spinner
    for (const n of t.sensors) if (n.kind === 'spinner') {
      const g = new THREE.Group(); g.position.set(wx(n.x), 0.55, wz(n.y));
      for (const sx of [-0.42, 0.42]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10), steel); post.position.set(sx, -0.25, 0); g.add(post); }
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), steel); axle.rotation.z = Math.PI / 2; g.add(axle);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.36, 0.02), new THREE.MeshPhysicalMaterial({ color: 0xffd34d, metalness: 0.9, roughness: 0.2, clearcoat: 1 })); blade.castShadow = true; g.add(blade);
      s.add(g); this.spinners.push({ n, blade });
    }
    // props in the dark corners above the arc: glowing mushrooms and crystals
    const prof = [[0, 0], [0.1, 0], [0.12, 0.5], [0.1, 0.7]].map(([x, y]) => new THREE.Vector2(x, y));
    const stem = new THREE.LatheGeometry(prof, 16), cap = new THREE.SphereGeometry(0.5, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const mush = (x: number, z: number, sc: number, col: number) => {
      const g = new THREE.Group(); g.position.set(x, 0.1, z); g.scale.setScalar(sc);
      g.add(new THREE.Mesh(stem, new THREE.MeshStandardMaterial({ color: 0xe9dcc8, roughness: 0.7 })));
      const c = new THREE.Mesh(cap, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.3, clearcoat: 1, emissive: col, emissiveIntensity: 0.5 })); c.position.y = 0.7; c.scale.set(1.2, 0.8, 1.2); c.castShadow = true; g.add(c);
      s.add(g);
    };
    const crystal = (x: number, z: number, sc: number, col: number) => {
      const g = new THREE.Group(); g.position.set(x, 0.05, z);
      for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.22 * sc * (1 - i * 0.14), 0), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.1, transmission: 0, clearcoat: 1, emissive: col, emissiveIntensity: 0.9 })); m.scale.y = 2.4; m.position.set(Math.cos(i * 1.7) * 0.3 * sc, 0.25 * sc, Math.sin(i * 1.7) * 0.3 * sc); m.rotation.set(Math.sin(i) * 0.3, i, Math.cos(i) * 0.3); g.add(m); }
      s.add(g);
    };
    mush(-3.9, -7.2, 1.1, 0xff5fa8); mush(-3.3, -7.5, 0.7, 0xffb14a); crystal(-3.2, -6.5, 1, 0x4fd8ff);
    mush(3.9, -7.2, 1.0, 0xffb14a); mush(3.2, -7.5, 0.65, 0xff5fa8); crystal(3.3, -6.6, 1.1, 0xb58aff);
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

  private updateFeatures(dt: number) {
    const sim = this.sim;
    for (const { n, m } of this.inserts) m.material.emissiveIntensity = n.lit ? 2.2 + Math.sin(this.time * 8) * 0.4 : 0.08 + n.flash * 4;
    const lit = sim.hits % 6; this.stars.forEach((m, i) => { m.material.emissiveIntensity = i < lit ? 2.2 : 0.1; });
    for (const { tg, m, mat } of this.dropMeshes) { const target = tg.down ? -0.55 : 0.25; m.position.y += (target - m.position.y) * Math.min(1, dt * 18); mat.emissiveIntensity = 0.25 + tg.flash * 4; }
    for (const { tg, mat } of this.standMeshes) mat.emissiveIntensity = 0.25 + tg.flash * 5;
    for (const o of this.saucerObjs) { const g = Math.min(1, o.u.glow); o.glowMat.opacity = g * 0.8; o.light.intensity = g * 8; }
    for (const o of this.spinners) o.blade.rotation.x = o.n.angle;
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    // fit the whole table in view
    const fov = THREE.MathUtils.degToRad(this.camera.fov), aspect = w / h;
    const elev = 0.9;
    const needV = 20.5 / 2 / Math.tan(fov / 2), needH = 11.2 / 2 / (Math.tan(fov / 2) * aspect);
    this.camDist = Math.max(needV * 0.92, needH);
    this.camElev = elev;
  }
  camDist = 22; camElev = 1;
  az = 0; el = 0.85; zoom = 1; tAz = 0; tEl = 0.85; tZoom = 1;
  private attachOrbit() {
    const cv = this.canvas, ptrs = new Map<number, { x: number; y: number }>(); let pinch = 0;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0; });
    cv.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1) { this.tAz = Math.max(-0.85, Math.min(0.85, this.tAz - dx * 0.006)); this.tEl = Math.max(0.42, Math.min(1.5, this.tEl + dy * 0.006)); }
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) this.tZoom = Math.max(0.5, Math.min(1.5, this.tZoom * pinch / d)); pinch = d; }
    });
    const up = (e: PointerEvent) => { ptrs.delete(e.pointerId); pinch = 0; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.tZoom = Math.max(0.5, Math.min(1.5, this.tZoom * Math.exp(e.deltaY * 0.001))); }, { passive: false });
    cv.addEventListener('dblclick', () => { this.tAz = 0; this.tEl = 0.85; this.tZoom = 1; });
  }

  nudgeShake(dir: number) { this.shake = 1; this.shakeDir = dir; }
  shakeDir = 0;

  render(dt: number, charge: number) {
    this.time += dt; const sim = this.sim, ball = sim.ball;
    this.ball.visible = ball.alive && !ball.held; this.ball.position.set(wx(ball.x), ball.r * S, wz(ball.y));
    sim.table.flippers.forEach((f, i) => { this.flippers[i].rotation.y = -f.angle; });
    for (const o of this.bumpers) {
      const f = Math.min(1, o.b.flash / 0.18);
      if (o.kind === 'pop') { o.mat.emissiveIntensity = 0.22 + f * 2.4; const s = o.sc * (1 + f * 0.12); o.body.scale.set(s, o.sc * (1 - f * 0.08), s); }
    }
    this.updateFeatures(dt);
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
    const k = Math.min(1, dt * 9); this.az += (this.tAz - this.az) * k; this.el += (this.tEl - this.el) * k; this.zoom += (this.tZoom - this.zoom) * k;
    const dd = this.camDist * this.zoom, ce = Math.cos(this.el), se = Math.sin(this.el);
    const tx = 0, ty = 0, tz = 0.9;
    this.camera.position.set(tx + Math.sin(this.az) * ce * dd + sx, ty + se * dd, tz + Math.cos(this.az) * ce * dd);
    this.camera.lookAt(tx + sx, ty, tz);
    this.bloom.strength = 0.35 + (sim.tilted ? 0.2 : 0);
    this.composer.render();
  }
}
