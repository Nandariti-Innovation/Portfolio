import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, type MutableRefObject, useRef } from "react";
import * as THREE from "three";
import { Character } from "./Character";
import { World } from "./World";

type SceneProps = { progress: MutableRefObject<number>; onReady: () => void };

const AnimatedScene = ({ progress, onReady }: SceneProps) => {
  const character = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!character.current || !world.current) return;
    const p = progress.current;
    const targetX = Math.sin(p * Math.PI * 5) * 1.4 + (p < 0.15 ? 0.6 : 0);
    const targetRotation = Math.sin(p * Math.PI * 8) * 0.35;
    character.current.position.x = THREE.MathUtils.damp(character.current.position.x, targetX, 3, delta);
    character.current.rotation.y = THREE.MathUtils.damp(character.current.rotation.y, targetRotation, 3, delta);
    character.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.015;
    world.current.rotation.y = p * Math.PI * 0.45;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, Math.sin(p * Math.PI * 3) * 0.8, 2, delta);
    state.camera.lookAt(0, 0.65, 0);
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight position={[3, 7, 5]} intensity={80} angle={0.35} penumbra={1} color="#ff7433" />
      <directionalLight position={[-4, 5, 3]} intensity={2.5} color="#dce5ff" />
      <pointLight position={[-3, 1, 2]} intensity={18} color="#486dff" />
      <pointLight position={[0, -1, 3]} intensity={12} color="#ff6b24" />
      <group ref={world}><World /></group>
      <Suspense fallback={null}>
        <Character characterRef={character} onReady={onReady} />
      </Suspense>
    </>
  );
};

export const PortfolioScene = ({ progress, onReady }: SceneProps) => (
  <div className="scene" aria-hidden="true">
    <Canvas
      camera={{ position: [0, 1, 7], fov: 42 }}
      dpr={1}
      shadows={false}
      gl={{ antialias: false, powerPreference: "default" }}
      fallback={<div className="webgl-fallback">WebGL is unavailable in this browser.</div>}
    >
      <AnimatedScene progress={progress} onReady={onReady} />
    </Canvas>
  </div>
);
