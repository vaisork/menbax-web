// Anatomía de una instalación de transportadores — animación 3D por etapas.
// Todo el estado es función del tiempo global T (segundos): saltar a una etapa es fijar T.
import * as THREE from './vendor/three.module.min.js';
import { Tecnico, POSES } from './an3d-tecnico.js';
import * as W from './an3d-mundo.js';

export const ETAPAS = [
  { n: 'Patas y soportería', f: 'Se trazan, nivelan y anclan las patas al piso.', c: '#5B6B80', d: 6 },
  { n: 'Equipo', f: 'Tramos, curva y espiral se asientan sobre su soportería.', c: '#1F5FA8', d: 11 },
  { n: 'Eléctrico', f: 'Charola, cableado desde los motores y tablero.', c: '#D99A06', d: 8 },
  { n: 'Control', f: 'Sensores, PLC y HMI conectados y probados.', c: '#0F9D7A', d: 6.5 },
  { n: 'Operación', f: 'Las cajas circulan y los indicadores confirman el estado.', c: '#2E7D32', d: 9 },
];
const S = []; ETAPAS.reduce((a, e) => (S.push(a), a + e.d), 0); // inicio de cada etapa: 0, 6, 17, 25, 31.5
const clamp01 = v => Math.max(0, Math.min(1, v));
const ss = (t, a, b) => { const u = clamp01((t - a) / (b - a)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- geometría de la línea ----------
// Tramo 01 y 02 por z=0 hacia +x; curva 90° con centro (1,-1.6) que gira hacia -z; Tramo 04 por x=2.6 hasta la puerta de andén.
const RC = 1.6, CX = 1, CZ = -1.6;
const ESP = { cx: -6, cz: 1.2, r: 1.2, yTop: 3.3 };
const arco = th => [CX + RC * Math.cos(th), CZ + RC * Math.sin(th)];
const PLAT = { x: -3.1, z: 2.4, w: 2.2, d: 1.8, h: 3.14 }; // plataforma de alimentación junto al tramo elevado
const PATAS = [
  { x: -4.55, z: 2.4, ry: 0, alt: 3.14, g: .1, t: .8 },
  { x: 2.6, z: -2.2, ry: Math.PI / 2, t: 1.2 }, { x: 2.6, z: -4.2, ry: Math.PI / 2, t: 1.5 }, { x: 2.6, z: -6.2, ry: Math.PI / 2, t: 1.8 },
  { x: -5.6, z: 0, ry: 0, t: 1.8 }, { x: -2.1, z: 0, ry: 0, t: 2.3 }, { x: -2.9, z: 0, ry: 0, t: 2.8 },
  { x: arco(25 * Math.PI / 180)[0], z: arco(25 * Math.PI / 180)[1], ry: Math.PI / 2 - 25 * Math.PI / 180, t: 4.4 },
  { x: .6, z: 0, ry: 0, t: 4.6 },
  { x: arco(65 * Math.PI / 180)[0], z: arco(65 * Math.PI / 180)[1], ry: Math.PI / 2 - 65 * Math.PI / 180, t: 5.0 },
];

// ---------- guiones: {t, x, z, act, mira:[x,z], herr, carga, andar} ----------
const K = (t, x, z, o) => ({ t, x, z, ...o });
const AG = (m) => ({ act: 'agachado', herr: 1, mira: m });
const G = {
  A: [K(0, -9.5, -2.6), K(1.8, -5.6, -.95, { mira: [-5.6, 0] }), K(2.0, -5.6, -.95, AG([-5.6, 0])), K(3.6, -5.6, -.95, { mira: [-5.6, 0] }), K(3.8, -5.6, -.95),
    K(4.6, -2.9, -.95, { mira: [-2.9, 0] }), K(4.8, -2.9, -.95, AG([-2.9, 0])), K(5.4, -2.9, -.95, { mira: [-2.9, 0] }), K(5.5, -2.9, -.95),
    K(7.3, -5.3, -3.9, { act: 'cargar' }), K(7.5, -5.3, -3.9, { act: 'cargar', carga: 1 }), K(9.5, -5.3, -.55, { act: 'cargar', mira: [-5.3, 0] }), K(9.6, -5.3, -.55, { act: 'bajar', mira: [-5.3, 0] }),
    K(10.2, -5.3, -.55, { mira: [-5.3, 0] }), K(10.4, -5.3, -.55), K(11.0, -4.9, -1.3, { act: 'senalar', mira: [-5.1, 2.4] }), K(15.0, -4.9, -1.3, { act: 'senalar', mira: [-5.1, 2.4] }),
    K(16.0, -4.9, -1.3, { act: 'observar', mira: [-5.1, 2.4] }), K(17.2, -4.9, -1.3), K(18.0, -3.6, -.95, { act: 'agachado', mira: [-3.6, 0] }), K(19.6, -3.6, -.95, { mira: [-3.6, 0] }),
    K(19.8, -3.6, -.95), K(20.4, -.6, -.95, { act: 'agachado', mira: [-.6, 0] }), K(22.3, -.6, -.95, { mira: [-.6, 0] }), K(25.0, -.6, -.95), K(25.4, -1.6, -.95, { mira: [-1.6, 0] }),
    K(25.5, -1.6, -.95, { act: 'tocar', mira: [-1.6, 0] }), K(26.7, -1.6, -.95, { mira: [-1.6, 0] }), K(26.9, -1.6, -.95), K(28.3, -5.1, -.95, { mira: [-5.1, 0] }),
    K(28.4, -5.1, -.95, { act: 'tocar', mira: [-5.1, 0] }), K(29.6, -5.1, -.95, { mira: [-5.1, 0] }), K(31.6, -5.1, -.95), K(32.6, -4.6, -1.7, { act: 'observar', mira: [-3.5, 0] })],
  B: [K(0, -1, -5.2), K(2.2, -2.1, -.95, { mira: [-2.1, 0] }), K(2.4, -2.1, -.95, AG([-2.1, 0])), K(3.8, -2.1, -.95, { mira: [-2.1, 0] }), K(4.0, -2.1, -.95),
    K(4.7, .6, -.95, { mira: [.6, 0] }), K(4.8, .6, -.95, AG([.6, 0])), K(5.3, .6, -.95, { mira: [.6, 0] }), K(5.4, .6, -.95),
    K(7.4, -3.2, -3.9, { act: 'cargar' }), K(7.5, -3.2, -3.9, { act: 'cargar', carga: 1 }), K(9.5, -3.2, -.55, { act: 'cargar', mira: [-3.2, 0] }), K(9.6, -3.2, -.55, { act: 'bajar', mira: [-3.2, 0] }),
    K(10.2, -3.2, -.55, { mira: [-3.2, 0] }), K(10.4, -3.2, -.55), K(11.0, -3.4, -1.2, { act: 'senalar', mira: [-5.1, 2.4] }), K(15.0, -3.4, -1.2, { act: 'observar', mira: [-5.1, 2.4] }),
    K(17.2, -3.4, -1.2), K(18.6, .4, -1.5), K(19.8, 1.9, -2.6, { act: 'observar', mira: [1.9, -3.4] }), K(25.8, 1.9, -2.6, { act: 'tocar', mira: [1.9, -3.4] }), K(32.5, 1.9, -2.6, { act: 'observar', mira: [1.9, -3.4] })],
  C: [K(8.0, -3, -6.5), K(9.6, -1.8, -4.3, { act: 'cargar' }), K(10.0, -1.8, -4.3, { act: 'cargar', carga: 1 }), K(12.9, -1.8, -.55, { act: 'cargar', mira: [-1.8, 0] }), K(13.0, -1.8, -.55, { act: 'bajar', mira: [-1.8, 0] }),
    K(13.6, -1.8, -.55, { mira: [-1.8, 0] }), K(17.2, -1.8, -.55), K(18.4, -4.7, -1.6, { act: 'jalar', mira: [-4.3, 0] }), K(18.6, -4.7, -1.6, { andar: 'jalar' }), K(22.0, .9, -1.6, { andar: 'jalar' }),
    K(23.4, 1.4, -3.6, { andar: 'jalar' }), K(24.6, 1.9, -5.0, { mira: [1.0, -5.0] }), K(24.8, 1.9, -5.0, { act: 'agachado', mira: [1.0, -5.0] }), K(28.4, 1.9, -5.0, { mira: [1.0, -5.0] }),
    K(28.6, 1.9, -5.0, { act: 'tocar', mira: [1.0, -5.0] }), K(30.4, 1.9, -5.0, { act: 'observar', mira: [1.0, -5.0] }), K(31.8, 1.9, -5.0), K(32.6, 1.4, -6.1, { act: 'observar', mira: [2.6, -4.5] })],
  D: [K(8.0, 1.5, -6.5), K(9.8, .3, -3.2, { act: 'cargar' }), K(10.0, .3, -3.2, { act: 'cargar', carga: 1 }), K(12.9, .3, .55, { act: 'cargar', mira: [.3, 0] }), K(13.0, .3, .55, { act: 'bajar', mira: [.3, 0] }),
    K(13.6, .3, .55, { mira: [.3, 0] }), K(13.8, .3, .55), K(14.8, -3.0, 1.1), K(16.4, -4.0, 2.4, { mira: [-4.55, 2.4] }), K(16.6, -4.0, 2.4, { act: 'tocar', mira: [-4.55, 2.4] }), K(17.6, -4.0, 2.4, { mira: [-4.55, 2.4] }),
    K(17.8, -4.0, 2.4), K(18.8, -1.4, 1.3, { act: 'observar', mira: [-.75, 0] }), K(25.2, -1.4, 1.3), K(26.0, 3.6, 1.0), K(27.0, 3.3, -2.6, { mira: [2.6, -2.6] }), K(27.2, 3.3, -2.6, { act: 'tocar', mira: [2.6, -2.6] }),
    K(28.4, 3.3, -2.6, { mira: [2.6, -2.6] }), K(31.6, 3.3, -2.6), K(32.8, 4.4, -1.0, { act: 'observar', mira: [2.6, -3] })],
  E: [K(0, -9.5, 2.2), K(1.8, -5.6, .95, { act: 'senalar', mira: [-5.6, 0] }), K(2.4, -5.6, .95), K(3.4, -2.5, .95, { act: 'senalar', mira: [-2.1, 0] }), K(4.0, -2.5, .95),
    K(4.8, .6, .95, { act: 'senalar', mira: [.6, 0] }), K(5.2, .6, .95), K(6.4, 2.1, 2.4, { act: 'cargar' }), K(7.0, 2.1, 2.4, { act: 'cargar', carga: 1 }), K(9.8, 2.1, -2.6, { act: 'cargar', mira: [2.6, -2.6] }),
    K(9.9, 2.1, -2.6, { act: 'bajar', mira: [2.6, -2.6] }), K(10.5, 2.1, -2.6, { mira: [2.6, -2.6] }), K(10.7, 2.1, -2.6), K(11.6, 2.0, -.5), K(12.6, 3.04, 2.59, { act: 'cargar' }), K(13.0, 3.04, 2.59, { act: 'cargar', carga: 1 }),
    K(14.6, 1.2, .75, { act: 'cargar', mira: [1.6, -.6] }), K(14.7, 1.2, .75, { act: 'bajar', mira: [1.6, -.6] }), K(15.3, 1.2, .75, { mira: [1.6, -.6] }), K(17.6, 1.2, .75), K(18.2, -.2, .95, { act: 'agachado', mira: [-.2, 0] }),
    K(19.8, -.2, .95, { mira: [-.2, 0] }), K(24.0, -.2, .95), K(26.0, -2.2, 4.4, { act: 'observar', mira: [-1.5, 0] })],
  F: [K(0, 7, -2.2), K(1.8, 3.2, -2.2, { mira: [2.6, -2.2] }), K(2.0, 3.2, -2.2, AG([2.6, -2.2])), K(3.4, 3.2, -2.2, { mira: [2.6, -2.2] }), K(3.6, 3.2, -2.2),
    K(4.4, 3.2, -.6, { mira: [2.45, -.92] }), K(4.6, 3.2, -.6, AG([2.45, -.92])), K(5.6, 3.2, -.6, { mira: [2.45, -.92] }), K(5.7, 3.2, -.6), K(6.4, 3.1, .9, { act: 'cargar' }), K(7.0, 3.1, .9, { act: 'cargar', carga: 1 }),
    K(9.8, 3.1, -4.1, { act: 'cargar', mira: [2.6, -4.1] }), K(9.9, 3.1, -4.1, { act: 'bajar', mira: [2.6, -4.1] }), K(10.5, 3.1, -4.1, { mira: [2.6, -4.1] }), K(10.7, 3.1, -4.1), K(11.8, 4.6, -1.4),
    K(12.6, 5.14, .54, { act: 'cargar' }), K(13.0, 5.14, .54, { act: 'cargar', carga: 1 }), K(14.6, 3.3, -1.3, { act: 'cargar', mira: [2.2, -.9] }), K(14.7, 3.3, -1.3, { act: 'bajar', mira: [2.2, -.9] }),
    K(15.3, 3.3, -1.3, { mira: [2.2, -.9] }), K(17.4, 3.3, -1.3), K(18.6, 3.9, -5.6, { act: 'senalar', mira: [1.0, -5.0] }), K(21.0, 3.9, -5.6, { act: 'observar', mira: [1.0, -5.0] }), K(25.6, 3.9, -5.6),
    K(26.6, 5.4, -6.2, { act: 'observar', mira: [2.6, -4.2] })],
};
// objetos cargados entre dos técnicos: posición final y rotación; el desfase respecto al punto medio se calcula al compilar
const CARGAS = [
  { a: 'A', b: 'B', t0: 7.3, t1: 10.2, pos: [-4.25, 0], ry: 0, obj: 't01' },
  { a: 'C', b: 'D', t0: 9.6, t1: 13.6, pos: [-.75, 0], ry: 0, obj: 't02' },
  { a: 'E', b: 'F', t0: 6.4, t1: 10.5, pos: [2.6, -4.45], ry: Math.PI / 2, obj: 't04' },
  { a: 'E', b: 'F', t0: 12.6, t1: 15.3, pos: [CX, CZ], ry: 0, obj: 'curva' },
];

// perfil trapezoidal de velocidad: arranque y frenado suaves en cada recorrido
function perfil(x, r = .22) { const v = 1 / (1 - r); return x < r ? v * x * x / (2 * r) : x > 1 - r ? 1 - v * (1 - x) * (1 - x) / (2 * r) : v * (x - r / 2); }
function compilar(k) {
  let acum = 0;
  for (let i = 0; i < k.length; i++) {
    const a = k[i], b = k[i + 1]; a.acum = acum;
    a.len = b && b.t > a.t ? Math.hypot(b.x - a.x, b.z - a.z) : 0;
    a.dir = a.len > 1e-3 ? Math.atan2(b.x - a.x, b.z - a.z) : (k[i - 1]?.dir ?? 0);
    acum += a.len;
  }
  for (let i = 0; i < k.length;) { // recorridos: segmentos móviles consecutivos
    if (k[i].len <= 1e-3) { i++; continue; }
    let j = i; while (j < k.length - 1 && k[j].len > 1e-3) j++;
    const run = { i0: i, j, t0: k[i].t, t1: k[j].t, s0: k[i].acum, L: k[j].acum - k[i].acum };
    for (let m = i; m < j; m++) k[m].run = run; i = j;
  }
  return k;
}
function estado(k, T) { // {x, z, a, i, mov, s}
  if (T <= k[0].t) return { x: k[0].x, z: k[0].z, a: k[0], i: 0, mov: false };
  let i = 0; while (i < k.length - 1 && T >= k[i + 1].t) i++;
  const a = k[i];
  if (!a.run) return { x: a.x, z: a.z, a, i, mov: false };
  const r = a.run, s = r.L * perfil(clamp01((T - r.t0) / (r.t1 - r.t0)));
  let m = r.i0; while (m < r.j - 1 && k[m + 1].acum - r.s0 <= s) m++;
  const u = clamp01((s - (k[m].acum - r.s0)) / k[m].len);
  return { x: lerp(k[m].x, k[m + 1].x, u), z: lerp(k[m].z, k[m + 1].z, u), a: k[m], i: m, mov: true, s: r.s0 + s };
}
const posEn = (k, T) => { const e = estado(k, T); return [e.x, e.z]; };
function evaluar(tec, k, T, dt, snap) {
  if (T < k[0].t) { tec.root.visible = false; return; }
  tec.root.visible = true;
  const e = estado(k, T), a = e.a;
  let fase = NaN, face, act = a.act || 'idle';
  if (e.mov) { fase = e.s / 1.3 * Math.PI * 2; face = a.dir; act = a.carga ? 'cargar' : (a.andar || 'idle'); }
  else face = a.mira ? Math.atan2(a.mira[0] - a.x, a.mira[1] - a.z) : (e.i > 0 && k[e.i - 1].len > 1e-3 ? k[e.i - 1].dir : a.dir);
  tec.root.position.set(e.x, 0, e.z);
  if (snap) tec.root.rotation.y = face;
  else { let d = face - tec.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); tec.root.rotation.y += d * Math.min(1, dt * 8); }
  tec.taladro.visible = !!a.herr && !e.mov;
  tec.pose(POSES[act] || POSES.idle, fase, dt, snap, T);
}

// ---------- construcción ----------
function construir(scene) {
  const R = {};
  W.nave(scene);
  R.patas = PATAS.map(p => { const g = W.parPatas(p.alt ?? W.TOR - .16, .66, p.g ?? .07); g.position.set(p.x, 0, p.z); g.rotation.y = p.ry; g.visible = false; for (const s of [-1, 1]) W.sombra(.28, 0, s * .33, g); scene.add(g); return g; });
  R.plat = W.plataforma(PLAT.w, PLAT.d, PLAT.h); R.plat.position.set(PLAT.x, 0, PLAT.z); R.plat.visible = false; scene.add(R.plat);
  for (const x of [-PLAT.w / 2 + .05, PLAT.w / 2 - .05]) for (const z of [-PLAT.d / 2 + .05, PLAT.d / 2 - .05]) W.sombra(.3, x, z, R.plat);
  R.t01 = W.tramoRecto(3.5); R.t02 = W.tramoRecto(3.5); R.t04 = W.tramoRecto(5.7); R.curva = W.curva(RC, 0, Math.PI / 2);
  R.stub = W.tramoRecto(1.8);
  for (const g of [R.t01, R.t02, R.t04, R.curva, R.stub]) { g.visible = false; scene.add(g); }
  R.s01 = W.sensorPar(); R.s01.position.x = -.875; R.t01.add(R.s01);
  R.s02 = W.sensorPar(); R.s02.position.x = -.875; R.t02.add(R.s02);
  R.s04 = W.sensorPar(); R.s04.position.x = -1.85; R.s04.rotation.y = Math.PI; R.t04.add(R.s04);
  R.espiral = W.espiral({ r: ESP.r, yTop: ESP.yTop }); R.espiral.position.set(ESP.cx, 0, ESP.cz); R.espiral.visible = false; scene.add(R.espiral);
  R.grua = W.grua(6); R.grua.position.set(-11.5, 0, -1.0); R.grua.rotation.y = -.381; R.grua.pluma.rotation.z = .735; R.grua.visible = false; scene.add(R.grua);
  for (const o of [R.grua.cable, R.grua.gancho, ...R.grua.eslingas]) scene.add(o); // en coordenadas de mundo
  R.mc = W.montacargas(); R.mc.visible = false; scene.add(R.mc);
  R.op = new Tecnico(); R.mc.add(R.op.root); R.op.root.position.copy(R.mc.asiento); R.op.root.rotation.y = Math.PI / 2; R.op.root.visible = true;
  R.ch1 = W.charolaRecta(7); R.ch1.position.set(-6, .55, 0);
  R.chC = W.charolaCurva(RC, 0, Math.PI / 2); R.chC.position.set(CX, .55, CZ);
  R.ch4 = W.charolaRecta(5.4); R.ch4.position.set(2.6, .55, -1.6); R.ch4.rotation.y = Math.PI / 2;
  R.chL = W.charolaRecta(1.6); R.chL.position.set(2.6, .55, -4.6); R.chL.rotation.y = Math.PI;
  R.tab = W.tablero(); R.tab.position.set(1.0, 0, -5.0); W.sombra(.55, 0, 0, R.tab);
  R.hmi = W.pedestalHMI(); R.hmi.position.set(1.9, 0, -3.4); R.hmi.rotation.y = -Math.PI / 2; W.sombra(.25, 0, 0, R.hmi);
  for (const g of [R.ch1, R.chC, R.ch4, R.chL, R.tab, R.hmi]) { g.visible = false; scene.add(g); }
  const P = [[-4.25, .58, 0], [-3, .58, 0], [-1.6, .58, 0], [-.75, .58, 0], [.2, .58, 0], [1, .58, 0]];
  for (const d of [75, 60, 45, 30, 15]) { const [x, z] = arco(d * Math.PI / 180); P.push([x, .58, z]); }
  P.push([2.6, .58, -1.6], [2.6, .58, -2.5], [2.6, .58, -3.4], [2.6, .58, -4.3], [2.6, .58, -4.6], [2.0, .58, -4.6], [1.4, .58, -4.6], [1.1, .63, -4.85], [1.05, .69, -5.0]);
  R.cables = [[0, W.M.cableA], [.05, W.M.cableN]].map(([o, m]) => {
    const c = new THREE.CatmullRomCurve3(P.map(p => V3(p[0] + o, p[1], p[2] - o)), false, 'centripetal');
    const geo = new THREE.TubeGeometry(c, 240, .022, 8, false); const t = new THREE.Mesh(geo, m); t.castShadow = true; t.visible = false; scene.add(t); return t;
  });
  R.fracArco = (() => { const L = R.cables[0].geometry.parameters.path.getLengths(240); let best = 0, bd = 1e9; const pts = R.cables[0].geometry.parameters.path.getSpacedPoints(240); pts.forEach((p, i) => { const d = Math.hypot(p.x - .9, p.z); if (d < bd) { bd = d; best = i; } }); return L[best] / L[240]; })();
  R.tecs = Object.fromEntries(Object.keys(G).map(k => { const t = new Tecnico(); W.sombra(.36, 0, 0, t.root); scene.add(t.root); return [k, t]; }));
  for (const k in G) compilar(G[k]);
  for (const c of CARGAS) { c.g1 = G[c.a]; c.g2 = G[c.b]; const [x1, z1] = posEn(c.g1, c.t1), [x2, z2] = posEn(c.g2, c.t1); c.off = [c.pos[0] - (x1 + x2) / 2, c.pos[1] - (z1 + z2) / 2]; }
  // surtido: tarima con cajas y operador sobre la plataforma
  R.tarima = W.tarima(true); R.tarima.position.set(-3.0, PLAT.h, 2.1); R.tarima.rotation.y = Math.PI / 2; R.tarima.visible = false; scene.add(R.tarima);
  R.picker = new Tecnico(); R.picker.root.position.set(-3.55, PLAT.h, 3.0); scene.add(R.picker.root);
  // camino de cajas: tarima → tramo elevado → espiral → tramos → curva → tramo 04 → andén
  const pts = [V3(-3.0, PLAT.h + .73, 2.1), V3(-3.45, PLAT.h + .8, 2.3), V3(-3.95, PLAT.h + .5, 2.4), V3(-4.25, ESP.yTop, 2.4), V3(-5.95, ESP.yTop, 2.4)]; const e = R.espiral;
  for (let i = 0; i <= 96; i++) { const th = e.th0 + (e.th1 - e.th0) * i / 96; pts.push(V3(ESP.cx + e.r * Math.cos(th), e.yAt(th), ESP.cz + e.r * Math.sin(th))); }
  pts.push(V3(1, W.TOR, 0)); for (let i = 1; i <= 24; i++) { const [x, z] = arco(Math.PI / 2 - Math.PI / 2 * i / 24); pts.push(V3(x, W.TOR, z)); } pts.push(V3(2.6, W.TOR, -7.9));
  const acum = [0]; for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  R.camino = { pts, acum, total: acum.at(-1) };
  R.cajas = [[.42, .3, .34], [.5, .34, .4], [.36, .26, .3], [.46, .4, .38], [.4, .3, .4], [.52, .3, .36], [.38, .28, .32], [.44, .32, .36]].map((d, i) => { const c = W.cajaCarton(...d); c.visible = false; c.s0 = i * R.camino.total / 8; scene.add(c); return c; });
  return R;
}

// ---------- estado en función de T ----------
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function aplicar(R, T, dt, snap) {
  const et = T >= S[4] ? 4 : T >= S[3] ? 3 : T >= S[2] ? 2 : T >= S[1] ? 1 : 0;
  PATAS.forEach((p, i) => { const g = R.patas[i], u = ss(T, p.t, p.t + .5); g.visible = T >= p.t; g.position.y = (1 - u) * .3; g.scale.y = .5 + .5 * u; });
  { const u = ss(T, .8, 1.4); R.plat.visible = T >= .8; R.plat.position.y = (1 - u) * .3; R.plat.scale.y = .5 + .5 * u; }
  for (const k in G) evaluar(R.tecs[k], G[k], T, dt, snap);
  R.op.pose(POSES.sentado, NaN, dt, snap, T);
  for (const c of CARGAS) {
    const g = R[c.obj]; g.visible = T >= c.t0;
    if (T >= c.t1) { g.position.set(c.pos[0], 0, c.pos[1]); g.rotation.y = c.ry; continue; }
    const [x1, z1] = posEn(c.g1, T), [x2, z2] = posEn(c.g2, T);
    const y = Math.max(0, Math.min(R.tecs[c.a].pelvis.position.y, R.tecs[c.b].pelvis.position.y) - .82);
    g.position.set((x1 + x2) / 2 + c.off[0], lerp(y, 0, ss(T, c.t1 - .3, c.t1)), (z1 + z2) / 2 + c.off[1]); g.rotation.y = c.ry;
  }
  // grúa y espiral
  const gr = R.grua; gr.visible = T >= 6 && T < 16.5; R.espiral.visible = T >= 6;
  for (const o of [gr.cable, gr.gancho, ...gr.eslingas]) o.visible = gr.visible;
  if (gr.visible) {
    const drive = ss(T, 12.8, 16.5); gr.position.set(-11.5 - 4.7 * drive, 0, -1.0 - 1.9 * drive);
    gr.pluma.rotation.z = .735 + .3 * ss(T, 12.6, 15);
    gr.updateMatrixWorld(true);
    const yEsp = lerp(1.3, 0, ss(T, 6.5, 10.5)); R.espiral.position.y = yEsp; R.espiral.rotation.y = .02 * Math.sin(T * 1.3) * (1 - ss(T, 10.3, 10.6));
    const tip = gr.punta.getWorldPosition(_v); const hookY = lerp(yEsp + 4.5, tip.y - .35, ss(T, 11.2, 12.6));
    gr.gancho.position.set(tip.x, hookY, tip.z); W.ponerBarra(gr.cable, tip, gr.gancho.position, .02);
    gr.eslingas.forEach((e, k) => { e.visible = T < 11.2; if (e.visible) { R.espiral.updateMatrixWorld(true); R.espiral.localToWorld(_w.copy(R.espiral.puntoRim(k))); W.ponerBarra(e, _w.clone(), V3(tip.x, hookY - .45, tip.z), .015); } });
    gr.pistonTop.getWorldPosition(_w); gr.worldToLocal(_w); W.ponerBarra(gr.piston, gr.pistonBase, _w, .09);
  } else { R.espiral.position.y = 0; R.espiral.rotation.y = 0; }
  // montacargas: llega por el frente (z=6.2), eleva el tramo a la plataforma y sale hacia -x
  const mc = R.mc; mc.visible = T >= 7 && T < 20.6;
  if (mc.visible) {
    let x = -5.1, z = 6.2, ry = Math.PI / 2, elev = .25;
    if (T < 10) { x = lerp(6, -5.1, perfil((T - 7) / 3)); ry = Math.PI; }
    else if (T < 10.8) ry = lerp(Math.PI, Math.PI / 2, ss(T, 10, 10.8));
    else if (T < 11.8) z = lerp(6.2, 4.1, ss(T, 10.8, 11.8));
    else if (T < 16) { z = 4.1; elev = lerp(.25, 3.10, ss(T, 12, 14.6)) - .06 * ss(T, 15.6, 15.9); }
    else if (T < 17) { z = lerp(4.1, 6.2, ss(T, 16, 17)); elev = 3.04; }
    else if (T < 17.8) { ry = lerp(Math.PI / 2, Math.PI, ss(T, 17, 17.8)); elev = lerp(3.04, .25, ss(T, 17, 17.8)); }
    else { x = lerp(-5.1, -15, perfil(clamp01((T - 17.8) / 2.8), .15)); ry = Math.PI; }
    mc.position.set(x, 0, z); mc.rotation.y = ry; mc.setElev(elev); mc.updateMatrixWorld(true);
    R.stub.visible = true;
    if (T < 15.6) { mc.localToWorld(_v.set(1.7, 0, 0)); R.stub.position.set(_v.x, elev + .04 - .74, _v.z); R.stub.rotation.y = ry + Math.PI / 2; }
    else { R.stub.position.set(-5.1, 2.4, 2.4); R.stub.rotation.y = 0; }
  } else { R.stub.visible = T >= 15.6; R.stub.position.set(-5.1, 2.4, 2.4); R.stub.rotation.y = 0; }
  // eléctrico
  const esc = (g, u, eje = 'x') => { g.visible = u > 0; g.scale[eje] = Math.max(.001, u); };
  esc(R.ch1, ss(T, 17.3, 18.8)); esc(R.chC, ss(T, 18.8, 19.3), 'y'); esc(R.ch4, ss(T, 19.3, 20.3)); esc(R.chL, ss(T, 20.3, 21.0));
  const ut = ss(T, 19.3, 19.9); R.tab.visible = ut > 0; R.tab.scale.setScalar(Math.max(.001, ut));
  R.cables.forEach((c, i) => { const t0 = 18.6 + i * .4, f1 = R.fracArco; const p = T < 22 + i * .4 ? lerp(0, f1, clamp01((T - t0) / 3.4)) : lerp(f1, 1, clamp01((T - 22 - i * .4) / 4.4)); c.visible = p > 0; c.geometry.setDrawRange(0, Math.floor(p * 240) * 48); });
  // control
  const sens = (s, ta, ton) => { s.visible = T >= ta; s.led.material = T >= ton ? W.M.ledOn : W.M.ledOff; };
  sens(R.s02, 25.8, 26.3); sens(R.s04, 27.5, 28.0); sens(R.s01, 28.7, 29.2);
  const uh = ss(T, 25.2, 25.7); R.hmi.visible = uh > 0; R.hmi.scale.setScalar(Math.max(.001, uh)); R.hmi.pantalla.material = T >= 26.4 ? W.M.pantallaOn : W.M.pantallaOff;
  R.tab.puerta.rotation.y = 1.75 * (ss(T, 28.6, 29.4) - ss(T, 30.6, 31.4)); // abre hacia afuera (+x), donde está el técnico
  R.tab.leds.forEach((l, i) => { l.material = T >= 29.6 && ((T * 3 + i * .7) % 2) < 1.3 ? W.M.ledOn : W.M.ledOff; });
  R.tab.pilotos[0].material = T >= S[4] + .3 ? W.M.pilotoVOn : W.M.pilotoV;
  R.tab.pilotos[1].material = T >= 26.4 && T < S[4] && (T * 2 % 1) < .5 ? W.M.ledOn : W.M.pilotoA;
  // operación: surtido, cajas y rodillos
  const op = T >= S[4], cam = R.camino, s = (T - S[4]) * 1.0;
  R.tarima.visible = op; R.picker.root.visible = op;
  let dLider = 9;
  for (const c of R.cajas) {
    const d = (s + c.s0) % cam.total;
    c.visible = op && d > .12 && d < cam.total - .25; // dentro de la tarima o del andén no se ve: nunca se desvanece en el aire
    if (!c.visible) continue;
    if (d < 1.3) dLider = Math.min(dLider, d);
    let j = 1; while (cam.acum[j] < d) j++;
    const a = cam.pts[j - 1], b = cam.pts[j], u = (d - cam.acum[j - 1]) / (cam.acum[j] - cam.acum[j - 1]);
    c.position.lerpVectors(a, b, u); c.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); c.scale.setScalar(1);
  }
  if (op) { // operador de surtido: gira de la tarima al tramo siguiendo la caja que acaba de tomar
    const k = dLider < 9 ? ss(dLider, .15, 1.1) : 1; const haciaTarima = Math.atan2(-3.0 + 3.55, 2.1 - 3.0), haciaTramo = Math.atan2(-4.25 + 3.55, 2.4 - 3.0);
    R.picker.root.rotation.y = lerp(haciaTarima, haciaTramo, k);
    R.picker.pose(dLider < 9 && dLider < .5 ? POSES.bajar : POSES.cargar, NaN, dt, snap, T);
    const w = dt * 8; for (const g of [R.t01, R.t02, R.t04, R.stub]) for (const r of g.rodillos) r.rotation.z -= w; for (const r of R.curva.rodillos) r.rotation.x -= w; // ponytail: giro visual, no la velocidad real
  }
  return et;
}

// ---------- cámara, UI y bucle ----------
const CAM = [ // [posición inicial, posición final (travelling lento), punto de mira]
  [[0.8, 3.8, -6.4], [0.2, 3.5, -6.0], [-3.0, .5, .4]],
  [[2.4, 6.6, 14.4], [1.4, 6.2, 13.6], [-5.2, 1.6, .6]],
  [[8.8, 4.9, 6.2], [8.0, 4.4, 5.2], [.2, .6, -1.9]],
  [[7.6, 3.6, .4], [6.9, 3.3, -.5], [1.9, .9, -3.4]],
  [[4.2, 6.6, 12.8], [3.2, 6.2, 12.2], [-2.2, 1.0, -.6]],
];

export function iniciarAnatomia3D(root) {
  const stage = root.querySelector('.an3d-stage'), canvas = root.querySelector('canvas'), lista = root.querySelector('.an3d-steps'), replay = root.querySelector('.an3d-replay');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const movil = Math.min(innerWidth, innerHeight) < 700;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch { stage.classList.add('is-fallback'); return; }
  let dprMax = movil ? 1.5 : 2; renderer.setPixelRatio(Math.min(devicePixelRatio, dprMax));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xEEF1F4); scene.fog = new THREE.Fog(0xEEF1F4, 24, 52);
  scene.environment = W.entorno(renderer);
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0x7E8893, .5));
  const sol = new THREE.DirectionalLight(0xFFF3E6, 2.9); sol.position.set(7, 14, 8); sol.castShadow = true;
  sol.shadow.mapSize.setScalar(movil ? 1024 : 2048); Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 });
  sol.shadow.bias = -.0004; sol.shadow.normalBias = .03; scene.add(sol); scene.add(sol.target);
  const relleno = new THREE.DirectionalLight(0xDCE6F5, .55); relleno.position.set(-9, 8, -6); scene.add(relleno);
  const cam = new THREE.PerspectiveCamera(38, 1.6, .1, 80);
  const R = construir(scene);
  let T = 0, etapa = -1, snap = true, visible = false, raf = 0, ult = performance.now(), ema = .016, degradado = 0;
  const camPos = V3(), camLook = V3(), objPos = V3(), objLook = V3(), posB = V3();

  const botones = ETAPAS.map((e, i) => {
    const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button'; b.className = 'an3d-step'; b.style.setProperty('--c', e.c);
    b.innerHTML = `<span class="an3d-num" aria-hidden="true">${i + 1}</span><span class="an3d-txt"><strong>${e.n}</strong><span>${e.f}</span><i class="an3d-bar"></i></span>`;
    b.addEventListener('click', () => irA(i)); li.append(b); lista.append(li); return b;
  });
  replay?.addEventListener('click', () => irA(0));
  function irA(i) { T = S[i]; snap = true; if (quieto) paso(0); }
  function marcar(et, prog) {
    if (et !== etapa) { etapa = et; botones.forEach((b, i) => i === et ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); canvas.setAttribute('aria-label', `Anatomía de una instalación de transportadores. Etapa ${et + 1} de 5: ${ETAPAS[et].n}. ${ETAPAS[et].f}`); }
    botones[et].style.setProperty('--p', (prog * 100).toFixed(1) + '%');
  }
  function ajustar() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  function paso(dt) {
    const et = aplicar(R, T, dt, snap);
    const prog = et === 4 ? ((T - S[4]) % ETAPAS[4].d) / ETAPAS[4].d : (T - S[et]) / ETAPAS[et].d; marcar(et, prog);
    const [p0, p1, l] = CAM[et]; objLook.set(...l); objPos.set(...p0); posB.set(...p1); objPos.lerp(posB, et === 4 ? .5 + .5 * Math.sin(T * .12) : prog);
    objPos.y += .08 * Math.sin(T * .3);
    if (cam.aspect < 1) objPos.sub(objLook).multiplyScalar(Math.pow(1 / cam.aspect, .95)).add(objLook);
    objPos.y = Math.min(objPos.y, 8.6); // siempre bajo el techo
    objPos.z = Math.max(objPos.z, -6.6); objPos.x = Math.max(objPos.x, -19.6); // siempre dentro de los muros (en móvil la cámara se aleja)
    if (snap) { camPos.copy(objPos); camLook.copy(objLook); } else { const k = 1 - Math.exp(-dt * 1.4); camPos.lerp(objPos, k); camLook.lerp(objLook, k); }
    cam.position.copy(camPos); cam.lookAt(camLook);
    renderer.render(scene, cam); snap = false;
  }
  function calidad(dt) { // calidad adaptativa: si el cuadro tarda, baja resolución y sombras
    ema += (dt - ema) * .05;
    if (ema > .03 && degradado < 2) { degradado++; dprMax = degradado === 1 ? 1.25 : 1; renderer.setPixelRatio(Math.min(devicePixelRatio, dprMax)); ajustar();
      if (degradado === 2) { renderer.shadowMap.type = THREE.PCFShadowMap; sol.shadow.mapSize.setScalar(1024); sol.shadow.map?.dispose(); sol.shadow.map = null; renderer.shadowMap.needsUpdate = true; } ema = .016; }
  }
  function bucle(now) {
    raf = 0; if (!visible || document.hidden) return;
    const dt = Math.min(.05, (now - ult) / 1000); ult = now; T += dt; calidad(dt);
    paso(dt); raf = requestAnimationFrame(bucle);
  }
  function arrancar() { if (raf || quieto) return; ult = performance.now(); raf = requestAnimationFrame(bucle); }
  new ResizeObserver(() => { ajustar(); if (quieto) paso(0); }).observe(stage);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) arrancar(); }, { threshold: .1 }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) arrancar(); });
  ajustar();
  if (quieto) { T = S[4] + 4; paso(0); }
  return { irA, get T() { return T; }, set T(v) { T = v; snap = true; }, paso: () => paso(0), R, cam, renderer, scene };
}
