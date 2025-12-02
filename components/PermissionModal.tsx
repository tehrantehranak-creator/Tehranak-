
import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Mic, Bell, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';

interface PermissionModalProps {
  onComplete: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ onComplete }) => {
  const [permissions, setPermissions] = useState({
    location: false,
    camera: false,
    microphone: false,
    notification: false
  });

  const [step, setStep] = useState(0); // 0: Intro, 1: Permissions

  useEffect(() => {
    const checkPermissions = async () => {
        // Check Notification
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                setPermissions(prev => ({ ...prev, notification: true }));
            }
        }
        // Check Geolocation (Approximate)
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                if (result.state === 'granted') {
                    setPermissions(prev => ({ ...prev, location: true }));
                }
            } catch (e) {}
        }
    };
    checkPermissions();
  }, []);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(prev => ({ ...prev, location: true })),
        (err) => { 
            console.error(err); 
            alert("دسترسی موقعیت مکانی رد شد. لطفا از تنظیمات مرورگر فعال کنید."); 
        },
        { enableHighAccuracy: true }
      );
    } else {
        alert("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.");
    }
  };

  const requestMedia = async (type: 'camera' | 'microphone') => {
    try {
      const constraints = type === 'camera' ? { video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop stream immediately, we just wanted the permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, [type]: true }));
    } catch (err) {
      console.error(err);
      alert(`دسترسی ${type === 'camera' ? 'دوربین' : 'میکروفون'} رد شد. لطفا از تنظیمات مرورگر فعال کنید.`);
    }
  };

  const requestNotification = async () => {
    if (!('Notification' in window)) {
        alert("مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند.");
        return;
    }

    if (Notification.permission === 'denied') {
        alert("شما قبلاً دسترسی اعلان‌ها را مسدود کرده‌اید. لطفاً برای دریافت یادآوری‌ها، از تنظیمات سایت (کنار آدرس بار) گزینه Notifications را روی Allow قرار دهید.");
        return;
    }

    try {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
            setPermissions(prev => ({ ...prev, notification: true }));
        } else {
            alert("اجازه ارسال اعلان داده نشد.");
        }
    } catch (e) {
        console.error(e);
        alert("خطا در دریافت مجوز اعلان.");
    }
  };

  if (step === 0) {
      return (
        <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-[#0F172A] flex flex-col items-center justify-center p-6 animate-fade-in font-['Vazirmatn']">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-[30px] flex items-center justify-center shadow-2xl shadow-purple-500/30 mb-8 transform rotate-6">
                <ShieldCheck size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 text-center">به تهرانک خوش آمدید</h1>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs leading-7 mb-10">
                برای ارائه بهترین تجربه هوشمند، مدیریت املاک و دستیار صوتی، نیاز به دسترسی‌های زیر داریم. اطلاعات شما کاملا امن است.
            </p>
            <button 
                onClick={() => setStep(1)}
                className="w-full max-w-xs py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
                <span>شروع تنظیمات</span>
                <ChevronLeft className="rotate-180" />
            </button>
        </div>
      )
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-[#0F172A] flex flex-col p-6 animate-slide-up font-['Vazirmatn'] overflow-y-auto">
      <div className="flex-1 max-w-md mx-auto w-full pt-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center">دسترسی‌ها</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">برای فعال‌سازی قابلیت‌ها روی گزینه‌ها بزنید</p>

          <div className="space-y-3">
              <PermissionItem 
                icon={<MapPin size={24}/>}
                title="موقعیت مکانی"
                desc="برای ثبت لوکیشن دقیق املاک روی نقشه"
                isGranted={permissions.location}
                onClick={requestLocation}
                color="bg-green-500"
              />
              <PermissionItem 
                icon={<Camera size={24}/>}
                title="دوربین"
                desc="برای عکس‌برداری از املاک و مدارک"
                isGranted={permissions.camera}
                onClick={() => requestMedia('camera')}
                color="bg-blue-500"
              />
               <PermissionItem 
                icon={<Mic size={24}/>}
                title="میکروفون"
                desc="برای صحبت با دستیار هوشمند و جستجوی صوتی"
                isGranted={permissions.microphone}
                onClick={() => requestMedia('microphone')}
                color="bg-red-500"
              />
               <PermissionItem 
                icon={<Bell size={24}/>}
                title="اعلان‌ها"
                desc="برای یادآوری قرارهای ملاقات و وظایف"
                isGranted={permissions.notification}
                onClick={requestNotification}
                color="bg-yellow-500"
              />
          </div>
      </div>

      <div className="mt-6 max-w-md mx-auto w-full pb-4">
          <button 
            onClick={onComplete}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                Object.values(permissions).every(Boolean) 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/30' 
                : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
            }`}
          >
              <span>{Object.values(permissions).every(Boolean) ? 'تکمیل و ورود' : 'ورود به برنامه'}</span>
              {Object.values(permissions).every(Boolean) && <CheckCircle2 />}
          </button>
          {!Object.values(permissions).every(Boolean) && (
              <button onClick={onComplete} className="w-full py-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-2">
                  رد کردن فعلی (می‌توانید بعداً در تنظیمات فعال کنید)
              </button>
          )}
      </div>
    </div>
  );
};

const PermissionItem = ({ icon, title, desc, isGranted, onClick, color }: any) => (
    <button 
        onClick={onClick}
        disabled={isGranted}
        className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 text-right ${
            isGranted 
            ? 'bg-green-50 dark:bg-green-900/10 border-green-500/30' 
            : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 shadow-sm hover:scale-[1.02] active:scale-95'
        }`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${isGranted ? 'bg-green-500' : color}`}>
            {isGranted ? <CheckCircle2 size={24}/> : icon}
        </div>
        <div className="flex-1">
            <h3 className={`font-bold text-sm ${isGranted ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                {title} {isGranted && '(تایید شد)'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{desc}</p>
        </div>
    </button>
);
