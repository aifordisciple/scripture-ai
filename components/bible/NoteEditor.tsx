// components/bible/NoteEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // 假设你有这个，没有的话用原生 textarea
import { Loader2, Sparkles, Save, BookOpen } from "lucide-react";

export function NoteEditor() {
  const { isNoteOpen, closeNoteEditor, noteTargetVerse } = useBibleStore();
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 当打开新经文时，重置或加载（这里先做简单的重置，实际应加载已有笔记）
  useEffect(() => {
    if (isNoteOpen) setContent("");
  }, [isNoteOpen, noteTargetVerse]);

  const handleGeneratePrayer = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/chat/prayer', {
        method: 'POST',
        body: JSON.stringify({ note: content, verseRef: noteTargetVerse })
      });
      const data = await res.json();
      if (data.prayer) {
        setContent(prev => prev + "\n\n🙏 **祷告文：**\n" + data.prayer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!noteTargetVerse || !content.trim()) return;
    setIsSaving(true);
    try {
      await fetch('/api/note', {
        method: 'POST',
        body: JSON.stringify({
          bookId: noteTargetVerse.bookId,
          chapter: noteTargetVerse.chapter,
          verse: noteTargetVerse.verse,
          content: content
        })
      });
      closeNoteEditor();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!noteTargetVerse) return null;

  return (
    <Sheet open={isNoteOpen} onOpenChange={(open) => !open && closeNoteEditor()}>
      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-slate-950 flex flex-col h-full">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            灵修笔记
          </SheetTitle>
          <p className="text-sm text-slate-500">
            {noteTargetVerse.bookId} {noteTargetVerse.chapter}:{noteTargetVerse.verse}
          </p>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <textarea
            className="flex-1 w-full p-4 rounded-lg border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="写下你的感动、思考或疑问..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={handleGeneratePrayer}
              disabled={isGenerating || !content.trim()}
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-300 dark:hover:bg-purple-900/20"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              生成祷告
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}