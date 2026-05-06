# TTS Voice Selection Design

## Summary

Add voice selection to the TTS system, allowing users to choose from 6 curated voices (3 Chinese, 3 English) in the settings panel. The selected voice persists across sessions.

## Voice List

| ID | Label | Language | Gender | Style |
|---|---|---|---|---|
| `zh-CN-XiaoxiaoNeural` | 晓晓 | 中文 | 女 | 温暖，适合朗读 |
| `zh-CN-YunxiNeural` | 云希 | 中文 | 男 | 阳光活泼 |
| `zh-CN-YunjianNeural` | 云健 | 中文 | 男 | 激情有力 |
| `en-US-AriaNeural` | Aria | 英文 | 女 | 自信积极 |
| `en-US-GuyNeural` | Guy | 英文 | 男 | 热情 |
| `en-US-JennyNeural` | Jenny | 英文 | 女 | 友好亲切 |

Default: `zh-CN-XiaoxiaoNeural` (matches current behavior).

## Data Flow

```
Settings panel voice selector → store.ttsVoice (persisted to localStorage)
        ↓
useAudioPlayer.play() reads store.ttsVoice
        ↓
POST /api/tts { text, voice: "zh-CN-YunxiNeural" }
        ↓
route.ts extracts voice param, passes to Python script
        ↓
python3 scripts/tts.py "text" "/tmp/tts-xxx.mp3" "zh-CN-YunxiNeural"
        ↓
edge-tts generates MP3 with specified voice → returns audio
```

Browser fallback path unchanged — auto-detects voice, not affected by user selection.

## File Changes

### `scripts/tts.py`
- Accept 3rd optional argument `voice`, default `zh-CN-XiaoxiaoNeural`
- Pass voice to `edge_tts.Communicate(text, voice=voice)`

### `app/api/tts/route.ts`
- Destructure `voice` from request body (optional, fallback to default)
- Pass as 3rd argument to Python script invocation

### `store/slices.ts` — ReaderSlice
- Add `ttsVoice: string` state, default `zh-CN-XiaoxiaoNeural`
- Add setter `setTtsVoice`
- Persisted via existing Zustand persist mechanism

### `hooks/use-audio-player.ts`
- In `play()`, read `ttsVoice` from store
- Send `voice` field in POST body to `/api/tts`

### `lib/constants.ts`
- Add `TTS_VOICES` constant array with `{ id, label, lang, gender }` for each voice

### `lib/i18n/zh/settings.ts` + `lib/i18n/en/settings.ts`
- Add voice selection i18n labels (e.g., "朗读声音", "Reading Voice")

### Settings panel (`app/page.tsx`)
- Add a dropdown/select in the "语音朗读 / Text-to-Speech" section
- Options generated from `TTS_VOICES` constant
- Bound to `store.ttsVoice` via `setTtsVoice`

## Out of Scope

- Browser fallback voice selection
- Dynamic voice list from edge-tts API
- Per-verse or per-book voice configuration
- Voice preview/sample playback
