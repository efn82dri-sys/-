import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  evaluateMascotPose,
  type MascotExpression,
  type MascotPose,
  type MascotVariant,
} from '../../utils/mascotRig';
import { buildIsbMascot, type BuiltIsbMascot } from './buildIsbMascot';

export interface IsbMascot3DProps {
  pose: MascotPose;
  expression?: MascotExpression;
  variant?: MascotVariant;
  /** Allows user to drag horizontally to spin the character 360° */
  allowOrbit?: boolean;
  /** Keeps character facing user gently or freely rotated in studio showcase */
  freeSpin?: boolean;
  /** External rotation reset signal counter */
  resetSpinSignal?: number;
  /** Camera framing distance (default 3.35 for full body) */
  cameraDistance?: number;
  /** Camera vertical look target (default 1.06) */
  cameraTargetY?: number;
  /** Called on crisp tap/click (not drag) */
  onMascotClick?: () => void;
  /** Accessible label for the interactive 3D mascot stage */
  ariaLabel?: string;
  className?: string;
  testId?: string;
}

function detectSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : '';
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

export function IsbMascot3D({
  pose,
  expression = 'happy',
  variant = 'female',
  allowOrbit = false,
  freeSpin = false,
  resetSpinSignal = 0,
  cameraDistance = 4.45,
  cameraTargetY = 1.2,
  onMascotClick,
  ariaLabel,
  className = '',
  testId,
}: IsbMascot3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [inView, setInView] = useState(true);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Store latest props in refs so WebGL loop never tears down on pose/variant/expression switches
  const stateRef = useRef({
    pose,
    expression,
    variant,
    allowOrbit,
    freeSpin,
    cameraDistance,
    cameraTargetY,
    onMascotClick,
    inView: true,
    pointerX: 0,
    pointerY: 0,
    clickBurst: 0,
    userYawTarget: 0,
    userYawCurrent: 0,
    isDragging: false,
    dragStartX: 0,
    dragMoved: 0,
    dragStartYaw: 0,
  });

  stateRef.current.pose = pose;
  stateRef.current.expression = expression;
  stateRef.current.variant = variant;
  stateRef.current.allowOrbit = allowOrbit;
  stateRef.current.freeSpin = freeSpin;
  stateRef.current.cameraDistance = cameraDistance;
  stateRef.current.cameraTargetY = cameraTargetY;
  stateRef.current.onMascotClick = onMascotClick;
  stateRef.current.inView = inView;

  // Reset user spin angle when requested by parent UI
  useEffect(() => {
    if (resetSpinSignal > 0) {
      stateRef.current.userYawTarget = 0;
    }
  }, [resetSpinSignal]);

  // Observe visibility so offscreen 3D stages pause rendering completely
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setHasEntered(true);
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const visible = entry.isIntersecting;
        setInView(visible);
        if (visible) setHasEntered(true);
      },
      { rootMargin: '220px 0px 220px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Main Three.js lifecycle (mounts once the stage enters viewport vicinity)
  useEffect(() => {
    if (!hasEntered) return;
    const container = hostRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      // Probe software GL via lightweight renderer options
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const gl = renderer.getContext();
    const isSoftwareGl = detectSoftwareGl(gl);

    // If software GL, recreate with antialias: false for crisp fast frames without stalling SwiftShader
    if (isSoftwareGl) {
      renderer.dispose();
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: 'default',
        });
      } catch {
        setWebglUnavailable(true);
        return;
      }
    }

    const activeRenderer = renderer;
    const activeGl = activeRenderer.getContext();

    activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
    activeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    activeRenderer.toneMappingExposure = 1.06;
    activeRenderer.setClearColor(0x000000, 0);
    activeRenderer.shadowMap.enabled = !isSoftwareGl;
    activeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    activeRenderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );

    const canvas = activeRenderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = stateRef.current.allowOrbit ? 'pan-y' : 'auto';
    container.appendChild(canvas);

    // Scene & Studio IBL Environment (balanced intensity so deep ISB navy stays rich & tactile)
    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(activeRenderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = 0.42;
    }
    roomEnv.dispose();

    // Camera framed for full-body stylized vinyl-collectible silhouette with generous headroom
    const initW = Math.max(container.clientWidth, 120);
    const initH = Math.max(container.clientHeight, 120);
    const camera = new THREE.PerspectiveCamera(34, initW / initH, 0.1, 30);
    camera.position.set(0, stateRef.current.cameraTargetY + 0.12, stateRef.current.cameraDistance);
    camera.lookAt(0, stateRef.current.cameraTargetY, 0);
    activeRenderer.setSize(initW, initH, false);

    // 3-Point Warm/Cool Studio Lighting + Architectural Rim Light (rich navy depth + clean dark-BG separation)
    const hemiLight = new THREE.HemisphereLight(0xf3f7ff, 0x1b273c, 0.56);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.5);
    keyLight.position.set(2.8, 4.4, 3.8);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.camera.left = -2;
      keyLight.shadow.camera.right = 2;
      keyLight.shadow.camera.top = 2.8;
      keyLight.shadow.camera.bottom = -0.5;
    }
    scene.add(keyLight);

    // Subtle cool sky fill from opposite side
    const fillLight = new THREE.DirectionalLight(0x9ec4ff, 0.44);
    fillLight.position.set(-3.2, 2.2, 2.2);
    scene.add(fillLight);

    // Crisp rim light from behind-top to give the navy ISB head frame a luminous architectural contour
    const rimLight = new THREE.DirectionalLight(0x94c2ff, 0.88);
    rimLight.position.set(-1.6, 3.4, -3.2);
    scene.add(rimLight);

    // Build Procedural 3D ISB Mascot
    const mascot: BuiltIsbMascot = buildIsbMascot(stateRef.current.variant);
    let appliedVariant: MascotVariant = stateRef.current.variant;
    scene.add(mascot.root);

    // ResizeObserver for crisp responsive framing
    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width < 10 || rect.height < 10) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
    });
    resizeObserver.observe(container);

    // Pointer tracking for lively eye/head gaze
    const onWindowPointerMove = (e: PointerEvent) => {
      if (!stateRef.current.inView) return;
      const rect = container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.45;
      stateRef.current.pointerX = THREE.MathUtils.clamp((e.clientX - cx) / 380, -1, 1);
      stateRef.current.pointerY = THREE.MathUtils.clamp((e.clientY - cy) / 340, -1, 1);
    };
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });

    // WebGL context loss guard
    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // Reduced motion support: render one crisp posed frame without continuous animation
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Pacing helper compliant with software WebGL (fenceSync + 80ms wait)
    const afterDraw = (cb: () => void) => {
      if (!isSoftwareGl) {
        rafId = window.requestAnimationFrame(cb);
        return;
      }
      const gl2 = activeGl as WebGL2RenderingContext;
      const sync = typeof gl2.fenceSync === 'function'
        ? gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0)
        : null;
      if (sync) {
        gl2.flush();
        const poll = () => {
          if (disposed) {
            gl2.deleteSync(sync);
            return;
          }
          const status = gl2.clientWaitSync(sync, 0, 0);
          if (status === gl2.TIMEOUT_EXPIRED) {
            timerId = window.setTimeout(poll, 16);
          } else {
            gl2.deleteSync(sync);
            timerId = window.setTimeout(cb, 80);
          }
        };
        timerId = window.setTimeout(poll, 16);
      } else {
        timerId = window.setTimeout(cb, 90);
      }
    };

    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    let elapsed = 0;
    let lastTime = performance.now();

    const renderTick = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.12);
      lastTime = now;

      const st = stateRef.current;

      // Sync Male/Female variant live without rebuilding geometry
      if (appliedVariant !== st.variant) {
        mascot.setVariant(st.variant);
        appliedVariant = st.variant;
      }

      // Skip GPU draw while offscreen or tab hidden
      if (!st.inView || document.hidden || contextLost) {
        timerId = window.setTimeout(renderTick, 180);
        return;
      }

      if (!prefersReducedMotion) {
        elapsed += dt;
      }

      // Decay click jump burst smoothly
      if (st.clickBurst > 0) {
        st.clickBurst = Math.max(0, st.clickBurst - dt * 1.65);
      }

      // Update camera if props changed
      camera.position.y = st.cameraTargetY + 0.16;
      camera.position.z = st.cameraDistance;
      camera.lookAt(0, st.cameraTargetY, 0);

      // Gently return user yaw to 0 unless freeSpin (Studio Showcase) is enabled
      if (!st.isDragging && !st.freeSpin) {
        st.userYawTarget = THREE.MathUtils.damp(st.userYawTarget, 0, 3.2, dt);
      }
      st.userYawCurrent = THREE.MathUtils.damp(st.userYawCurrent, st.userYawTarget, 11, dt);
      mascot.root.rotation.y = st.userYawCurrent;

      const frame = evaluateMascotPose(
        st.pose,
        st.expression,
        elapsed,
        st.pointerX,
        st.pointerY,
        st.clickBurst
      );
      mascot.applyFrame(frame, dt);
      activeRenderer.render(scene, camera);

      if (prefersReducedMotion) {
        // Re-check occasionally in case user switches poses/variants in UI
        timerId = window.setTimeout(renderTick, 160);
      } else {
        afterDraw(renderTick);
      }
    };

    // Draw initial frame synchronously so the mascot appears crisp immediately
    const initialFrame = evaluateMascotPose(
      stateRef.current.pose,
      stateRef.current.expression,
      0,
      0,
      0,
      0
    );
    mascot.applyFrame(initialFrame, 1);
    activeRenderer.render(scene, camera);
    afterDraw(renderTick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onWindowPointerMove);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      mascot.dispose();
      envTarget.dispose();
      pmremGenerator.dispose();
      activeRenderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [hasEntered]);

  // Pointer handlers for click-to-bounce + optional 360° horizontal spin
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    st.isDragging = true;
    st.dragStartX = e.clientX;
    st.dragMoved = 0;
    st.dragStartYaw = st.userYawTarget;
    if (st.allowOrbit) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    if (!st.isDragging) return;
    const dx = e.clientX - st.dragStartX;
    st.dragMoved = Math.max(st.dragMoved, Math.abs(dx));
    if (st.allowOrbit) {
      st.userYawTarget = st.dragStartYaw + dx * 0.0125;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    if (!st.isDragging) return;
    st.isDragging = false;
    if (st.allowOrbit && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (st.dragMoved < 8) {
      // Crisp tap/click: joyful jump reaction!
      st.clickBurst = 1;
      st.onMascotClick?.();
    }
  };

  if (webglUnavailable) {
    return (
      <div
        data-testid={testId}
        className={`flex items-center justify-center rounded-2xl border border-white/10 bg-[#0D1628]/80 text-center p-4 ${className}`}
      >
        <div className="space-y-1">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#1B3B6F] border border-[#84A65D]/60 flex items-center justify-center text-[#F5EFE8] font-bold text-sm">
            ISB
          </div>
          <p className="text-[11px] text-[#9FB1CA]">ISB 3D Mascot</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      data-testid={testId}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || 'ISB 3D Mascot'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          stateRef.current.clickBurst = 1;
          stateRef.current.onMascotClick?.();
        }
      }}
      className={`relative select-none outline-none focus-visible:ring-2 focus-visible:ring-[#28CF77]/70 rounded-2xl ${
        allowOrbit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${className}`}
    />
  );
}
