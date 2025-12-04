import React, { useEffect, useRef } from 'react';
import { Topic } from '../types';
import { Lock, Star, Trophy, Map as MapIcon, Loader2 } from 'lucide-react';

interface MapScreenProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  playerLevel: number;
  isLoadingMore: boolean;
}

export const MapScreen: React.FC<MapScreenProps> = ({ topics, onSelectTopic, playerLevel, isLoadingMore }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to current level on load
  useEffect(() => {
    if (scrollRef.current) {
      // Find the last unlocked index
      const lastUnlockedIndex = topics.reduce((acc, t, i) => (!t.isLocked ? i : acc), 0);
      
      const node = document.getElementById(`node-${lastUnlockedIndex}`);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [topics.length]); // Re-run when topics increase

  const isCompleted = (index: number) => {
    if (index === topics.length - 1) return false; 
    return !topics[index + 1].isLocked;
  };

  const currentPlayerIndex = topics.reduce((acc, t, i) => (!t.isLocked ? i : acc), 0);

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden" ref={scrollRef}>
      {/* Background Map Texture */}
      <div className="absolute inset-0 bg-[#4ade80] opacity-10" 
           style={{ 
             backgroundImage: 'radial-gradient(#22c55e 2px, transparent 2px)', 
             backgroundSize: '30px 30px' 
           }}>
      </div>
      
      {/* River/Path Decoration - Just a visual pattern, not a strict SVG path since height varies */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="w-4 h-full bg-slate-800 mx-auto blur-xl"></div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
        <div className="flex flex-col items-center gap-16 py-10 w-full max-w-lg mx-auto">
          
          {topics.map((topic, index) => {
            // Layout Logic
            let alignClass = 'self-center';
            if (index % 4 === 1) alignClass = 'self-start ml-8 md:ml-12';
            if (index % 4 === 3) alignClass = 'self-end mr-8 md:mr-12';

            const isActive = index === currentPlayerIndex;
            const completed = isCompleted(index);
            
            // Check if this is the start of a new Chapter (every 10 levels)
            const showChapterHeader = (index === 0) || (topic.chapterName !== topics[index-1].chapterName);

            return (
              <React.Fragment key={topic.id}>
                
                {/* Chapter Divider */}
                {showChapterHeader && (
                  <div className="w-full flex flex-col items-center justify-center my-8 animate-fade-in">
                    <div className="bg-yellow-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 mb-2 border border-yellow-400">
                      <MapIcon size={12} />
                      Chapter {Math.ceil(topic.levelNumber / 10)}
                    </div>
                    <h3 className="text-xl font-pixel text-yellow-400 drop-shadow-md text-center">{topic.chapterName}</h3>
                    <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mt-2"></div>
                  </div>
                )}

                <div 
                  id={`node-${index}`}
                  className={`relative flex flex-col items-center group ${alignClass}`}
                >
                  {/* Connector Line to Next Node */}
                  {index < topics.length - 1 && (
                    <div className="absolute h-20 w-1 bg-slate-600/30 -bottom-16 left-1/2 transform -translate-x-1/2 -z-10 border-l-2 border-dashed border-slate-500"></div>
                  )}

                  {/* The Node Button */}
                  <button
                    onClick={() => !topic.isLocked && onSelectTopic(topic)}
                    disabled={topic.isLocked}
                    className={`
                      w-20 h-20 md:w-24 md:h-24 rounded-full border-b-8 shadow-xl flex items-center justify-center relative transition-all duration-300
                      ${topic.isLocked 
                        ? 'bg-slate-700 border-slate-900 cursor-not-allowed grayscale opacity-80' 
                        : completed
                          ? 'bg-yellow-500 border-yellow-700 hover:scale-105'
                          : 'bg-blue-500 border-blue-700 hover:scale-110 animate-pulse-slow'
                      }
                    `}
                  >
                    <span className="text-2xl md:text-3xl filter drop-shadow-md">
                      {topic.isLocked ? <Lock className="w-8 h-8 text-slate-400" /> : topic.icon}
                    </span>
                    
                    {/* Level Badge */}
                    <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center border border-slate-600 font-bold">
                      {topic.levelNumber}
                    </div>

                    {/* Stars for completed levels */}
                    {completed && (
                      <div className="absolute -bottom-2 flex gap-1">
                        <Star size={12} className="text-yellow-200 fill-yellow-200" />
                        <Star size={16} className="text-yellow-200 fill-yellow-200 -mt-1" />
                        <Star size={12} className="text-yellow-200 fill-yellow-200" />
                      </div>
                    )}
                  </button>

                  {/* Avatar Character */}
                  {isActive && (
                    <div className="absolute -top-12 z-20 animate-bounce">
                      <div className="text-5xl filter drop-shadow-lg transform scale-x-[-1]">
                        🧙‍♂️
                      </div>
                      <div className="bg-black/40 w-10 h-2 rounded-[100%] absolute bottom-1 left-2 blur-[2px]"></div>
                    </div>
                  )}

                  {/* Topic Label */}
                  <div className={`mt-3 px-3 py-1 rounded-lg backdrop-blur-sm border text-center max-w-[150px]
                    ${topic.isLocked 
                      ? 'bg-slate-800/80 border-slate-600 text-slate-400' 
                      : 'bg-slate-900/90 border-yellow-500 text-white shadow-lg shadow-yellow-500/20'
                    }`}
                  >
                    <span className="font-bold text-xs md:text-sm block truncate">{topic.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">{topic.difficulty}</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          
          {/* Loading Indicator for Infinite Scroll */}
          {isLoadingMore ? (
             <div className="flex flex-col items-center gap-2 py-8 animate-pulse">
                <Loader2 className="animate-spin text-blue-400" size={32} />
                <span className="text-sm text-blue-300 font-pixel">Discovering new lands...</span>
             </div>
          ) : (
            <div className="flex flex-col items-center opacity-50 py-8">
               <div className="w-1 bg-slate-600 h-10 mb-2 border-l-2 border-dashed border-slate-500"></div>
               <Trophy size={48} className="text-slate-600" />
               <span className="text-xs text-slate-500 mt-2 font-pixel">More coming soon...</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};