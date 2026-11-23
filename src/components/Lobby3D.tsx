import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { AvatarConfig, EmoteType, LobbyPlayer } from '../types/quiz';
import {
  applyStudioEnvironment,
  buildAvatarGroup,
  detectSoftwareWebGL,
  type AvatarRig,
} from '../three/avatarBuilder';

export type AttractionId =
  | 'ferris'
  | 'carousel'
  | 'korakora'
  | 'trampoline'
  | 'wheel'
  | 'fireworks';

export interface NearbyAttraction {
  id: AttractionId;
  name: string;
  actionLabel: string;
  isRiding: boolean;
}

export interface AttractionActionEvent {
  id: AttractionId;
  title: string;
  message: string;
  ticketsEarned?: number;
}

interface BubbleState {
  id: string;
  name: string;
  message?: string;
  screenX: number;
  screenY: number;
  visible: boolean;
}

interface Lobby3DProps {
  localPlayerName: string;
  localAvatar: AvatarConfig;
  otherPlayers: LobbyPlayer[];
  latestChat: { sender: string; text: string; id: string } | null;
  emoteCommand: { type: EmoteType; seq: number } | null;
  interactCommand: { seq: number } | null;
  teleportCommand: { x: number; z: number; label: string; seq: number } | null;
  activeKeysRef: React.MutableRefObject<Record<string, boolean>>;
  onZoneChange?: (zoneName: string) => void;
  onNearbyAttractionChange?: (nearby: NearbyAttraction | null) => void;
  onAttractionAction?: (event: AttractionActionEvent) => void;
}

interface ActorState {
  id: string;
  name: string;
  isLocal: boolean;
  rig: AvatarRig;
  pos: THREE.Vector3;
  velY: number;
  rotY: number;
  targetX: number;
  targetZ: number;
  walkPhase: number;
  emote: EmoteType | null;
  emoteTimer: number;
  bubbleText: string;
  bubbleTimer: number;
}

interface FireworkParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface AttractionZone {
  id: AttractionId;
  name: string;
  actionLabel: string;
  x: number;
  z: number;
  radius: number;
  exitX: number;
  exitZ: number;
  rideable: boolean;
}

const ATTRACTIONS: AttractionZone[] = [
  {
    id: 'ferris',
    name: 'Bianglala Galaksi',
    actionLabel: 'Naik Bianglala',
    x: -24,
    z: -20,
    radius: 8.5,
    exitX: -16,
    exitZ: -16,
    rideable: true,
  },
  {
    id: 'carousel',
    name: 'Komidi Putar Kosmik',
    actionLabel: 'Naik Komidi Putar',
    x: 24,
    z: -20,
    radius: 8.0,
    exitX: 16,
    exitZ: -16,
    rideable: true,
  },
  {
    id: 'korakora',
    name: 'Kora-Kora Viking Galaksi',
    actionLabel: 'Naik Kora-Kora',
    x: -26,
    z: 20,
    radius: 8.5,
    exitX: -17,
    exitZ: 18,
    rideable: true,
  },
  {
    id: 'trampoline',
    name: 'Trampolin Gravitasi',
    actionLabel: 'Lompat Super!',
    x: 24,
    z: 20,
    radius: 6.5,
    exitX: 18,
    exitZ: 18,
    rideable: false,
  },
  {
    id: 'wheel',
    name: 'Kios Roda Keberuntungan',
    actionLabel: 'Putar Roda Berhadiah',
    x: 0,
    z: -32,
    radius: 7.0,
    exitX: 0,
    exitZ: -25,
    rideable: false,
  },
  {
    id: 'fireworks',
    name: 'Panggung Kembang Api',
    actionLabel: 'Luncurkan Kembang Api!',
    x: 0,
    z: 32,
    radius: 7.5,
    exitX: 0,
    exitZ: 25,
    rideable: false,
  },
];

const PRIZE_OUTCOMES = [
  { label: 'JACKPOT! Mahkota Pasar Malam', tickets: 100 },
  { label: 'Boneka Astronot Raksasa', tickets: 60 },
  { label: 'Gulali Galaksi Pelangi', tickets: 35 },
  { label: 'Kembang Api Emas Spesial', tickets: 50 },
  { label: 'Lampion Bintang Keberuntungan', tickets: 40 },
  { label: 'Tiket VIP Bianglala', tickets: 75 },
];

function createPlazaTileTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#090d1f';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#131d3a';
  ctx.fillRect(4, 4, 120, 120);
  ctx.fillRect(132, 132, 120, 120);

  ctx.fillStyle = '#0e162e';
  ctx.fillRect(132, 4, 120, 120);
  ctx.fillRect(4, 132, 120, 120);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 252, 252);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(52, 52);
  return tex;
}

function createNightMarketStall(accentColor: string, roofColor: string): THREE.Group {
  const group = new THREE.Group();

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 1.25, 2.2),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.55 })
  );
  counter.position.y = 0.62;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  const neonStrip = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.14, 2.3),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 1.3,
    })
  );
  neonStrip.position.y = 1.24;
  group.add(neonStrip);

  const poleMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.6, roughness: 0.35 });
  [
    [-2.0, -0.95],
    [2.0, -0.95],
    [-2.0, 0.95],
    [2.0, 0.95],
  ].forEach(([px, pz]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), poleMat);
    pole.position.set(px, 1.6, pz);
    group.add(pole);
  });

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 1.35, 4),
    new THREE.MeshStandardMaterial({
      color: roofColor,
      emissive: roofColor,
      emissiveIntensity: 0.25,
      roughness: 0.5,
    })
  );
  roof.position.y = 3.75;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Festive hanging bulbs on front awning
  const bulbColors = ['#fde047', '#f472b6', '#38bdf8', '#34d399', '#fb923c'];
  for (let i = 0; i < 5; i++) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshStandardMaterial({
        color: bulbColors[i],
        emissive: bulbColors[i],
        emissiveIntensity: 1.8,
      })
    );
    bulb.position.set(-1.6 + i * 0.8, 3.02, 1.15);
    group.add(bulb);
  }

  return group;
}

function createFerrisWheel(): {
  group: THREE.Group;
  wheelPivot: THREE.Group;
  gondolas: THREE.Group[];
} {
  const group = new THREE.Group();

  // Base platform
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(7.2, 7.8, 0.5, 24),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.4 })
  );
  base.position.y = 0.25;
  base.receiveShadow = true;
  group.add(base);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(7.1, 0.14, 8, 36),
    new THREE.MeshStandardMaterial({
      color: '#f472b6',
      emissive: '#f472b6',
      emissiveIntensity: 1.4,
    })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.54;
  group.add(baseRing);

  // Twin A-frame support towers
  const towerMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    metalness: 0.65,
    roughness: 0.3,
  });
  [-2.2, 2.2].forEach((zOff) => {
    [-1, 1].forEach((side) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 13.5, 10), towerMat);
      leg.position.set(side * 2.8, 6.4, zOff);
      leg.rotation.z = side * 0.22;
      group.add(leg);
    });
  });

  // Central axle
  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 5.2, 16),
    new THREE.MeshStandardMaterial({
      color: '#fde047',
      emissive: '#f59e0b',
      emissiveIntensity: 0.8,
      metalness: 0.6,
    })
  );
  axle.rotation.x = Math.PI / 2;
  axle.position.y = 12.2;
  group.add(axle);

  // Rotating Wheel Pivot
  const wheelPivot = new THREE.Group();
  wheelPivot.position.y = 12.2;
  group.add(wheelPivot);

  const wheelRadius = 9.2;
  [-1.0, 1.0].forEach((zOff) => {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(wheelRadius, 0.2, 10, 48),
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0ea5e9',
        emissiveIntensity: 1.35,
      })
    );
    rim.position.z = zOff;
    wheelPivot.add(rim);
  });

  const innerRim = new THREE.Mesh(
    new THREE.TorusGeometry(wheelRadius * 0.55, 0.14, 8, 36),
    new THREE.MeshStandardMaterial({
      color: '#fde047',
      emissive: '#f59e0b',
      emissiveIntensity: 1.1,
    })
  );
  wheelPivot.add(innerRim);

  const gondolas: THREE.Group[] = [];
  const cabinColors = [
    '#f43f5e',
    '#38bdf8',
    '#fbbf24',
    '#34d399',
    '#a855f7',
    '#fb923c',
  ];

  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const gx = Math.cos(angle) * wheelRadius;
    const gy = Math.sin(angle) * wheelRadius;

    // Spoke
    const spoke = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, wheelRadius, 6),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.6 })
    );
    spoke.position.set(gx * 0.5, gy * 0.5, 0);
    spoke.rotation.z = angle - Math.PI / 2;
    wheelPivot.add(spoke);

    // Gondola cabin
    const gondola = new THREE.Group();
    gondola.position.set(gx, gy, 0);
    const color = cabinColors[i % cabinColors.length];

    const cabinFloor = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.05, 1.7),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.45,
        roughness: 0.35,
      })
    );
    cabinFloor.position.y = -1.25;
    gondola.add(cabinFloor);

    const hanger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0' })
    );
    hanger.position.y = -0.55;
    gondola.add(hanger);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 0.5, 4),
      new THREE.MeshStandardMaterial({
        color: '#fde047',
        emissive: '#f59e0b',
        emissiveIntensity: 0.6,
      })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = -0.1;
    gondola.add(roof);

    wheelPivot.add(gondola);
    gondolas.push(gondola);
  }

  return { group, wheelPivot, gondolas };
}

function createCarousel(): {
  group: THREE.Group;
  deckPivot: THREE.Group;
  horses: THREE.Group[];
} {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(6.8, 7.2, 0.55, 28),
    new THREE.MeshStandardMaterial({ color: '#312e81', roughness: 0.45 })
  );
  base.position.y = 0.27;
  base.receiveShadow = true;
  group.add(base);

  const deckPivot = new THREE.Group();
  deckPivot.position.y = 0.56;
  group.add(deckPivot);

  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(6.2, 6.2, 0.24, 28),
    new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.4 })
  );
  deckPivot.add(deck);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(6.2, 0.15, 8, 36),
    new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 1.4,
    })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.14;
  deckPivot.add(trim);

  // Center pillar
  const centerPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.35, 5.4, 16),
    new THREE.MeshStandardMaterial({
      color: '#f472b6',
      emissive: '#db2777',
      emissiveIntensity: 0.4,
      roughness: 0.35,
    })
  );
  centerPillar.position.y = 2.7;
  deckPivot.add(centerPillar);

  // Striped Carnival Canopy Roof
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(6.9, 2.8, 16),
    new THREE.MeshStandardMaterial({
      color: '#ec4899',
      emissive: '#9d174d',
      emissiveIntensity: 0.35,
      roughness: 0.4,
    })
  );
  canopy.position.y = 6.7;
  deckPivot.add(canopy);

  const roofTrim = new THREE.Mesh(
    new THREE.TorusGeometry(6.6, 0.18, 8, 32),
    new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#38bdf8',
      emissiveIntensity: 1.5,
    })
  );
  roofTrim.rotation.x = Math.PI / 2;
  roofTrim.position.y = 5.35;
  deckPivot.add(roofTrim);

  const starTop = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 0),
    new THREE.MeshStandardMaterial({
      color: '#fde047',
      emissive: '#f59e0b',
      emissiveIntensity: 1.6,
    })
  );
  starTop.position.y = 8.5;
  deckPivot.add(starTop);

  // 8 Carousel mounts (glowing space ponies/rockets)
  const horses: THREE.Group[] = [];
  const mountColors = ['#38bdf8', '#fbbf24', '#34d399', '#f472b6', '#a78bfa', '#fb923c', '#22d3ee', '#f43f5e'];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 4.4;
    const px = Math.cos(angle) * r;
    const pz = Math.sin(angle) * r;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 5.2, 8),
      new THREE.MeshStandardMaterial({ color: '#fde047', metalness: 0.7, roughness: 0.25 })
    );
    pole.position.set(px, 2.6, pz);
    deckPivot.add(pole);

    const horse = new THREE.Group();
    horse.position.set(px, 1.35, pz);
    horse.rotation.y = -angle;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.7, 1.6),
      new THREE.MeshStandardMaterial({
        color: mountColors[i],
        emissive: mountColors[i],
        emissiveIntensity: 0.4,
        roughness: 0.35,
      })
    );
    horse.add(body);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.55, 0.55),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 })
    );
    head.position.set(0, 0.45, 0.65);
    horse.add(head);

    deckPivot.add(horse);
    horses.push(horse);
  }

  return { group, deckPivot, horses };
}

function createKoraKora(): {
  group: THREE.Group;
  shipPivot: THREE.Group;
} {
  const group = new THREE.Group();

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.45, 7),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 })
  );
  platform.position.y = 0.22;
  platform.receiveShadow = true;
  group.add(platform);

  const frameMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.65, roughness: 0.3 });
  [-2.6, 2.6].forEach((zOff) => {
    [-1, 1].forEach((side) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 11.2, 10), frameMat);
      leg.position.set(side * 2.5, 5.4, zOff);
      leg.rotation.z = side * 0.22;
      group.add(leg);
    });
  });

  const topBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 6.2, 12),
    new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0ea5e9',
      emissiveIntensity: 1.1,
    })
  );
  topBar.rotation.x = Math.PI / 2;
  topBar.position.y = 10.6;
  group.add(topBar);

  const shipPivot = new THREE.Group();
  shipPivot.position.y = 10.6;
  group.add(shipPivot);

  // Suspension arms
  [-1.8, 1.8].forEach((zOff) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 8.2, 8),
      new THREE.MeshStandardMaterial({ color: '#fde047', metalness: 0.6 })
    );
    arm.position.set(0, -4.1, zOff);
    shipPivot.add(arm);
  });

  // Viking Pirate Ship Hull
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 1.45, 3.1),
    new THREE.MeshStandardMaterial({
      color: '#7c2d12',
      emissive: '#ea580c',
      emissiveIntensity: 0.25,
      roughness: 0.5,
    })
  );
  hull.position.y = -8.0;
  shipPivot.add(hull);

  // Glowing neon trim along ship
  const shipTrim = new THREE.Mesh(
    new THREE.BoxGeometry(9.0, 0.22, 3.25),
    new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 1.4,
    })
  );
  shipTrim.position.y = -7.3;
  shipPivot.add(shipTrim);

  // Dragon/Viking prows on both ends
  [-1, 1].forEach((dir) => {
    const prow = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 2.8, 6),
      new THREE.MeshStandardMaterial({
        color: '#f43f5e',
        emissive: '#e11d48',
        emissiveIntensity: 0.7,
      })
    );
    prow.position.set(dir * 4.8, -6.5, 0);
    prow.rotation.z = -dir * 0.5;
    shipPivot.add(prow);
  });

  return { group, shipPivot };
}

function createTrampolinePark(): { group: THREE.Group; pad: THREE.Mesh } {
  const group = new THREE.Group();

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.4, 0.45, 12, 32),
    new THREE.MeshStandardMaterial({
      color: '#a855f7',
      emissive: '#9333ea',
      emissiveIntensity: 0.9,
      roughness: 0.35,
    })
  );
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 0.55;
  group.add(outerRing);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(4.1, 4.1, 0.3, 28),
    new THREE.MeshStandardMaterial({
      color: '#06b6d4',
      emissive: '#22d3ee',
      emissiveIntensity: 0.85,
      roughness: 0.25,
    })
  );
  pad.position.y = 0.52;
  group.add(pad);

  // 4 Inflatable Balloon Towers around trampoline
  const balloonColors = ['#f472b6', '#fde047', '#34d399', '#38bdf8'];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.32, 3.6, 10),
      new THREE.MeshStandardMaterial({ color: balloonColors[i], roughness: 0.35 })
    );
    pole.position.set(Math.cos(a) * 4.7, 1.8, Math.sin(a) * 4.7);
    group.add(pole);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 14, 14),
      new THREE.MeshStandardMaterial({
        color: balloonColors[i],
        emissive: balloonColors[i],
        emissiveIntensity: 1.1,
      })
    );
    orb.position.set(Math.cos(a) * 4.7, 4.1, Math.sin(a) * 4.7);
    group.add(orb);
  }

  return { group, pad };
}

function createPrizeWheelBooth(): { group: THREE.Group; wheelMesh: THREE.Group } {
  const group = new THREE.Group();

  const stall = createNightMarketStall('#fbbf24', '#e11d48');
  stall.scale.set(1.35, 1.25, 1.25);
  group.add(stall);

  // Spinning Fortune Wheel mounted prominently on front-top
  const wheelMesh = new THREE.Group();
  wheelMesh.position.set(0, 3.4, 1.55);
  group.add(wheelMesh);

  const wheelBack = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.75, 0.2, 24),
    new THREE.MeshStandardMaterial({
      color: '#fde047',
      emissive: '#f59e0b',
      emissiveIntensity: 0.9,
    })
  );
  wheelBack.rotation.x = Math.PI / 2;
  wheelMesh.add(wheelBack);

  const segColors = ['#f43f5e', '#38bdf8', '#34d399', '#a855f7', '#fb923c', '#eab308', '#ec4899', '#22d3ee'];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const peg = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1.45, 0.28),
      new THREE.MeshStandardMaterial({
        color: segColors[i],
        emissive: segColors[i],
        emissiveIntensity: 1.0,
      })
    );
    peg.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, 0.05);
    peg.rotation.z = angle - Math.PI / 2;
    wheelMesh.add(peg);
  }

  // Pointer triangle at top of wheel
  const pointer = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.65, 4),
    new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fde047', emissiveIntensity: 1.5 })
  );
  pointer.rotation.z = Math.PI;
  pointer.position.set(0, 5.35, 1.65);
  group.add(pointer);

  return { group, wheelMesh };
}

function createFireworksStage(): THREE.Group {
  const group = new THREE.Group();

  const stage = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 6.2, 0.65, 24),
    new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.45 })
  );
  stage.position.y = 0.32;
  stage.receiveShadow = true;
  group.add(stage);

  const stageGlow = new THREE.Mesh(
    new THREE.TorusGeometry(5.6, 0.16, 10, 36),
    new THREE.MeshStandardMaterial({
      color: '#34d399',
      emissive: '#10b981',
      emissiveIntensity: 1.5,
    })
  );
  stageGlow.rotation.x = Math.PI / 2;
  stageGlow.position.y = 0.68;
  group.add(stageGlow);

  // Twin fireworks launcher cannons
  [-2.6, 2.6].forEach((xOff) => {
    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.48, 2.1, 12),
      new THREE.MeshStandardMaterial({
        color: '#f43f5e',
        emissive: '#be123c',
        emissiveIntensity: 0.5,
        metalness: 0.5,
      })
    );
    cannon.position.set(xOff, 1.6, 0);
    group.add(cannon);
  });

  // Glowing Launch Button Pedestal in center
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 1.25, 12),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4 })
  );
  pedestal.position.set(0, 1.25, -1.5);
  group.add(pedestal);

  const buttonOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 14, 14),
    new THREE.MeshStandardMaterial({
      color: '#fde047',
      emissive: '#f59e0b',
      emissiveIntensity: 1.8,
    })
  );
  buttonOrb.position.set(0, 2.05, -1.5);
  group.add(buttonOrb);

  return group;
}

function createStringLightArc(start: THREE.Vector3, end: THREE.Vector3): THREE.Group {
  const group = new THREE.Group();
  const colors = ['#fde047', '#f472b6', '#38bdf8', '#34d399', '#fb923c'];
  const bulbs = 7;
  for (let i = 1; i < bulbs; i++) {
    const t = i / bulbs;
    const pos = new THREE.Vector3().lerpVectors(start, end, t);
    // Gentle catenary sag
    pos.y -= Math.sin(t * Math.PI) * 1.1;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: 1.9,
      })
    );
    bulb.position.copy(pos);
    group.add(bulb);
  }
  return group;
}

function createCompositeTree(): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 1.8, 8),
    new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.85 })
  );
  trunk.position.y = 0.9;
  tree.add(trunk);

  [
    { y: 2.1, r: 1.1, h: 1.5, c: '#14b8a6' },
    { y: 2.95, r: 0.85, h: 1.25, c: '#0ea5e9' },
    { y: 3.65, r: 0.56, h: 0.95, c: '#38bdf8' },
  ].forEach((tier) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(tier.r, tier.h, 8),
      new THREE.MeshStandardMaterial({
        color: tier.c,
        emissive: '#0c4a6e',
        emissiveIntensity: 0.25,
        roughness: 0.75,
      })
    );
    cone.position.y = tier.y;
    tree.add(cone);
  });
  return tree;
}

export const Lobby3D: React.FC<Lobby3DProps> = ({
  localPlayerName,
  localAvatar,
  otherPlayers,
  latestChat,
  emoteCommand,
  interactCommand,
  teleportCommand,
  activeKeysRef,
  onZoneChange,
  onNearbyAttractionChange,
  onAttractionAction,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const actorsRef = useRef<Map<string, ActorState>>(new Map());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const lastZoneRef = useRef<string>('');
  const lastNearbyKeyRef = useRef<string>('');
  const localAvatarRef = useRef<AvatarConfig>(localAvatar);
  const localNameRef = useRef<string>(localPlayerName);
  const onZoneChangeRef = useRef(onZoneChange);
  const onNearbyRef = useRef(onNearbyAttractionChange);
  const onActionRef = useRef(onAttractionAction);

  // Interactive carnival state refs
  const ridingAttractionRef = useRef<AttractionId | null>(null);
  const wheelSpinSpeedRef = useRef<number>(0.4);
  const triggerInteractFnRef = useRef<(() => void) | null>(null);
  const spawnFireworksFnRef = useRef<((origin: THREE.Vector3) => void) | null>(null);

  localAvatarRef.current = localAvatar;
  localNameRef.current = localPlayerName;
  onZoneChangeRef.current = onZoneChange;
  onNearbyRef.current = onNearbyAttractionChange;
  onActionRef.current = onAttractionAction;

  // Initialize Three.js Pasar Malam Galaksi 3D World
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftware = detectSoftwareWebGL();
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05091a');
    scene.fog = new THREE.FogExp2('#070d24', 0.0085);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 240);
    camera.position.set(0, 9.5, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftware, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftware ? 1 : 2));
    renderer.shadowMap.enabled = !isSoftware;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const envTex = isSoftware ? null : applyStudioEnvironment(renderer, scene);

    // 3D Starry Night Sky Dome
    const starCount = isSoftware ? 450 : 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.12 + Math.random() * 0.88);
      const r = 95 + Math.random() * 45;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starField = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: '#e0f2fe', size: 0.72, transparent: true, opacity: 0.9 })
    );
    scene.add(starField);

    // Night Market Festive Lighting
    scene.add(new THREE.HemisphereLight('#c4b5fd', '#0f172a', 1.15));
    const dirLight = new THREE.DirectionalLight('#fef3c7', 1.35);
    dirLight.position.set(22, 34, 24);
    dirLight.castShadow = !isSoftware;
    if (!isSoftware) {
      dirLight.shadow.mapSize.set(1024, 1024);
      dirLight.shadow.camera.left = -45;
      dirLight.shadow.camera.right = 45;
      dirLight.shadow.camera.top = 45;
      dirLight.shadow.camera.bottom = -45;
    }
    scene.add(dirLight);

    // Colored Carnival Zone Lights
    const ferrisLight = new THREE.PointLight('#f472b6', 3.0, 32);
    ferrisLight.position.set(-24, 12, -20);
    scene.add(ferrisLight);

    const carouselLight = new THREE.PointLight('#fbbf24', 3.0, 30);
    carouselLight.position.set(24, 8, -20);
    scene.add(carouselLight);

    const koraLight = new THREE.PointLight('#fb923c', 2.6, 28);
    koraLight.position.set(-26, 9, 20);
    scene.add(koraLight);

    const trampLight = new THREE.PointLight('#22d3ee', 2.6, 26);
    trampLight.position.set(24, 6, 20);
    scene.add(trampLight);

    // Massive 65m-radius Ground Plane
    const tileTex = createPlazaTileTexture();
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(72, 64),
      new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.85, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Central Glowing Plaza Ring & Fountain
    const plazaRing = new THREE.Mesh(
      new THREE.RingGeometry(7.2, 8.0, 48),
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#38bdf8',
        emissiveIntensity: 0.9,
        side: THREE.DoubleSide,
      })
    );
    plazaRing.rotation.x = -Math.PI / 2;
    plazaRing.position.y = 0.02;
    scene.add(plazaRing);

    const outerWalkRing = new THREE.Mesh(
      new THREE.RingGeometry(31.5, 32.3, 64),
      new THREE.MeshStandardMaterial({
        color: '#f472b6',
        emissive: '#ec4899',
        emissiveIntensity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    outerWalkRing.rotation.x = -Math.PI / 2;
    outerWalkRing.position.y = 0.02;
    scene.add(outerWalkRing);

    // 4 Illuminated Starlight Avenues
    const avenueMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      emissive: '#1e1b4b',
      emissiveIntensity: 0.5,
      roughness: 0.65,
    });
    const nsAvenue = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 68), avenueMat);
    nsAvenue.rotation.x = -Math.PI / 2;
    nsAvenue.position.y = 0.012;
    scene.add(nsAvenue);

    const ewAvenue = new THREE.Mesh(new THREE.PlaneGeometry(68, 4.4), avenueMat);
    ewAvenue.rotation.x = -Math.PI / 2;
    ewAvenue.position.y = 0.013;
    scene.add(ewAvenue);

    // Center Crystal Fountain
    const fountainGroup = new THREE.Group();
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.9, 0.72, 24),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.3 })
    );
    basin.position.y = 0.36;
    fountainGroup.add(basin);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 0.14, 24),
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0284c7',
        emissiveIntensity: 0.9,
        roughness: 0.15,
      })
    );
    water.position.y = 0.72;
    fountainGroup.add(water);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.95, 0),
      new THREE.MeshStandardMaterial({
        color: '#fde047',
        emissive: '#f59e0b',
        emissiveIntensity: 1.2,
      })
    );
    crystal.position.y = 2.6;
    fountainGroup.add(crystal);
    scene.add(fountainGroup);

    // ===== 6 INTERACTIVE PASAR MALAM ATTRACTIONS =====
    const ferris = createFerrisWheel();
    ferris.group.position.set(-24, 0, -20);
    ferris.group.rotation.y = Math.PI / 5;
    scene.add(ferris.group);

    const carousel = createCarousel();
    carousel.group.position.set(24, 0, -20);
    scene.add(carousel.group);

    const korakora = createKoraKora();
    korakora.group.position.set(-26, 0, 20);
    korakora.group.rotation.y = Math.PI / 6;
    scene.add(korakora.group);

    const trampoline = createTrampolinePark();
    trampoline.group.position.set(24, 0, 20);
    scene.add(trampoline.group);

    const prizeBooth = createPrizeWheelBooth();
    prizeBooth.group.position.set(0, 0, -32);
    scene.add(prizeBooth.group);

    const fireworksStage = createFireworksStage();
    fireworksStage.position.set(0, 0, 32);
    scene.add(fireworksStage);

    // ===== FESTIVE NIGHT MARKET FOOD & SNACK STALLS =====
    const stallConfigs = [
      { x: -11, z: -13, rot: Math.PI / 4, accent: '#f472b6', roof: '#db2777' }, // Gulali
      { x: 11, z: -13, rot: -Math.PI / 4, accent: '#fbbf24', roof: '#d97706' }, // Jagung Bakar
      { x: -11, z: 13, rot: (3 * Math.PI) / 4, accent: '#34d399', roof: '#059669' }, // Es Krim Kosmik
      { x: 11, z: 13, rot: -(3 * Math.PI) / 4, accent: '#38bdf8', roof: '#0284c7' }, // Martabak Galaksi
      { x: -34, z: 0, rot: Math.PI / 2, accent: '#a855f7', roof: '#7e22ce' }, // Kios Lampion
      { x: 34, z: 0, rot: -Math.PI / 2, accent: '#fb923c', roof: '#ea580c' }, // Kios Permainan
    ];
    stallConfigs.forEach((sc) => {
      const stall = createNightMarketStall(sc.accent, sc.roof);
      stall.position.set(sc.x, 0, sc.z);
      stall.rotation.y = sc.rot;
      scene.add(stall);
    });

    // Overhead Pasar Malam String Light Poles & Festive Bulb Garlands
    const lampPosts: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 17.5;
      const lx = Math.cos(angle) * r;
      const lz = Math.sin(angle) * r;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.12, 4.6, 8),
        new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.6 })
      );
      pole.position.set(lx, 2.3, lz);
      scene.add(pole);

      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 10),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? '#fde047' : '#f472b6',
          emissive: i % 2 === 0 ? '#f59e0b' : '#ec4899',
          emissiveIntensity: 1.8,
        })
      );
      lantern.position.set(lx, 4.7, lz);
      scene.add(lantern);
      lampPosts.push(new THREE.Vector3(lx, 4.55, lz));
    }

    for (let i = 0; i < lampPosts.length; i++) {
      const a = lampPosts[i];
      const b = lampPosts[(i + 1) % lampPosts.length];
      scene.add(createStringLightArc(a, b));
    }

    // Perimeter Glowing Trees around the huge 65m carnival boundary
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const r = 52 + (i % 3) * 4.5;
      const tree = createCompositeTree();
      tree.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      const s = 1.0 + (i % 4) * 0.18;
      tree.scale.set(s, s, s);
      scene.add(tree);
    }

    // Fireworks Particle Pool
    const fireworkParticles: FireworkParticle[] = [];
    const fwGeo = new THREE.SphereGeometry(0.26, 6, 6);
    const fwColors = ['#fde047', '#f472b6', '#38bdf8', '#34d399', '#fb923c', '#c084fc'];

    const spawnFireworkBurst = (origin: THREE.Vector3) => {
      const bursts = 3;
      for (let b = 0; b < bursts; b++) {
        const center = new THREE.Vector3(
          origin.x + (Math.random() - 0.5) * 14,
          12 + Math.random() * 8,
          origin.z + (Math.random() - 0.5) * 10
        );
        const color = fwColors[Math.floor(Math.random() * fwColors.length)];
        const count = isSoftware ? 16 : 28;
        for (let i = 0; i < count; i++) {
          const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
          const mesh = new THREE.Mesh(fwGeo, mat);
          mesh.position.copy(center);
          scene.add(mesh);

          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const speed = 5 + Math.random() * 7;
          const vel = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed + 2,
            Math.sin(phi) * Math.sin(theta) * speed
          );
          fireworkParticles.push({ mesh, vel, life: 0, maxLife: 1.3 + Math.random() * 0.6 });
        }
      }
    };
    spawnFireworksFnRef.current = spawnFireworkBurst;

    // Create Local Player Actor
    const localRig = buildAvatarGroup(localAvatarRef.current);
    scene.add(localRig.group);
    actorsRef.current.set('local', {
      id: 'local',
      name: localNameRef.current || 'Peserta',
      isLocal: true,
      rig: localRig,
      pos: new THREE.Vector3(0, 0, 10),
      velY: 0,
      rotY: Math.PI,
      targetX: 0,
      targetZ: 10,
      walkPhase: 0,
      emote: null,
      emoteTimer: 0,
      bubbleText: '',
      bubbleTimer: 0,
    });

    // Interaction handler (triggered via keyboard 'E' or HUD button)
    const executeInteraction = () => {
      const local = actorsRef.current.get('local');
      if (!local) return;

      // If currently riding a ride, dismount safely!
      if (ridingAttractionRef.current) {
        const curRide = ATTRACTIONS.find((a) => a.id === ridingAttractionRef.current);
        ridingAttractionRef.current = null;
        if (curRide) {
          local.pos.set(curRide.exitX, 0, curRide.exitZ);
          local.velY = 0;
          onActionRef.current?.({
            id: curRide.id,
            title: `Turun dari ${curRide.name}`,
            message: 'Kamu kembali ke area jalan kaki Pasar Malam!',
          });
        }
        return;
      }

      // Find nearest attraction in range
      let nearest: AttractionZone | null = null;
      let minDist = Infinity;
      for (const attr of ATTRACTIONS) {
        const d = Math.hypot(local.pos.x - attr.x, local.pos.z - attr.z);
        if (d <= attr.radius && d < minDist) {
          minDist = d;
          nearest = attr;
        }
      }

      if (!nearest) return;

      if (nearest.rideable) {
        ridingAttractionRef.current = nearest.id;
        local.velY = 0;
        onActionRef.current?.({
          id: nearest.id,
          title: `Naik ${nearest.name}!`,
          message: `Menikmati wahana ${nearest.name}! Tekan E atau klik Turun kapan saja.`,
          ticketsEarned: 15,
        });
      } else if (nearest.id === 'trampoline') {
        local.pos.x = nearest.x;
        local.pos.z = nearest.z;
        local.velY = 14.5;
        local.emote = 'jump';
        local.emoteTimer = 1.6;
        onActionRef.current?.({
          id: 'trampoline',
          title: 'Lompat Trampolin Gravitasi!',
          message: 'Wuuush! Melambung tinggi di atas Pasar Malam!',
          ticketsEarned: 10,
        });
      } else if (nearest.id === 'wheel') {
        wheelSpinSpeedRef.current = 18;
        const prize = PRIZE_OUTCOMES[Math.floor(Math.random() * PRIZE_OUTCOMES.length)];
        onActionRef.current?.({
          id: 'wheel',
          title: 'Roda Keberuntungan Berputar!',
          message: `Selamat! Kamu dapat ${prize.label} (+${prize.tickets} Tiket)!`,
          ticketsEarned: prize.tickets,
        });
      } else if (nearest.id === 'fireworks') {
        spawnFireworkBurst(new THREE.Vector3(nearest.x, 0, nearest.z));
        onActionRef.current?.({
          id: 'fireworks',
          title: 'Kembang Api Galaksi Diluncurkan!',
          message: 'Langit Pasar Malam menyala meriah! (+20 Tiket)',
          ticketsEarned: 20,
        });
      }
    };
    triggerInteractFnRef.current = executeInteraction;

    // Keyboard Controls
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      activeKeysRef.current[e.key] = true;
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        executeInteraction();
      }
      if (e.code === 'Space' && !ridingAttractionRef.current) {
        e.preventDefault();
        const local = actorsRef.current.get('local');
        if (local && local.pos.y <= 0.05) {
          local.velY = 6.8;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current[e.key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Ambient fireworks every 12 seconds to keep night market lively
    let ambientFwTimer = 4;

    const clock = new THREE.Clock();
    const projVec = new THREE.Vector3();
    const worldTmp = new THREE.Vector3();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // Animate Central Fountain Crystal & Starfield
      crystal.rotation.y = t * 1.1;
      crystal.position.y = 2.6 + Math.sin(t * 2.2) * 0.25;
      starField.rotation.y = t * 0.008;

      // Animate Bianglala (Ferris Wheel) — keep gondolas upright!
      const ferrisAngle = t * 0.28;
      ferris.wheelPivot.rotation.z = ferrisAngle;
      ferris.gondolas.forEach((g) => {
        g.rotation.z = -ferrisAngle;
      });

      // Animate Komidi Putar (Carousel)
      carousel.deckPivot.rotation.y = t * 0.65;
      carousel.horses.forEach((horse, idx) => {
        horse.position.y = 1.35 + Math.sin(t * 2.8 + idx * 0.8) * 0.35;
      });

      // Animate Kora-Kora (Swinging Pirate Ship)
      korakora.shipPivot.rotation.z = Math.sin(t * 1.45) * 0.82;

      // Animate Fortune Wheel deceleration
      prizeBooth.wheelMesh.rotation.z -= wheelSpinSpeedRef.current * dt;
      if (wheelSpinSpeedRef.current > 0.35) {
        wheelSpinSpeedRef.current = Math.max(0.35, wheelSpinSpeedRef.current * (1 - dt * 1.4));
      }

      // Ambient festive fireworks
      ambientFwTimer -= dt;
      if (ambientFwTimer <= 0) {
        ambientFwTimer = 11;
        spawnFireworkBurst(new THREE.Vector3(0, 0, 32));
      }

      // Update Firework Particles
      for (let i = fireworkParticles.length - 1; i >= 0; i--) {
        const p = fireworkParticles[i];
        p.life += dt;
        p.vel.y -= 6.5 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          mat.dispose();
          fireworkParticles.splice(i, 1);
        }
      }

      const keys = activeKeysRef.current;
      const bubbleStates: BubbleState[] = [];

      actorsRef.current.forEach((actor) => {
        let moving = false;

        if (actor.isLocal) {
          const riding = ridingAttractionRef.current;

          if (riding === 'ferris') {
            ferris.gondolas[0].getWorldPosition(worldTmp);
            actor.pos.set(worldTmp.x, worldTmp.y - 1.4, worldTmp.z);
            actor.rotY = t * 0.4;
          } else if (riding === 'carousel') {
            carousel.horses[0].getWorldPosition(worldTmp);
            actor.pos.set(worldTmp.x, worldTmp.y + 0.35, worldTmp.z);
            actor.rotY = carousel.deckPivot.rotation.y + Math.PI / 2;
          } else if (riding === 'korakora') {
            korakora.shipPivot.updateMatrixWorld();
            worldTmp.set(0, -7.2, 0).applyMatrix4(korakora.shipPivot.matrixWorld);
            actor.pos.copy(worldTmp);
            actor.rotY = Math.PI / 6;
          } else {
            let dx = 0;
            let dz = 0;
            if (keys['w'] || keys['W'] || keys['ArrowUp']) dz -= 1;
            if (keys['s'] || keys['S'] || keys['ArrowDown']) dz += 1;
            if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= 1;
            if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

            if (dx !== 0 || dz !== 0) {
              const len = Math.hypot(dx, dz);
              dx /= len;
              dz /= len;
              const isSprinting = Boolean(keys['Shift']);
              const speed = isSprinting ? 14.5 : 9.5;
              actor.pos.x += dx * speed * dt;
              actor.pos.z += dz * speed * dt;
              actor.rotY = Math.atan2(dx, dz);
              moving = true;
            }

            // Auto-bounce if stepping onto Trampoline pad!
            const distTramp = Math.hypot(actor.pos.x - 24, actor.pos.z - 20);
            if (distTramp < 4.1 && actor.pos.y <= 0.65 && actor.velY <= 0) {
              actor.velY = 12.2;
            }

            // Keep outside central fountain basin
            const distCenter = Math.hypot(actor.pos.x, actor.pos.z);
            if (distCenter < 3.4) {
              const ang = Math.atan2(actor.pos.z, actor.pos.x);
              actor.pos.x = Math.cos(ang) * 3.4;
              actor.pos.z = Math.sin(ang) * 3.4;
            }

            // Huge 62m walkable radius across the Pasar Malam Galaksi!
            const maxR = 62;
            const curR = Math.hypot(actor.pos.x, actor.pos.z);
            if (curR > maxR) {
              actor.pos.x = (actor.pos.x / curR) * maxR;
              actor.pos.z = (actor.pos.z / curR) * maxR;
            }

            // Gravity
            actor.velY -= 18 * dt;
            actor.pos.y += actor.velY * dt;
            if (actor.pos.y < 0) {
              actor.pos.y = 0;
              actor.velY = 0;
            }
          }

          // Proximity Detection for Interactive Wahana
          let nearbyPayload: NearbyAttraction | null = null;
          if (ridingAttractionRef.current) {
            const curRide = ATTRACTIONS.find((a) => a.id === ridingAttractionRef.current);
            if (curRide) {
              nearbyPayload = {
                id: curRide.id,
                name: curRide.name,
                actionLabel: `Turun dari ${curRide.name}`,
                isRiding: true,
              };
            }
          } else {
            for (const attr of ATTRACTIONS) {
              if (Math.hypot(actor.pos.x - attr.x, actor.pos.z - attr.z) <= attr.radius) {
                nearbyPayload = {
                  id: attr.id,
                  name: attr.name,
                  actionLabel: attr.actionLabel,
                  isRiding: false,
                };
                break;
              }
            }
          }

          const nearbyKey = nearbyPayload
            ? `${nearbyPayload.id}:${nearbyPayload.isRiding}`
            : 'none';
          if (nearbyKey !== lastNearbyKeyRef.current) {
            lastNearbyKeyRef.current = nearbyKey;
            onNearbyRef.current?.(nearbyPayload);
          }

          // Dynamic Zone Name
          let zone = 'Plaza Pasar Malam Galaksi';
          if (Math.hypot(actor.pos.x + 24, actor.pos.z + 20) < 15) {
            zone = 'Wahana Bianglala Galaksi';
          } else if (Math.hypot(actor.pos.x - 24, actor.pos.z + 20) < 15) {
            zone = 'Wahana Komidi Putar Kosmik';
          } else if (Math.hypot(actor.pos.x + 26, actor.pos.z - 20) < 15) {
            zone = 'Wahana Kora-Kora Viking';
          } else if (Math.hypot(actor.pos.x - 24, actor.pos.z - 20) < 14) {
            zone = 'Taman Trampolin Gravitasi';
          } else if (actor.pos.z < -22) {
            zone = 'Kios Roda Keberuntungan';
          } else if (actor.pos.z > 22) {
            zone = 'Panggung Kembang Api & Lampion';
          } else if (Math.hypot(actor.pos.x, actor.pos.z) > 36) {
            zone = 'Taman Lampion Luar Galaksi';
          }
          if (zone !== lastZoneRef.current) {
            lastZoneRef.current = zone;
            onZoneChangeRef.current?.(zone);
          }

          // Smooth Cinematic Camera Follow (pulls back wider when riding Ferris Wheel or Kora-Kora)
          const camOffsetY = riding === 'ferris' ? 5.5 : riding === 'korakora' ? 7.5 : 8.5;
          const camOffsetZ = riding === 'ferris' ? 16.5 : riding === 'korakora' ? 15.5 : 13.5;
          const desiredCam = new THREE.Vector3(
            actor.pos.x,
            actor.pos.y + camOffsetY,
            actor.pos.z + camOffsetZ
          );
          camera.position.lerp(desiredCam, 0.08);
          camera.lookAt(actor.pos.x, actor.pos.y + 1.5, actor.pos.z);
        } else {
          // Other connected players roam smoothly
          const dx = actor.targetX - actor.pos.x;
          const dz = actor.targetZ - actor.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.25) {
            const speed = 2.6;
            actor.pos.x += (dx / dist) * speed * dt;
            actor.pos.z += (dz / dist) * speed * dt;
            actor.rotY = Math.atan2(dx, dz);
            moving = true;
          } else if (Math.random() < 0.008) {
            const ang = Math.random() * Math.PI * 2;
            const rad = 7 + Math.random() * 20;
            actor.targetX = Math.cos(ang) * rad;
            actor.targetZ = Math.sin(ang) * rad;
          }
        }

        // Apply transforms
        actor.rig.group.position.copy(actor.pos);
        actor.rig.group.rotation.y = actor.rotY;

        if (actor.emoteTimer > 0) {
          actor.emoteTimer = Math.max(0, actor.emoteTimer - dt);
          if (actor.emoteTimer === 0) actor.emote = null;
        }

        const { leftArm, rightArm, leftLeg, rightLeg } = actor.rig;
        if (actor.emote === 'dance' || actor.emote === 'party') {
          actor.rig.group.position.y = actor.pos.y + Math.abs(Math.sin(t * 9)) * 0.3;
          leftArm.rotation.z = 2.2 + Math.sin(t * 10) * 0.45;
          rightArm.rotation.z = -2.2 - Math.sin(t * 10) * 0.45;
          leftLeg.rotation.x = Math.sin(t * 10) * 0.4;
          rightLeg.rotation.x = -Math.sin(t * 10) * 0.4;
        } else if (actor.emote === 'wave') {
          rightArm.rotation.z = -2.5 + Math.sin(t * 14) * 0.35;
          leftArm.rotation.z = 0.2;
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
        } else if (moving) {
          actor.walkPhase += dt * 11;
          const swing = Math.sin(actor.walkPhase) * 0.58;
          leftLeg.rotation.x = swing;
          rightLeg.rotation.x = -swing;
          leftArm.rotation.x = -swing * 0.7;
          rightArm.rotation.x = swing * 0.7;
          leftArm.rotation.z = 0.14;
          rightArm.rotation.z = -0.14;
        } else {
          leftLeg.rotation.x *= 0.85;
          rightLeg.rotation.x *= 0.85;
          leftArm.rotation.x *= 0.85;
          rightArm.rotation.x *= 0.85;
          leftArm.rotation.z = 0.14;
          rightArm.rotation.z = -0.14;
        }

        if (actor.bubbleTimer > 0) {
          actor.bubbleTimer = Math.max(0, actor.bubbleTimer - dt);
          if (actor.bubbleTimer === 0) actor.bubbleText = '';
        }

        projVec.set(actor.pos.x, actor.pos.y + 2.85, actor.pos.z);
        projVec.project(camera);
        const visible = projVec.z < 1;
        const sx = (projVec.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
        const sy = (-projVec.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
        bubbleStates.push({
          id: actor.id,
          name: actor.name,
          message: actor.bubbleText || undefined,
          screenX: sx,
          screenY: sy,
          visible,
        });
      });

      // Render Floating Nameplates & Speech Bubbles
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.innerHTML = bubbleStates
          .filter((b) => b.visible)
          .map((b) => {
            const safeName = b.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeMsg = b.message
              ? `<div class="mb-1 px-2.5 py-1 rounded-xl bg-white text-slate-900 text-[11px] font-bold shadow-lg max-w-[170px] truncate">${b.message
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')}</div>`
              : '';
            return `<div style="position:absolute;left:${b.screenX.toFixed(1)}px;top:${b.screenY.toFixed(
              1
            )}px;transform:translate(-50%,-100%);pointer-events:none;display:flex;flex-direction:column;align-items:center;">
              ${safeMsg}
              <div class="px-2 py-0.5 rounded-full bg-slate-950/85 border border-sky-400/40 text-[10px] font-extrabold text-white whitespace-nowrap shadow">${safeName}</div>
            </div>`;
          })
          .join('');
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      envTex?.dispose();
      tileTex.dispose();
      starGeo.dispose();
      fwGeo.dispose();
      renderer.dispose();
      actorsRef.current.clear();
      sceneRef.current = null;
      ridingAttractionRef.current = null;
    };
  }, [activeKeysRef]);

  // Rebuild local avatar when wardrobe or playerName changes
  useEffect(() => {
    const scene = sceneRef.current;
    const local = actorsRef.current.get('local');
    if (!scene || !local) return;
    scene.remove(local.rig.group);
    const nextRig = buildAvatarGroup(localAvatar);
    nextRig.group.position.copy(local.pos);
    nextRig.group.rotation.y = local.rotY;
    scene.add(nextRig.group);
    local.rig = nextRig;
    local.name = localPlayerName || 'Peserta';
  }, [localAvatar, localPlayerName]);

  // Sync other connected players
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const activeIds = new Set(['local', ...otherPlayers.map((p) => p.id)]);
    actorsRef.current.forEach((actor, id) => {
      if (!activeIds.has(id)) {
        scene.remove(actor.rig.group);
        actorsRef.current.delete(id);
      }
    });

    otherPlayers.forEach((player, idx) => {
      const existing = actorsRef.current.get(player.id);
      if (existing) {
        existing.name = player.name;
        return;
      }
      const rig = buildAvatarGroup(player.avatar);
      const angle = ((idx + 1) / Math.max(otherPlayers.length + 1, 2)) * Math.PI * 2;
      const startX = Math.cos(angle) * 10;
      const startZ = Math.sin(angle) * 10;
      rig.group.position.set(startX, 0, startZ);
      scene.add(rig.group);

      actorsRef.current.set(player.id, {
        id: player.id,
        name: player.name,
        isLocal: false,
        rig,
        pos: new THREE.Vector3(startX, 0, startZ),
        velY: 0,
        rotY: 0,
        targetX: startX,
        targetZ: startZ,
        walkPhase: 0,
        emote: null,
        emoteTimer: 0,
        bubbleText: '',
        bubbleTimer: 0,
      });
    });
  }, [otherPlayers]);

  // Apply Emote commands
  useEffect(() => {
    if (!emoteCommand) return;
    const local = actorsRef.current.get('local');
    if (!local) return;
    if (emoteCommand.type === 'jump' && local.pos.y <= 0.05 && !ridingAttractionRef.current) {
      local.velY = 7.4;
    } else {
      local.emote = emoteCommand.type;
      local.emoteTimer = 2.6;
    }
  }, [emoteCommand]);

  // Apply HUD Interaction button trigger
  useEffect(() => {
    if (!interactCommand) return;
    triggerInteractFnRef.current?.();
  }, [interactCommand]);

  // Apply Quick Teleport to any Pasar Malam Wahana
  useEffect(() => {
    if (!teleportCommand) return;
    const local = actorsRef.current.get('local');
    if (!local) return;
    ridingAttractionRef.current = null;
    local.pos.set(teleportCommand.x, 0, teleportCommand.z);
    local.velY = 0;
  }, [teleportCommand]);

  // Show speech bubble on latest chat
  useEffect(() => {
    if (!latestChat) return;
    actorsRef.current.forEach((actor) => {
      if (actor.name === latestChat.sender || (actor.isLocal && latestChat.sender === localPlayerName)) {
        actor.bubbleText = latestChat.text;
        actor.bubbleTimer = 4.5;
      }
    });
  }, [latestChat, localPlayerName]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
    </div>
  );
};
