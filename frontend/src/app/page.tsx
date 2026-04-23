"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Image as ImageIcon, 
  LayoutDashboard, 
  MoreVertical, 
  Plus, 
  Search,
  Video,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Post {
  id: string;
  platform: string;
  status: string;
  publishedAt: string | null;
  externalLink: string | null;
  lastError: string | null;
}

interface Creative {
  id: string;
  day: number;
  category: string;
  hook: string;
  body: string;
  cta: string;
  format: string;
  mediaRequirement: string;
  mediaUrl: string | null;
  videoUrl: string | null;
  posts: Post[];
  plan?: {
    generatedAt: string;
  };
}

export default function Dashboard() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "metrics">("dashboard");

  const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-7377357488-df5a7.firebasestorage.app/o/MotaiCustomers%2FChiroone-Logo-2.png?alt=media&token=142d6e1c-a584-4de7-979b-5401852db595";

  useEffect(() => {
    setMounted(true);
    async function fetchCreatives() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3009";
        const response = await fetch(`${apiUrl}/api/creatives`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        
        // Sort by date: most recent first
        // 1. If publishedAt exists, use the latest publishedAt
        // 2. Otherwise use plan.generatedAt
        // 3. Otherwise use 0
        const sortedData = (data as Creative[]).sort((a, b) => {
          const getLatestDate = (c: Creative) => {
            const publishedDates = c.posts
              .map(p => p.publishedAt)
              .filter((d): d is string => !!d)
              .map(d => new Date(d).getTime());
            
            if (publishedDates.length > 0) {
              return Math.max(...publishedDates);
            }
            
            return c.plan?.generatedAt ? new Date(c.plan.generatedAt).getTime() : 0;
          };

          return getLatestDate(b) - getLatestDate(a);
        });

        setCreatives(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error connecting to server");
      } finally {
        setLoading(false);
      }
    }
    fetchCreatives();
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  const totalCreatives = creatives.length;
  const publishedCount = creatives.reduce((acc, c) => acc + c.posts.filter(p => p.status === "PUBLISHED").length, 0);
  const pendingCount = creatives.reduce((acc, c) => acc + c.posts.filter(p => p.status === "PENDING" || p.status === "READY_TO_PUBLISH").length, 0);

  return (
    <div className="min-h-screen text-[#001A57] bg-white">
      <div className="gradient-bg" />
      
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-24 flex flex-col items-center py-10 gap-12 bg-[#F9FAFB] border-r border-[#001A57]/5 z-50 shadow-sm">
        <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white shadow-md border border-[#001A57]/5 p-2">
           <img src={LOGO_URL} alt="ChiroOne" className="w-full h-auto object-contain" />
        </div>
        
        <div className="flex flex-col gap-10 text-[#001A57]/30">
          <LayoutDashboard 
            className={`w-7 h-7 cursor-pointer transition-all ${activeTab === 'dashboard' ? 'text-[#1A73E8] scale-125' : 'hover:outline-offset-4'}`} 
            onClick={() => setActiveTab('dashboard')}
          />
          <Calendar 
            className={`w-7 h-7 cursor-pointer transition-all ${activeTab === 'calendar' ? 'text-[#1A73E8] scale-125' : 'hover:outline-offset-4'}`}
            onClick={() => setActiveTab('calendar')}
          />
          <BarChart3 
            className={`w-7 h-7 cursor-pointer transition-all ${activeTab === 'metrics' ? 'text-[#1A73E8] scale-125' : 'hover:outline-offset-4'}`}
            onClick={() => setActiveTab('metrics')}
          />
        </div>
        
        <div className="mt-auto">
          <div className="w-12 h-12 rounded-full border-2 border-[#1A73E8]/10 p-1">
             <div className="w-full h-full rounded-full bg-[#E5E7EB]" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-36 pr-12 py-12">
        <header className="flex justify-between items-end mb-16">
          <div>
            <div className="flex items-end gap-4 mb-2">
              <img src={LOGO_URL} alt="ChiroOne" className="h-10 w-auto mb-1" />
              <div className="h-10 w-[2px] bg-[#001A57]/10" />
              <h1 className="text-3xl font-black tracking-tight text-[#001A57]">
                CREATIVES HUB
              </h1>
            </div>
            <p className="text-[#001A57]/50 font-semibold tracking-wide uppercase text-xs">Production Dashboard & Status Monitor</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#001A57]/30 group-focus-within:text-[#1A73E8] transition-colors" />
              <input 
                type="text" 
                placeholder="Search creatives..." 
                className="pl-12 pr-6 py-3 rounded-2xl bg-white border border-[#001A57]/5 focus:outline-none focus:ring-4 focus:ring-[#1A73E8]/5 focus:border-[#1A73E8]/20 transition-all w-72 text-sm font-medium"
              />
            </div>
            <button className="chiro-gradient hover:opacity-90 text-white px-7 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-[#1A73E8]/20 active:scale-95 text-sm uppercase tracking-widest leading-none">
              <Plus className="w-5 h-5" />
              New Creative
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <StatCard title="All Creatives" value={totalCreatives} icon={ImageIcon} color="blue" />
          <StatCard title="Awaiting Media" value={pendingCount} icon={Clock} color="amber" />
          <StatCard title="Ready to Sync" value={publishedCount} icon={CheckCircle2} color="emerald" />
        </div>

        {/* Grid Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black flex items-center gap-3 text-[#001A57]">
              Current Sprint
              <span className="text-xs py-1.5 px-3 bg-[#001A57]/5 text-[#001A57] rounded-xl font-black">
                {creatives.length} UNITS
              </span>
            </h2>
            <div className="flex gap-3">
               <button className="px-5 py-2.5 text-xs font-black rounded-xl bg-white text-[#001A57] border border-[#001A57]/10 uppercase tracking-widest hover:bg-[#F3F4F6] transition-colors">Filters</button>
               <button className="px-5 py-2.5 text-xs font-black rounded-xl bg-white text-[#001A57] border border-[#001A57]/10 uppercase tracking-widest hover:bg-[#F3F4F6] transition-colors">By Day</button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border-2 border-dashed border-[#001A57]/10 shadow-chiro"
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <p className="text-xl font-black text-[#001A57] mb-2 uppercase tracking-tight">Sync Offline</p>
                <p className="text-[#001A57]/40 text-sm mb-8 font-medium">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-[#001A57] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#1A73E8] transition-colors"
                >
                  Reconnect Now
                </button>
              </motion.div>
            ) : activeTab === "dashboard" ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {creatives.map((creative, index) => (
                  <CreativeCard 
                    key={creative.id} 
                    creative={creative} 
                    index={index} 
                    onPreview={() => setSelectedCreative(creative)}
                  />
                ))}
              </motion.div>
            ) : activeTab === "calendar" ? (
              <CalendarView 
                key="calendar"
                creatives={creatives} 
                onPreview={(c) => setSelectedCreative(c)} 
              />
            ) : (
              <MetricsView 
                key="metrics"
                creatives={creatives} 
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedCreative && (
          <DetailsModal 
            creative={selectedCreative} 
            onClose={() => setSelectedCreative(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  const iconColors = {
    blue: "text-[#1A73E8] bg-[#1A73E8]/10",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-500 bg-amber-50"
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[32px] border border-[#001A57]/5 shadow-chiro group hover:shadow-chiro-hover transition-all relative overflow-hidden"
    >
      <div className="flex items-center gap-6 relative z-10">
        <div className={`p-5 rounded-3xl ${iconColors[color as keyof typeof iconColors]} group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-[#001A57]/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
          <p className="text-4xl font-black text-[#001A57] tracking-tight">{value}</p>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity translate-x-1/4 translate-y-1/4 pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>
    </motion.div>
  );
}

function CreativeCard({ creative, index, onPreview }: { creative: Creative, index: number, onPreview: () => void }) {
  const mediaUrl = creative.mediaUrl || "";
  const videoUrl = creative.videoUrl || "";
  
  // Si hay videoUrl, es definitivamente un video.
  // Si no, chequeamos si mediaUrl parece un video.
  const isVideo = !!videoUrl || (
    creative.format.toLowerCase().includes("video") || 
    creative.format.toLowerCase().includes("reel") || 
    mediaUrl.match(/\.(mp4|mov|webm)$|video/i)
  );
    
  const displayVideoUrl = videoUrl || (isVideo ? mediaUrl : "");
  const displayImageUrl = isVideo ? "" : mediaUrl;

  const handleVideoPlay = async (video: HTMLVideoElement) => {
    try {
      if (video.paused) {
        await video.play();
      }
    } catch (err) {
      // Ignorar interrupciones
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[40px] overflow-hidden group border border-[#001A57]/5 shadow-chiro hover:shadow-chiro-hover transition-all duration-500"
    >
      <div className="relative aspect-[4/5] bg-[#F9FAFB] overflow-hidden">
        {displayVideoUrl || displayImageUrl ? (
          displayVideoUrl ? (
            <video 
              key={displayVideoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              onMouseOver={e => handleVideoPlay(e.currentTarget)}
              onMouseOut={e => e.currentTarget.pause()}
              poster={mediaUrl} // Usar mediaUrl como poster si existe
            >
              <source src={displayVideoUrl} type="video/mp4" />
            </video>
          ) : (
             <img 
              src={displayImageUrl} 
              alt={creative.category} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#001A57]/20 gap-4">
             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                {isVideo ? <Video className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pending Generation</span>
          </div>
        )}
        
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <span className="px-4 py-2 bg-white/95 backdrop-blur-md text-[#001A57] text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-sm">
            DAY {creative.day}
          </span>
          <span className="px-4 py-2 chiro-gradient text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-[#1A73E8]/20">
            {creative.format}
          </span>
          {creative.posts[0]?.publishedAt && (
            <span className="px-4 py-2 bg-[#001A57]/80 backdrop-blur-md text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-sm">
              {new Date(creative.posts[0].publishedAt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        
        <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
           <button 
            onClick={onPreview}
            className="w-full py-4 bg-white/95 backdrop-blur-md text-[#001A57] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
           >
             Preview Details
           </button>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between mb-5">
           <span className="text-[10px] font-black text-[#1A73E8] uppercase tracking-[0.2em]">{creative.category}</span>
           <div className="flex -space-x-3">
               {creative.posts.map((post) => (
                 <div 
                  key={post.id} 
                  className={`w-9 h-9 rounded-full border-4 border-white shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    post.status === 'PUBLISHED' ? 'bg-[#10B981]' : 'bg-[#F0F9FF]'
                  }`}
                  title={`${post.platform}: ${post.status}`}
                >
                  <PlatformIcon platform={post.platform} status={post.status} />
                </div>
              ))}
           </div>
        </div>
        
        <h3 className="font-extrabold text-xl leading-snug mb-3 text-[#001A57] group-hover:text-[#1A73E8] transition-colors line-clamp-2 uppercase tracking-tight">
          {creative.hook}
        </h3>
        
        <p className="text-[#001A57]/50 text-sm line-clamp-2 mb-8 font-medium leading-relaxed">
          {creative.body}
        </p>
        
        <div className="flex items-center justify-between pt-6 border-t border-[#001A57]/5">
           <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${creative.posts.some(p => p.status === "PUBLISHED") ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-amber-400"}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001A57]/30">
                {creative.posts.every(p => p.status === "PUBLISHED") ? "Live" : creative.posts.some(p => p.status === "READY_TO_PUBLISH") ? "Ready" : "Staged"}
              </span>
           </div>
           
           <MoreVertical className="w-5 h-5 text-[#001A57]/20 cursor-pointer hover:text-[#001A57] transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

function PlatformIcon({ platform, status }: { platform: string, status?: string }) {
  const p = platform.toLowerCase();
  const isPublished = status === "PUBLISHED";
  
  // Si está publicado, usamos texto blanco para contraste sobre el fondo verde
  const textColor = isPublished ? "text-white" : "";

  if (p.includes("facebook")) return <span className={`text-[11px] font-black ${isPublished ? 'text-white' : 'text-[#1A73E8]'}`}>F</span>;
  if (p.includes("instagram")) return <span className={`text-[11px] font-black ${isPublished ? 'text-white' : 'text-pink-600'}`}>I</span>;
  if (p.includes("tiktok")) return <span className={`text-[11px] font-black ${isPublished ? 'text-white' : 'text-[#001A57]'}`}>T</span>;
  if (p.includes("youtube")) return <span className={`text-[11px] font-black ${isPublished ? 'text-white' : 'text-red-600'}`}>Y</span>;
  return <span className={`text-[11px] font-black ${isPublished ? 'text-white' : 'text-[#001A57]'}`}>{platform[0]}</span>;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[40px] overflow-hidden animate-pulse border border-[#001A57]/5 shadow-chiro">
      <div className="aspect-[4/5] bg-[#F3F4F6]" />
      <div className="p-8">
        <div className="h-3 w-20 bg-[#F3F4F6] rounded-full mb-6" />
        <div className="h-7 w-full bg-[#F3F4F6] rounded-lg mb-3" />
        <div className="h-7 w-2/3 bg-[#F3F4F6] rounded-lg mb-6" />
        <div className="h-4 w-full bg-[#F3F4F6] rounded-lg mb-3" />
        <div className="h-4 w-5/6 bg-[#F3F4F6] rounded-lg" />
      </div>
    </div>
  );
}

function DetailsModal({ creative, onClose }: { creative: Creative, onClose: () => void }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const mediaUrl = creative.mediaUrl || "";
  const videoUrl = creative.videoUrl || "";
  const isVideo = !!videoUrl || (
    creative.format.toLowerCase().includes("video") || 
    creative.format.toLowerCase().includes("reel") || 
    (mediaUrl.match(/\.(mp4|mov|webm)$|video/i))
  );

  const displayVideoUrl = videoUrl || (isVideo ? mediaUrl : "");
  const displayImageUrl = isVideo ? "" : mediaUrl;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3009";
      const res = await fetch(`${apiUrl}/publish?itemId=${creative.id}`);
      if (!res.ok) throw new Error("Sync failed");
      alert("Sincronización manual ejecutada con éxito. Actualizando vista...");
      window.location.reload();
    } catch (e) {
      alert("Error al intentar sincronizar.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001A57]/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-[#001A57]/20 border border-white/20"
      >
        {/* Media Section */}
        <div className="w-full md:w-1/2 bg-[#001A57] flex items-center justify-center relative group min-h-[400px]">
          {displayVideoUrl || displayImageUrl ? (
            displayVideoUrl ? (
              <video 
                src={displayVideoUrl} 
                className="w-full h-full object-contain"
                controls
                autoPlay
                poster={mediaUrl}
              />
            ) : (
              <img 
                src={displayImageUrl} 
                className="w-full h-full object-contain" 
                alt={creative.hook}
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/20">
              <ImageIcon className="w-24 h-24" />
              <p className="font-black uppercase tracking-widest text-sm">Media Placeholder</p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all md:hidden"
          >
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-12 overflow-y-auto bg-white flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-[#1A73E8] uppercase tracking-[0.2em]">{creative.category}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#001A57]/10" />
                <span className="text-[10px] font-black text-[#001A57]/40 uppercase tracking-[0.2em]">Day {creative.day}</span>
              </div>
              <h2 className="text-3xl font-black text-[#001A57] tracking-tight leading-tight uppercase">
                {creative.hook}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-[#001A57] transition-all hidden md:flex"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>
          </div>

          <div className="space-y-10 flex-grow">
            <section>
              <h4 className="text-[10px] font-black text-[#001A57]/30 uppercase tracking-[0.2em] mb-4">Content Copy</h4>
              <div className="bg-[#F9FAFB] p-8 rounded-3xl border border-[#001A57]/5">
                <p className="text-[#001A57]/70 text-base leading-relaxed font-medium italic mb-6">"{creative.body}"</p>
                <div className="flex items-center gap-4 py-4 px-6 bg-white rounded-2xl border border-[#001A57]/5 shadow-sm">
                   <div className="w-2 h-2 rounded-full bg-[#1A73E8]" />
                   <span className="text-xs font-bold text-[#001A57]">CTA: {creative.cta}</span>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-[#001A57]/30 uppercase tracking-[0.2em] mb-4">Production Specs</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-3xl bg-[#F3F4F6]/50 border border-[#001A57]/5">
                   <p className="text-[10px] font-bold text-[#001A57]/40 uppercase mb-2">Format</p>
                   <p className="font-extrabold text-[#001A57]">{creative.format}</p>
                 </div>
                 <div className="p-6 rounded-3xl bg-[#F3F4F6]/50 border border-[#001A57]/5">
                   <p className="text-[10px] font-bold text-[#001A57]/40 uppercase mb-2">Status</p>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" />
                     <p className="font-extrabold text-[#001A57]">Ready</p>
                   </div>
                 </div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-[#001A57]/30 uppercase tracking-[0.2em] mb-4">Platform Sync Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {creative.posts.map(post => (
                  <div key={post.id} className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#001A57]/5 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                      post.status === 'PUBLISHED' ? 'bg-[#10B981]' : 
                      post.status === 'FAILED' ? 'bg-red-100' : 'bg-[#E0F2FE]'
                    }`}>
                       <PlatformIcon platform={post.platform} status={post.status} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-[#001A57] uppercase tracking-widest">{post.platform}</p>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.15em] ${
                          post.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 
                          post.status === 'FAILED' ? 'bg-red-200 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {post.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {post.lastError && (
                        <p className="text-[9px] text-red-500 font-bold mt-1 leading-tight flex items-center gap-1 bg-red-50 p-1.5 rounded-lg border border-red-100">
                          <AlertCircle className="w-2.5 h-2.5" />
                          {post.lastError}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-[#001A57]/30 uppercase tracking-[0.2em] mb-4">Media Requirements</h4>
              <p className="text-xs font-semibold text-[#001A57]/50 leading-loose bg-[#FFFBEB] p-6 rounded-3xl border border-amber-100">
                {creative.mediaRequirement}
              </p>
            </section>
          </div>

          <div className="mt-12 flex gap-4 pt-10 border-t border-[#001A57]/5">
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex-grow py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all ${
                isSyncing 
                  ? "bg-[#E5E7EB] text-[#001A57]/50 cursor-not-allowed" 
                  : "chiro-gradient text-white shadow-[#1A73E8]/20"
              }`}
            >
               {isSyncing ? "Syncing..." : "Sync to Platforms"}
            </button>
            <button className="px-8 py-5 bg-[#F3F4F6] text-[#001A57] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#E5E7EB] transition-all">
               Edit
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CalendarView({ creatives, onPreview }: { creatives: Creative[], onPreview: (c: Creative) => void }) {
  // Agrupar por fecha de publicación real (de la tabla posts)
  const grouped = creatives.reduce((acc, c) => {
    // Buscamos la primera fecha de publicación en sus posts
    const dateStr = c.posts.find(p => p.publishedAt)?.publishedAt;
    const dateKey = dateStr ? new Date(dateStr).toISOString().split('T')[0] : "Sin Fecha";
    
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(c);
    return acc;
  }, {} as Record<string, Creative[]>);

  // Ordenar las fechas cronológicamente
  const dates = Object.keys(grouped).sort((a, b) => {
    if (a === "Sin Fecha") return 1;
    if (b === "Sin Fecha") return -1;
    return b.localeCompare(a);
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-16"
    >
      {dates.map(dateKey => {
        const dateObj = dateKey === "Sin Fecha" ? null : new Date(dateKey + 'T12:00:00');
        const dayName = dateObj ? dateObj.toLocaleDateString('es-ES', { weekday: 'long' }) : "Pendiente";
        const dateLabel = dateObj ? dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : "Fecha no asignada";

        return (
          <div key={dateKey} className="relative">
            <div className="flex items-center gap-8 mb-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#1A73E8] uppercase tracking-[0.3em] mb-1.5">{dayName}</span>
                <h3 className="text-3xl font-black text-[#001A57] tracking-tight uppercase">{dateLabel}</h3>
              </div>
              <div className="h-[2px] flex-grow bg-[#001A57]/5 rounded-full" />
              <div className="flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] rounded-xl border border-[#001A57]/5">
                <span className="text-[10px] font-bold text-[#001A57]/40 uppercase tracking-widest">{grouped[dateKey].length} UNITS</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {grouped[dateKey].map(c => (
                <div 
                  key={c.id}
                  onClick={() => onPreview(c)}
                  className="bg-white p-7 rounded-[32px] border border-[#001A57]/5 shadow-chiro hover:shadow-chiro-hover cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="aspect-square rounded-2xl bg-[#F9FAFB] mb-6 overflow-hidden relative border border-[#001A57]/5">
                     {c.mediaUrl || c.videoUrl ? (
                        c.videoUrl || (c.format.toLowerCase().includes("video") && c.mediaUrl) ? (
                          <div className="w-full h-full relative">
                             <img src={c.mediaUrl || "/api/placeholder/400/400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <Video className="w-8 h-8 text-white/50" />
                             </div>
                          </div>
                        ) : (
                          <img src={c.mediaUrl || "/api/placeholder/400/400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        )
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-[#001A57]/10">
                          <ImageIcon className="w-10 h-10" />
                       </div>
                     )}
                     <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest text-[#001A57] shadow-sm">
                       {c.format}
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-[#1A73E8] uppercase tracking-[0.2em]">{c.category}</span>
                    <h5 className="font-black text-base text-[#001A57] line-clamp-1 uppercase tracking-tight group-hover:text-[#1A73E8] transition-colors">{c.hook}</h5>
                    <div className="flex items-center gap-2 pt-4 border-t border-[#001A57]/5">
                       <div className="flex -space-x-2">
                          {c.posts.map(p => (
                            <div 
                              key={p.id} 
                              className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center overflow-hidden shadow-sm transition-colors ${
                                p.status === 'PUBLISHED' ? 'bg-[#10B981]' : 'bg-[#F0F9FF]'
                              }`}
                              title={`${p.platform}: ${p.status}`}
                            >
                               <PlatformIcon platform={p.platform} status={p.status} />
                            </div>
                          ))}
                       </div>
                       <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

function MetricsView({ creatives }: { creatives: Creative[] }) {
  const categories = Array.from(new Set(creatives.map(c => c.category)));
  const statusCounts = {
    live: creatives.filter(c => c.posts.every(p => p.status === 'PUBLISHED')).length,
    ready: creatives.filter(c => c.posts.some(p => p.status === 'READY_TO_PUBLISH')).length,
    staged: creatives.filter(c => c.posts.every(p => p.status !== 'PUBLISHED' && p.status !== 'READY_TO_PUBLISH')).length
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-10"
    >
      {/* Category Mix */}
      <div className="bg-white p-10 rounded-[40px] border border-[#001A57]/5 shadow-chiro">
        <h4 className="text-xl font-black text-[#001A57] mb-8 uppercase tracking-tight">Category Distribution</h4>
        <div className="space-y-6">
          {categories.map(cat => {
            const count = creatives.filter(c => c.category === cat).length;
            const percentage = (count / creatives.length) * 100;
            return (
              <div key={cat}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-black text-[#001A57] uppercase tracking-wider">{cat}</span>
                  <span className="text-xs font-bold text-[#1A73E8]">{count} Units</span>
                </div>
                <div className="h-3 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full chiro-gradient"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Status */}
      <div className="bg-white p-10 rounded-[40px] border border-[#001A57]/5 shadow-chiro">
        <h4 className="text-xl font-black text-[#001A57] mb-8 uppercase tracking-tight">Sprint Health</h4>
        <div className="grid grid-cols-1 gap-6">
           <MetricStrip label="Live & Published" value={statusCounts.live} color="bg-emerald-500" total={creatives.length} />
           <MetricStrip label="Awaiting Sync" value={statusCounts.ready} color="bg-[#1A73E8]" total={creatives.length} />
           <MetricStrip label="In Production" value={statusCounts.staged} color="bg-amber-400" total={creatives.length} />
        </div>
        
        <div className="mt-12 p-8 rounded-3xl bg-[#001A57]/5 border border-[#001A57]/5">
           <p className="text-[10px] font-black text-[#001A57]/40 uppercase tracking-widest mb-2">Efficiency Rating</p>
           <p className="text-3xl font-black text-[#001A57] tracking-tighter">
             {Math.round((statusCounts.live / creatives.length) * 100)}%
           </p>
           <p className="text-xs font-bold text-[#001A57]/60 mt-2">Completion across all planned platforms.</p>
        </div>
      </div>
    </motion.div>
  );
}

function MetricStrip({ label, value, color, total }: { label: string, value: number, color: string, total: number }) {
  const percentage = (value / total) * 100;
  return (
    <div className="flex items-center gap-6">
      <div className={`w-4 h-4 rounded-full ${color}`} />
      <div className="flex-grow">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#001A57]/60">{label}</span>
          <span className="text-[10px] font-black text-[#001A57]">{value}</span>
        </div>
        <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full">
           <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  );
}
