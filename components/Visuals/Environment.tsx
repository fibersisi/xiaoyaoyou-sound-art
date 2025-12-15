import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';

const EnvironmentParticles: React.FC<{ analyser: AnalyserNode | null }> = ({ analyser }) => {
  const starsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (starsRef.current) {
      // Rotate stars slowly
      starsRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <group>
      <group ref={starsRef}>
         <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </group>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffaa00" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#00aaff" />
      
      {/* Distant Clouds for atmosphere */}
      <Cloud position={[-15, 10, -20]} opacity={0.3} speed={0.2} segments={20} />
      <Cloud position={[15, 12, -25]} opacity={0.3} speed={0.2} segments={20} />
    </group>
  );
};

export default EnvironmentParticles;