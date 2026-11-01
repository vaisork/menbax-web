// Técnico low-poly articulado: pelvis → torso (cabeza, casco, brazos) y piernas con rodilla.
// La altura de la pelvis se calcula con la pierna más extendida, así las botas nunca atraviesan el piso.
import * as THREE from '../anatomia3d/vendor/three.module.min.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...o });
const MAT = {
  casco: std(0xF2C300, { roughness: .4 }),
  chaleco: std(0xFF7A1A),
  reflej: std(0xE9ECEF, { roughness: .25, metalness: .3 }),
  marino: std(0x1E2A4A, { roughness: .9 }),
  piel: std(0xD9B38C, { roughness: .7 }),
  bota: std(0x2B2622),
  guante: std(0xD9A441),
  herr: std(0x1B6E5E, { roughness: .5 }),
  metal: std(0xB0B8C0, { metalness: .85, roughness: .3 }),
};
const A = .42, B = .40, BOTA = .10; // muslo, espinilla, suela

function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}

// Poses objetivo por acción. h = muslo adelante, r = flexión rodilla, s = hombro adelante,
// c = codo (negativo = antebrazo al frente), a = apertura lateral del brazo, lean = tronco adelante.
const BASE = { hL: 0, hR: 0, rL: 0, rR: 0, sL: .05, sR: .05, cL: -.15, cR: -.15, aL: .12, aR: -.12, lean: 0 };
export const POSES = {
  idle: BASE,
  agachado: { ...BASE, hL: 1.25, hR: 1.2, rL: 1.95, rR: 1.9, sL: .95, sR: 1.05, cL: -.5, cR: -.6, aL: .1, aR: -.1, lean: .55 },
  cargar: { ...BASE, sL: .9, sR: .9, cL: -.1, cR: -.1, aL: .08, aR: -.08, lean: .05 },
  bajar: { ...BASE, hL: .6, hR: .6, rL: 1.0, rR: 1.0, sL: .95, sR: .95, cL: -.1, cR: -.1, aL: .08, aR: -.08, lean: .25 },
  tocar: { ...BASE, sR: 1.35, cR: -.1, aR: -.05, lean: .05 },
  senalar: { ...BASE, sR: 1.1, cR: -.05, aR: -.2, sL: .1, cL: -1.2, aL: .3 },
  observar: { ...BASE, sL: .35, sR: .35, cL: -1.55, cR: -1.55, aL: .28, aR: -.28 },
  jalar: { ...BASE, sR: -.6, cR: -.2, aR: -.15, lean: .12 },
  sentado: { ...BASE, hL: 1.5, hR: 1.5, rL: 1.5, rR: 1.5, sL: .85, sR: .85, cL: -.55, cR: -.55, aL: .05, aR: -.05, lean: .08 },
};

export class Tecnico {
  constructor() {
    this.root = new THREE.Group();
    this.pelvis = new THREE.Group(); this.root.add(this.pelvis);
    const T = this.torso = new THREE.Group(); this.pelvis.add(T);
    T.add(box(.34, .5, .2, MAT.marino, 0, .27, 0));
    T.add(box(.38, .4, .25, MAT.chaleco, 0, .3, 0));
    T.add(box(.39, .035, .26, MAT.reflej, 0, .22, 0));
    T.add(box(.39, .035, .26, MAT.reflej, 0, .38, 0));
    T.add(box(.04, .4, .012, MAT.reflej, -.1, .3, .128));
    T.add(box(.04, .4, .012, MAT.reflej, .1, .3, .128));
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 12), MAT.piel);
    cabeza.position.y = .66; cabeza.castShadow = true; T.add(cabeza);
    const casco = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.casco);
    casco.position.y = .665; casco.scale.y = .9; casco.castShadow = true; T.add(casco);
    const ala = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .015, 20), MAT.casco); ala.position.y = .665; T.add(ala);
    T.add(box(.14, .012, .08, MAT.casco, 0, .665, .18));
    const esf = (r, m) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); o.castShadow = true; return o; };
    this.hombro = [-1, 1].map(s => {
      const h = new THREE.Group(); h.position.set(s * .22, .47, 0); T.add(h);
      h.add(esf(.065, MAT.chaleco)); h.add(box(.1, .3, .1, MAT.marino, 0, -.15, 0));
      const codo = new THREE.Group(); codo.position.y = -.3; h.add(codo);
      codo.add(esf(.05, MAT.marino)); codo.add(box(.085, .26, .085, MAT.marino, 0, -.13, 0));
      codo.add(box(.1, .1, .06, MAT.guante, 0, -.31, 0)); codo.add(box(.1, .03, .07, MAT.guante, 0, -.27, .01));
      h.userData.codo = codo; return h;
    });
    this.cadera = [-1, 1].map(s => {
      const c = new THREE.Group(); c.position.set(s * .1, 0, 0); this.pelvis.add(c);
      c.add(esf(.085, MAT.marino)); c.add(box(.15, A, .16, MAT.marino, 0, -A / 2, 0));
      const rod = new THREE.Group(); rod.position.y = -A; c.add(rod);
      rod.add(esf(.075, MAT.marino)); rod.add(box(.13, B, .14, MAT.marino, 0, -B / 2, 0));
      rod.add(box(.14, BOTA, .26, MAT.bota, 0, -B - BOTA / 2, .04));
      rod.add(box(.15, .03, .28, MAT.bota, 0, -B - BOTA + .015, .045)); rod.add(box(.12, .06, .08, MAT.guante, 0, -B - .04, .13));
      c.userData.rodilla = rod; return c;
    });
    // taladro en la mano derecha
    const t = this.taladro = new THREE.Group(); this.hombro[1].userData.codo.add(t); t.position.set(0, -.33, .05);
    t.add(box(.07, .12, .06, MAT.herr, 0, -.02, 0));
    t.add(box(.08, .08, .18, MAT.herr, 0, .07, .06));
    this.broca = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .14, 8), MAT.metal);
    this.broca.rotation.x = Math.PI / 2; this.broca.position.set(0, .07, .22); t.add(this.broca);
    t.visible = false;
    this.j = { ...BASE };
    this.root.visible = false;
  }

  // target: pose objetivo; fase: ciclo de caminata (NaN = parado); snap: aplica sin suavizar
  pose(target, fase, dt, snap, tiempo) {
    const k = snap ? 1 : Math.min(1, dt * 9);
    for (const key in BASE) this.j[key] += (target[key] - this.j[key]) * k;
    const j = this.j, cam = !Number.isNaN(fase);
    let hL = j.hL, hR = j.hR, rL = j.rL, rR = j.rR, sL = j.sL, sR = j.sR, cL = j.cL, cR = j.cR;
    if (cam) {
      const w = Math.min(1, this.w = (this.w ?? 0) + (snap ? 1 : dt * 6)); // entrada suave al paso
      hL += .45 * Math.sin(fase) * w; hR -= .45 * Math.sin(fase) * w;
      rL += Math.max(0, Math.sin(fase + 1.2)) * .8 * w; rR += Math.max(0, Math.sin(fase + 1.2 + Math.PI)) * .8 * w;
      if (target.sL < .5) { sL -= .35 * Math.sin(fase) * w; sR += .35 * Math.sin(fase) * w; cL -= .25 * w; cR -= .25 * w; }
    } else this.w = 0;
    const ext = (h, r) => A * Math.cos(h) + B * Math.cos(h - r);
    this.pelvis.position.y = BOTA + Math.max(ext(hL, rL), ext(hR, rR)) + (cam ? 0 : .008 * Math.sin(tiempo * 2.2));
    this.cadera[0].rotation.x = -hL; this.cadera[1].rotation.x = -hR;
    this.cadera[0].userData.rodilla.rotation.x = rL; this.cadera[1].userData.rodilla.rotation.x = rR;
    this.torso.rotation.x = j.lean;
    this.hombro[0].rotation.set(-sL, 0, j.aL); this.hombro[1].rotation.set(-sR, 0, j.aR);
    this.hombro[0].userData.codo.rotation.x = cL; this.hombro[1].userData.codo.rotation.x = cR;
    if (this.taladro.visible) this.broca.rotation.y += dt * 40;
  }
}
