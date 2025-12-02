
import React, { useState, useRef, useEffect } from 'react';
import { Property } from '../types';
import { ArrowRight, Phone, Share2, Edit, Trash, MapPin, Calendar, ChevronLeft, ChevronRight, Home, DollarSign, Layers, Maximize, CheckCircle2, X, ZoomIn, ShieldCheck, Ruler, Building, LayoutDashboard, Info, Wand2, Copy, Sparkles, Loader, Check, Navigation, Map as MapIcon, Image as ImageIcon, Download, Palette, Armchair, RefreshCcw, Briefcase } from 'lucide-react';
import { PropertyMap } from './PropertyMap';
import { generateDivarAdText, generateVirtualStaging } from '../services/geminiService';

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onBack, onEdit, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Ad Generation State
  const [showAdModal, setShowAdModal] = useState(false);
  const [adText, setAdText] = useState('');
  const [loadingAd, setLoadingAd] = useState(false);
  const [copied, setCopied] = useState(false);

  // Image Generator State
  const [showImageGenModal, setShowImageGenModal] = useState(false);
  const [selectedGenImageIndex, setSelectedGenImageIndex] = useState(0);
  const [genTemplate, setGenTemplate] = useState<'residential' | 'commercial' | 'minimal'>('residential');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Virtual Staging State
  const [showStagingModal, setShowStagingModal] = useState(false);
  const [stagingStep, setStagingStep] = useState<'setup' | 'loading' | 'result'>('setup');
  const [stagingImageIndex, setStagingImageIndex] = useState(0);
  const [stagingStyle, setStagingStyle] = useState('');
  const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null);

  // Navigation Modal State
  const [showNavModal, setShowNavModal] = useState(false);

  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const images = property.images && property.images.length > 0 
    ? property.images 
    : ["https://picsum.photos/800/600"];

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleShare = async () => {
    const shareText = `
🏠 ${property.title}
📍 ${property.address}
📏 ${property.area} متر
💰 قیمت: ${property.transactionType === 'sale' ? property.priceTotal?.toLocaleString() : `ودیعه: ${property.priceDeposit?.toLocaleString()}`}

مشاهده جزئیات بیشتر در اپلیکیشن املاک
`;
    if (navigator.share) {
        try { await navigator.share({ title: property.title, text: shareText }); } catch (err) {}
    } else {
        navigator.clipboard.writeText(shareText);
        alert("متن کپی شد");
    }
  };

  const handleGenerateAd = async () => {
      setShowAdModal(true);
      setLoadingAd(true);
      setAdText(''); // Clear previous
      setCopied(false);
      
      const text = await generateDivarAdText(property);
      setAdText(text || "خطا در تولید متن. لطفا مجددا تلاش کنید.");
      setLoadingAd(false);
  };

  const copyAdText = () => {
      navigator.clipboard.writeText(adText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const openMapApp = (type: 'google' | 'waze') => {
      if (!property.lat || !property.lng) return;
      const { lat, lng } = property;
      
      if (type === 'google') {
          window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      } else if (type === 'waze') {
          window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
      }
      setShowNavModal(false);
  };

  // --- Virtual Staging Logic ---
  const handleVirtualStaging = async () => {
      if (!stagingStyle) {
          alert("لطفا یک سبک چیدمان انتخاب کنید یا بنویسید");
          return;
      }
      
      setStagingStep('loading');
      setStagedImageUrl(null);
      
      const originalImage = images[stagingImageIndex];
      const result = await generateVirtualStaging(originalImage, stagingStyle);
      
      if (result) {
          setStagedImageUrl(result);
          setStagingStep('result');
      } else {
          alert("خطا در تولید تصویر. لطفا اتصال اینترنت و کلید API را بررسی کنید.");
          setStagingStep('setup');
      }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      // Delay slightly to allow keyboard to open
      setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
  };

  // --- Image Generation Logic ---
  const generateAdImage = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      // Use the selected image for generation
      img.src = images[selectedGenImageIndex];
      
      img.onload = () => {
          // Canvas Dimensions (Divar/Instagram Post Ratio 1:1 or 4:5, lets use 1080x1080)
          canvas.width = 1080;
          canvas.height = 1080;

          // 1. Draw Background Image (Cover center)
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          // 2. Apply Template Overlay
          if (genTemplate === 'residential') {
              // -- RESIDENTIAL TEMPLATE (Luxury Dark) --
              
              const gradient = ctx.createLinearGradient(0, 500, 0, 1080);
              gradient.addColorStop(0, "transparent");
              gradient.addColorStop(0.6, "rgba(15, 23, 42, 0.9)");
              gradient.addColorStop(1, "rgba(15, 23, 42, 1)");
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 400, 1080, 680);

              ctx.fillStyle = "rgba(0,0,0,0.5)";
              ctx.fillRect(800, 40, 240, 80);
              ctx.fillStyle = "#FACC15"; 
              ctx.font = "bold 35px Vazirmatn, sans-serif";
              ctx.textAlign = "center";
              ctx.fillText("املاک تهرانک", 920, 90);

              ctx.fillStyle = "#334155";
              ctx.fillRect(1080 - 250, 400, 250, 160);
              ctx.fillStyle = "#fff";
              ctx.textAlign = "center";
              ctx.font = "bold 60px Vazirmatn, sans-serif";
              ctx.fillText(`${property.area} متر`, 1080 - 125, 470);
              ctx.font = "30px Vazirmatn, sans-serif";
              ctx.fillText(property.type, 1080 - 125, 520);

              ctx.textAlign = "right";
              ctx.fillStyle = "#fff";
              ctx.font = "bold 55px Vazirmatn, sans-serif";
              wrapText(ctx, property.title || '', 1040, 820, 1000, 70);

              ctx.textAlign = "left";
              ctx.fillStyle = "#10b981"; 
              ctx.font = "bold 65px Vazirmatn, sans-serif";
              const price = property.transactionType === 'sale'
                  ? `${property.priceTotal?.toLocaleString()} تومان`
                  : `${property.priceRent?.toLocaleString()} اجاره`;
              ctx.fillText(price, 40, 1020);

              ctx.fillStyle = "#94a3b8";
              ctx.font = "35px Vazirmatn, sans-serif";
              const addr = property.address || '';
              ctx.fillText(addr.split('،')[1] || addr, 1040, 920);
              ctx.textAlign = "right"; 

          } else if (genTemplate === 'commercial') {
              // -- COMMERCIAL TEMPLATE --
              ctx.fillStyle = "#FACC15"; 
              ctx.fillRect(0, 0, 1080, 150);
              
              ctx.fillStyle = "#000";
              ctx.fillRect(0, 900, 1080, 180);

              ctx.save();
              ctx.translate(0, 0);
              ctx.rotate(-45 * Math.PI / 180);
              ctx.fillStyle = "#DC2626";
              ctx.fillRect(-200, 100, 600, 80);
              ctx.fillStyle = "#fff";
              ctx.font = "bold 40px Vazirmatn, sans-serif";
              ctx.fillText("فروش ویژه", 0, 155);
              ctx.restore();

              ctx.fillStyle = "#000";
              ctx.font = "bold 60px Vazirmatn, sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(property.type + ' ' + property.area + ' متری', 540, 100);

              ctx.textAlign = "right";
              ctx.fillStyle = "#FACC15";
              ctx.font = "bold 50px Vazirmatn, sans-serif";
              const price = property.transactionType === 'sale'
                  ? `قیمت: ${property.priceTotal?.toLocaleString()}`
                  : `اجاره: ${property.priceRent?.toLocaleString()}`;
              ctx.fillText(price, 1040, 990);
              
              ctx.fillStyle = "#fff";
              ctx.font = "35px Vazirmatn, sans-serif";
              ctx.fillText(property.address || '', 1040, 1050);

              ctx.textAlign = "left";
              ctx.fillStyle = "#9ca3af";
              ctx.fillText("تهرانک", 40, 1040);

          } else {
              // -- MINIMAL TEMPLATE --
              ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
              ctx.fillRect(30, 880, 1020, 170);
              
              ctx.fillStyle = "#1e293b";
              ctx.textAlign = "center";
              ctx.font = "bold 45px Vazirmatn, sans-serif";
              ctx.fillText(property.title || '', 540, 950);
              
              ctx.fillStyle = "#64748b";
              ctx.font = "35px Vazirmatn, sans-serif";
              const sub = `${property.area} متر  |  ${property.type}  |  املاک تهرانک`;
              ctx.fillText(sub, 540, 1010);
          }

          setGeneratedImageUrl(canvas.toDataURL('image/jpeg', 0.9));
      };
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, x, y);
              line = words[n] + ' ';
              y += lineHeight;
          } else {
              line = testLine;
          }
      }
      ctx.fillText(line, x, y);
  }

  useEffect(() => {
      if (showImageGenModal) {
          const timer = setTimeout(() => {
              generateAdImage();
          }, 500);
          return () => clearTimeout(timer);
      }
  }, [showImageGenModal, genTemplate, selectedGenImageIndex]);


  return (
    <>
        <div className="fixed inset-0 z-[70] flex flex-col animate-slide-up bg-slate-50/95 dark:bg-[#0F172A]/95 backdrop-blur-xl overflow-hidden max-w-lg mx-auto left-0 right-0">
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pb-32 custom-scrollbar relative">
                
                {/* Image Header */}
                <div 
                    className="relative h-[35vh] w-full bg-black group cursor-pointer touch-pan-y"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onClick={toggleFullscreen}
                >
                    <img 
                        src={images[currentImageIndex]} 
                        className="w-full h-full object-cover opacity-90" 
                        alt={property.title} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>

                    {/* Navbar */}
                    <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between items-start z-20" onClick={(e) => e.stopPropagation()}>
                        <button onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg">
                            <ArrowRight size={24} />
                        </button>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowStagingModal(true)}
                                className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                                title="چیدمان مجازی"
                            >
                                <Armchair size={20} />
                            </button>
                            <button 
                                onClick={() => setShowImageGenModal(true)}
                                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
                                title="ساخت عکس آگهی"
                            >
                                <ImageIcon size={20} />
                            </button>
                            <button onClick={handleGenerateAd} className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg animate-pulse hover:scale-105 transition-transform" title="تولید متن هوشمند">
                                <Wand2 size={20} />
                            </button>
                            <button onClick={handleShare} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg">
                                <Share2 size={20} />
                            </button>
                            <button onClick={() => onEdit(property)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg">
                                <Edit size={20} />
                            </button>
                        </div>
                    </div>

                     {/* Zoom Hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs flex items-center gap-2">
                             <ZoomIn size={16} />
                             بزرگنمایی
                        </div>
                    </div>

                    {/* Slider Indicators */}
                    {images.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                            {images.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Container - Pull Up Effect */}
                <div className="-mt-10 relative z-10 px-4 min-h-[60vh] pb-48">
                    
                    {/* Floating Hero Card */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 shadow-xl border border-gray-100 dark:border-white/5 mb-6 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${property.transactionType === 'sale' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-3">
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${property.category === 'residential' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                                         {property.category === 'residential' ? 'مسکونی' : 'تجاری'}
                                     </span>
                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${property.transactionType === 'sale' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                         {property.transactionType === 'sale' ? 'فروش' : property.transactionType === 'rent' ? 'اجاره' : 'پیش‌فروش'}
                                     </span>
                                 </div>
                                 <h1 className="text-xl font-extrabold text-slate-800 dark:text-white leading-snug">{property.title}</h1>
                             </div>
                        </div>

                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-4">
                            <MapPin size={14} className="text-red-500" />
                            <span>{property.address}</span>
                        </div>

                        <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-3 flex justify-between items-center">
                            {property.transactionType === 'sale' ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">قیمت کل</span>
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {property.priceTotal?.toLocaleString()} <span className="text-xs font-normal text-gray-500">تومان</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col w-full gap-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">ودیعه:</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-gray-300">{property.priceDeposit?.toLocaleString()} ت</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">اجاره:</span>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{property.priceRent?.toLocaleString()} ت</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Key Features Grid */}
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2"><LayoutDashboard size={16}/> مشخصات کلیدی</h3>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <DetailBox title="متراژ" value={`${property.area} متر`} icon={<Ruler size={14}/>} />
                        <DetailBox title="سال ساخت" value={property.yearBuilt || '-'} icon={<Calendar size={14}/>} />
                        <DetailBox title="نوع ملک" value={property.type} icon={<Building size={14}/>} />
                        <DetailBox 
                            title={property.transactionType === 'sale' ? 'قیمت کل' : 'اجاره'} 
                            value={property.transactionType === 'sale' ? `${(property.priceTotal || 0) / 1000000} M` : property.priceRent?.toLocaleString()} 
                            icon={<DollarSign size={14}/>} 
                            highlight 
                        />
                        <DetailBox title="سند" value={property.deedStatus || property.commercialDeedType || '-'} icon={<ShieldCheck size={14}/>} />
                        <DetailBox title="کد ملک" value={property.id.slice(-4)} icon={<Info size={14}/>} />
                    </div>

                    {/* Facilities */}
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> امکانات و ویژگی‌ها</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {property.bedrooms && <FeatureChip label={`${property.bedrooms} خواب`} />}
                        {property.floor && <FeatureChip label={`طبقه ${property.floor}`} />}
                        {property.hasElevator && <FeatureChip label="آسانسور" />}
                        {property.hasParking && <FeatureChip label="پارکینگ" />}
                        {property.hasStorage && <FeatureChip label="انباری" />}
                        {property.hasOpenCeiling && <FeatureChip label="سقف آزاد" />}
                        {property.features?.map(f => <FeatureChip key={f} label={f} />)}
                        {property.facilities?.map(f => <FeatureChip key={f} label={f} />)}
                    </div>

                    {/* Description */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">توضیحات تکمیلی</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify">
                            {property.description || "توضیحات بیشتری ثبت نشده است."}
                        </p>
                        
                        {/* Divar Ad Button */}
                        <button 
                            onClick={handleGenerateAd}
                            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 border border-pink-200 dark:border-pink-500/20 flex items-center justify-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-xs hover:scale-[1.02] transition-transform"
                        >
                            <Sparkles size={16} />
                            تولید متن آگهی هوشمند (دیوار)
                        </button>
                    </div>

                    {/* Map Preview */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-white/5 mb-6 overflow-hidden">
                        <div className="flex justify-between items-center px-3 py-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">موقعیت روی نقشه</h3>
                            <button onClick={() => setShowNavModal(true)} className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded-lg">مسیریابی</button>
                        </div>
                        <div className="h-40 w-full rounded-2xl overflow-hidden relative" onClick={() => setShowNavModal(true)}>
                            {property.lat && property.lng ? (
                                <PropertyMap properties={[property]} hideControls />
                            ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-black/20 flex items-center justify-center text-gray-400 text-xs">
                                    موقعیت ثبت نشده
                                </div>
                            )}
                            {/* Overlay for click */}
                            <div className="absolute inset-0 z-10"></div>
                        </div>
                    </div>

                    {/* Owner Card (Bottom) */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-black dark:to-slate-900 rounded-3xl p-5 text-white shadow-xl mb-24 relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
                                    {property.ownerName.charAt(0)}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block">مالک محترم</span>
                                    <h4 className="text-lg font-bold">{property.ownerName}</h4>
                                </div>
                            </div>
                            <a href={`tel:${property.ownerPhone}`} className="bg-green-500 hover:bg-green-400 text-white p-3 rounded-xl shadow-lg shadow-green-500/30 transition-transform active:scale-95">
                                <Phone size={20} />
                            </a>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
                    </div>

                </div>
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 z-[80] max-w-lg mx-auto">
                <div className="flex gap-3">
                    <button onClick={() => onDelete(property.id)} className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                        <Trash size={18} />
                        حذف ملک
                    </button>
                    <button onClick={() => setShowStagingModal(true)} className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Armchair size={20} />
                        چیدمان مجازی
                    </button>
                </div>
            </div>
        </div>

        {/* --- Modals --- */}

        {/* 1. Divar Ad Modal */}
        {showAdModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-[#1E293B] rounded-[30px] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-white/10">
                    <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="text-pink-500" size={20}/>
                            تولید آگهی هوشمند
                        </h3>
                        <button onClick={() => setShowAdModal(false)}><X className="text-gray-400"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-black/20">
                        {loadingAd ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                <Loader className="animate-spin text-purple-500" size={40} />
                                <p className="text-sm text-gray-500 animate-pulse">هوش مصنوعی در حال نوشتن آگهی...</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-200 dark:border-white/5 text-sm leading-7 whitespace-pre-line text-slate-700 dark:text-gray-300">
                                {adText}
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-gray-100 dark:border-white/5">
                        <button 
                            onClick={copyAdText}
                            disabled={loadingAd || !adText}
                            className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${copied ? 'bg-green-500' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {copied ? <Check size={20}/> : <Copy size={20}/>}
                            {copied ? 'کپی شد! ✅' : 'کپی متن آگهی'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 2. Image Generator Modal */}
        {showImageGenModal && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col animate-fade-in">
                <div className="p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2"><ImageIcon/> ساخت عکس آگهی</h3>
                    <button onClick={() => setShowImageGenModal(false)} className="p-2 bg-white/10 rounded-full"><X/></button>
                </div>
                
                <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                    {/* Canvas Container */}
                    <div className="relative shadow-2xl rounded-xl overflow-hidden max-w-full max-h-full">
                        {generatedImageUrl ? (
                            <img src={generatedImageUrl} className="max-w-full max-h-[60vh] object-contain" alt="Generated Ad" />
                        ) : (
                            <div className="w-[300px] h-[300px] flex items-center justify-center bg-white/5 text-white">Loading...</div>
                        )}
                    </div>
                    {/* Hidden Canvas for Rendering */}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>

                <div className="bg-[#1E293B] p-6 rounded-t-[30px] space-y-4">
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {['residential', 'commercial', 'minimal'].map(t => (
                            <button 
                                key={t}
                                onClick={() => setGenTemplate(t as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${genTemplate === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-gray-400 border-white/10'}`}
                            >
                                {t === 'residential' ? 'قالب مسکونی' : t === 'commercial' ? 'قالب تجاری' : 'مینیمال'}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {images.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedGenImageIndex(idx)}
                                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${selectedGenImageIndex === idx ? 'border-blue-500 scale-110' : 'border-transparent opacity-50'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => {
                            if (generatedImageUrl) {
                                const link = document.createElement('a');
                                link.download = `tehranak-ad-${property.id}.jpg`;
                                link.href = generatedImageUrl;
                                link.click();
                            }
                        }}
                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                        <Download size={20} />
                        دانلود تصویر نهایی
                    </button>
                </div>
            </div>
        )}

        {/* 3. Virtual Staging Modal */}
        {showStagingModal && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-fade-in">
                
                {/* Close Button */}
                <button onClick={() => setShowStagingModal(false)} className="absolute top-4 left-4 p-2 bg-white/10 rounded-full text-white z-20">
                    <X size={24} />
                </button>

                {stagingStep === 'setup' && (
                    <div className="flex flex-col h-full p-6 overflow-y-auto">
                        <div className="text-center mb-8 mt-10">
                            <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-pink-600 rounded-[30px] mx-auto flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-4">
                                <Armchair size={40} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">چیدمان مجازی هوشمند</h2>
                            <p className="text-gray-400 text-sm">عکس خالی را انتخاب کنید تا با هوش مصنوعی چیدمان شود</p>
                        </div>

                        {/* Image Selector */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 mb-3 block">۱. انتخاب تصویر خام</label>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setStagingImageIndex(idx)}
                                        className={`w-24 h-24 rounded-2xl overflow-hidden relative cursor-pointer transition-all ${stagingImageIndex === idx ? 'ring-4 ring-orange-500 scale-105' : 'opacity-60'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                        {stagingImageIndex === idx && <div className="absolute inset-0 bg-orange-500/20"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Style Selector */}
                        <div className="flex-1 pb-40">
                            <label className="text-xs font-bold text-gray-500 mb-3 block">۲. انتخاب سبک دکوراسیون</label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {['مسکونی مدرن', 'کلاسیک و لوکس', 'مینیمال', 'اداری / دفتر کار', 'کافه و رستوران', 'آرایشگاه'].map(style => (
                                    <button 
                                        key={style} 
                                        onClick={() => setStagingStyle(style)}
                                        className={`py-3 rounded-xl text-xs font-bold border transition-all ${stagingStyle === style ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 text-gray-300 border-white/10'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                placeholder="یا توصیف دلخواه خود را بنویسید... (مثلا: مبل‌های چرمی قهوه‌ای با نورپردازی گرم)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm min-h-[100px] focus:border-orange-500 outline-none"
                                value={stagingStyle}
                                onChange={(e) => setStagingStyle(e.target.value)}
                                onFocus={handleInputFocus}
                            />
                        </div>

                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 border-t border-white/10 max-w-lg mx-auto">
                            <button 
                                onClick={handleVirtualStaging}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl text-white font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                            >
                                <Wand2 size={20} />
                                اجرای چیدمان
                            </button>
                        </div>
                    </div>
                )}

                {stagingStep === 'loading' && (
                    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-orange-500/30 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="text-orange-500 animate-pulse" size={32} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">در حال طراحی دکوراسیون...</h3>
                            <p className="text-gray-400 text-sm">هوش مصنوعی در حال مبله کردن فضای شماست.</p>
                            <p className="text-gray-500 text-xs mt-4">این فرایند ممکن است تا ۳۰ ثانیه زمان ببرد.</p>
                        </div>
                    </div>
                )}

                {stagingStep === 'result' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                            {stagedImageUrl && (
                                <img src={stagedImageUrl} className="w-full h-full object-contain" alt="Staged Result" />
                            )}
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-white text-xs border border-white/10">
                                طراحی شده با AI
                            </div>
                        </div>
                        <div className="p-6 bg-[#1E293B] rounded-t-[30px] border-t border-white/10 space-y-3">
                            <h3 className="text-white font-bold text-center mb-2">نتیجه طراحی</h3>
                            <button 
                                onClick={() => {
                                    if (stagedImageUrl) {
                                        const link = document.createElement('a');
                                        link.download = `tehranak-staging-${Date.now()}.jpg`;
                                        link.href = stagedImageUrl;
                                        link.click();
                                    }
                                }}
                                className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                            >
                                <Download size={20} />
                                دانلود تصویر
                            </button>
                            <button 
                                onClick={() => setStagingStep('setup')}
                                className="w-full py-3.5 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20"
                            >
                                <RefreshCcw size={18} />
                                طراحی مجدد
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 4. Navigation Modal */}
        {showNavModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end animate-fade-in" onClick={() => setShowNavModal(false)}>
                <div className="bg-white dark:bg-[#1E293B] w-full rounded-t-[30px] p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
                    <h3 className="text-center font-bold text-slate-800 dark:text-white mb-6">مسیریابی با:</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => openMapApp('google')} className="p-4 bg-gray-100 dark:bg-white/5 rounded-2xl flex flex-col items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500"><MapIcon size={24}/></div>
                            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">Google Maps</span>
                        </button>
                        <button onClick={() => openMapApp('waze')} className="p-4 bg-gray-100 dark:bg-white/5 rounded-2xl flex flex-col items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center shadow-sm text-white"><Navigation size={24}/></div>
                            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">Waze</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

const DetailBox: React.FC<{title: string, value: string | number, icon: React.ReactNode, highlight?: boolean}> = ({ title, value, icon, highlight }) => (
    <div className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center border h-20 ${highlight ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-500/30' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
        <div className={`text-gray-400 ${highlight ? 'text-emerald-500' : ''}`}>
            {icon}
        </div>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">{title}</span>
        <span className={`font-bold text-xs break-all line-clamp-1 ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
            {value}
        </span>
    </div>
);

const FeatureChip: React.FC<{label: string}> = ({ label }) => (
    <span className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg font-medium border border-gray-200 dark:border-white/5">
        {label}
    </span>
);
