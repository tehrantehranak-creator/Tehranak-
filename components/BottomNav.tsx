import React from 'react';
import { NavTab } from '../types';
import { Home, Building2, Plus, Users, ClipboardList, DollarSign } from 'lucide-react';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  
  const navItems = [
    { id: NavTab.HOME, label: 'خانه', icon: Home },
    { id: NavTab.PROPERTIES, label: 'املاک', icon: Building2 },
    { id: NavTab.ADD, label: 'ثبت', icon: Plus, isSpecial: true },
    { id: NavTab.CLIENTS, label: 'مشتریان', icon: Users },
    { id: NavTab.TASKS, label: 'وظایف', icon: ClipboardList },
    { id: NavTab.COMMISSION, label: 'کمیسیون', icon: DollarSign }, 
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-[400px] mx-auto bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[24px] px-2 py-2 z-50 shadow-2xl shadow-slate-300/50 dark:shadow-black/50 flex justify-between items-end transition-colors duration-300 h-[75px]">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        
        if (item.isSpecial) {
            return (
                <div key={item.id} className="relative -top-4 flex flex-col items-center w-1/6">
                    <button
                        onClick={() => setActiveTab(item.id)}
                        className="bg-gradient-to-tr from-purple-600 to-blue-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40 border-4 border-slate-50 dark:border-[#0f172a] text-white transition-transform hover:scale-105 active:scale-95"
                    >
                        <Icon size={28} strokeWidth={3} />
                    </button>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">{item.label}</span>
                </div>
            )
        }

        return (
            <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-1/6 pb-1 transition-all duration-300 ${isActive ? 'text-purple-600 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
            >
                <div className={`mb-1 transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-medium transition-all duration-300 ${isActive ? 'opacity-100 font-bold' : 'opacity-80'}`}>
                    {item.label}
                </span>
            </button>
        );
      })}
    </div>
  );
};