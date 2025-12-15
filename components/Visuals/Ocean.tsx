import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Vertex Shader: Creates wave motion based on time and audio frequency
const vertexShader = `
  uniform float uTime;
  uniform float uAudioLow;
  uniform float uAudioMid;
  
  varying vec2 vUv;
  varying float vElevation;

  // Simple pseudo-random noise
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Normalize audio inputs (assuming input is roughly 0-255)
    float lowFactor = uAudioLow / 255.0; // 0.0 to 1.0
    float midFactor = uAudioMid / 255.0; // 0.0 to 1.0

    // --- FLIGHT SIMULATION LOGIC ---
    // Simulate the bird flying forward by moving the ocean coordinates backward.
    // The mesh is rotated -90 deg on X, so Mesh Y corresponds to World Z (depth).
    // Adding to Y makes the texture ripple towards the "camera", simulating forward flight.
    
    float flightSpeed = 12.0; // Speed of the Kunpeng
    float travelDist = uTime * flightSpeed;
    
    // Create a traveling coordinate system
    vec2 flowPos = vec2(pos.x, pos.y + travelDist);

    // Large, slow rolling waves (Swells)
    // We use flowPos for the Y axis to make the swell travel
    float bigWave = sin(flowPos.x * 0.15 + uTime * 0.5) * cos(flowPos.y * 0.08);
    bigWave *= (2.0 + lowFactor * 5.0); // High waves when bass hits
    
    // Texture/Ripple wave (Surface detail)
    // Faster noise movement to simulate rushing water
    float detailWave = noise(flowPos * 0.6);
    detailWave *= (0.8 + lowFactor * 2.0);
    
    // Spikes/Choppiness from Mids (Wake turbulence)
    // These move locally relative to the wave to keep surface dynamic
    float spike = sin(pos.x * 5.0 + uTime * 3.0) * cos(pos.y * 5.0 + uTime * 4.0);
    spike *= (midFactor * 0.8);

    float elevation = bigWave + detailWave + spike;
    pos.z += elevation;
    
    vElevation = elevation;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment Shader: Softer color palette and smoother gradients
const fragmentShader = `
  uniform float uAudioHigh;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    // Softer Deep ocean color (Dark Teal)
    vec3 deepColor = vec3(0.0, 0.1, 0.25);
    // Softer Surface color (Muted Cyan)
    vec3 surfaceColor = vec3(0.1, 0.5, 0.65);
    // Foam/Highlight color (Soft White/Blue)
    vec3 highlightColor = vec3(0.7, 0.85, 0.95);

    // Adjusted smoothstep range to account for higher waves (from -1.5/2.5 to -3.0/5.0)
    float mixStrength = smoothstep(-5.0, 8.0, vElevation);
    
    vec3 color = mix(deepColor, surfaceColor, mixStrength);
    
    // Add glowing tips based on Audio Highs
    // Peaks glow more intensely with music
    float foamThreshold = 3.5 - (uAudioHigh * 0.015); 
    float foamStrength = smoothstep(foamThreshold, foamThreshold + 1.5, vElevation);
    
    color = mix(color, highlightColor, foamStrength * 0.7);

    // Distance fog manually in shader to blend into darkness far away
    // Using UV y-coord (which roughly maps to depth on the plane)
    float fogFactor = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    
    gl_FragColor = vec4(color, 0.85 * fogFactor);
  }
`;

interface OceanProps {
  analyser: AnalyserNode | null;
}

const Ocean: React.FC<OceanProps> = ({ analyser }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const dataArray = useMemo(() => new Uint8Array(analyser ? analyser.frequencyBinCount : 128), [analyser]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate frequency bands
        const lowerBound = 0;
        const midBound = Math.floor(dataArray.length / 3);
        const highBound = Math.floor((dataArray.length / 3) * 2);

        let lowSum = 0, midSum = 0, highSum = 0;
        
        for (let i = lowerBound; i < midBound; i++) lowSum += dataArray[i];
        for (let i = midBound; i < highBound; i++) midSum += dataArray[i];
        for (let i = highBound; i < dataArray.length; i++) highSum += dataArray[i];

        const lowAvg = lowSum / (midBound - lowerBound);
        const midAvg = midSum / (highBound - midBound);
        const highAvg = highSum / (dataArray.length - highBound);

        // Interpolation
        const smoothFactor = 0.1; // Slightly faster response for dynamic feel
        materialRef.current.uniforms.uAudioLow.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uAudioLow.value, lowAvg, smoothFactor);
        materialRef.current.uniforms.uAudioMid.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uAudioMid.value, midAvg, smoothFactor);
        materialRef.current.uniforms.uAudioHigh.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uAudioHigh.value, highAvg, smoothFactor);
      }
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudioLow: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioHigh: { value: 0 },
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      {/* Increased segments for smoother wave animation during high speed travel */}
      <planeGeometry args={[100, 100, 200, 200]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={false}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Ocean;