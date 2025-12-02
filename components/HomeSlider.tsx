
import React, { useEffect, useState, useRef } from 'react';
import { Property } from '../types';

interface HomeSliderProps {
    properties?: Property[];
    onSelectProperty?: (property: Property) => void;
}

export const HomeSlider: React.FC<HomeSliderProps> = ({ properties = [], onSelectProperty }) => {
    // Filter properties that actually have images
    const validProperties = properties.filter(p => p.images && p.images.length > 0);
    
    // Default mock data if no properties have images
    const defaults = [
        { url: "https://picsum.photos/600/400?random=1", title: "پروژه مدرن الهیه", id: 'default-1', data: null },
        { url: "https://picsum.photos/600/400?random=2", title: "برج باغ نیاوران", id: 'default-2', data: null },
        { url: "https://picsum.photos/600/400?random=3", title: "ویلا لواسان", id: 'default-3', data: null }
    ];

    // Prepare slides: Take latest 5 properties or use defaults
    const slides = validProperties.length > 0 
        ? validProperties.slice(0, 5).map(p => ({ url: p.images[0], title: p.title, id: p.id, data: p })) 
        : defaults;

    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    // Swipe Refs
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        if (isPaused || slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length, isPaused]);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsPaused(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        touchStart.current = clientX;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        touchEnd.current = clientX;
    };

    const handleTouchEnd = () => {
        setIsPaused(false);
        if (!touchStart.current || !touchEnd.current) return;
        
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setCurrent(prev => (prev + 1) % slides.length);
        }
        if (isRightSwipe) {
            setCurrent(prev => (prev - 1 + slides.length) % slides.length);
        }
        
        touchStart.current = null;
        touchEnd.current = null;
    };

    const handleSlideClick = (slide: any) => {
        if (slide.data && onSelectProperty) {
            onSelectProperty(slide.data);
        }
    };

    if (slides.length === 0) return null;

    return (
        <div 
            className="relative h-48 w-full perspective-1000 my-6 px-4 select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={() => setIsPaused(false)}
        >
             <div className="relative w-full h-full transform-style-3d">
                 {slides.map((slide, idx) => {
                     // Simple Logic for 3D effect
                     const diff = (idx - current + slides.length) % slides.length;
                     let transform = 'translateZ(-100px) scale(0.9) translateX(0)';
                     let zIndex = 0;
                     let opacity = 0.5;
                     let pointerEvents = 'none';

                     if (diff === 0) {
                         transform = 'translateZ(0) scale(1) translateX(0)';
                         zIndex = 10;
                         opacity = 1;
                         pointerEvents = 'auto';
                     } else if (diff === 1) {
                         transform = 'translateZ(-50px) scale(0.8) translateX(50%)';
                         zIndex = 5;
                     } else if (diff === slides.length - 1) {
                         transform = 'translateZ(-50px) scale(0.8) translateX(-50%)';
                         zIndex = 5;
                     }

                     return (
                         <div 
                            key={slide.id} 
                            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ease-out border border-white/10 cursor-pointer"
                            style={{ transform, zIndex, opacity, pointerEvents: pointerEvents as any }}
                            onClick={() => handleSlideClick(slide)}
                         >
                             <img src={slide.url} className="w-full h-full object-cover" alt={slide.title} />
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                                 <span className="text-white font-bold text-sm truncate block">{slide.title}</span>
                             </div>
                         </div>
                     )
                 })}
             </div>
        </div>
    )
}
