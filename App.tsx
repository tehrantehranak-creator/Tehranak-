
import React, { useState, useEffect } from 'react';
import { NavTab, Property, Client, Commission, Task, SearchFilters, TaskType, SavedSearch, User, AppContext, AppNotification } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { StatCard } from './components/StatCard';
import { DynamicIsland } from './components/DynamicIsland';
import { ResidentialForm, CommercialForm, ClientForm, CommissionForm, TaskForm } from './components/Forms';
import { PropertyCard, ClientCard } from './components/PropertyCard';
import { PropertyMap } from './components/PropertyMap';
import { PropertyDetail } from './components/PropertyDetail';
import { HomeSlider } from './components/HomeSlider';
import { SettingsModal } from './components/SettingsModal';
import { PermissionModal } from './components/PermissionModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SplashScreen } from './components/SplashScreen';
import { InstallPrompt } from './components/InstallPrompt';
import { Users, Home as HomeIcon, DollarSign, ClipboardList, X, Filter, Edit, Trash, CheckCircle2, Circle, Map as MapIcon, List, Search, Mic, Save, Bookmark } from 'lucide-react';
import { fetchData, saveProperty, saveClient, saveTask, saveCommission, deletePropertyWithImages, deleteClient, deleteTask, deleteCommission, updateSystemSetting, getUsers, updateLiveLocation } from './services/dataService';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.HOME);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showSettings, setShowSettings] = useState(false);

  // --- Local Auth (Simulated for Admin Panel features) ---
  // In local mode, we default to Admin. In a real app, this would come from login.
  const [currentUser, setCurrentUser] = useState<User>({
      id: 'admin-1',
      name: 'مدیر سیستم',
      username: 'admin',
      role: 'admin'
  });
  const [users, setUsers] = useState<User[]>([]);

  // First Run
  const [isFirstRun, setIsFirstRun] = useState(!localStorage.getItem('app_setup_completed'));

  // --- Data State ---
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // --- UI States ---
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [propertyViewMode, setPropertyViewMode] = useState<'list' | 'map'>('list');
  const [addType, setAddType] = useState<'res'|'com'|'client'|'comm'|'task'|null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ query: '' });
  const [instantResults, setInstantResults] = useState<Property[]>([]);
  const [searchTargets, setSearchTargets] = useState({ residential: true, commercial: true, clients: true });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; title: string; message: string; idToDelete: string | null; type: 'property' | 'client' | 'task' | 'commission'; }>({ isOpen: false, title: '', message: '', idToDelete: null, type: 'property' });
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  
  // Saved Searches State
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // --- Data Loading ---
  useEffect(() => {
      loadData();
      const saved = localStorage.getItem('saved_searches');
      if (saved) setSavedSearches(JSON.parse(saved));
  }, []);

  const loadData = async () => {
      const data = await fetchData();
      setProperties(data.properties);
      setClients(data.clients);
      setTasks(data.tasks);
      setCommissions(data.commissions);
      
      const usersList = await getUsers();
      setUsers(usersList);
      
      // Check Reminders
      checkReminders(data.tasks, data.clients);
  };

  // --- Live Location Tracking ---
  useEffect(() => {
      // Simulate Live Tracking: Update current user's location every 60 seconds
      if ('geolocation' in navigator) {
          const interval = setInterval(() => {
              navigator.geolocation.getCurrentPosition(pos => {
                  updateLiveLocation(currentUser.id, pos.coords.latitude, pos.coords.longitude);
                  // Refresh users list to see updates
                  getUsers().then(setUsers);
              }, err => console.log("Location access denied/error"));
          }, 60000); // 1 minute
          return () => clearInterval(interval);
      }
  }, [currentUser.id]);

  const checkReminders = (taskList: Task[], clientList: Client[]) => {
      // Simple reminder checker logic
      const now = new Date();
      const today = now.toLocaleDateString('fa-IR');
      const currentTime = now.toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'});
      
      const dueTasks = taskList.filter(t => t.date === today && t.time === currentTime && !t.isCompleted);
      if(dueTasks.length > 0) {
          setAppNotifications(prev => [...prev, {
              id: Date.now().toString(),
              title: 'یادآوری وظیفه',
              body: `زمان انجام وظیفه: ${dueTasks[0].title}`,
              time: currentTime,
              isRead: false
          }]);
      }
  };

  // Apply Theme
  useEffect(() => {
      const root = document.documentElement;
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      localStorage.setItem('theme', theme);
  }, [theme]);

  // Instant Search
  useEffect(() => {
    if (!filters.query || filters.query.length < 2) {
        setInstantResults([]);
        return;
    }
    const q = filters.query.toLowerCase();
    const matchedProps = properties.filter(p => {
        const isRes = p.category === 'residential' && searchTargets.residential;
        const isCom = p.category === 'commercial' && searchTargets.commercial;
        if (!isRes && !isCom) return false;
        return (p.title || '').toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q);
    }).slice(0, 4);
    setInstantResults(matchedProps);
  }, [filters.query, properties, searchTargets]);

  // --- Handlers ---

  const handleLogout = () => {
      // Local mode doesn't really logout, just close settings
      setShowSettings(false);
  };

  const handleDelete = (id: string, type: 'property' | 'client' | 'task' | 'commission') => {
      let title = '', message = '';
      switch(type) {
          case 'property': title = 'حذف آگهی'; message = 'آیا از حذف این ملک و تصاویر آن اطمینان دارید؟ (غیرقابل بازگشت)'; break;
          case 'client': title = 'حذف مشتری'; message = 'پرونده مشتری حذف خواهد شد.'; break;
          case 'task': title = 'حذف وظیفه'; message = 'حذف شود؟'; break;
          case 'commission': title = 'حذف کمیسیون'; message = 'اطلاعات پاک شود؟'; break;
      }
      setDeleteModal({ isOpen: true, title, message, idToDelete: id, type });
  };

  const executeDelete = async () => {
      const { idToDelete, type } = deleteModal;
      if (!idToDelete) return;

      if (type === 'property') {
          const prop = properties.find(p => p.id === idToDelete);
          if (prop) await deletePropertyWithImages(prop);
      } else if (type === 'client') {
          await deleteClient(idToDelete);
      } else if (type === 'task') {
          await deleteTask(idToDelete);
      } else if (type === 'commission') {
          await deleteCommission(idToDelete);
      }
      
      loadData();
      if (selectedProperty?.id === idToDelete) setSelectedProperty(null);
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveProperty = async (data: Partial<Property>) => {
      await saveProperty({ ...data, id: editingItem?.id });
      loadData();
      setAddType(null); setEditingItem(null); setActiveTab(NavTab.PROPERTIES);
  };

  const handleSaveClient = async (data: Partial<Client>) => {
      await saveClient({ ...data, id: editingItem?.id });
      loadData();
      setAddType(null); setEditingItem(null); setActiveTab(NavTab.CLIENTS);
  };

  const handleSaveTask = async (data: Partial<Task>) => {
      await saveTask({ ...data, id: editingItem?.id });
      loadData();
      setAddType(null); setEditingItem(null); setActiveTab(NavTab.TASKS);
  };

  const handleSaveCommission = async (data: Partial<Commission>) => {
      await saveCommission({ ...data, id: editingItem?.id });
      loadData();
      setAddType(null); setEditingItem(null); setActiveTab(NavTab.COMMISSION);
  };

  const toggleCommissionPaid = async (id: string) => {
      const comm = commissions.find(c => c.id === id);
      if (comm) {
          await saveCommission({ ...comm, isPaid: !comm.isPaid });
          loadData();
      }
  };

  const handleEdit = (item: any, type: any) => { setEditingItem(item); setAddType(type); };

  // --- Search Features ---
  const handleVoiceSearch = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert('مرورگر شما از جستجوی صوتی پشتیبانی نمی‌کند.');
          return;
      }
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onend = () => setIsVoiceListening(false);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setFilters({ ...filters, query: transcript });
      };
      recognition.start();
  };

  const handleSaveSearch = () => {
      const title = prompt("نامی برای این جستجو انتخاب کنید:");
      if (title) {
          const newSaved = [...savedSearches, { id: Date.now().toString(), title, filters }];
          setSavedSearches(newSaved);
          localStorage.setItem('saved_searches', JSON.stringify(newSaved));
      }
  };

  const handleApplySavedSearch = (saved: SavedSearch) => {
      setFilters(saved.filters);
  };

  const deleteSavedSearch = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSaved = savedSearches.filter(s => s.id !== id);
      setSavedSearches(newSaved);
      localStorage.setItem('saved_searches', JSON.stringify(newSaved));
  };

  // --- Render Functions ---
  const renderHome = () => (
      <div className="space-y-6 animate-slide-up pb-20">
        <HomeSlider properties={properties} onSelectProperty={setSelectedProperty} />
        <InstallPrompt />
        <div className="grid grid-cols-2 gap-4 px-4">
          <StatCard title="کل املاک" value={properties.length} subValue="فایل" icon={<HomeIcon />} colorClass="bg-blue-500 text-blue-600" />
          <StatCard title="مشتریان" value={clients.length} subValue="فعال" icon={<Users />} colorClass="bg-purple-500 text-purple-600" />
          <StatCard title="وظایف" value={tasks.filter(t => !t.isCompleted).length} subValue="انجام نشده" icon={<ClipboardList />} colorClass="bg-orange-500 text-orange-600" />
          <StatCard title="درآمد" value={`${(commissions.filter(c => c.isPaid).reduce((acc, c) => acc + c.agentShare, 0) / 1000000).toFixed(0)}M`} subValue="تومان" icon={<DollarSign />} colorClass="bg-emerald-500 text-emerald-600" />
        </div>
      </div>
  );

  const renderProperties = () => {
      let filtered = properties;
      if (filters.query) {
          const q = filters.query.toLowerCase();
          filtered = filtered.filter(p => (p.title||'').toLowerCase().includes(q) || (p.address||'').toLowerCase().includes(q));
      }

      return (
        <div className="h-full flex flex-col relative pb-20 animate-slide-up">
             <div className="sticky top-[88px] z-30 bg-slate-50/95 dark:bg-[#0F172A]/95 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-white/5 max-w-lg mx-auto w-full">
                <div className="flex gap-2">
                     <button onClick={() => setPropertyViewMode('list')} className={`p-2 rounded-xl ${propertyViewMode==='list'?'bg-white shadow text-purple-600':''}`}><List size={20}/></button>
                     <button onClick={() => setPropertyViewMode('map')} className={`p-2 rounded-xl ${propertyViewMode==='map'?'bg-white shadow text-purple-600':''}`}><MapIcon size={20}/></button>
                </div>
                <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 bg-gray-200 dark:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-white">
                    <Filter size={16} /> فیلترها
                </button>
             </div>
             <div className="flex-1 overflow-hidden relative">
                 {propertyViewMode === 'list' ? (
                     <div className="p-4 space-y-4">
                         {filtered.map(p => (
                             <PropertyCard key={p.id} property={p} onDelete={() => handleDelete(p.id, 'property')} onEdit={() => handleEdit(p, p.category==='residential'?'res':'com')} onClick={() => setSelectedProperty(p)} />
                         ))}
                         {filtered.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">موردی یافت نشد</p>}
                     </div>
                 ) : (
                     <div className="w-full h-full absolute inset-0"><PropertyMap properties={filtered} /></div>
                 )}
             </div>
        </div>
      );
  };

  const renderTasks = () => {
      const allTasks = tasks.filter(t => showCompletedTasks ? true : !t.isCompleted);
      return (
          <div className="p-4 pb-20 space-y-3 animate-slide-up">
              <div className="flex justify-end"><button onClick={() => setShowCompletedTasks(!showCompletedTasks)} className="text-xs text-gray-500 flex items-center gap-2">{showCompletedTasks ? <CheckCircle2 size={14}/> : <Circle size={14}/>} نمایش انجام شده‌ها</button></div>
              {allTasks.map(t => (
                  <div key={t.id} className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <button 
                        onClick={async () => { await saveTask({...t, isCompleted: !t.isCompleted}); loadData(); }} 
                        className={`w-5 h-5 rounded-full border ${t.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                      ></button>
                      <div className="flex-1">
                          <h4 className={`font-bold text-sm text-slate-800 dark:text-white ${t.isCompleted ? 'line-through text-gray-400' : ''}`}>{t.title}</h4>
                          <span className="text-xs text-gray-400">{t.date} {t.time}</span>
                      </div>
                      <button onClick={() => handleEdit(t, 'task')} className="text-blue-500 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><Edit size={14}/></button>
                      <button onClick={() => handleDelete(t.id, 'task')} className="text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><Trash size={14}/></button>
                  </div>
              ))}
              {allTasks.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">وظیفه‌ای ندارید</p>}
          </div>
      );
  };

  const renderClients = () => (
      <div className="p-4 space-y-4 pb-20 animate-slide-up">
          {clients.map(c => <ClientCard key={c.id} client={c} onDelete={() => handleDelete(c.id, 'client')} onEdit={() => handleEdit(c, 'client')} />)}
          {clients.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">مشتری ثبت نشده است</p>}
      </div>
  );

  const renderCommission = () => {
      const totalIncome = commissions.filter(c => c.isPaid).reduce((acc, c) => acc + c.agentShare, 0);
      const pendingIncome = commissions.filter(c => !c.isPaid).reduce((acc, c) => acc + c.agentShare, 0);
      const dealsCount = commissions.length;
      const avgShare = dealsCount > 0 ? (totalIncome + pendingIncome) / dealsCount : 0;

      return (
        <div className="p-4 space-y-4 pb-20 animate-slide-up">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <span className="text-xs opacity-80 block">درآمد وصول شده</span>
                    <span className="text-lg font-bold block mt-1">{(totalIncome/1000000).toFixed(1)} M <span className="text-[10px]">تومان</span></span>
                </div>
                <div className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg shadow-orange-500/20">
                    <span className="text-xs opacity-80 block">در انتظار وصول</span>
                    <span className="text-lg font-bold block mt-1">{(pendingIncome/1000000).toFixed(1)} M <span className="text-[10px]">تومان</span></span>
                </div>
                <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                    <span className="text-xs text-gray-500 block">تعداد قرارداد</span>
                    <span className="font-bold text-slate-800 dark:text-white">{dealsCount}</span>
                </div>
                <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                    <span className="text-xs text-gray-500 block">میانگین سهم</span>
                    <span className="font-bold text-slate-800 dark:text-white">{(avgShare/1000000).toFixed(1)} M</span>
                </div>
            </div>

            {commissions.map(c => (
                <div key={c.id} className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{c.buyerName}</h4> 
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(c, 'comm')} className="text-blue-500"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(c.id, 'commission')} className="text-red-500"><Trash size={16}/></button>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>کمیسیون کل: {c.totalCommission.toLocaleString()}</span> 
                        <button onClick={() => toggleCommissionPaid(c.id)} className={`flex items-center gap-1 ${c.isPaid?'text-green-500':'text-orange-500'}`}>
                            {c.isPaid ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                            {c.isPaid?'پرداخت شده':'معوق'}
                        </button>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-center">
                        سهم مشاور: {c.agentShare.toLocaleString()} تومان
                    </div>
                </div>
            ))}
            {commissions.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">کمیسیونی ثبت نشده است</p>}
        </div>
      );
  };

  if (isFirstRun) return <PermissionModal onComplete={() => { localStorage.setItem('app_setup_completed', 'true'); setIsFirstRun(false); }} />;
  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 font-['Vazirmatn'] text-slate-800 dark:text-slate-200 ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-slate-50'} overflow-x-hidden w-full max-w-lg mx-auto shadow-2xl`}>
        
        {showSearch && (
            <div className="fixed inset-0 z-50 bg-white dark:bg-[#0F172A] animate-slide-up max-w-lg mx-auto left-0 right-0 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">جستجو پیشرفته</h2>
                    <button onClick={() => setShowSearch(false)}><X className="text-gray-400"/></button>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="جستجو (محله، نام، امکانات...)" 
                            value={filters.query}
                            onChange={(e) => setFilters({...filters, query: e.target.value})}
                            className="w-full p-4 pl-12 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-white outline-none"
                        />
                        <button onClick={handleVoiceSearch} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isVoiceListening ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                            <Mic size={20} />
                        </button>
                    </div>
                    
                    {/* Saved Searches */}
                    {savedSearches.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {savedSearches.map(s => (
                                <div key={s.id} onClick={() => handleApplySavedSearch(s)} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-xl border border-purple-100 dark:border-purple-500/30 flex-shrink-0 cursor-pointer">
                                    <Bookmark size={14} className="text-purple-500"/>
                                    <span className="text-xs text-purple-700 dark:text-purple-300">{s.title}</span>
                                    <button onClick={(e) => deleteSavedSearch(s.id, e)} className="text-purple-400 hover:text-red-500"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={handleSaveSearch} className="text-xs text-blue-500 flex items-center gap-1 mb-2">
                        <Save size={14} /> ذخیره جستجوی فعلی
                    </button>
                    
                    {instantResults.length > 0 && (
                        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                            {instantResults.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => { setSelectedProperty(p); setShowSearch(false); }}
                                    className="p-3 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center cursor-pointer"
                                >
                                    <span className="text-sm font-bold text-slate-700 dark:text-white">{p.title}</span>
                                    <span className="text-xs text-gray-500">{p.category === 'residential' ? 'مسکونی' : 'تجاری'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={() => setSearchTargets({...searchTargets, residential: !searchTargets.residential})} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${searchTargets.residential ? 'bg-purple-500 text-white border-purple-500' : 'bg-transparent border-gray-300 text-gray-500'}`}>مسکونی</button>
                        <button onClick={() => setSearchTargets({...searchTargets, commercial: !searchTargets.commercial})} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${searchTargets.commercial ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent border-gray-300 text-gray-500'}`}>تجاری</button>
                        <button onClick={() => setSearchTargets({...searchTargets, clients: !searchTargets.clients})} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${searchTargets.clients ? 'bg-orange-500 text-white border-orange-500' : 'bg-transparent border-gray-300 text-gray-500'}`}>مشتریان</button>
                    </div>
                </div>
            </div>
        )}
        
        {selectedProperty && <PropertyDetail property={selectedProperty} onBack={() => setSelectedProperty(null)} onEdit={(p) => handleEdit(p, p.category==='residential'?'res':'com')} onDelete={(id) => handleDelete(id, 'property')} />}

        <DynamicIsland isExpandedMode={activeTab === NavTab.HOME} appContext={{properties, clients, tasks, currentUser: null}} alexaEnabled={localStorage.getItem('alexaEnabled')==='true'} notifications={appNotifications} onClearNotifications={() => setAppNotifications([])} />

        <Header title={activeTab === NavTab.HOME ? `سلام ${currentUser?.name || 'همکار'}` : 'تهرانک'} onSearchClick={() => setShowSearch(true)} onSettingsClick={() => setShowSettings(true)} />

        <main className="pt-4 w-full">
            {activeTab === NavTab.HOME && renderHome()}
            {activeTab === NavTab.PROPERTIES && renderProperties()}
            {activeTab === NavTab.CLIENTS && renderClients()}
            {activeTab === NavTab.TASKS && renderTasks()}
            {activeTab === NavTab.COMMISSION && renderCommission()}
            {activeTab === NavTab.ADD && (
                <div className="grid grid-cols-2 gap-4 p-6">
                    <button onClick={() => setAddType('res')} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-lg flex flex-col items-center"><HomeIcon size={32} className="text-purple-500"/><span className="font-bold mt-2 text-slate-700 dark:text-white">مسکونی</span></button>
                    <button onClick={() => setAddType('com')} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-lg flex flex-col items-center"><DollarSign size={32} className="text-blue-500"/><span className="font-bold mt-2 text-slate-700 dark:text-white">تجاری</span></button>
                    <button onClick={() => setAddType('client')} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-lg flex flex-col items-center"><Users size={32} className="text-orange-500"/><span className="font-bold mt-2 text-slate-700 dark:text-white">مشتری</span></button>
                    <button onClick={() => setAddType('task')} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-lg flex flex-col items-center"><ClipboardList size={32} className="text-pink-500"/><span className="font-bold mt-2 text-slate-700 dark:text-white">وظیفه</span></button>
                    <button onClick={() => setAddType('comm')} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-lg flex flex-col items-center col-span-2"><DollarSign size={32} className="text-emerald-500"/><span className="font-bold mt-2 text-slate-700 dark:text-white">ثبت کمیسیون</span></button>
                </div>
            )}
        </main>

        {addType && (
            <div className="fixed inset-0 z-50 bg-white dark:bg-[#0F172A] overflow-y-auto max-w-lg mx-auto left-0 right-0">
                {addType === 'res' && <ResidentialForm onSubmit={handleSaveProperty} onCancel={() => setAddType(null)} initialData={editingItem} />}
                {addType === 'com' && <CommercialForm onSubmit={handleSaveProperty} onCancel={() => setAddType(null)} initialData={editingItem} />}
                {addType === 'client' && <ClientForm onSubmit={handleSaveClient} onCancel={() => setAddType(null)} initialData={editingItem} />}
                {addType === 'task' && <TaskForm onSubmit={handleSaveTask} onCancel={() => setAddType(null)} initialData={editingItem} />}
                {addType === 'comm' && <CommissionForm onSubmit={handleSaveCommission} onCancel={() => setAddType(null)} initialData={editingItem} />}
            </div>
        )}

        {!addType && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
        
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} theme={theme} setTheme={setTheme} users={users} setUsers={setUsers} currentUser={currentUser} onLogout={handleLogout} />
        
        <ConfirmModal isOpen={deleteModal.isOpen} title={deleteModal.title} message={deleteModal.message} onConfirm={executeDelete} onCancel={() => setDeleteModal(prev => ({...prev, isOpen: false}))} />
    </div>
  );
};

export default App;
