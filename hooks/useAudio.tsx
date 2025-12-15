import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize audio context lazily (browser policy)
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new Ctx();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512; // Controls resolution
      
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.loop = true;
      audio.src = 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3'; // Default track
      audioElementRef.current = audio;

      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      sourceRef.current = source;
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!audioContextRef.current) initAudio();
    
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioElementRef.current?.pause();
    } else {
      audioElementRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, initAudio]);

  const handleFileUpload = useCallback((file: File) => {
    if (audioElementRef.current) {
      const url = URL.createObjectURL(file);
      audioElementRef.current.src = url;
      if (isPlaying) audioElementRef.current.play();
    }
  }, [isPlaying]);

  return {
    isPlaying,
    analyser: analyserRef.current,
    togglePlay,
    handleFileUpload,
    audioElement: audioElementRef.current
  };
};