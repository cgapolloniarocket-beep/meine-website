// Solve the spherical-tokamak equilibrium once and store the traced flux
// surface for the Technology page. Run after changing the inputs in
// src/lib/tokamak/trace.js:   node scripts/precompute-fieldlines.mjs
import { writeFileSync } from 'node:fs';
import TokPhys from '../src/lib/tokamak/physics.js';
import { computeTrace } from '../src/lib/tokamak/trace.js';

const out = new URL('../src/lib/tokamak/st-trace.json', import.meta.url);
const trace = computeTrace(TokPhys);
writeFileSync(out, JSON.stringify(trace));
console.log(`st-trace.json: q = ${trace.m}/${trace.T}, psiN = ${trace.psiN}, ${trace.pts.length} points`);
