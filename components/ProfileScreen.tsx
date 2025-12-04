import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { User } from 'lucide-react';

interface ProfileScreenProps {
  onProfileCreate: (profile: UserProfile) => void;
}

const AVATARS = ["🧙‍♂️", "🧛‍♀️", "🧝", "🧚‍♀️", "🦸‍♂️", "🥷", "👩‍🚀", "🤖"];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onProfileCreate }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onProfileCreate({ name: name.trim(), avatar: selectedAvatar });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center max-w-md mx-auto w-full">
      <div className="mb-8 p-6 bg-slate-800 rounded-full shadow-2xl border-4 border-indigo-500 animate-bounce-slow">
         <User size={64} className="text-indigo-400" />
      </div>
      
      <h2 className="text-3xl font-pixel text-white mb-2">Who are you?</h2>
      <p className="text-slate-400 mb-8">Create your Hero Profile to join the world.</p>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
            <label className="block text-left text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                Hero Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-pixel"
              maxLength={15}
            />
        </div>

        <div>
            <label className="block text-left text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                Choose Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
                {AVATARS.map(av => (
                    <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`text-3xl p-3 rounded-lg border-2 transition-all ${
                            selectedAvatar === av 
                            ? 'bg-blue-600 border-blue-400 scale-110 shadow-lg' 
                            : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        {av}
                    </button>
                ))}
            </div>
        </div>

        <Button 
            type="submit" 
            size="lg" 
            className="w-full mt-4" 
            disabled={!name.trim()}
        >
            Start Adventure
        </Button>
      </form>
    </div>
  );
};