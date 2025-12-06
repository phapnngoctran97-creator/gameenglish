import React from 'react';
import { Location, InteractableItem, LocationExit } from '../types';
import { MapPin, ArrowRightCircle, Search, Sparkles, LogOut } from 'lucide-react';
import { Button } from './Button';

interface SceneViewProps {
  location: Location;
  onItemClick: (item: InteractableItem) => void;
  onNavigate: (target: string) => void;
  onGoHome: () => void;
}

export const SceneView: React.FC<SceneViewProps> = ({ location, onItemClick, onNavigate, onGoHome }) => {
  return (
    <div className={`flex flex-col h-full w-full ${location.backgroundTheme} transition-colors duration-1000`}>
      
      {/* Header / Description */}
      <div className="p-4 md:p-6 pb-2 bg-white/80 backdrop-blur-md shadow-sm z-10 sticky top-0 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
             <MapPin size={20} />
             <h2 className="text-xl md:text-2xl font-bold font-pixel uppercase truncate">{location.name}</h2>
          </div>
          <p className="text-slate-600 text-xs md:text-sm italic leading-relaxed line-clamp-2 md:line-clamp-none">
            {location.description}
          </p>
        </div>
        
        <button 
          onClick={onGoHome}
          className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors flex-shrink-0"
          title="Return to Main Menu"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Interaction Area (The "Room") */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Search size={14} /> Visible Objects
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {location.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="group relative bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300 h-32 md:h-40"
            >
              <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">
                {item.emoji}
              </div>
              <span className="font-bold text-slate-700 group-hover:text-indigo-600 text-sm md:text-base text-center line-clamp-2">
                {item.wordDetail.english}
              </span>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles size={16} className="text-yellow-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-slate-900 text-white p-4 pb-8 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
           Move To
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 justify-start md:justify-center custom-scrollbar">
          {location.exits.map((exit, idx) => (
             <Button 
               key={idx} 
               onClick={() => onNavigate(exit.targetLocationName)}
               variant="secondary"
               className="whitespace-nowrap flex items-center gap-2 min-w-max"
             >
               <span>{exit.emoji}</span>
               <span>{exit.direction}</span>
               <ArrowRightCircle size={16} className="opacity-50" />
             </Button>
          ))}
        </div>
      </div>

    </div>
  );
};