// components/bible/NoteEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Save, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react"; // [新增]

export function NoteEditor() {
  const { isNoteOpen, closeNoteEditor, noteTargetVerse, addNote, notes } = useBibleStore();
  const { data: session } = useSession(); // [新增]
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 查找当前是否已有笔记（用于编辑）
  const existingNote = noteTargetVerse 
    ? notes.find(n => n.bookId === noteTargetVerse.bookId && n.chapter === noteTargetVerse.chapter && n.verse === noteTargetVerse.verse)
    : null;

  // 当打开新经文时，加载已有笔记或重置
  useEffect(() => {
    if (isNoteOpen) {
        setContent(existingNote?.content || "");
    }
  }, [isNoteOpen, noteTargetVerse, existingNote]);

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
      const noteData = {
        id: existingNote?.id || `temp-${Date.now()}`, // 如果是新建，生成临时ID
        bookId: noteTargetVerse.bookId,
        chapter: noteTargetVerse.chapter,
        verse: noteTargetVerse.verse,
        content: content
      };

      // 1. 本地保存 (UI Optimistic Update)
      addNote(noteData); // 注意：useBibleStore 需要支持 addNote/updateNote，这里简化为 addNote 覆盖

      // 2. [新增] 远程保存
      if (session?.user) {
        await fetch('/api/note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId: existingNote?.id, // 如果是编辑，传旧ID
            book: noteTargetVerse.bookId,
            chapter: noteTargetVerse.chapter,
            verse: noteTargetVerse.verse,
            content: content,
            action: "upsert"
          })
        });
      }
      
      closeNoteEditor();
    } catch (e) {
      console.error(e);
      alert("保存失败，请重试");
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