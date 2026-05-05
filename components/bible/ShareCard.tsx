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
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';

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
  "https://images.unsplash.com/photo-1491466424936-e304919aada7?q=80&w=1080&auto=format&fit=crop",
];

const GRADIENT_PRESETS = [
  { nameKey: "shareCard.gradientPureWhite", bg: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", text: "#333333", info: "#666666" },
  { nameKey: "shareCard.gradientSerenity", bg: "linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)", text: "#333333", info: "#555555" },
  { nameKey: "shareCard.gradientDream", bg: "linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)", text: "#ffffff", info: "#f0f0f0" },
  { nameKey: "shareCard.gradientDeepBlue", bg: "linear-gradient(to top, #30cfd0 0%, #330867 100%)", text: "#ffffff", info: "#cccccc" },
  { nameKey: "shareCard.gradientFreshGreen", bg: "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)", text: "#333333", info: "#555555" },
  { nameKey: "shareCard.gradientAurora", bg: "linear-gradient(to right, #43e97b 0%, #38f9d7 100%)", text: "#333333", info: "#444444" },
  { nameKey: "shareCard.gradientDeepNight", bg: "linear-gradient(to top, #09203f 0%, #537895 100%)", text: "#ffffff", info: "#aaaaaa" },
  { nameKey: "shareCard.gradientWarmSun", bg: "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)", text: "#333333", info: "#666666" },
];

const FONT_OPTIONS = [
  { nameKey: "shareCard.fontSongti", value: "'Noto Serif SC', serif" },
  { nameKey: "shareCard.fontHeiti", value: "'Noto Sans SC', sans-serif" },
  { nameKey: "shareCard.fontKaiti", value: "'KaiTi', 'STKaiti', serif" },
];

type LayoutMode = 'classic' | 'poster' | 'card' | 'modern' | 'split' | 'frame' | 'film' | 'minimal' | 'magazine' | 'stamp';

export function ShareCard() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { isShareOpen, closeShareModal, shareData, bibleVersion } = useBibleStore();

  // 核心状态
  const [step, setStep] = useState<'edit' | 'result'>('edit');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(t('shareCard.loading'));
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
          const verses = json.data.filter((v: any) => shareData?.verses.includes(v.verse) && v.version === (bibleVersion || 'CUV'));
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
    setLoadingText(t('shareCard.rendering'));

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
        console.error("Generate failed:", e);
        addToast({ type: 'error', message: t('shareCard.generateFailed') });
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
      <DialogContent className="sm:max-w-5xl bg-card dark:bg-card border-none p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[700px]">

        {/* --- 结果页 (Result) --- */}
        {step === 'result' && resultImg && (
            <div className="absolute inset-0 z-50 bg-card flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-10">
                <div className="w-full max-w-sm flex flex-col h-full relative">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => setStep('edit')}>
                            <ChevronLeft className="w-5 h-5 mr-1" /> {t('shareCard.backToEdit')}
                        </Button>
                        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={closeShareModal}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
                        <img
                            src={resultImg}
                            alt="Result"
                            className="max-h-full w-auto object-contain rounded-lg border border-white/10"
                        />
                    </div>

                    <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/5 shrink-0 text-center space-y-3">
                        <p className="text-white font-semibold text-lg flex items-center justify-center gap-2 animate-pulse">
                            <Share2 className="w-5 h-5" />
                            {t('shareCard.longPressSave')}
                        </p>
                        <p className="text-white/50 text-xs">{t('shareCard.screenshotShare')}</p>

                        {/* PC端提供下载按钮 */}
                        <div className="hidden md:block pt-2">
                             <Button
                                className="w-full bg-primary hover:bg-apple-focus active:scale-95"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.download = `scripture-${Date.now()}.png`;
                                    link.href = resultImg;
                                    link.click();
                                }}
                             >
                                <Download className="w-4 h-4 mr-2" /> {t('shareCard.download')}
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 编辑页 (Edit) --- */}
        <div className={cn("flex-1 flex flex-col md:flex-row overflow-hidden relative", step === 'result' ? 'invisible' : 'visible')}>

            {/* 左侧：预览 */}
            <div className="bg-secondary dark:bg-black/50 items-center justify-center p-6 overflow-auto flex-1 flex">
              <div className="transform md:scale-100 scale-[0.7] origin-center transition-transform duration-300">
                <div
                    ref={cardRef}
                    className={cn(
                        "w-[340px] min-h-[540px] relative flex flex-col transition-all duration-300 overflow-hidden bg-white",
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
                        layoutMode === 'card' ? "bg-white p-8 rounded-lg" : "p-8",
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
                            layoutMode === 'stamp' ? "bg-white/90 dark:bg-black/60 backdrop-blur-sm p-6 max-h-min rounded-sm" : ""
                        )}>
                            {layoutMode === 'modern' && <div className="w-12 h-1 bg-current mb-6 opacity-80" />}
                            {layoutMode === 'magazine' && <Quote className="w-12 h-12 mb-4 opacity-30 rotate-180" />}
                            {layoutMode === 'minimal' && <div className="w-8 h-[1px] bg-current mx-auto mb-6 opacity-60" />}

                            {verseContent.map((v, i) => (
                                <p key={i} className="mb-4 font-semibold" style={{ fontSize: fontSize, textAlign: textAlign, lineHeight: lineHeight }}>
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
                                    <div className="text-xs opacity-70 mt-1">{t('shareCard.brandDaily')}</div>
                                )}
                            </div>
                            {layoutMode !== 'modern' && layoutMode !== 'minimal' && (
                                <div className="text-[10px] uppercase tracking-widest opacity-70">{t('shareCard.brand')}</div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* 右侧：设置 */}
            <div className="bg-card dark:bg-card flex-col transition-all duration-300 w-full md:w-96 md:border-l dark:border-border flex h-[50vh] md:h-full">
                <DialogHeader className="p-3 border-b dark:border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-foreground dark:text-foreground text-sm md:text-base">
                        <ImageIcon className="w-5 h-5" /> {t('shareCard.customize')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <Tabs defaultValue="layout" className="w-full">
                        <TabsList className="w-full mb-4 grid grid-cols-3">
                            <TabsTrigger value="layout">{t('shareCard.tabLayout')}</TabsTrigger>
                            <TabsTrigger value="bg">{t('shareCard.tabBg')}</TabsTrigger>
                            <TabsTrigger value="text">{t('shareCard.tabText')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="layout" className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <LayoutButton mode="classic" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutClassic')} icon={<Layout className="w-5 h-5"/>} />
                                <LayoutButton mode="poster" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutPoster')} icon={<ImageIcon className="w-5 h-5"/>} />
                                <LayoutButton mode="card" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutCard')} icon={<StickyNote className="w-5 h-5"/>} />
                                <LayoutButton mode="modern" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutModern')} icon={<AlignLeft className="w-5 h-5"/>} />
                                <LayoutButton mode="split" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutSplit')} icon={<Columns className="w-5 h-5"/>} />
                                <LayoutButton mode="frame" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutFrame')} icon={<Frame className="w-5 h-5"/>} />
                                <LayoutButton mode="film" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutFilm')} icon={<Clapperboard className="w-5 h-5"/>} />
                                <LayoutButton mode="minimal" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutMinimal')} icon={<Minus className="w-5 h-5"/>} />
                                <LayoutButton mode="magazine" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutMagazine')} icon={<Type className="w-5 h-5"/>} />
                                <LayoutButton mode="stamp" current={layoutMode} set={handleLayoutChange} label={t('shareCard.layoutStamp')} icon={<Quote className="w-5 h-5"/>} />
                            </div>
                        </TabsContent>

                        <TabsContent value="bg" className="space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.featuredPhotos')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {UNSPLASH_PRESETS.map((url, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleBgSelect(url)}
                                            className={cn("w-full aspect-square rounded-lg bg-cover bg-center border-2 hover:border-primary transition-all relative active:scale-95", selectedBgUrl === url ? "border-primary ring-2 ring-primary/20" : "border-transparent")}
                                            style={{ backgroundImage: `url(${url})` }}
                                        >
                                            {selectedBgUrl === url && loading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-white"/></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.gradients')}</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {GRADIENT_PRESETS.map((g, i) => (
                                        <button key={i} onClick={() => { setSafeBgImage(null); setSelectedBgUrl(null); setBgGradient(g.bg); setRecMainColor(g.text); setRecInfoColor(g.info); if (!['card', 'split', 'poster', 'film'].includes(layoutMode)) { setTextColor(g.text); setInfoColor(g.info); } }} className={cn("w-full aspect-square rounded-full border transition-transform active:scale-95", bgGradient === g.bg && !safeBgImage && "ring-2 ring-primary ring-offset-2")} style={{ background: g.bg }} title={t(g.nameKey)} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.custom')}</label>
                                <div className="relative">
                                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                                    <Button variant="outline" size="sm" className="w-full border-dashed active:scale-95" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> {t('shareCard.uploadImage')}</Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="text" className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Type className="w-3 h-3"/> {t('shareCard.fontLabel')}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FONT_OPTIONS.map((f, i) => (
                                        <button key={i} onClick={() => setFontFamily(f.value)} className={cn("px-2 py-1.5 text-xs border rounded hover:bg-secondary text-left truncate active:scale-95", fontFamily === f.value && "border-primary text-primary bg-primary/5")} style={{ fontFamily: f.value }}>{t(f.nameKey)}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between"><span>{t('shareCard.fontSize')}</span><span>{fontSize}px</span></label>
                                <Slider value={[fontSize]} min={14} max={48} step={1} onValueChange={(val) => setFontSize(val[0])} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between"><span className="flex items-center gap-1"><MoveVertical className="w-3 h-3"/> {t('shareCard.lineSpacing')}</span><span>{lineHeight}</span></label>
                                <Slider value={[lineHeight]} min={1.0} max={3.0} step={0.1} onValueChange={(val) => setLineHeight(val[0])} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground">{t('shareCard.alignment')}</label>
                                <div className="flex gap-2">
                                    <Button variant={textAlign === 'left' ? 'secondary' : 'outline'} size="sm" onClick={() => setTextAlign('left')} className="flex-1 active:scale-95"><AlignLeft className="w-4 h-4" /></Button>
                                    <Button variant={textAlign === 'center' ? 'secondary' : 'outline'} size="sm" onClick={() => setTextAlign('center')} className="flex-1 active:scale-95"><AlignCenter className="w-4 h-4" /></Button>
                                    <Button variant={textAlign === 'right' ? 'secondary' : 'outline'} size="sm" onClick={() => setTextAlign('right')} className="flex-1 active:scale-95"><AlignRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground">{t('shareCard.mainColor')}</label>
                                <div className="flex gap-3 flex-wrap items-center">
                                    {['#ffffff', '#f8f9fa', '#e2e8f0', '#333333', '#1a202c', '#000000', '#2b6cb0', '#2f855a', '#c53030'].map(c => (
                                        <button key={c} onClick={() => setTextColor(c)} className={cn("w-8 h-8 rounded-full border transition-transform active:scale-95", textColor === c && "ring-2 ring-primary ring-offset-2")} style={{ backgroundColor: c }} />
                                    ))}
                                    <div className="relative">
                                        <button onClick={() => mainColorRef.current?.click()} className="w-8 h-8 rounded-full border border-dashed border-muted-foreground flex items-center justify-center hover:bg-secondary active:scale-95" title={t('shareCard.customColor')}><Palette className="w-4 h-4 text-muted-foreground" /></button>
                                        <input ref={mainColorRef} type="color" className="absolute opacity-0 w-0 h-0" onChange={(e) => setTextColor(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 border-t pt-3">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3"/> {t('shareCard.infoColor')}</label>
                                <div className="flex gap-3 flex-wrap items-center">
                                    {['#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000'].map(c => (
                                        <button key={c} onClick={() => setInfoColor(c)} className={cn("w-6 h-6 rounded-full border transition-transform active:scale-95", infoColor === c && "ring-2 ring-primary ring-offset-2")} style={{ backgroundColor: c }} />
                                    ))}
                                    <div className="relative">
                                        <button onClick={() => infoColorRef.current?.click()} className="w-6 h-6 rounded-full border border-dashed border-muted-foreground flex items-center justify-center hover:bg-secondary active:scale-95" title={t('shareCard.customColor')}><Palette className="w-3 h-3 text-muted-foreground" /></button>
                                        <input ref={infoColorRef} type="color" className="absolute opacity-0 w-0 h-0" onChange={(e) => setInfoColor(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-4 border-t dark:border-[#3a3a3c] bg-[#f5f5f7] dark:bg-[#272729] shrink-0">
                    <Button onClick={generateImage} disabled={loading} className="w-full bg-[#0066cc] hover:bg-[#0071e3] text-white active:scale-95 rounded-full">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        {loading ? loadingText : t('shareCard.generateBtn')}
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
        <button onClick={() => set(mode)} className={cn("p-3 border rounded-xl hover:bg-[#f5f5f7] flex flex-col items-center gap-2 transition-all active:scale-95", current === mode && "border-[#0066cc] bg-[#0066cc]/5 ring-1 ring-[#0066cc] text-[#0066cc]")}>
            <div className={cn("text-muted-foreground", current === mode && "text-[#0066cc]")}>{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    )
}