// Piezas AutoStore: rejilla, contenedores, robots, puerto, cargadores, mezzanine, paneles, tijera, nivel láser, grúa con giro y montacargas alto.
// Unidades en metros. La rejilla ocupa x∈[X0,X1], z∈[Z0,Z1]; el frente (puerto, cámara) está hacia +z.
import * as THREE from '../anatomia3d/vendor/three.module.min.js';
import { M, caja, barra, ponerBarra, tarima } from './as3d-mundo.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .2, ...o });
export const MA = {
  alu: std(0xCBD2D9, { roughness: .28, metalness: .85 }),
  aluOsc: std(0x9AA3AC, { roughness: .35, metalness: .8 }),
  robot: std(0xD7262E, { roughness: .35, metalness: .15 }),
  robotTapa: std(0x1E2228, { roughness: .5, metalness: .3 }),
  rueda: std(0x2A2E33, { roughness: .8 }),
  bin: std(0xFFFFFF, { roughness: .62, metalness: .05 }),      // el gris va por instancia
  binRim: std(0xFFFFFF, { roughness: .5, metalness: .1 }),
  malla: new THREE.MeshStandardMaterial({ color: 0xB9C2CC, transparent: true, opacity: .3, roughness: .6, metalness: .3, side: THREE.DoubleSide, depthWrite: false }),
  fachadaA: std(0x2F4562, { roughness: .45, metalness: .1 }),
  fachadaB: std(0xE1E5EA, { roughness: .5 }),
  puerto: std(0xE8EBEE, { roughness: .45 }),
  puertoOsc: std(0x3A4149, { roughness: .5, metalness: .3 }),
  laser: new THREE.MeshBasicMaterial({ color: 0xFF3B3B, transparent: true, opacity: .85 }),
  tiza: new THREE.MeshBasicMaterial({ color: 0xF7F9FB }),
  cargador: std(0xF2B705, { roughness: .6 }),
  deck: std(0x8A96A3, { roughness: .7, metalness: .5 }),
};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cil = (r, h, m, seg = 12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); o.castShadow = true; return o; };

// ---------- rejilla ----------
export const R = { NX: 8, NZ: 6, PX: .7, PZ: .5, X0: -2.8, Z0: -1.5, HCOL: 5.3, HG: 5.38, BH: .31, BY0: .1 };
R.X1 = R.X0 + R.NX * R.PX; R.Z1 = R.Z0 + R.NZ * R.PZ;
R.cx = i => R.X0 + (i + .5) * R.PX; R.cz = j => R.Z0 + (j + .5) * R.PZ;
R.binY = k => R.BY0 + (k + .5) * R.BH; // centro del contenedor del nivel k (0 = abajo)

export function columna() { const g = new THREE.Group(); caja(.045, R.HCOL, .045, MA.alu, 0, R.HCOL / 2, 0, g); return g; }
export function placa() {
  const g = new THREE.Group(); caja(.16, .012, .16, MA.aluOsc, 0, .006, 0, g);
  for (const s of [-1, 1]) { const t = cil(.012, .03, M.tornillo, 8); t.position.set(s * .055, .02, -s * .055); g.add(t); }
  return g;
}
export function arriostre(L) { // diagonal entre dos columnas; origen en el extremo inferior, +x local hacia el otro extremo
  const g = new THREE.Group(); caja(L, .03, .03, MA.aluOsc, L / 2, 0, 0, g); return g;
}
export function riel(L) { // perfil de rodadura a lo largo de +x local, origen en el extremo inicial
  const g = new THREE.Group(); caja(L, .08, .06, MA.alu, L / 2, .04, 0, g);
  for (const s of [-1, 1]) caja(L, .012, .012, MA.aluOsc, L / 2, .082, s * .024, g);
  return g;
}

// Contenedores instanciados: cuerpo y ceja superior comparten matriz (la ceja se desplaza en y).
export function contenedores(n) {
  const cuerpo = new THREE.InstancedMesh(new THREE.BoxGeometry(.64, R.BH, .44), MA.bin, n);
  const ceja = new THREE.InstancedMesh(new THREE.BoxGeometry(.66, .03, .46), MA.binRim, n);
  for (const im of [cuerpo, ceja]) { im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; }
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) { const v = ((i * 7919) % 11) / 11; c.setRGB(.49 + v * .06, .53 + v * .06, .58 + v * .06); cuerpo.setColorAt(i, c); c.multiplyScalar(.82); ceja.setColorAt(i, c); }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V(1, 1, 1), p = V();
  const g = new THREE.Group(); g.add(cuerpo, ceja); g.cuerpo = cuerpo; g.ceja = ceja;
  g.poner = (i, x, y, z, k = 1) => { // k: escala (0 = oculto)
    s.set(k, k, k);
    m.compose(p.set(x, y, z), q, s); cuerpo.setMatrixAt(i, m);
    m.compose(p.set(x, y + R.BH / 2 - .015, z), q, s); ceja.setMatrixAt(i, m);
  };
  g.actualizar = () => { cuerpo.instanceMatrix.needsUpdate = true; ceja.instanceMatrix.needsUpdate = true; };
  return g;
}

// Robot: origen en el nivel de rodadura (tope del riel). Cuerpo rojo, tapa negra, 4 ruedas en X y 4 en Y, pinza con 4 cables.
export function robot() {
  const g = new THREE.Group();
  caja(.66, .5, .46, MA.robot, 0, .31, 0, g);
  caja(.68, .05, .48, MA.robotTapa, 0, .585, 0, g);
  caja(.2, .012, .12, MA.robotTapa, -.15, .616, .1, g); // tapa de servicio
  g.led = caja(.06, .012, .06, M.ledOff, .24, .616, -.16, g);
  const rx = new THREE.CylinderGeometry(.06, .06, .035, 14); rx.rotateX(Math.PI / 2); // eje z: rueda en X
  const rz = new THREE.CylinderGeometry(.06, .06, .035, 14); rz.rotateZ(Math.PI / 2); // eje x: rueda en Y
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a = new THREE.Mesh(rx, MA.rueda); a.position.set(sx * .22, .06, sz * .245); a.castShadow = true; g.add(a);
    const b = new THREE.Mesh(rz, MA.rueda); b.position.set(sx * .345, .06, sz * .15); b.castShadow = true; g.add(b);
  }
  g.placa = caja(.6, .03, .4, MA.robotTapa, 0, .5, 0, g);
  g.anclas = [[-.26, -.17], [.26, -.17], [-.26, .17], [.26, .17]];
  g.cables = g.anclas.map(() => barra(V(), V(0, 1, 0), .006, M.gruaOsc, g));
  const a = V(), b = V();
  g.setPinza = d => { // d = descenso de la pinza desde su posición recogida (dentro del cuerpo)
    const y = .5 - d; g.placa.position.y = y;
    g.cables.forEach((c, k) => { const [x, z] = g.anclas[k]; ponerBarra(c, a.set(x, .5, z), b.set(x, y, z), .006); c.visible = d > .02; });
  };
  g.setPinza(0);
  g.binY = () => g.placa.position.y - .015 - R.BH / 2; // centro del contenedor colgado de la placa
  return g;
}

// Puerto: origen en x = centro de la celda-puerto, z = borde frontal de la rejilla, y = piso. El mueble queda hacia +z.
export function puerto() {
  const g = new THREE.Group();
  const el = g.elev = new THREE.Group(); g.add(el); // elevador dentro de la celda-puerto: se instala aparte del mueble
  for (const sx of [-1, 1]) caja(.03, R.HCOL - .4, .03, MA.aluOsc, sx * .33, (R.HCOL - .4) / 2 + .2, -.03, el);
  g.carro = caja(.66, .03, .46, MA.puertoOsc, 0, 4.8, -.25, el);
  caja(.9, .9, .7, MA.puerto, 0, .45, .35, g);
  caja(.84, .04, .62, MA.puertoOsc, 0, .92, .35, g); // bandeja
  for (const sx of [-1, 1]) caja(.05, .64, .7, MA.puerto, sx * .425, 1.26, .35, g);
  caja(.9, .06, .7, MA.puerto, 0, 1.61, .35, g);
  caja(.9, .7, .03, MA.puerto, 0, .59, -.015, g); // tapa trasera bajo la rejilla
  // pantalla al frente sobre el dintel
  const p = new THREE.Group(); p.position.set(0, 1.86, .55); p.rotation.x = -.25; g.add(p);
  caja(.5, .3, .04, M.plc, 0, 0, 0, p); g.pantalla = caja(.44, .24, .006, M.pantallaOff, 0, 0, .022, p);
  caja(.04, .2, .04, M.plc, 0, -.22, -.06, g).position.y = 1.72;
  // botonera y torre de luz
  caja(.16, .08, .03, M.plc, .3, 1.1, .71, g);
  const bv = cil(.018, .02, M.pilotoVOn, 10); bv.rotation.x = Math.PI / 2; bv.position.set(.26, 1.1, .73); g.add(bv);
  const br = cil(.018, .02, M.pilotoR, 10); br.rotation.x = Math.PI / 2; br.position.set(.34, 1.1, .73); g.add(br);
  const poste = cil(.015, .3, M.gruaOsc, 8); poste.position.set(-.4, 1.79, .35); g.add(poste);
  g.luz = cil(.04, .09, M.ledOff, 12); g.luz.position.set(-.4, 1.985, .35); g.add(g.luz);
  const tapa = cil(.045, .015, M.gruaOsc, 12); tapa.position.set(-.4, 2.04, .35); g.add(tapa);
  g.binTray = V(0, .94 + R.BH / 2, .35); // centro del contenedor en la bandeja (local)
  g.binCarro = y => V(0, y + .015 + R.BH / 2, -.25);
  return g;
}

export function cargador() { // en el borde trasero; el contacto mira a +z (hacia el robot estacionado)
  const g = new THREE.Group();
  caja(.22, .3, .1, M.plc, 0, .15, -.05, g); caja(.14, .12, .02, MA.cargador, 0, .14, .005, g);
  g.led = caja(.03, .03, .01, M.ledOff, .07, .26, .005, g);
  caja(.26, .02, .14, MA.aluOsc, 0, .01, -.07, g);
  return g;
}

// ---------- mezzanine con escalera de dos tramos ----------
function barandal(L, g, x, y, z, ry, hueco) { // hueco: [a,b] en coordenada local a lo largo del barandal donde no hay barandal
  const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; g.add(p);
  const tramos = hueco ? [[-L / 2, hueco[0]], [hueco[1], L / 2]] : [[-L / 2, L / 2]];
  for (const [a, b] of tramos) {
    if (b - a < .05) continue; const c = (a + b) / 2, l = b - a;
    caja(l, .05, .04, M.amarillo, c, 1.08, 0, p); caja(l, .04, .03, M.amarillo, c, .55, 0, p); caja(l, .12, .03, M.amarillo, c, .06, 0, p);
    const n = Math.max(1, Math.round(l / 1.2)); for (let k = 0; k <= n; k++) caja(.05, 1.1, .05, M.amarillo, a + l * k / n, .55, 0, p);
  }
  return p;
}
function tramoEscalera(g, x, z0, z1, y0, y1, ancho = .9) {
  const run = z1 - z0, rise = y1 - y0, n = Math.max(3, Math.round(Math.abs(rise) / .18)), ang = Math.atan2(rise, run), L = Math.hypot(run, rise);
  for (let k = 0; k < n; k++) caja(ancho, .035, Math.abs(run) / n + .03, M.galv, x, y0 + rise * (k + 1) / n, z0 + run * (k + .5) / n, g);
  for (const s of [-1, 1]) {
    const st = caja(.04, .22, L, M.pata, x + s * (ancho / 2 + .02), (y0 + y1) / 2 - .05, (z0 + z1) / 2, g); st.rotation.x = -ang;
    const hr = caja(.04, .04, L, M.amarillo, x + s * (ancho / 2 + .06), (y0 + y1) / 2 + .95, (z0 + z1) / 2, g); hr.rotation.x = -ang;
    for (const u of [.04, .5, .96]) caja(.04, .95, .04, M.amarillo, x + s * (ancho / 2 + .06), y0 + rise * u + .5, z0 + run * u, g);
  }
}
export function mezzanine() { // origen en el piso, centro de la plataforma; W en x, D en z; escalera por el lado -x
  const g = new THREE.Group(); const W = 1.7, D = 4.0, H = R.HG;
  const cols = g.cols = new THREE.Group(); g.add(cols);
  for (const x of [-W / 2 + .06, W / 2 - .06]) for (const z of [-D / 2 + .06, 0, D / 2 - .06]) { caja(.12, H - .06, .12, M.pata, x, (H - .06) / 2, z, cols); caja(.26, .02, .26, M.pata, x, .01, z, cols); }
  for (const z of [-D / 2 + .06, D / 2 - .06]) caja(W - .12, .12, .06, M.pata, 0, 1.6, z, cols);
  // deck con origen en su cara inferior (y = H-.26 en reposo) para poder llevarlo en el montacargas
  const deck = g.deck = new THREE.Group(); deck.position.y = H - .26; g.add(deck);
  caja(W, .06, D, MA.deck, 0, .23, 0, deck);
  for (const z of [-D / 2 + .06, 0, D / 2 - .06]) caja(W, .2, .08, M.pata, 0, .1, z, deck);
  for (const x of [-W / 2 + .06, W / 2 - .06]) caja(.08, .2, D, M.pata, x, .1, 0, deck);
  const bar = g.bar = new THREE.Group(); bar.position.y = H; g.add(bar); // barandal relativo al deck: crece desde la plataforma
  barandal(D, bar, -W / 2, 0, 0, Math.PI / 2, [-2.0, -1.1]); // lado exterior -x; hueco en z∈[1.1,2.0] para la escalera
  barandal(W, bar, 0, 0, -D / 2, 0); barandal(W, bar, 0, 0, D / 2, 0);
  const esc = g.esc = new THREE.Group(); g.add(esc);
  const xe = -W / 2 - .55; // centro de la escalera (x = -4.3 en mundo con la plataforma en -3.75)
  tramoEscalera(esc, xe, 1.6, -2.0, 0, H / 2);
  caja(.95, .06, .95, M.galv, xe, H / 2 - .03, -2.5, esc); // descanso bajo
  for (const [x, z] of [[xe - .45, -2.95], [xe + .45, -2.95], [xe - .45, -2.05]]) caja(.08, H / 2, .08, M.pata, x, H / 4, z, esc);
  barandal(.95, esc, xe, H / 2, -2.98, 0); barandal(.95, esc, xe - .5, H / 2, -2.5, Math.PI / 2);
  tramoEscalera(esc, xe, -2.0, 1.2, H / 2, H);
  caja(.95, .06, .8, M.galv, xe, H - .03, 1.6, esc); // descanso alto que conecta con el hueco del barandal
  for (const [x, z] of [[xe - .45, 1.95], [xe + .45, 1.95]]) caja(.08, H, .08, M.pata, x, H / 2, z, esc);
  barandal(.95, esc, xe, H, 2.0, 0); barandal(.8, esc, xe - .5, H, 1.6, Math.PI / 2);
  g.W = W; g.D = D; g.xe = xe;
  return g;
}

// ---------- cerramiento ----------
export function panelMalla(w, h = 2.4) { // origen abajo al centro, plano x-y (mira a ±z)
  const g = new THREE.Group();
  for (const s of [-1, 1]) caja(.04, h, .04, MA.aluOsc, s * (w / 2 - .02), h / 2, 0, g);
  caja(w, .04, .04, MA.aluOsc, 0, h - .02, 0, g); caja(w, .06, .04, MA.aluOsc, 0, .03, 0, g);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w - .08, h - .1), MA.malla); m.position.set(0, h / 2, 0); m.receiveShadow = true; g.add(m);
  return g;
}
export function panelFachada(w, h, mat) {
  const g = new THREE.Group(); caja(w, h, .05, mat, 0, h / 2, 0, g);
  for (const u of [.34, .67]) caja(w, .015, .056, MA.aluOsc, 0, h * u, 0, g);
  return g;
}

// ---------- plataforma de tijera ----------
export function tijera() {
  const g = new THREE.Group(); const Lb = 1.3, NP = 4;
  caja(1.5, .32, .95, M.grua, 0, .3, 0, g); caja(.4, .3, .3, M.gruaOsc, -.55, .6, 0, g);
  const geoLl = new THREE.CylinderGeometry(.15, .15, .14, 14); geoLl.rotateX(Math.PI / 2);
  for (const x of [-.58, .58]) for (const z of [-.5, .5]) { const l = new THREE.Mesh(geoLl, M.llanta); l.position.set(x, .15, z); l.castShadow = true; g.add(l); }
  const plat = g.plat = new THREE.Group(); g.add(plat);
  caja(1.8, .06, .95, M.gruaOsc, 0, .03, 0, plat);
  for (const s of [-1, 1]) { barandal(1.8, plat, 0, .06, s * .455, 0); barandal(.95, plat, s * .88, .06, 0, Math.PI / 2); }
  caja(.3, .25, .12, M.gruaOsc, .6, .95, .5, plat); // consola de mando
  g.brazos = [];
  for (let i = 0; i < NP; i++) for (const sz of [-.42, .42]) g.brazos.push([caja(Lb, .05, .04, M.grua, 0, 0, sz, g), caja(Lb, .05, .04, M.grua, 0, 0, sz + .045, g), i, sz]);
  g.setElev = h => {
    const dy = (h - .46) / NP, th = Math.asin(clamp(dy / Lb, .05, .97));
    plat.position.y = h;
    for (const [b1, b2, i] of g.brazos) { const cy = .46 + (i + .5) * dy; b1.position.y = b2.position.y = cy; b1.rotation.z = th; b2.rotation.z = -th; }
  };
  g.setElev(.8);
  return g;
}

// ---------- nivel láser en trípode ----------
export function nivelLaser() {
  const g = new THREE.Group();
  for (let k = 0; k < 3; k++) { const a = k * 2.094; barra(V(0, 1.25, 0), V(.45 * Math.cos(a), 0, .45 * Math.sin(a)), .012, M.gruaOsc, g); }
  caja(.1, .04, .1, M.gruaOsc, 0, 1.26, 0, g);
  const cab = cil(.07, .14, M.grua, 16); cab.position.y = 1.35; g.add(cab);
  const len = cil(.075, .03, M.lente, 16); len.position.y = 1.43; g.add(len);
  g.haz = caja(7, .005, .005, MA.laser, 0, 1.43, 0, g); g.haz.castShadow = false;
  return g;
}

// ---------- grúa con torreta giratoria ----------
export function grua(L = 6) {
  const g = new THREE.Group(); const LB = g.LB = L * 1.4;
  caja(3.6, .5, 1.5, M.gruaOsc, 0, .75, 0, g);
  const geoLl = new THREE.CylinderGeometry(.42, .42, .32, 18); geoLl.rotateX(Math.PI / 2);
  for (const x of [-1.25, 1.25]) for (const z of [-.8, .8]) { const l = new THREE.Mesh(geoLl, M.llanta); l.position.set(x, .42, z); l.castShadow = true; g.add(l); const rin = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .34, 12), M.acero); rin.rotation.x = Math.PI / 2; rin.position.copy(l.position); g.add(rin); }
  for (const z of [-1, 1]) for (const x of [-1.3, 1.3]) { caja(.3, .2, 1.4, M.grua, x, .7, z * 1.1, g); caja(.45, .08, .45, M.gruaOsc, x, .04, z * 1.85, g); const c = cil(.08, .62, M.acero, 10); c.position.set(x, .39, z * 1.85); g.add(c); }
  const up = g.sup = new THREE.Group(); up.position.y = 1.12; g.add(up);
  const tor = cil(.75, .25, M.grua, 24); up.add(tor);
  caja(1.0, .95, 1.0, M.grua, .9, .6, .8, up); caja(.03, .5, .8, M.lente, 1.42, .7, .8, up); caja(.6, .5, .03, M.lente, .9, .7, 1.3, up);
  caja(1.3, .7, 1.3, M.gruaOsc, -1.5, .45, 0, up);
  const pl = g.pluma = new THREE.Group(); pl.position.set(0, .3, 0); up.add(pl);
  caja(L, .34, .34, M.grua, L / 2, 0, 0, pl); caja(L * .7, .26, .26, M.grua, L * 1.05, 0, 0, pl); caja(.3, .4, .3, M.gruaOsc, LB, 0, 0, pl);
  g.punta = new THREE.Object3D(); g.punta.position.set(LB, 0, 0); pl.add(g.punta);
  g.piston = barra(V(), V(0, 1, 0), .09, M.acero, up); g.pistonBase = V(.9, -.05, -.35); g.pistonTop = new THREE.Object3D(); g.pistonTop.position.set(L * .45, -.17, -.35); pl.add(g.pistonTop);
  g.cable = barra(V(), V(0, 1, 0), .02, M.gruaOsc); g.gancho = new THREE.Group();
  caja(.16, .26, .16, M.gruaOsc, 0, -.13, 0, g.gancho);
  const an = new THREE.Mesh(new THREE.TorusGeometry(.11, .028, 8, 18, Math.PI * 1.5), M.acero); an.position.y = -.4; an.rotation.z = Math.PI * .75; g.gancho.add(an);
  g.eslingas = [0, 1, 2, 3].map(() => barra(V(), V(0, 1, 0), .015, M.gruaOsc));
  g.sueltos = [g.cable, g.gancho, ...g.eslingas]; // en coordenadas de mundo: el llamador los agrega a la escena
  const _p = V(), _w = V();
  // orienta torreta y pluma para que la punta quede exactamente sobre (hx, hz); coloca gancho y cable; devuelve la altura de la punta
  g.apuntar = (hx, hz, hy) => {
    g.updateMatrixWorld(true); up.getWorldPosition(_p);
    const dx = hx - _p.x, dz = hz - _p.z, r = clamp(Math.hypot(dx, dz), LB * Math.cos(1.33), LB * Math.cos(.4));
    up.rotation.y = Math.atan2(-dz, dx) - g.rotation.y; pl.rotation.z = Math.acos(r / LB);
    g.updateMatrixWorld(true);
    g.punta.getWorldPosition(_w); g.gancho.position.set(_w.x, hy, _w.z); ponerBarra(g.cable, _w, g.gancho.position, .02);
    g.pistonTop.getWorldPosition(_p); up.worldToLocal(_p); ponerBarra(g.piston, g.pistonBase, _p, .09);
    return _w.y;
  };
  return g;
}

// ---------- montacargas con mástil triple (alcanza la rejilla) ----------
export function montacargas() {
  const g = new THREE.Group();
  caja(1.9, .55, 1.1, M.grua, -.1, .6, 0, g); caja(.7, .7, 1.0, M.gruaOsc, -1.1, .75, 0, g); caja(.5, .3, .9, M.gruaOsc, -1.25, 1.2, 0, g);
  caja(1.2, .05, 1.0, M.gruaOsc, .2, .48, 0, g); caja(.6, .55, .9, M.grua, -.45, 1.0, 0, g);
  caja(.45, .08, .5, M.gruaOsc, -.45, 1.05, 0, g); caja(.08, .3, .45, M.gruaOsc, -.3, 1.35, 0, g);
  const geoLl = new THREE.CylinderGeometry(.3, .3, .26, 16); geoLl.rotateX(Math.PI / 2);
  const geoLt = new THREE.CylinderGeometry(.24, .24, .22, 16); geoLt.rotateX(Math.PI / 2);
  for (const [x, z, geo] of [[.55, -.62, geoLl], [.55, .62, geoLl], [-.95, -.55, geoLt], [-.95, .55, geoLt]]) {
    const l = new THREE.Mesh(geo, M.llanta); l.position.set(x, geo === geoLl ? .3 : .24, z); l.castShadow = true; g.add(l);
    const rin = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .28, 10), M.acero); rin.rotation.x = Math.PI / 2; rin.position.copy(l.position); g.add(rin);
  }
  for (const x of [.45, -.75]) for (const z of [-.5, .5]) caja(.05, 1.35, .05, M.gruaOsc, x, 1.5, z, g);
  caja(1.4, .05, 1.1, M.gruaOsc, -.15, 2.2, 0, g);
  const vol = new THREE.Mesh(new THREE.TorusGeometry(.14, .02, 8, 20), M.gruaOsc); vol.position.set(.25, 1.35, 0); vol.rotation.y = Math.PI / 2; vol.rotation.x = .6; g.add(vol);
  caja(.04, .3, .04, M.gruaOsc, .32, 1.15, 0, g).rotation.z = .5;
  for (const z of [-.42, .42]) caja(.1, 2.6, .08, M.gruaOsc, 1.0, 1.3, z, g);
  caja(.1, .08, .92, M.gruaOsc, 1.0, 2.56, 0, g); caja(.1, .08, .92, M.gruaOsc, 1.0, .3, 0, g);
  const i1 = new THREE.Group(); g.add(i1); for (const z of [-.33, .33]) caja(.08, 2.5, .07, M.gruaOsc, 1.07, 1.3, z, i1); caja(.08, .07, .74, M.gruaOsc, 1.07, 2.52, 0, i1);
  const i2 = new THREE.Group(); g.add(i2); for (const z of [-.24, .24]) caja(.07, 2.4, .06, M.gruaOsc, 1.13, 1.3, z, i2); caja(.07, .06, .55, M.gruaOsc, 1.13, 2.47, 0, i2);
  const car = g.carro = new THREE.Group(); g.add(car);
  caja(.06, .5, .95, M.gruaOsc, 1.19, .3, 0, car); caja(.06, .06, .95, M.gruaOsc, 1.19, .6, 0, car);
  for (const z of [-.3, .3]) { caja(.06, .5, .12, M.acero, 1.23, .25, z, car); caja(1.25, .04, .12, M.acero, 1.26 + .6, .02, z, car); }
  g.setElev = h => { car.position.y = h; const e = Math.max(0, h - .3); i2.position.y = e * .62; i1.position.y = e * .31; };
  g.setElev(.25);
  g.asiento = V(-.15, .5, 0);
  g.horquilla = V(1.86, .04, 0); // punto sobre las horquillas (local) donde descansa la carga
  return g;
}

export { tarima };
