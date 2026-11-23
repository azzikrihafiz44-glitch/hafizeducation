import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { AvatarConfig } from '../types/quiz';
import {
  applyStudioEnvironment,
  buildAvatarGroup,
  createContactShadowTexture,
  detectSoftwareWebGL,
  type AvatarRig,
} from '../three/avatarBuilder';

interface AvatarPreview3DProps {
  config: AvatarConfig;
  className?: string;
  testId?: string;
}

export const AvatarPreview3D: React.FC<AvatarPreview3DProps> = ({
  config,
  className = 'w-full h-72',
  testId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const avatarSlotRef = useRef<THREE.Group | null>(null);
  const rigRef = useRef<AvatarRig | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const dragRef = useRef<{ active: boolean; lastX: number; rotY: number }>({
    active: false,
    lastX: 0,
    rotY: 0.35,
  });

  // Mount Three.js renderer once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 288;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0, 1.48, 3.65);
    camera.lookAt(0, 1.05, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const envTex = applyStudioEnvironment(renderer, scene);

    // Warm key + cool hemisphere + rim light
    const hemi = new THREE.HemisphereLight(0xc7d2fe, 0x1e293b, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1db, 2.0);
    keyLight.position.set(3.2, 5.2, 4.0);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(512, 512);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 1.1);
    rimLight.position.set(-3, 2.5, -3);
    scene.add(rimLight);

    // Studio Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 1.02, 0.16, 28),
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.35,
        metalness: 0.45,
      })
    );
    pedestal.position.y = -0.08;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.025, 10, 36),
      new THREE.MeshStandardMaterial({
        color: '#818cf8',
        emissive: '#6366f1',
        emissiveIntensity: 0.7,
        roughness: 0.25,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // Contact shadow disc
    const shadowTex = createContactShadowTexture();
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 24),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.012;
    scene.add(shadowDisc);

    // Slot for replaceable avatar mesh
    const slot = new THREE.Group();
    slot.rotation.y = dragRef.current.rotY;
    scene.add(slot);
    avatarSlotRef.current = slot;

    // Build initial avatar
    const initialRig = buildAvatarGroup(config);
    slot.add(initialRig.group);
    rigRef.current = initialRig;

    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        slot.rotation.y = dragRef.current.rotY;
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };
    requestRenderRef.current = requestRender;

    // On GPU: gentle idle turntable & breathing; on Software WebGL: on-demand crisp render
    if (isSoftwareGl) {
      requestRender();
    } else {
      renderer.compile(scene, camera);
      const tick = () => {
        if (disposed) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();
        if (!dragRef.current.active) {
          dragRef.current.rotY += dt * 0.48;
        }
        slot.rotation.y = dragRef.current.rotY;
        if (rigRef.current) {
          rigRef.current.bodyGroup.position.y = Math.sin(t * 2.4) * 0.025;
          rigRef.current.leftArm.rotation.z = 0.08 + Math.sin(t * 2.0) * 0.04;
          rigRef.current.rightArm.rotation.z = -0.08 - Math.sin(t * 2.0) * 0.04;
        }
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    }

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 288;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (isSoftwareGl) requestRender();
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      envTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap avatar geometry whenever config changes without tearing down WebGLRenderer
  useEffect(() => {
    const slot = avatarSlotRef.current;
    if (!slot) return;
    while (slot.children.length > 0) {
      const child = slot.children[0];
      slot.remove(child);
    }
    const newRig = buildAvatarGroup(config);
    slot.add(newRig.group);
    rigRef.current = newRig;
    requestRenderRef.current?.();
  }, [config]);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    dragRef.current.lastX = e.clientX;
    dragRef.current.rotY += dx * 0.012;
    requestRenderRef.current?.();
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div
      ref={mountRef}
      data-testid={testId}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`${className} cursor-grab active:cursor-grabbing select-none touch-none`}
      aria-label="Pratinjau Avatar (seret untuk memutar)"
    />
  );
};
