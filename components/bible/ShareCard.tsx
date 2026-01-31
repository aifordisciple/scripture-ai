// components/bible/ShareCard.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Sparkles, Image as ImageIcon, Upload, RotateCcw } from "lucide-react";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

// 1. 定义预设主题 (必须使用 HEX 颜色，绝对不要用 Tailwind 类名，避开 lab/hsl 报错)
const PRESETS = [
  { name: "晨曦", bg: "linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)", textColor: "#ffffff" },
  { name: "深海", bg: "linear-gradient(to top, #30cfd0 0%, #330867 100%)", textColor: "#ffffff" },
  { name: "森林", bg: "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)", textColor: "#1a2e05" }, 
  { name: "极简", bg: "linear-gradient(to right, #e2e2e2, #ffffff)", textColor: "#333333" }, 
  { name: "落日", bg: "linear-gradient(to right, #fa709a 0%, #fee140 100%)", textColor: "#ffffff" },
  { name: "极光", bg: "linear-gradient(to right, #43e97b 0%, #38f9d7 100%)", textColor: "#1a2e05" },
  { name: "午夜", bg: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)", textColor: "#ffffff" },
  { name: "圣洁", bg: "#ffffff", textColor: "#000000" }, 
];

export function ShareCard() {
  const { isShareOpen, closeShareModal, shareData } = useBibleStore();
  const [loading, setLoading] = useState(false);
  const [generatingTheme, setGeneratingTheme] = useState(false);
  
  const [verseContent, setVerseContent] = useState<string[]>([]);
  
  // 状态：背景样式 (支持渐变 CSS 或 url(...) )
  const [backgroundStyle, setBackgroundStyle] = useState<string>(PRESETS[0].bg);
  const [isImageBg, setIsImageBg] = useState(false);
  
  const [title, setTitle] = useState("每日灵修");
  const [textColor, setTextColor] = useState(PRESETS[0].textColor);
  
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
          setVerseContent(verses.map((v: any) => `${v.content} (${v.verse})`));
          
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
      if (data.gradient && data.gradient.includes('gradient')) {
          setBackgroundStyle(data.gradient);
          setIsImageBg(false);
          setTextColor("#ffffff"); // AI 主题默认白字比较安全
      }
      if (data.title) setTitle(data.title);
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
                setBackgroundStyle(`url(${event.target.result})`);
                setIsImageBg(true);
                setTextColor("#ffffff"); // 图片背景默认白字
            }
        };
        reader.readAsDataURL(file);
    }
  };

  // 4. 生成图片 (核心修复逻辑)
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // 3倍超采样，保证文字清晰
        useCORS: true, // 允许跨域图片
        allowTaint: true, // 允许画布被污染 (对于本地Blob这是必须的)
        backgroundColor: null, // 透明背景
        logging: false,
        // 关键：忽略可能带有现代 CSS 的外部干扰元素
        ignoreElements: (element) => element.tagName === 'IFRAME' || element.tagName === 'SCRIPT'
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `scripture-card-${Date.now()}.png`;
      link.click();
    } catch (e) {
      console.error("生成失败:", e);
      alert("生成图片出错，请重试。");
    } finally {
      setLoading(false);
    }
  };

  if (!isShareOpen || !shareData) return null;

  return (
    <Dialog open={isShareOpen} onOpenChange={(open) => !open && closeShareModal()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <ImageIcon className="w-5 h-5" />
            经文卡片分享
          </DialogTitle>
        </DialogHeader>

        {/* 预览区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-black/50 flex justify-center items-center">
          
          {/* cardRef 是我们要截图的目标。
             注意：style 中我们强制指定了 color 和 boxShadow，覆盖任何可能继承的 lab/oklch 变量。
          */}
          <div 
            ref={cardRef}
            className="w-full max-w-[320px] min-h-[480px] p-6 flex flex-col justify-between relative overflow-hidden text-center select-none rounded-xl"
            style={{ 
                background: backgroundStyle, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                color: textColor, // 强制覆盖继承的颜色
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // 手写标准 RGB 阴影
                fontFamily: '"Noto Serif SC", serif' 
            }}
          >
            {/* 图片背景遮罩层 */}
            {isImageBg && (
                <div className="absolute inset-0 bg-black/40 z-0" />
            )}

            {/* 装饰水印 */}
            <div className="absolute top-[-30px] right-[-30px] opacity-20 rotate-12 z-10 pointer-events-none">
              <Sparkles className="w-40 h-40" fill="currentColor" />
            </div>

            {/* 内容区域 */}
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    {/* 标题 */}
                    <div 
                        className="text-xs font-bold tracking-[0.2em] uppercase mb-6 border-b pb-3 inline-block px-4"
                        style={{ borderColor: `${textColor}40` }} // 使用 Hex 透明度
                    >
                        {title}
                    </div>
                    
                    {/* 经文内容 */}
                    <div className="text-lg leading-loose font-medium space-y-3 text-justify">
                        {verseContent.map((v, i) => (
                        <p key={i} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                            {v}
                        </p>
                        ))}
                    </div>
                </div>

                {/* 底部信息 */}
                <div className="mt-8 pt-4 border-t flex justify-between items-end" style={{ borderColor: `${textColor}30` }}>
                    <div className="text-left">
                        <p className="font-bold text-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {shareData.book} {shareData.chapter}
                        </p>
                        <p className="text-[10px] opacity-80 mt-0.5">Scripture AI</p>
                    </div>
                    <div className="bg-white/20 p-1.5 rounded backdrop-blur-sm">
                        <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
                            <span className="text-[8px] font-bold text-black">QR</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* 底部控制栏 */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex flex-col gap-4">
          
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1 items-center">
            {/* AI 按钮 */}
            <button 
               onClick={() => handleAITheme(verseContent.join(" "))}
               disabled={generatingTheme}
               className="shrink-0 w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:scale-105 transition-transform"
               title="AI 重新生成"
            >
               {generatingTheme ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Sparkles className="w-5 h-5 text-purple-500" />}
            </button>

            {/* 上传图片按钮 */}
            <div className="relative shrink-0">
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    title="上传背景图"
                >
                    <Upload className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1" />

            {/* 预设主题 */}
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                    setBackgroundStyle(p.bg);
                    setTextColor(p.textColor);
                    setIsImageBg(false);
                }}
                className={cn(
                    "shrink-0 w-10 h-10 rounded-full border-2 shadow-sm hover:scale-110 transition-transform",
                    backgroundStyle === p.bg ? "border-blue-500 scale-110" : "border-white dark:border-slate-700"
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
                保存图片
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}