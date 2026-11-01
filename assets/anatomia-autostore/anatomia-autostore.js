// Anatomía de una instalación AutoStore — animación 3D por etapas.
// Todo el estado es función del tiempo global T (segundos): saltar a una etapa es fijar T.
import * as THREE from '../anatomia3d/vendor/three.module.min.js';
import { Tecnico, POSES } from './as3d-tecnico.js';
import * as W from './as3d-mundo.js';
import * as P from './as3d-piezas.js';
import { ETAPAS, S, HG, T_SALIDA, T_PUERTO0, N_PUERTO, G, CARGAS, compilar, estado, posEn, evaluar, ss, lerp, perfil, clamp01 } from './as3d-guiones.js';
export { ETAPAS };

const { R } = P;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const _v = V3(), _w = V3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = V3(), _p = V3();
const celda = ([i, j]) => [R.cx(i), R.cz(j)];
const lerpCelda = (a, b, u) => [lerp(R.cx(a[0]), R.cx(b[0]), u), lerp(R.cz(a[1]), R.cz(b[1]), u)];

// ---------- datos de la rejilla ----------
const PILA = []; // contenedores por celda (determinista); la celda-puerto (5,5) va vacía
for (let i = 0; i < R.NX; i++) for (let j = 0; j < R.NZ; j++) PILA.push(i === 5 && j === 5 ? 0 : i === 2 && j === 2 ? 12 : 13 + ((i * 5 + j * 3) % 4));
// Etapa 11: los contenedores entran por el puerto y los robots los apilan; la rejilla se llena del puerto hacia adentro.
// Dos robots hacen el ciclo real a la vista; el llenado del resto de la rejilla va acelerado (lapso) en el mismo orden de distancia al puerto.
const BINS = []; // {i, j, k, td}
{ const orden = []; for (let i = 0; i < R.NX; i++) for (let j = 0; j < R.NZ; j++) if (PILA[i * R.NZ + j]) orden.push([i, j, Math.abs(i - 5) + Math.abs(j - 5)]);
  orden.sort((a, b) => a[2] - b[2] || a[0] - b[0]);
  orden.forEach(([i, j], n) => { const c = PILA[i * R.NZ + j]; for (let k = 0; k < c; k++) BINS.push({ i, j, k, td: S[10] + 1.5 + n * (12.5 / orden.length) + k * (2.4 / c) }); }); }
const BIN_ESPECIAL = BINS.findIndex(b => b.i === 2 && b.j === 2 && b.k === 11);
const N_FIJOS = BINS.length, EXTRA = [N_FIJOS, N_FIJOS + 1, N_FIJOS + 2]; // contenedor en pinza de R0, de R1 y el del puerto
const cuenta = (i, j, T) => { let n = 0; for (const b of BINS) if (b.i === i && b.j === j && T >= b.td) n++; return n; }; // ponytail: lineal, 700 elementos
const D_CAVA = 5.88 - (R.binY(11) + .17); // descenso de pinza hasta el contenedor superior de la celda (2,2)
const LOOP = ETAPAS[11].d;
// programas de operación (τ dentro del ciclo): mv = celdas [a,b]; d = pinza [d0,d1]
const PROG = {
  0: { home: [3, 2], p: [{ t0: 0, t1: .5, mv: [[3, 2], [2, 2]] }, { t0: .5, t1: 1.5, d: [0, D_CAVA] }, { t0: 1.7, t1: 2.7, d: [D_CAVA, 0] }, { t0: 2.7, t1: 4.0, mv: [[2, 2], [5, 2]] }, { t0: 4.0, t1: 5.0, mv: [[5, 2], [5, 5]] }, { t0: 5.0, t1: 5.5, d: [0, .74] }, { t0: 5.7, t1: 6.2, d: [.74, 0] }, { t0: 6.2, t1: 7.2, mv: [[5, 5], [5, 2]] }, { t0: 7.2, t1: 8.4, mv: [[5, 2], [3, 2]] }] },
  1: { home: [4, 5], p: [{ t0: 10.0, t1: 10.4, mv: [[4, 5], [5, 5]] }, { t0: 10.4, t1: 10.9, d: [0, .74] }, { t0: 11.1, t1: 11.6, d: [.74, 0] }, { t0: 11.6, t1: 12.7, mv: [[5, 5], [2, 5]] }, { t0: 12.7, t1: 13.6, mv: [[2, 5], [2, 2]] }, { t0: 13.6, t1: 14.4, d: [0, D_CAVA] }, { t0: 14.5, t1: 15.3, d: [D_CAVA, 0] }, { t0: 15.3, t1: 16.2, mv: [[2, 2], [2, 5]] }, { t0: 16.2, t1: 17.1, mv: [[2, 5], [4, 5]] }] },
  2: { home: [1, 0], p: [] },
  3: { home: [2, 0], p: [{ t0: 2.0, t1: 3.0, mv: [[2, 0], [4, 0]] }, { t0: 3.0, t1: 4.0, mv: [[4, 0], [4, 1]] }, { t0: 6.0, t1: 7.0, mv: [[4, 1], [2, 1]] }, { t0: 7.0, t1: 7.6, mv: [[2, 1], [2, 0]] }] },
};
// etapa 10: la grúa deja los robots en la columna derecha y van solos a su posición de espera
const T_GRUA0 = 54.6, CICLO = 2.3;
const ENTRADA = [
  { celda: [7, 5], legs: [[56.9, 57.9, [7, 5], [5, 5]], [57.9, 58.3, [5, 5], [5, 4]]] },
  { celda: [7, 4], legs: [[59.2, 59.7, [7, 4], [6, 4]], [59.7, 60.1, [6, 4], [6, 5]]] },
  { celda: [7, 3], legs: [[61.5, 62.5, [7, 3], [7, 0]], [62.5, 64.6, [7, 0], [1, 0]]] },
  { celda: [7, 2], legs: [[63.8, 64.5, [7, 2], [7, 0]], [64.5, 66.3, [7, 0], [2, 0]]] },
];
// etapa 11: ciclos de almacenamiento (puerto → celda) de R0 (carril izquierdo) y R1 (carril derecho); el último de R0 termina en su casa de operación
const PUERTO_C = [5, 5];
const ALMACEN = [
  { rob: 0, t0: S[10] + 2.0, espera: [5, 4], metas: [[5, 3], [4, 4], [3, 4], [3, 2]], fin: true },
  { rob: 1, t0: S[10] + 4.0, espera: [6, 5], metas: [[6, 5], [7, 4], [6, 3]], casa: [4, 5] },
];
const PAL_ROB = [[7.5, 6.3], [7.5, 7.6]]; // tarimas de robots (dos por tarima)
const posRobotTarima = k => [PAL_ROB[k >> 1][0] + (k & 1 ? .28 : -.28), .18, PAL_ROB[k >> 1][1]];
const PAL_PUERTO = [2.6, 0, 2.6]; // tarima de contenedores vacíos junto al puerto
const posBinTarima = m => [PAL_PUERTO[0] + (m % 2 ? .33 : -.33), .18 + .155 + Math.floor(m / 4) * .31, PAL_PUERTO[2] + ((m >> 1) % 2 ? .24 : -.24)];
const PUERTO = [R.cx(5), 0, R.Z1];
const GAB = [4.3, 0, -1.72];

function ejecutar(prog, tau, home) {
  let pos = celda(home), d = 0;
  for (const s of prog) { if (tau < s.t0) break; const u = Math.min(1, (tau - s.t0) / (s.t1 - s.t0)); if (s.mv) pos = u >= 1 ? celda(s.mv[1]) : lerpCelda(s.mv[0], s.mv[1], perfil(u)); if (s.d) d = u >= 1 ? s.d[1] : lerp(s.d[0], s.d[1], ss(u, 0, 1)); }
  return { pos, d };
}

// ---------- construcción ----------
function construir(scene) {
  const Rz = {};
  W.nave(scene);
  // trazo en el piso: [x0,z0,x1,z1,ta,tb]
  Rz.trazos = [[-2.8, 1.5, 2.8, 1.5, 2.0, 4.6], [2.8, -1.5, -2.8, -1.5, 2.2, 4.8], [-2.8, -1.5, -2.8, 1.5, 4.2, 5.0], [2.8, 1.5, 2.8, -1.5, 4.6, 5.2]].map(([x0, z0, x1, z1, ta, tb]) => {
    const L = Math.hypot(x1 - x0, z1 - z0), g = new THREE.Group(); g.position.set(x0, .004, z0); g.rotation.y = Math.atan2(-(z1 - z0), x1 - x0);
    const m = W.caja(L, .003, .035, P.MA.tiza, L / 2, 0, 0, g); m.castShadow = false; g.ta = ta; g.tb = tb; g.visible = false; scene.add(g); return g;
  });
  Rz.laser = P.nivelLaser(); Rz.laser.position.set(4.2, 0, 4.6); W.sombra(.4, 0, 0, Rz.laser); scene.add(Rz.laser);
  // placas y columnas instanciadas
  Rz.placas = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .012, .16), P.MA.aluOsc, 63); Rz.cols = new THREE.InstancedMesh(new THREE.BoxGeometry(.045, R.HCOL, .045), P.MA.alu, 63);
  for (const im of [Rz.placas, Rz.cols]) { im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; scene.add(im); }
  Rz.nodos = []; for (let i = 0; i <= R.NX; i++) for (let j = 0; j <= R.NZ; j++) Rz.nodos.push({ x: R.X0 + i * R.PX, z: R.Z0 + j * R.PZ, tp: 5.3 + (8 - i) * .42 + j * .08, tc: 10.4 + i * .6 + j * .07 });
  // arriostres perimetrales (lado trasero, laterales) en la banda baja
  Rz.arr = [];
  const arr = (x0, z0, x1, z1, t) => { const o = W.barra(V3(x0, .25, z0), V3(x1, 1.75, z1), .014, P.MA.aluOsc, scene); o.visible = false; Rz.arr.push({ o, a: V3(x0, .25, z0), b: V3(x1, 1.75, z1), t }); };
  for (let i = 0; i < R.NX; i++) arr(R.X0 + i * R.PX, R.Z0, R.X0 + (i + 1) * R.PX, R.Z0, 13.5 + i * .35);
  for (let j = 0; j < R.NZ; j++) { arr(R.X0, R.Z0 + j * R.PZ, R.X0, R.Z0 + (j + 1) * R.PZ, 13.0 + j * .4); arr(R.X1, R.Z0 + j * R.PZ, R.X1, R.Z0 + (j + 1) * R.PZ, 14.0 + j * .4); }
  // rieles superiores
  Rz.rielesX = []; for (let j = 0; j <= R.NZ; j++) { const g = P.riel(R.NX * R.PX + .06); g.position.set(R.X0 - .03, R.HCOL, R.Z0 + j * R.PZ); g.t = 24.3 + j * .5; g.visible = false; scene.add(g); Rz.rielesX.push(g); }
  Rz.rielesZ = []; for (let i = 0; i <= R.NX; i++) { const g = P.riel(R.NZ * R.PZ + .06); g.position.set(R.X0 + i * R.PX, R.HCOL + .001, R.Z0 - .03); g.rotation.y = -Math.PI / 2; g.t = 27.6 + i * .22; g.visible = false; scene.add(g); Rz.rielesZ.push(g); }
  // mezzanine (deck separado: llega en el montacargas)
  Rz.mez = P.mezzanine(); Rz.mez.position.set(-3.75, 0, 0); scene.add(Rz.mez);
  Rz.deck = Rz.mez.deck; Rz.mez.remove(Rz.deck); scene.add(Rz.deck); Rz.deck.position.set(-3.75, HG - .26, 0); Rz.deck.visible = false;
  for (const o of [Rz.mez.cols, Rz.mez.bar, Rz.mez.esc]) o.visible = false;
  // cerramiento: paneles de malla y muro de servicio
  const pm = (x, z, w, ry, t, solido) => { const g = solido ? P.panelFachada(w, 2.4, P.MA.fachadaB) : P.panelMalla(w); g.position.set(x, 0, z); g.rotation.y = ry; g.t = t; g.visible = false; scene.add(g); return g; };
  Rz.mallas = [pm(-.7, 1.6, 1.4, 0, 33.4), pm(.35, 1.6, .7, 0, 33.9), pm(2.1, 1.6, 1.4, 0, 33.3), pm(2.9, -.75, 1.5, Math.PI / 2, 30.4), pm(2.9, .75, 1.5, Math.PI / 2, 30.9),
    pm(2.1, -1.6, 1.4, 0, 31.4), pm(.7, -1.6, 1.4, 0, 31.9), pm(-.7, -1.6, 1.4, 0, 32.4), pm(-2.1, -1.6, 1.4, 0, 32.9), pm(-2.9, -.75, 1.5, Math.PI / 2, 33.8, true), pm(-2.9, .75, 1.5, Math.PI / 2, 34.3, true)];
  Rz.panelCargado = P.panelMalla(1.4); Rz.panelCargado.visible = false; scene.add(Rz.panelCargado);
  // cubiertas exteriores
  const pf = (x, z, w, ry, t, m) => { const g = P.panelFachada(w, 5.5, m); g.position.set(x, 0, z); g.rotation.y = ry; g.t = t; g.visible = false; scene.add(g); return g; };
  Rz.fachadas = [pf(3.0, -.75, 1.5, Math.PI / 2, 35.3, P.MA.fachadaA), pf(3.0, .75, 1.5, Math.PI / 2, 36.1, P.MA.fachadaB), pf(2.1, -1.7, 1.4, 0, 37.4, P.MA.fachadaB), pf(.7, -1.7, 1.4, 0, 38.3, P.MA.fachadaA), pf(-.7, -1.7, 1.4, 0, 39.2, P.MA.fachadaB), pf(-2.1, -1.7, 1.4, 0, 40.1, P.MA.fachadaA)];
  // puerto, pantalla de pedestal, cargadores
  Rz.puerto = P.puerto(); Rz.puerto.visible = false; scene.add(Rz.puerto);
  Rz.elev = Rz.puerto.elev; Rz.puerto.remove(Rz.elev); scene.add(Rz.elev); Rz.elev.position.set(...PUERTO); Rz.elev.visible = false;
  Rz.hmi = W.pedestalHMI(); Rz.hmi.rotation.y = -Math.PI / 2; Rz.hmi.position.set(.75, 0, .95); Rz.puerto.add(Rz.hmi);
  Rz.cargadores = [0, 1, 2].map(i => { const g = P.cargador(); g.position.set(R.cx(i), HG, R.Z0 - .12); g.t = 44.3 + i * 1.4; g.visible = false; scene.add(g); return g; });
  // eléctrico: gabinete, charolas y cables
  Rz.gab = W.tablero(); Rz.gab.visible = false; scene.add(Rz.gab); W.sombra(.55, 0, 0, Rz.gab);
  const ch = (L, x, y, z, rz, ry, ta, tb) => { const g = W.charolaRecta(L); g.position.set(x, y, z); g.rotation.set(0, ry, rz); g.ta = ta; g.tb = tb; g.visible = false; scene.add(g); return g; };
  Rz.charolas = [ch(.95, 4.1, 1.78, -1.72, 0, Math.PI, 49.8, 50.2), ch(3.82, 3.15, 1.78, -1.72, Math.PI / 2, 0, 50.2, 50.8), ch(5.75, 3.15, 5.6, -1.72, 0, Math.PI, 50.8, 51.7),
    ch(3.28, 3.15, 5.6, -1.72, 0, -Math.PI / 2, 51.0, 51.6), ch(1.65, 3.15, 5.42, 1.56, 0, Math.PI, 51.6, 52.0), ch(3.78, 1.5, 1.64, 1.72, Math.PI / 2, 0, 52.0, 52.4)];
  const tubo = (pts, m, ta, tb) => { const c = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)), false, 'centripetal'); const t = new THREE.Mesh(new THREE.TubeGeometry(c, 200, .02, 7, false), m); t.castShadow = true; t.visible = false; t.ta = ta; t.tb = tb; scene.add(t); return t; };
  Rz.cables = [tubo([[4.3, 1.7, -1.72], [4.1, 1.82, -1.72], [3.2, 1.82, -1.72], [3.2, 2.6, -1.72], [3.2, 5.64, -1.72], [2.4, 5.64, -1.72], [-1.05, 5.64, -1.72], [-1.75, 5.64, -1.72], [-2.45, 5.64, -1.72], [-2.45, 5.5, -1.66]], W.M.cableA, 51.2, 52.8),
    tubo([[4.3, 1.7, -1.69], [4.1, 1.84, -1.69], [3.17, 1.84, -1.69], [3.17, 2.6, -1.69], [3.17, 5.64, -1.69], [3.17, 5.64, 1.0], [3.17, 5.6, 1.6], [2.4, 5.46, 1.6], [1.55, 5.46, 1.72], [1.55, 3.4, 1.74], [1.55, 1.7, 1.74], [1.3, 1.6, 1.74]], W.M.cableN, 51.6, 53.2)];
  // contenedores, robots, tarimas, grúa, montacargas, tijera
  Rz.bins = P.contenedores(BINS.length + 3); scene.add(Rz.bins);
  Rz.robots = [0, 1, 2, 3].map(k => { const r = P.robot(); const [x, y, z] = posRobotTarima(k); r.position.set(x, y, z); r.rotation.y = Math.PI / 2; r.visible = false; scene.add(r); return r; });
  Rz.palRob = PAL_ROB.map(([x, z]) => { const t = P.tarima(false); t.position.set(x, 0, z); t.visible = false; scene.add(t); return t; });
  Rz.palPuerto = P.tarima(false); Rz.palPuerto.position.set(...PAL_PUERTO); Rz.palPuerto.visible = false; scene.add(Rz.palPuerto);
  const matBin = new THREE.MeshStandardMaterial({ color: 0x7D8794, roughness: .62 });
  Rz.pilaPuerto = []; for (let m = 0; m < 12; m++) { const [x, y, z] = posBinTarima(m); const c = W.caja(.64, .31, .44, matBin, x - PAL_PUERTO[0], y, z - PAL_PUERTO[2], Rz.palPuerto); W.caja(.66, .03, .46, P.MA.aluOsc, x - PAL_PUERTO[0], y + .14, z - PAL_PUERTO[2], Rz.palPuerto).userData.bin = c; Rz.pilaPuerto.push(c); }
  Rz.grua = P.grua(6); Rz.grua.rotation.y = Math.PI; Rz.grua.visible = false; scene.add(Rz.grua); for (const o of Rz.grua.sueltos) { o.visible = false; scene.add(o); }
  Rz.mc = P.montacargas(); Rz.mc.visible = false; scene.add(Rz.mc);
  Rz.op = new Tecnico(); Rz.mc.add(Rz.op.root); Rz.op.root.position.copy(Rz.mc.asiento); Rz.op.root.rotation.y = Math.PI / 2; Rz.op.root.visible = true;
  Rz.tij = P.tijera(); Rz.tij.visible = false; scene.add(Rz.tij);
  Rz.lift = [-.45, .45].map(x => { const t = new Tecnico(); t.root.position.set(x, .06, 0); t.root.rotation.y = Math.PI; t.root.visible = true; Rz.tij.plat.add(t.root); return t; });
  // material en espera: caja de placas, tarima de paneles de malla, tarima de fachadas
  Rz.cajaPlacas = new THREE.Group(); W.caja(.6, .32, .4, W.M.madera ||= new THREE.MeshStandardMaterial({ color: 0xB08A5A, roughness: .9 }), 0, .16, 0, Rz.cajaPlacas); for (let m = 0; m < 4; m++) W.caja(.16, .012, .16, P.MA.aluOsc, -.18 + m * .12, .33 + (m % 2) * .012, 0, Rz.cajaPlacas); Rz.cajaPlacas.visible = false; scene.add(Rz.cajaPlacas);
  Rz.palMalla = P.tarima(false); Rz.palMalla.position.set(-4.4, 0, 5.0); for (let m = 0; m < 3; m++) W.caja(1.4, .05, 2.4, P.MA.aluOsc, 0, .2 + m * .06, 0, Rz.palMalla); scene.add(Rz.palMalla);
  Rz.palFach = P.tarima(false); Rz.palFach.position.set(6.4, 0, -3.4); for (let m = 0; m < 3; m++) W.caja(5.5, .05, 1.5, m % 2 ? P.MA.fachadaB : P.MA.fachadaA, 0, .2 + m * .06, 0, Rz.palFach); scene.add(Rz.palFach);
  // técnicos
  Rz.tecs = Object.fromEntries(Object.keys(G).map(k => { const t = new Tecnico(); W.sombra(.36, 0, 0, t.root); scene.add(t.root); return [k, t]; }));
  for (const k in G) compilar(G[k]);
  for (const c of CARGAS) { c.g1 = G[c.a]; c.g2 = G[c.b]; const [x1, z1] = posEn(c.g1, c.t1), [x2, z2] = posEn(c.g2, c.t1); c.off = [c.pos[0] - (x1 + x2) / 2, c.pos[1] - (z1 + z2) / 2]; }
  return Rz;
}

// ---------- estado en función de T ----------
const esc = (g, u, eje = 'x') => { g.visible = u > 0; g.scale[eje] = Math.max(.001, u); };
const ledsOp = (T) => T >= S[11];
function aplicar(Rz, T, dt, snap) {
  let et = 0; while (et < 11 && T >= S[et + 1]) et++;
  // etapa 1: trazo y láser
  for (const g of Rz.trazos) esc(g, ss(T, g.ta, g.tb));
  Rz.laser.visible = T < 64.5; Rz.laser.haz.visible = T < S[1]; Rz.laser.haz.rotation.y = T * 1.9;
  // etapa 2-3: placas y columnas instanciadas
  Rz.nodos.forEach((n, k) => {
    const up = ss(T, n.tp, n.tp + .4); _s.set(Math.max(.001, up), Math.max(.001, up), Math.max(.001, up)); _m.compose(_p.set(n.x, .006, n.z), _q, _s); Rz.placas.setMatrixAt(k, _m);
    const uc = ss(T, n.tc, n.tc + .7); _s.set(1, Math.max(.001, uc), 1); _m.compose(_p.set(n.x, .012 + R.HCOL / 2 * uc, n.z), _q, _s); Rz.cols.setMatrixAt(k, _m);
  });
  Rz.placas.instanceMatrix.needsUpdate = true; Rz.cols.instanceMatrix.needsUpdate = true;
  for (const a of Rz.arr) { const u = ss(T, a.t, a.t + .5); a.o.visible = u > 0; if (u > 0) W.ponerBarra(a.o, a.a, _v.lerpVectors(a.a, a.b, u), .014); }
  // etapa 5: rieles
  for (const g of Rz.rielesX) esc(g, ss(T, g.t, g.t + .6)); for (const g of Rz.rielesZ) esc(g, ss(T, g.t, g.t + .4));
  // etapa 4: mezzanine
  esc(Rz.mez.cols, ss(T, 17.2, 18.2), 'y'); esc(Rz.mez.bar, ss(T, 22.0, 23.0), 'y'); esc(Rz.mez.esc, ss(T, 22.4, 23.8), 'y');
  // montacargas: deck (17-24, desde la izquierda), puerto (41-47, desde el frente), gabinete (47-53, desde la derecha)
  const mc = Rz.mc; mc.visible = (T >= 17 && T < 24) || (T >= 41 && T < 45.8) || (T >= 47.6 && T < 51.8);
  let elev = .25, llevaDeck = false, llevaPuerto = false, llevaGab = false;
  if (T >= 17 && T < 24) {
    let x = -5.75; mc.rotation.y = 0; mc.position.z = .6;
    if (T < 19.4) { x = lerp(-14, -5.75, perfil((T - 17) / 2.4)); elev = .4; }
    else if (T < 21.0) elev = lerp(.4, 5.08, ss(T, 19.4, 21.0));
    else if (T < 21.9) elev = lerp(5.08, .3, ss(T, 21.1, 21.9));
    else { x = lerp(-5.75, -14, perfil(clamp01((T - 21.9) / 2.1), .15)); elev = .3; }
    mc.position.x = x; llevaDeck = T < 21.1;
  } else if (T >= 41 && T < 45.8) {
    let z = 3.71; mc.rotation.y = Math.PI / 2; mc.position.x = 1.05;
    if (T < 43.2) { z = lerp(10, 3.71, perfil((T - 41) / 2.2)); elev = .2; }
    else if (T < 43.8) elev = lerp(.2, 0, ss(T, 43.2, 43.8));
    else { z = lerp(3.71, 10, perfil(clamp01((T - 43.9) / 1.9), .15)); elev = 0; }
    mc.position.z = z; llevaPuerto = T < 43.8;
  } else if (T >= 47.6 && T < 51.8) {
    let x = 6.16; mc.rotation.y = Math.PI; mc.position.z = GAB[2];
    if (T < 49.4) { x = lerp(14, 6.16, perfil((T - 47.6) / 1.8)); elev = .2; }
    else if (T < 49.8) elev = lerp(.2, 0, ss(T, 49.4, 49.8));
    else { x = lerp(6.16, 14, perfil(clamp01((T - 50.0) / 1.8), .15)); elev = 0; }
    mc.position.x = x; llevaGab = T < 49.8;
  }
  if (mc.visible) { mc.position.y = 0; mc.setElev(elev); mc.updateMatrixWorld(true); Rz.op.pose(POSES.sentado, NaN, dt, snap, T); }
  const horq = () => mc.localToWorld(_v.set(2.0, elev + .04, 0));
  Rz.deck.visible = T >= 17; if (llevaDeck) { horq(); Rz.deck.position.set(_v.x, _v.y, 0); } else Rz.deck.position.set(-3.75, HG - .26, 0);
  esc(Rz.elev, ss(T, 41.2, 42.0), 'y');
  Rz.puerto.visible = T >= 41; if (llevaPuerto) { mc.localToWorld(_v.set(1.86, elev + .04, 0)); Rz.puerto.position.set(PUERTO[0], _v.y, _v.z - .35); } else Rz.puerto.position.set(...PUERTO);
  Rz.gab.visible = T >= 47.6; if (llevaGab) { mc.localToWorld(_v.set(1.86, elev + .04, 0)); Rz.gab.position.set(_v.x, _v.y, GAB[2]); } else Rz.gab.position.set(...GAB);
  // técnicos y cargas entre dos
  for (const k in G) evaluar(Rz.tecs[k], G[k], T, dt, snap, k === 'P' ? Infinity : T_SALIDA);
  for (const c of CARGAS) {
    const g = Rz[c.obj]; g.visible = T >= c.t0;
    if (T >= c.t1) { g.position.set(c.pos[0], 0, c.pos[1]); g.rotation.y = c.ry; continue; }
    const [x1, z1] = posEn(c.g1, T), [x2, z2] = posEn(c.g2, T);
    const y = Math.max(0, Math.min(Rz.tecs[c.a].pelvis.position.y, Rz.tecs[c.b].pelvis.position.y) - .82);
    g.position.set((x1 + x2) / 2 + c.off[0], lerp(y, 0, ss(T, c.t1 - .3, c.t1)), (z1 + z2) / 2 + c.off[1]); g.rotation.y = c.ry;
  }
  // etapas 6-7: cerramiento y cubiertas
  for (const g of Rz.mallas) esc(g, ss(T, g.t, g.t + .6), 'y'); for (const g of Rz.fachadas) esc(g, ss(T, g.t, g.t + .9), 'y');
  // etapa 8: cargadores; etapa 9: charolas, cables, gabinete
  for (const g of Rz.cargadores) { const u = ss(T, g.t, g.t + .4); g.visible = u > 0; g.scale.setScalar(Math.max(.001, u)); }
  for (const g of Rz.charolas) esc(g, ss(T, g.ta, g.tb));
  for (const c of Rz.cables) { const p = clamp01((T - c.ta) / (c.tb - c.ta)); c.visible = p > 0; c.geometry.setDrawRange(0, Math.floor(p * 200) * 42); }
  Rz.gab.puerta.rotation.y = 1.75 * (ss(T, 52.4, 53.2) - ss(T, 54.0, 54.8));
  Rz.gab.leds.forEach((l, i) => { l.material = T >= 53.0 && ((T * 3 + i * .7) % 2) < 1.3 ? W.M.ledOn : W.M.ledOff; });
  Rz.gab.pilotos[0].material = ledsOp(T) ? W.M.pilotoVOn : W.M.pilotoV; Rz.gab.pilotos[1].material = T >= 53.0 && !ledsOp(T) && (T * 2 % 1) < .5 ? W.M.ledOn : W.M.pilotoA;
  Rz.hmi.pantalla.material = Rz.puerto.pantalla.material = T >= 53.2 ? W.M.pantallaOn : W.M.pantallaOff;
  // material en espera: visible desde que la cámara mira a otro lado; se retira antes de la operación
  Rz.palMalla.visible = Rz.palFach.visible = T < 64.5; Rz.cajaPlacas.visible = Rz.cajaPlacas.visible && T < 64.5;
  for (const t of Rz.palRob) t.visible = T >= 18 && T < S[10]; Rz.palPuerto.visible = T >= 18;
  // grúa: entra en la etapa 10, iza los cuatro robots a la rejilla y se va
  const gr = Rz.grua; gr.visible = T >= 53.0 && T < 66.8; for (const o of gr.sueltos) o.visible = gr.visible;
  let hook = null, carga = null; // carga: índice de robot colgado
  if (gr.visible) {
    const gx = T < 54.4 ? lerp(16, 7.4, perfil(clamp01((T - 53.0) / 1.4))) : T < 64.2 ? 7.4 : lerp(7.4, 16, perfil(clamp01((T - 64.2) / 2.4), .15));
    gr.position.set(gx, 0, 2.4);
    const HB = HG + 2.0, reposo = [gx - 6, 3.5, 2.4];
    const seg = (t0, t1, a, b) => { const u = ss(T, t0, t1); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; };
    if (T < T_GRUA0) hook = reposo;
    else if (T < T_GRUA0 + 4 * CICLO) {
      const k = Math.min(3, Math.floor((T - T_GRUA0) / CICLO)), tau = T - T_GRUA0 - k * CICLO, tk = T_GRUA0 + k * CICLO;
      const [rx, ry, rz] = posRobotTarima(k), pick = [rx, ry + 1.32, rz], [tx, tz] = celda(ENTRADA[k].celda), place = [tx, HG + 1.32, tz];
      const prev = k === 0 ? [1.4, 3.5, 2.4] : (() => { const [px, pz] = celda(ENTRADA[k - 1].celda); return [px, HG + 1.32, pz]; })();
      if (tau < .6) { const u = ss(tau, 0, .6); hook = [lerp(prev[0], pick[0], u), lerp(prev[1], pick[1], u) + 2.6 * Math.sin(Math.PI * u), lerp(prev[2], pick[2], u)]; }
      else if (tau < .8) hook = pick;
      else if (tau < 1.3) { hook = seg(tk + .8, tk + 1.3, pick, [pick[0], HB, pick[2]]); carga = k; }
      else if (tau < 1.9) { hook = seg(tk + 1.3, tk + 1.9, [pick[0], HB, pick[2]], [place[0], HB, place[2]]); carga = k; }
      else if (tau < 2.2) { hook = seg(tk + 1.9, tk + 2.2, [place[0], HB, place[2]], place); carga = k; }
      else hook = place;
    } else { const [px, pz] = celda(ENTRADA[3].celda), fin = [px, HG + 1.32, pz]; hook = T < 64.2 ? seg(T_GRUA0 + 4 * CICLO, T_GRUA0 + 4 * CICLO + .6, fin, [px, HG + 2.6, pz]) : seg(64.2, 65.2, [px, HG + 2.6, pz], reposo); }
    gr.apuntar(hook[0], hook[2], hook[1]);
  }
  const anclasRob = [[-.3, .6, -.2], [.3, .6, -.2], [-.3, .6, .2], [.3, .6, .2]];
  // robots: en tarima, colgados, entrando, almacenando contenedores (etapa 11) o en operación
  const tau = ((T - S[11]) % LOOP + LOOP) % LOOP, op = T >= S[11], almacenando = T >= S[10] && !op;
  const enPinza = [null, null]; // contenedor colgado de la pinza de R0/R1 durante la etapa 11: [x,y,z]
  Rz.robots.forEach((rob, k) => {
    rob.visible = T >= 18; let d = 0;
    if (carga === k) { rob.position.set(hook[0], hook[1] - 1.32, hook[2]); rob.rotation.y = lerp(Math.PI / 2, 0, ss(T, T_GRUA0 + k * CICLO + 1.3, T_GRUA0 + k * CICLO + 1.9)); }
    else if (T < T_GRUA0 + k * CICLO + 2.2) { const [x, y, z] = posRobotTarima(k); rob.position.set(x, y, z); rob.rotation.y = Math.PI / 2; }
    else if (!op) {
      const e = ENTRADA[k]; let pos = celda(e.celda);
      for (const [t0, t1, a, b] of e.legs) { if (T < t0) break; pos = T >= t1 ? celda(b) : lerpCelda(a, b, perfil(clamp01((T - t0) / (t1 - t0)))); }
      const al = ALMACEN.find(a => a.rob === k);
      if (al && T >= al.t0 - .6) { // ciclo de almacenamiento de 4 s: puerto → celda meta → puerto
        const m = Math.max(0, Math.min(al.metas.length - 1, Math.floor((T - al.t0) / 4))), t = T - al.t0 - m * 4, meta = al.metas[m], ultimo = al.fin && m === al.metas.length - 1;
        const via = [meta[0], 5], L1 = Math.abs(meta[0] - 5) * R.PX, L2 = Math.abs(meta[1] - 5) * R.PZ, f1 = L1 + L2 > 0 ? L1 / (L1 + L2) : 0;
        const ida = u => u < f1 ? lerpCelda(PUERTO_C, via, f1 > 0 ? u / f1 : 1) : lerpCelda(via, meta, f1 < 1 ? (u - f1) / (1 - f1) : 1);
        const n = cuenta(meta[0], meta[1], al.t0 + m * 4 + 2.3), Dm = Math.max(.74, 5.88 - (R.binY(Math.min(n, 16)) + .17));
        if (T < al.t0) pos = lerpCelda(al.espera, PUERTO_C, ss(T, al.t0 - .6, al.t0 - .1));
        else if (t < .4) { pos = celda(PUERTO_C); d = lerp(0, .74, ss(t, 0, .4)); }
        else if (t < .5) { pos = celda(PUERTO_C); d = .74; }
        else if (t < .9) { pos = celda(PUERTO_C); d = lerp(.74, 0, ss(t, .5, .9)); }
        else if (t < 2.0) pos = ida(perfil((t - .9) / 1.1));
        else if (t < 2.6) { pos = celda(meta); d = lerp(0, Dm, ss(t, 2.0, 2.6)); }
        else if (t < 2.7) { pos = celda(meta); d = Dm; }
        else if (t < 3.2) { pos = celda(meta); d = lerp(Dm, 0, ss(t, 2.7, 3.2)); }
        else if (ultimo) pos = celda(meta);
        else if (t < 4.0) pos = ida(1 - perfil((t - 3.2) / .8));
        else pos = al.casa && m === al.metas.length - 1 ? lerpCelda(PUERTO_C, al.casa, ss(t, 4.0, 4.5)) : celda(PUERTO_C);
        if (t >= .45 && t < 2.65 && T >= al.t0) enPinza[k] = true;
      }
      rob.position.set(pos[0], HG, pos[1]); rob.rotation.y = 0;
    } else { const r = ejecutar(PROG[k].p, tau, PROG[k].home); rob.position.set(r.pos[0], HG, r.pos[1]); rob.rotation.y = 0; d = r.d; }
    rob.setPinza(d); rob.led.material = T >= T_GRUA0 + k * CICLO + 2.3 ? W.M.ledOn : W.M.ledOff;
    if (enPinza[k]) enPinza[k] = [rob.position.x, HG + rob.binY(), rob.position.z];
  });
  if (gr.visible) {
    const obj = carga !== null ? Rz.robots[carga] : null;
    gr.eslingas.forEach((e, k) => { e.visible = !!obj; if (obj) { obj.updateMatrixWorld(true); obj.localToWorld(_w.set(...anclasRob[k])); W.ponerBarra(e, _w, _v.set(hook[0], hook[1] - .42, hook[2]), .015); } });
  }
  // puerto en la etapa 11: el operador pone un contenedor vacío cada 2 s, el elevador lo sube y un robot lo toma
  let binPuerto = null, binEsp = null; const pu = Rz.puerto.position;
  if (almacenando) {
    const c = Math.floor((T - T_PUERTO0) / 2), phi = T - T_PUERTO0 - c * 2; // c = -1 … N_PUERTO-2 con contenedor
    const hay = c >= -1 && c < N_PUERTO - 1;
    const yC = phi < .3 ? lerp(4.8, .935, ss(phi, 0, .3)) : phi < .9 ? .935 : phi < 1.4 ? lerp(.935, 4.8, ss(phi, .9, 1.4)) : 4.8;
    Rz.puerto.carro.position.y = c < -1 ? .935 : c >= N_PUERTO - 1 ? (phi < .3 ? yC : .935) : yC;
    if (hay) {
      const m = 11 - (c + 1), [px, py, pz] = posBinTarima(m), tray = [pu.x, .94 + R.BH / 2, pu.z + .35];
      if (phi < .4) { const u = ss(phi, 0, .4); binPuerto = [lerp(px, tray[0], u), lerp(py, 1.05, u) + .25 * Math.sin(Math.PI * u), lerp(pz, tray[2], u)]; }
      else if (phi < .6) binPuerto = tray;
      else if (phi < .9) binPuerto = [pu.x, tray[1], lerp(pu.z + .35, pu.z - .25, ss(phi, .6, .9))];
      else binPuerto = [pu.x, yC + .015 + R.BH / 2, pu.z - .25];
    }
    Rz.pilaPuerto.forEach((b, m) => { const oculto = m >= 11 - (c + 1) && c >= -1 && m >= 12 - N_PUERTO; b.visible = !oculto; });
    Rz.puerto.luz.material = hay && phi >= 1.4 ? W.M.ledOn : W.M.ledOff;
    for (const cg of Rz.cargadores) cg.led.material = W.M.ledOn;
  } else Rz.pilaPuerto.forEach((b, m) => { b.visible = m < 12 - N_PUERTO || T < S[10]; });
  Rz.palPuerto.children.forEach(o => { if (o.userData.bin) o.visible = o.userData.bin.visible; });
  // operación: el contenedor especial viaja con los robots y el puerto
  if (op) {
    const r0 = Rz.robots[0], r1 = Rz.robots[1];
    if (tau < 1.6 || tau >= 14.45) binEsp = null;
    else if (tau < 5.6) binEsp = [r0.position.x, HG + r0.binY(), r0.position.z];
    else if (tau < 11.0) {
      const y = tau < 5.8 ? 4.8 : tau < 6.6 ? lerp(4.8, .935, ss(tau, 5.8, 6.6)) : tau < 9.2 ? .935 : tau < 10.0 ? lerp(.935, 4.8, ss(tau, 9.2, 10.0)) : 4.8;
      const z = tau < 6.6 ? -.25 : tau < 7.0 ? lerp(-.25, .35, ss(tau, 6.6, 7.0)) : tau < 8.8 ? .35 : tau < 9.2 ? lerp(.35, -.25, ss(tau, 8.8, 9.2)) : -.25;
      Rz.puerto.carro.position.y = y; binEsp = [pu.x, y + .015 + R.BH / 2, pu.z + z];
    } else binEsp = [r1.position.x, HG + r1.binY(), r1.position.z];
    Rz.puerto.luz.material = tau >= 5.6 && tau < 11.0 ? W.M.ledOn : W.M.ledOff;
    const Pp = Rz.tecs.P; Pp.pose(tau >= 7.0 && tau < 7.6 || tau >= 8.2 && tau < 8.8 ? POSES.bajar : tau >= 7.6 && tau < 8.2 ? POSES.cargar : POSES.observar, NaN, dt, snap, T);
    for (const cg of Rz.cargadores) cg.led.material = W.M.ledOn;
  } else if (!almacenando) { Rz.puerto.carro.position.y = 4.8; Rz.puerto.luz.material = W.M.ledOff; }
  // contenedores instanciados: los fijos aparecen en su celda al ritmo del llenado; los extra van en pinza o en el puerto
  BINS.forEach((b, n) => {
    if (T < b.td) { Rz.bins.poner(n, 0, 0, 0, 0); return; }
    const x = R.cx(b.i), z = R.cz(b.j), yf = R.binY(b.k);
    if (n === BIN_ESPECIAL && binEsp) { Rz.bins.poner(n, ...binEsp); return; }
    Rz.bins.poner(n, x, yf, z, ss(T, b.td, b.td + .25));
  });
  for (const k of [0, 1]) { const p = enPinza[k]; Rz.bins.poner(EXTRA[k], ...(p || [0, 0, 0]), p ? 1 : 0); }
  Rz.bins.poner(EXTRA[2], ...(binPuerto || [0, 0, 0]), binPuerto ? 1 : 0);
  Rz.bins.actualizar();
  // plataforma de tijera: frente (etapas 3 y 5), lado derecho y trasero (etapa 7), sale por atrás (etapa 8)
  const tj = Rz.tij; tj.visible = T >= 10 && T < 45.2; let th = 0;
  if (tj.visible) {
    let x = -2.8, z = 2.75, h = .8;
    if (T < 11) { x = lerp(-8.5, -2.8, perfil((T - 10) / 1)); }
    else if (T < 16.2) { h = lerp(.8, 4.2, ss(T, 11, 12)); x = lerp(-2.8, 2.8, clamp01((T - 12) / 4.2)); }
    else if (T < 22.5) { x = 2.8; h = lerp(4.2, 1.0, ss(T, 16.2, 17.0)); }
    else if (T < 24.2) { x = lerp(2.8, -2.8, perfil((T - 22.5) / 1.7)); h = 1.0; }
    else if (T < 30) { h = lerp(1.0, 4.4, ss(T, 24.2, 25.0)); x = lerp(-2.8, 2.8, clamp01((T - 25) / 4.6)); }
    else if (T < 31.5) { h = lerp(4.4, 1.0, ss(T, 30, 31)); x = lerp(2.8, 4.5, perfil((T - 30) / 1.5)); }
    else if (T < 33) { x = 4.5; z = lerp(2.75, .8, perfil((T - 31.5) / 1.5)); h = 1.0; th = -Math.PI / 2; }
    else if (T < 36.8) { x = 4.5; z = .8; h = lerp(1.0, 3.8, ss(T, 33, 35)); th = -Math.PI / 2; }
    else if (T < 38.4) { x = 4.5; z = lerp(.8, -3.0, perfil((T - 37.2) / 1.2)); h = lerp(3.8, 1.0, ss(T, 36.8, 37.4)); th = lerp(-Math.PI / 2, 0, ss(T, 37.6, 38.4)); }
    else if (T < 40) { z = -3.0; x = lerp(4.5, 1.0, perfil((T - 38.4) / 1.6)); h = lerp(1.0, 3.8, ss(T, 39.4, 40.4)); }
    else if (T < 42) { x = 1.0; z = -3.0; h = lerp(3.8, .8, ss(T, 41, 42)); }
    else if (T < 42.6) { x = 1.0; z = lerp(-3.0, -4.6, ss(T, 42, 42.6)); h = .8; }
    else { z = -4.6; x = lerp(1.0, 12.5, perfil(clamp01((T - 42.6) / 2.6), .15)); h = .8; }
    tj.position.set(x, 0, z); tj.setElev(h);
    Rz.lift[0].root.rotation.y = Math.PI + th; Rz.lift[1].root.rotation.y = Math.PI + th;
    Rz.lift[0].pose(h > 3 ? POSES.tocar : POSES.observar, NaN, dt, snap, T); Rz.lift[1].pose(h > 3 ? (Math.sin(T * .7) > 0 ? POSES.senalar : POSES.observar) : POSES.idle, NaN, dt, snap, T);
  }
  return et;
}

// ---------- cámara, UI y bucle ----------
const CAM = [ // [posición inicial, posición final (travelling lento), punto de mira]
  [[5.5, 2.8, 7.5], [4.8, 2.6, 6.9], [0, .4, .6]],
  [[3.2, 3.4, 6.2], [2.6, 3.2, 5.8], [0, .2, 0]],
  [[-3.5, 5.8, 10.5], [-4.3, 6.0, 10.0], [0, 2.6, -.3]],
  [[-2.0, 5.0, 10.5], [-2.6, 4.8, 10.0], [-3.8, 3.0, -.2]],
  [[3.2, 7.0, 10.0], [2.4, 6.8, 9.4], [0, 4.4, 0]],
  [[5.6, 3.6, 8.6], [5.0, 3.4, 8.0], [0, 1.6, 0]],
  [[8.0, 5.2, 7.6], [7.4, 5.0, 7.0], [.4, 2.8, -.6]],
  [[4.8, 4.4, 7.6], [4.2, 4.2, 7.2], [1.0, 1.4, 1.4]],
  [[7.2, 4.6, -4.6], [6.6, 4.4, -4.0], [3.6, 2.6, -1.0]],
  [[7.5, 7.0, 6.5], [6.9, 6.8, 6.0], [2.4, 5.2, .8]],
  [[3.0, 6.8, 8.8], [2.4, 6.6, 8.2], [1.0, 3.6, .6]],
  [[4.5, 7.6, 9.0], [3.6, 7.3, 8.6], [.3, 3.8, .3]],
];
const NAVE = { xMin: -19.4, xMax: 28, zMin: -6.6, zMax: 23, yMin: .8, yMax: 7.8 }; // la cámara nunca sale de la nave ni cruza el techo

export function iniciarAnatomiaAutoStore(root) {
  const stage = root.querySelector('.as3d-stage'), canvas = root.querySelector('canvas'), lista = root.querySelector('.as3d-steps'), replay = root.querySelector('.as3d-replay');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const movil = Math.min(innerWidth, innerHeight) < 700;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !movil, powerPreference: 'high-performance' }); } catch { stage.classList.add('is-fallback'); return; }
  let dprMax = movil ? 1.25 : 2; renderer.setPixelRatio(Math.min(devicePixelRatio, dprMax));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = movil ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xEEF1F4); scene.fog = new THREE.Fog(0xEEF1F4, 26, 54);
  scene.environment = W.entorno(renderer);
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0x7E8893, .5));
  const sol = new THREE.DirectionalLight(0xFFF3E6, 2.9); sol.position.set(7, 14, 8); sol.castShadow = true;
  sol.shadow.mapSize.setScalar(movil ? 1024 : 2048); Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 });
  sol.shadow.bias = -.0004; sol.shadow.normalBias = .03; scene.add(sol); scene.add(sol.target);
  const relleno = new THREE.DirectionalLight(0xDCE6F5, .55); relleno.position.set(-9, 8, -6); scene.add(relleno);
  const cam = new THREE.PerspectiveCamera(38, 1.6, .1, 80);
  const Rz = construir(scene);
  let T = 0, etapa = -1, snap = true, visible = false, raf = 0, ult = performance.now(), ema = .016, degradado = 0;
  const camPos = V3(), camLook = V3(), objPos = V3(), objLook = V3(), posB = V3();

  const botones = ETAPAS.map((e, i) => {
    const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button'; b.className = 'as3d-step'; b.style.setProperty('--c', e.c);
    b.innerHTML = `<span class="as3d-num" aria-hidden="true">${i + 1}</span><span class="as3d-txt"><strong>${e.n}</strong><span>${e.f}</span><i class="as3d-bar"></i></span>`;
    b.addEventListener('click', () => irA(i)); li.append(b); lista.append(li); return b;
  });
  replay?.addEventListener('click', () => irA(0));
  function irA(i) { T = S[i]; snap = true; if (quieto) paso(0); }
  function marcar(et, prog) {
    if (et !== etapa) { etapa = et; botones.forEach((b, i) => i === et ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); canvas.setAttribute('aria-label', `Anatomía de una instalación AutoStore. Etapa ${et + 1} de ${ETAPAS.length}: ${ETAPAS[et].n}. ${ETAPAS[et].f}`); }
    botones[et].style.setProperty('--p', (prog * 100).toFixed(1) + '%');
  }
  function ajustar() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  function paso(dt) {
    const et = aplicar(Rz, T, dt, snap);
    const prog = et === 11 ? ((T - S[11]) % ETAPAS[11].d) / ETAPAS[11].d : (T - S[et]) / ETAPAS[et].d; marcar(et, prog);
    const [p0, p1, l] = CAM[et]; objLook.set(...l); objPos.set(...p0); posB.set(...p1); objPos.lerp(posB, et === 11 ? .5 + .5 * Math.sin(T * .12) : prog);
    objPos.y += .08 * Math.sin(T * .3);
    if (cam.aspect < 1) { objPos.sub(objLook).multiplyScalar(Math.pow(1 / cam.aspect, .9)).add(objLook); objPos.y += .6; } // vertical: más lejos y un poco más alto
    objPos.x = Math.min(NAVE.xMax, Math.max(NAVE.xMin, objPos.x)); objPos.z = Math.min(NAVE.zMax, Math.max(NAVE.zMin, objPos.z)); objPos.y = Math.min(NAVE.yMax, Math.max(NAVE.yMin, objPos.y));
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
  if (quieto) { T = S[11] + 7.5; paso(0); }
  return { irA, S, get T() { return T; }, set T(v) { T = v; snap = true; }, paso: () => paso(0), R: Rz, cam, renderer, scene };
}
