"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ProceduralRicDevice() {
  const group = useRef<THREE.Group>(null);
  const receiverCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.45, 1.35, 0),
        new THREE.Vector3(1.25, 1.75, 0.08),
        new THREE.Vector3(1.65, 0.75, 0.12),
        new THREE.Vector3(1.42, -0.2, 0.1),
      ]),
    [],
  );
  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(receiverCurve, 40, 0.035, 10, false),
    [receiverCurve],
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    const elapsed = clock.getElapsedTime();
    group.current.rotation.y = -0.38 + Math.sin(elapsed * 0.42) * 0.2;
    group.current.rotation.z = -0.15 + Math.sin(elapsed * 0.55) * 0.025;
    group.current.position.y = Math.sin(elapsed * 0.7) * 0.055;
  });

  return (
    <group ref={group} rotation={[-0.08, -0.38, -0.15]} scale={0.92}>
      <mesh castShadow scale={[0.68, 1.35, 0.46]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial
          color="#0b5260"
          roughness={0.24}
          metalness={0.16}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
        />
      </mesh>

      <mesh position={[-0.18, 0.12, 0.43]} scale={[0.12, 0.48, 0.06]}>
        <capsuleGeometry args={[0.55, 1.3, 12, 24]} />
        <meshStandardMaterial color="#d6eee9" metalness={0.5} roughness={0.28} />
      </mesh>

      <mesh position={[0.03, 0.85, 0.44]} scale={[0.13, 0.13, 0.045]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#071f2c" roughness={0.45} />
      </mesh>

      <mesh geometry={tubeGeometry}>
        <meshPhysicalMaterial
          color="#dffaf8"
          transmission={0.65}
          transparent
          opacity={0.85}
          roughness={0.15}
        />
      </mesh>

      <group position={[1.42, -0.22, 0.1]} rotation={[0, 0, -0.34]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.38, 24]} />
          <meshStandardMaterial color="#134a55" metalness={0.25} roughness={0.35} />
        </mesh>
        <mesh position={[0.13, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.27, 32, 20]} />
          <meshPhysicalMaterial
            color="#d8f1ef"
            transmission={0.25}
            transparent
            opacity={0.9}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function HearingAidScene() {
  return (
    <Canvas
      aria-label="Slowly rotating schematic receiver-in-canal hearing device"
      role="img"
      camera={{ position: [0, 0.1, 5.1], fov: 38 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      shadows
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[3.5, 5, 4]} intensity={3.2} color="#d8fffa" castShadow />
      <pointLight position={[-3, -1, 2]} intensity={2.3} color="#6dded6" />
      <pointLight position={[1, -2, -2]} intensity={1.6} color="#7687ff" />
      <ProceduralRicDevice />
    </Canvas>
  );
}
