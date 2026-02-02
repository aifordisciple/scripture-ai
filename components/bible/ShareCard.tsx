// components/bible/ShareCard.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Image as ImageIcon, Upload, AlignLeft, AlignCenter, AlignRight, Type, Layout, Quote, Frame, Clapperboard, Columns, StickyNote, Minus, MoveVertical, Palette, Info, Eye, Settings2, Share2, X } from "lucide-react";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

const UNSPLASH_PRESETS = [
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1494548162494-384bba4ab999?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1519681393798-2f61f2a55db8?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1491466424936-e304919aada7?q=80&w=1080&auto=format&fit=crop", 
];

const GRADIENT_PRESETS = [
  { name: "纯净白", bg: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", text: "#333333", info: "#666666" },
  { name: "宁静灰", bg: "linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)", text: "#333333", info: "#555555" },
  { name: "梦幻紫", bg: "linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)", text: "#ffffff", info: "#f0f0f0" },
  { name: "深海蓝", bg: "linear-gradient(to top, #30cfd0 0%, #330867 100%)", text: "#ffffff", info: "#cccccc" },
  { name: "清新绿", bg: "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)", text: "#333333", info: "#555555" },
  { name: "极光绿", bg: "linear-gradient(to right, #43e97b 0%, #38f9d7 100%)", text: "#333333", info: "#444444" },
  { name: "深邃夜", bg: "linear-gradient(to top, #09203f 0%, #537895 100%)", text: "#ffffff", info: "#aaaaaa" },
  { name: "暖阳",   bg: "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)", text: "#333333", info: "#666666" },
];

const FONT_OPTIONS = [
  { name: "宋体 (默认)", value: "'Noto Serif SC', serif" },
  { name: "黑体", value: "'Noto Sans SC', sans-serif" },
  { name: "楷体", value: "'KaiTi', 'STKaiti', serif" },
  { name: "系统宋体", value: "ui-serif, Georgia, serif" },
  { name: "系统黑体", value: "ui-sans-serif, system-ui, sans-serif" },
];

type LayoutMode = 'classic' | 'poster' | 'card' | 'modern' | 'split' | 'frame' | 'film' | 'minimal' | 'magazine' | 'stamp';

// 稳健的图片加载：使用我们的 API 代理
const proxyImageLoad = async (originalUrl: string): Promise<string> => {
  // 本地上传的图片已经是 base64，直接返回
  if (originalUrl.startsWith('data:')) return originalUrl;
  
  // 这里的 /api/proxy 是我们刚刚创建的路由
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
  
  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Proxy fetch failed');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Proxy failed, falling back to original", e);
    return originalUrl;
  }
};

export function ShareCard() {
  const { isShareOpen, closeShareModal, shareData } = useBibleStore();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("生成中...");
  const [mobileTab, setMobileTab] = useState<'preview' | 'settings'>('preview');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [verseContent, setVerseContent] = useState<string[]>([]);
  const [bookName, setBookName] = useState(""); 
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgGradient, setBgGradient] = useState<string>(GRADIENT_PRESETS[0].bg);
  
  // 颜色配置
  const [recMainColor, setRecMainColor] = useState<string>(GRADIENT_PRESETS[0].text);
  const [recInfoColor, setRecInfoColor] = useState<string>(GRADIENT_PRESETS[0].info);
  const [textColor, setTextColor] = useState(GRADIENT_PRESETS[0].text);
  const [infoColor, setInfoColor] = useState(GRADIENT_PRESETS[0].info);

  // 排版配置
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('classic');
  const [fontSize, setFontSize] = useState(22);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainColorRef = useRef<HTMLInputElement>(null);
  const infoColorRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const formatVerseRange = (verses: number[]) => {
    if (!verses || verses.length === 0) return "";
    const sorted = [...verses].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) prev = sorted[i];
      else { ranges.push(start === prev ? `${start}` : `${start}-${prev}`); start = sorted[i]; prev = sorted[i]; }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    return ranges.join(", ");
  };

  useEffect(() => {
    if (isShareOpen && shareData) {
      setBookName(shareData.book); 
      async function loadVerses() {
        try {
          const res = await fetch(`/api/bible?book=${shareData?.book}&chapter=${shareData?.chapter}`);
          const json = await res.json();
          const verses = json.data.filter((v: any) => shareData?.verses.includes(v.verse) && v.version === 'CUV');
          setVerseContent(verses.map((v: any) => v.content));
          if (verses.length > 0 && verses[0].bookName) setBookName(verses[0].bookName);
        } catch (e) { console.error(e); }
      }
      loadVerses();
      
      setBgImage(null);
      setBgGradient(GRADIENT_PRESETS[0].bg);
      setRecMainColor(GRADIENT_PRESETS[0].text);
      setRecInfoColor(GRADIENT_PRESETS[0].info);
      setTextColor(GRADIENT_PRESETS[0].text);
      setInfoColor(GRADIENT_PRESETS[0].info);
      setLayoutMode('classic');
      setTextAlign('center');
      setFontSize(22);
      setLineHeight(1.8);
      setFontFamily(FONT_OPTIONS[0].value);
      setMobileTab('preview'); 
      setGeneratedImageUrl(null);
    }
  }, [isShareOpen, shareData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setBgImage(`url(${event.target.result})`);
                setTextColor("#ffffff"); 
                setInfoColor("#e5e5e5");
                setRecMainColor("#ffffff");
                setRecInfoColor("#e5e5e5");
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    if (mode === 'card' || mode === 'split') {
        setTextColor('#333333');
        setInfoColor('#666666');
        setTextAlign('left');
    }
    else if (mode === 'poster' || mode === 'film') {
        setTextColor('#ffffff');
        setInfoColor('#cccccc');
        setTextAlign(mode === 'film' ? 'center' : 'left');
    }
    else {
        setTextColor(recMainColor);
        setInfoColor(recInfoColor);
        if (mode === 'magazine') setTextAlign('right');
        else if (['minimal', 'stamp', 'classic'].includes(mode)) setTextAlign('center');
        else setTextAlign('left');
    }
  };

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    
    let finalStyle: any = { transform: 'none' };
    
    // 1. 如果使用了网络背景图，通过 API 代理获取，彻底解决 CORS
    if (bgImage && bgImage.startsWith('url(http')) {
        setLoadingText("加载资源...");
        try {
            const url = bgImage.slice(4, -1).replace(/["']/g, ""); 
            const base64Bg = await proxyImageLoad(url);
            finalStyle.backgroundImage = `url(${base64Bg})`;
        } catch (e) {
            console.warn("Background load error, using gradient fallback");
            finalStyle.backgroundImage = 'none';
            finalStyle.background = bgGradient;
        }
    }

    setLoadingText("渲染中...");
    
    // 2. 尝试生成 (包含重试逻辑)
    let attempts = 0;
    while (attempts < 2) {
        try {
            const dataUrl = await toPng(cardRef.current, { 
                cacheBust: false, // 代理已处理缓存，关闭此项以避免二次请求
                pixelRatio: 3, 
                width: 340, 
                height: cardRef.current.scrollHeight,
                style: finalStyle 
            });
            if (dataUrl.length > 1000) return dataUrl;
        } catch (e) {
            console.warn(`Attempt ${attempts + 1} failed:`, e);
        }
        attempts++;
        await new Promise(r => setTimeout(r, 500));
    }
    return null;
  };

  const handleDownload = async () => {
    setLoading(true);
    setLoadingText("准备中...");
    
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) throw new Error("生成失败");

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // --- 移动端逻辑 ---
      if (isMobile) {
          // 优先尝试原生分享
          if (navigator.share) {
              try {
                  const blob = await (await fetch(dataUrl)).blob();
                  const file = new File([blob], `scripture-${Date.now()}.png`, { type: 'image/png' });
                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                      setLoadingText("调起分享...");
                      await navigator.share({
                          files: [file],
                          title: '分享经文',
                          text: '来自 Scripture AI 的经文卡片'
                      });
                      setLoading(false);
                      return; 
                  }
              } catch (err) {
                  console.warn("Share API failed", err);
              }
          }
          // 移动端兜底：弹窗展示
          setGeneratedImageUrl(dataUrl);
      } 
      // --- PC 端逻辑 ---
      else {
          // 恢复直接下载
          const link = document.createElement("a");
          link.download = `scripture-share-${Date.now()}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }

    } catch (e) {
      console.error("Critical error:", e);
      alert("生成失败，请尝试简化样式或更换背景。");
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const diffX = touchStartRef.current.x - e.changedTouches[0].clientX;
    const diffY = touchStartRef.current.y - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 50) {
        if (diffX > 0 && mobileTab === 'preview') setMobileTab('settings'); 
        if (diffX < 0 && mobileTab === 'settings') setMobileTab('preview'); 
    }
    touchStartRef.current = null;
  };

  if (!isShareOpen || !shareData) return null;

  const containerStyle = bgImage 
    ? { backgroundImage: bgImage, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: bgGradient };

  return (
    <Dialog open={isShareOpen} onOpenChange={(open) => !open && closeShareModal()}>
      <DialogContent className="sm:max-w-5xl bg-white dark:bg-slate-900 border-none p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[700px]">
        
        {/* --- 结果预览 / 兜底保存层 --- */}
        {generatedImageUrl && (
            <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative w-full max-w-sm flex flex-col items-center h-full justify-center">
                    <div className="w-full flex justify-end mb-4 absolute top-4 right-0 z-10">
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white hover:bg-white/20 rounded-full px-4 border border-white/30 bg-black/20 backdrop-blur-md"
                            onClick={() => setGeneratedImageUrl(null)}
                        >
                            <X className="w-4 h-4 mr-2" /> 关闭
                        </Button>
                    </div>
                    
                    <img 
                        src={generatedImageUrl} 
                        alt="Generated Card" 
                        className="w-auto max-h-[70vh] shadow-2xl rounded-lg border border-white/10 object-contain" 
                    />
                    
                    <div className="mt-6 text-center space-y-2 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/5 w-full">
                        <p className="text-white font-bold text-lg flex items-center justify-center gap-2 animate-pulse">
                            <Share2 className="w-5 h-5" />
                            长按图片保存
                        </p>
                        <p className="text-white/60 text-sm">生成的图片已就绪</p>
                    </div>
                </div>
            </div>
        )}

        {/* 移动端 Tab 导航栏 */}
        <div className="md:hidden flex items-center border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button onClick={() => setMobileTab('preview')} className={cn("flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative", mobileTab === 'preview' ? "text-blue-600 dark:text-blue-400" : "text-slate-500")}>
                <Eye className="w-4 h-4" /> 预览
                {mobileTab === 'preview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
            <button onClick={() => setMobileTab('settings')} className={cn("flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative", mobileTab === 'settings' ? "text-blue-600 dark:text-blue-400" : "text-slate-500")}>
                <Settings2 className="w-4 h-4" /> 设置
                {mobileTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
        </div>

        {/* 主容器 */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            
            {/* 左侧：预览区域 */}
            <div className={cn(
                "bg-slate-100 dark:bg-black/50 items-center justify-center p-6 overflow-auto transition-all duration-300",
                "md:flex md:flex-1 md:w-auto",
                mobileTab === 'preview' ? "flex flex-1 w-full h-full" : "hidden"
            )}>
              <div className="transform md:scale-100 scale-90 origin-center transition-transform duration-300">
                <div 
                    ref={cardRef}
                    className={cn(
                        "w-[340px] min-h-[540px] shadow-2xl relative flex flex-col transition-all duration-300 overflow-hidden bg-white",
                        layoutMode === 'card' ? "p-6" : "p-0",
                        layoutMode === 'frame' ? "p-3" : "",
                    )}
                    style={
                        (layoutMode === 'card' || layoutMode === 'split') 
                        ? { background: layoutMode === 'split' ? '#fff' : bgImage ? containerStyle.backgroundImage : bgGradient, backgroundSize: 'cover', backgroundPosition: 'center' } 
                        : { ...containerStyle }
                    }
                >
                    {/* ... 装饰层保持不变 ... */}
                    {layoutMode === 'film' && (
                        <>
                            <div className="absolute top-0 left-0 right-0 h-[10%] bg-black z-10" />
                            <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-black z-10" />
                            <div className="absolute inset-0 bg-black/20 z-0" /> 
                        </>
                    )}
                    {layoutMode === 'poster' && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0 pointer-events-none" />
                    )}
                    {layoutMode === 'split' && (
                        <div className="absolute top-0 left-0 right-0 h-[55%] z-0" style={{ ...containerStyle }} />
                    )}

                    <div className={cn(
                        "relative z-10 flex flex-col h-full transition-all",
                        layoutMode === 'card' ? "bg-white shadow-lg p-8 rounded-lg" : "p-8",
                        layoutMode === 'split' ? "pt-[60%] px-8 pb-8" : "", 
                        layoutMode === 'poster' || layoutMode === 'film' ? "justify-end pb-12" : "justify-center",
                        layoutMode === 'frame' ? "border border-current" : "",
                        layoutMode === 'stamp' ? "justify-center items-center" : ""
                    )}
                    style={{ 
                        fontFamily: fontFamily,
                        color: (layoutMode === 'card' || layoutMode === 'split') ? '#333' : textColor,
                        borderColor: (layoutMode === 'card' || layoutMode === 'split') ? '#333' : textColor,
                        textShadow: (['classic', 'modern', 'minimal', 'frame'].includes(layoutMode) && bgImage) ? '0 1px 3px rgba(0,0,0,0.6)' : 'none'
                    }}
                    >
                        <div className={cn(
                            "flex-1 flex flex-col justify-center",
                            layoutMode === 'stamp' ? "bg-white/90 dark:bg-black/60 backdrop-blur-sm p-6 shadow-sm max-h-min rounded-sm" : ""
                        )}>
                            {layoutMode === 'modern' && <div className="w-12 h-1 bg-current mb-6 opacity-80" />}
                            {layoutMode === 'magazine' && <Quote className="w-12 h-12 mb-4 opacity-30 rotate-180" />}
                            {layoutMode === 'minimal' && <div className="w-8 h-[1px] bg-current mx-auto mb-6 opacity-60" />}

                            {verseContent.map((v, i) => (
                                <p key={i} className="mb-4 font-medium" style={{ fontSize: fontSize, textAlign: textAlign, lineHeight: lineHeight }}>
                                    {v}
                                </p>
                            ))}

                            {layoutMode === 'minimal' && <div className="w-8 h-[1px] bg-current mx-auto mt-2 opacity-60" />}
                        </div>

                        <div className={cn(
                            "mt-6 pt-4 flex", 
                            layoutMode === 'modern' ? "flex-col items-start border-t border-current/30" : "justify-between items-end border-t border-current/20",
                            layoutMode === 'poster' || layoutMode === 'film' ? "border-white/30" : "",
                            layoutMode === 'minimal' ? "border-none justify-center flex-col items-center gap-1" : "",
                            layoutMode === 'split' ? "border-slate-200" : ""
                        )}
                        style={{ 
                            color: (layoutMode === 'card' || layoutMode === 'split') ? '#666' : infoColor,
                            borderColor: (layoutMode === 'card' || layoutMode === 'split') ? '#eee' : infoColor 
                        }}
                        >
                            <div className={cn(layoutMode === 'modern' ? "mt-2" : "")}>
                                <div className={cn("font-bold", layoutMode === 'magazine' ? "text-xl italic" : "text-sm")}>
                                    {bookName} {shareData.chapter}:{formatVerseRange(shareData.verses)}
                                </div>
                                {layoutMode === 'modern' && (
                                    <div className="text-xs opacity-70 mt-1">Scripture AI Daily Verse</div>
                                )}
                            </div>
                            {layoutMode !== 'modern' && layoutMode !== 'minimal' && (
                                <div className="text-[10px] uppercase tracking-widest opacity-70">Scripture AI</div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* 右侧：控制面板 */}
            <div className={cn(
                "bg-white dark:bg-slate-900 flex-col transition-all duration-300",
                "md:w-96 md:border-l dark:border-slate-800 md:flex",
                mobileTab === 'settings' ? "flex flex-1 w-full h-full" : "hidden"
            )}>
                <DialogHeader className="hidden md:block p-4 border-b dark:border-slate-800">
                    <DialogTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <ImageIcon className="w-5 h-5" /> 经文卡片定制
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <Tabs defaultValue="layout" className="w-full">
                        <TabsList className="w-full mb-4 grid grid-cols-3">
                            <TabsTrigger value="layout">版式</TabsTrigger>
                            <TabsTrigger value="bg">背景</TabsTrigger>
                            <TabsTrigger value="text">文字</TabsTrigger>
                        </TabsList>

                        {/* ... (Tabs Content 保持不变) ... */}
                        <TabsContent value="layout" className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <LayoutButton mode="classic" current={layoutMode} set={handleLayoutChange} label="经典" icon={<Layout className="w-5 h-5"/>} />
                                <LayoutButton mode="poster" current={layoutMode} set={handleLayoutChange} label="海报" icon={<ImageIcon className="w-5 h-5"/>} />
                                <LayoutButton mode="card" current={layoutMode} set={handleLayoutChange} label="卡片" icon={<StickyNote className="w-5 h-5"/>} />
                                <LayoutButton mode="modern" current={layoutMode} set={handleLayoutChange} label="现代" icon={<AlignLeft className="w-5 h-5"/>} />
                                <LayoutButton mode="split" current={layoutMode} set={handleLayoutChange} label="分割" icon={<Columns className="w-5 h-5"/>} />
                                <LayoutButton mode="frame" current={layoutMode} set={handleLayoutChange} label="画框" icon={<Frame className="w-5 h-5"/>} />
                                <LayoutButton mode="film" current={layoutMode} set={handleLayoutChange} label="电影" icon={<Clapperboard className="w-5 h-5"/>} />
                                <LayoutButton mode="minimal" current={layoutMode} set={handleLayoutChange} label="极简" icon={<Minus className="w-5 h-5"/>} />
                                <LayoutButton mode="magazine" current={layoutMode} set={handleLayoutChange} label="杂志" icon={<Type className="w-5 h-5"/>} />
                                <LayoutButton mode="stamp" current={layoutMode} set={handleLayoutChange} label="印记" icon={<Quote className="w-5 h-5"/>} />
                            </div>
                        </TabsContent>

                        <TabsContent value="bg" className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">精选美图</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {UNSPLASH_PRESETS.map((url, i) => (
                                        <button key={i} onClick={() => { setBgImage(`url(${url})`); setRecMainColor("#ffffff"); setRecInfoColor("#e5e5e5"); if (!['card', 'split'].includes(layoutMode)) { setTextColor('#ffffff'); setInfoColor('#e5e5e5'); } }} className={cn("w-full aspect-square rounded-md bg-cover bg-center border-2 hover:border-blue-500 hover:scale-105 transition-all shadow-sm", bgImage?.includes(url) ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent")} style={{ backgroundImage: `url(${url})` }} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">简约渐变</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {GRADIENT_PRESETS.map((g, i) => (
                                        <button key={i} onClick={() => { setBgImage(null); setBgGradient(g.bg); setRecMainColor(g.text); setRecInfoColor(g.info); if (!['card', 'split', 'poster', 'film'].includes(layoutMode)) { setTextColor(g.text); setInfoColor(g.info); } }} className={cn("w-full aspect-square rounded-full border shadow-sm hover:scale-110 transition-transform", bgGradient === g.bg && !bgImage && "ring-2 ring-blue-500 ring-offset-2")} style={{ background: g.bg }} title={g.name} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">自定义</label>
                                <div className="relative">
                                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> 上传本地图片</Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="text" className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Type className="w-3 h-3"/> 字体</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FONT_OPTIONS.map((f, i) => (
                                        <button key={i} onClick={() => setFontFamily(f.value)} className={cn("px-2 py-1.5 text-xs border rounded hover:bg-slate-50 text-left truncate", fontFamily === f.value && "border-blue-500 text-blue-600 bg-blue-50/50")} style={{ fontFamily: f.value }}>{f.name}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 flex items-center justify-between"><span>字号</span><span>{fontSize}px</span></label>
                                <Slider value={[fontSize]} min={14} max={48} step={1} onValueChange={(val) => setFontSize(val[0])} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 flex items-center justify-between"><span className="flex items-center gap-1"><MoveVertical className="w-3 h-3"/> 行间距</span><span>{lineHeight}</span></label>
                                <Slider value={[lineHeight]} min={1.0} max={3.0} step={0.1} onValueChange={(val) => setLineHeight(val[0])} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500">对齐方式</label>
                                <div className="flex gap-2">
                                    <Button variant={textAlign === 'left' ? 'secondary' : 'outline'} size="sm" onClick={() => setTextAlign('left')} className="flex-1"><AlignLeft className="w-4 h-4" /></Button>
                                    <Button variant={textAlign === 'center' ? 'secondary' : 'outline'} size="sm" onClick={() => setTextAlign('center')} className="flex-1"><AlignCenter className="w-4 h-4" /></Button>
                                    <Button variant={textAlign === 'right' ? 'secondary' : 'outline'} size="sm" onClick={() => setTextAlign('right')} className="flex-1"><AlignRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500">正文颜色</label>
                                <div className="flex gap-3 flex-wrap items-center">
                                    {['#ffffff', '#f8f9fa', '#e2e8f0', '#333333', '#1a202c', '#000000', '#2b6cb0', '#2f855a', '#c53030'].map(c => (
                                        <button key={c} onClick={() => setTextColor(c)} className={cn("w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110", textColor === c && "ring-2 ring-blue-500 ring-offset-2")} style={{ backgroundColor: c }} />
                                    ))}
                                    <div className="relative">
                                        <button onClick={() => mainColorRef.current?.click()} className="w-8 h-8 rounded-full border border-dashed border-slate-400 flex items-center justify-center hover:bg-slate-100" title="自定义颜色"><Palette className="w-4 h-4 text-slate-500" /></button>
                                        <input ref={mainColorRef} type="color" className="absolute opacity-0 w-0 h-0" onChange={(e) => setTextColor(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 border-t pt-3">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Info className="w-3 h-3"/> 信息颜色 (出处/Logo)</label>
                                <div className="flex gap-3 flex-wrap items-center">
                                    {['#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000'].map(c => (
                                        <button key={c} onClick={() => setInfoColor(c)} className={cn("w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110", infoColor === c && "ring-2 ring-blue-500 ring-offset-2")} style={{ backgroundColor: c }} />
                                    ))}
                                    <div className="relative">
                                        <button onClick={() => infoColorRef.current?.click()} className="w-6 h-6 rounded-full border border-dashed border-slate-400 flex items-center justify-center hover:bg-slate-100" title="自定义颜色"><Palette className="w-3 h-3 text-slate-500" /></button>
                                        <input ref={infoColorRef} type="color" className="absolute opacity-0 w-0 h-0" onChange={(e) => setInfoColor(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                    <Button onClick={handleDownload} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-[1.02]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                            <div className="flex items-center">
                                <Share2 className="w-4 h-4 mr-2 md:hidden" /> 
                                <Download className="w-4 h-4 mr-2 hidden md:block" />
                                <span className="md:hidden">分享/保存图片</span>
                                <span className="hidden md:inline">保存图片</span>
                            </div>
                        )}
                        {loading && <span className="ml-2 text-xs opacity-80">{loadingText}</span>}
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LayoutButton({ mode, current, set, label, icon }: any) {
    return (
        <button 
            onClick={() => set(mode)} 
            className={cn(
                "p-3 border rounded-lg hover:bg-slate-50 flex flex-col items-center gap-2 transition-all", 
                current === mode && "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 text-blue-600"
            )}
        >
            <div className={cn("text-slate-500", current === mode && "text-blue-500")}>{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    )
}