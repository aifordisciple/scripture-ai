// components/bible/NoteEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Save, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";

export function NoteEditor() {
  const { isNoteOpen, closeNoteEditor, noteTargetVerse, addNote, updateNote, notes } = useBibleStore();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 查找当前是否已有笔记
  const existingNote = noteTargetVerse 
    ? notes.find(n => n.bookId === noteTargetVerse.bookId && n.chapter === noteTargetVerse.chapter && n.verse === noteTargetVerse.verse)
    : null;

  // [修改] 依赖于 existingNote.content 的变化，实现实时双向绑定。
  // 这意味着当我们在 AI 侧边栏点击"存入笔记"导致 Store 里的 content 变化时，这里也能实时看到！
  useEffect(() => {
    if (isNoteOpen && existingNote) {
        setContent(existingNote.content);
    } else if (isNoteOpen && !existingNote) {
        setContent("");
    }
  }, [isNoteOpen, existingNote?.content]);

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
        setContent(prev => prev + `\n\n🙏 **${t('bible.prayerLabel')}：**\n` + data.prayer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!noteTargetVerse || !content.trim()) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. 远程保存优先（确保成功后再更新本地）
      if (session?.user) {
        const res = await fetch('/api/note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId: existingNote?.id,
            book: noteTargetVerse.bookId,
            chapter: noteTargetVerse.chapter,
            verse: noteTargetVerse.verse,
            content: content,
            action: "upsert"
          })
        });
        if (!res.ok) {
          throw new Error(t('bible.saveFailed'));
        }
        const data = await res.json();
        // 用服务端返回的真实ID更新本地
        if (!existingNote && data.note?.id) {
          addNote({
            id: data.note.id,
            bookId: noteTargetVerse.bookId,
            chapter: noteTargetVerse.chapter,
            verse: noteTargetVerse.verse,
            content: content
          });
        } else if (existingNote) {
          updateNote(existingNote.id, content);
        }
      } else {
        // 未登录用户只保存本地
        if (existingNote) {
          updateNote(existingNote.id, content);
        } else {
          addNote({
            id: `local-${Date.now()}`,
            bookId: noteTargetVerse.bookId,
            chapter: noteTargetVerse.chapter,
            verse: noteTargetVerse.verse,
            content: content
          });
        }
      }

      closeNoteEditor();
    } catch (e) {
      console.error(e);
      setSaveError(e instanceof Error ? e.message : t('bible.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!noteTargetVerse) return null;

  return (
    <Sheet open={isNoteOpen} onOpenChange={(open) => !open && closeNoteEditor()}>
      <SheetContent className="w-full sm:max-w-md bg-card flex flex-col h-full z-[100]">
        <SheetHeader className="mb-4 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('bible.devotionalNote')}
          </SheetTitle>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-1">
            {noteTargetVerse.bookId} {noteTargetVerse.chapter}:{noteTargetVerse.verse}
          </p>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
          {/* 加入一个提示角标 */}
          <div className="absolute top-2 right-4 text-[10px] text-muted-foreground pointer-events-none select-none">
            {t('bible.markdownHint')}
          </div>
          
          <textarea
            className="flex-1 w-full p-4 pt-8 rounded-lg border border-border dark:border-border bg-secondary dark:bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans leading-relaxed text-[15px] text-foreground dark:text-foreground/80"
            placeholder={t('bible.notePlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex gap-2 justify-end shrink-0 py-2">
            {saveError && (
              <p className="text-sm text-red-500 flex-1 text-left">{saveError}</p>
            )}
            <Button 
              variant="outline" 
              onClick={handleGeneratePrayer}
              disabled={isGenerating || !content.trim()}
              className="gap-2 border-border text-primary hover:bg-primary/5 dark:border-border dark:text-primary dark:hover:bg-primary/10 rounded-full active:scale-95"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t('bible.generatePrayer')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !content.trim()} className="gap-2 bg-primary hover:bg-apple-focus rounded-full font-semibold px-6 active:scale-95">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('bible.saveNote')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}