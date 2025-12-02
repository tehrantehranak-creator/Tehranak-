

import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Shield, LogOut, MapPin, Trash, Key, Save, Upload, Download, Bell, CheckCircle2, ToggleLeft, ToggleRight, UserPlus, Users, Wand2, RefreshCcw } from 'lucide-react';
import { User, AIKeyConfig, AIModelType } from '../types';
import { updateSystemSetting, getSystemSettings, saveUser, deleteUser } from '../services/dataService';
import { validateApiKey } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  users: User[]; 
  setUsers: (users: User[]) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, setTheme, users, setUsers, currentUser, onLogout }) => {
  const [textApiKey, setTextApiKey] = useState('');
  const [imageApiKey, setImageApiKey] = useState('');
  
  const [textAIConfig, setTextAIConfig] = useState<AIKeyConfig | null>(null);
  const [imageAIConfig, setImageAIConfig] = useState<AIKeyConfig | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [alexaEnabled, setAlexaEnabled] = useState(localStorage.getItem('alexaEnabled') === 'true');
  const [alexaSpeaks, setAlexaSpeaks] = useState(localStorage.getItem('alexaSpeaksNotifications') === 'true');
  const [notifyProperties, setNotifyProperties] = useState(localStorage.getItem('notifyProperties') !== 'false');
  const [notifyReminders, setNotifyReminders] = useState(localStorage.getItem('notifyReminders') !== 'false');

  // User Management State
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'secretary' });
  const [showUserForm, setShowUserForm] = useState(false);

  useEffect(() => {
      if (currentUser?.role === 'admin') {
          setIsAdmin(true);
          loadSystemSettings();
      }
  }, [currentUser]);

  const loadSystemSettings = async () => {
      const settings = await getSystemSettings();
      setTextAIConfig(settings['gemini_text_config'] || { apiKey: '', model: '', isValid: false, error: null });
      setImageAIConfig(settings['gemini_image_config'] || { apiKey: '', model: '', isValid: false, error: null });
      setTextApiKey(settings['gemini_text_config']?.apiKey || '');
      setImageApiKey(settings['gemini_image_config']?.apiKey || '');
  };

  // --- API Key Handlers ---
  const handleSaveTextApiKey = async () => {
      const trimmedKey = textApiKey.trim();
      const validationResult = await validateApiKey(trimmedKey, AIModelType.TEXT_CHAT);
      
      const newConfig: AIKeyConfig = {
          apiKey: trimmedKey,
          model: validationResult.model || '',
          isValid: validationResult.isValid,
          error: validationResult.error,
      };
      setTextAIConfig(newConfig);
      await updateSystemSetting('gemini_text_config', newConfig);
      if (validationResult.isValid) alert("کلید API متن با موفقیت ذخیره و تست شد.");
      else alert(`خطا در تست کلید API متن: ${validationResult.error}`);
  };

  const handleSaveImageApiKey = async () => {
    const trimmedKey = imageApiKey.trim();
    if (!trimmedKey) {
        alert("لطفا کلید API تصویر را وارد کنید.");
        return;
    }

    // --- AI Studio API Key Selection Check (for higher-tier image models) ---
    let hasPaidKeySelected = false;
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        try {
            hasPaidKeySelected = await window.aistudio.hasSelectedApiKey();
            if (!hasPaidKeySelected) {
                const confirmOpen = confirm("برای استفاده از مدل‌های باکیفیت تصویر (مثلاً Gemini 3 Pro Image) نیاز به انتخاب کلید API پولی از حساب ابری گوگل دارید. آیا مایلید پنجره انتخاب کلید باز شود؟");
                if (confirmOpen) {
                    await window.aistudio.openSelectKey();
                    // Assume success for race condition mitigation
                    hasPaidKeySelected = true; 
                    // Re-fetch key from env after selection, or proceed with manual input
                    // For now, we trust the manual input and re-validate.
                } else {
                    alert("بدون انتخاب کلید API پولی، ممکن است برخی قابلیت‌های تصویری هوشمند با محدودیت یا خطای دسترسی مواجه شوند.");
                }
            }
        } catch (e: any) {
            console.error("Error with AI Studio API key selection:", e);
            alert(`خطا در بررسی وضعیت کلید AI Studio: ${e.message}. لطفا کلید را دستی وارد کنید یا مطمئن شوید که مرورگر دسترسی دارد.`);
        }
    }

    const validationResult = await validateApiKey(trimmedKey, AIModelType.VIRTUAL_STAGING); // Use staging for image validation
    
    const newConfig: AIKeyConfig = {
        apiKey: trimmedKey,
        model: validationResult.model || '',
        isValid: validationResult.isValid,
        error: validationResult.error,
    };
    setImageAIConfig(newConfig);
    await updateSystemSetting('gemini_image_config', newConfig);
    if (validationResult.isValid) alert("کلید API تصویر با موفقیت ذخیره و تست شد.");
    else alert(`خطا در تست کلید API تصویر: ${validationResult.error}`);
  };


  const handleClearCache = async () => {
      if (confirm("آیا مطمئن هستید؟ این کار کش محلی را پاک می‌کند.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleAddUser = async () => {
      if (!newUser.name || !newUser.username) {
          alert("لطفا نام و نام کاربری را وارد کنید");
          return;
      }
      const updatedUsers = await saveUser(newUser as User);
      setUsers(updatedUsers);
      setNewUser({ name: '', username: '', role: 'secretary' });
      setShowUserForm(false);
      alert("کاربر با موفقیت اضافه شد");
  };

  const handleDeleteUser = async (id: string) => {
      if (confirm("آیا از حذف این کاربر اطمینان دارید؟")) {
          const updatedUsers = await deleteUser(id);
          setUsers(updatedUsers);
      }
  };

  const toggleAlexa = () => {
      const newState = !alexaEnabled;
      setAlexaEnabled(newState);
      localStorage.setItem('alexaEnabled', String(newState));
  };

  const toggleAlexaSpeaks = () => {
      const newState = !alexaSpeaks;
      setAlexaSpeaks(newState);
      localStorage.setItem('alexaSpeaksNotifications', String(newState));
  };

  const toggleNotifyProperties = () => {
      const newState = !notifyProperties;
      setNotifyProperties(newState);
      localStorage.setItem('notifyProperties', String(newState));
  };

  const toggleNotifyReminders = () => {
      const newState = !notifyReminders;
      setNotifyReminders(newState);
      localStorage.setItem('notifyReminders', String(newState));
  };

  const handleBackup = () => {
      const data = {
          properties: localStorage.getItem(STORAGE_KEYS.PROPERTIES),
          clients: localStorage.getItem(STORAGE_KEYS.CLIENTS),
          tasks: localStorage.getItem(STORAGE_KEYS.TASKS),
          commissions: localStorage.getItem(STORAGE_KEYS.COMMISSIONS),
          saved_searches: localStorage.getItem('saved_searches'),
          users: localStorage.getItem(STORAGE_KEYS.USERS),
          settings: localStorage.getItem(STORAGE_KEYS.SETTINGS), // Include settings
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tehranak-backup-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              // Iteratively restore each item
              for (const key of Object.values(STORAGE_KEYS)) {
                  if (data[key]) localStorage.setItem(key, data[key]);
              }
              // Special handling for saved_searches if its key is different
              if (data.saved_searches) localStorage.setItem('saved_searches', data.saved_searches);

              alert("اطلاعات با موفقیت بازیابی شد.");
              window.location.reload();
          } catch (err) {
              alert("فایل نامعتبر است.");
          }
      };
      reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center font-['Vazirmatn']">
        <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-t-[30px] h-[90%] overflow-y-auto p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">تنظیمات سیستم</h2>
                <button onClick={onClose}><X className="text-gray-400"/></button>
            </div>

            {/* Theme */}
            <section className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 mb-3">ظاهر</h3>
                <div className="flex gap-3">
                    <button onClick={() => setTheme('light')} className={`flex-1 py-3 rounded-xl border font-bold text-xs ${theme==='light'?'bg-blue-50 border-blue-500 text-blue-600':'border-gray-200 dark:border-white/10 text-gray-500'}`}><Sun className="mx-auto mb-1"/> روشن</button>
                    <button onClick={() => setTheme('dark')} className={`flex-1 py-3 rounded-xl border font-bold text-xs ${theme==='dark'?'bg-slate-700 border-slate-500 text-white':'border-gray-200 dark:border-white/10 text-gray-500'}`}><Moon className="mx-auto mb-1"/> تیره</button>
                </div>
            </section>

            {/* Notifications */}
            <section className="mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2"><Bell size={14}/> تنظیمات اعلان‌ها</h3>
                <ToggleItem label="اعلان ملک جدید" isOn={notifyProperties} onToggle={toggleNotifyProperties} />
                <ToggleItem label="یادآوری وظایف و مشتریان" isOn={notifyReminders} onToggle={toggleNotifyReminders} />
            </section>

            {/* Alexa Settings */}
            <section className="mb-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 rounded-2xl border border-purple-500/20">
                <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-3">دستیار هوشمند (الکسا)</h3>
                <ToggleItem label="فعال‌سازی الکسا" isOn={alexaEnabled} onToggle={toggleAlexa} />
                <ToggleItem label="خواندن صوتی اعلان‌ها" isOn={alexaSpeaks} onToggle={toggleAlexaSpeaks} />
            </section>

            {/* Backup & Restore */}
            <section className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 mb-3">پشتیبان‌گیری و بازیابی</h3>
                <div className="flex gap-3">
                    <button onClick={handleBackup} className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Download size={16}/> دانلود فایل پشتیبان
                    </button>
                    <label className="flex-1 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                        <Upload size={16}/> بازیابی اطلاعات
                        <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                </div>
            </section>

            {/* ADMIN ONLY SECTIONS */}
            {isAdmin && (
                <>
                    <div className="my-4 border-t border-dashed border-gray-300 dark:border-white/10"></div>
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded mb-4 inline-block">پنل مدیریت</span>

                    {/* User Management */}
                    <section className="mb-6">
                        <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2"><Users size={16}/> مدیریت کاربران و پرسنل</div>
                            <button onClick={() => setShowUserForm(!showUserForm)} className="text-blue-500 text-[10px] bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded flex items-center gap-1">
                                <UserPlus size={12}/> افزودن
                            </button>
                        </h3>

                        {showUserForm && (
                            <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-xl mb-3 animate-slide-up border border-gray-200 dark:border-white/10">
                                <input 
                                    type="text" 
                                    placeholder="نام کامل (مثلا: علی رضایی)" 
                                    className="w-full p-2 rounded-lg text-xs mb-2 bg-white dark:bg-black/20 outline-none text-slate-800 dark:text-white"
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                />
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="نام کاربری" 
                                        className="flex-1 p-2 rounded-lg text-xs bg-white dark:bg-black/20 outline-none text-slate-800 dark:text-white"
                                        value={newUser.username}
                                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                                    />
                                    <select 
                                        className="flex-1 p-2 rounded-lg text-xs bg-white dark:bg-black/20 outline-none text-slate-800 dark:text-white"
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                    >
                                        <option value="secretary">منشی</option>
                                        <option value="admin">مدیر</option>
                                    </select>
                                </div>
                                <button onClick={handleAddUser} className="w-full py-2 bg-green-500 text-white rounded-lg text-xs font-bold">ثبت کاربر جدید</button>
                            </div>
                        )}

                        <div className="space-y-2">
                            {users.map(u => (
                                <div key={u.id} className="flex justify-between items-center bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${u.role === 'admin' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold block text-slate-800 dark:text-white">{u.name}</span>
                                            <span className="text-[10px] text-gray-500">{u.role === 'admin' ? 'مدیر سیستم' : 'منشی / کارمند'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {u.lat && u.lng ? (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${u.lat},${u.lng}`} target="_blank" className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-100 transition-colors">
                                                <MapPin size={12}/> نقشه
                                            </a>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 px-2">موقعیت نامشخص</span>
                                        )}
                                        {u.id !== currentUser?.id && (
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg hover:bg-red-100">
                                                <Trash size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* AI API Key Management */}
                    <section className="mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-white mb-2 flex items-center gap-2"><Wand2 size={16}/> کلیدهای API هوش مصنوعی</h3>
                        
                        {/* Text AI Key */}
                        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1"><Key size={14}/> برای گفتگو (متن)</h4>
                            <input 
                                type="password" 
                                value={textApiKey} 
                                onChange={e => setTextApiKey(e.target.value)} 
                                className="w-full p-2 rounded-lg text-xs bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 mb-2 dir-ltr"
                                placeholder="sk-..."
                            />
                            <button onClick={handleSaveTextApiKey} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                <RefreshCcw size={14}/> ذخیره و تست کلید متن
                            </button>
                            {textAIConfig && (
                                <div className={`text-[10px] mt-2 p-2 rounded-lg ${textAIConfig.isValid ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                    وضعیت: {textAIConfig.isValid ? 'معتبر ✅' : `نامعتبر ❌: ${textAIConfig.error}`}<br/>
                                    مدل استفاده شده: {textAIConfig.model}
                                </div>
                            )}
                        </div>

                        {/* Image AI Key */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1"><Wand2 size={14}/> برای تصویر (چیدمان و ادیت)</h4>
                            <input 
                                type="password" 
                                value={imageApiKey} 
                                onChange={e => setImageApiKey(e.target.value)} 
                                className="w-full p-2 rounded-lg text-xs bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 mb-2 dir-ltr"
                                placeholder="sk-..."
                            />
                            <button onClick={handleSaveImageApiKey} className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                <RefreshCcw size={14}/> ذخیره و تست کلید تصویر
                            </button>
                            {imageAIConfig && (
                                <div className={`text-[10px] mt-2 p-2 rounded-lg ${imageAIConfig.isValid ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                    وضعیت: {imageAIConfig.isValid ? 'معتبر ✅' : `نامعتبر ❌: ${imageAIConfig.error}`}<br/>
                                    مدل استفاده شده: {imageAIConfig.model}
                                </div>
                            )}
                             <p className="text-[10px] text-gray-500 mt-2">
                                برای مدل‌های تصویری پیشرفته (مثل Gemini 3 Pro Image) ممکن است نیاز به کلید API پولی داشته باشید. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-400 underline">اطلاعات بیشتر درباره صورتحساب</a>
                            </p>
                        </div>
                    </section>


                    {/* Cache & Data Management */}
                    <section>
                        <button onClick={handleClearCache} className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                            <Trash size={16}/>
                            پاکسازی کش محلی و ریست برنامه
                        </button>
                    </section>
                </>
            )}

            <div className="my-4 border-t border-gray-200 dark:border-white/10 pt-4">
                <button onClick={onLogout} className="w-full py-3 bg-gray-100 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    <LogOut size={16}/> خروج از حساب
                </button>
            </div>
        </div>
    </div>
  );
};

const ToggleItem: React.FC<{label: string, isOn: boolean, onToggle: () => void}> = ({ label, isOn, onToggle }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/5 last:border-0">
        <span className="text-xs font-bold text-slate-700 dark:text-white">{label}</span>
        <button onClick={onToggle} className={`transition-colors ${isOn ? 'text-green-500' : 'text-gray-400'}`}>
            {isOn ? <ToggleRight size={28} fill="currentColor" /> : <ToggleLeft size={28} />}
        </button>
    </div>
);
// --- STORAGE_KEYS for backup/restore (moved from dataService for local access) ---
const STORAGE_KEYS = {
    PROPERTIES: 'properties',
    CLIENTS: 'clients',
    TASKS: 'tasks',
    COMMISSIONS: 'commissions',
    SETTINGS: 'app_settings',
    USERS: 'users_list'
};