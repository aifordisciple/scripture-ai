// components/bible/ShareCard.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Image as ImageIcon, Upload, AlignLeft, AlignCenter, AlignRight, Type, Layout, Quote, Frame, Clapperboard, Columns, StickyNote, Minus, MoveVertical, Palette, Info, Eye, Settings2, Share2, X, RefreshCw, ChevronLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

// --- 资源库 ---
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
];

type LayoutMode = 'classic' | 'poster' | 'card' | 'modern' | 'split' | 'frame' | 'film' | 'minimal' | 'magazine' | 'stamp';

export function ShareCard() {
  const { isShareOpen, closeShareModal, shareData } = useBibleStore();
  
  // 核心状态
  const [step, setStep] = useState<'edit' | 'result'>('edit');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("准备中...");
  const [resultImg, setResultImg] = useState<string | null>(null);

  // 内容状态
  const [verseContent, setVerseContent] = useState<string[]>([]);
  const [bookName, setBookName] = useState(""); 
  
  // 样式状态
  const [safeBgImage, setSafeBgImage] = useState<string | null>(null); // Base64
  const [selectedBgUrl, setSelectedBgUrl] = useState<string | null>(null);
  const [bgGradient, setBgGradient] = useState<string>(GRADIENT_PRESETS[0].bg);
  
  const [recMainColor, setRecMainColor] = useState<string>(GRADIENT_PRESETS[0].text);
  const [recInfoColor, setRecInfoColor] = useState<string>(GRADIENT_PRESETS[0].info);
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('classic');
  const [fontSize, setFontSize] = useState(22);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [textColor, setTextColor] = useState(GRADIENT_PRESETS[0].text);
  const [infoColor, setInfoColor] = useState(GRADIENT_PRESETS[0].info);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainColorRef = useRef<HTMLInputElement>(null);
  const infoColorRef = useRef<HTMLInputElement>(null);

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
      setStep('edit'); 
      setResultImg(null);
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
      
      setSafeBgImage(null);
      setSelectedBgUrl(null);
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
    }
  }, [isShareOpen, shareData]);

  // 图片代理处理 (API proxy -> Base64)
  const handleBgSelect = async (url: string) => {
      setSelectedBgUrl(url);
      setLoading(true);
      
      try {
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
          const res = await fetch(proxyUrl);
          if (!res.ok) throw new Error("Load failed");
          const blob = await res.blob();
          
          const reader = new FileReader();
          reader.onloadend = () => {
              setSafeBgImage(reader.result as string); // 拿到 Base64
              setLoading(false);
          };
          reader.readAsDataURL(blob);
          
          setRecMainColor("#ffffff"); setRecInfoColor("#e5e5e5");
          if (!['card', 'split'].includes(layoutMode)) { setTextColor('#ffffff'); setInfoColor('#e5e5e5'); }
          
      } catch (e) {
          console.error(e);
          setSafeBgImage(null);
          setLoading(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setSafeBgImage(event.target.result as string);
                setSelectedBgUrl("custom");
                setTextColor("#ffffff"); setInfoColor("#e5e5e5");
                setRecMainColor("#ffffff"); setRecInfoColor("#e5e5e5");
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    if (mode === 'card' || mode === 'split') {
        setTextColor('#333333'); setInfoColor('#666666'); setTextAlign('left');
    } else if (mode === 'poster' || mode === 'film') {
        setTextColor('#ffffff'); setInfoColor('#cccccc'); setTextAlign(mode === 'film' ? 'center' : 'left');
    } else {
        setTextColor(recMainColor); setInfoColor(recInfoColor);
        if (mode === 'magazine') setTextAlign('right');
        else if (['minimal', 'stamp', 'classic'].includes(mode)) setTextAlign('center');
        else setTextAlign('left');
    }
  };

  // 生成图片核心逻辑
  const generateImage = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    setLoadingText("正在渲染图片...");
    
    try {
        // 确保 DOM 渲染完成
        await new Promise(r => setTimeout(r, 100));

        const dataUrl = await toPng(cardRef.current, { 
            cacheBust: false, // 关键修复：必须为 false，否则会破坏 Data URI
            pixelRatio: 3, 
            width: 340,    
            height: Math.max(cardRef.current.scrollHeight, 540), 
            style: {
                transform: 'none', // 仅移除缩放，不覆盖背景
                // 不要在这里覆盖 background 属性，相信 DOM 的渲染
            }
        });

        setResultImg(dataUrl);
        setStep('result');

    } catch (e) {
        console.error("生成失败:", e);
        alert("生成失败，请尝试刷新重试。");
    } finally {
        setLoading(false);
    }
  };

  if (!isShareOpen || !shareData) return null;

  // 最终背景样式 (应用在 DOM 上)
  const containerStyle = safeBgImage 
    ? { backgroundImage: `url(${safeBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: bgGradient };

  return (
    <Dialog open={isShareOpen} onOpenChange={(open) => !open && closeShareModal()}>
      <DialogContent className="sm:max-w-5xl bg-white dark:bg-slate-900 border-none p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[700px]">
        
        {/* --- 结果页 (Result) --- */}
        {step === 'result' && resultImg && (
            <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-10">
                <div className="w-full max-w-sm flex flex-col h-full relative">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => setStep('edit')}>
                            <ChevronLeft className="w-5 h-5 mr-1" /> 返回编辑
                        </Button>
                        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={closeShareModal}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
                        <img 
                            src={resultImg} 
                            alt="Result" 
                            className="max-h-full w-auto object-contain shadow-2xl rounded-lg border border-white/10" 
                        />
                    </div>

                    <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/5 shrink-0 text-center space-y-3">
                        <p className="text-white font-bold text-lg flex items-center justify-center gap-2 animate-pulse">
                            <Share2 className="w-5 h-5" />
                            长按上方图片保存
                        </p>
                        <p className="text-white/50 text-xs">或截图分享给好友</p>
                        
                        {/* PC端提供下载按钮 */}
                        <div className="hidden md:block pt-2">
                             <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700" 
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.download = `scripture-${Date.now()}.png`;
                                    link.href = resultImg;
                                    link.click();
                                }}
                             >
                                <Download className="w-4 h-4 mr-2" /> 下载到本地
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 编辑页 (Edit) --- */}
        <div className={cn("flex-1 flex flex-col md:flex-row overflow-hidden relative", step === 'result' ? 'invisible' : 'visible')}>
            
            {/* 左侧：预览 */}
            <div className="bg-slate-100 dark:bg-black/50 items-center justify-center p-6 overflow-auto flex-1 flex">
              <div className="transform md:scale-100 scale-[0.7] origin-center transition-transform duration-300">
                <div 
                    ref={cardRef}
                    className={cn(
                        "w-[340px] min-h-[540px] shadow-2xl relative flex flex-col transition-all duration-300 overflow-hidden bg-white",
                        layoutMode === 'card' ? "p-6" : "p-0",
                        layoutMode === 'frame' ? "p-3" : "",
                    )}
                    style={
                        (layoutMode === 'card' || layoutMode === 'split') 
                        ? { background: layoutMode === 'split' ? '#fff' : safeBgImage ? containerStyle.backgroundImage : bgGradient, backgroundSize: 'cover', backgroundPosition: 'center' } 
                        : { ...containerStyle }
                    }
                >
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
                        textShadow: (['classic', 'modern', 'minimal', 'frame'].includes(layoutMode) && safeBgImage) ? '0 1px 3px rgba(0,0,0,0.6)' : 'none'
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

            {/* 右侧：设置 */}
            <div className="bg-white dark:bg-slate-900 flex-col transition-all duration-300 w-full md:w-96 md:border-l dark:border-slate-800 flex h-[50vh] md:h-full">
                <DialogHeader className="p-3 border-b dark:border-slate-800 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm md:text-base">
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
                                        <button 
                                            key={i}
                                            onClick={() => handleBgSelect(url)} 
                                            className={cn("w-full aspect-square rounded-md bg-cover bg-center border-2 hover:border-blue-500 hover:scale-105 transition-all shadow-sm relative", selectedBgUrl === url ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent")}
                                            style={{ backgroundImage: `url(${url})` }}
                                        >
                                            {selectedBgUrl === url && loading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-white"/></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">简约渐变</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {GRADIENT_PRESETS.map((g, i) => (
                                        <button key={i} onClick={() => { setSafeBgImage(null); setSelectedBgUrl(null); setBgGradient(g.bg); setRecMainColor(g.text); setRecInfoColor(g.info); if (!['card', 'split', 'poster', 'film'].includes(layoutMode)) { setTextColor(g.text); setInfoColor(g.info); } }} className={cn("w-full aspect-square rounded-full border shadow-sm hover:scale-110 transition-transform", bgGradient === g.bg && !safeBgImage && "ring-2 ring-blue-500 ring-offset-2")} style={{ background: g.bg }} title={g.name} />
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
                    <Button onClick={generateImage} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-[1.02]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        {loading ? loadingText : "生成分享图片"}
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
        <button onClick={() => set(mode)} className={cn("p-3 border rounded-lg hover:bg-slate-50 flex flex-col items-center gap-2 transition-all", current === mode && "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 text-blue-600")}>
            <div className={cn("text-slate-500", current === mode && "text-blue-500")}>{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    )
}