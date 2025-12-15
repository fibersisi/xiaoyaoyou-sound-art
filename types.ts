export interface AudioData {
  frequency: Uint8Array;
  average: number;
  low: number;
  mid: number;
  high: number;
}

export interface AudioContextState {
  isPlaying: boolean;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  source: MediaElementAudioSourceNode | null;
  togglePlay: () => void;
  handleFileUpload: (file: File) => void;
}
