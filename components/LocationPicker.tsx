
import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Check, X } from 'lucide-react';
import L from 'leaflet';

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ initialLat, initialLng, onConfirm, onCancel }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
      if (!mapRef.current) return;
      
      // Default to Tehran if no location provided
      const defaultLat = initialLat || 35.6892;
      const defaultLng = initialLng || 51.3890;

      if (!mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapRef.current, {
              center: [defaultLat, defaultLng],
              zoom: 15,
              zoomControl: false,
              attributionControl: false
          });

          // Always use light map tiles
          const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

          L.tileLayer(tileUrl, { 
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current);
      }
  }, []);

  const handleMyLocation = () => {
      if (!mapInstanceRef.current) return;
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 17);
        }, (err) => {
            console.error(err);
            alert("خطا در دریافت موقعیت مکانی");
        });
      }
  };

  const handleConfirm = () => {
      if (!mapInstanceRef.current) return;
      const center = mapInstanceRef.current.getCenter();
      onConfirm(center.lat, center.lng);
  };

  return (
      <div className="fixed inset-0 !z-[9999] bg-slate-50 dark:bg-[#0F172A] flex flex-col animate-fade-in font-['Vazirmatn'] max-w-lg mx-auto left-0 right-0 shadow-2xl">
          {/* Header Overlay */}
          <div className="absolute top-0 left-0 right-0 !z-[9999] p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
              <h3 className="text-white text-center font-bold text-lg shadow-sm">موقعیت دقیق ملک را مشخص کنید</h3>
              <p className="text-white/90 text-center text-xs mt-1">نقشه را جابجا کنید تا پین قرمز روی محل ملک قرار گیرد</p>
          </div>
          
          {/* Map Container */}
          <div className="flex-1 relative w-full h-full">
              <div ref={mapRef} className="w-full h-full bg-gray-200 z-0" />
              
              {/* Center Fixed Marker (Crosshair) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 !z-[9999] pointer-events-none mb-8">
                  <div className="relative flex flex-col items-center justify-center">
                       <MapPin size={48} className="text-red-600 drop-shadow-2xl fill-red-600/20 -mt-12" strokeWidth={2} />
                       <div className="w-2 h-2 bg-black/40 rounded-full absolute top-full transform -translate-y-2 blur-[2px]"></div>
                  </div>
              </div>

              {/* My Location Control */}
              <button 
                onClick={handleMyLocation}
                className="absolute bottom-6 right-6 !z-[9999] bg-white p-4 rounded-full shadow-2xl border border-gray-100 text-blue-600 active:scale-95 transition-transform"
              >
                  <Navigation size={24} />
              </button>
          </div>

          {/* Footer Actions */}
          <div className="bg-white dark:bg-[#1E293B] p-4 shadow-[0_-5px_30px_rgba(0,0,0,0.15)] flex gap-4 !z-[9999] border-t border-gray-200 dark:border-white/5 relative">
              <button 
                onClick={onCancel}
                className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                  <X size={18} />
                  انصراف
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                  <Check size={20} />
                  تایید و ثبت موقعیت
              </button>
          </div>
      </div>
  );
};
