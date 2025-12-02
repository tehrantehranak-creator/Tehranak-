
import React from 'react';
import { User } from '../types';

interface LoginScreenProps {
  users: User[]; 
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white">
        <div className="text-center">
            <h2 className="text-xl font-bold mb-4">سیستم ورود</h2>
            <p className="text-gray-500 text-sm">این بخش در حال حاضر غیرفعال است.</p>
        </div>
    </div>
  );
};
