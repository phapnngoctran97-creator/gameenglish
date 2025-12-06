import React, { useState } from 'react';
import { InteractableItem, Location } from '../types';
import { BookOpen, Volume2, Search, ArrowLeft, Map, Grid, MapPin } from 'lucide-react';
import { Button } from './Button';

interface NotebookProps {
  collectedItems: InteractableItem[];
  visitedLocations: Location[];
  onClose: () => void;
}

type Tab = 'words' | 'places';

export const Notebook: React.FC<NotebookProps> = ({ collectedItems, visitedLocations, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('words');
  
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      
      {/* Header */}
      <div className="bg-indigo-600 p-4 pb-0 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onClose} className="p-2 hover:bg-indigo-500 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen size={24} />
            <h2 className="text-xl font-bold font-pixel">Travel Journal</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('words')}
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors flex items-center justify-center gap-2
              ${activeTab === 'words' ? 'bg-slate-50 text-indigo-600' : 'bg-indigo-700 text-indigo-200 hover:bg-indigo-500'}`}
          >
            <Grid size={16} />
            Words ({collectedItems.length})
          </button>
          <button 
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors flex items-center justify-center gap-2
              ${activeTab === 'places' ? 'bg-slate-50 text-indigo-600' : 'bg-indigo-700 text-indigo-200 hover:bg-indigo-500'}`}
          >
            <Map size={16} />
            Places ({visitedLocations.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
        
        {/* WORDS TAB */}
        {activeTab === 'words' && (
          <>
            {collectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Search size={48} className="mb-4 opacity-50" />
                <p>You haven't discovered any words yet.</p>
                <p className="text-sm">Go explore the world!</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {collectedItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{item.emoji}</span>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{item.wordDetail.english}</h3>
                        <p className="text-indigo-600 text-sm">{item.wordDetail.vietnamese}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => speak(item.wordDetail.english)}
                      className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PLACES TAB */}
        {activeTab === 'places' && (
          <div className="space-y-4">
             {visitedLocations.map((loc, idx) => (
               <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className={`h-2 w-full ${loc.backgroundTheme.replace('bg-', 'bg-') || 'bg-slate-200'}`}></div>
                 <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                       <MapPin className="text-indigo-500" size={18} />
                       <h3 className="font-bold text-lg text-slate-800">{loc.name}</h3>
                    </div>
                    <p className="text-slate-500 text-sm italic">{loc.description}</p>
                    <div className="mt-3 flex gap-2">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        {loc.items.length} items found
                      </span>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        )}

      </div>
    </div>
  );
};