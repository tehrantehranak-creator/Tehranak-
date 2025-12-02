
import React, { useState, useEffect, useRef } from 'react';
import { Property, Client, Commission, PropertyType, TransactionType, Reminder, FormProps, Task, TaskType, TaskPriority } from '../types';
import { Camera, Calendar, Check, Upload, X, Plus, Calculator, DollarSign, Clock, ChevronDown, Bell, Sparkles, Image as ImageIcon, MapPin, Loader, Navigation, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Layers, Ruler, Maximize, Zap, ShieldCheck, ChevronUp } from 'lucide-react';
import { suggestTaskSchedule } from '../services/geminiService';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { LocationPicker } from './LocationPicker';
import { compressImage } from '../utils/imageCompressor';
import leaflet from 'leaflet';

// --- Helper Constants ---
const PERSIAN_MONTHS = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];
const YEARS = [1403, 1404, 1405, 1406];

// --- Helper Components ---
const Input = ({ label, icon, onIconClick, ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
    <div className="relative">
        <input {...props} className={`bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-slate-800 dark:text-white text-sm focus:border-purple-500 outline-none transition-all text-right dir-rtl placeholder-gray-400 w-full ${icon ? 'pl-10' : ''}`} />
        {icon && (
            <button type="button" onClick={onIconClick} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors">
                {icon}
            </button>
        )}
    </div>
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
    <div className="relative">
        <select {...props} className="w-full bg-gray-100 dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-slate-800 dark:text-white text-sm focus:border-purple-500 outline-none dir-rtl appearance-none">
            {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
    </div>
  </div>
);

const parsePrice = (value: string) => {
    const raw = value.replace(/\D/g, '');
    return raw ? parseInt(raw, 10) : undefined;
};

const formatPriceDisplay = (value?: number) => {
    return value ? value.toLocaleString() : '';
};

const PersianDateTimePicker = ({ date, time, onDateChange, onTimeChange }: { date: string, time: string, onDateChange: (d: string) => void, onTimeChange: (t: string) => void }) => {
    // Initial state setup
    const getInitialDate = () => {
        if (date) {
            const parts = date.split('/');
            if (parts.length === 3) return { jy: parseInt(parts[0]), jm: parseInt(parts[1]), jd: parseInt(parts[2]) };
        }
        const now = new Date();
        const j = toJalaali(now);
        return j;
    };

    const [currentDate, setCurrentDate] = useState(getInitialDate());
    const [viewMonth, setViewMonth] = useState(currentDate.jm);
    const [viewYear, setViewYear] = useState(currentDate.jy);
    const [localTime, setLocalTime] = useState({ hour: time?.split(':')[0] || '10', minute: time?.split(':')[1] || '00' });

    useEffect(() => {
        if(date) {
             const parts = date.split('/');
             if(parts.length === 3) {
                 setCurrentDate({jy: parseInt(parts[0]), jm: parseInt(parts[1]), jd: parseInt(parts[2])});
             }
        }
    }, [date]);
    
    useEffect(() => {
        if (time) {
             const parts = time.split(':');
             if(parts.length === 2) {
                 setLocalTime({ hour: parts[0], minute: parts[1] });
             }
        }
    }, [time]);

    const daysInMonth = jalaaliMonthLength(viewYear, viewMonth);
    
    const getStartDayOfMonth = () => {
         // Calculate day of week for 1st of the month (Simple algorithm)
         return 0; 
    };
    
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    const handleDayClick = (day: number) => {
        const newDate = `${viewYear}/${viewMonth}/${day}`;
        onDateChange(newDate);
        setCurrentDate({ jy: viewYear, jm: viewMonth, jd: day });
    };

    const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
        let newVal = val.replace(/\D/g, '').slice(0, 2);
        if (type === 'hour') {
            if (parseInt(newVal) > 23) newVal = '23';
            const newTime = `${newVal.padStart(2, '0')}:${localTime.minute}`;
            setLocalTime(prev => ({ ...prev, hour: newVal.padStart(2, '0') }));
            onTimeChange(newTime);
        } else {
            if (parseInt(newVal) > 59) newVal = '59';
            const newTime = `${localTime.hour}:${newVal.padStart(2, '0')}`;
            setLocalTime(prev => ({ ...prev, minute: newVal.padStart(2, '0') }));
            onTimeChange(newTime);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/5 mb-4 animate-fade-in">
            {/* Year/Month Selector */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className="bg-white dark:bg-black/20 rounded-lg p-1 text-xs outline-none text-slate-800 dark:text-white">
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))} className="bg-white dark:bg-black/20 rounded-lg p-1 text-xs outline-none text-slate-800 dark:text-white">
                        {PERSIAN_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                </div>
                <div className="text-xs text-gray-500">
                    {currentDate.jy}/{currentDate.jm}/{currentDate.jd}
                </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => (
                    <span key={d} className="text-[10px] text-gray-400 font-bold">{d}</span>
                ))}
                {days.map(d => (
                    <button 
                        key={d} 
                        onClick={(e) => { e.preventDefault(); handleDayClick(d); }}
                        className={`aspect-square rounded-lg text-xs flex items-center justify-center transition-colors ${
                            currentDate.jd === d && currentDate.jm === viewMonth && currentDate.jy === viewYear
                            ? 'bg-purple-500 text-white shadow-md' 
                            : 'hover:bg-gray-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                        }`}
                    >
                        {d}
                    </button>
                ))}
            </div>

            {/* Time Picker */}
            <div className="flex items-center gap-2 border-t border-gray-200 dark:border-white/10 pt-3">
                <Clock size={16} className="text-gray-400" />
                <span className="text-xs text-gray-500">ساعت:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-black/20 rounded-lg px-2 py-1 border border-gray-200 dark:border-white/10 dir-ltr">
                    <input 
                        type="text" 
                        value={localTime.hour} 
                        onChange={(e) => handleTimeChange('hour', e.target.value)}
                        className="w-6 bg-transparent text-center outline-none font-bold text-slate-800 dark:text-white"
                        placeholder="10"
                    />
                    <span className="text-gray-400">:</span>
                    <input 
                        type="text" 
                        value={localTime.minute} 
                        onChange={(e) => handleTimeChange('minute', e.target.value)}
                        className="w-6 bg-transparent text-center outline-none font-bold text-slate-800 dark:text-white"
                        placeholder="00"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Forms ---

export const ResidentialForm: React.FC<FormProps<Property>> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<Property>>(initialData || {
    category: 'residential',
    type: 'آپارتمان',
    transactionType: 'sale',
    features: [],
    images: [],
    hasElevator: false, hasParking: false, hasStorage: false,
    deedStatus: 'تک‌برگ'
  });
  const [uploading, setUploading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setUploading(true);
        const newImages: string[] = [];
        const files = Array.from(e.target.files) as File[];

        for (const file of files) {
            try {
                // Compress image before adding to state
                const compressedBase64 = await compressImage(file);
                newImages.push(compressedBase64);
            } catch (error) {
                console.error("Compression failed", error);
                // Fallback to original if compression fails (unlikely)
                const reader = new FileReader();
                const base64 = await new Promise<string>(resolve => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                newImages.push(base64);
            }
        }

        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...newImages] }));
        setUploading(false);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleImageUpload(e);
  };

  const handleLocationConfirm = (lat: number, lng: number) => {
      setFormData(prev => ({ ...prev, lat, lng }));
      setShowMapPicker(false);
  };

  if (showMapPicker) {
      return (
          <LocationPicker 
            initialLat={formData.lat} 
            initialLng={formData.lng} 
            onConfirm={handleLocationConfirm} 
            onCancel={() => setShowMapPicker(false)} 
          />
      );
  }

  return (
    <div className="p-6 pb-24 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{initialData ? 'ویرایش ملک مسکونی' : 'ثبت ملک مسکونی'}</h2>
      
      <div className="space-y-4">
          <Select label="۱. نوع ملک" options={[{value: 'آپارتمان', label: 'آپارتمان'}, {value: 'خانه', label: 'خانه'}, {value: 'ویلا', label: 'ویلا'}, {value: 'زمین', label: 'زمین'}]} value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})} />
          <Select label="۲. نوع معامله" options={[{value: 'sale', label: 'فروش'}, {value: 'rent', label: 'رهن و اجاره'}, {value: 'mortgage', label: 'رهن کامل'}, {value: 'presale', label: 'پیش‌فروش'}]} value={formData.transactionType} onChange={(e: any) => setFormData({...formData, transactionType: e.target.value})} />
          <Input label="۳. آدرس دقیق" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} icon={<MapPin size={16}/>} />
          
          {/* Location Map */}
          <div className="flex items-center justify-between bg-gray-100 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
               <div className="flex items-center gap-2">
                   <div className={`p-2 rounded-full ${formData.lat ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                       <Navigation size={18} />
                   </div>
                   <div>
                       <span className="text-xs font-bold block text-slate-700 dark:text-white">موقعیت مکانی (لوکیشن)</span>
                       <span className="text-[10px] text-gray-500 block">{formData.lat ? 'ثبت شده' : 'ثبت نشده'}</span>
                   </div>
               </div>
               <button onClick={() => setShowMapPicker(true)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-2 rounded-lg">
                   {formData.lat ? 'تغییر روی نقشه' : 'انتخاب از نقشه'}
               </button>
          </div>

          <Input label="۴. متراژ (مترمربع)" type="number" value={formData.area} onChange={(e: any) => setFormData({...formData, area: Number(e.target.value)})} icon={<Maximize size={16}/>} />

          <div className="grid grid-cols-3 gap-3">
              <Input label="۵. تعداد خواب" type="number" value={formData.bedrooms} onChange={(e: any) => setFormData({...formData, bedrooms: Number(e.target.value)})} />
              <Input label="۶. طبقه" type="number" value={formData.floor} onChange={(e: any) => setFormData({...formData, floor: Number(e.target.value)})} />
              <Input label="۷. سال ساخت" type="number" value={formData.yearBuilt} onChange={(e: any) => setFormData({...formData, yearBuilt: Number(e.target.value)})} />
          </div>

          <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5">
              <label className="text-xs text-gray-500 block mb-3">امکانات ضروری</label>
              <div className="flex gap-2">
                   <button onClick={() => setFormData({...formData, hasElevator: !formData.hasElevator})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${formData.hasElevator ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}>
                       {formData.hasElevator && <CheckCircle2 size={12}/>} ۸. آسانسور
                   </button>
                   <button onClick={() => setFormData({...formData, hasParking: !formData.hasParking})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${formData.hasParking ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}>
                       {formData.hasParking && <CheckCircle2 size={12}/>} ۹. پارکینگ
                   </button>
                   <button onClick={() => setFormData({...formData, hasStorage: !formData.hasStorage})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${formData.hasStorage ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}>
                       {formData.hasStorage && <CheckCircle2 size={12}/>} ۱۰. انباری
                   </button>
              </div>
          </div>

          {formData.transactionType === 'sale' || formData.transactionType === 'presale' ? (
              <Input 
                label="۱۱. قیمت کل (تومان)" 
                inputMode="numeric" 
                value={formatPriceDisplay(formData.priceTotal)} 
                onChange={(e: any) => setFormData({...formData, priceTotal: parsePrice(e.target.value)})} 
                icon={<DollarSign size={16}/>}
              />
          ) : (
              <div className="grid grid-cols-2 gap-3">
                  <Input label="۱۲. ودیعه (تومان)" inputMode="numeric" value={formatPriceDisplay(formData.priceDeposit)} onChange={(e: any) => setFormData({...formData, priceDeposit: parsePrice(e.target.value)})} />
                  <Input label="۱۳. اجاره ماهانه (تومان)" inputMode="numeric" value={formatPriceDisplay(formData.priceRent)} onChange={(e: any) => setFormData({...formData, priceRent: parsePrice(e.target.value)})} />
              </div>
          )}

          <Select label="۱۴. وضعیت سند" options={[{value: 'تک‌برگ', label: 'تک‌برگ'}, {value: 'قولنامه‌ای', label: 'قولنامه‌ای'}, {value: 'اوقافی', label: 'اوقافی'}, {value: 'در دست اقدام', label: 'در دست اقدام'}]} value={formData.deedStatus} onChange={(e: any) => setFormData({...formData, deedStatus: e.target.value})} />

          <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5">
              <p className="text-xs font-bold text-gray-400 mb-2">اطلاعات مالک</p>
              <Input label="۱۵. نام مالک" value={formData.ownerName} onChange={(e: any) => setFormData({...formData, ownerName: e.target.value})} />
              <Input label="۱۶. شماره تماس مالک" type="tel" value={formData.ownerPhone} onChange={(e: any) => setFormData({...formData, ownerPhone: e.target.value})} />
          </div>

          <Input label="۱۷. توضیحات ملک" className="h-24" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} />

          <div className="flex justify-between items-center px-2">
              <span className="text-xs text-gray-500">۱۸. تاریخ ثبت:</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{formData.date || new Date().toLocaleDateString('fa-IR')}</span>
          </div>

          <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">تصاویر ملک (با فشرده‌سازی خودکار)</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                  <label className="flex-shrink-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center cursor-pointer">
                      <Camera size={24} className="text-blue-500 mb-1" />
                      <span className="text-[10px] text-blue-600">دوربین</span>
                      <input type="file" capture="environment" accept="image/*" onChange={handleCameraCapture} className="hidden" />
                  </label>

                  <label className="flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer relative">
                      {uploading ? <Loader className="animate-spin text-gray-400" size={24}/> : <ImageIcon size={24} className="text-gray-400 mb-1" />}
                      <span className="text-[10px] text-gray-500">گالری</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  {formData.images?.map((img, idx) => (
                      <div key={idx} className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative group border border-gray-200 dark:border-white/10">
                          <img src={img} className="w-full h-full object-cover" alt="preview" />
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({...prev, images: prev.images?.filter((_, i) => i !== idx)}))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <X size={12} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="flex gap-3 mt-8">
          <button onClick={onCancel} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">انصراف</button>
          <button onClick={() => onSubmit(formData)} className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30">
              {uploading ? 'در حال پردازش...' : 'ثبت ملک مسکونی'}
          </button>
      </div>
    </div>
  );
};

export const CommercialForm: React.FC<FormProps<Property>> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState<Partial<Property>>(initialData || {
        category: 'commercial',
        type: 'مغازه',
        transactionType: 'sale',
        features: [],
        images: [],
        hasOpenCeiling: false,
        facilities: [],
        status: 'فعال',
        commercialDeedType: 'تک‌برگ',
        locationType: 'بر خیابان اصلی'
    });
    const [uploading, setUploading] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    const toggleFacility = (facility: string) => {
        const current = formData.facilities || [];
        if (current.includes(facility)) {
            setFormData({...formData, facilities: current.filter(f => f !== facility)});
        } else {
            setFormData({...formData, facilities: [...current, facility]});
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            const newImages: string[] = [];
            const files = Array.from(e.target.files) as File[];
            for (const file of files) {
                try {
                    const compressedBase64 = await compressImage(file);
                    newImages.push(compressedBase64);
                } catch (error) {
                    console.error("Compression error", error);
                    const reader = new FileReader();
                    const base64 = await new Promise<string>(resolve => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                    newImages.push(base64);
                }
            }
            setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...newImages] }));
            setUploading(false);
        }
    };

    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e);

    const handleLocationConfirm = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
        setShowMapPicker(false);
    };

    if (showMapPicker) {
        return (
            <LocationPicker 
              initialLat={formData.lat} 
              initialLng={formData.lng} 
              onConfirm={handleLocationConfirm} 
              onCancel={() => setShowMapPicker(false)} 
            />
        );
    }

    return (
        <div className="p-6 pb-24 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{initialData ? 'ویرایش ملک تجاری' : 'ثبت ملک تجاری'}</h2>
            <div className="space-y-4">
                <Select label="۱. نوع ملک تجاری" options={[{value: 'مغازه', label: 'مغازه'}, {value: 'دفتر کار', label: 'دفتر کار'}, {value: 'کارگاه', label: 'کارگاه'}, {value: 'انبار', label: 'انبار'}, {value: 'پاساژ', label: 'پاساژ'}, {value: 'سوله', label: 'سوله'}]} value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})} />
                <Select label="۲. نوع معامله" options={[{value: 'sale', label: 'فروش'}, {value: 'rent', label: 'رهن و اجاره'}, {value: 'mortgage', label: 'رهن کامل'}, {value: 'participation', label: 'مشارکت'}]} value={formData.transactionType} onChange={(e: any) => setFormData({...formData, transactionType: e.target.value})} />
                <Input label="۳. آدرس دقیق" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} icon={<MapPin size={16}/>} />

                <div className="flex items-center justify-between bg-gray-100 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${formData.lat ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><Navigation size={18} /></div>
                        <div><span className="text-xs font-bold block text-slate-700 dark:text-white">موقعیت مکانی (لوکیشن)</span><span className="text-[10px] text-gray-500 block">{formData.lat ? 'ثبت شده' : 'ثبت نشده'}</span></div>
                    </div>
                    <button onClick={() => setShowMapPicker(true)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-2 rounded-lg">
                        {formData.lat ? 'تغییر روی نقشه' : 'انتخاب از نقشه'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Input label="۴. متراژ (مترمربع)" type="number" value={formData.area} onChange={(e: any) => setFormData({...formData, area: Number(e.target.value)})} />
                    <Input label="۵. عرض بر (متر)" type="number" value={formData.frontage} onChange={(e: any) => setFormData({...formData, frontage: Number(e.target.value)})} />
                    <Input label="۶. طول ملک (متر)" type="number" value={formData.length} onChange={(e: any) => setFormData({...formData, length: Number(e.target.value)})} />
                    <Input label="۷. ارتفاع سقف (متر)" type="number" value={formData.height} onChange={(e: any) => setFormData({...formData, height: Number(e.target.value)})} />
                </div>

                <div className="flex gap-3 items-center my-2 justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                    <label className="text-xs font-bold text-gray-500">۸. سقف آزاد دارد؟</label>
                    <div className="flex gap-2">
                         <button onClick={() => setFormData({...formData, hasOpenCeiling: true})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${formData.hasOpenCeiling ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10'}`}>✅ دارد</button>
                         <button onClick={() => setFormData({...formData, hasOpenCeiling: false})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!formData.hasOpenCeiling ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-white/10'}`}>❌ ندارد</button>
                    </div>
                </div>

                <Select label="۹. موقعیت ملک" options={[{value: 'بر خیابان اصلی', label: 'بر خیابان اصلی'}, {value: 'داخل پاساژ', label: 'داخل پاساژ'}, {value: 'داخل کوچه', label: 'داخل کوچه'}]} value={formData.locationType} onChange={(e: any) => setFormData({...formData, locationType: e.target.value})} />
                <Select label="۱۰. نوع سند" options={[{value: 'تک‌برگ', label: 'تک‌برگ'}, {value: 'سرقفلی', label: 'سرقفلی'}, {value: 'اجاره‌نامه', label: 'اجاره‌نامه'}, {value: 'قولنامه‌ای', label: 'قولنامه‌ای'}]} value={formData.commercialDeedType} onChange={(e: any) => setFormData({...formData, commercialDeedType: e.target.value})} />

                {formData.transactionType === 'sale' || formData.transactionType === 'participation' ? (
                    <Input label="۱۱. قیمت کل (تومان)" inputMode="numeric" value={formatPriceDisplay(formData.priceTotal)} onChange={(e: any) => setFormData({...formData, priceTotal: parsePrice(e.target.value)})} icon={<DollarSign size={16}/>} />
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="۱۲. ودیعه (تومان)" inputMode="numeric" value={formatPriceDisplay(formData.priceDeposit)} onChange={(e: any) => setFormData({...formData, priceDeposit: parsePrice(e.target.value)})} />
                        <Input label="۱۳. اجاره ماهانه" inputMode="numeric" value={formatPriceDisplay(formData.priceRent)} onChange={(e: any) => setFormData({...formData, priceRent: parsePrice(e.target.value)})} />
                    </div>
                )}

                <Select label="۱۴. وضعیت فعلی ملک" options={[{value: 'تخلیه', label: 'تخلیه'}, {value: 'در اجاره', label: 'در اجاره'}, {value: 'فعال', label: 'فعال'}]} value={formData.status} onChange={(e: any) => setFormData({...formData, status: e.target.value})} />

                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                    <label className="text-xs text-gray-500 block mb-3">۱۵. امکانات</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['برق سه‌فاز', 'گاز', 'آب', 'تلفن', 'کرکره برقی', 'دزدگیر'].map(f => (
                            <button 
                                key={f}
                                onClick={() => toggleFacility(f)}
                                className={`py-2 rounded-lg text-[10px] font-bold border transition-colors ${formData.facilities?.includes(f) ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 mt-2">
                    <p className="text-xs font-bold text-gray-400 mb-2">اطلاعات مالک</p>
                    <Input label="۱۶. نام مالک" value={formData.ownerName} onChange={(e: any) => setFormData({...formData, ownerName: e.target.value})} />
                    <Input label="۱۷. شماره تماس مالک" type="tel" value={formData.ownerPhone} onChange={(e: any) => setFormData({...formData, ownerPhone: e.target.value})} />
                </div>

                <Input label="۱۸. توضیحات اضافی" className="h-24" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} />

                <div className="flex justify-between items-center px-2">
                     <span className="text-xs text-gray-500">۱۹. تاریخ ثبت:</span>
                     <span className="text-sm font-bold text-slate-800 dark:text-white">{formData.date || new Date().toLocaleDateString('fa-IR')}</span>
                </div>

                 <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">تصاویر ملک</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <label className="flex-shrink-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center cursor-pointer">
                            <Camera size={24} className="text-blue-500 mb-1" />
                            <span className="text-[10px] text-blue-600">دوربین</span>
                            <input type="file" capture="environment" accept="image/*" onChange={handleCameraCapture} className="hidden" />
                        </label>
                        <label className="flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer relative">
                            {uploading ? <Loader className="animate-spin text-gray-400" size={24}/> : <ImageIcon size={24} className="text-gray-400 mb-1" />}
                            <span className="text-[10px] text-gray-500">گالری</span>
                            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        {formData.images?.map((img, idx) => (
                            <div key={idx} className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative group">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                                <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images?.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex gap-3 mt-8">
                <button onClick={onCancel} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">انصراف</button>
                <button onClick={() => onSubmit(formData)} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30">
                    {uploading ? 'در حال پردازش...' : 'ثبت ملک تجاری'}
                </button>
            </div>
        </div>
    );
}

export const ClientForm: React.FC<FormProps<Client>> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState<Partial<Client>>(initialData || {
        requestType: 'sale',
        propertyType: 'residential',
        reminders: []
    });
    const [newReminder, setNewReminder] = useState<Partial<Reminder>>({ date: '', time: '10:00', title: '' });
    const [showReminderInput, setShowReminderInput] = useState(false);

    const addReminder = () => {
        if(!newReminder.title) {
            alert("لطفا عنوان یادآوری را وارد کنید");
            return;
        }
        if(!newReminder.date) {
            alert("لطفا تاریخ یادآوری را انتخاب کنید");
            setShowReminderInput(true);
            return;
        }

        const reminder: Reminder = {
            id: Date.now().toString(),
            title: newReminder.title,
            date: newReminder.date,
            time: newReminder.time || '10:00',
            isCompleted: false
        };
        setFormData(prev => ({ ...prev, reminders: [...(prev.reminders || []), reminder] }));
        setNewReminder({ date: '', time: '10:00', title: '' });
        setShowReminderInput(false); // Collapse after adding
    }

    const removeReminder = (id: string) => {
        setFormData(prev => ({ ...prev, reminders: prev.reminders?.filter(r => r.id !== id) }));
    }

    return (
        <div className="p-6 pb-24 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{initialData ? 'ویرایش مشتری' : 'ثبت مشتری جدید'}</h2>
            <div className="space-y-4">
                <Input label="۱. نام مشتری" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} />
                <Input label="۲. شماره تماس" type="tel" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-3">
                    <Select label="۳. نوع درخواست" options={[{value: 'sale', label: 'خرید'}, {value: 'rent', label: 'اجاره'}, {value: 'mortgage', label: 'رهن'}]} value={formData.requestType} onChange={(e: any) => setFormData({...formData, requestType: e.target.value})} />
                    <Select label="۴. نوع ملک مورد نظر" options={[{value: 'residential', label: 'مسکونی'}, {value: 'commercial', label: 'تجاری'}, {value: 'office', label: 'اداری'}]} value={formData.propertyType} onChange={(e: any) => setFormData({...formData, propertyType: e.target.value})} />
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5">
                    <label className="text-xs text-gray-500 block mb-2">۵. بودجه یا رنج قیمت (تومان)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="از..." inputMode="numeric" value={formatPriceDisplay(formData.budgetMin)} onChange={(e: any) => setFormData({...formData, budgetMin: parsePrice(e.target.value)})} />
                        <Input placeholder="تا..." inputMode="numeric" value={formatPriceDisplay(formData.budgetMax)} onChange={(e: any) => setFormData({...formData, budgetMax: parsePrice(e.target.value)})} />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5">
                    <label className="text-xs text-gray-500 block mb-2">۶. متراژ مورد نظر (متر)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="از..." type="number" value={formData.areaMin} onChange={(e: any) => setFormData({...formData, areaMin: Number(e.target.value)})} />
                        <Input placeholder="تا..." type="number" value={formData.areaMax} onChange={(e: any) => setFormData({...formData, areaMax: Number(e.target.value)})} />
                    </div>
                </div>

                <Input label="۷. محدوده / منطقه مورد نظر" value={formData.locationPref} onChange={(e: any) => setFormData({...formData, locationPref: e.target.value})} icon={<MapPin size={16}/>} />
                
                <Input label="۸. امکانات یا ویژگی‌های ضروری" placeholder="مثلاً آسانسور، پارکینگ، سقف بلند..." value={formData.essentials} onChange={(e: any) => setFormData({...formData, essentials: e.target.value})} />
                
                <Input label="۹. توضیحات اضافی" className="h-24" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} />

                <div className="flex justify-between items-center px-2">
                     <span className="text-xs text-gray-500">۱۰. تاریخ ثبت:</span>
                     <span className="text-sm font-bold text-slate-800 dark:text-white">{formData.date || new Date().toLocaleDateString('fa-IR')}</span>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-500/20 mt-4 transition-all duration-300">
                    <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                        <Bell size={16} />
                        یادآوری‌ها
                    </h3>
                    
                    <div className="mb-4 space-y-2">
                        <Input 
                            label="عنوان یادآوری" 
                            placeholder="مثلا: تماس مجدد"
                            value={newReminder.title} 
                            onChange={(e: any) => setNewReminder({...newReminder, title: e.target.value})} 
                        />
                        
                        <button 
                            onClick={() => setShowReminderInput(!showReminderInput)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold border transition-all ${
                                newReminder.date 
                                    ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white border-orange-200 dark:border-orange-500/30' 
                                    : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-transparent'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Calendar size={16} />
                                {newReminder.date 
                                    ? `${newReminder.date} - ساعت ${newReminder.time}` 
                                    : 'تنظیم تاریخ و ساعت یادآوری'}
                            </span>
                            {showReminderInput ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>

                        {showReminderInput && (
                            <div className="animate-fade-in pt-2">
                                <PersianDateTimePicker 
                                    date={newReminder.date || ''} 
                                    time={newReminder.time || '10:00'} 
                                    onDateChange={(d) => setNewReminder(prev => ({...prev, date: d}))}
                                    onTimeChange={(t) => setNewReminder(prev => ({...prev, time: t}))}
                                />
                            </div>
                        )}

                        <button onClick={addReminder} className="w-full py-3 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform mt-2">افزودن به لیست یادآوری</button>
                    </div>

                    <div className="space-y-2">
                        {formData.reminders?.map(r => (
                            <div key={r.id} className="bg-white dark:bg-black/20 p-2 rounded-xl flex justify-between items-center border border-orange-100 dark:border-white/5">
                                <div>
                                    <span className="text-xs font-bold block text-slate-700 dark:text-white">{r.title}</span>
                                    <span className="text-[10px] text-gray-500">{r.date} - {r.time}</span>
                                </div>
                                <button onClick={() => removeReminder(r.id)} className="text-red-500 p-1"><X size={14}/></button>
                            </div>
                        ))}
                        {(!formData.reminders || formData.reminders.length === 0) && (
                            <p className="text-[10px] text-center text-gray-400 py-2">هنوز یادآوری ثبت نشده است</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-3 mt-8">
                <button onClick={onCancel} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">انصراف</button>
                <button onClick={() => onSubmit(formData)} className="flex-1 py-3.5 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30">ثبت مشتری</button>
            </div>
        </div>
    );
}

export const CommissionForm: React.FC<FormProps<Commission>> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState<Partial<Commission>>(initialData || {
        agentPercentage: 40,
        totalCommission: 0
    });

    useEffect(() => {
        if (formData.propertyPrice) {
            if (!initialData) {
                const calculatedComm = formData.propertyPrice * 0.01;
                setFormData(prev => ({ ...prev, totalCommission: calculatedComm }));
            }
        }
    }, [formData.propertyPrice]);

    useEffect(() => {
        if (formData.totalCommission && formData.agentPercentage) {
            const share = formData.totalCommission * (formData.agentPercentage / 100);
            setFormData(prev => ({ ...prev, agentShare: share }));
        }
    }, [formData.totalCommission, formData.agentPercentage]);

    return (
        <div className="p-6 pb-24 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">محاسبه و ثبت کمیسیون</h2>
            <div className="space-y-4">
                <Input label="نام خریدار / مستاجر" value={formData.buyerName} onChange={(e: any) => setFormData({...formData, buyerName: e.target.value})} />
                <Input label="نام فروشنده / موجر" value={formData.sellerName} onChange={(e: any) => setFormData({...formData, sellerName: e.target.value})} />
                <Input label="تاریخ قرارداد" placeholder="1403/01/01" value={formData.contractDate} onChange={(e: any) => setFormData({...formData, contractDate: e.target.value})} icon={<Calendar size={16}/>} />
                
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 space-y-3">
                    <Input label="مبلغ کل معامله" inputMode="numeric" value={formatPriceDisplay(formData.propertyPrice)} onChange={(e: any) => setFormData({...formData, propertyPrice: parsePrice(e.target.value)})} icon={<DollarSign size={16}/>} />
                    <Input label="کمیسیون کل دریافتی" inputMode="numeric" value={formatPriceDisplay(formData.totalCommission)} onChange={(e: any) => setFormData({...formData, totalCommission: parsePrice(e.target.value)})} icon={<Calculator size={16}/>} />
                    
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                             <Input label="درصد سهم مشاور" type="number" value={formData.agentPercentage} onChange={(e: any) => setFormData({...formData, agentPercentage: Number(e.target.value)})} />
                        </div>
                        <div className="flex-1 pt-4">
                             <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-emerald-200 dark:border-white/10">
                                 <span className="text-xs text-gray-500 block">سهم مشاور</span>
                                 <span className="font-bold text-emerald-600 dark:text-emerald-400">{formData.agentShare?.toLocaleString()}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 mt-8">
                <button onClick={onCancel} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">انصراف</button>
                <button onClick={() => onSubmit(formData)} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30">ثبت کمیسیون</button>
            </div>
        </div>
    )
}

export const TaskForm: React.FC<FormProps<Task>> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState<Partial<Task>>(initialData || {
        priority: 'medium',
        type: 'schedule',
        isCompleted: false
    });
    const [aiSuggestion, setAiSuggestion] = useState<{date: string, time: string, reason: string} | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    const handleSmartSchedule = async () => {
        if (!formData.title) {
            alert("لطفا ابتدا عنوان وظیفه را وارد کنید");
            return;
        }
        setLoadingAi(true);
        const suggestion = await suggestTaskSchedule(formData.title, formData.priority || 'medium');
        if (suggestion) {
            setAiSuggestion(suggestion);
            setFormData(prev => ({ ...prev, date: suggestion.date, time: suggestion.time }));
        } else {
            alert("هوش مصنوعی نتوانست پیشنهادی ارائه دهد. لطفا دستی وارد کنید.");
        }
        setLoadingAi(false);
    };

    return (
        <div className="p-6 pb-24 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{initialData ? 'ویرایش وظیفه' : 'وظیفه جدید'}</h2>
            
            <div className="space-y-4">
                <Input label="عنوان وظیفه" value={formData.title} onChange={(e: any) => setFormData({...formData, title: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-3">
                    <Select label="نوع" options={[{value: 'schedule', label: 'برنامه'}, {value: 'routine', label: 'روتین'}, {value: 'reminder', label: 'یادآوری'}]} value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})} />
                    <Select label="اولویت" options={[{value: 'low', label: 'کم'}, {value: 'medium', label: 'متوسط'}, {value: 'high', label: 'بالا'}]} value={formData.priority} onChange={(e: any) => setFormData({...formData, priority: e.target.value})} />
                </div>

                <button 
                    onClick={handleSmartSchedule}
                    disabled={loadingAi}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 mb-2"
                >
                    {loadingAi ? <Loader className="animate-spin" /> : <Sparkles size={18} />}
                    <span>پیشنهاد زمان‌بندی هوشمند AI</span>
                </button>

                {aiSuggestion && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-500/30 mb-2 text-xs text-purple-700 dark:text-purple-300">
                        <span className="font-bold block mb-1">💡 پیشنهاد هوشمند:</span>
                        {aiSuggestion.reason}
                    </div>
                )}

                <PersianDateTimePicker 
                    date={formData.date || ''} 
                    time={formData.time || ''} 
                    onDateChange={(d) => setFormData(prev => ({...prev, date: d}))}
                    onTimeChange={(t) => setFormData(prev => ({...prev, time: t}))}
                />

                <Input label="توضیحات تکمیلی" className="h-24" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="flex gap-3 mt-8">
                <button onClick={onCancel} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">انصراف</button>
                <button onClick={() => onSubmit(formData)} className="flex-1 py-3.5 bg-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-600/30">ثبت وظیفه</button>
            </div>
        </div>
    )
}
