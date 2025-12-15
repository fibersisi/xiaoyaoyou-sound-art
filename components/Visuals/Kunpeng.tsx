import React, { useRef, useMemo } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// A mystical golden particle bird that flaps wings and vibrates with sound
const vertexShader = `
  uniform float uTime;
  uniform float uSize;
  uniform float uAudioLow;  // Bass drives the heavy flapping AND diffusion
  uniform float uAudioHigh; // High-Mids drive the "Bell" vibration
  uniform float uIsReflection; // 1.0 if this is the reflection
  
  attribute float aScale;
  attribute vec3 aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  // Simple noise for water distortion
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec3 pos = position;
    
    // 1. Basic Flapping Motion
    float flapSpeed = uTime * 2.0;
    float flapIntensity = (1.0 + uAudioLow * 0.02); 
    
    // Main body undulation (spine wave)
    pos.y += sin(pos.z * 0.5 + uTime) * 0.5;
    
    // Wing flapping
    float wingDist = abs(pos.x);
    float flap = sin(flapSpeed - wingDist * 0.5) * (wingDist * 0.5) * flapIntensity;
    pos.y += flap;

    // 2. Breathing effect
    float breathing = (sin(uTime * 3.0) * 0.05 * uAudioLow * 0.01);
    pos *= 1.0 + breathing;

    // 3. Drum Diffusion (Scatter)
    float kick = smoothstep(3.5, 9.0, uAudioLow); 
    float scatterStrength = (uAudioLow * 0.08) + (kick * 1.2); 
    vec3 scatterDir = normalize(pos) + (aRandom - 0.5);
    pos += scatterDir * scatterStrength * 5.0;

    // 4. Bell Sound Vibration
    float vibrationFreq = 60.0; 
    float vibrationAmp = uAudioHigh * 0.06; 
    vec3 vibration = vec3(
        sin(uTime * vibrationFreq + aRandom.x * 10.0),
        cos(uTime * vibrationFreq + aRandom.y * 10.0),
        sin(uTime * vibrationFreq + aRandom.z * 10.0)
    ) * vibrationAmp;
    pos += vibration;

    // --- REFLECTION LOGIC ---
    if (uIsReflection > 0.5) {
        // Water Distortion:
        // Add sine wave ripples to X and Z based on Y height and Time
        float ripple = sin(pos.y * 0.5 + uTime * 3.0) * 0.5 + sin(pos.x * 0.2 + uTime * 2.0) * 0.5;
        
        pos.x += ripple * 2.0; // Horizontal smear
        pos.z += ripple * 1.5; // Depth smear
        
        // Flatten/Stretch slightly to look like it's on a surface
        pos.y *= 0.9; 
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    float beatSize = 1.0 + (kick * 0.8);
    gl_PointSize = uSize * aScale * beatSize * (100.0 / -mvPosition.z);
    
    // Color Logic
    vec3 goldColor = vec3(0.7, 0.45, 0.1); 
    vec3 wingColor = vec3(0.05, 0.1, 0.4); 
    vColor = mix(goldColor, wingColor, smoothstep(1.0, 18.0, wingDist));
    
    // Highlights
    vColor += vec3(0.0, 0.1, 0.2) * (uAudioHigh * 0.03);
    vColor += vec3(0.3, 0.05, 0.4) * kick;

    // 5. Exposure Control
    float densityFactor = smoothstep(0.0, 15.0, wingDist); 
    vAlpha = 0.15 + (0.35 * densityFactor);

    // Reflection adjustments
    if (uIsReflection > 0.5) {
        // Dim the reflection significantly
        vAlpha *= 0.4;
        
        // Tint towards ocean color (Cyan/Blue)
        vColor = mix(vColor, vec3(0.0, 0.6, 0.8), 0.4);
    }
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 2.5); 
    
    float finalAlpha = strength * vAlpha;
    
    gl_FragColor = vec4(vColor, finalAlpha);
  }
`;

type KunpengProps = ThreeElements['points'] & {
  analyser: AnalyserNode | null;
  isReflection?: boolean;
};

const Kunpeng: React.FC<KunpengProps> = ({ analyser, isReflection = false, ...props }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const count = 3500;
  const dataArray = useMemo(() => new Uint8Array(analyser ? analyser.frequencyBinCount : 128), [analyser]);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomness = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const xPos = (Math.pow(Math.random(), 1.8)) * (Math.random() < 0.5 ? -1 : 1) * 25;
      const zPos = (Math.random() - 0.5) * 16;
      const yPos = Math.abs(xPos) * 0.15 * -1; 

      positions[i * 3] = xPos;
      positions[i * 3 + 1] = yPos;
      positions[i * 3 + 2] = zPos;

      scales[i] = Math.random();
      randomness[i * 3] = Math.random();
      randomness[i * 3 + 1] = Math.random();
      randomness[i * 3 + 2] = Math.random();
    }
    return { positions, scales, randomness };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        
        const bufferLength = dataArray.length;
        const lowEnd = Math.floor(bufferLength * 0.15); 
        const highStart = Math.floor(bufferLength * 0.15); 
        const highEnd = Math.floor(bufferLength * 0.50);

        let lowSum = 0;
        let highSum = 0;

        for(let i = 0; i < lowEnd; i++) lowSum += dataArray[i];
        for(let i = highStart; i < highEnd; i++) highSum += dataArray[i];

        const lowAvg = lowSum / lowEnd;
        const highAvg = highSum / (highEnd - highStart);
        
        const lowNorm = lowAvg / 255.0;
        const highNorm = highAvg / 255.0;

        materialRef.current.uniforms.uAudioLow.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uAudioLow.value, lowNorm * 10.0, 0.3);
        materialRef.current.uniforms.uAudioHigh.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uAudioHigh.value, highNorm * 15.0, 0.15);
      }
    }
    
    if (pointsRef.current) {
       // Apply same rotation logic, works for reflection too as it rotates the container
       pointsRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.08;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSize: { value: 12.0 },
    uAudioLow: { value: 0 },
    uAudioHigh: { value: 0 },
    uIsReflection: { value: isReflection ? 1.0 : 0.0 },
  }), [isReflection]);

  return (
    <points ref={pointsRef} {...props}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={count}
          array={particles.scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={particles.randomness}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Kunpeng;