
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, HelpCircle } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      return;
    }

    // 2. Check dismissal
    if (localStorage.getItem('pwa_install_dismissed')) {
      return;
    }

    // 3. Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // 4. Capture event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // 5. Fallback: If mobile but no event fired (e.g. iOS or blocked), show anyway after delay
    const timer = setTimeout(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // Show if mobile AND not dismissed.
        // Note: deferredPrompt might still be null here if browser hasn't fired it yet or won't fire it.
        // We show the UI anyway to offer instructions or wait for the prompt.
        if (isMobile && !show && !localStorage.getItem('pwa_install_dismissed')) {
            setShow(true);
        }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Auto install (Android/Desktop)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShow(false);
      }
    } else {
      // Manual Instructions (iOS or event missing)
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <>
        {/* Main Floating Banner */}
        <div className={`fixed bottom-24 left-4 right-4 z-40 animate-slide-up transition-all duration-300 ${showInstructions ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-gray-200 text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 dark:border-black/5 relative overflow-hidden">
            
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500 rounded-full blur-2xl opacity-30"></div>
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-30"></div>

            <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 bg-white/10 dark:bg-black/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Smartphone size={24} className="text-purple-400 dark:text-purple-600" />
            </div>
            <div>
                <h4 className="font-bold text-sm">نصب اپلیکیشن</h4>
                <p className="text-[10px] opacity-80 mt-0.5 max-w-[180px]">
                برای دسترسی سریع‌تر، برنامه را نصب کنید.
                </p>
            </div>
            </div>

            <div className="flex gap-2 relative z-10">
                <button 
                    onClick={handleInstallClick}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/30 flex items-center gap-1 justify-center"
                >
                    <Download size={16} />
                    <span>نصب</span>
                </button>
                <button 
                    onClick={handleDismiss}
                    className="bg-white/10 hover:bg-white/20 dark:bg-black/5 dark:hover:bg-black/10 p-2 rounded-xl transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
        </div>

        {/* Manual Instructions Modal (For iOS / Fallback) */}
        {showInstructions && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowInstructions(false)}>
                <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowInstructions(false)} className="absolute top-4 left-4 text-gray-400"><X size={24}/></button>
                    
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
                            {isIOS ? <Share size={32} className="text-purple-600 dark:text-purple-400" /> : <Smartphone size={32} className="text-purple-600 dark:text-purple-400" />}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            {deferredPrompt ? 'تایید نصب' : 'راهنمای نصب'}
                        </h3>
                        
                        {isIOS ? (
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4 text-right mt-2">
                                <p>۱. دکمه <span className="font-bold text-blue-500">Share</span> (اشتراک‌گذاری) در پایین مرورگر سافاری را بزنید.</p>
                                <p>۲. در منوی باز شده به پایین اسکرول کنید.</p>
                                <p>۳. گزینه <span className="font-bold text-slate-800 dark:text-white border px-1 rounded bg-gray-100 dark:bg-white/10">Add to Home Screen</span> را انتخاب کنید.</p>
                                <p>۴. دکمه <span className="font-bold text-blue-500">Add</span> را در بالا سمت راست بزنید.</p>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4 text-right mt-2">
                                {!deferredPrompt && <p className="text-xs text-red-500 mb-2">مرورگر اجازه نصب خودکار نداد. لطفا دستی انجام دهید:</p>}
                                <p>۱. دکمه <span className="font-bold">منو (سه نقطه)</span> در مرورگر را بزنید.</p>
                                <p>۲. گزینه <span className="font-bold text-slate-800 dark:text-white border px-1 rounded bg-gray-100 dark:bg-white/10">Install App</span> یا <span className="font-bold">Add to Home Screen</span> را انتخاب کنید.</p>
                                <p>۳. دکمه <span className="font-bold text-purple-500">Install</span> را بزنید.</p>
                            </div>
                        )}
                        
                        <button onClick={() => setShowInstructions(false)} className="mt-6 w-full py-3 bg-purple-600 text-white rounded-xl font-bold">متوجه شدم</button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
