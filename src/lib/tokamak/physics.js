// @ts-nocheck
/* ==========================================================================
   PHYSICS MODULE — analytic Grad–Shafranov equilibrium (Solov'ev profiles)
   Cerfon & Freidberg, "One size fits all" analytic solutions to the
   Grad–Shafranov equation, Phys. Plasmas 17, 032502 (2010).
   Normalised coordinates: x = R/R0, y = Z/R0.  Δ*ψ̂ = (1−A)x² + A.
   Pure computation: no rendering code in here.
   ========================================================================== */
const TokPhys = (() => {
'use strict';
const MU0 = 4e-7 * Math.PI;          // vacuum permeability [H/m]
const KEV = 1.602176634e-16;         // 1 keV in J
const M_D = 3.3435837724e-27;        // deuteron mass [kg]
function evalBasis(x,y,o){
 const L=Math.log(x),x2=x*x,x3=x2*x,x4=x2*x2,x5=x4*x,x6=x3*x3,y2=y*y,y3=y2*y,y4=y2*y2,y5=y4*y,y6=y3*y3;
 o[0][0]=1;
 o[0][1]=x2;
 o[0][2]=-L*x2 + y2;
 o[0][3]=x4 - 4*x2*y2;
 o[0][4]=3*L*x4 - 12*L*x2*y2 - 9*x2*y2 + 2*y4;
 o[0][5]=x6 - 12*x4*y2 + 8*x2*y4;
 o[0][6]=-15*L*x6 + 180*L*x4*y2 - 120*L*x2*y4 + 75*x4*y2 - 140*x2*y4 + 8*y6;
 o[0][7]=y;
 o[0][8]=x2*y;
 o[0][9]=-3*L*x2*y + y3;
 o[0][10]=3*x4*y - 4*x2*y3;
 o[0][11]=60*L*x4*y - 80*L*x2*y3 - 45*x4*y + 8*y5;
 o[6][0]=(1/8)*x4; o[7][0]=(1/2)*L*x2 - 1/8*x4;
 o[1][0]=0;
 o[1][1]=2*x;
 o[1][2]=-2*L*x - x;
 o[1][3]=4*x3 - 8*x*y2;
 o[1][4]=12*L*x3 - 24*L*x*y2 + 3*x3 - 30*x*y2;
 o[1][5]=6*x5 - 48*x3*y2 + 16*x*y4;
 o[1][6]=-90*L*x5 + 720*L*x3*y2 - 240*L*x*y4 - 15*x5 + 480*x3*y2 - 400*x*y4;
 o[1][7]=0;
 o[1][8]=2*x*y;
 o[1][9]=-6*L*x*y - 3*x*y;
 o[1][10]=12*x3*y - 8*x*y3;
 o[1][11]=240*L*x3*y - 160*L*x*y3 - 120*x3*y - 80*x*y3;
 o[6][1]=(1/2)*x3; o[7][1]=L*x - 1/2*x3 + (1/2)*x;
 o[2][0]=0;
 o[2][1]=0;
 o[2][2]=2*y;
 o[2][3]=-8*x2*y;
 o[2][4]=-24*L*x2*y - 18*x2*y + 8*y3;
 o[2][5]=-24*x4*y + 32*x2*y3;
 o[2][6]=360*L*x4*y - 480*L*x2*y3 + 150*x4*y - 560*x2*y3 + 48*y5;
 o[2][7]=1;
 o[2][8]=x2;
 o[2][9]=-3*L*x2 + 3*y2;
 o[2][10]=3*x4 - 12*x2*y2;
 o[2][11]=60*L*x4 - 240*L*x2*y2 - 45*x4 + 40*y4;
 o[6][2]=0; o[7][2]=0;
 o[3][0]=0;
 o[3][1]=2;
 o[3][2]=-2*L - 3;
 o[3][3]=12*x2 - 8*y2;
 o[3][4]=36*L*x2 - 24*L*y2 + 21*x2 - 54*y2;
 o[3][5]=30*x4 - 144*x2*y2 + 16*y4;
 o[3][6]=-450*L*x4 + 2160*L*x2*y2 - 240*L*y4 - 165*x4 + 2160*x2*y2 - 640*y4;
 o[3][7]=0;
 o[3][8]=2*y;
 o[3][9]=-6*L*y - 9*y;
 o[3][10]=36*x2*y - 8*y3;
 o[3][11]=720*L*x2*y - 160*L*y3 - 120*x2*y - 240*y3;
 o[6][3]=(3/2)*x2; o[7][3]=L - 3/2*x2 + 3/2;
 o[4][0]=0;
 o[4][1]=0;
 o[4][2]=2;
 o[4][3]=-8*x2;
 o[4][4]=-24*L*x2 - 18*x2 + 24*y2;
 o[4][5]=-24*x4 + 96*x2*y2;
 o[4][6]=360*L*x4 - 1440*L*x2*y2 + 150*x4 - 1680*x2*y2 + 240*y4;
 o[4][7]=0;
 o[4][8]=0;
 o[4][9]=6*y;
 o[4][10]=-24*x2*y;
 o[4][11]=-480*L*x2*y + 160*y3;
 o[6][4]=0; o[7][4]=0;
 o[5][0]=0;
 o[5][1]=0;
 o[5][2]=0;
 o[5][3]=-16*x*y;
 o[5][4]=-48*L*x*y - 60*x*y;
 o[5][5]=-96*x3*y + 64*x*y3;
 o[5][6]=1440*L*x3*y - 960*L*x*y3 + 960*x3*y - 1600*x*y3;
 o[5][7]=0;
 o[5][8]=2*x;
 o[5][9]=-6*L*x - 3*x;
 o[5][10]=12*x3 - 24*x*y2;
 o[5][11]=240*L*x3 - 480*L*x*y2 - 120*x3 - 240*x*y2;
 o[6][5]=0; o[7][5]=0;
}
function evalBasisF(x,y,b,p){
 const L=Math.log(x),x2=x*x,x4=x2*x2,x6=x4*x2,y2=y*y,y3=y2*y,y4=y2*y2,y5=y4*y,y6=y3*y3;
 b[0]=1;
 b[1]=x2;
 b[2]=-L*x2 + y2;
 b[3]=x4 - 4*x2*y2;
 b[4]=3*L*x4 - 12*L*x2*y2 - 9*x2*y2 + 2*y4;
 b[5]=x6 - 12*x4*y2 + 8*x2*y4;
 b[6]=-15*L*x6 + 180*L*x4*y2 - 120*L*x2*y4 + 75*x4*y2 - 140*x2*y4 + 8*y6;
 b[7]=y;
 b[8]=x2*y;
 b[9]=-3*L*x2*y + y3;
 b[10]=3*x4*y - 4*x2*y3;
 b[11]=60*L*x4*y - 80*L*x2*y3 - 45*x4*y + 8*y5;
 p[0]=(1/8)*x4; p[1]=(1/2)*L*x2 - 1/8*x4;
}
const _o = Array.from({ length: 8 }, () => new Float64Array(12));
const _b = new Float64Array(12), _p = new Float64Array(2);

function gauss(M, rhs) {
  const n = rhs.length, A = M.map((r, i) => [...r, rhs[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c, mx = Math.abs(A[c][c]);
    for (let r = c + 1; r < n; r++) { const v = Math.abs(A[r][c]); if (v > mx) { mx = v; piv = r; } }
    if (!(mx > 1e-300)) return null;
    const t = A[c]; A[c] = A[piv]; A[piv] = t;
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      if (f !== 0) for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  const s = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) { let v = A[r][n]; for (let k = r + 1; k < n; k++) v -= A[r][k] * s[k]; s[r] = v / A[r][r]; }
  return s;
}

/* Boundary conditions (Cerfon & Freidberg 2010): shape set by ε, κ, δ.
   Derivative index: 0 f, 1 fx, 2 fy, 3 fxx, 4 fyy, 5 fxy                    */
function shapeConditions(eps, kap, del, config) {
  const al = Math.asin(del);
  const N1 = -((1 + al) ** 2) / (eps * kap * kap);
  const N2 = ((1 - al) ** 2) / (eps * kap * kap);
  const N3 = -kap / (eps * Math.cos(al) ** 2);
  const out = [1 + eps, 0], inn = [1 - eps, 0], top = [1 - del * eps, kap * eps];
  const xu = [1 - 1.1 * del * eps, 1.1 * kap * eps], xl = [1 - 1.1 * del * eps, -1.1 * kap * eps];
  if (config === 'limiter') return { nc: 7, xpts: [], rows: [
    [out, [[0, 1]]], [inn, [[0, 1]]], [top, [[0, 1]]], [top, [[1, 1]]],
    [out, [[4, 1], [1, N1]]], [inn, [[4, 1], [1, N2]]], [top, [[3, 1], [2, N3]]]] };
  if (config === 'dn') return { nc: 7, xpts: [xu, xl], rows: [
    [out, [[0, 1]]], [inn, [[0, 1]]], [xu, [[0, 1]]], [xu, [[1, 1]]], [xu, [[2, 1]]],
    [out, [[4, 1], [1, N1]]], [inn, [[4, 1], [1, N2]]]] };
  return { nc: 12, xpts: [xl], rows: [            // single null, lower X-point
    [out, [[0, 1]]], [out, [[2, 1]]], [out, [[4, 1], [1, N1]]],
    [inn, [[0, 1]]], [inn, [[2, 1]]], [inn, [[4, 1], [1, N2]]],
    [top, [[0, 1]]], [top, [[1, 1]]], [top, [[3, 1], [2, N3]]],
    [xl, [[0, 1]]], [xl, [[1, 1]]], [xl, [[2, 1]]]] };
}

/* Schematic vacuum-vessel outline [m] — geometric assumption, not engineering data */
function vesselOutline(R0, a, kap, del, config, n = 160) {
  const Rin = R0 - a, gapIn = Math.min(0.12 * a, 0.35 * Rin);
  const Rvin = Rin - gapIn, Rvout = R0 + a + 0.18 * a;
  const H = (config === 'limiter' ? kap * a + 0.25 * a : 1.1 * kap * a + 0.5 * a);
  const Rc = (Rvin + Rvout) / 2, w = (Rvout - Rvin) / 2, pts = [];
  const boxy = R0 / a < 2.0;
  const av = Math.asin(Math.min(0.55, del * 0.9));
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * 2 * Math.PI;
    let R, Z;
    if (boxy) { const c = Math.cos(t), s = Math.sin(t), e = 2 / 5;
      R = Rc + w * Math.sign(c) * Math.abs(c) ** e; Z = H * Math.sign(s) * Math.abs(s) ** e; }
    else { R = Rc + w * Math.cos(t + av * Math.sin(t)); Z = H * Math.sin(t); }
    pts.push([R, Z]);
  }
  return { pts, Rvin, Rvout, H };
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/* Marching squares → segment list [x1,y1,x2,y2,…] in grid coordinates */
function marchingSquares(F, nx, ny, x0, y0, hx, hy, level, keep) {
  const seg = [];
  const lerp = (a, b, fa, fb) => a + (b - a) * ((level - fa) / (fb - fa));
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const f00 = F[j * nx + i], f10 = F[j * nx + i + 1], f01 = F[(j + 1) * nx + i], f11 = F[(j + 1) * nx + i + 1];
    let c = 0; if (f00 > level) c |= 1; if (f10 > level) c |= 2; if (f11 > level) c |= 4; if (f01 > level) c |= 8;
    if (c === 0 || c === 15) continue;
    const X = x0 + i * hx, Y = y0 + j * hy;
    const eB = [lerp(X, X + hx, f00, f10), Y], eR = [X + hx, lerp(Y, Y + hy, f10, f11)];
    const eT = [lerp(X, X + hx, f01, f11), Y + hy], eL = [X, lerp(Y, Y + hy, f00, f01)];
    const add = (p, q) => { if (!keep || keep((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)) seg.push(p[0], p[1], q[0], q[1]); };
    const ctr = (f00 + f10 + f01 + f11) / 4 > level;
    switch (c) {
      case 1: case 14: add(eL, eB); break;
      case 2: case 13: add(eB, eR); break;
      case 3: case 12: add(eL, eR); break;
      case 4: case 11: add(eR, eT); break;
      case 6: case 9: add(eB, eT); break;
      case 7: case 8: add(eL, eT); break;
      case 5: if (ctr) { add(eL, eT); add(eB, eR); } else { add(eL, eB); add(eR, eT); } break;
      case 10: if (ctr) { add(eL, eB); add(eR, eT); } else { add(eL, eT); add(eB, eR); } break;
    }
  }
  return seg;
}

/* ---------------------------------------------------------------------------
   solve(params) → equilibrium object.
   params: R0 [m], a [m], kappa, delta, B0 [T], Ip [MA], config ('sn'|'dn'|'limiter'),
           n0 [1e20 m^-3], Te0 [keV], Ti0 [keV], vrot [km/s]
   The pressure on axis p0 = n0·(Te0+Ti0) is matched by choosing Solov'ev A
   (bisection) — so density and temperature feed the force balance.
   --------------------------------------------------------------------------- */
function solve(P) {
  const R0 = P.R0, a = P.a, eps = a / R0, kap = P.kappa, del = P.delta;
  const Ip = P.Ip * 1e6, B0 = P.B0, cfg = P.config;
  const warnings = [];
  const sc = shapeConditions(eps, kap, del, cfg), nc = sc.nc;
  const M = [], r0 = [], rA = [];
  for (const [pt, terms] of sc.rows) {
    evalBasis(pt[0], pt[1], _o);
    const row = new Array(nc).fill(0); let b0 = 0, bA = 0;
    for (const [k, cf] of terms) { for (let i = 0; i < nc; i++) row[i] += cf * _o[k][i]; b0 -= cf * _o[6][k]; bA -= cf * _o[7][k]; }
    M.push(row); r0.push(b0); rA.push(bA);
  }
  const c0 = gauss(M, r0), c1 = gauss(M, rA);
  if (!c0 || !c1) return { valid: false, error: 'Randbedingungen singulär', params: P };

  /* grid over the vessel box (normalised) */
  const ves = vesselOutline(R0, a, kap, del, cfg);
  const vpolyN = ves.pts.map(([R, Z]) => [R / R0, Z / R0]);
  const xmin = ves.Rvin / R0 - 0.02 * eps, xmax = ves.Rvout / R0 + 0.02 * eps, ymax = ves.H / R0 + 0.02 * eps;
  const nx = 150, ny = Math.max(120, Math.min(300, Math.round(nx * (2 * ymax) / (xmax - xmin))));
  const hx = (xmax - xmin) / (nx - 1), hy = (2 * ymax) / (ny - 1), y0 = -ymax;
  const G0 = new Float64Array(nx * ny), G1 = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = xmin + i * hx, y = y0 + j * hy; evalBasisF(x, y, _b, _p);
    let g0 = _p[0], g1 = _p[1];
    for (let k = 0; k < nc; k++) { g0 += c0[k] * _b[k]; g1 += c1[k] * _b[k]; }
    G0[j * nx + i] = g0; G1[j * nx + i] = g1;
  }
  const yLo = (cfg === 'limiter') ? -Infinity : -1.1 * kap * eps;
  const yHi = (cfg === 'dn') ? 1.1 * kap * eps : Infinity;

  const psiAt = (A, x, y) => { evalBasisF(x, y, _b, _p); let f = _p[0] + A * _p[1]; for (let k = 0; k < nc; k++) f += (c0[k] + A * c1[k]) * _b[k]; return f; };
  const psiD = (A, x, y, res) => { evalBasis(x, y, _o); for (let d = 0; d < 6; d++) { let f = _o[6][d] + A * _o[7][d]; for (let k = 0; k < nc; k++) f += (c0[k] + A * c1[k]) * _o[d][k]; res[d] = f; } return res; };
  const D = new Float64Array(6);
  const mask = new Uint8Array(nx * ny), queue = new Int32Array(nx * ny);

  function evalA(A) {
    // axis: grid minimum in central region, Newton refinement
    let best = Infinity, bi = -1;
    for (let j = 0; j < ny; j++) { const y = y0 + j * hy; if (Math.abs(y) > kap * eps) continue;
      for (let i = 0; i < nx; i++) { const x = xmin + i * hx; if (x < 1 - eps || x > 1 + eps) continue;
        const v = G0[j * nx + i] + A * G1[j * nx + i]; if (v < best) { best = v; bi = j * nx + i; } } }
    if (bi < 0) return { valid: false };
    let xa = xmin + (bi % nx) * hx, ya = y0 + Math.floor(bi / nx) * hy;
    for (let it = 0; it < 25; it++) {
      psiD(A, xa, ya, D); const det = D[3] * D[4] - D[5] * D[5]; if (Math.abs(det) < 1e-14) break;
      let dx = -(D[4] * D[1] - D[5] * D[2]) / det, dy = -(D[3] * D[2] - D[5] * D[1]) / det;
      const st = Math.hypot(dx, dy), lim = 0.25 * eps; if (st > lim) { dx *= lim / st; dy *= lim / st; }
      xa += dx; ya += dy; if (st < 1e-12) break;
    }
    const psia = psiAt(A, xa, ya);
    if (!(psia < 0) || xa < 1 - eps || xa > 1 + eps) return { valid: false };
    // flood fill plasma region from axis
    mask.fill(0);
    let ia = Math.round((xa - xmin) / hx), ja = Math.round((ya - y0) / hy), head = 0, tail = 0, touches = false;
    const s = ja * nx + ia; if (G0[s] + A * G1[s] >= 0) return { valid: false };
    mask[s] = 1; queue[tail++] = s;
    while (head < tail) {
      const c = queue[head++], i = c % nx, j = (c - i) / nx;
      if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) touches = true;
      const nb = [c - 1, c + 1, c - nx, c + nx];
      for (let q = 0; q < 4; q++) { const n = nb[q];
        if (n < 0 || n >= nx * ny || mask[n]) continue;
        if ((q === 0 && i === 0) || (q === 1 && i === nx - 1)) continue;
        const yy = y0 + Math.floor(n / nx) * hy; if (yy <= yLo || yy >= yHi) continue;
        if (G0[n] + A * G1[n] < 0) { mask[n] = 1; queue[tail++] = n; } }
    }
    if (touches) return { valid: false };
    let Iint = 0;
    for (let c = 0; c < nx * ny; c++) if (mask[c]) { const x = xmin + (c % nx) * hx; Iint += (1 - A) * x + A / x; }
    Iint *= hx * hy;
    const psi0 = MU0 * R0 * Ip / Iint;
    const p0 = psi0 * psi0 * (1 - A) * (-psia) / (MU0 * R0 ** 4);
    return { valid: true, xa, ya, psia, psi0, p0, Iint };
  }

  /* match axis pressure from kinetic inputs */
  const pTarget = P.n0 * 1e20 * (P.Te0 + P.Ti0) * KEV;
  const AMAX = 0.995;
  let lo = -1.2, hi = AMAX;
  let eHi = evalA(hi);
  if (!eHi.valid) return { valid: false, error: 'Keine geschlossenen Flussflächen für diese Form', params: P };
  let eLo = evalA(lo);
  // shrink lower bound until valid
  for (let k = 0; k < 30 && !eLo.valid; k++) { lo = (lo + hi) / 2; eLo = evalA(lo); }
  let A, E;
  if (pTarget <= eHi.p0) { A = hi; E = eHi; warnings.push('Druck sehr klein: Gleichgewicht nahe β≈0.'); }
  else if (pTarget >= eLo.p0) { A = lo; E = eLo; warnings.push('Kinetischer Druck übersteigt den mit dem Solov’ev-Profil erreichbaren Bereich — Druck wurde begrenzt.'); }
  else {
    for (let it = 0; it < 50; it++) {
      const m = 0.5 * (lo + hi), e = evalA(m);
      if (!e.valid || e.p0 > pTarget) lo = m; else hi = m;
      if (hi - lo < 1e-7) break;
    }
    A = 0.5 * (lo + hi); E = evalA(A);
    if (!E.valid) { A = hi; E = evalA(A); }
  }
  const { xa, ya, psia, psi0 } = E;
  const p0eq = E.p0;
  const cA = new Float64Array(nc); for (let k = 0; k < nc; k++) cA[k] = c0[k] + A * c1[k];
  const psiF = (x, y) => { evalBasisF(x, y, _b, _p); let f = _p[0] + A * _p[1]; for (let k = 0; k < nc; k++) f += cA[k] * _b[k]; return f; };
  const psiG = (x, y, res) => psiD(A, x, y, res);

  const Ffun = (psiHat) => { const v = R0 * R0 * B0 * B0 - 2 * psi0 * psi0 * A * psiHat / (R0 * R0); return Math.sqrt(Math.max(v, 1e-12)); };
  if (R0 * R0 * B0 * B0 - 2 * psi0 * psi0 * A * psia / (R0 * R0) <= 0) warnings.push('F² ≤ 0 im Zentrum — Gleichgewicht unphysikalisch.');
  const Psi = new Float64Array(nx * ny);
  for (let c = 0; c < nx * ny; c++) Psi[c] = G0[c] + A * G1[c];
  const finalMask = mask.slice();

  /* integrals */
  let Sx = 0, Sux = 0, S1 = 0, Sphi = 0, Su = 0;
  for (let c = 0; c < nx * ny; c++) if (finalMask[c]) {
    const x = xmin + (c % nx) * hx, u = Psi[c] / psia;
    Sx += x; Sux += u * x; S1 += 1; Sphi += Ffun(Psi[c]) / x; Su += u;
  }
  const dA = hx * hy;
  const V = 2 * Math.PI * R0 ** 3 * Sx * dA;
  const Scs = R0 * R0 * S1 * dA;
  const pAvg = p0eq * Sux / Sx;
  const betaT = 2 * MU0 * pAvg / (B0 * B0);
  const betaN = 100 * betaT * a * B0 / P.Ip;
  const Wth = 1.5 * pAvg * V;
  const PhiT = R0 * Sphi * dA;
  const PsiPol = 2 * Math.PI * psi0 * (-psia);

  /* ray-traced flux surfaces from magnetic axis */
  const inBox = (x, y) => x > xmin && x < xmax && y > y0 && y < ymax;
  const rayDir = (th) => [Math.cos(th), Math.sin(th)];
  const NTH = 256;
  function boundaryRadii(nth) {
    const rb = new Float64Array(nth), step = eps / 120;
    for (let k = 0; k < nth; k++) {
      const [cx, cy] = rayDir((k / nth) * 2 * Math.PI);
      let r = 0, prev = psia, ok = false;
      for (let s = 0; s < 4000; s++) {
        const rn = r + step, x = xa + rn * cx, y = ya + rn * cy;
        if (!inBox(x, y) || x <= 0.01) break;
        const f = psiF(x, y);
        if (f >= 0 || y <= yLo || y >= yHi) { let l = r, h = rn;
          for (let b = 0; b < 40; b++) { const m = 0.5 * (l + h), xm = xa + m * cx, ym = ya + m * cy;
            const fm = psiF(xm, ym); if (fm >= 0 || ym <= yLo || ym >= yHi) h = m; else l = m; }
          rb[k] = 0.5 * (l + h); ok = true; break; }
        r = rn; prev = f;
      }
      if (!ok) rb[k] = r;
    }
    return rb;
  }
  const rbCache = {};
  const getRb = (nth) => rbCache[nth] || (rbCache[nth] = boundaryRadii(nth));
  function surface(u, nth = NTH) {          // u = ψ̂/ψ̂_axis  (1 axis → 0 boundary)
    const rb = getRb(nth), pts = new Array(nth + 1), target = u * psia;
    for (let k = 0; k < nth; k++) {
      const [cx, cy] = rayDir((k / nth) * 2 * Math.PI);
      let r;
      if (u <= 0) r = rb[k];
      else { let l = 0, h = rb[k];
        for (let b = 0; b < 34; b++) { const m = 0.5 * (l + h); if (psiF(xa + m * cx, ya + m * cy) < target) l = m; else h = m; }
        r = 0.5 * (l + h); }
      pts[k] = [xa + r * cx, ya + r * cy];
    }
    pts[nth] = pts[0];
    return pts;                              // normalised coords, closed
  }
  /* q and toroidal advance per segment: dφ = (F R0/ψ0) dl̂ /(x |∇̂ψ̂|) */
  function traceSurface(u, nth = NTH) {
    const pts = surface(u, nth), F = Ffun(u * psia), dphi = new Float64Array(nth);
    let I = 0, Lb = 0;
    for (let k = 0; k < nth; k++) {
      const p = pts[k], q = pts[k + 1], mx = 0.5 * (p[0] + q[0]), my = 0.5 * (p[1] + q[1]);
      const dl = Math.hypot(q[0] - p[0], q[1] - p[1]); psiG(mx, my, D);
      const g = Math.max(Math.hypot(D[1], D[2]), 1e-9);
      const v = dl / (mx * g); I += v; Lb += dl; dphi[k] = F * R0 / psi0 * v;
    }
    return { pts, dphi, q: F * R0 / (2 * Math.PI * psi0) * I, F, L: Lb * R0 };
  }

  if (P.lite) return { valid: true, params: { ...P }, A, psi0, psia, xa, ya, surface, traceSurface, Ffun };

  /* profiles */
  const T = (T0, u) => T0 * Math.sqrt(Math.max(u, 0));
  const N = (u) => P.n0 * Math.sqrt(Math.max(u, 0));
  const qProfile = [];
  for (let k = 1; k <= 30; k++) { const psiN = k / 31 * 0.98; const tr = traceSurface(1 - psiN, 192); qProfile.push([psiN, tr.q]); }
  const q95 = traceSurface(0.05).q, q0 = traceSurface(0.985, 128).q;
  const bnd = traceSurface(cfg === 'limiter' ? 0 : 0.002);
  const bPts = surface(0, 360);
  let Rmax = -1e9, Rmin = 1e9, Zmax = -1e9, Zmin = 1e9, RatZmax = 0;
  for (const [x, y] of bPts) { if (x > Rmax) Rmax = x; if (x < Rmin) Rmin = x; if (y > Zmax) { Zmax = y; RatZmax = x; } if (y < Zmin) Zmin = y; }
  const aEff = (Rmax - Rmin) / 2 * R0, Rgeo = (Rmax + Rmin) / 2 * R0;
  const kapEff = (Zmax - Zmin) * R0 / (2 * aEff), delEff = (Rgeo - RatZmax * R0) / aEff;
  const BpAvg = MU0 * Ip / bnd.L;

  /* midplane chord through the axis */
  function edgeAlong(dir) { let l = 0, h = 2 * eps; for (let b = 0; b < 50; b++) { const m = 0.5 * (l + h); if (psiF(xa + dir * m, ya) < 0) l = m; else h = m; } return xa + dir * 0.5 * (l + h); }
  const xin = edgeAlong(-1), xout = edgeAlong(1), mid = [];
  for (let k = 0; k <= 120; k++) {
    const x = xin + (xout - xin) * k / 120; psiG(x, ya, D);
    const u = Math.max(D[0] / psia, 0), F = Ffun(D[0]);
    const Bt = F / (x * R0), Bp = psi0 / (R0 * R0) * Math.hypot(D[1], D[2]) / x;
    const j = (psi0 / (MU0 * R0 ** 3)) * ((1 - A) * x * x + A) / x;
    mid.push({ R: x * R0, u, Te: T(P.Te0, u), Ti: T(P.Ti0, u), n: N(u), Bt, Bp, B: Math.hypot(Bt, Bp), j });
  }
  let nbar = 0; for (const m of mid) nbar += m.n; nbar /= mid.length;
  const nGW = P.Ip / (Math.PI * a * a);
  const cs = Math.sqrt((P.Te0 + P.Ti0) * KEV / M_D);
  const mach = P.vrot * 1e3 / cs;
  if (betaN > 2.8) warnings.push(`β_N = ${betaN.toFixed(2)} > 2,8 (Troyon-Koeffizient) — MHD-Stabilität wird hier nicht berechnet.`);
  if (nbar / nGW > 1) warnings.push(`n̄/n_GW = ${(nbar / nGW).toFixed(2)} > 1 — oberhalb der Greenwald-Dichte (empirische Grenze).`);
  if (q95 < 2) warnings.push('q95 < 2 — kink-instabiler Bereich (Indikator).');

  /* field maps for the cross-section */
  function fieldMap(kind) {
    const out = new Float32Array(nx * ny).fill(NaN);
    for (let c = 0; c < nx * ny; c++) {
      if (!finalMask[c]) continue;
      const x = xmin + (c % nx) * hx, y = y0 + Math.floor(c / nx) * hy, u = Psi[c] / psia;
      if (kind === 'Te') out[c] = T(P.Te0, u);
      else if (kind === 'Ti') out[c] = T(P.Ti0, u);
      else if (kind === 'n') out[c] = N(u);
      else if (kind === 'psiN') out[c] = 1 - u;
      else if (kind === 'j') out[c] = (psi0 / (MU0 * R0 ** 3)) * ((1 - A) * x * x + A) / x / 1e6;
      else if (kind === 'B') { psiG(x, y, D); const Bt = Ffun(D[0]) / (x * R0), Bp = psi0 / (R0 * R0) * Math.hypot(D[1], D[2]) / x; out[c] = Math.hypot(Bt, Bp); }
      else if (kind === 'p') out[c] = p0eq * u / 1e3;
    }
    return out;
  }

  /* separatrix / ψ=0 contour, restricted to the vessel */
  const keep = (x, y) => pointInPoly(x, y, vpolyN);
  const separatrix = marchingSquares(Psi, nx, ny, xmin, y0, hx, hy, 0, keep);
  const xpts = sc.xpts.map(([x, y]) => [x, y]);
  /* divertor strike points: horizontal line between X-point and vessel end */
  const strikes = [];
  for (const [xX, yX] of xpts) {
    const sgn = Math.sign(yX), H = ves.H / R0, yt = yX + sgn * 0.55 * (H - Math.abs(yX));
    if (psiF(xX, yt) >= 0) continue;
    for (const dir of [-1, 1]) { let x = xX, found = null;
      for (let s = 0; s < 400; s++) { const xn = x + dir * eps / 200; if (!pointInPoly(xn, yt, vpolyN)) break;
        if (psiF(xn, yt) >= 0) { found = xn; break; } x = xn; }
      if (found !== null) { psiG(found, yt, D); strikes.push({ x: found, y: yt, gx: D[1], gy: D[2], side: dir < 0 ? 'inner' : 'outer' }); } }
  }

  return {
    valid: true, params: { ...P }, warnings, A, psi0, psia, xa, ya,
    grid: { nx, ny, xmin, xmax, y0, ymax, hx, hy, Psi, mask: finalMask },
    vessel: ves, xpts, strikes, separatrix,
    surface, traceSurface, psiF, psiG, Ffun, fieldMap, qProfile, mid,
    profiles: { T, N },
    derived: {
      eps, aspect: R0 / a, V, Scs, p0: p0eq, pAvg, betaT, betaN, Wth, PhiT, PsiPol, q95, q0,
      kapEff, delEff, aEff, Rgeo, Raxis: xa * R0, Zaxis: ya * R0, shift: (xa * R0 - Rgeo) / a,
      BtAxis: Ffun(psia) / (xa * R0), BpAvg, Lb: bnd.L, nbar, nGW, fGW: nbar / nGW, cs, mach,
      Rin: xin * R0, Rout: xout * R0, BtIn: Ffun(0) / (xin * R0), BtOut: Ffun(0) / (xout * R0)
    }
  };
}

return { solve, MU0, KEV, vesselOutline };
})();
export default TokPhys;
