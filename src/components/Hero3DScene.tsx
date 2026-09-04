import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, Stars, TorusKnot, Text3D, Center } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";

/**
 * Drives the (frameloop="demand") canvas at an adaptive FPS cap.
 * Starts at `start` fps and measures real render cost: if frames are slow it
 * steps the cap down (frame skipping), if there's headroom it steps back up.
 */
function AdaptiveFrameLimiter({ start = 60, min = 24, max = 60 }: { start?: number; min?: number; max?: number }) {
  const invalidate = useThree((s) => s.invalidate);
  const targetRef = useRef(start);
  const costRef = useRef(1000 / start);

  // Measure how long each rendered frame actually takes.
  useFrame(() => {
    const now = performance.now();
    const prev = (AdaptiveFrameLimiter as any)._t ?? now;
    (AdaptiveFrameLimiter as any)._t = now;
    const dt = now - prev;
    if (dt > 0 && dt < 500) costRef.current = costRef.current * 0.9 + dt * 0.1;
  });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let tick = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;

      const now = performance.now();
      const elapsed = now - last;
      const interval = 1000 / targetRef.current;
      if (elapsed < interval) return; // skip this frame
      last = now - (elapsed % interval);
      invalidate();

      // Re-evaluate the cap roughly twice a second.
      acc += elapsed;
      if (++tick >= 12) {
        tick = 0;
        acc = 0;
        const measuredFps = 1000 / Math.max(costRef.current, 1);
        const target = targetRef.current;
        if (measuredFps < target * 0.8) {
          targetRef.current = Math.max(min, Math.round(target - 6));
        } else if (measuredFps > target * 0.95 && target < max) {
          targetRef.current = Math.min(max, Math.round(target + 3));
        }
      }
    };

    raf = requestAnimationFrame(loop);
    const onVisible = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [invalidate, min, max]);

  return null;
}


function useIsLowPower() {
  const [low, setLow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 768;
    const cores = (navigator as any).hardwareConcurrency ?? 8;
    const mem = (navigator as any).deviceMemory ?? 8;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLow(reduced || narrow || coarse || cores <= 4 || mem <= 4);
  }, []);
  return low;
}

function SpinningKnot({ low }: { low: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.25;
    ref.current.rotation.y += dt * 0.35;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1}>
      <TorusKnot ref={ref} args={[1, 0.32, low ? 90 : 220, low ? 16 : 32]} scale={0.9}>
        <MeshDistortMaterial
          color="#e11d2a"
          emissive="#7a0f18"
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.8}
          distort={low ? 0.18 : 0.28}
          speed={low ? 1 : 1.6}
        />
      </TorusKnot>
    </Float>
  );
}

function OrbitingShapes({ count }: { count: number }) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.3;
  });
  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <group ref={group}>
      {items.map((i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = 2.6;
        return (
          <Float key={i} speed={2} rotationIntensity={1} floatIntensity={0.8}>
            <Icosahedron
              args={[0.22, 0]}
              position={[Math.cos(angle) * r, Math.sin(angle * 1.3) * 0.8, Math.sin(angle) * r]}
            >
              <meshStandardMaterial
                color={i % 2 === 0 ? "#ffffff" : "#e11d2a"}
                emissive={i % 2 === 0 ? "#333333" : "#e11d2a"}
                emissiveIntensity={0.4}
                metalness={0.9}
                roughness={0.2}
              />
            </Icosahedron>
          </Float>
        );
      })}
    </group>
  );
}

function FloatingMTSS() {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.25;
  });
  return (
    <group ref={ref} position={[0, -1.8, 0]}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Center>
          <Text3D
            font="/fonts/helvetiker_bold.typeface.json"
            size={0.7}
            height={0.18}
            curveSegments={8}
            bevelEnabled
            bevelThickness={0.03}
            bevelSize={0.02}
            bevelSegments={3}
          >
            MTSS
            <meshStandardMaterial
              color="#ffffff"
              emissive="#e11d2a"
              emissiveIntensity={0.35}
              metalness={0.9}
              roughness={0.2}
            />
          </Text3D>
        </Center>
      </Float>
    </group>
  );
}

export const Hero3DScene = () => {
  const low = useIsLowPower();
  return (
    <div className="absolute inset-0 -z-0 pointer-events-none">
      <Canvas
        dpr={low ? 1 : [1, 2]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: !low, alpha: true, powerPreference: low ? "low-power" : "high-performance" }}
        frameloop="demand"
      >
        <AdaptiveFrameLimiter start={low ? 30 : 60} min={low ? 20 : 30} max={low ? 30 : 60} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />

          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-5, -3, -5]} intensity={1} color="#e11d2a" />
          {!low && <Stars radius={40} depth={30} count={600} factor={3} saturation={0} fade speed={0.6} />}
          <SpinningKnot low={low} />
          <OrbitingShapes count={low ? 3 : 5} />
          {!low && (
            <Suspense fallback={null}>
              <FloatingMTSS />
            </Suspense>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
