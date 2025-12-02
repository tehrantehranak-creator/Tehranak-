
import React, { useState, useEffect } from 'react';
import { Shield, Delete, Check, Lock } from 'lucide-react';

interface PinScreenProps {
  mode: 'unlock' | 'setup' | 'verify'; // unlock: entry, setup: new pin, verify: confirm new pin
  onSuccess: (pin: string) => void;
  onCancel?: () => void;
  storedPin?: string;
}

export const PinScreen: React.FC<PinScreenProps> = ({ mode, onSuccess, onCancel, storedPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>(mode === 'setup' ? 'enter' : 'enter');
  const [tempPin, setTempPin] = useState('');

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit(pin);
    }
  }, [pin]);

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = (inputPin: string) => {
    if (mode === 'unlock') {
      if (inputPin === storedPin) {
        onSuccess(inputPin);
      } else {
        setError('رمز اشتباه است');
        setTimeout(() => setPin(''), 500);
      }
    } else if (mode === 'setup') {
      if (step === 'enter') {
        setTempPin(inputPin);
        setStep('confirm');
        setPin('');
      } else {
        if (inputPin === tempPin) {
          onSuccess(inputPin);
        } else {
          setError('رمزها مطابقت ندارند');
          setStep('enter');
          setTempPin('');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const getTitle = () => {
    if (mode === 'unlock') return 'وارد شوید';
    if (mode === 'setup' && step === 'enter') return 'رمز عبور جدید را وارد کنید';
    if (mode === 'setup' && step === 'confirm') return 'رمز عبور را تکرار کنید';
    return 'امنیت';
  };

  return (
    <div className="absolute inset-0 z-[200] bg-slate-50 dark:bg-[#0F172A] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-700 dark:text-white shadow-inner">
          {error ? <Shield size={40} className="text-red-500" /> : <Lock size={40} />}
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{getTitle()}</h2>
        {error && <p className="text-red-500 text-sm font-bold animate-pulse">{error}</p>}
      </div>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              pin.length >= i 
                ? 'bg-purple-600 scale-125 shadow-lg shadow-purple-500/50' 
                : 'bg-gray-300 dark:bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-[280px] dir-ltr">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-16 h-16 rounded-full bg-white dark:bg-white/5 text-2xl font-bold text-slate-800 dark:text-white shadow-sm active:scale-90 active:bg-purple-100 dark:active:bg-purple-900/20 transition-all flex items-center justify-center border border-gray-200 dark:border-white/5"
          >
            {num}
          </button>
        ))}
        
        <div className="flex items-center justify-center">
             {onCancel && (
                 <button onClick={onCancel} className="text-sm font-bold text-gray-500 dark:text-gray-400">انصراف</button>
             )}
        </div>
        
        <button
            onClick={() => handlePress('0')}
            className="w-16 h-16 rounded-full bg-white dark:bg-white/5 text-2xl font-bold text-slate-800 dark:text-white shadow-sm active:scale-90 active:bg-purple-100 dark:active:bg-purple-900/20 transition-all flex items-center justify-center border border-gray-200 dark:border-white/5"
          >
            0
        </button>

        <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-800 dark:text-white hover:text-red-500 active:scale-90 transition-all"
          >
            <Delete size={24} />
        </button>
      </div>
    </div>
  );
};
