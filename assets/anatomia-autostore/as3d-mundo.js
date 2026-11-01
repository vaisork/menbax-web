// Piezas de la nave y de la línea: patas, tramos, curva, espiral, grúa, charola, tablero, sensores, cajas.
// Unidades en metros. Los tramos rectos corren por +x local; la curva y la espiral llevan su centro en el origen.
import * as THREE from '../anatomia3d/vendor/three.module.min.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .2, ...o });
export const M = {
  azul: std(0x1F5FA8, { roughness: .38, metalness: .25 }),
  azulOsc: std(0x163E6E, { roughness: .5, metalness: .3 }),
  rodillo: std(0xC9D1D9, { roughness: .22, metalness: .9, flatShading: true }),
  rodMotor: std(0x3E4650, { roughness: .4, metalness: .7, flatShading: true }),
  pata: std(0x8A96A3, { roughness: .5, metalness: .55 }),
  galv: std(0xB9C2CA, { roughness: .4, metalness: .75 }),
  tornillo: std(0x4B5563, { roughness: .4, metalness: .8 }),
  tablero: std(0xD9DDE1, { roughness: .45 }),
  interior: std(0xEEF0F2, { roughness: .9, metalness: 0 }),
  plc: std(0x40454B, { roughness: .6 }),
  borne: std(0xE8772E, { roughness: .6 }),
  pantallaOff: std(0x0E1626, { roughness: .2, metalness: .3 }),
  pantallaOn: std(0x2563EB, { emissive: 0x1D4ED8, emissiveIntensity: 1.6, roughness: .3 }),
  sensor: std(0x2FA84F, { roughness: .5 }),
  lente: std(0x101418, { roughness: .1, metalness: .5 }),
  reflector: std(0xF3F4F6, { roughness: .2 }),
  ledOff: std(0x1F3D27, { roughness: .4 }),
  ledOn: std(0x4ADE80, { emissive: 0x22C55E, emissiveIntensity: 2.5 }),
  pilotoV: std(0x14532D), pilotoVOn: std(0x4ADE80, { emissive: 0x22C55E, emissiveIntensity: 2 }),
  pilotoA: std(0xA16207), pilotoR: std(0x7F1D1D),
  carton: std(0xC79A5B, { roughness: .95, metalness: 0 }),
  cinta: std(0xD7C7A8, { roughness: .7, metalness: 0 }),
  etiqueta: std(0xF8FAFC, { roughness: .8, metalness: 0 }),
  cableA: std(0xF2B705, { roughness: .6, metalness: 0 }),
  cableN: std(0xE8772E, { roughness: .6, metalness: 0 }),
  tablilla: std(0xFFFFFF, { roughness: .55, metalness: .45 }),
  piso: std(0xC6CACE, { roughness: .95, metalness: 0 }),
  junta: std(0xB3B8BD, { roughness: .95, metalness: 0 }),
  amarillo: std(0xF2B705, { roughness: .7, metalness: 0 }),
  muro: std(0xDADEE3, { roughness: .95, metalness: 0 }),
  columna: std(0xCBD0D6, { roughness: .8, metalness: .1 }),
  ventana: std(0xBFD6EA, { roughness: .2, metalness: .2 }),
  grua: std(0xF2B705, { roughness: .5 }),
  gruaOsc: std(0x3A3F45, { roughness: .6, metalness: .3 }),
  llanta: std(0x1F2327, { roughness: .9, metalness: 0 }),
  acero: std(0x6B7580, { roughness: .35, metalness: .85 }),
};

export function caja(w, h, d, m, x = 0, y = 0, z = 0, g) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
  if (g) g.add(o); return o;
}
const cilGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
// barra cilíndrica entre dos puntos (cables, eslingas, pistones)
export function barra(a, b, r, m, g) {
  const o = new THREE.Mesh(cilGeo, m); o.castShadow = true; ponerBarra(o, a, b, r); if (g) g.add(o); return o;
}
const _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function ponerBarra(o, a, b, r) {
  _d.subVectors(b, a); const L = _d.length();
  o.position.addVectors(a, b).multiplyScalar(.5); o.scale.set(r, L, r);
  o.quaternion.setFromUnitVectors(_up, _d.normalize());
}

export const TOR = .9; // altura de la tapa de rodillo
const ANCHO = .66, Y_RIEL = TOR - .08, Y_ROD = TOR - .035; // riel TOR-0.16..TOR; tapa de rodillo TOR+0.003

export function parPatas(alt = TOR - .16, sep = ANCHO, grosor = .07) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const z = s * sep / 2;
    caja(grosor, alt - .02, grosor, M.pata, 0, .02 + (alt - .02) / 2, z, g);
    caja(.22, .02, .22, M.pata, 0, .01, z, g);
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .03, 8), M.tornillo); t.position.set(a * .08, .03, z + b * .08); g.add(t);
    }
    caja(.1, .03, .13, M.pata, 0, alt - .015, z, g);
  }
  caja(.04, .04, sep - grosor, M.pata, 0, Math.min(alt * .45, 1.1), 0, g);
  if (alt > 1.6) { caja(.04, .04, sep - grosor, M.pata, 0, alt * .8, 0, g); caja(.03, alt * .34, .03, M.pata, 0, alt * .62, 0, g).rotation.x = Math.atan2(sep, alt * .35); }
  return g;
}

export function tramoRecto(L) {
  const g = new THREE.Group(); g.largo = L; g.rodillos = []; g.sensores = [];
  for (const s of [-1, 1]) {
    caja(L, .16, .04, M.azul, 0, Y_RIEL, s * ANCHO / 2, g);
    caja(L, .02, .07, M.azul, 0, Y_RIEL + .09, s * (ANCHO / 2 - .015), g);
    caja(L, .1, .015, M.galv, 0, TOR + .09, s * (ANCHO / 2 + .035), g);
    for (const x of [-L / 2 + .2, 0, L / 2 - .2]) caja(.04, .1, .04, M.galv, x, TOR + .03, s * (ANCHO / 2 + .025), g);
  }
  for (const x of [-L / 2 + .02, L / 2 - .02]) caja(.04, .16, ANCHO, M.azulOsc, x, Y_RIEL, 0, g);
  const nT = Math.max(2, Math.round(L / 1.2));
  for (let i = 0; i <= nT; i++) caja(.05, .05, ANCHO - .05, M.azulOsc, -L / 2 + .2 + (L - .4) * i / nT, TOR - .175, 0, g);
  const geoR = new THREE.CylinderGeometry(.038, .038, ANCHO - .06, 12); geoR.rotateX(Math.PI / 2);
  const n = Math.floor((L - .12) / .12), x0 = -(n - 1) * .12 / 2;
  for (let i = 0; i < n; i++) {
    const motor = i === Math.floor(n / 2);
    const r = new THREE.Mesh(geoR, motor ? M.rodMotor : M.rodillo); r.position.set(x0 + i * .12, Y_ROD, 0);
    r.castShadow = true; r.receiveShadow = true; g.add(r); g.rodillos.push(r);
    if (motor) {
      caja(.16, .09, .05, M.azulOsc, r.position.x, TOR - .06, ANCHO / 2 + .045, g); // tarjeta MDR
      caja(.28, .14, .22, M.azulOsc, r.position.x, TOR - .26, 0, g); // driver bajo la cama
      g.xMotor = r.position.x;
    }
  }
  return g;
}

export function curva(Rc = 1.6, a0 = -Math.PI / 2, a1 = 0) {
  const g = new THREE.Group(); g.rodillos = [];
  const sector = (ri, ro) => { const s = new THREE.Shape(); s.absarc(0, 0, ro, -a1, -a0, false); s.absarc(0, 0, ri, -a0, -a1, true); return s; };
  const extr = (ri, ro, h, yb, m) => {
    const geo = new THREE.ExtrudeGeometry(sector(ri, ro), { depth: h, bevelEnabled: false, curveSegments: 40 });
    geo.rotateX(-Math.PI / 2); geo.translate(0, yb, 0);
    const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
  };
  for (const s of [-1, 1]) {
    const r = Rc + s * ANCHO / 2;
    extr(Math.min(r, r + s * .04), Math.max(r, r + s * .04), .16, Y_RIEL - .08, M.azul);
    extr(Math.min(r - s * .015, r + s * .055), Math.max(r - s * .015, r + s * .055), .02, Y_RIEL + .08, M.azul);
    const rg = Rc + s * (ANCHO / 2 + .035);
    extr(Math.min(rg, rg + s * .015), Math.max(rg, rg + s * .015), .1, TOR + .04, M.galv);
  }
  const n = 16;
  const geoC = new THREE.CylinderGeometry(.05, .03, ANCHO - .06, 12); geoC.rotateZ(-Math.PI / 2);
  for (let i = 0; i < n; i++) {
    const th = a0 + (a1 - a0) * (i + .5) / n, motor = i === Math.floor(n / 2);
    const piv = new THREE.Group(); piv.position.set(Rc * Math.cos(th), Y_ROD, Rc * Math.sin(th)); piv.rotation.y = -th; g.add(piv);
    const r = new THREE.Mesh(geoC, motor ? M.rodMotor : M.rodillo); r.castShadow = true; piv.add(r); g.rodillos.push(r);
    if (motor) { caja(.16, .09, .05, M.azulOsc, 0, -.025, 0, piv).position.x = ANCHO / 2 + .045; caja(.28, .14, .22, M.azulOsc, 0, -.225, 0, piv); g.thMotor = th; }
    if (i % 5 === 2) caja(ANCHO - .05, .05, .05, M.azulOsc, 0, -.14, 0, piv); // relativo a Y_ROD
  }
  for (const th of [a0, a1]) { const p = new THREE.Group(); p.position.set(Rc * Math.cos(th), Y_RIEL, Rc * Math.sin(th)); p.rotation.y = -th; caja(ANCHO + .08, .16, .04, M.azulOsc, 0, 0, 0, p); g.add(p); }
  return g;
}

export function espiral({ r = 1.2, vueltas = 1.5, yTop = 3.3, yBot = TOR, segPorVuelta = 32 } = {}) {
  const g = new THREE.Group(); const W = .6;
  const n = vueltas * segPorVuelta, th1 = -Math.PI / 2, th0 = th1 - vueltas * 2 * Math.PI;
  const yAt = th => yBot + (th1 - th) / (th1 - th0) * (yTop - yBot);
  Object.assign(g, { r, th0, th1, yAt, colTop: yTop + .45 });
  for (let i = 0; i < n; i++) {
    const ta = th0 + (th1 - th0) * i / n, tb = th0 + (th1 - th0) * (i + 1) / n, tm = (ta + tb) / 2;
    const ds = r * (tb - ta), dy = yAt(tb) - yAt(ta), ang = Math.atan2(dy, ds);
    const piv = new THREE.Group(); piv.position.set(r * Math.cos(tm), yAt(tm), r * Math.sin(tm)); piv.rotation.y = -tm - Math.PI / 2; g.add(piv);
    const inc = new THREE.Group(); inc.rotation.z = ang; piv.add(inc);
    caja(ds + .03, .05, W, M.tablilla, 0, -.025, 0, inc);
    caja(ds + .03, .005, W - .04, M.acero, 0, .001, 0, inc); // canto de tablillas
    for (const s of [-1, 1]) { caja(ds + .03, .13, .03, M.azul, 0, .005, s * (W / 2 + .015), inc); caja(ds + .03, .08, .012, M.galv, 0, .14, s * (W / 2 + .05), inc); }
    if (i % 4 === 1) { const z0 = W / 2 + .03, z1 = r - .1; caja(.06, .05, z1 - z0, M.pata, 0, -.075, (z0 + z1) / 2, inc); }
  }
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, g.colTop, 20), M.pata); col.position.y = g.colTop / 2; col.castShadow = true; col.receiveShadow = true; g.add(col);
  caja(.6, .03, .6, M.pata, 0, .015, 0, g);
  for (const a of [-1, 1]) for (const b of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .04, 8), M.tornillo); t.position.set(a * .24, .045, b * .24); g.add(t); }
  caja(.4, .3, .34, M.azulOsc, .32, g.colTop - .2, 0, g); // motorreductor superior
  const tam = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .2, 16), M.gruaOsc); tam.rotation.z = Math.PI / 2; tam.position.set(.62, g.colTop - .2, 0); g.add(tam);
  // postes exteriores con ménsulas a cada paso de la hélice
  const Rp = r + W / 2 + .16;
  for (const ap of [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI]) { let top = 0; const pasos = [];
    for (let m = 0; m < Math.ceil(vueltas) + 1; m++) { const t = th1 - ((th1 - ap) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - m * 2 * Math.PI; if (t >= th0 - 1e-6 && t <= th1 + 1e-6) { pasos.push(t); top = Math.max(top, yAt(t)); } }
    const post = caja(.07, top + .05, .07, M.pata, Rp * Math.cos(ap), (top + .05) / 2, Rp * Math.sin(ap), g);
    caja(.22, .02, .22, M.pata, post.position.x, .01, post.position.z, g);
    for (const t of pasos) { const p = new THREE.Group(); p.position.set((Rp - .1) * Math.cos(ap), yAt(t) - .035, (Rp - .1) * Math.sin(ap)); p.rotation.y = -ap; caja(.22, .04, .05, M.pata, 0, 0, 0, p); g.add(p); }
  }
  g.puntoRim = k => new THREE.Vector3(.9 * Math.cos(k * 2.094), g.colTop - .25, .9 * Math.sin(k * 2.094)); // anclas de eslinga
  return g;
}

export function grua(L = 4.6) {
  const g = new THREE.Group();
  caja(3.6, .5, 1.5, M.gruaOsc, 0, .75, 0, g);
  const geoLl = new THREE.CylinderGeometry(.42, .42, .32, 18); geoLl.rotateX(Math.PI / 2);
  for (const x of [-1.25, 1.25]) for (const z of [-.8, .8]) { const l = new THREE.Mesh(geoLl, M.llanta); l.position.set(x, .42, z); l.castShadow = true; g.add(l); const rin = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .34, 12), M.acero); rin.rotation.x = Math.PI / 2; rin.position.copy(l.position); g.add(rin); }
  caja(1.0, .95, 1.0, M.grua, 1.3, 1.5, .0, g); caja(.03, .5, .8, M.lente, 1.82, 1.6, 0, g); caja(.6, .5, .03, M.lente, 1.3, 1.6, .5, g);
  caja(1.0, .7, 1.3, M.gruaOsc, -1.4, 1.4, 0, g);
  const tor = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .25, 24), M.grua); tor.position.set(-.3, 1.12, 0); g.add(tor);
  for (const z of [-1, 1]) for (const x of [-1.3, 1.3]) { caja(.3, .2, 1.4, M.grua, x, .7, z * 1.1, g); caja(.45, .08, .45, M.gruaOsc, x, .04, z * 1.85, g); const c = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .62, 10), M.acero); c.position.set(x, .39, z * 1.85); g.add(c); }
  const pl = g.pluma = new THREE.Group(); pl.position.set(-.3, 1.3, 0); g.add(pl);
  caja(L, .34, .34, M.grua, L / 2, 0, 0, pl); caja(L * .7, .26, .26, M.grua, L * 1.05, 0, 0, pl); caja(.3, .4, .3, M.gruaOsc, L * 1.4, 0, 0, pl);
  g.punta = new THREE.Object3D(); g.punta.position.set(L * 1.4, -.2, 0); pl.add(g.punta);
  g.piston = barra(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), .09, M.acero, g);
  g.pistonBase = new THREE.Vector3(.5, 1.0, 0); g.pistonTop = new THREE.Object3D(); g.pistonTop.position.set(L * .45, -.15, 0); pl.add(g.pistonTop);
  g.cable = barra(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), .02, M.gruaOsc, g);
  g.gancho = new THREE.Group(); g.add(g.gancho);
  caja(.16, .26, .16, M.gruaOsc, 0, -.13, 0, g.gancho);
  const an = new THREE.Mesh(new THREE.TorusGeometry(.11, .028, 8, 18, Math.PI * 1.5), M.acero); an.position.y = -.4; an.rotation.z = Math.PI * .75; g.gancho.add(an);
  g.eslingas = [0, 1, 2].map(() => barra(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), .015, M.gruaOsc, g));
  return g;
}

export function charolaRecta(L) {
  const g = new THREE.Group();
  caja(L, .015, .2, M.galv, L / 2, 0, 0, g);
  for (const s of [-1, 1]) caja(L, .06, .015, M.galv, L / 2, .03, s * .1, g);
  for (let x = .3; x < L; x += 1.2) for (const s of [-1, 1]) caja(.02, .13, .02, M.galv, x, .125, s * .08, g);
  return g;
}
export function charolaCurva(Rc, a0, a1) {
  const g = new THREE.Group();
  const sector = (ri, ro) => { const s = new THREE.Shape(); s.absarc(0, 0, ro, -a1, -a0, false); s.absarc(0, 0, ri, -a0, -a1, true); return s; };
  const extr = (ri, ro, h, yb) => { const geo = new THREE.ExtrudeGeometry(sector(ri, ro), { depth: h, bevelEnabled: false, curveSegments: 32 }); geo.rotateX(-Math.PI / 2); geo.translate(0, yb, 0); const o = new THREE.Mesh(geo, M.galv); o.castShadow = true; o.receiveShadow = true; g.add(o); };
  extr(Rc - .1, Rc + .1, .015, 0); extr(Rc - .115, Rc - .1, .06, 0); extr(Rc + .1, Rc + .115, .06, 0);
  return g;
}

export function tablero() {
  const g = new THREE.Group(); const W = .8, H = 1.6, D = .4; // frente hacia +x local
  caja(D, .1, W, M.gruaOsc, 0, .05, 0, g);
  caja(.03, H, W, M.tablero, -D / 2 + .015, .1 + H / 2, 0, g);
  for (const s of [-1, 1]) caja(D, H, .03, M.tablero, 0, .1 + H / 2, s * (W / 2 - .015), g);
  caja(D, .03, W, M.tablero, 0, .1 + H - .015, 0, g); caja(D, .03, W, M.tablero, 0, .115, 0, g);
  caja(.02, H - .2, W - .1, M.interior, -D / 2 + .05, .1 + H / 2, 0, g);
  const ix = -D / 2 + .1;
  caja(.03, .035, .62, M.galv, ix, 1.25, 0, g); caja(.09, .12, .32, M.plc, ix + .03, 1.25, -.1, g);
  g.leds = [0, 1, 2, 3].map(i => caja(.01, .018, .018, M.ledOff, ix + .08, 1.29, -.22 + i * .04, g));
  caja(.08, .1, .14, M.plc, ix + .03, 1.25, .18, g);
  caja(.03, .035, .62, M.galv, ix, .9, 0, g); for (let i = 0; i < 6; i++) caja(.06, .09, .07, i % 2 ? M.plc : M.tablero, ix + .02, .9, -.25 + i * .1, g);
  caja(.03, .035, .62, M.galv, ix, .55, 0, g); caja(.07, .07, .55, M.borne, ix + .025, .55, 0, g);
  caja(.04, .5, .03, M.cableA, ix + .05, .9, -.33, g); caja(.04, .5, .03, M.cableN, ix + .05, .9, .33, g);
  // puerta con bisagra en el canto -z; gira hacia +x (afuera, hacia el técnico) con rotation.y positivo
  const p = g.puerta = new THREE.Group(); p.position.set(D / 2 + .02, .1 + H / 2, -W / 2); g.add(p);
  caja(.03, H - .04, W - .04, M.tablero, 0, 0, W / 2, p);
  for (const y of [-.6, 0, .6]) caja(.05, .08, .04, M.tornillo, -.02, y, .01, p); // bisagras
  caja(.03, .14, .03, M.tornillo, .035, 0, W - .1, p); caja(.03, .03, .06, M.tornillo, .035, .07, W - .1, p);
  g.pilotos = ['pilotoV', 'pilotoA', 'pilotoR'].map((k, i) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .03, 12), M[k]); c.rotation.z = Math.PI / 2; c.position.set(.03, .55, .2 + i * .1); p.add(c); return c; });
  caja(.02, .08, .18, M.interior, .025, .4, .3, p);
  g.ventila = caja(.015, .25, .3, M.gruaOsc, .025, -.55, W / 2, p);
  return g;
}

export function pedestalHMI() {
  const g = new THREE.Group(); // pantalla mira a +x local
  caja(.3, .02, .3, M.gruaOsc, 0, .01, 0, g);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.0, 12), M.pata); p.position.y = .52; p.castShadow = true; g.add(p);
  const c = new THREE.Group(); c.position.y = 1.1; c.rotation.z = -.35; g.add(c);
  caja(.05, .26, .36, M.plc, 0, 0, 0, c);
  g.pantalla = caja(.006, .2, .3, M.pantallaOff, .028, 0, 0, c);
  caja(.012, .03, .03, M.ledOff, .027, -.1, .14, c);
  return g;
}

export function sensorPar(ancho = ANCHO) { // emisor en +z y reflector en -z, montados en las guardas
  const g = new THREE.Group();
  const s = new THREE.Group(); s.position.set(0, TOR + .11, -ancho / 2 - .06); s.rotation.y = Math.PI; g.add(s);
  caja(.035, .07, .045, M.sensor, 0, 0, 0, s);
  const l = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .01, 12), M.lente); l.rotation.x = Math.PI / 2; l.position.set(0, .01, -.025); s.add(l);
  g.led = caja(.012, .012, .012, M.ledOff, 0, .04, 0, s);
  caja(.03, .02, .06, M.galv, 0, -.045, -.02, s);
  const r = new THREE.Group(); r.position.set(0, TOR + .11, ancho / 2 + .06); r.rotation.y = Math.PI; g.add(r);
  caja(.03, .06, .012, M.reflector, 0, 0, .02, r); caja(.03, .02, .06, M.galv, 0, -.04, .02, r);
  return g;
}

export function cajaCarton(w, h, d) {
  const g = new THREE.Group(); g.alto = h;
  caja(w, h, d, M.carton, 0, h / 2, 0, g);
  caja(w + .004, .004, .06, M.cinta, 0, h, 0, g);
  caja(.002, h * .55, .05, M.cinta, w / 2, h / 2, 0, g).rotation.set(0, 0, 0);
  caja(.1, .07, .002, M.etiqueta, w * .2, h * .55, d / 2 + .001, g);
  return g;
}

// Texturas procedimentales (sin archivos): concreto, tablillas, achurado y sombra suave
function lienzo(n, fn) { const c = document.createElement('canvas'); c.width = c.height = n; fn(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export const TEX = {};
function texturas() {
  if (TEX.ok) return; TEX.ok = true;
  TEX.concreto = lienzo(512, (g, n) => { g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, n, n); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${80 + Math.random() * 60 | 0},${85 + Math.random() * 60 | 0},${95 + Math.random() * 60 | 0},${.06 + Math.random() * .12})`; const r = Math.random() * 3; g.fillRect(Math.random() * n, Math.random() * n, r, r); } });
  TEX.concreto.wrapS = TEX.concreto.wrapT = THREE.RepeatWrapping; TEX.concreto.repeat.set(14, 10); TEX.concreto.anisotropy = 4;
  TEX.tablilla = lienzo(128, (g, n) => { g.fillStyle = '#4a5563'; g.fillRect(0, 0, n, n); g.fillStyle = '#2a323c'; for (let x = 0; x < n; x += 32) g.fillRect(x, 0, 5, n); g.fillStyle = '#6a7684'; for (let x = 6; x < n; x += 32) g.fillRect(x, 0, 2, n); });
  TEX.tablilla.wrapS = TEX.tablilla.wrapT = THREE.RepeatWrapping; TEX.tablilla.repeat.set(1.6, 1);
  TEX.achurado = lienzo(256, (g, n) => { g.fillStyle = '#f2b705'; g.fillRect(0, 0, n, n); g.strokeStyle = '#1f2327'; g.lineWidth = 26; for (let k = -n; k < 2 * n; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + n, n); g.stroke(); } });
  TEX.achurado.wrapS = TEX.achurado.wrapT = THREE.RepeatWrapping;
  TEX.sombra = lienzo(128, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(.5, 'rgba(0,0,0,.22)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); });
  M.piso.map = TEX.concreto; M.piso.needsUpdate = true;
  M.tablilla.map = TEX.tablilla; M.tablilla.needsUpdate = true;
  TEX.matSombra = new THREE.MeshBasicMaterial({ map: TEX.sombra, transparent: true, depthWrite: false, opacity: 1 });
}
// sombra de contacto falsa (plano con degradado radial)
const geoSombra = new THREE.PlaneGeometry(1, 1); geoSombra.rotateX(-Math.PI / 2);
export function sombra(r, x = 0, z = 0, g) { texturas(); const o = new THREE.Mesh(geoSombra, TEX.matSombra); o.scale.set(r * 2, 1, r * 2); o.position.set(x, .004, z); o.renderOrder = 1; if (g) g.add(o); return o; }

export function tarima(conCajas = true) {
  const g = new THREE.Group(); const mad = M.madera ||= std(0xB08A5A, { roughness: .9, metalness: 0 });
  for (const z of [-.5, 0, .5]) caja(1.2, .09, .1, mad, 0, .045, z, g);
  for (const x of [-.55, 0, .55]) caja(.1, .02, 1.0, mad, x, .1, 0, g);
  for (const x of [-.5, 0, .5]) caja(.18, .09, 1.0, mad, x, .135, 0, g);
  if (conCajas) { caja(1.1, .55, .9, M.carton, 0, .18 + .275, 0, g); caja(.5, .4, .45, M.carton, -.25, .18 + .55 + .2, .2, g); caja(.45, .35, .4, M.carton, .3, .18 + .55 + .175, -.2, g); }
  return g;
}

export function rack(bahias = 3, niveles = 3) {
  const g = new THREE.Group(); const az = M.rackAzul ||= std(0x2B4C7E, { roughness: .6 }); const nar = M.rackNar ||= std(0xE8772E, { roughness: .6 });
  const B = 2.8, P = 1.1;
  for (let i = 0; i <= bahias; i++) for (const z of [-P / 2, P / 2]) caja(.1, 5.2, .1, az, i * B, 2.6, z, g);
  for (let i = 0; i < bahias; i++) for (let n = 1; n <= niveles; n++) for (const z of [-P / 2, P / 2]) caja(B - .1, .12, .06, nar, i * B + B / 2, n * 1.6, z, g);
  for (let i = 0; i < bahias; i++) for (let n = 0; n <= niveles; n++) if (Math.random() < .85) { const t = tarima(true); t.position.set(i * B + B / 2 + (Math.random() - .5) * .3, n === 0 ? 0 : n * 1.6 + .06, 0); t.rotation.y = Math.PI / 2; g.add(t); }
  return g;
}

export function extintor() {
  const g = new THREE.Group(); const rojo = M.rojo ||= std(0xC8102E, { roughness: .4, metalness: .3 });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .55, 14), rojo); c.position.y = .95; c.castShadow = true; g.add(c);
  const tapa = new THREE.Mesh(new THREE.SphereGeometry(.09, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), rojo); tapa.position.y = 1.225; g.add(tapa);
  caja(.04, .12, .04, M.gruaOsc, 0, 1.3, 0, g); caja(.1, .03, .05, M.gruaOsc, .04, 1.34, 0, g);
  caja(.3, .3, .02, rojo, 0, 1.8, -.05, g); caja(.22, .22, .005, M.reflector, 0, 1.8, -.035, g);
  return g;
}

// plataforma de alimentación (mezzanine pequeño) con barandal amarillo y rodapié
export function plataforma(w = 1.6, d = 1.6, h = 3.14) {
  const g = new THREE.Group();
  caja(w, .06, d, M.galv, 0, h - .03, 0, g);
  for (const x of [-w / 2 + .05, w / 2 - .05]) for (const z of [-d / 2 + .05, d / 2 - .05]) { caja(.1, h - .06, .1, M.pata, x, (h - .06) / 2, z, g); caja(.22, .02, .22, M.pata, x, .01, z, g); }
  for (const x of [-w / 2 + .05, w / 2 - .05]) caja(.08, .25, d, M.pata, x, h - .18, 0, g);
  const bordes = [[w / 2, 0, 0, d], [0, -d / 2, w, 0], [0, d / 2, w, 0]]; // lados con barandal: +x, -z, +z
  for (const [x, z, lx, lz] of bordes) {
    const L = lx || lz, ry = lx ? 0 : Math.PI / 2; const p = new THREE.Group(); p.position.set(x, h, z); p.rotation.y = ry; g.add(p);
    caja(L, .05, .04, M.amarillo, 0, 1.08, 0, p); caja(L, .04, .03, M.amarillo, 0, .55, 0, p); caja(L, .12, .03, M.amarillo, 0, .06, 0, p);
    for (let k = -L / 2 + .05; k <= L / 2; k += Math.max(.5, (L - .1) / 2)) caja(.05, 1.1, .05, M.amarillo, k, .55, 0, p);
  }
  return g;
}

export function nave(scene) {
  texturas();
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(64, 44), M.piso); piso.rotation.x = -Math.PI / 2; piso.position.set(-2, 0, 2); piso.receiveShadow = true; scene.add(piso);
  for (let x = -26; x <= 22; x += 4) caja(.02, .004, 44, M.junta, x, .001, 2, scene).receiveShadow = true;
  for (let z = -6; z <= 20; z += 4) caja(64, .004, .02, M.junta, -2, .001, z, scene);
  caja(26, .006, .1, M.amarillo, -3.5, .002, -2.7, scene); caja(26, .006, .1, M.amarillo, -3.5, .002, 7.6, scene);
  caja(.1, .006, 10.4, M.amarillo, 9.4, .002, 2.45, scene); caja(.1, .006, 10.4, M.amarillo, -16.4, .002, 2.45, scene);
  const ach = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.4), new THREE.MeshStandardMaterial({ map: TEX.achurado, roughness: .9 })); ach.rotation.x = -Math.PI / 2; ach.position.set(5.9, .003, 4.6); ach.receiveShadow = true; scene.add(ach);
  TEX.achurado.repeat.set(1.8, 2.4);
  caja(25.3, 9.6, .3, M.muro, -11.35, 4.8, -7.2, scene); caja(16.1, 9.6, .3, M.muro, 11.95, 4.8, -7.2, scene); caja(2.6, 6.6, .3, M.muro, 2.6, 6.3, -7.2, scene);
  caja(.3, 9.6, 30, M.muro, -20.2, 4.8, 5, scene);
  // puerta de andén: marco amarillo, topes, cuarto de embarque oscuro y cortina de tiras
  for (const x of [1.3, 3.9]) { caja(.12, 3.0, .12, M.amarillo, x, 1.5, -7.05, scene); caja(.3, .6, .16, M.llanta, x + (x < 2 ? .25 : -.25), .5, -6.98, scene); }
  caja(2.6, .12, .12, M.amarillo, 2.6, 3.0, -7.05, scene);
  const osc = M.oscuro ||= std(0x23272C, { roughness: 1, metalness: 0 });
  caja(2.6, 3, .05, osc, 2.6, 1.5, -11.0, scene); caja(.05, 3, 4, osc, 1.3, 1.5, -9.2, scene); caja(.05, 3, 4, osc, 3.9, 1.5, -9.2, scene); caja(2.6, .05, 4, osc, 2.6, 3.0, -9.2, scene);
  const cort = M.cortina ||= new THREE.MeshStandardMaterial({ color: 0xDCE6EE, transparent: true, opacity: .55, roughness: .3, side: THREE.DoubleSide });
  for (let x = 1.47; x < 3.85; x += .33) caja(.3, 1.65, .01, cort, x, 2.17, -7.22, scene).castShadow = false;
  for (let x = -18; x <= 14; x += 5.5) { caja(.45, 9.6, .45, M.columna, x, 4.8, -6.95, scene); caja(4.4, 1.6, .05, M.ventana, x + 2.75, 6.6, -7.02, scene); }
  for (let z = -4; z <= 18; z += 5.5) { caja(.45, 9.6, .45, M.columna, -19.95, 4.8, z, scene); caja(.05, 1.6, 4.4, M.ventana, -20.02, 6.6, z + 2.75, scene); }
  caja(44, .3, .06, M.amarillo, -2, .15, -7.0, scene); caja(.06, .3, 30, M.amarillo, -20.0, .15, 5, scene);
  // techo con luminarias
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(64, 44), M.techo ||= std(0xB9BEC5, { roughness: .95, metalness: 0, side: THREE.DoubleSide })); techo.rotation.x = Math.PI / 2; techo.position.set(-2, 9.6, 2); techo.receiveShadow = false; scene.add(techo);
  for (let x = -18; x <= 14; x += 8) caja(.3, .5, 44, M.columna, x, 9.3, 2, scene).castShadow = false; // vigas
  const lum = M.lum ||= new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFF3DC, emissiveIntensity: 1.2, roughness: .4 });
  for (let x = -16; x <= 12; x += 5.5) for (const z of [-3.5, 3.5, 15]) { caja(1.3, .1, .35, lum, x, 8.6, z, scene).castShadow = false; caja(1.4, .06, .4, M.gruaOsc, x, 8.68, z, scene).castShadow = false; }
  // racks de fondo, tarimas y extintor
  const rk = rack(2, 3); rk.position.set(-19.4, 0, -6.2); rk.traverse(o => { if (o.isMesh) o.castShadow = false; }); scene.add(rk);
  const rk2 = rack(3, 3); rk2.position.set(5.8, 0, -6.2); rk2.traverse(o => { if (o.isMesh) o.castShadow = false; }); scene.add(rk2);
  for (const [x, z, r] of [[-12.5, 8.8, .3], [-13.9, 9.0, -.2], [8.6, -3.6, .1]]) { const t = tarima(true); t.position.set(x, 0, z); t.rotation.y = r; scene.add(t); }
  const tv = tarima(false); tv.position.set(-12.6, .2, 8.7); tv.rotation.y = .25; scene.add(tv);
  const ex = extintor(); ex.position.set(-1.2, 0, -6.65); scene.add(ex);
}

// Entorno de reflejos sencillo (sin addons): caja gris con paneles luminosos.
export function entorno(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ color: 0x8C9298, side: THREE.BackSide })));
  const luz = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  for (const [x, z] of [[-8, -8], [8, -8], [0, 8]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), luz); p.position.set(x, 9.9, z); p.rotation.x = Math.PI / 2; s.add(p); }
  const f = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x5A6066 })); f.rotation.x = -Math.PI / 2; f.position.y = -9.9; s.add(f);
  const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(s, .04).texture; pm.dispose(); return t;
}

// Montacargas de contrapeso. +x local = frente (horquillas). g.setElev(h) sube el carro y el mástil interior.
export function montacargas() {
  const g = new THREE.Group();
  caja(1.9, .55, 1.1, M.grua, -.1, .6, 0, g);                       // chasis
  caja(.7, .7, 1.0, M.gruaOsc, -1.1, .75, 0, g);                      // contrapeso
  caja(.5, .3, .9, M.gruaOsc, -1.25, 1.2, 0, g);
  caja(1.2, .05, 1.0, M.gruaOsc, .2, .48, 0, g);                      // piso del operador
  caja(.6, .55, .9, M.grua, -.45, 1.0, 0, g);                         // capó / tanque
  caja(.45, .08, .5, M.gruaOsc, -.45, 1.05, 0, g); caja(.08, .3, .45, M.gruaOsc, -.3, 1.35, 0, g); // asiento
  const geoLl = new THREE.CylinderGeometry(.3, .3, .26, 16); geoLl.rotateX(Math.PI / 2);
  const geoLt = new THREE.CylinderGeometry(.24, .24, .22, 16); geoLt.rotateX(Math.PI / 2);
  for (const [x, z, geo] of [[.55, -.62, geoLl], [.55, .62, geoLl], [-.95, -.55, geoLt], [-.95, .55, geoLt]]) {
    const l = new THREE.Mesh(geo, M.llanta); l.position.set(x, geo === geoLl ? .3 : .24, z); l.castShadow = true; g.add(l);
    const rin = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .28, 10), M.acero); rin.rotation.x = Math.PI / 2; rin.position.copy(l.position); g.add(rin);
  }
  for (const x of [.45, -.75]) for (const z of [-.5, .5]) caja(.05, 1.35, .05, M.gruaOsc, x, 1.5, z, g); // protector superior
  caja(1.4, .05, 1.1, M.gruaOsc, -.15, 2.2, 0, g);
  const vol = new THREE.Mesh(new THREE.TorusGeometry(.14, .02, 8, 20), M.gruaOsc); vol.position.set(.25, 1.35, 0); vol.rotation.y = Math.PI / 2; vol.rotation.x = .6; g.add(vol);
  caja(.04, .3, .04, M.gruaOsc, .32, 1.15, 0, g).rotation.z = .5;
  // mástil fijo + mástil interior + carro con horquillas
  for (const z of [-.42, .42]) caja(.1, 2.3, .08, M.gruaOsc, 1.0, 1.15, z, g);
  caja(.1, .08, .92, M.gruaOsc, 1.0, 2.26, 0, g); caja(.1, .08, .92, M.gruaOsc, 1.0, .3, 0, g);
  const int = g.mastilInt = new THREE.Group(); g.add(int);
  for (const z of [-.31, .31]) caja(.08, 2.2, .07, M.gruaOsc, 1.07, 1.1, z, int);
  caja(.08, .07, .7, M.gruaOsc, 1.07, 2.17, 0, int);
  const car = g.carro = new THREE.Group(); g.add(car);
  caja(.06, .5, .95, M.gruaOsc, 1.13, .3, 0, car); caja(.06, .06, .95, M.gruaOsc, 1.13, .6, 0, car);
  for (const z of [-.3, .3]) { caja(.06, .5, .12, M.acero, 1.17, .25, z, car); caja(1.25, .04, .12, M.acero, 1.2 + .6, .02, z, car); }
  g.setElev = h => { car.position.y = h; int.position.y = Math.max(0, h - .15) * .55; };
  g.setElev(.25);
  // operador: raíz en el piso del operador
  g.asiento = new THREE.Vector3(-.15, .5, 0);
  return g;
}
