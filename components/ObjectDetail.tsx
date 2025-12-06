import React, { useEffect } from 'react';
import { InteractableItem } from '../types';
import { Volume2, X, BookOpen, Quote, MessageCircle } from 'lucide-react';
import { Button } from './Button';

interface ObjectDetailProps {
  item: InteractableItem;
  onClose: () => void;
}

export const ObjectDetail: React.FC<ObjectDetailProps> = ({ item, onClose }) => {
  const detail = item.wordDetail;

  useEffect(() => {
    // Auto speak when opened
    speak(detail.english);
  }, [item]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-slide-up max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
        >
          <X size={24} className="text-slate-600" />
        </button>

        {/* Header Image/Emoji */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 flex justify-center items-center h-40 shrink-0 relative">
           <div className="text-8xl filter drop-shadow-xl animate-bounce-slow">
              {item.emoji}
           </div>
           {/* IPA Tag */}
           <div className="absolute bottom-4 bg-white/60 backdrop-blur px-4 py-1 rounded-full text-slate-600 font-mono text-lg shadow-sm">
             /{detail.pronunciation}/
           </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
           
           {/* Word Title & Meaning */}
           <div className="text-center mb-6 shrink-0">
              <div className="flex items-center justify-center gap-3 mb-1">
                 <h2 className="text-3xl font-bold text-slate-800">{detail.english}</h2>
                 <button 
                   onClick={() => speak(detail.english)}
                   className="bg-indigo-100 hover:bg-indigo-200 p-2 rounded-full text-indigo-600 transition-all active:scale-95"
                 >
                   <Volume2 size={20} />
                 </button>
              </div>
              <p className="text-xl font-medium text-indigo-600 mb-1">{detail.vietnamese}</p>
              <span className="text-xs text-slate-400 italic uppercase tracking-wider">{detail.type}</span>
           </div>

           {/* Sentence Patterns - Scrollable Area */}
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <MessageCircle size={14} /> Usage Patterns
              </h3>
              
              <div className="space-y-3">
                {detail.usagePatterns && detail.usagePatterns.length > 0 ? (
                  detail.usagePatterns.map((sentence, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group hover:border-indigo-200 transition-colors">
                      <p className="text-slate-700 text-base leading-relaxed font-medium">
                        "{sentence}"
                      </p>
                      <button 
                          onClick={() => speak(sentence)}
                          className="absolute top-2 right-2 p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-white transition-all"
                      >
                          <Volume2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  // Fallback for old data
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                      <p className="text-slate-700 text-base leading-relaxed font-medium">
                        "{detail.exampleSentence}"
                      </p>
                      <button 
                          onClick={() => speak(detail.exampleSentence)}
                          className="absolute top-2 right-2 p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-white transition-all"
                      >
                          <Volume2 size={16} />
                      </button>
                   </div>
                )}
              </div>
           </div>

           <div className="mt-auto shrink-0">
             <Button onClick={onClose} size="lg" className="w-full">
               Close
             </Button>
           </div>
        </div>

      </div>
    </div>
  );
};