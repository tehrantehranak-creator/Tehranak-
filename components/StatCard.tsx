import React from 'react';
import { StatCardProps } from '../types';

export const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon, colorClass }) => {
  // Extract base color for light mode border/bg tint
  // This is a simplification, ideally we'd map colorClass to light variants
  
  return (
    <div className={`p-4 rounded-3xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 relative overflow-hidden flex flex-col justify-between h-32 shadow-lg shadow-gray-200/50 dark:shadow-none hover:scale-[1.02] transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <div className={`${colorClass} p-2 rounded-full bg-opacity-10 dark:bg-opacity-20`}>
           {/* Icon wrapper */}
           {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 ${colorClass.replace('bg-', 'text-')}` })}
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</span>
      </div>
      
      <div className="mt-2 relative z-10">
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
        {subValue && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{subValue}</p>
        )}
      </div>
      
      {/* Decorative glow */}
      <div className={`absolute -bottom-4 -right-4 w-16 h-16 ${colorClass} blur-2xl opacity-10 dark:opacity-20 rounded-full`}></div>
    </div>
  );
};