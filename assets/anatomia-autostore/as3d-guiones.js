// Etapas, línea de tiempo y guiones de los técnicos. Todo en función del tiempo global T (segundos).
import { POSES } from './as3d-tecnico.js';

export const ETAPAS = [
  { n: 'Piso y trazo', f: 'Se revisa el nivel del piso y se marcan los ejes de la rejilla.', c: '#5B6B80', d: 5 },
  { n: 'Base', f: 'Placas niveladas y ancladas al piso en cada eje.', c: '#6B7A90', d: 5 },
  { n: 'Columnas', f: 'Se levantan las columnas por secciones, con sus arriostres.', c: '#1F5FA8', d: 7 },
  { n: 'Mezzanine', f: 'Plataforma de servicio con escalera y barandal.', c: '#D99A06', d: 7 },
  { n: 'Rejilla superior', f: 'Rieles en cuadrícula alineados sobre las columnas.', c: '#1F5FA8', d: 6 },
  { n: 'Cerramiento', f: 'Paneles laterales y muro de servicio alrededor de la rejilla.', c: '#5B6B80', d: 5 },
  { n: 'Cubiertas exteriores', f: 'Paneles de fachada que visten el sistema.', c: '#2F4562', d: 6 },
  { n: 'Puertos y carga', f: 'Puerto de operación y estaciones de carga en el borde.', c: '#0F9D7A', d: 6 },
  { n: 'Eléctrico y red', f: 'Charola, alimentación a cargadores y puertos, y gabinete de control.', c: '#D99A06', d: 6 },
  { n: 'Robots', f: 'La grúa sube los robots a la rejilla por la zona de entrada.', c: '#D7262E', d: 14 },
  { n: 'Contenedores', f: 'Se ingresan por el puerto y los robots los almacenan en su celda.', c: '#7D8794', d: 17 },
  { n: 'Operación', f: 'Los robots surten contenedores al puerto y el operador despacha.', c: '#2E7D32', d: 17.5 },
];
export const S = []; ETAPAS.reduce((a, e) => (S.push(a), a + e.d), 0); // 0 5 10 17 24 30 35 41 47 53 67 84
export const HG = 5.38, T_SALIDA = S[10] + .2; // los técnicos de instalación salen antes de cargar contenedores; en operación solo queda el operador

export const clamp01 = v => Math.max(0, Math.min(1, v));
export const ss = (t, a, b) => { const u = clamp01((t - a) / (b - a)); return u * u * (3 - 2 * u); };
export const lerp = (a, b, u) => a + (b - a) * u;
export function perfil(x, r = .22) { const v = 1 / (1 - r); return x < r ? v * x * x / (2 * r) : x > 1 - r ? 1 - v * (1 - x) * (1 - x) / (2 * r) : v * (x - r / 2); }

// ---------- guiones: {t, x, z, y?, act, mira:[x,z], herr, carga, andar} ----------
const K = (t, x, z, o) => ({ t, x, z, ...o });
const AG = m => ({ act: 'agachado', herr: 1, mira: m });
const ag = m => ({ act: 'agachado', mira: m });
const TO = m => ({ act: 'tocar', mira: m });
const OB = m => ({ act: 'observar', mira: m });
const SE = m => ({ act: 'senalar', mira: m });
const CA = { act: 'cargar' }, CA1 = { act: 'cargar', carga: 1 };
const Y = (o, y) => ({ ...o, y });
// parada con acción entre ta y tb en (x,z) mirando m; termina en reposo
const parada = (k, ta, tb, x, z, o, y) => { k.push(K(ta, x, z, Y({ mira: o.mira }, y)), K(ta + .1, x, z, Y(o, y)), K(tb - .1, x, z, Y({ mira: o.mira }, y)), K(tb, x, z, Y({}, y))); };
// operador del puerto: toma un contenedor vacío de la tarima y lo pone en la bandeja (un ciclo cada 2 s)
export const T_PUERTO0 = S[10] + 2.45, N_PUERTO = 7, POS_OP = [1.55, 2.95];
const cargarPuerto = (k) => { for (let c = -1; c < N_PUERTO - 1; c++) { const t = T_PUERTO0 + 2 * c, [x, z] = POS_OP; k.push(K(t - .5, x, z, { act: 'bajar', mira: [2.6, 2.6] }), K(t, x, z, { act: 'cargar', mira: [1.05, 2.0] }), K(t + .4, x, z, { act: 'bajar', mira: [1.05, 2.0] }), K(t + .8, x, z, OB([1.05, 2.0]))); } };
const ESC = -5.15, L1 = 2.69; // x de la escalera y altura del descanso
const subir = (k, t, zIni = 2.4) => { // sube la escalera: llega al pie en t, pisa el deck en t+8
  k.push(K(t, ESC, zIni), K(t + .3, ESC, 1.6, { y: 0 }), K(t + 2.7, ESC, -2.0, { y: L1 }), K(t + 3.1, ESC, -2.5, { y: L1 }), K(t + 3.4, ESC, -2.0, { y: L1 }), K(t + 5.8, ESC, 1.2, { y: HG }), K(t + 6.1, ESC, 1.6, { y: HG }), K(t + 6.7, -4.3, 1.6, { y: HG }));
};
const bajar = (k, t, xFin, zFin) => { // desde (-4.3,1.6) en el deck en t; en el piso en t+6.3 y sale
  k.push(K(t, -4.3, 1.6, { y: HG }), K(t + .4, ESC, 1.6, { y: HG }), K(t + .7, ESC, 1.2, { y: HG }), K(t + 2.9, ESC, -2.0, { y: L1 }), K(t + 3.2, ESC, -2.5, { y: L1 }), K(t + 3.5, ESC, -2.0, { y: L1 }), K(t + 5.7, ESC, 1.6, { y: 0 }), K(t + 6.0, ESC, 2.6, { y: 0 }), K(t + 8.8, xFin, zFin));
};

export const G = { A: [], B: [], C: [], D: [], P: [] };
{ const k = G.A; // A: nivel láser, taladra el frente, apoya columnas, guía montacargas, sube al mezzanine, charola, carga contenedores
  k.push(K(0, 4.2, 5.3, OB([0, 0])), K(2.6, 4.2, 5.3, OB([0, 0])), K(3.9, 3.4, 3.2, SE([0, 0])), K(5.0, 3.4, 3.2));
  parada(k, 5.8, 6.5, 2.7, 1.95, AG([2.8, 1.5])); parada(k, 7.1, 7.9, 1.3, 1.95, AG([1.4, 1.5])); parada(k, 8.6, 9.4, -.1, 1.95, AG([0, 1.5]));
  parada(k, 10.9, 11.7, -2.7, 1.85, TO([-2.8, 1.5])); parada(k, 12.4, 13.2, -1.3, 1.85, TO([-1.4, 1.5])); parada(k, 13.9, 14.7, .1, 1.85, TO([0, 1.5])); parada(k, 15.4, 16.2, 1.5, 1.85, TO([1.4, 1.5]));
  k.push(K(18.4, -2.6, 3.4, SE([-8, .6])), K(20.6, -2.6, 3.4, SE([-8, .6])), K(21.4, -1.6, 3.6, OB([-3.75, 2])), K(24.0, -1.6, 3.6, OB([-3.75, 2])));
  k.push(K(24.4, -1.6, 3.6)); subir(k, 26.0);
  k.push(K(34.6, -3.4, -.9, Y(OB([0, 0]), HG)), K(46.8, -3.4, -.9, Y(OB([1, 1.5]), HG)));
  parada(k, 48.6, 50.5, -.3, -1.1, ag([-.3, -1.7]), HG); parada(k, 51.5, 52.9, 1.6, -1.1, ag([1.6, -1.7]), HG);
  k.push(K(55.6, -3.5, .8, { y: HG })); bajar(k, 56.4, -10.5, 4.0);
}
{ const k = G.B; // B: traza el frente, taladra atrás, apoya columnas, guía mezzanine, sube, coloca y conecta cargadores, carga contenedores
  k.push(K(0, -5.8, 3.0)); parada(k, 1.4, 2.0, -2.8, 2.0, ag([-2.8, 1.5])); parada(k, 4.6, 5.2, 2.8, 2.0, ag([2.8, 1.5]));
  k.push(K(6.6, 3.3, -1.0)); parada(k, 7.2, 7.9, 2.1, -1.95, AG([2.1, -1.5])); parada(k, 8.5, 9.4, .7, -1.95, AG([.7, -1.5])); parada(k, 10.0, 10.8, -.7, -1.95, AG([-.7, -1.5]));
  parada(k, 11.9, 12.6, -2.7, -1.85, TO([-2.8, -1.5])); parada(k, 13.2, 13.9, -1.3, -1.85, TO([-1.4, -1.5])); parada(k, 14.5, 15.4, .1, -1.85, TO([0, -1.5]));
  k.push(K(19.0, -5.6, -1.0, SE([-3.75, 0])), K(21.0, -5.6, -1.0, SE([-3.75, 0]))); parada(k, 22.0, 22.9, -4.3, -2.65, TO([-4.55, -1.94]));
  k.push(K(24.2, -6.2, -.5, OB([-3.75, 0])), K(30.0, -6.2, -.5)); subir(k, 31.6);
  k.push(K(39.4, -3.6, .7, Y(OB([2, -1.5]), HG)), K(43.0, -3.6, .7, { y: HG }));
  parada(k, 44.0, 45.0, -2.3, -1.05, ag([-2.45, -1.62]), HG); parada(k, 45.4, 46.4, -1.6, -1.05, ag([-1.75, -1.62]), HG); parada(k, 46.8, 47.8, -.9, -1.05, ag([-1.05, -1.62]), HG);
  parada(k, 48.6, 51.6, -1.6, -1.05, ag([-1.75, -1.62]), HG); k.push(K(52.4, -2.3, -1.05, Y(OB([1, -1.6]), HG)), K(54.6, -2.3, -1.05, { y: HG }), K(56.4, -3.5, .3, { y: HG })); bajar(k, 57.4, -10.5, 3.2);
}
{ const k = G.C; // C: traza atrás, carga la caja de placas con D, arriostres, mezzanine, carga panel con D, guía montacargas del puerto, conecta puerto, señala a la grúa
  k.push(K(0, 6.5, -2.6)); parada(k, 1.6, 2.2, 2.8, -2.0, ag([2.8, -1.5])); parada(k, 4.8, 5.4, -2.8, -2.0, ag([-2.8, -1.5]));
  k.push(K(8.0, -5.8, 4.2, CA), K(8.2, -5.8, 4.2, CA1), K(10.0, -1.6, 3.5, { act: 'cargar', mira: [-1.2, 3.9] }), K(10.1, -1.6, 3.5, { act: 'bajar', mira: [-1.2, 3.9] }), K(10.7, -1.6, 3.5, { mira: [-1.2, 3.9] }), K(10.8, -1.6, 3.5));
  k.push(K(13.8, 3.9, -.2, OB([2.8, 0])), K(14.0, 3.9, -.2, OB([2.8, 0]))); parada(k, 15.4, 16.8, 2.0, -2.4, TO([2.1, -1.5]));
  k.push(K(19.6, -3.75, -3.4, OB([-3.75, -2])), K(21.5, -3.75, -3.4, OB([-3.75, -2]))); parada(k, 22.0, 22.8, -3.3, -3.0, TO([-2.95, -1.94]));
  k.push(K(23.6, -2.4, -3.6, OB([-3.75, 0])), K(24.0, -2.4, -3.6), K(25.8, -5.8, -3.8), K(28.8, -7.0, 2.6), K(30.4, -3.2, 4.6, OB([-2, 5.4])), K(30.7, -3.2, 4.6));
  k.push(K(30.9, -3.5, 4.9, CA), K(31.1, -3.5, 4.9, CA1), K(33.1, -1.2, 2.1, { act: 'cargar', mira: [-2.1, 1.6] }), K(33.2, -1.2, 2.1, { act: 'bajar', mira: [-2.1, 1.6] }), K(33.7, -1.2, 2.1, { mira: [-2.1, 1.6] }), K(33.8, -1.2, 2.1));
  parada(k, 34.4, 35.6, -.4, 2.3, TO([-.7, 1.6]));
  k.push(K(38.0, 4.6, 3.0, SE([3.0, -.75])), K(41.0, 4.6, 3.0, OB([3.0, -.75])));
  k.push(K(42.0, 3.2, 3.6, SE([1.05, 6])), K(43.4, 3.2, 3.6, SE([1.05, 6])), K(43.9, 3.4, 4.6, OB([1.05, 1.85])), K(45.4, 3.4, 4.6, OB([1.05, 1.85])));
  parada(k, 47.3, 50.5, .2, 2.4, TO([1.05, 2.0]));
  k.push(K(51.6, 2.2, 3.7, OB([1.05, 1.85])), K(53.0, 2.2, 3.7), K(54.6, 4.4, 7.6, SE([7.5, 6.3])), K(63.8, 4.4, 7.6, SE([7.5, 6.3])), K(64.0, 4.4, 7.6), K(66.6, 6.0, 12.0));
}
{ const k = G.D; // D: marca el eje izquierdo, carga con C, arriostres del lado izquierdo, observa mezzanine, carga panel con C, gabinete, robots
  k.push(K(2.0, -7.5, -1.0)); parada(k, 4.0, 5.0, -3.4, 0, ag([-2.8, 0]));
  k.push(K(8.0, -5.8, 5.2, CA), K(8.2, -5.8, 5.2, CA1), K(10.0, -1.6, 4.5, { act: 'cargar', mira: [-1.2, 3.9] }), K(10.1, -1.6, 4.5, { act: 'bajar', mira: [-1.2, 3.9] }), K(10.7, -1.6, 4.5, { mira: [-1.2, 3.9] }), K(10.8, -1.6, 4.5));
  k.push(K(11.4, -3.5, 2.2)); parada(k, 13.0, 16.5, -3.3, -.75, TO([-2.8, -.75]));
  k.push(K(17.3, -3.4, -2.5), K(18.6, -6.2, -3.4, OB([-3.75, 0])), K(23.5, -6.2, -3.4, OB([-3.75, 0])), K(24.0, -6.2, -3.4), K(26.6, -7.0, 3.6), K(28.4, -5.6, 5.6, OB([-2, 5.4])), K(30.5, -5.6, 5.6));
  k.push(K(30.9, -5.3, 4.9, CA), K(31.1, -5.3, 4.9, CA1), K(33.1, -3.0, 2.1, { act: 'cargar', mira: [-2.1, 1.6] }), K(33.2, -3.0, 2.1, { act: 'bajar', mira: [-2.1, 1.6] }), K(33.7, -3.0, 2.1, { mira: [-2.1, 1.6] }), K(33.8, -3.0, 2.1));
  parada(k, 34.6, 35.6, -2.7, 2.3, TO([-2.1, 1.6]));
  k.push(K(36.4, -3.75, 2.4), K(38.4, -3.75, -2.6), K(39.0, -3.0, -3.4, OB([-2.1, -1.7])), K(41.0, -3.0, -3.4, OB([-2.1, -1.7])));
  k.push(K(44.4, 4.0, -3.0, OB([3.0, -.75])), K(46.2, 4.0, -3.0, OB([3.0, -.75])));
  k.push(K(47.0, 5.4, -3.4, SE([12, -1.72])), K(49.4, 5.4, -3.4, SE([12, -1.72])), K(49.6, 5.4, -3.4, OB([4.3, -1.72])), K(51.6, 5.4, -3.4, OB([4.3, -1.72])));
  parada(k, 52.5, 53.6, 5.7, -1.72, TO([4.3, -1.72]));
  k.push(K(55.6, 10.0, .5), K(57.8, 10.0, 5.0), K(59.4, 9.2, 8.4, OB([7.5, 6.3])), K(63.8, 9.2, 8.4, OB([7.5, 6.3])), K(64.0, 9.2, 8.4), K(66.6, 10.0, 12.0));
}
{ const k = G.P; // operador del puerto: llega cuando se van los técnicos
  k.push(K(64.0, 3.0, 8.5), K(66.8, POS_OP[0], POS_OP[1], OB([1.05, 2.0]))); cargarPuerto(k);
}
// objetos cargados entre dos técnicos: posición final y rotación; el desfase respecto al punto medio se calcula al compilar
export const CARGAS = [
  { a: 'C', b: 'D', t0: 8.0, t1: 10.7, pos: [-1.2, 3.9], ry: 0, obj: 'cajaPlacas' },
  { a: 'C', b: 'D', t0: 30.9, t1: 33.7, pos: [-2.1, 1.6], ry: 0, obj: 'panelCargado' },
];

// ---------- compilación y evaluación (perfil trapezoidal por recorrido) ----------
export function compilar(k) {
  let acum = 0;
  for (let i = 0; i < k.length; i++) {
    const a = k[i], b = k[i + 1]; a.acum = acum; a.y ??= 0;
    a.len = b && b.t > a.t ? Math.hypot(b.x - a.x, b.z - a.z) : 0;
    a.dir = a.len > 1e-3 ? Math.atan2(b.x - a.x, b.z - a.z) : (k[i - 1]?.dir ?? 0);
    acum += a.len;
  }
  for (let i = 0; i < k.length;) {
    if (k[i].len <= 1e-3) { i++; continue; }
    let j = i; while (j < k.length - 1 && k[j].len > 1e-3) j++;
    const run = { i0: i, j, t0: k[i].t, t1: k[j].t, s0: k[i].acum, L: k[j].acum - k[i].acum };
    for (let m = i; m < j; m++) k[m].run = run; i = j;
  }
  return k;
}
export function estado(k, T) {
  if (T <= k[0].t) return { x: k[0].x, y: k[0].y, z: k[0].z, a: k[0], i: 0, mov: false };
  let i = 0; while (i < k.length - 1 && T >= k[i + 1].t) i++;
  const a = k[i];
  if (!a.run) return { x: a.x, y: a.y, z: a.z, a, i, mov: false };
  const r = a.run, s = r.L * perfil(clamp01((T - r.t0) / (r.t1 - r.t0)));
  let m = r.i0; while (m < r.j - 1 && k[m + 1].acum - r.s0 <= s) m++;
  const u = clamp01((s - (k[m].acum - r.s0)) / k[m].len);
  return { x: lerp(k[m].x, k[m + 1].x, u), y: lerp(k[m].y, k[m + 1].y, u), z: lerp(k[m].z, k[m + 1].z, u), a: k[m], i: m, mov: true, s: r.s0 + s };
}
export const posEn = (k, T) => { const e = estado(k, T); return [e.x, e.z]; };
export function evaluar(tec, k, T, dt, snap, ocultarDesde = Infinity) {
  if (T < k[0].t || T >= ocultarDesde) { tec.root.visible = false; return; }
  tec.root.visible = true;
  const e = estado(k, T), a = e.a;
  let fase = NaN, face, act = a.act || 'idle';
  if (e.mov) { fase = e.s / 1.3 * Math.PI * 2; face = a.dir; act = a.carga ? 'cargar' : (a.andar || 'idle'); }
  else face = a.mira ? Math.atan2(a.mira[0] - a.x, a.mira[1] - a.z) : (e.i > 0 && k[e.i - 1].len > 1e-3 ? k[e.i - 1].dir : a.dir);
  tec.root.position.set(e.x, e.y, e.z);
  if (snap) tec.root.rotation.y = face;
  else { let d = face - tec.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); tec.root.rotation.y += d * Math.min(1, dt * 8); }
  tec.taladro.visible = !!a.herr && !e.mov;
  tec.pose(POSES[act] || POSES.idle, fase, dt, snap, T);
}
