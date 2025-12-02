
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // 0: Text, 1: Morph to House, 2: Open Door, 3: Zoom In (Enter)
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 1: Show Text for 2 seconds, then switch to House
    const timer1 = setTimeout(() => {
      setStep(1);
    }, 2000);

    // Step 2: Short pause, then Open Door
    const timer2 = setTimeout(() => {
      setStep(2);
    }, 2800);

    // Step 3: Zoom into the house
    const timer3 = setTimeout(() => {
      setStep(3);
    }, 3500);

    // Finish: Unmount splash
    const timer4 = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#0F172A] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${step === 3 ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Stage 1: Text Logo */}
      <div className={`absolute transition-all duration-700 transform ${step === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <div className="text-5xl md:text-7xl font-extrabold tracking-[0.2em] flex items-center" dir="ltr">
           <span className="text-gray-400 drop-shadow-2xl">TEHRA</span>
           <span className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">NAK</span>
        </div>
      </div>

      {/* Stage 2: House Animation */}
      <div className={`absolute transition-all duration-1000 transform ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-150'} ${step === 3 ? 'scale-[20]' : ''}`}>
         <div className="relative w-32 h-32 md:w-48 md:h-48 text-green-500">
             {/* Roof and Walls */}
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M10 40 L50 10 L90 40 V90 H10 V40 Z" className="fill-[#0F172A]" />
             </svg>
             
             {/* Door Frame */}
             <div className="absolute bottom-[10%] left-[35%] w-[30%] h-[40%] border-2 border-green-500 border-b-0 bg-[#0F172A] flex overflow-visible perspective-500">
                 {/* The Door Panel */}
                 <div 
                    className={`w-full h-full bg-green-500/20 border-r-2 border-green-500 origin-left transition-transform duration-1000 ease-in-out flex items-center justify-end pr-1 ${step >= 2 ? '[transform:rotateY(-110deg)]' : ''}`}
                    style={{ transformStyle: 'preserve-3d' }}
                 >
                     {/* Door Handle */}
                     <div className="w-1 h-1 bg-green-500 rounded-full shadow-[0_0_5px_white]"></div>
                 </div>
                 
                 {/* Light coming from inside */}
                 <div className={`absolute inset-0 bg-white transition-opacity duration-1000 ${step >= 2 ? 'opacity-80 blur-md' : 'opacity-0'}`}></div>
             </div>
         </div>
      </div>
    </div>
  );
};
