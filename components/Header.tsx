import React from 'react';
import { Settings, Search, ArrowRight } from 'lucide-react';

interface HeaderProps {
    title?: string;
    onSearchClick: () => void;
    showBack?: boolean;
    onBack?: () => void;
    onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onSearchClick, showBack, onBack, onSettingsClick }) => {
  return (
    <header className="flex justify-between items-center px-6 pt-12 pb-4 sticky top-0 z-40 bg-slate-50/80 dark:bg-[#0F172A]/80 backdrop-blur-md transition-colors duration-300">
      {/* Right Side (Start in RTL): Back Button or Search */}
      <div className="flex items-center gap-3">
        {showBack ? (
            <button 
                onClick={onBack} 
                className="w-10 h-10 bg-white dark:bg-white/10 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/10 text-slate-700 dark:text-white shadow-sm dark:shadow-none hover:bg-gray-100 dark:hover:bg-white/20 transition-all active:scale-95"
            >
                <ArrowRight size={22} />
            </button>
        ) : (
            <button 
                onClick={onSearchClick} 
                className="w-10 h-10 bg-white dark:bg-white/5 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/10 text-slate-500 dark:text-gray-300 shadow-sm dark:shadow-none hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
                <Search size={20} />
            </button>
        )}
        
        {/* Dynamic Title */}
        {title && (
            <h1 className="text-lg font-bold text-slate-800 dark:text-white animate-fade-in">{title}</h1>
        )}
      </div>

      {/* Left Side (End in RTL): Settings */}
      <button onClick={onSettingsClick} className="w-10 h-10 bg-white dark:bg-white/5 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/10 text-slate-500 dark:text-gray-300 shadow-sm dark:shadow-none hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
        <Settings size={20} />
      </button>
    </header>
  );
};