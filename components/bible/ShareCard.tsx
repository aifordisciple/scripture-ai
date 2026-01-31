// components/bible/ShareCard.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Sparkles, Image as ImageIcon, Upload, RotateCcw, Quote } from "lucide-react";
import { toPng } from "html-to-image"; // 使用 html-to-image 以支持更高级的 CSS 效果
import { cn } from "@/lib/utils";

// 高级配色预设 (不仅是背景，还包含文字色和强调色)
const PRESETS = [
  { name: "极光", bg: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)", textColor: "#5e4b56", accent: "#ffffff" },
  { name: "深邃", bg: "linear-gradient(to top, #30cfd0 0%, #330867 100%)", textColor: "#ffffff", accent: "rgba(255,255,255,0.2)" },
  { name: "墨意", bg: "linear-gradient(to bottom, #323232 0%, #3F3F3F 40%, #1C1C1C 150%), linear-gradient(to top, rgba(255,255,255,0.40) 0%, rgba(0,0,0,0.25) 200%)", backgroundBlendMode: "multiply", textColor: "#e0e0e0", accent: "#a0a0a0" },
  { name: "纸莎草", bg: "#fdfbf7", textColor: "#3c3c3c", accent: "#d4c5b0" }, // 仿纸质
  { name: "晨曦", bg: "linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)", textColor: "#ffffff", accent: "rgba(255,255,255,0.3)" },
  { name: "青峦", bg: "linear-gradient(to top, #0ba360 0%, #3cba92 100%)", textColor: "#ffffff", accent: "rgba(255,255,255,0.2)" },
];

// SVG 噪点纹理 (Data URI)，用于给卡片增加高级纸质颗粒感
const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

export function ShareCard() {
  const { isShareOpen, closeShareModal, shareData } = useBibleStore();
  const [loading, setLoading] = useState(false);
  const [generatingTheme, setGeneratingTheme] = useState(false);
  
  const [verseContent, setVerseContent] = useState<string[]>([]);
  
  // 样式状态
  const [currentPreset, setCurrentPreset] = useState(PRESETS[0]);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  
  const [title, setTitle] = useState("每日灵修");
  
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 加载经文
  useEffect(() => {
    if (isShareOpen && shareData) {
      async function loadVerses() {
        try {
          const res = await fetch(`/api/bible?book=${shareData?.book}&chapter=${shareData?.chapter}`);
          const json = await res.json();
          const verses = json.data.filter((v: any) => 
            shareData?.verses.includes(v.verse) && v.version === 'CUV'
          );
          setVerseContent(verses.map((v: any) => v.content)); // 只取内容，节号单独处理
          
          // 首次打开自动生成主题
          if (verses.length > 0) {
             handleAITheme(verses.map((v: any) => v.content).join(" "));
          }
        } catch (e) {
          console.error(e);
        }
      }
      loadVerses();
    }
  }, [isShareOpen, shareData]);

  // 2. AI 生成主题
  const handleAITheme = async (text: string) => {
    setGeneratingTheme(true);
    try {
      const res = await fetch('/api/card-theme', {
        method: 'POST',
        body: JSON.stringify({ content: text })
      });
      const data = await res.json();
      // 如果 AI 返回了标题，设置标题
      if (data.title) setTitle(data.title);
      // 注意：这里我们保留预设的配色逻辑，只用 AI 生成标题，
      // 或者你可以扩展逻辑让 AI 选择最接近的 PRESET。
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingTheme(false);
    }
  };

  // 3. 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setCustomBgImage(`url(${event.target.result})`);
                // 图片背景强制用白字
                setCurrentPreset({ ...currentPreset, name: "自定义", textColor: "#ffffff", accent: "rgba(255,255,255,0.3)" });
            }
        };
        reader.readAsDataURL(file);
    }
  };

  // 4. 生成图片 (使用 html-to-image)
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, // 3倍超采样，保证高清，这是“高级感”的关键
        style: {
            // 可以在截图时微调样式，比如去掉圆角，让图片是直角的
            borderRadius: '0', 
            boxShadow: 'none',
        }
      });
      
      const link = document.createElement("a");
      link.download = `scripture-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("生成失败:", e);
      alert("生成图片出错，请重试。");
    } finally {
      setLoading(false);
    }
  };

  if (!isShareOpen || !shareData) return null;

  const bgStyle = customBgImage 
    ? { backgroundImage: customBgImage, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: currentPreset.bg };

  return (
    <Dialog open={isShareOpen} onOpenChange={(open) => !open && closeShareModal()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-none p-0 overflow-hidden flex flex-col max-h-[95vh]">
        <DialogHeader className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <ImageIcon className="w-5 h-5" />
            经文卡片分享
          </DialogTitle>
        </DialogHeader>

        {/* 预览区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-black/50 flex justify-center items-center">
          
          {/* --- 卡片容器 --- */}
          <div 
            ref={cardRef}
            className="w-full max-w-[340px] min-h-[500px] relative overflow-hidden flex flex-col shadow-2xl"
            style={{ 
                ...bgStyle,
                color: currentPreset.textColor,
                fontFamily: '"Noto Serif SC", serif' // 确保使用衬线体
            }}
          >
            {/* 1. 遮罩层 (如果是图片或某些渐变，增加文字可读性) */}
            {customBgImage && <div className="absolute inset-0 bg-black/30 z-0" />}
            
            {/* 2. 噪点纹理 (高级感来源) */}
            <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE_TEXTURE }} />

            {/* 3. 装饰性大引号水印 */}
            <div className="absolute top-4 left-4 opacity-10 z-0 transform -scale-x-100">
                <Quote size={120} fill="currentColor" stroke="none" />
            </div>

            {/* --- 内容层 (z-index 10) --- */}
            <div className="relative z-10 flex flex-col h-full p-8">
                
                {/* 顶部：标题与日期 */}
                <div className="flex justify-between items-center mb-8 opacity-80">
                    <div className="text-[10px] tracking-[0.2em] uppercase border-b pb-1" style={{ borderColor: currentPreset.accent }}>
                        {title}
                    </div>
                    <div className="text-[10px] font-sans opacity-70">
                        {new Date().toLocaleDateString('zh-CN')}
                    </div>
                </div>

                {/* 中间：经文内容 */}
                <div className="flex-1 flex flex-col justify-center gap-6">
                    {verseContent.map((v, i) => (
                        <div key={i} className="relative">
                            {/* 经文前的装饰短线 */}
                            {i === 0 && <div className="w-8 h-0.5 mb-4 opacity-50" style={{ backgroundColor: 'currentColor' }} />}
                            
                            <p 
                                className="text-xl leading-loose font-medium text-justify drop-shadow-sm" 
                                style={{ 
                                    textShadow: customBgImage ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                                    fontWeight: 500
                                }}
                            >
                                {v}
                            </p>
                            {/* 节号角标 */}
                            <sup className="text-[10px] opacity-60 ml-1 font-sans">
                                {shareData.verses[i]}
                            </sup>
                        </div>
                    ))}
                </div>

                {/* 底部：出处与 Branding (毛玻璃效果) */}
                <div className="mt-10 pt-0">
                    <div 
                        className="rounded-xl p-4 flex justify-between items-center backdrop-blur-md"
                        style={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-wide">
                                {shareData.book} {shareData.chapter}
                            </span>
                            <span className="text-[9px] opacity-70 mt-0.5 uppercase tracking-wider font-sans">
                                Scripture AI Journal
                            </span>
                        </div>
                        
                        {/* 模拟二维码 */}
                        <div className="bg-white p-1 rounded-sm opacity-90">
                             <div className="w-8 h-8 border-2 border-black border-dashed rounded-sm flex items-center justify-center">
                                <div className="w-3 h-3 bg-black rounded-full" />
                             </div>
                        </div>
                    </div>
                </div>

            </div>
          </div>
        </div>

        {/* 底部控制栏 */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex flex-col gap-4">
          
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1 items-center">
            {/* AI 换标题 */}
            <button 
               onClick={() => handleAITheme(verseContent.join(" "))}
               disabled={generatingTheme}
               className="shrink-0 w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:scale-105 transition-transform"
               title="AI 优化标题"
            >
               {generatingTheme ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Sparkles className="w-5 h-5 text-purple-500" />}
            </button>

            {/* 上传图片 */}
            <div className="relative shrink-0">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    title="上传背景图"
                >
                    <Upload className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1" />

            {/* 预设主题球 */}
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                    setCurrentPreset(p);
                    setCustomBgImage(null);
                }}
                className={cn(
                    "shrink-0 w-10 h-10 rounded-full border-2 shadow-sm hover:scale-110 transition-transform",
                    currentPreset.name === p.name ? "border-blue-500 scale-110" : "border-white dark:border-slate-700"
                )}
                style={{ background: p.bg }}
                title={p.name}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTitle("每日灵修")} className="flex-1 dark:border-slate-700 dark:text-slate-300">
                <RotateCcw className="w-4 h-4 mr-2" /> 重置标题
            </Button>
            <Button onClick={handleDownload} disabled={loading} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                保存高清图片
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}