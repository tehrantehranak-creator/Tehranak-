
import React, { useEffect, useRef } from 'react';
import { Property } from '../types';
import { Navigation } from 'lucide-react';
import L from 'leaflet';

interface PropertyMapProps {
  properties: Property[];
  hideControls?: boolean;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({ properties, hideControls }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
            center: [35.6892, 51.3890], // Tehran
            zoom: 12,
            zoomControl: false,
            attributionControl: false
        });
        
        if (!hideControls) {
             L.control.zoom({ position: 'bottomleft' }).addTo(mapInstanceRef.current);
        }
    }

    // Tile Layer Selection - Always Light
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Clear existing layers to update tiles
    mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) layer.remove();
    });
    
    L.tileLayer(tileUrl, { 
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = L.latLngBounds([]);
    
    properties.forEach(p => {
        if (p.lat && p.lng) {
             const color = p.category === 'residential' ? '#a855f7' : '#3b82f6';
             const markerHtml = `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`;
             
             const icon = L.divIcon({
                 className: 'custom-marker',
                 html: markerHtml,
                 iconSize: [14, 14],
                 iconAnchor: [7, 7]
             });

             const marker = L.marker([p.lat, p.lng], { icon })
                .addTo(mapInstanceRef.current!)
                .bindPopup(`
                    <div style="font-family: Vazirmatn; text-align: right; direction: rtl; min-width: 150px;">
                        <h4 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${p.title}</h4>
                        <p style="font-size: 11px; color: #666; margin-bottom: 8px;">${p.address}</p>
                        <div style="border-top: 1px solid #eee; padding-top: 4px; color: #10b981; font-weight: bold; font-size: 12px;">
                            ${p.transactionType === 'sale' 
                                ? `${p.priceTotal?.toLocaleString()} تومان` 
                                : `اجاره: ${p.priceRent?.toLocaleString()}`}
                        </div>
                    </div>
                `);
             
             markersRef.current.push(marker);
             bounds.extend([p.lat, p.lng]);
        }
    });

    if (properties.length > 0 && bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Invalidate size to fix rendering if container resized
    setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
    }, 100);

  }, [properties, hideControls]);

  const handleMyLocation = () => {
      if (!mapInstanceRef.current) return;
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            mapInstanceRef.current?.setView([latitude, longitude], 15);
            
            L.circleMarker([latitude, longitude], {
                radius: 8,
                fillColor: '#10b981',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(mapInstanceRef.current!);
        }, (err) => {
            console.error("Geolocation error:", err);
            alert("خطا در دریافت موقعیت مکانی");
        });
      } else {
          alert("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند");
      }
  };

  return (
    <div className="w-full h-full relative z-0">
        <div ref={mapContainerRef} className="w-full h-full bg-gray-100 rounded-3xl overflow-hidden" />
        {!hideControls && (
             <button 
                onClick={handleMyLocation}
                className="absolute bottom-6 right-4 !z-[9999] bg-white p-2 rounded-xl shadow-lg text-slate-700 transition-transform active:scale-95"
             >
                <Navigation size={20} />
             </button>
        )}
    </div>
  );
};
