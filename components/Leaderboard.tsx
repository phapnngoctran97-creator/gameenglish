import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, UserProfile, PlayerStats } from '../types';
import { generateLeaderboard } from '../services/geminiService';
import { Trophy, Loader2, X } from 'lucide-react';

interface LeaderboardProps {
  topicName: string;
  userProfile: UserProfile;
  playerStats: PlayerStats;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ topicName, userProfile, playerStats, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const globalData = await generateLeaderboard(topicName);
      // Add user to the list
      const userEntry: LeaderboardEntry = {
        rank: 0, // calculated later
        name: userProfile.name,
        avatar: userProfile.avatar,
        xp: playerStats.xp,
        country: "🇻🇳"
      };
      
      const allEntries = [...globalData, userEntry].sort((a, b) => b.xp - a.xp);
      // Re-assign ranks
      const rankedEntries = allEntries.map((e, i) => ({ ...e, rank: i + 1 }));
      
      setEntries(rankedEntries);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [topicName, userProfile, playerStats.xp]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-yellow-600 rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
           <div className="flex items-center gap-2 text-yellow-500">
             <Trophy size={20} />
             <h3 className="font-pixel text-sm md:text-base">Top Heroes: {topicName}</h3>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white">
             <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-40 gap-3">
               <Loader2 className="animate-spin text-yellow-500" />
               <p className="text-xs text-slate-500">Connecting to global server...</p>
             </div>
           ) : (
             <div className="space-y-2">
               {entries.map((entry) => {
                 const isUser = entry.name === userProfile.name;
                 return (
                   <div 
                     key={entry.rank}
                     className={`flex items-center gap-3 p-3 rounded-lg border ${
                       isUser 
                         ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                         : 'bg-slate-800 border-slate-700'
                     }`}
                   >
                     <div className={`
                       w-8 h-8 flex items-center justify-center rounded font-bold font-pixel
                       ${entry.rank === 1 ? 'bg-yellow-500 text-black' : 
                         entry.rank === 2 ? 'bg-slate-300 text-black' : 
                         entry.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'}
                     `}>
                       {entry.rank}
                     </div>
                     
                     <div className="text-2xl">{entry.avatar}</div>
                     
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <span className={`font-bold truncate ${isUser ? 'text-blue-300' : 'text-white'}`}>
                           {entry.name}
                         </span>
                         <span className="text-sm">{entry.country}</span>
                       </div>
                       <div className="text-xs text-slate-400">Hero</div>
                     </div>

                     <div className="text-right">
                       <div className="font-mono text-yellow-400 font-bold">{entry.xp.toLocaleString()}</div>
                       <div className="text-[10px] text-slate-500 uppercase">XP</div>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};