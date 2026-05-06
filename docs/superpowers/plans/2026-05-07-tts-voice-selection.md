# TTS Voice Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add voice selection to the TTS system, allowing users to choose from 6 curated voices (3 Chinese, 3 English) in the settings panel.

**Architecture:** Pass a `voice` parameter from the Zustand store through the audio player hook to the API route and Python script. The Python script uses the voice parameter with edge-tts. Voice preference is persisted via existing Zustand localStorage persistence.

**Tech Stack:** Next.js API route, edge-tts Python library, Zustand store, Radix UI Select component

---

### Task 1: Add TTS_VOICES constant to lib/constants.ts

**Files:**
- Modify: `lib/constants.ts`

- [ ] **Step 1: Add TTS_VOICES constant after BIBLE_VERSIONS**

Add the following constant after the `BIBLE_VERSIONS` block (after line 21):

```typescript
// TTS voice options (edge-tts)
export const TTS_VOICES = [
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓', lang: 'zh', gender: 'female' },
  { id: 'zh-CN-YunxiNeural', label: '云希', lang: 'zh', gender: 'male' },
  { id: 'zh-CN-YunjianNeural', label: '云健', lang: 'zh', gender: 'male' },
  { id: 'en-US-AriaNeural', label: 'Aria', lang: 'en', gender: 'female' },
  { id: 'en-US-GuyNeural', label: 'Guy', lang: 'en', gender: 'male' },
  { id: 'en-US-JennyNeural', label: 'Jenny', lang: 'en', gender: 'female' },
] as const;

export type TtsVoiceId = typeof TTS_VOICES[number]['id'];
export const DEFAULT_TTS_VOICE: TtsVoiceId = 'zh-CN-XiaoxiaoNeural';
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add TTS_VOICES constant for voice selection"
```

---

### Task 2: Add ttsVoice state to ReaderSlice

**Files:**
- Modify: `store/types.ts` (ReaderSlice interface, line 305)
- Modify: `store/slices.ts` (createReaderSlice, line 109)

- [ ] **Step 1: Add ttsVoice and setTtsVoice to ReaderSlice interface in store/types.ts**

In the `ReaderSlice` interface (starting at line 305), add after `setChapterSpeechText`:

```typescript
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
```

- [ ] **Step 2: Add ttsVoice state and setter to createReaderSlice in store/slices.ts**

In `createReaderSlice` (starting at line 109), add after `setChapterSpeechText: (text) => set({ chapterSpeechText: text }),` (line 146):

```typescript
  ttsVoice: 'zh-CN-XiaoxiaoNeural',
  setTtsVoice: (voice) => set({ ttsVoice: voice }),
```

- [ ] **Step 3: Verify ttsVoice is persisted in the store partialize**

Check `store/useBibleStore.ts` — the `partialize` function does NOT exclude `ttsVoice`, so it will be automatically persisted to localStorage via the existing Zustand persist middleware. No changes needed here.

- [ ] **Step 4: Commit**

```bash
git add store/types.ts store/slices.ts
git commit -m "feat: add ttsVoice state to ReaderSlice"
```

---

### Task 3: Update Python TTS script to accept voice parameter

**Files:**
- Modify: `scripts/tts.py`

- [ ] **Step 1: Replace the entire tts.py with voice parameter support**

Replace the full content of `scripts/tts.py` with:

```python
# scripts/tts.py
import sys
import asyncio
import edge_tts

# 接收命令行参数：1. 要朗读的文本 2. 输出文件路径 3. 声音名称（可选，默认晓晓）
TEXT = sys.argv[1]
OUTPUT_FILE = sys.argv[2]
VOICE = sys.argv[3] if len(sys.argv) > 3 else "zh-CN-XiaoxiaoNeural"

async def amain():
    communicate = edge_tts.Communicate(TEXT, VOICE)
    await communicate.save(OUTPUT_FILE)

if __name__ == "__main__":
    asyncio.run(amain())
```

- [ ] **Step 2: Test the script manually**

Run: `.venv/bin/python3 scripts/tts.py "测试语音" /tmp/tts-test-voice.mp3 zh-CN-YunxiNeural`
Expected: MP3 file created at `/tmp/tts-test-voice.mp3`

- [ ] **Step 3: Commit**

```bash
git add scripts/tts.py
git commit -m "feat: add voice parameter to tts.py script"
```

---

### Task 4: Update TTS API route to accept and pass voice parameter

**Files:**
- Modify: `app/api/tts/route.ts`

- [ ] **Step 1: Extract voice from request body and pass to Python script**

In `app/api/tts/route.ts`, make two changes:

1. Line 16: Change `const { text } = await req.json();` to:
```typescript
    const { text, voice } = await req.json();
```

2. Line 31: Change the `execFileAsync` call to pass voice as 3rd argument:
```typescript
    const args = [scriptPath, safeText, tempFilePath];
    if (voice && typeof voice === 'string') args.push(voice);
    const { stderr } = await execFileAsync(pythonBin, args, { timeout: 30000 });
```

- [ ] **Step 2: Commit**

```bash
git add app/api/tts/route.ts
git commit -m "feat: pass voice parameter through TTS API route"
```

---

### Task 5: Update useAudioPlayer hook to send voice parameter

**Files:**
- Modify: `hooks/use-audio-player.ts`

- [ ] **Step 1: Read ttsVoice from store and send in API request**

In `hooks/use-audio-player.ts`, make two changes:

1. After line 3 (`import { useBibleStore } from '@/store/useBibleStore';`), no new import needed — `useBibleStore` is already imported.

2. In the `play` function, around line 228-231, change the fetch call from:
```typescript
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
```
to:
```typescript
        const { ttsVoice } = useBibleStore.getState();
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: ttsVoice }),
        });
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-audio-player.ts
git commit -m "feat: send ttsVoice from store to TTS API"
```

---

### Task 6: Add i18n labels for voice selection

**Files:**
- Modify: `lib/i18n/zh/settings.ts`
- Modify: `lib/i18n/en/settings.ts`

- [ ] **Step 1: Add voice selection labels to Chinese i18n**

In `lib/i18n/zh/settings.ts`, add after the `tts: '语音朗读',` line (line 20):

```typescript
    ttsVoice: '朗读声音',
    ttsVoiceZh: '中文',
    ttsVoiceEn: '英文',
    ttsVoiceFemale: '女声',
    ttsVoiceMale: '男声',
```

- [ ] **Step 2: Add voice selection labels to English i18n**

In `lib/i18n/en/settings.ts`, add after the `tts: 'Text-to-Speech',` line (line 20):

```typescript
    ttsVoice: 'Reading Voice',
    ttsVoiceZh: 'Chinese',
    ttsVoiceEn: 'English',
    ttsVoiceFemale: 'Female',
    ttsVoiceMale: 'Male',
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/zh/settings.ts lib/i18n/en/settings.ts
git commit -m "feat: add i18n labels for TTS voice selection"
```

---

### Task 7: Add voice selector to settings panel UI

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add imports for TTS_VOICES and Select component**

At the top of `app/page.tsx`, add to the existing imports:

```typescript
import { TTS_VOICES } from '@/lib/constants';
```

Check if `Select` from Radix UI is already imported. If not, add:
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

- [ ] **Step 2: Add ttsVoice and setTtsVoice from store**

Find where other store values are destructured (e.g., `fontSize`, `setFontSize`, `chapterSpeechText`) and add:
```typescript
  ttsVoice, setTtsVoice,
```

- [ ] **Step 3: Add voice selector UI in the TTS section**

In the settings panel, after the `HeaderPlayer` component (around line 413), add the voice selector:

```tsx
                 <div className="mt-3">
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground font-semibold">{t('settings.ttsVoice')}</span>
                     <Select value={ttsVoice} onValueChange={setTtsVoice}>
                       <SelectTrigger className="w-40">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {TTS_VOICES.map((v) => (
                           <SelectItem key={v.id} value={v.id}>
                             {v.label} ({v.lang === 'zh' ? t('settings.ttsVoiceZh') : t('settings.ttsVoiceEn')} · {v.gender === 'female' ? t('settings.ttsVoiceFemale') : t('settings.ttsVoiceMale')})
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
```

This should be placed inside the same `bg-secondary/50 p-4 rounded-xl` div that contains the TTS section, right after the `HeaderPlayer` component.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add voice selector dropdown to settings panel"
```

---

### Task 8: Build verification and deployment

**Files:** None (verification only)

- [ ] **Step 1: Rebuild Docker containers**

Run: `docker-compose down && docker-compose up -d --build`

- [ ] **Step 2: Verify build succeeds with no errors**

Check Docker logs: `docker-compose logs web --tail=30`
Expected: No build errors, server listening on port 3000

- [ ] **Step 3: Run auto_deploy**

Run: `./auto_deploy.sh -s "feat: TTS语音支持多声音选择" -d "新增6种朗读声音（3中文+3英文），在设置面板可选择。改动包括：1) scripts/tts.py支持voice参数；2) API路由传递voice参数；3) Zustand store新增ttsVoice状态并持久化；4) useAudioPlayer hook发送voice到API；5) 设置面板新增声音下拉选择器；6) i18n新增声音相关文案。"`

---

## Self-Review Checklist

- [x] Spec coverage: All spec requirements mapped to tasks (voice list, data flow, file changes, UI, persistence)
- [x] Placeholder scan: No TBD/TODO/placeholders — all steps contain actual code
- [x] Type consistency: `ttsVoice: string` used consistently across types, slice, hook, and API; `TTS_VOICES` constant matches voice IDs used in Python script
