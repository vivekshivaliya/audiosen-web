"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type EarPart = "outer" | "canal" | "middle" | "inner";

type EarAnatomySceneProps = {
  selected: EarPart;
  onSelect: (part: EarPart) => void;
  motionEnabled: boolean;
};

function Material({ selected, color }: { selected: boolean; color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.35}
      metalness={0.04}
      clearcoat={0.25}
      emissive={selected ? color : "#000000"}
      emissiveIntensity={selected ? 0.22 : 0}
    />
  );
}

function InnerEar({ selected, onSelect }: Pick<EarAnatomySceneProps, "selected" | "onSelect">) {
  const cochlea = useMemo(() => {
    const points = Array.from({ length: 72 }, (_, index) => {
      const t = (index / 71) * Math.PI * 4.8;
      const radius = 0.66 - (index / 71) * 0.42;
      return new THREE.Vector3(
        1.05 + Math.cos(t) * radius,
        -0.12 + Math.sin(t) * radius,
        Math.sin(t * 0.5) * 0.13,
      );
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.095, 16, false);
  }, []);

  return (
    <group onClick={() => onSelect("inner")}>
      <mesh geometry={cochlea} castShadow>
        <Material selected={selected === "inner"} color="#d886a8" />
      </mesh>
      <group position={[1.15, 0.95, 0.02]}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} rotation={[0.25, 0.3, index === 1 ? 0 : 0.42]} position={[index * 0.2 - 0.2, index === 1 ? 0.12 : -0.04, 0]}>
            <torusGeometry args={[0.38, 0.07, 14, 36, Math.PI * 1.28]} />
            <Material selected={selected === "inner"} color="#c8a4e8" />
          </mesh>
        ))}
      </group>
      <mesh position={[1.52, -0.06, -0.02]} rotation={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.065, 0.1, 1.12, 14]} />
        <Material selected={selected === "inner"} color="#e8d2a2" />
      </mesh>
    </group>
  );
}

function Anatomy({ selected, onSelect, motionEnabled }: EarAnatomySceneProps) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!motionEnabled || !group.current) return;
    group.current.position.y = Math.sin(clock.getElapsedTime() * 0.45) * 0.035;
  });

  return (
    <group ref={group} rotation={[0.1, -0.38, -0.08]} scale={1.08}>
      <group onClick={() => onSelect("outer")}>
        <mesh position={[-1.2, 0.08, 0]} rotation={[0.28, -0.32, -0.36]} scale={[0.72, 1.14, 0.32]} castShadow>
          <torusGeometry args={[0.93, 0.31, 24, 72, Math.PI * 1.74]} />
          <Material selected={selected === "outer"} color="#dfa37f" />
        </mesh>
        <mesh position={[-0.86, -0.14, 0.02]} rotation={[0.12, 0.45, 0.28]} scale={[0.5, 0.7, 0.2]}>
          <sphereGeometry args={[0.64, 32, 24]} />
          <Material selected={selected === "outer"} color="#efb38d" />
        </mesh>
      </group>

      <group onClick={() => onSelect("canal")}>
        <mesh position={[-0.08, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.21, 0.26, 1.28, 32]} />
          <Material selected={selected === "canal"} color="#cf8666" />
        </mesh>
        <mesh position={[0.58, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.055, 32]} />
          <Material selected={selected === "canal"} color="#e9baa3" />
        </mesh>
      </group>

      <group onClick={() => onSelect("middle")}>
        <mesh position={[0.76, 0.05, 0]}>
          <sphereGeometry args={[0.33, 32, 24]} />
          <Material selected={selected === "middle"} color="#ddb479" />
        </mesh>
        {[[0.62, 0.25, 0.13], [0.88, 0.03, 0.14], [1.02, -0.22, 0.1]].map(([x, y, z], index) => (
          <mesh key={index} position={[x, y, z]} rotation={[0.5, 0.25, -0.55 + index * 0.42]}>
            <capsuleGeometry args={[0.08, 0.22, 10, 18]} />
            <Material selected={selected === "middle"} color="#f2ddae" />
          </mesh>
        ))}
      </group>

      <InnerEar selected={selected} onSelect={onSelect} />
    </group>
  );
}

export default function EarAnatomyScene(props: EarAnatomySceneProps) {
  return (
    <Canvas aria-label="Interactive three-dimensional ear anatomy model. Drag to rotate and use the anatomy tabs to highlight each section." role="img" camera={{ position: [0.25, 0.15, 5.6], fov: 36 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} shadows>
      <ambientLight intensity={1.65} />
      <directionalLight position={[3.8, 4.8, 4]} intensity={2.8} color="#fff4ec" castShadow />
      <pointLight position={[-3, 1, 2]} intensity={1.8} color="#6fd8cd" />
      <pointLight position={[2, -2, 2]} intensity={1.15} color="#c9a4eb" />
      <Anatomy {...props} />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.29} maxPolarAngle={Math.PI * 0.7} rotateSpeed={0.64} />
    </Canvas>
  );
}
