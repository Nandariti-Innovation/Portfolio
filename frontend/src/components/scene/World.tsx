import { Float, Sparkles } from "@react-three/drei";

const Orb = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => (
  <Float speed={1.4} rotationIntensity={1.2} floatIntensity={1.5}>
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[0.42, 1]} />
      <meshStandardMaterial color="#151515" roughness={0.3} metalness={0.8} />
    </mesh>
  </Float>
);

export const World = () => (
  <group>
    <Sparkles count={90} scale={[12, 8, 5]} size={1.2} speed={0.25} color="#ff7a32" />
    <Orb position={[-3.6, 1.8, -2]} scale={1.4} />
    <Orb position={[3.8, 2.4, -3]} scale={0.8} />
    <Orb position={[3.2, -1.8, -1]} scale={0.5} />
    <gridHelper args={[18, 28, "#5e2a12", "#171717"]} position={[0, -1.84, 0]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.86, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#050505" roughness={0.5} metalness={0.55} />
    </mesh>
  </group>
);
