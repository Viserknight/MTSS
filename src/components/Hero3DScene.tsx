import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, OrbitControls, Stars, TorusKnot } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

function SpinningKnot() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.25;
    ref.current.rotation.y += dt * 0.35;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <TorusKnot ref={ref} args={[1, 0.32, 220, 32]} scale={0.9}>
        <MeshDistortMaterial
          color="#e11d2a"
          emissive="#7a0f18"
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.8}
          distort={0.28}
          speed={1.6}
        />
      </TorusKnot>
    </Float>
  );
}

function OrbitingShapes() {
  const group = useRef<Mesh>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.3;
  });
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
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

export const Hero3DScene = () => {
  return (
    <div className="absolute inset-0 -z-0 pointer-events-none">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-5, -3, -5]} intensity={1} color="#e11d2a" />
          <Stars radius={40} depth={30} count={800} factor={3} saturation={0} fade speed={0.6} />
          <SpinningKnot />
          <OrbitingShapes />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} enabled={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
