"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, BookOpen, Pencil, Loader2, Wand2, Target, Trophy
} from "lucide-react";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { BIBLE_BOOKS } from "@/lib/constants";
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';

interface GroupPlanCreateDialogProps {
  churchId: string;
  onSuccess: (plan: any) => void;
}

// 预设模板
const PLAN_TEMPLATES = [
  {
    id: "genesis-7",
    name: "创世记 7 天读经",
    description: "从创世到约瑟的故事",
    durationDays: 7,
    readings: [
      { book: "Gen", chapters: [1, 2] },
      { book: "Gen", chapters: [3, 4] },
      { book: "Gen", chapters: [6, 7] },
      { book: "Gen", chapters: [12, 13] },
      { book: "Gen", chapters: [22] },
      { book: "Gen", chapters: [37] },
      { book: "Gen", chapters: [50] },
    ]
  },
  {
    id: "psalms-7",
    name: "诗篇精选 7 天",
    description: "精选赞美与祷告的诗篇",
    durationDays: 7,
    readings: [
      { book: "Psa", chapters: [1, 23] },
      { book: "Psa", chapters: [27, 42] },
      { book: "Psa", chapters: [51, 91] },
      { book: "Psa", chapters: [103, 121] },
      { book: "Psa", chapters: [139, 145] },
      { book: "Psa", chapters: [146, 147] },
      { book: "Psa", chapters: [148, 150] },
    ]
  },
  {
    id: "john-7",
    name: "约翰福音 7 天",
    description: "认识耶稣的神迹与教导",
    durationDays: 7,
    readings: [
      { book: "Jhn", chapters: [1, 2] },
      { book: "Jhn", chapters: [3, 4] },
      { book: "Jhn", chapters: [5, 6] },
      { book: "Jhn", chapters: [10, 11] },
      { book: "Jhn", chapters: [13, 14] },
      { book: "Jhn", chapters: [17, 18] },
      { book: "Jhn", chapters: [20, 21] },
    ]
  },
  {
    id: "epistles-7",
    name: "书信精选 7 天",
    description: "保罗书信的教导",
    durationDays: 7,
    readings: [
      { book: "Rom", chapters: [1, 8] },
      { book: "Rom", chapters: [12, 13] },
      { book: "Gal", chapters: [1, 5] },
      { book: "Eph", chapters: [1, 2] },
      { book: "Eph", chapters: [4, 6] },
      { book: "Php", chapters: [1, 4] },
      { book: "Col", chapters: [1, 3] },
    ]
  },
];

export function GroupPlanCreateDialog({ churchId, onSuccess }: GroupPlanCreateDialogProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { apiConfig } = useBibleStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  // AI creation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDuration, setAiDuration] = useState(7);
  const [aiMode, setAiMode] = useState<"NORMAL" | "CHALLENGE">("NORMAL");

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Manual creation state
  const [manualName, setManualName] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualDays, setManualDays] = useState(7);
  const [manualMode, setManualMode] = useState<"NORMAL" | "CHALLENGE">("NORMAL");
  const [manualStartBook, setManualStartBook] = useState("Gen");
  const [manualStartChapter, setManualStartChapter] = useState(1);
  const [manualChaptersPerDay, setManualChaptersPerDay] = useState(1);

  const createWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`/api/church/${churchId}/plan/ai-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          durationDays: aiDuration,
          mode: aiMode,
          apiConfig
        })
      });
      const data = await res.json();
      if (data.error) {
        addToast({ type: 'error', message: data.error });
      } else if (data.plan) {
        onSuccess(data.plan);
        setOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create plan:", error);
      addToast({ type: 'error', message: t('group.createPlanFailed') });
    } finally {
      setCreating(false);
    }
  };

  const createFromTemplate = async () => {
    if (!selectedTemplate) return;

    const template = PLAN_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    setCreating(true);
    try {
      // Build tasks and daily chapters from template
      const tasks = template.readings.map((r, index) => ({
        day: index + 1,
        readings: r.chapters.map(c => ({ book: r.book, chapter: c }))
      }));

      const dailyChapters = template.readings.map(r =>
        r.chapters.map(c => `${r.book}-${c}`).join(',')
      );

      const res = await fetch(`/api/church/${churchId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          startDate: new Date().toISOString(),
          dailyChapters,
          tasks: JSON.stringify(tasks),
          mode: "NORMAL",
          source: "TEMPLATE"
        })
      });
      const data = await res.json();
      if (data.error) {
        addToast({ type: 'error', message: data.error });
      } else if (data.plan) {
        onSuccess(data.plan);
        setOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create plan:", error);
      addToast({ type: 'error', message: t('group.createPlanFailed') });
    } finally {
      setCreating(false);
    }
  };

  const createManual = async () => {
    if (!manualName.trim()) return;

    setCreating(true);
    try {
      // Get the selected book info
      const selectedBook = BIBLE_BOOKS.find(b => b.id === manualStartBook);
      if (!selectedBook) {
        addToast({ type: 'error', message: t('group.selectValidBook') });
        setCreating(false);
        return;
      }

      // Build daily chapters starting from selected book and chapter
      const dailyChapters: string[] = [];
      let currentBook = selectedBook;
      let currentBookId = manualStartBook;
      let currentChapter = manualStartChapter;
      const totalChaptersPerDay = manualChaptersPerDay;

      for (let day = 0; day < manualDays; day++) {
        const dayChapters: string[] = [];
        for (let c = 0; c < totalChaptersPerDay; c++) {
          dayChapters.push(`${currentBookId}-${currentChapter}`);
          currentChapter++;

          // Move to next book if current book is finished
          const bookInfo = BIBLE_BOOKS.find(b => b.id === currentBookId);
          if (bookInfo && currentChapter > bookInfo.chapters) {
            const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === currentBookId);
            if (currentIndex < BIBLE_BOOKS.length - 1) {
              const nextBook = BIBLE_BOOKS[currentIndex + 1];
              currentBookId = nextBook.id;
              currentChapter = 1;
            }
          }
        }
        dailyChapters.push(dayChapters.join(','));
      }

      const tasks = dailyChapters.map((chaptersStr, index) => {
        const chapters = chaptersStr.split(',');
        const readings = chapters.map(c => {
          const [book, chapter] = c.split('-');
          return { book, chapter: parseInt(chapter) };
        });
        return { day: index + 1, readings };
      });

      const res = await fetch(`/api/church/${churchId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          description: manualDesc,
          startDate: new Date().toISOString(),
          dailyChapters,
          tasks: JSON.stringify(tasks),
          mode: manualMode,
          source: "MANUAL",
          challengeConfig: manualMode === "CHALLENGE" ? {
            targetDays: manualDays,
            rewardTitle: t('group.completePlanTitle', { name: manualName }),
            rewardBadge: t('group.challenger')
          } : null
        })
      });
      const data = await res.json();
      if (data.error) {
        addToast({ type: 'error', message: data.error });
      } else if (data.plan) {
        onSuccess(data.plan);
        setOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create plan:", error);
      addToast({ type: 'error', message: t('group.createPlanFailed') });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setAiPrompt("");
    setAiDuration(7);
    setAiMode("NORMAL");
    setSelectedTemplate(null);
    setManualName("");
    setManualDesc("");
    setManualDays(7);
    setManualMode("NORMAL");
    setManualStartBook("Gen");
    setManualStartChapter(1);
    setManualChaptersPerDay(1);
    setActiveTab("ai");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Wand2 className="w-4 h-4" /> {t('group.createReadingPlan')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('group.createGroupReadingPlan')}</DialogTitle>
          <DialogDescription>
            {t('group.createPlanDesc')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="gap-1">
              <Sparkles className="w-4 h-4" /> {t('group.aiCreate')}
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-1">
              <BookOpen className="w-4 h-4" /> {t('group.template')}
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1">
              <Pencil className="w-4 h-4" /> {t('group.manual')}
            </TabsTrigger>
          </TabsList>

          {/* AI Creation Tab */}
          <TabsContent value="ai" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('group.describeYourNeeds')}</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t('group.aiPromptPlaceholder')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('group.planDays')}</Label>
                <Input
                  type="number"
                  value={aiDuration}
                  onChange={(e) => setAiDuration(parseInt(e.target.value) || 7)}
                  min={1}
                  max={365}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('group.mode')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={aiMode === "NORMAL" ? "default" : "outline"}
                    onClick={() => setAiMode("NORMAL")}
                    className="flex-1"
                    size="sm"
                  >
                    <Target className="w-4 h-4 mr-1" /> {t('group.normalMode')}
                  </Button>
                  <Button
                    variant={aiMode === "CHALLENGE" ? "default" : "outline"}
                    onClick={() => setAiMode("CHALLENGE")}
                    className="flex-1"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4 mr-1" /> {t('group.challengeModeShort')}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={createWithAI}
              disabled={creating || !aiPrompt.trim()}
              className="w-full active:scale-95"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {t('group.aiGeneratePlan')}
            </Button>
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template" className="space-y-4 pt-4">
            <div className="grid gap-3">
              {PLAN_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedTemplate === template.id
                      ? "border-[#0066cc] bg-primary/5 dark:bg-primary/10"
                      : "border-border hover:border-[#0066cc]/50"
                  )}
                >
                  <div className="font-semibold">{template.name}</div>
                  <div className="text-sm text-muted-foreground">{template.description}</div>
                  <div className="text-xs text-primary dark:text-primary mt-1">
                    {t('group.templateDaysChapters', { days: template.durationDays, chapters: template.readings.reduce((sum, r) => sum + r.chapters.length, 0) })}
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={createFromTemplate}
              disabled={creating || !selectedTemplate}
              className="w-full active:scale-95"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <BookOpen className="w-4 h-4 mr-2" />
              )}
              {t('group.useThisTemplate')}
            </Button>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('group.planName')}</Label>
              <Input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={t('group.planNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('group.planDescOptional')}</Label>
              <Input
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                placeholder={t('group.planDescPlaceholder')}
              />
            </div>

            {/* Book and Chapter Selection */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{t('group.startBook')}</Label>
                <select
                  value={manualStartBook}
                  onChange={(e) => {
                    setManualStartBook(e.target.value);
                    setManualStartChapter(1);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {BIBLE_BOOKS.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('group.startChapter')}</Label>
                <Input
                  type="number"
                  value={manualStartChapter}
                  onChange={(e) => {
                    const book = BIBLE_BOOKS.find(b => b.id === manualStartBook);
                    const maxChapter = book?.chapters || 1;
                    const value = parseInt(e.target.value) || 1;
                    setManualStartChapter(Math.max(1, Math.min(value, maxChapter)));
                  }}
                  min={1}
                  max={BIBLE_BOOKS.find(b => b.id === manualStartBook)?.chapters || 1}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('group.chaptersPerDay')}</Label>
                <Input
                  type="number"
                  value={manualChaptersPerDay}
                  onChange={(e) => setManualChaptersPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('group.planDays')}</Label>
                <Input
                  type="number"
                  value={manualDays}
                  onChange={(e) => setManualDays(parseInt(e.target.value) || 7)}
                  min={1}
                  max={365}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('group.mode')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={manualMode === "NORMAL" ? "default" : "outline"}
                    onClick={() => setManualMode("NORMAL")}
                    className="flex-1"
                    size="sm"
                  >
                    <Target className="w-4 h-4 mr-1" /> {t('group.normalMode')}
                  </Button>
                  <Button
                    variant={manualMode === "CHALLENGE" ? "default" : "outline"}
                    onClick={() => setManualMode("CHALLENGE")}
                    className="flex-1"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4 mr-1" /> {t('group.challengeModeShort')}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('group.manualPlanSummary', {
                book: BIBLE_BOOKS.find(b => b.id === manualStartBook)?.name || manualStartBook,
                chapter: manualStartChapter,
                chaptersPerDay: manualChaptersPerDay,
                days: manualDays
              })}
            </p>
            <Button
              onClick={createManual}
              disabled={creating || !manualName.trim()}
              className="w-full active:scale-95"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Pencil className="w-4 h-4 mr-2" />
              )}
              {t('group.createPlan')}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
