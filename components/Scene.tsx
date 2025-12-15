import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Ocean from './Visuals/Ocean';
import Kunpeng from './Visuals/Kunpeng';
import EnvironmentParticles from './Visuals/Environment';

interface SceneProps {
  analyser: AnalyserNode | null;
}

const Scene: React.FC<SceneProps> = ({ analyser }) => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 8, 25]} fov={60} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          maxDistance={50} 
          minDistance={10} 
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going under water
          autoRotate
          autoRotateSpeed={0.5}
        />
        
        <Suspense fallback={null}>
          <EnvironmentParticles analyser={analyser} />
          <Kunpeng analyser={analyser} />
          <Ocean analyser={analyser} />
          <fog attach="fog" args={['#050510', 10, 60]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;