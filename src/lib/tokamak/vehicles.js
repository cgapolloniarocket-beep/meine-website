// @ts-nocheck
/* ==========================================================================
   Application vehicles for the Technology page: satellite, interplanetary
   cargo tug, heavy interplanetary spacecraft. Original concept line-art in
   the field-line style; each carries a ring-type plasma engine with a
   magnetic nozzle whose field lines carry the flowing exhaust.
   Concept illustrations only: no real vehicle, no performance data.

   Drawing rules for a clean technical look:
     primary  — silhouette and structure, full strength
     detail   — seams, cells, ribs: thin and dim
     flow     — nozzle field lines with travelling pulses
     depth    — lines fade with distance from the camera
   One WebGL canvas renders all three views (scissor), plus flowing SVG
   connectors from the spherical-tokamak animation to each engine.
   ========================================================================== */
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { flowPatch } from './fieldlines.js';

const LINE = '#a28aee';
const LAYER = {
  P: { width: 1.5, opacity: 0.95 },   // primary structure
  D: { width: 0.8, opacity: 0.42 },   // details
  F: { width: 1.05, opacity: 0.85 },  // nozzle field lines + plume (animated)
};

/* ---------- vector helpers ---------- */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/* three line layers per drawing */
class Art {
  constructor() { this.P = []; this.D = []; this.F = []; }
  line(L, p, q) { this[L].push(p[0], p[1], p[2], q[0], q[1], q[2]); }
  poly(L, pts, closed = false) {
    for (let i = 0; i < pts.length - 1; i++) this.line(L, pts[i], pts[i + 1]);
    if (closed) this.line(L, pts[pts.length - 1], pts[0]);
  }
}

/* ---------- primitives ---------- */
/* regular n-gon (n large = circle) around the X axis, optional rotation */
function ringX(x, r, n = 56, rot = 0, cy = 0, cz = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) { const t = rot + (i / n) * 2 * Math.PI; pts.push([x, cy + r * Math.cos(t), cz + r * Math.sin(t)]); }
  return pts;
}
function box(A, L, c, size) {
  const [hx, hy, hz] = size.map((v) => v / 2), v = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) v.push([c[0] + sx * hx, c[1] + sy * hy, c[2] + sz * hz]);
  for (const [i, j] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) A.line(L, v[i], v[j]);
}
/* panel with a primary frame and a dim cell grid */
function panel(A, o, u, v, nu, nv) {
  const c = [o, add(o, u), add(add(o, u), v), add(o, v)];
  A.poly('P', c, true);
  for (let i = 1; i < nu; i++) { const p = add(o, mul(u, i / nu)); A.line('D', p, add(p, v)); }
  for (let j = 1; j < nv; j++) { const p = add(o, mul(v, j / nv)); A.line('D', p, add(p, u)); }
}
/* body of revolution about X with an n-sided cross-section */
function hull(A, profile, sides, keyStations, rot = Math.PI / sides) {
  for (const [x, r] of profile) if (r > 0.01) A.poly(keyStations.includes(x) ? 'P' : 'D', ringX(x, r, sides, rot), true);
  for (let k = 0; k < sides; k++) {
    const t = rot + (k / sides) * 2 * Math.PI;
    A.poly('P', profile.map(([x, r]) => [x, r * Math.cos(t), r * Math.sin(t)]));
  }
}
/* triangular truss along X */
function truss3(A, x0, x1, side, bays) {
  const R = side / Math.sqrt(3), c = [0, 1, 2].map((i) => [R * Math.cos(Math.PI / 2 + (i * 2 * Math.PI) / 3), R * Math.sin(Math.PI / 2 + (i * 2 * Math.PI) / 3)]);
  for (const [y, z] of c) A.line('P', [x0, y, z], [x1, y, z]);
  for (let b = 0; b <= bays; b++) {
    const x = x0 + ((x1 - x0) * b) / bays;
    A.poly('D', c.map(([y, z]) => [x, y, z]), true);
    if (b < bays) {
      const xn = x0 + ((x1 - x0) * (b + 1)) / bays;
      for (let f = 0; f < 3; f++) { const p = c[f], q = c[(f + 1) % 3]; A.line('D', [x, p[0], p[1]], [xn, q[0], q[1]]); }
    }
  }
}
/* hexagonal container, axis X */
function hexPod(A, cx, cy, cz, r, len) {
  const a = ringX(cx - len / 2, r, 6, 0, cy, cz), b = ringX(cx + len / 2, r, 6, 0, cy, cz);
  A.poly('P', a, true); A.poly('P', b, true);
  for (let i = 0; i < 6; i++) A.line('P', a[i], b[i]);
  A.poly('D', ringX(cx, r, 6, 0, cy, cz), true);
}
/* parabolic dish facing n */
function dish(A, c, n, R, depth) {
  const nn = norm(n), tmp = Math.abs(nn[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm(cross(nn, tmp)), v = cross(nn, u);
  const P = (rho, t) => add(add(c, add(mul(u, rho * Math.cos(t)), mul(v, rho * Math.sin(t)))), mul(nn, depth * (rho / R) ** 2));
  const rim = []; for (let i = 0; i < 56; i++) rim.push(P(R, (i / 56) * 2 * Math.PI));
  A.poly('P', rim, true);
  for (const f of [0.45, 0.75]) { const pts = []; for (let i = 0; i < 48; i++) pts.push(P(R * f, (i / 48) * 2 * Math.PI)); A.poly('D', pts, true); }
  for (let k = 0; k < 12; k++) { const t = (k / 12) * 2 * Math.PI, pts = []; for (let i = 0; i <= 6; i++) pts.push(P((R * i) / 6, t)); A.poly('D', pts); }
  const focus = add(c, mul(nn, depth + R * 0.6));
  for (let k = 0; k < 3; k++) A.line('D', P(R * 0.95, (k / 3) * 2 * Math.PI + 0.4), focus);
  return c;
}
/* ring-type plasma engine with a magnetic nozzle, exhaust toward −X.
   (cy, cz) offsets the engine axis from the vehicle axis. */
function engine(A, x, R, len, cy = 0, cz = 0) {
  const h = R * 0.35;
  A.poly('P', ringX(x + h, R * 1.12, 56, 0, cy, cz), true);
  A.poly('P', ringX(x - h, R * 1.12, 56, 0, cy, cz), true);
  for (let k = 0; k < 12; k++) {
    const t = (k / 12) * 2 * Math.PI, y = cy + R * 1.12 * Math.cos(t), z = cz + R * 1.12 * Math.sin(t);
    A.line('D', [x + h, y, z], [x - h, y, z]);
  }
  for (const f of [-0.5, 0, 0.5]) A.poly('D', ringX(x + f * h, R * 0.82, 48, 0, cy, cz), true);   // coils
  A.poly('P', ringX(x - h, R * 0.5, 40, 0, cy, cz), true);                                          // exit
  // magnetic-nozzle field lines: throat at the exit, flaring behind; drawn tail → engine
  const n = 14, steps = 30, r0 = R * 0.5, r1 = R * 2.0;
  for (let l = 0; l < n; l++) {
    const a = (l / n) * 2 * Math.PI, pts = [];
    for (let j = steps; j >= 0; j--) {
      const s = j / steps, rad = r0 + (r1 - r0) * s * s;
      pts.push([x - h - len * s, cy + rad * Math.cos(a), cz + rad * Math.sin(a)]);
    }
    A.poly('F', pts);
  }
  for (let l = 0; l < 6; l++) {                                                                       // plume core
    const a = (l / 6) * 2 * Math.PI + 0.26, pts = [];
    for (let j = steps; j >= 0; j--) {
      const s = j / steps, rad = R * 0.18 + R * 0.5 * s;
      pts.push([x - h - len * 0.8 * s, cy + rad * Math.cos(a), cz + rad * Math.sin(a)]);
    }
    A.poly('F', pts);
  }
}

/* rotate a whole drawing about the Z axis */
function rotateZ(A, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  for (const L of ['P', 'D', 'F']) {
    const a = A[L];
    for (let i = 0; i < a.length; i += 3) { const x = a[i], y = a[i + 1]; a[i] = c * x - s * y; a[i + 1] = s * x + c * y; }
  }
  return A;
}

/* roll a whole drawing about the vehicle axis (X) */
function rotateX(A, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  for (const L of ['P', 'D', 'F']) {
    const a = A[L];
    for (let i = 0; i < a.length; i += 3) { const y = a[i + 1], z = a[i + 2]; a[i + 1] = c * y - s * z; a[i + 2] = s * y + c * z; }
  }
  return A;
}

/* ---------- vehicles (axis X, engines at −X) ---------- */
function satellite() {
  const A = new Art();
  box(A, 'P', [0, 0, 0], [0.8, 0.7, 0.7]);
  for (const z of [-0.35, 0.35]) A.line('D', [-0.4, 0, z], [0.4, 0, z]);                 // panel seams
  for (const y of [-0.35, 0.35]) A.line('D', [-0.4, y, 0], [0.4, y, 0]);
  for (const sg of [1, -1]) {                                                             // solar wings (±Y)
    const y0 = 0.35 * sg, y1 = 0.62 * sg;
    A.line('P', [-0.12, y0, 0], [0, y1, 0]); A.line('P', [0.12, y0, 0], [0, y1, 0]);      // yoke
    for (let p = 0; p < 3; p++) {
      const ys = y1 + (p * 0.48 + 0.03) * sg;
      panel(A, [-0.3, ys, 0], [0.6, 0, 0], [0, 0.45 * sg, 0], 5, 6);
    }
  }
  A.line('P', [0.2, 0, 0.35], [0.3, 0.05, 0.55]);                                         // antenna boom
  dish(A, [0.3, 0.05, 0.55], [0.35, 0.15, 1], 0.27, 0.08);
  for (const [y, z] of [[0.2, -0.36], [-0.2, -0.36]]) {                                   // star trackers
    A.poly('D', ringX(0.25, 0.05, 20, 0, y, z - 0.04), true);
    A.poly('D', ringX(0.38, 0.05, 20, 0, y, z - 0.04), true);
  }
  A.poly('P', ringX(-0.4, 0.2, 6, 0), true);                                              // engine mount
  engine(A, -0.56, 0.17, 0.9);
  return rotateZ(A, -0.62);                                                               // wings run diagonally
}
function cargo() {
  const A = new Art();
  truss3(A, -0.9, 1.3, 0.2, 12);
  for (const xc of [0.1, 0.7]) for (let k = 0; k < 6; k++) {                              // container clusters
    const t = (k / 6) * 2 * Math.PI;
    hexPod(A, xc, 0.27 * Math.cos(t), 0.27 * Math.sin(t), 0.13, 0.5);
  }
  hull(A, [[1.3, 0.17], [1.5, 0.17], [1.58, 0.1]], 8, [1.3, 1.5]);                       // command module
  A.poly('P', ringX(1.62, 0.07, 32), true);                                               // docking ring
  for (const sg of [1, -1]) {                                                             // radiators: vertical + horizontal pair
    panel(A, [-0.78, 0.13 * sg, 0], [0.5, 0, 0], [0, 0.72 * sg, 0], 12, 1);
    panel(A, [-0.78, 0, 0.13 * sg], [0.5, 0, 0], [0, 0, 0.72 * sg], 12, 1);
  }
  A.poly('P', ringX(-0.92, 0.26, 6, 0), true);                                            // thrust frame
  engine(A, -1.08, 0.24, 1.0);
  return rotateX(A, 0.45);                                                                // all four radiator wings visible
}
/* small boxy shuttle docked to a larger ship; axis X, nose at +X */
function shuttle(A, c, s = 1) {
  const [cx, cy, cz] = c;
  const q = (x, y, z) => [cx + x * s, cy + y * s, cz + z * s];
  const back = [q(-0.12, 0.035, 0.045), q(-0.12, 0.035, -0.045), q(-0.12, -0.035, -0.045), q(-0.12, -0.035, 0.045)];
  const mid = [q(0.06, 0.035, 0.045), q(0.06, 0.035, -0.045), q(0.06, -0.035, -0.045), q(0.06, -0.035, 0.045)];
  const nose = [q(0.14, 0.018, 0.026), q(0.14, 0.018, -0.026), q(0.14, -0.022, -0.026), q(0.14, -0.022, 0.026)];
  A.poly('P', back, true); A.poly('P', mid, true); A.poly('P', nose, true);
  for (let i = 0; i < 4; i++) { A.line('P', back[i], mid[i]); A.line('P', mid[i], nose[i]); }
  A.poly('D', ringX(cx - 0.14 * s, 0.022 * s, 16, 0, cy, cz), true);
  for (let l = 0; l < 4; l++) {                                                            // tiny exhaust
    const a = (l / 4) * 2 * Math.PI + 0.4, pts = [];
    for (let j = 6; j >= 0; j--) { const t = j / 6, r = 0.012 * s + 0.02 * s * t; pts.push([cx - (0.14 + 0.16 * t) * s, cy + r * Math.cos(a), cz + r * Math.sin(a)]); }
    A.poly('F', pts);
  }
}

function spacecraft() {
  /* heavy interplanetary cruiser, cubic: rectangular hull with barely
     chamfered edges, flat armoured prow, block superstructure on top, a
     cubic ventral module, side hangar bays and an engine block with one
     main engine. No wings. */
  const A = new Art();
  const W = 0.36, H = 0.27, C = 0.025;
  const sec = (x, s = 1) => [
    [x, H * s, (W - C) * s], [x, (H - C) * s, W * s], [x, -(H - C) * s, W * s], [x, -H * s, (W - C) * s],
    [x, -H * s, -(W - C) * s], [x, -(H - C) * s, -W * s], [x, (H - C) * s, -W * s], [x, H * s, -(W - C) * s]];
  // main hull: square-cut prow with a narrow bevel
  const st = [[2.55, 0.86], [2.47, 1.0], [1.2, 1.0], [0.0, 1.0], [-1.05, 1.0]];
  const key = new Set([2.55, 2.47, 1.2, 0.0, -1.05]);
  for (const [x, sc] of st) A.poly(key.has(x) ? 'P' : 'D', sec(x, sc), true);
  for (let x = 2.3; x > -1.05; x -= 0.15) A.poly('D', sec(x, 1), true);                   // plating frames
  for (let k = 0; k < 8; k++) A.poly('P', st.map(([x, sc]) => sec(x, sc)[k]));           // edges
  const pf = sec(2.55, 0.86);                                                             // prow armour grid
  for (const t of [0.33, 0.66]) {
    A.line('D', lerp(pf[0], pf[7], t), lerp(pf[3], pf[4], t));
    A.line('D', lerp(pf[1], pf[2], t), lerp(pf[6], pf[5], t));
  }
  // side decks and hangar bays (both sides)
  for (const sz of [1, -1]) {
    for (const y of [0.1, -0.1]) A.line('D', [2.47, y, W * sz], [-1.05, y, W * sz]);
    for (const [x0, x1] of [[2.15, 1.85], [1.45, 1.15], [0.7, 0.4], [-0.1, -0.4]]) {
      A.poly('P', [[x0, 0.07, W * sz], [x1, 0.07, W * sz], [x1, -0.07, W * sz], [x0, -0.07, W * sz]], true);
      A.line('D', [x0, 0, W * sz], [x1, 0, W * sz]);
    }
  }
  for (const z of [0.12, -0.12]) A.line('D', [2.47, H, z], [-1.05, H, z]);                // top plating
  // block superstructure (low, stepped cubes)
  box(A, 'P', [1.75, H + 0.07, 0], [0.55, 0.14, 0.44]);
  box(A, 'P', [0.75, H + 0.09, 0], [1.1, 0.18, 0.5]);
  box(A, 'P', [0.8, H + 0.23, 0], [0.55, 0.1, 0.32]);
  box(A, 'P', [-0.45, H + 0.06, 0], [0.6, 0.12, 0.4]);
  for (const x of [0.6, 0.95]) A.line('D', [x, H + 0.28, 0.1], [x, H + 0.38, 0.1]);       // antenna masts
  // cubic ventral module
  box(A, 'P', [0.9, -H - 0.09, 0], [1.9, 0.18, 0.52]);
  for (let i = 1; i < 8; i++) { const x = 0.9 - 0.95 + (i / 8) * 1.9; A.line('D', [x, -H - 0.18, 0.26], [x, -H, 0.26]); }
  // engine block
  for (const x of [-1.1, -1.28, -1.45]) A.poly(x === -1.28 ? 'D' : 'P', sec(x, 1.2), true);
  for (let k = 0; k < 8; k++) A.line('P', sec(-1.1, 1.2)[k], sec(-1.45, 1.2)[k]);
  engine(A, -1.68, 0.38, 1.0);                                                             // one main engine
  // small shuttles docked along the hull, each on a short docking arm
  const SH = 1.7;                                                                         // shuttle scale
  const docks = [
    { at: [1.3, 0.0, W + 0.26], from: [1.3, 0.0, W] },
    { at: [0.5, 0.0, W + 0.26], from: [0.5, 0.0, W] },
    { at: [-0.3, 0.0, -(W + 0.26)], from: [-0.3, 0.0, -W] },
    { at: [2.0, H + 0.3, 0.0], from: [2.0, H + 0.14, 0.0] },
  ];
  for (const d of docks) {
    shuttle(A, d.at, SH);
    const end = [d.at[0], d.from[1] + (d.at[1] - d.from[1]) * 0.55, d.from[2] + (d.at[2] - d.from[2]) * 0.55];
    A.line('P', d.from, end);                                                            // docking arm
    A.line('D', [d.from[0] - 0.04, d.from[1], d.from[2]], [end[0] - 0.04, end[1], end[2]]);
  }
  return rotateX(A, 0.18);
}
const BUILDERS = { satellite, cargo, spacecraft };
const VIEW = {
  satellite: { az: 0.5, el: 0.3, ph: 0 },
  cargo: { az: 0.45, el: 0.5, ph: 2.1 },
  spacecraft: { az: 0.72, el: 0.38, ph: 4.2, fov: 32, fit: [0.98, 0.96] },
};

/* LineMaterial patch: fade lines with camera distance (uDepth = dist, radius, far alpha) */
function depthPatch(sh, uDepth) {
  if (!sh.vertexShader.includes('vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );')) return;
  sh.vertexShader = sh.vertexShader
    .replace('void main() {', 'varying float vDepth;\nvoid main() {')
    .replace('vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );',
      'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );\n\t\t\tvDepth = ( position.y < 0.5 ) ? - start.z : - end.z;');
  sh.fragmentShader = sh.fragmentShader
    .replace('void main() {', 'varying float vDepth;\nuniform vec3 uDepth;\nvoid main() {')
    .replace('gl_FragColor = vec4( diffuseColor.rgb, alpha );',
      'alpha *= mix(1.0, uDepth.z, smoothstep(uDepth.x - 0.6 * uDepth.y, uDepth.x + 0.9 * uDepth.y, vDepth));\n\t\t\tgl_FragColor = vec4( diffuseColor.rgb, alpha );');
  sh.uniforms.uDepth = uDepth;
}

/* ---------- mount ---------- */
export function mountVehicles(root) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holder = root.querySelector('[data-apps-canvas]');
  const arts = [...root.querySelectorAll('[data-app-art]')];
  if (!holder || !arts.length) return { destroy() {} };

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return { destroy() {} }; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.matchMedia('(pointer: fine)').matches ? 2 : 1.5));   // lighter on phones
  renderer.setScissorTest(true);
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
  holder.appendChild(canvas);

  const TIME = { value: 0 };
  const color = new THREE.Color(LINE);
  const views = arts.map((el) => {
    const kind = el.dataset.appArt, art = BUILDERS[kind]();
    const scene = new THREE.Scene(), group = new THREE.Group();
    const uDepth = { value: new THREE.Vector3(5, 1, 0.3) };
    const layers = {};
    for (const L of ['D', 'P', 'F']) {
      if (!art[L].length) continue;
      const geo = new LineSegmentsGeometry(); geo.setPositions(new Float32Array(art[L]));
      const mat = new LineMaterial({ color, linewidth: LAYER[L].width, depthTest: false, depthWrite: false, transparent: true, opacity: LAYER[L].opacity });
      const obj = new LineSegments2(geo, mat);
      const animated = L === 'F' && !reduceMotion;
      if (animated) {
        mat.dashed = true; mat.dashScale = 1; mat.dashSize = 1e9; mat.gapSize = 0;
        obj.computeLineDistances();
      }
      const flow = new THREE.Vector2(0.16, 0.34);
      mat.onBeforeCompile = (sh) => {
        depthPatch(sh, uDepth);
        if (animated) {
          const p = flowPatch(sh.fragmentShader);
          if (p) { sh.fragmentShader = p; sh.uniforms.uTime = TIME; sh.uniforms.uFlow = { value: flow }; }
        }
      };
      mat.customProgramCacheKey = () => `veh-${L}-${animated ? 1 : 0}`;
      group.add(obj);
      layers[L] = { geo, mat };
    }
    scene.add(group);
    const camera = new THREE.PerspectiveCamera(VIEW[kind].fov || 26, 1, 0.05, 100);
    const all = art.P.concat(art.F), sample = [];
    let radius = 0;
    for (let i = 0; i < all.length; i += 3 * 4) {
      const p = new THREE.Vector3(all[i], all[i + 1], all[i + 2]);
      sample.push(p); radius = Math.max(radius, p.length());
    }
    return { el, kind, scene, camera, layers, uDepth, sample, radius, cfg: VIEW[kind], dist: 5, hover: 0, fade: 1 };
  });

  const dirFor = (cfg, az) => new THREE.Vector3(Math.sin(az) * Math.cos(cfg.el), Math.sin(cfg.el), Math.cos(az) * Math.cos(cfg.el));
  function fit(view, aspect) {
    const cam = view.camera, dir = dirFor(view.cfg, view.cfg.az), p = new THREE.Vector3();
    cam.aspect = aspect;
    let d = 6;
    for (let it = 0; it < 4; it++) {
      cam.position.copy(dir).multiplyScalar(d); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let mx = 0, my = 0;
      for (const s of view.sample) { p.copy(s).project(cam); mx = Math.max(mx, Math.abs(p.x)); my = Math.max(my, Math.abs(p.y)); }
      const [fw, fh] = view.cfg.fit || [0.92, 0.88];
      d *= Math.max(mx / fw, my / fh);
    }
    view.dist = d * 1.06;
    view.uDepth.value.set(view.dist, view.radius, 0.28);
  }

  let W = 1, H = 1;
  function resize() {
    const r = holder.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    for (const v of views) {
      const a = v.el.getBoundingClientRect(), w = Math.max(1, a.width), h = Math.max(1, a.height);
      const k = Math.min(1.25, Math.max(0.75, w / 300));
      for (const L of Object.keys(v.layers)) { const m = v.layers[L].mat; m.resolution.set(w, h); m.linewidth = LAYER[L].width * k; }
      fit(v, w / h);
    }
    updateConnectors();
  }

  /* hover: the row under the pointer comes forward, the others step back */
  const rows = arts.map((a) => a.closest('[data-app]'));
  let hovered = null;
  const onEnter = (e) => { hovered = e.currentTarget.dataset.app; };
  const onLeave = () => { hovered = null; };
  rows.forEach((r) => { r?.addEventListener('pointerenter', onEnter); r?.addEventListener('pointerleave', onLeave); });

  /* connectors: flowing curves from the tokamak animation to each engine */
  const svg = document.querySelector('[data-connectors]');
  const tok = document.querySelector('[data-tokamak]');
  const paths = [];
  if (svg) for (let i = 0; i < views.length; i++) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', 'connector'); svg.appendChild(p); paths.push(p);
  }
  function updateConnectors() {
    if (!svg || !tok) return;
    const s = svg.getBoundingClientRect();
    if (s.width === 0) return;
    svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`);
    const t = tok.getBoundingClientRect();
    const sx = t.right - t.width * 0.12 - s.left, sy = t.top + t.height * 0.5 - s.top;
    views.forEach((v, i) => {
      const a = v.el.getBoundingClientRect();
      const ex = a.left + a.width * 0.04 - s.left, ey = a.top + a.height * 0.5 - s.top;
      const dx = Math.max(60, (ex - sx) * 0.5);
      paths[i]?.setAttribute('d', `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${(sx + dx).toFixed(1)} ${sy.toFixed(1)}, ${(ex - dx).toFixed(1)} ${ey.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`);
    });
  }

  const ro = new ResizeObserver(resize);
  ro.observe(holder);
  if (svg?.parentElement) ro.observe(svg.parentElement);
  document.fonts?.ready?.then(resize);
  resize();

  let visible = true;
  const io = new IntersectionObserver((en) => { visible = en[0]?.isIntersecting ?? true; });
  io.observe(root);

  const t0 = performance.now();
  let raf = 0, last = t0, drewOnce = false;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (!visible || (reduceMotion && drewOnce)) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    TIME.value = t;
    const c = holder.getBoundingClientRect();
    renderer.setScissor(0, 0, W, H); renderer.setViewport(0, 0, W, H); renderer.clear();
    for (const v of views) {
      v.hover += ((hovered === v.kind ? 1 : 0) - v.hover) * Math.min(1, dt * 6);
      const targetFade = hovered && hovered !== v.kind ? 0.5 : 1;
      v.fade += (targetFade - v.fade) * Math.min(1, dt * 6);
      for (const L of Object.keys(v.layers)) v.layers[L].mat.opacity = Math.min(1, LAYER[L].opacity * v.fade * (1 + 0.12 * v.hover));
      const sway = reduceMotion ? 0 : (0.2 + 0.15 * v.hover) * Math.sin(t * 0.3 + v.cfg.ph);
      v.camera.position.copy(dirFor(v.cfg, v.cfg.az + sway)).multiplyScalar(v.dist);
      v.camera.lookAt(0, 0, 0);
      const a = v.el.getBoundingClientRect();
      if (a.width < 2 || a.height < 2) continue;
      const x = a.left - c.left, y = c.bottom - a.bottom;
      renderer.setViewport(x, y, a.width, a.height);
      renderer.setScissor(x, y, a.width, a.height);
      renderer.render(v.scene, v.camera);
    }
    drewOnce = true;
  };
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      rows.forEach((r) => { r?.removeEventListener('pointerenter', onEnter); r?.removeEventListener('pointerleave', onLeave); });
      for (const v of views) for (const L of Object.keys(v.layers)) { v.layers[L].geo.dispose(); v.layers[L].mat.dispose(); }
      paths.forEach((p) => p.remove());
      renderer.dispose(); canvas.remove();
    },
  };
}
