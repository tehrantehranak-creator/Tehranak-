
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, X, MessageSquare, Bell, StopCircle } from 'lucide-react';
import { chatWithAlexa } from '../services/geminiService';
import { AppNotification, AppContext } from '../types';

interface DynamicIslandProps {
  isExpandedMode: boolean; // True on Home, False elsewhere
  appContext: AppContext;
  alexaEnabled: boolean;
  notifications: AppNotification[];
  onClearNotifications: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({ isExpandedMode, appContext, alexaEnabled, notifications, onClearNotifications }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Voice State
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false); // Toggle for "Always On"
  const [isListeningStatus, setIsListeningStatus] = useState(false); // Actual WebSpeech status
  
  const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // State for Logo/Time Loop
  const [displayMode, setDisplayMode] = useState<'logo' | 'datetime'>('logo');
  const [currentDateTime, setCurrentDateTime] = useState({ time: '', date: '' });

  const [showNotifications, setShowNotifications] = useState(false);
  const [prevNotificationCount, setPrevNotificationCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isVoiceModeRef = useRef(false); // Ref to track state inside callbacks

  // Keep ref synced with state
  useEffect(() => {
      isVoiceModeRef.current = isVoiceModeActive;
  }, [isVoiceModeActive]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExpanded]);

  // Logo/Time Loop Timer (7 Seconds)
  useEffect(() => {
    // Initial Time Set
    const updateTime = () => {
        const now = new Date();
        setCurrentDateTime({
            time: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            date: now.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })
        });
    };
    updateTime();

    const modeInterval = setInterval(() => {
        setDisplayMode(prev => prev === 'logo' ? 'datetime' : 'logo');
    }, 7000);
    
    // Update time every minute just in case
    const timeInterval = setInterval(updateTime, 60000);

    return () => {
        clearInterval(modeInterval);
        clearInterval(timeInterval);
    };
  }, []);

  // --- Text To Speech (Female Voice) ---
  const speak = (text: string) => {
      if (!alexaEnabled) return;
      
      // Clean text from emojis to prevent weird reading
      const cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
      
      // Cancel previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'fa-IR';
      
      // Simulate Female Voice by adjusting pitch and rate
      utterance.pitch = 1.3; 
      utterance.rate = 1.0;
      
      window.speechSynthesis.speak(utterance);
  };

  // --- Auto Speak New Notifications ---
  useEffect(() => {
      if (notifications.length > prevNotificationCount) {
          // New notification arrived
          const latest = notifications[0];
          const shouldSpeak = localStorage.getItem('alexaSpeaksNotifications') === 'true';
          
          if (shouldSpeak && alexaEnabled) {
              const speechText = `پیام جدید: ${latest.title}. ${latest.body}`;
              speak(speechText);
          }
          setPrevNotificationCount(notifications.length);
      } else if (notifications.length < prevNotificationCount) {
          setPrevNotificationCount(notifications.length);
      }
  }, [notifications, alexaEnabled, prevNotificationCount]);

  // --- Speech Recognition (Always On Logic) ---
  useEffect(() => {
      // Initialize Speech Recognition if supported
      if (('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && alexaEnabled) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = 'fa-IR';
          recognition.continuous = false; // We restart manually to avoid timeout issues on some browsers
          recognition.interimResults = false;

          recognition.onstart = () => {
              setIsListeningStatus(true);
          };

          recognition.onend = () => {
              setIsListeningStatus(false);
              // Auto-restart if mode is active
              if (isVoiceModeRef.current) {
                  setTimeout(() => {
                      try {
                          recognition.start();
                      } catch (e) {
                          console.log("Restart ignore", e);
                      }
                  }, 300);
              }
          };

          recognition.onerror = (event: any) => {
              console.error("Speech Error", event.error);
              setIsListeningStatus(false);
              if (event.error === 'not-allowed') {
                  setIsVoiceModeActive(false); // Stop if permission denied
                  alert("دسترسی میکروفون مسدود است.");
              }
          };

          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              handleVoiceInput(transcript);
          };

          recognitionRef.current = recognition;
      }
  }, [alexaEnabled]);

  const toggleVoiceMode = () => {
      if (!alexaEnabled) {
          alert("لطفا ابتدا الکسا را از تنظیمات فعال کنید.");
          return;
      }

      if (!recognitionRef.current) {
          alert("مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند.");
          return;
      }

      if (isVoiceModeActive) {
          // Turn OFF
          setIsVoiceModeActive(false);
          recognitionRef.current.stop();
          window.speechSynthesis.cancel();
      } else {
          // Turn ON
          setIsVoiceModeActive(true);
          try {
            recognitionRef.current.start();
          } catch(e) {
              console.error(e);
          }
      }
  };

  const handleVoiceInput = (text: string) => {
      const lowerText = text.toLowerCase();
      const wakeWords = ['الکسا', 'alexa', 'تهرانک', 'خانم'];
      
      // Check if wake word exists
      const hasWakeWord = wakeWords.some(w => lowerText.includes(w));

      if (hasWakeWord) {
          // Process command
          setInputText(text); // Show what was heard
          // Call handleSendMessage with isVoice=true
          handleSendMessage(text, true);
      } else {
          // Ignore input without wake word
          console.log("Ignored (No wake word):", text);
      }
  };

  const handleSendMessage = async (text: string, isVoice: boolean = false) => {
    if (!text.trim()) return;
    
    // Add User Message
    const newMessages = [...messages, { text, isUser: true }];
    setMessages(newMessages);
    setInputText('');
    setIsThinking(true);

    // Call Gemini Service
    const response = await chatWithAlexa(text, messages.map(m => m.text), appContext);
    
    // Add AI Response
    setMessages([...newMessages, { text: response || '', isUser: false }]);
    
    // Speak if response exists AND (Voice Input was used OR Voice Mode is strictly active)
    if (response && (isVoice || isVoiceModeActive)) {
        speak(response);
    }
    
    setIsThinking(false);
  };

  // Default greeting
  useEffect(() => {
      if (messages.length === 0 && alexaEnabled) {
          setMessages([{ text: "سلام! من الکسا هستم. برای صحبت با من، میکروفون رو روشن کن و صدام بزن!", isUser: false }]);
      }
  }, [alexaEnabled]);

  const toggleExpand = () => {
      setIsExpanded(!isExpanded);
      setShowNotifications(false);
  };

  // Styles based on state
  const containerClass = isExpanded 
    ? "w-[92%] h-[500px] rounded-[40px]" 
    : isExpandedMode 
        ? "w-[180px] h-[36px] rounded-full cursor-pointer hover:w-[190px]" // Home Standby
        : "w-[100px] h-[28px] rounded-full cursor-pointer"; // Other Tabs Standby

  return (
    <div 
        className={`fixed top-2 left-1/2 transform -translate-x-1/2 bg-black transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] z-[60] overflow-hidden shadow-[0_0_20px_rgba(147,51,234,0.35)] border border-white/10 flex flex-col ${containerClass}`}
        onClick={() => !isExpanded && toggleExpand()}
    >
      {/* Collapsed State Content */}
      {!isExpanded && (
        <div className="w-full h-full flex items-center justify-center gap-2 px-3 select-none relative">
            
            {/* Bell Icon (Notification Indicator) */}
            {notifications.length > 0 && isExpandedMode && (
                <div className="absolute left-3 flex items-center justify-center text-yellow-400 animate-pulse">
                    <Bell size={14} fill="currentColor" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
                </div>
            )}

            {/* Loop Content */}
            <div key={displayMode} className="animate-fade-in w-full flex justify-center">
                {displayMode === 'logo' ? (
                    <div className="flex items-center justify-center tracking-[0.15em] font-sans" dir="ltr">
                         <span className="text-[10px] font-extrabold text-gray-300">TEHRA</span>
                         <span className="text-[10px] font-extrabold text-green-500">NAK</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 dir-rtl">
                         <span className="text-[10px] font-extrabold text-gray-200 font-['Vazirmatn']">{currentDateTime.time}</span>
                         {isExpandedMode && <span className="w-1 h-1 bg-gray-600 rounded-full"></span>}
                         {isExpandedMode && <span className="text-[9px] font-bold text-gray-400 font-['Vazirmatn']">{currentDateTime.date}</span>}
                    </div>
                )}
            </div>
            
            {/* Small indicator dot if listening or active */}
            {!isExpandedMode && (
                 <div className={`w-1.5 h-1.5 rounded-full absolute right-3 ${isListeningStatus ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            )}
        </div>
      )}

      {/* Expanded State Content (Chat) */}
      {isExpanded && (
        <div className="flex flex-col h-full w-full p-4" onClick={(e) => e.stopPropagation()}>
           {/* Header */}
           <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                      {isListeningStatus ? (
                          <div className="flex gap-0.5 items-center h-4">
                              <div className="w-1 h-full bg-white animate-[bounce_0.5s_infinite]"></div>
                              <div className="w-1 h-2/3 bg-white animate-[bounce_0.5s_infinite_0.1s]"></div>
                              <div className="w-1 h-full bg-white animate-[bounce_0.5s_infinite_0.2s]"></div>
                          </div>
                      ) : (
                          <span className="font-bold text-white text-xs">A</span>
                      )}
                  </div>
                  <div>
                      <h3 className="font-bold text-white text-sm">الکسا (دستیار صوتی)</h3>
                      <span className={`text-[10px] flex items-center gap-1 ${isVoiceModeActive ? 'text-red-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isVoiceModeActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                          {isVoiceModeActive ? 'گوش‌به‌زنگ...' : 'حالت صوتی خاموش'}
                      </span>
                  </div>
              </div>
              
              <div className="flex gap-2">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 relative">
                      <Bell size={16} className="text-gray-300" />
                      {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                  </button>
                  <button onClick={() => setIsExpanded(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                      <X size={16} className="text-gray-400" />
                  </button>
              </div>
           </div>

           {/* Notification Panel Overlay */}
           {showNotifications && (
               <div className="absolute top-16 left-4 right-4 bg-[#1c1c1e] rounded-2xl z-20 p-3 border border-white/10 shadow-xl animate-slide-up max-h-64 overflow-y-auto">
                   <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white text-xs font-bold">مرکز اعلانات</h4>
                        {notifications.length > 0 && (
                            <button onClick={onClearNotifications} className="text-[10px] text-red-400 hover:text-red-300">پاکسازی همه</button>
                        )}
                   </div>
                   {notifications.length === 0 ? (
                       <p className="text-gray-500 text-xs text-center py-4">پیام جدیدی نیست</p>
                   ) : (
                       notifications.map(n => (
                           <div key={n.id} className="bg-white/5 p-2 rounded-xl mb-2 border-r-2 border-yellow-500">
                               <div className="flex justify-between">
                                   <span className="text-white text-xs font-bold">{n.title}</span>
                                   <span className="text-gray-500 text-[10px]">{n.time}</span>
                               </div>
                               <p className="text-gray-400 text-[10px] mt-1">{n.body}</p>
                           </div>
                       ))
                   )}
               </div>
           )}

           {/* Chat Area */}
           <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 pl-1 custom-scrollbar">
               {messages.map((msg, idx) => (
                   <div key={idx} className={`flex ${msg.isUser ? 'justify-start' : 'justify-end'}`}>
                       <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                           msg.isUser 
                             ? 'bg-[#333333] text-white rounded-br-none' 
                             : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-bl-none shadow-lg shadow-purple-500/20'
                       }`}>
                           {msg.text}
                       </div>
                   </div>
               ))}
               {isThinking && (
                   <div className="flex justify-end">
                       <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                           <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></div>
                           <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></div>
                       </div>
                   </div>
               )}
               <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="flex items-center gap-2 mt-auto relative">
               {!alexaEnabled && (
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-full">
                       <span className="text-[10px] text-gray-300">الکسا غیرفعال است (تنظیمات)</span>
                   </div>
               )}
               
               {/* Toggle Voice Mode Button */}
               <button 
                 onClick={toggleVoiceMode}
                 className={`p-3 rounded-full transition-all duration-500 ${
                     isVoiceModeActive 
                        ? 'bg-red-500 animate-pulse shadow-[0_0_15px_red]' 
                        : 'bg-white/10 hover:bg-white/20'
                 }`}
               >
                   {isVoiceModeActive ? <StopCircle size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
               </button>

               <div className="flex-1 relative">
                   <input 
                     type="text" 
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                     placeholder={isVoiceModeActive ? "گوش‌به‌زنگ... (بگو الکسا)" : "پیام بنویسید..."}
                     disabled={!alexaEnabled}
                     className="w-full bg-[#1c1c1e] border border-white/10 text-white text-right rounded-full py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                   />
               </div>
               <button 
                 onClick={() => handleSendMessage(inputText)}
                 disabled={!alexaEnabled}
                 className="p-2.5 bg-blue-500 rounded-full hover:bg-blue-600 text-white disabled:opacity-50 disabled:bg-gray-600"
               >
                   <Send size={18} />
               </button>
           </div>
        </div>
      )}
      
      <style>{`
        /* Hide scrollbar for chat */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
};
