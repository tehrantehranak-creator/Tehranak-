import React from 'react';
import { Property, Client } from '../types';
import { Phone, Copy, Trash, Edit, Download, MapPin, Share2 } from 'lucide-react';

interface PropertyCardProps {
    property: Property;
    onDelete: () => void;
    onEdit: () => void;
    onClick?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onDelete, onEdit, onClick }) => {

    const copyInfo = () => {
        const priceInfo = property.transactionType === 'sale'
            ? `قیمت کل: ${property.priceTotal?.toLocaleString()} تومان`
            : `ودیعه: ${property.priceDeposit?.toLocaleString()} تومان | اجاره: ${property.priceRent?.toLocaleString()} تومان`;

        const text = `
        ${property.title}
        آدرس: ${property.address}
        متراژ: ${property.area} متر
        ${priceInfo}
        توضیحات: ${property.description}
        `.trim();
        navigator.clipboard.writeText(text);
        alert("اطلاعات کپی شد");
    }

    const downloadImage = async () => {
        if (property.images && property.images.length > 0) {
             const imageUrl = property.images[0];
             
             try {
                 if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
                     const link = document.createElement('a');
                     link.href = imageUrl;
                     link.download = `property-${property.id}.jpg`;
                     document.body.appendChild(link);
                     link.click();
                     document.body.removeChild(link);
                     return;
                 }

                 const response = await fetch(imageUrl);
                 if (!response.ok) throw new Error('Network response was not ok');
                 
                 const blob = await response.blob();
                 const url = window.URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = `property-${property.id}.jpg`;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 window.URL.revokeObjectURL(url);
             } catch (error) {
                 console.error("Download error, falling back to direct link:", error);
                 const link = document.createElement('a');
                 link.href = imageUrl;
                 link.target = '_blank';
                 link.download = `property-${property.id}.jpg`;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
             }
        }
    }

    const handleShare = async () => {
        const priceText = property.transactionType === 'sale' 
            ? `قیمت: ${property.priceTotal?.toLocaleString()} تومان` 
            : `رهن: ${property.priceDeposit?.toLocaleString()} | اجاره: ${property.priceRent?.toLocaleString()}`;

        const shareText = `
🏠 ${property.title}
📍 ${property.address}
📏 ${property.area} متر | ${property.type}
💰 ${priceText}

${property.description}

شماره تماس: ${property.ownerPhone}
`.trim();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: property.title,
                    text: shareText,
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            navigator.clipboard.writeText(shareText);
            alert("متن آگهی برای اشتراک‌گذاری کپی شد");
        }
    };

    return (
        <div 
            className="bg-white dark:bg-[#1c1c1e] dark:backdrop-blur-md dark:bg-opacity-60 rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 mb-4 shadow-lg dark:shadow-lg group transition-colors duration-300 cursor-pointer active:scale-95 transform transition-transform"
            onClick={onClick}
        >
            <div className="relative h-48 w-full overflow-hidden">
                <img src={property.images[0] || "https://picsum.photos/600/400"} className="w-full h-full object-cover" alt={property.title} />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-xs text-white border border-white/10">
                    {property.category === 'commercial' ? 'تجاری' : 'مسکونی'}
                </div>
            </div>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{property.type} {property.area} متری</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 mt-1"><MapPin size={10}/> {property.address}</p>
                    </div>
                    <div className="text-left">
                         {property.transactionType === 'sale' ? (
                             <span className="block text-green-600 dark:text-green-400 font-bold text-sm">
                                 {property.priceTotal?.toLocaleString()} <span className="text-[10px]">تومان</span>
                             </span>
                         ) : (
                             <div className="flex flex-col items-end">
                                <span className="block text-green-600 dark:text-green-400 font-bold text-sm">
                                    اجاره: {property.priceRent?.toLocaleString()}
                                </span>
                                {property.priceDeposit && (
                                    <span className="text-gray-400 text-xs mt-0.5">
                                        ودیعه: {property.priceDeposit.toLocaleString()}
                                    </span>
                                )}
                             </div>
                         )}
                    </div>
                </div>

                <div className="flex gap-2 mt-3 border-t border-gray-100 dark:border-white/5 pt-3">
                     <ActionBtn icon={<Phone size={16}/>} onClick={() => window.location.href=`tel:${property.ownerPhone}`} color="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400" />
                     <ActionBtn icon={<Share2 size={16}/>} onClick={handleShare} color="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" />
                     <ActionBtn icon={<Copy size={16}/>} onClick={copyInfo} color="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" />
                     <ActionBtn icon={<Download size={16}/>} onClick={downloadImage} color="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400" />
                     <div className="flex-1"></div>
                     <ActionBtn icon={<Edit size={16}/>} onClick={onEdit} color="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300" />
                     <ActionBtn icon={<Trash size={16}/>} onClick={onDelete} color="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400" />
                </div>
            </div>
        </div>
    )
}

interface ClientCardProps {
    client: Client;
    onDelete: () => void;
    onEdit: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onDelete, onEdit }) => (
    <div className="bg-white dark:bg-[#1c1c1e] backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-white/10 mb-3 flex flex-col gap-2 shadow-sm">
        <div className="flex justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold">
                     {client.name.charAt(0)}
                 </div>
                 <div>
                     <h4 className="text-slate-800 dark:text-white font-bold">{client.name}</h4>
                     <span className="text-xs text-gray-500 dark:text-gray-400">{client.requestType === 'sale' ? 'خرید' : 'اجاره'} {client.propertyType === 'commercial' ? 'تجاری' : 'مسکونی'}</span>
                 </div>
             </div>
             <span className="text-xs bg-gray-100 dark:bg-white/5 px-2 py-1 rounded h-fit text-gray-500 dark:text-gray-400">{client.date}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-black/20 p-2 rounded-xl">
            <span>بودجه: {client.budgetMax?.toLocaleString()}</span>
            <span>منطقه: {client.locationPref}</span>
        </div>

        {client.reminders && client.reminders.length > 0 && (
            <div className="mt-1 text-[10px] text-purple-600 dark:text-purple-300 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                یادآوری: {client.reminders[0].date} ساعت {client.reminders[0].time}
            </div>
        )}

        <div className="flex gap-2 mt-2 justify-end">
             <ActionBtn icon={<Phone size={14}/>} onClick={() => window.location.href=`tel:${client.phone}`} color="bg-green-500/10 text-green-600 dark:text-green-400 p-2" />
             <ActionBtn icon={<Edit size={14}/>} onClick={onEdit} color="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300 p-2" />
             <ActionBtn icon={<Trash size={14}/>} onClick={onDelete} color="bg-red-500/10 text-red-600 dark:text-red-400 p-2" />
        </div>
    </div>
)

interface ActionBtnProps {
    icon: React.ReactNode;
    onClick: () => void;
    color: string;
}

const ActionBtn: React.FC<ActionBtnProps> = ({ icon, onClick, color }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`rounded-xl flex items-center justify-center transition-colors ${color} ${color.includes('p-') ? '' : 'p-2'}`}>
        {icon}
    </button>
)
