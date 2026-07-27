import { Search as SearchIcon } from 'lucide-react';
import brandLogo from '../assets/logo';

export const Search = () => {
  return (
    <div className="bg-slate-50 min-h-full flex flex-col p-6 font-sans">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon size={20} className="text-slate-400" />
        </div>
        <input
          type="text"
          autoFocus
          className="block w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl bg-white text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-emerald-500 transition-colors"
          placeholder="Search shops, categories..."
        />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 pb-24">
        <div className="h-16 mb-6 opacity-30 grayscale">
          <img src={brandLogo} alt="Arbeez Fresh Logo" className="h-full w-auto object-contain" />
        </div>
        <p className="font-extrabold text-slate-400 uppercase tracking-widest text-sm">Start typing to search</p>
      </div>
    </div>
  );
};
