import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { AvatarConfig } from '../types/quiz';
import {
  ACCESSORY_ITEMS,
  BOTTOM_ITEMS,
  CHARACTER_ITEMS,
  HAIR_ITEMS,
  SHOE_ITEMS,
  TOP_ITEMS,
  findWardrobeItem,
} from '../data/wardrobeCatalog';

let cachedIsSoftwareGl: boolean | null = null;

export function detectSoftwareWebGL(): boolean {
  if (cachedIsSoftwareGl !== null) return cachedIsSoftwareGl;
  if (typeof document === 'undefined') return true;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      cachedIsSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedIsSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedIsSoftwareGl;
  } catch {
    cachedIsSoftwareGl = true;
    return true;
  }
}

export function applyStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmrem.dispose();
  return envTex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(2, 6, 23, 0.55)');
  grad.addColorStop(0.6, 'rgba(2, 6, 23, 0.22)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface AvatarRig {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  headGroup: THREE.Group;
  bodyGroup: THREE.Group;
}

export function buildAvatarGroup(config: AvatarConfig): AvatarRig {
  const charItem = findWardrobeItem(config.characterId, CHARACTER_ITEMS);
  const hairItem = findWardrobeItem(config.hairId, HAIR_ITEMS);
  const topItem = findWardrobeItem(config.topId, TOP_ITEMS);
  const botItem = findWardrobeItem(config.bottomId, BOTTOM_ITEMS);
  const shoeItem = findWardrobeItem(config.shoeId, SHOE_ITEMS);
  const accItem = findWardrobeItem(config.accessoryId, ACCESSORY_ITEMS);

  const isChibi = charItem.bodyStyle === 'chibi';
  const isTall = charItem.bodyStyle === 'tall';
  const isGirl = charItem.bodyStyle === 'girl';

  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // Materials with realistic PBR shading
  const skinMat = new THREE.MeshStandardMaterial({
    color: config.skinColor,
    roughness: 0.56,
    metalness: 0.02,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: topItem.color,
    roughness: 0.68,
    metalness: 0.05,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: topItem.accent || '#fbbf24',
    roughness: 0.35,
    metalness: 0.28,
  });
  const botMat = new THREE.MeshStandardMaterial({
    color: botItem.color,
    roughness: 0.74,
    metalness: 0.04,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairItem.color,
    roughness: 0.42,
    metalness: 0.1,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: shoeItem.color,
    roughness: shoeItem.shoeStyle === 'heels' || shoeItem.shoeStyle === 'loafers' ? 0.25 : 0.48,
    metalness: shoeItem.shoeStyle === 'heels' || shoeItem.shoeStyle === 'loafers' ? 0.22 : 0.08,
  });
  const shoeAccentMat = new THREE.MeshStandardMaterial({
    color: shoeItem.accent || '#f8fafc',
    roughness: 0.35,
    metalness: 0.15,
  });
  const accMat = new THREE.MeshStandardMaterial({
    color: accItem.color,
    roughness: accItem.accessoryStyle === 'crown' || accItem.accessoryStyle === 'halo' ? 0.2 : 0.42,
    metalness: accItem.accessoryStyle === 'crown' || accItem.accessoryStyle === 'halo' ? 0.78 : 0.18,
  });

  // Realistic Human Proportions
  const legLen = isChibi ? 0.48 : isTall ? 0.76 : 0.68;
  const torsoH = isChibi ? 0.46 : isTall ? 0.62 : 0.56;
  const torsoW = isGirl ? 0.36 : isChibi ? 0.38 : 0.44;
  const headR = isChibi ? 0.25 : 0.205;

  // --- ANATOMICAL HUMAN LEGS & DETAILED 3D SHOES ---
  const createLeg = (xSign: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xSign * (isGirl ? 0.105 : 0.12), legLen + 0.08, 0);

    const usePantsColor = botItem.bottomStyle === 'pants';
    const thighLen = legLen * 0.52;
    const calfLen = legLen * 0.48;

    // Sculpted Thigh
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.064, thighLen, 16),
      usePantsColor ? botMat : skinMat
    );
    thigh.position.y = -thighLen / 2;
    thigh.castShadow = true;
    pivot.add(thigh);

    // Shorts overlay if wearing shorts
    if (botItem.bottomStyle === 'shorts') {
      const shortMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.092, 0.08, thighLen * 0.78, 16),
        botMat
      );
      shortMesh.position.y = -thighLen * 0.36;
      shortMesh.castShadow = true;
      pivot.add(shortMesh);
    }

    // Rounded Knee Joint
    const knee = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 12, 12),
      usePantsColor ? botMat : skinMat
    );
    knee.position.set(0, -thighLen, 0.008);
    pivot.add(knee);

    // Sculpted Calf tapering to Ankle
    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.063, 0.044, calfLen, 16),
      usePantsColor ? botMat : skinMat
    );
    calf.position.y = -thighLen - calfLen / 2;
    calf.castShadow = true;
    pivot.add(calf);

    // Detailed 3D Shoe based on shoeItem.shoeStyle
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -legLen - 0.02, 0.035);
    const sStyle = shoeItem.shoeStyle || 'sneaker';

    if (sStyle === 'boots') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.056, 0.15, 14), shoeMat);
      shaft.position.set(0, 0.06, -0.025);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.08, 0.22), shoeMat);
      foot.position.set(0, -0.01, 0.015);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.032, 0.235), shoeAccentMat);
      sole.position.set(0, -0.055, 0.015);
      shoeGroup.add(shaft, foot, sole);
    } else if (sStyle === 'heels') {
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.055, 0.2), shoeMat);
      upper.position.set(0, 0.005, 0.02);
      const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, 0.075, 10), shoeMat);
      heel.position.set(0, -0.04, -0.055);
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), shoeMat);
      toe.scale.set(1, 0.55, 1.3);
      toe.position.set(0, -0.015, 0.1);
      shoeGroup.add(upper, heel, toe);
    } else if (sStyle === 'sandals') {
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.028, 0.21), shoeMat);
      sole.position.set(0, -0.045, 0.015);
      const footSkin = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.042, 0.17), skinMat);
      footSkin.position.set(0, -0.015, 0.01);
      const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.018, 0.04), shoeAccentMat);
      strap1.position.set(0, 0.01, 0.045);
      const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.106, 0.018, 0.032), shoeMat);
      strap2.position.set(0, 0.012, -0.01);
      shoeGroup.add(sole, footSkin, strap1, strap2);
    } else {
      // Sneaker / Sport / Loafers with sculpted toe cap & midsole
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.075, 0.19), shoeMat);
      body.position.set(0, -0.005, 0.0);
      const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), shoeMat);
      toeCap.scale.set(1.0, 0.65, 1.2);
      toeCap.position.set(0, -0.012, 0.09);
      const midsole = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.028, 0.23), shoeAccentMat);
      midsole.position.set(0, -0.05, 0.02);
      shoeGroup.add(body, toeCap, midsole);

      if (sStyle === 'sport' || sStyle === 'sneaker') {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.016, 0.09), shoeAccentMat);
        stripe.position.set(0, -0.004, 0.015);
        shoeGroup.add(stripe);
      } else if (sStyle === 'loafers') {
        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.03), accentMat);
        buckle.position.set(0, 0.034, 0.03);
        shoeGroup.add(buckle);
      }
    }
    shoeGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) obj.castShadow = true;
    });
    pivot.add(shoeGroup);

    return pivot;
  };

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);
  bodyGroup.add(leftLeg, rightLeg);

  // --- PELVIS / HIPS & SKIRT ---
  const hipY = legLen + 0.08;
  if (
    botItem.bottomStyle === 'skirt' ||
    botItem.bottomStyle === 'pleated' ||
    botItem.bottomStyle === 'tutu' ||
    botItem.bottomStyle === 'longskirt'
  ) {
    const skirtH =
      botItem.bottomStyle === 'longskirt'
        ? legLen * 0.9
        : botItem.bottomStyle === 'tutu'
          ? 0.28
          : 0.36;
    const topR = torsoW * 0.44;
    const botR =
      botItem.bottomStyle === 'tutu'
        ? torsoW * 0.88
        : botItem.bottomStyle === 'longskirt'
          ? torsoW * 0.7
          : torsoW * 0.74;
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(topR, botR, skirtH, botItem.bottomStyle === 'pleated' ? 16 : 22),
      botMat
    );
    skirt.position.y = hipY - skirtH * 0.36;
    skirt.castShadow = true;
    bodyGroup.add(skirt);
  } else {
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(torsoW * 0.48, 18, 14), botMat);
    pelvis.scale.set(1.05, 0.56, 0.72);
    pelvis.position.y = hipY + 0.02;
    pelvis.castShadow = true;
    bodyGroup.add(pelvis);
  }

  // --- SCULPTED HUMAN TORSO (Waist, Ribcage, Shoulders & Neck) ---
  const torsoY = hipY + torsoH / 2 + 0.04;

  // Lower torso / waist
  const waistMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      isGirl ? torsoW * 0.4 : torsoW * 0.44,
      isGirl ? torsoW * 0.44 : torsoW * 0.42,
      torsoH * 0.48,
      20
    ),
    topMat
  );
  waistMesh.scale.set(1.0, 1.0, 0.68);
  waistMesh.position.y = hipY + torsoH * 0.24 + 0.02;
  waistMesh.castShadow = true;
  bodyGroup.add(waistMesh);

  // Upper torso / chest & shoulders
  const chestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      isGirl ? torsoW * 0.48 : torsoW * 0.56,
      isGirl ? torsoW * 0.4 : torsoW * 0.44,
      torsoH * 0.58,
      20
    ),
    topMat
  );
  chestMesh.scale.set(1.0, 1.0, 0.68);
  chestMesh.position.y = hipY + torsoH * 0.72 + 0.02;
  chestMesh.castShadow = true;
  bodyGroup.add(chestMesh);

  // Smooth rounded shoulder bridge
  const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(torsoW * 0.47, 18, 14), topMat);
  shoulderCap.scale.set(1.12, 0.34, 0.66);
  shoulderCap.position.y = torsoY + torsoH * 0.44;
  bodyGroup.add(shoulderCap);

  // Collar / Accent Trim
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(torsoW * 0.24, 0.028, 10, 22),
    accentMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = torsoY + torsoH * 0.5;
  bodyGroup.add(collar);

  // Belt / Waist Trim
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoW * 0.44, torsoW * 0.45, 0.048, 20),
    accentMat
  );
  belt.scale.set(1.0, 1.0, 0.7);
  belt.position.y = hipY + 0.055;
  bodyGroup.add(belt);

  // Anatomical Neck
  const neckH = isChibi ? 0.08 : 0.11;
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.068, neckH, 14),
    skinMat
  );
  neck.position.y = torsoY + torsoH * 0.5 + neckH * 0.42;
  bodyGroup.add(neck);

  // --- ARTICULATED HUMAN ARMS & HANDS ---
  const armLen = isChibi ? 0.4 : isTall ? 0.58 : 0.52;
  const createArm = (xSign: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xSign * (torsoW * 0.56), torsoY + torsoH * 0.42, 0);

    // Deltoid shoulder joint
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), topMat);
    pivot.add(shoulder);

    // Upper arm / sleeve
    const upperArmLen = armLen * 0.5;
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.052, upperArmLen, 14),
      topMat
    );
    sleeve.position.y = -upperArmLen / 2;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    // Elbow joint
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinMat);
    elbow.position.y = -upperArmLen;
    pivot.add(elbow);

    // Forearm tapering to wrist
    const forearmLen = armLen * 0.44;
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.036, forearmLen, 14),
      skinMat
    );
    forearm.position.y = -upperArmLen - forearmLen / 2;
    forearm.castShadow = true;
    pivot.add(forearm);

    // Sculpted Human Hand (Palm + Fingers + Thumb)
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -armLen * 0.96, 0);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.068, 0.028), skinMat);
    palm.position.y = -0.025;
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.042, 0.022), skinMat);
    fingers.position.set(0, -0.072, 0.004);
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.009, 0.038, 8), skinMat);
    thumb.rotation.z = xSign * 0.55;
    thumb.position.set(-xSign * 0.032, -0.028, 0.012);
    handGroup.add(palm, fingers, thumb);
    pivot.add(handGroup);

    return pivot;
  };

  const leftArm = createArm(-1);
  const rightArm = createArm(1);
  bodyGroup.add(leftArm, rightArm);

  // --- SCULPTED 3D OUTER SPACE CREATURE (MAKHLUK LUAR ANGKASA) HEAD & FACE ---
  const headGroup = new THREE.Group();
  headGroup.position.y = torsoY + torsoH * 0.5 + neckH + headR * 0.92;
  bodyGroup.add(headGroup);

  const alienGlowColor = charItem.color || '#38bdf8';
  const alienGlowMat = new THREE.MeshStandardMaterial({
    color: alienGlowColor,
    emissive: alienGlowColor,
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.3,
  });

  // Alien teardrop cranium (wider dome, tapered cosmic chin)
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.06, 26, 22), skinMat);
  headMesh.scale.set(0.96, 1.06, 0.96);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Tapered alien chin
  const chin = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.5, 16, 12), skinMat);
  chin.scale.set(0.86, 0.72, 0.8);
  chin.position.set(0, -headR * 0.66, headR * 0.16);
  headGroup.add(chin);

  // Pointed Cosmic Alien Ears on both sides
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.22, headR * 0.62, 12), skinMat);
    ear.rotation.z = side * -1.15;
    ear.rotation.y = side * 0.25;
    ear.position.set(side * headR * 1.02, headR * 0.08, -headR * 0.04);
    ear.castShadow = true;
    headGroup.add(ear);
  });

  // Glowing Cosmic Antennae Pair on top of head
  [-1, 1].forEach((side) => {
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(headR * 0.04, headR * 0.06, headR * 0.82, 10),
      skinMat
    );
    stalk.position.set(side * headR * 0.42, headR * 1.18, headR * 0.04);
    stalk.rotation.z = side * -0.26;
    headGroup.add(stalk);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.14, 14, 12), alienGlowMat);
    orb.position.set(side * headR * 0.54, headR * 1.56, headR * 0.04);
    headGroup.add(orb);
  });

  // Glowing Cosmic Third Eye / Forehead Gem
  const thirdGem = new THREE.Mesh(new THREE.OctahedronGeometry(headR * 0.13, 0), alienGlowMat);
  thirdGem.position.set(0, headR * 0.46, headR * 0.94);
  headGroup.add(thirdGem);

  // Large Expressive Glossy Alien Eyes with Luminous Irises
  const alienEyeShellMat = new THREE.MeshStandardMaterial({
    color: '#070b1a',
    roughness: 0.08,
    metalness: 0.35,
  });
  const alienIrisMat = new THREE.MeshStandardMaterial({
    color: alienGlowColor,
    emissive: alienGlowColor,
    emissiveIntensity: 0.8,
    roughness: 0.15,
  });
  const shineMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 0.85,
    roughness: 0.05,
  });
  const blushMat = new THREE.MeshStandardMaterial({
    color: '#c084fc',
    emissive: '#a855f7',
    emissiveIntensity: 0.25,
    roughness: 0.6,
    transparent: true,
    opacity: 0.42,
  });

  [-1, 1].forEach((side) => {
    // Large almond cosmic eye
    const eyeShell = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.24, 16, 14), alienEyeShellMat);
    eyeShell.scale.set(1.22, 0.92, 0.52);
    eyeShell.rotation.z = side * 0.16;
    eyeShell.position.set(side * headR * 0.36, headR * 0.04, headR * 0.86);
    headGroup.add(eyeShell);

    // Luminous cosmic iris ring
    const iris = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.12, 12, 10), alienIrisMat);
    iris.scale.set(1.0, 1.0, 0.45);
    iris.position.set(side * headR * 0.36, headR * 0.04, headR * 0.95);
    headGroup.add(iris);

    // Starlight catchlight
    const shine = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.048, 8, 8), shineMat);
    shine.position.set(side * headR * 0.41, headR * 0.11, headR * 0.99);
    headGroup.add(shine);

    // Glowing cosmic cheek mark
    const blush = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.11, 8, 8), blushMat);
    blush.scale.set(1.2, 0.5, 0.35);
    blush.position.set(side * headR * 0.48, -headR * 0.22, headR * 0.8);
    headGroup.add(blush);
  });

  // Cute Alien Smile
  const lipsMat = new THREE.MeshStandardMaterial({
    color: '#312e81',
    roughness: 0.35,
  });
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(headR * 0.14, headR * 0.024, 8, 16, Math.PI),
    lipsMat
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, -headR * 0.34, headR * 0.88);
  headGroup.add(smile);

  // Floating Cosmic Aura Ring behind head
  const cosmicHalo = new THREE.Mesh(
    new THREE.TorusGeometry(headR * 1.48, headR * 0.04, 8, 32),
    alienGlowMat
  );
  cosmicHalo.rotation.x = Math.PI * 0.36;
  cosmicHalo.rotation.y = 0.22;
  cosmicHalo.position.set(0, headR * 0.18, -headR * 0.18);
  headGroup.add(cosmicHalo);

  // --- HAIR / HIJAB ---
  const hStyle = hairItem.hairStyle || 'long';
  if (hStyle === 'hijab' || hStyle === 'pashmina') {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.12, 20, 16), hairMat);
    hood.position.set(0, 0.02, -0.05);
    headGroup.add(hood);

    const drape = new THREE.Mesh(
      new THREE.CylinderGeometry(headR * 0.95, headR * 1.25, 0.34, 16),
      hairMat
    );
    drape.position.set(0, -headR * 0.95, 0);
    headGroup.add(drape);
  } else {
    // Base hair cap (positioned above forehead so eyes stay 100% clear)
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 1.08, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    cap.position.y = headR * 0.14;
    headGroup.add(cap);

    if (hStyle === 'long' || hStyle === 'wavy') {
      const backHair = new THREE.Mesh(
        new THREE.CylinderGeometry(headR * 0.95, headR * 1.08, headR * 2.1, 14),
        hairMat
      );
      backHair.position.set(0, -headR * 0.65, -headR * 0.36);
      headGroup.add(backHair);
    } else if (hStyle === 'twintails' || hStyle === 'braids') {
      [-1, 1].forEach((s) => {
        const tail = new THREE.Mesh(
          new THREE.ConeGeometry(headR * 0.34, headR * 1.85, 10),
          hairMat
        );
        tail.position.set(s * headR * 1.05, -headR * 0.35, -headR * 0.15);
        tail.rotation.z = s * 0.22;
        headGroup.add(tail);
      });
    } else if (hStyle === 'ponytail') {
      const pony = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.36, headR * 1.7, 10), hairMat);
      pony.position.set(0, -headR * 0.15, -headR * 1.15);
      pony.rotation.x = -0.35;
      headGroup.add(pony);
    } else if (hStyle === 'bun') {
      [-1, 1].forEach((s) => {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.36, 12, 12), hairMat);
        bun.position.set(s * headR * 0.72, headR * 0.82, -headR * 0.1);
        headGroup.add(bun);
      });
    } else if (hStyle === 'spiky') {
      for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 6), hairMat);
        const angle = (i / 6) * Math.PI * 2;
        spike.position.set(
          Math.cos(angle) * headR * 0.55,
          headR * 0.98,
          Math.sin(angle) * headR * 0.55
        );
        spike.rotation.z = -Math.cos(angle) * 0.45;
        spike.rotation.x = Math.sin(angle) * 0.45;
        headGroup.add(spike);
      }
    } else if (hStyle === 'bob') {
      const bob = new THREE.Mesh(
        new THREE.CylinderGeometry(headR * 1.05, headR * 1.12, headR * 1.1, 14),
        hairMat
      );
      bob.position.set(0, -headR * 0.25, -headR * 0.24);
      headGroup.add(bob);
    } else if (hStyle === 'curly') {
      for (let i = 0; i < 10; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.34, 10, 10), hairMat);
        const a = (i / 10) * Math.PI * 2;
        puff.position.set(Math.cos(a) * headR * 0.72, headR * 0.62, Math.sin(a) * headR * 0.72);
        headGroup.add(puff);
      }
    }
  }

  // --- ACCESSORIES ---
  const aStyle = accItem.accessoryStyle || 'none';
  if (aStyle === 'crown') {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.14, 7), accMat);
    crown.position.y = headR * 1.18;
    headGroup.add(crown);
  } else if (aStyle === 'ribbon') {
    [-1, 1].forEach((s) => {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 6), accMat);
      wing.rotation.z = s * (Math.PI / 2);
      wing.position.set(s * 0.1, headR * 1.12, 0.08);
      headGroup.add(wing);
    });
  } else if (aStyle === 'glasses') {
    [-1, 1].forEach((s) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.22, 0.018, 8, 18), accMat);
      rim.position.set(s * headR * 0.34, headR * 0.05, headR * 0.96);
      headGroup.add(rim);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.24, 0.02, 0.02), accMat);
    bridge.position.set(0, headR * 0.07, headR * 0.96);
    headGroup.add(bridge);
  } else if (aStyle === 'headphones') {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(headR * 1.12, 0.032, 8, 22, Math.PI),
      accMat
    );
    band.position.y = headR * 0.05;
    headGroup.add(band);
    [-1, 1].forEach((s) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), accMat);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(s * headR * 1.12, 0, 0);
      headGroup.add(cup);
    });
  } else if (aStyle === 'gradcap') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.72, headR * 0.72, 0.1, 12), accMat);
    base.position.y = headR * 1.04;
    headGroup.add(base);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.56), accMat);
    board.position.y = headR * 1.12;
    board.rotation.y = Math.PI / 4;
    headGroup.add(board);
    const tassel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.025, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: accItem.accent || '#fbbf24', roughness: 0.4 })
    );
    tassel.position.set(0.24, headR * 1.0, 0.14);
    headGroup.add(tassel);
  } else if (aStyle === 'wings') {
    [-1, 1].forEach((s) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.04), accMat);
      wing.position.set(s * 0.34, torsoY + 0.06, -0.24);
      wing.rotation.y = s * -0.45;
      wing.rotation.z = s * 0.2;
      bodyGroup.add(wing);
    });
  } else if (aStyle === 'halo') {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(headR * 0.75, 0.028, 10, 24),
      new THREE.MeshStandardMaterial({
        color: accItem.color,
        emissive: accItem.color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = headR * 1.38;
    headGroup.add(halo);
  } else if (aStyle === 'backpack') {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), accMat);
    pack.position.set(0, torsoY, -torsoW * 0.58);
    pack.castShadow = true;
    bodyGroup.add(pack);
  } else if (aStyle === 'scarf') {
    const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.36, 0.06, 10, 20), accMat);
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.y = torsoY + torsoH / 2 + 0.02;
    bodyGroup.add(scarfRing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.05), accMat);
    tail.position.set(0.12, torsoY + torsoH * 0.22, torsoW * 0.44);
    bodyGroup.add(tail);
  } else if (aStyle === 'beret') {
    const beret = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.95, 16, 10), accMat);
    beret.scale.set(1.15, 0.42, 1.15);
    beret.position.set(0.06, headR * 1.06, 0);
    beret.rotation.z = -0.22;
    headGroup.add(beret);
  } else if (aStyle === 'cat_ears') {
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 4), accMat);
      ear.position.set(s * headR * 0.65, headR * 1.05, 0.05);
      ear.rotation.z = s * -0.25;
      headGroup.add(ear);
    });
  } else if (aStyle === 'wizard_hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(headR * 1.5, headR * 1.5, 0.04, 18), accMat);
    brim.position.y = headR * 0.95;
    headGroup.add(brim);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.92, 0.56, 14), accMat);
    cone.position.y = headR * 1.38;
    headGroup.add(cone);
  } else if (aStyle === 'cape') {
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.72, 0.04), accMat);
    cape.position.set(0, torsoY - 0.12, -torsoW * 0.54);
    cape.rotation.x = 0.14;
    bodyGroup.add(cape);
  } else if (aStyle === 'bowtie') {
    [-1, 1].forEach((s) => {
      const bow = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), accMat);
      bow.rotation.z = s * (Math.PI / 2);
      bow.position.set(s * 0.06, torsoY + torsoH * 0.36, torsoW * 0.46);
      bodyGroup.add(bow);
    });
  } else if (aStyle === 'star_wand') {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), accMat);
    stick.position.set(0, -armLen - 0.05, 0.18);
    stick.rotation.x = Math.PI / 2;
    rightArm.add(stick);
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09, 0),
      new THREE.MeshStandardMaterial({
        color: '#fde047',
        emissive: '#f59e0b',
        emissiveIntensity: 0.65,
        roughness: 0.2,
      })
    );
    star.position.set(0, -armLen - 0.05, 0.44);
    rightArm.add(star);
  }

  return { group, leftArm, rightArm, leftLeg, rightLeg, headGroup, bodyGroup };
}
