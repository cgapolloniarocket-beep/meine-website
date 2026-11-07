// @ts-nocheck
/* ==========================================================================
   Spherical-tokamak field lines — Technology page.

   Every line drawn is one traced magnetic field line of a computed
   Grad–Shafranov equilibrium (analytic Solov'ev solution after Cerfon &
   Freidberg, Phys. Plasmas 17, 032502, 2010), on a rational surface q = m/T
   so that the line closes on itself:  dφ = (F·R0/ψ0) · dl̂ / (x·|∇̂ψ̂|).
   The flowing pulses are a visual effect only; they run along the field
   lines and meet in the centre column.

   Equilibrium inputs, MAST Upgrade-like (public reference values):
     R0 = 0.85 m, a = 0.65 m (IAEA ICC/P5-06); κ = 1.8, δ = 0.3
     (Harrison et al., IAEA FEC 2021, first campaign); B0 = 0.75 T
     (0.8 T at R = 0.8 m scaled 1/R to 0.85 m); Ip = 2.0 MA (design maximum).
     Density and temperature are free choices; limiter boundary.
   ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import TokPhys from './physics.js';

const LINE = '#a28aee';
const CONFIG = {
  params: { R0: 0.85, a: 0.65, kappa: 1.8, delta: 0.3, B0: 0.75, Ip: 2.0, config: 'limiter', n0: 0.5, Te0: 1.0, Ti0: 1.0, vrot: 0, lite: true },
  psiN: 0.90, turns: [11, 15], elev: 30, fitW: 0.84, fitH: 0.86,
  flow: { spacing: 0.75, speed: 0.75 },
};
const NTH = 600;

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

/* Rational surface q = m/T near ψN: one field line closes after T poloidal
   transits, its passes evenly spread in toroidal angle (gcd(m, T) = 1). */
function rationalSurface(eq, psiN0, Tmin, Tmax) {
  const qAt = (psiN) => eq.traceSurface(1 - psiN, 192).q;
  const lo = Math.max(0.5, psiN0 - 0.3), hi = Math.min(0.985, psiN0 + 0.05), NS = 16;
  const tab = [];
  for (let i = 0; i <= NS; i++) { const p = lo + (hi - lo) * i / NS; tab.push([p, qAt(p)]); }
  const interp = (qs) => {
    for (let i = 0; i < NS; i++) {
      const [p0, q0] = tab[i], [p1, q1] = tab[i + 1];
      if ((qs - q0) * (qs - q1) <= 0 && q1 !== q0) return p0 + (p1 - p0) * (qs - q0) / (q1 - q0);
    }
    return null;
  };
  const q0 = qAt(psiN0);
  let best = null;
  for (let T = Tmin; T <= Tmax; T++) {
    for (let dm = -3; dm <= 3; dm++) {
      const m = Math.round(T * q0) + dm;
      if (m < 1 || gcd(m, T) !== 1) continue;
      const p = interp(m / T);
      if (p === null) continue;
      const cost = Math.abs(p - psiN0);
      if (!best || cost < best.cost) best = { T, m, psiN: p, cost };
    }
  }
  if (!best) { const m = Math.round(Tmin * q0); return { T: Tmin, m: gcd(m, Tmin) === 1 ? m : m + 1, psiN: psiN0 }; }
  let a = best.psiN - 0.004, b = best.psiN + 0.004;
  let fa = qAt(a) - best.m / best.T, fb = qAt(b) - best.m / best.T;
  for (let k = 0; k < 6 && fb !== fa; k++) {
    const c = b - fb * (b - a) / (fb - fa); a = b; fa = fb; b = c; fb = qAt(b) - best.m / best.T;
    if (Math.abs(fb) < 1e-7) break;
  }
  best.psiN = b;
  return best;
}

/* One closed field line over T transits → segment pairs (scene: outer radius = 1).
   dist = arc length to the nearest inboard-midplane crossing (k = NTH/2). */
function fieldLineSegments(eq, psiN, turns, qTarget, sceneScale, kMeet, nth = NTH, dphiMax = 0.02) {
  const tr = eq.traceSurface(1 - psiN, nth);
  let sum = 0; for (let k = 0; k < nth; k++) sum += tr.dphi[k];
  const fix = qTarget ? (2 * Math.PI * qTarget) / sum : 1;      // exact closure
  const s = eq.params.R0 * sceneScale;
  const P = (x, y, ph) => [x * s * Math.sin(ph), y * s, x * s * Math.cos(ph)];
  const out = [], sv = [], meets = [];
  let phi = 0, prev = P(tr.pts[0][0], tr.pts[0][1], 0), sG = 0;
  for (let t = 0; t < turns; t++) {
    for (let k = 0; k < nth; k++) {
      if (k === kMeet) meets.push(sG);
      const p = tr.pts[k], q = tr.pts[k + 1], dp = tr.dphi[k] * fix;
      const m = Math.max(1, Math.ceil(Math.abs(dp) / dphiMax));
      for (let j = 1; j <= m; j++) {
        const u = j / m;
        const cur = P(p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, phi + dp * u);
        out.push(prev[0], prev[1], prev[2], cur[0], cur[1], cur[2]);
        const ds = Math.hypot(cur[0] - prev[0], cur[1] - prev[1], cur[2] - prev[2]);
        sv.push(sG, sG + ds); sG += ds; prev = cur;
      }
      phi += dp;
    }
  }
  const L = sG, ext = [meets[meets.length - 1] - L, ...meets, meets[0] + L];
  const dist = new Float32Array(sv.length);
  for (let i = 0, j = 0; i < sv.length; i++) {
    const v = sv[i];
    while (j < ext.length - 2 && ext[j + 1] <= v) j++;
    dist[i] = Math.min(Math.abs(v - ext[j]), Math.abs(ext[j + 1] - v));
  }
  return { positions: new Float32Array(out), dist };
}

/* Flow shader patch for three's LineMaterial: darker pulses travel along the
   line toward its meeting point. Returns null if the shader text is unknown. */
function flowPatch(fs) {
  const steps = [
    ['uniform float linewidth;', 'uniform float linewidth;\nuniform float uTime;\nuniform vec2 uFlow;'],
    ['if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps', ''],
    ['if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX', ''],
    ['#include <color_fragment>', `#include <color_fragment>
      float ph = vLineDistance / uFlow.x + uTime * uFlow.y / uFlow.x;
      float f = 1.0 - fract(ph);
      float comet = smoothstep(0.0, 0.88, f) * (1.0 - smoothstep(0.88, 1.0, f));
      comet = comet * comet * comet;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.72, comet);`],
  ];
  for (const [a, b] of steps) { if (!fs.includes(a)) return null; fs = fs.replace(a, b); }
  return fs;
}

let cached = null;   // equilibrium + line geometry, reused across page visits
function buildGeometry() {
  if (cached) return cached;
  const eq = TokPhys.solve(CONFIG.params);
  if (!eq.valid) return null;
  const S = 1 / (CONFIG.params.R0 + CONFIG.params.a);
  const rs = rationalSurface(eq, CONFIG.psiN, CONFIG.turns[0], CONFIG.turns[1]);
  cached = fieldLineSegments(eq, rs.psiN, rs.T, rs.m / rs.T, S, NTH / 2);
  return cached;
}

/* Mount the view into `host`. Returns { destroy }. */
export function mountTokamak(host) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const geo = buildGeometry();
  if (!geo) return { destroy() {} };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return { destroy() {} };
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.outline = 'none';
  if (!finePointer) canvas.style.pointerEvents = 'none';   // keep page scrolling on touch screens
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Spherical Tokamak: berechnete Magnetfeldlinien');
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(16, 1, 0.05, 200);

  const geom = new LineSegmentsGeometry();
  geom.setPositions(geo.positions);
  const mat = new LineMaterial({ color: new THREE.Color(LINE), linewidth: 2, depthTest: false, depthWrite: false });
  const lines = new LineSegments2(geom, mat);
  const TIME = { value: 0 };
  if (!reduceMotion) {
    mat.dashed = true; mat.dashScale = 1; mat.dashSize = 1e9; mat.gapSize = 0;
    const db = new THREE.InstancedInterleavedBuffer(geo.dist, 2, 1);
    geom.setAttribute('instanceDistanceStart', new THREE.InterleavedBufferAttribute(db, 1, 0));
    geom.setAttribute('instanceDistanceEnd', new THREE.InterleavedBufferAttribute(db, 1, 1));
    const flow = new THREE.Vector2(CONFIG.flow.spacing, CONFIG.flow.speed);
    mat.onBeforeCompile = (sh) => {
      const patched = flowPatch(sh.fragmentShader);
      if (!patched) return;                    // unknown three version: stay static
      sh.fragmentShader = patched;
      sh.uniforms.uTime = TIME;
      sh.uniforms.uFlow = { value: flow };
    };
  }
  scene.add(lines);

  const sample = [];
  for (let i = 0; i < geo.positions.length; i += 6 * 7) sample.push(new THREE.Vector3(geo.positions[i], geo.positions[i + 1], geo.positions[i + 2]));

  let controls = null;
  if (finePointer) {
    controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;              // no wheel capture: the page keeps scrolling
    controls.enableDamping = !reduceMotion;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7;
    canvas.style.cursor = 'grab';
  }

  const el = THREE.MathUtils.degToRad(CONFIG.elev);
  const dir = new THREE.Vector3(0, Math.sin(el), Math.cos(el));
  function fitDistance() {
    let d = 6;
    const v = new THREE.Vector3();
    for (let it = 0; it < 4; it++) {
      camera.position.copy(dir).multiplyScalar(d); camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      let mx = 0, my = 0;
      for (const p of sample) { v.copy(p).project(camera); mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y)); }
      d *= Math.max(mx / CONFIG.fitW, my / CONFIG.fitH);
    }
    return d;
  }

  let fitD = 0, dirty = true;
  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    mat.resolution.set(w, h);
    mat.linewidth = Math.max(1.1, Math.min(3.2, w * 0.004));
    const cur = camera.position.length();
    const savedDir = camera.position.clone().normalize();
    const newFit = fitDistance();
    const ratio = fitD ? cur / fitD : 1;
    camera.position.copy(fitD ? savedDir : dir).multiplyScalar(newFit * ratio);
    camera.lookAt(0, 0, 0);
    fitD = newFit;
    if (controls) controls.update();
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  controls?.addEventListener('change', () => { dirty = true; });

  // pause while scrolled out of view
  let visible = true;
  const io = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; if (visible) dirty = true; });
  io.observe(host);

  const t0 = performance.now();
  let raf = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    TIME.value = (now - t0) / 1000;
    const moved = controls ? controls.update() : false;
    if (moved || dirty || !reduceMotion) { renderer.render(scene, camera); dirty = false; }
  };
  raf = requestAnimationFrame(loop);

  host.style.opacity = '0';
  host.style.transition = 'opacity 1.2s ease-out';
  requestAnimationFrame(() => { host.style.opacity = '1'; });

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      controls?.dispose();
      geom.dispose(); mat.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
