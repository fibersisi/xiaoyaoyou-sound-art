import React, { useRef } from 'react';
import { Play, Pause, Upload, Volume2 } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onFileUpload: (file: File) => void;
}

const Controls: React.FC<ControlsProps> = ({ isPlaying, onTogglePlay, onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full p-6 pointer-events-none flex justify-center items-end bg-gradient-to-t from-black/80 to-transparent">
      <div className="pointer-events-auto flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl max-w-md w-full">
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-cyan-300 font-serif tracking-widest">
            Free and Easy Wandering
          </h1>
          <p className="text-gray-400 text-xs mt-1 tracking-wider uppercase">Sound Art Visualization</p>
        </div>

        
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
           <Volume2 size={12} />
           <span>Audio drives wave height & particle glow</span>
        </div>

        <div className="flex gap-4 w-full justify-center">
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ring-1 ring-white/30 hover:ring-cyan-400"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 h-14 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all ring-1 ring-white/20 hover:ring-amber-200"
          >
            <Upload size={18} />
            <span className="text-sm font-medium">Upload Audio</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
        </div>
        
      </div>
    </div>
  );
};

export default Controls;