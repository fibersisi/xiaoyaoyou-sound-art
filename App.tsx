import React from 'react';
import Scene from './components/Scene';
import Controls from './components/UI/Controls';
import { useAudio } from './hooks/useAudio';

const App: React.FC = () => {
  const { isPlaying, analyser, togglePlay, handleFileUpload } = useAudio();

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene analyser={analyser} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Controls 
          isPlaying={isPlaying} 
          onTogglePlay={togglePlay} 
          onFileUpload={handleFileUpload}
        />
        
        {/* Top Right Info */}
        <div className="absolute top-6 right-6 text-right pointer-events-auto">
          <div className="text-white/30 text-xs font-mono">
            <p>ZHUANGZI 'XIAOYAOYOU'</p>
            <p>Northern Ocean Fish → Sky Bird</p>
          </div>
        </div>
        
        {/* Intro Overlay (only if not playing initially, maybe?) - Keeping it simple for now */}
        {!analyser && !isPlaying && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 pointer-events-auto">
              <div className="text-center text-white">
                 <h2 className="text-4xl font-serif text-amber-100 mb-4">Free and Easy Wandering</h2>
                 <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                   "In the Northern Ocean there is a fish, the name of which is Kun. 
                   <br/>The size of Kun is I know not how many thousand li. 
                   <br/>It changes into a bird with the name of Peng."
                 </p>
                 <button 
                   onClick={togglePlay}
                   className="px-8 py-3 bg-cyan-900/50 hover:bg-cyan-800/80 border border-cyan-500/30 rounded text-cyan-100 transition-colors"
                 >
                   Enter the Visualization
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default App;