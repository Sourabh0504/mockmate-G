# MockMate AI — Voice Pipeline Research & Decision

**Date:** 2026-03-11  
**Purpose:** Complete research on all STT (Speech-to-Text) and TTS (Text-to-Speech) solutions for MockMate AI's real-time voice interview system — comparing free libraries, cloud APIs, browser-native options, and Python built-in tools across budget, latency, and quality axes.

---

## Table of Contents

1. [MockMate Voice Requirements](#1-mockmate-voice-requirements)
2. [Current Architecture & Its Problem](#2-current-architecture--its-problem)
3. [STT Solutions — Complete Analysis](#3-stt-solutions--complete-analysis)
4. [TTS Solutions — Complete Analysis](#4-tts-solutions--complete-analysis)
5. [Pricing Comparison](#5-pricing-comparison)
6. [Architecture Options](#6-architecture-options)
7. [Technical Integration Details](#7-technical-integration-details)
8. [Recommendation & Phased Plan](#8-recommendation--phased-plan)

---

## 1. MockMate Voice Requirements

MockMate is a **real-time, bidirectional voice interview app** (from plan.md & idea.md). The voice pipeline must support:

### Critical Real-Time Requirements

| Requirement | Detail | Impact on Latency |
|---|---|---|
| **10s initial timer** | User must start speaking within 10s of question asked | STT must detect first word within ~500ms |
| **7s silence detection** | After user stops speaking, 7s countdown starts | STT must stream continuously; silence = end of answer |
| **120s max answer** | Hard cap on answer duration | Long-running streaming required |
| **Interruption (barge-in)** | User speaks while AI talks → AI stops immediately | TTS must be cancellable mid-stream |
| **"Repeat" detection** | Detect phrases like "can you repeat that" in real-time | STT must deliver partial results fast |
| **Speaking pace feedback** | Track words/sec for 2.5–4 wps indicator | Need word-level timestamps or count |
| **Transition phrases** | AI says "Alright", "I see" between questions | TTS must speak short phrases with low startup time |
| **10-30 min sessions** | Continuous operation for full duration | No session timeout under 30 min |
| **No audio stored** | Privacy-first: all audio is ephemeral | Process in memory, discard immediately |

### Audio Technical Specs (Currently Implemented)

```
Frontend → Backend:  16-bit PCM @ 16kHz, mono, ~100ms chunks via WebSocket
Backend → Frontend:  PCM audio chunks via WebSocket for playback
Audio Format:        audio/pcm;rate=16000 (input), 24kHz (output)
Capture Method:      AudioWorklet (pcm-processor.js) in useAudioCapture.js
Playback Method:     Web Audio API (useAudioPlayback.js) with gapless buffering
Transport:           WebSocket (interview_ws.py ↔ useInterviewWS.js)
```

### Acceptable Latency Budget

For a **natural interview feel**, the total time from "user finishes speaking" to "AI starts speaking next question":

```
STT finalization:     ~200-500ms
LLM response:         ~500-1500ms  (Gemini picks next question / generates transition)
TTS first byte:       ~200-500ms
────────────────────────────────
Total target:          ~1-2.5 seconds  (acceptable for natural interview pacing)
```

> The original `idea.md` specified **ElevenLabs Scribe (150ms STT)** + **Sonic-3 Cartesia (90ms TTS)**. These are premium paid services ($0.03-0.10/min). We need free/cheaper alternatives.

---

## 2. Current Architecture & Its Problem

```
Browser Mic (16kHz PCM) → WebSocket → FastAPI Backend → Gemini Live API → WebSocket → Browser Speaker
                                                         (STT + LLM + TTS all-in-one bidirectional session)
```

**Current Model:** `gemini-2.5-flash-native-audio-preview-12-2025` via `google-genai` SDK

**Strengths:**
- Single ecosystem — simplest integration code
- Built-in bidirectional audio streaming
- Input + output transcription via callbacks
- Natural voice with built-in VAD
- Barge-in detection via `on_interrupted` callback
- 15-min session auto-reconnect already implemented

**Problems:**
- ❌ Free tier quota exhausted (`limit: 0` reached on `gemini-2.0-flash`)
- ❌ Free tier has very restrictive rate limits (5-15 RPM)
- ❌ Paid pricing is steep: **$3/M tokens** input audio, **$12/M tokens** output audio
- ❌ 15-minute session limit requires reconnection logic (already coded, but adds complexity)
- ❌ Single point of failure — if Gemini API goes down, entire interview breaks

---

## 3. STT Solutions — Complete Analysis

### 3.1 Free Python Libraries (No API Key, Fully Offline)

#### 🏆 Vosk — Best Free Offline Real-Time STT

```python
# pip install vosk
from vosk import Model, KaldiRecognizer
import json

model = Model("vosk-model-small-en-us-0.15")  # 40MB small model
rec = KaldiRecognizer(model, 16000)            # 16kHz — matches our PCM exactly!

# Feed PCM chunks as they arrive from WebSocket:
if rec.AcceptWaveform(pcm_bytes):                # Returns True when utterance complete
    final = json.loads(rec.Result())             # {"text": "hello my name is sourabh"}
else:
    partial = json.loads(rec.PartialResult())    # {"partial": "hello my name"}
```

| Attribute | Details |
|---|---|
| **License** | Apache 2.0 (fully free, commercial OK) |
| **Cost** | **$0 forever** |
| **Runs offline** | ✅ Yes — no internet required |
| **Real-time streaming** | ✅ Native — `AcceptWaveform()` + `PartialResult()` |
| **Latency** | ~50-150ms (local processing, zero network) |
| **Accuracy (WER)** | 10-15% (small), ~8% (large model) |
| **Languages** | 20+ languages |
| **Model sizes** | Small: 40MB, Medium: 200MB, Large: 1.8GB |
| **GPU needed** | ❌ No — runs on CPU |
| **Python install** | `pip install vosk` |
| **Privacy** | ✅ 100% local, no data leaves server |
| **Silence detection** | ✅ Built-in endpoint detection |
| **MockMate fit** | ✅ 16kHz PCM input matches perfectly, streaming API fits WebSocket pattern |

**Pros:** Zero cost, zero network latency, works offline, privacy-compliant, already matches our audio format  
**Cons:** Lower accuracy than cloud APIs (~85-90%), limited accent handling, no speaker diarization

---

#### OpenAI Whisper — Best Free Accuracy (Not Real-Time)

| Attribute | Details |
|---|---|
| **License** | MIT (fully free) |
| **Cost** | $0 |
| **Real-time** | ⚠️ Not natively — batch/chunk-oriented |
| **Latency** | 1-5s per chunk (too slow for real-time) |
| **Accuracy (WER)** | 5-8% (industry-leading for free) |
| **Languages** | 99+ |
| **Model sizes** | tiny (39MB) → large-v3 (6GB) |
| **GPU needed** | ✅ Recommended for speed |
| **Streaming** | ❌ No native streaming |
| **Turbo variants** | `whisper-large-v3-turbo` (50% faster), `distil-whisper` (6x faster, 1% WER increase) |
| **Best for** | Post-interview batch re-transcription (not live) |

**Verdict:** Excellent accuracy but **not usable for real-time** interviews. Could be used as a post-interview re-transcription pass for better accuracy in reports.

---

#### RealtimeSTT — Real-Time Wrapper Library

| Attribute | Details |
|---|---|
| **License** | MIT |
| **Install** | `pip install RealtimeSTT` |
| **Real-time** | ✅ Purpose-built for real-time |
| **Features** | VAD, wake word detection, instant transcription |
| **Backend engines** | Whisper, Vosk, Google, Azure |
| **MockMate fit** | ⚠️ Wrapper adds overhead; better to use Vosk directly |

---

#### NVIDIA Parakeet TDT — Ultra-Fast (GPU Required)

| Attribute | Details |
|---|---|
| **License** | CC-BY-4.0 |
| **Latency** | Ultra-low streaming (fastest open model) |
| **Accuracy** | Near Whisper-large quality |
| **GPU needed** | ✅ NVIDIA GPU required |
| **MockMate fit** | ❌ Requires GPU infrastructure we don't have |

---

#### `SpeechRecognition` Python Library (Wrapper)

```python
# pip install SpeechRecognition
import speech_recognition as sr
recognizer = sr.Recognizer()
```

A wrapper library that supports multiple backends:

| Backend | Offline | Real-time | Quality | Notes |
|---|---|---|---|---|
| **Google Speech (free)** | ❌ | ✅ | ★★★★ | Uses hidden free API — unreliable, can break |
| **CMU Sphinx (PocketSphinx)** | ✅ | ⚠️ Batch | ★★☆☆ | `pip install pocketsphinx`, very old technology |
| **Vosk** | ✅ | ✅ | ★★★☆ | Better to use Vosk directly |
| **Whisper (local)** | ✅ | ❌ | ★★★★★ | GPU needed, not real-time |

> **Verdict:** If using Vosk, use it directly rather than through this wrapper, for better control over streaming and partial results.

---

### 3.2 Browser-Native STT

#### Web Speech API (SpeechRecognition)

| Attribute | Details |
|---|---|
| **Cost** | 🆓 Completely free |
| **Browser** | ⚠️ Chrome/Edge only (❌ No Firefox/Safari) |
| **Real-time** | ✅ Yes |
| **Latency** | ~200-500ms |
| **Accuracy** | ~90% (good conditions) |
| **Offline** | ❌ Sends audio to Google servers |
| **Session limit** | ⚠️ **60-second auto-cutoff on desktop Chrome** |
| **Custom vocab** | ❌ No |

> [!WARNING]
> The Web Speech API has a **60-second timeout** on desktop Chrome and is **NOT suitable** for MockMate's 10-30 minute interviews. It would require constant restart logic and introduce reliability risks.

---

### 3.3 Cloud API STT

#### Deepgram Nova-3 — ⭐ Best Cloud STT (Generous Free Credits)

| Attribute | Details |
|---|---|
| **Free tier** | 🆓 **$200 credits** (~433 hours, no expiry, no credit card) |
| **Paid price** | $0.0077/min |
| **Latency** | **200-300ms TTFT** (industry-leading) |
| **Accuracy** | ~95%+ |
| **Streaming** | ✅ Real-time WebSocket API |
| **Features** | Diarization, punctuation, language detection, keyword spotting |
| **Best for** | Production apps needing best latency + accuracy combo |

---

#### AssemblyAI Universal

| Attribute | Details |
|---|---|
| **Free tier** | 🆓 **$50 credits** (~185 hrs pre-recorded, ~333 hrs streaming) |
| **Paid price** | $0.0025/min (cheapest cloud STT) |
| **Latency** | ~300-500ms |
| **Accuracy** | ~95%+ |
| **Streaming** | ✅ Real-time WebSocket API |
| **Features** | Sentiment analysis, topic detection, PII redaction |

---

#### Google Cloud Speech-to-Text

| Attribute | Details |
|---|---|
| **Free tier** | 🆓 60 min/month + $300 new customer credits |
| **Paid price** | $0.016/min |
| **Latency** | ~300-500ms |
| **Accuracy** | ~94-96% |
| **Streaming** | ✅ Real-time streaming |

---

## 4. TTS Solutions — Complete Analysis

### 4.1 Free Python Libraries

#### 🏆 Edge-TTS — Best Free Natural TTS

```python
# pip install edge-tts
import edge_tts, base64

async def speak_to_client(websocket, text, voice="en-US-GuyNeural"):
    """Stream TTS audio to the client via WebSocket (replaces Gemini Live TTS)."""
    communicate = edge_tts.Communicate(text, voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            encoded = base64.b64encode(chunk["data"]).decode("ascii")
            await websocket.send_json({"type": "audio_data", "data": encoded})
    await websocket.send_json({"type": "turn_complete"})
```

| Attribute | Details |
|---|---|
| **License** | GPL v3 |
| **Cost** | **$0** — uses Microsoft Edge's built-in neural voices |
| **Quality** | ★★★★☆ Very natural neural voices |
| **Voices** | 100+ voices across many languages |
| **Latency** | ~200-500ms TTFB (network to Microsoft servers) |
| **Streaming** | ✅ Async streaming — perfect for WebSocket |
| **Rate/pitch** | ✅ Adjustable |
| **Offline** | ❌ Requires internet |
| **Reliability** | ⚠️ Unofficial reverse-engineered API — could break |
| **MockMate fit** | ✅ Natural voice, async streaming, easy integration |

**Professional interviewer voice options:**
- `en-US-GuyNeural` — Male, professional (recommended)
- `en-US-AndrewNeural` — Male, warm
- `en-US-JennyNeural` — Female, friendly
- `en-US-AriaNeural` — Female, professional

> [!CAUTION]
> Edge-TTS reverse-engineers Microsoft's internal API. It works great but **could stop working** if Microsoft changes their endpoints. Good for development; consider a backup plan for production.

---

#### Piper — Best Free Offline TTS

| Attribute | Details |
|---|---|
| **License** | MIT |
| **Cost** | $0 |
| **Quality** | ★★★☆☆ Good neural voices (not premium tier) |
| **Latency** | Very low (~50-100ms, fully local) |
| **Offline** | ✅ Fully offline |
| **GPU** | ❌ Runs on CPU |
| **Model size** | 15-80MB per voice |
| **Streaming** | ⚠️ Generates full audio, not true streaming |
| **MockMate fit** | ✅ Good fallback if Edge-TTS breaks |

---

#### pyttsx3 — Python Built-in TTS (Robotic)

```python
# pip install pyttsx3
import pyttsx3
engine = pyttsx3.init()  # SAPI5 (Windows), NSSpeechSynthesizer (Mac), eSpeak (Linux)
engine.setProperty('rate', 150)
engine.say("Please introduce yourself.")
engine.runAndWait()  # Blocks until speech completes
```

| Attribute | Details |
|---|---|
| **Cost** | $0 |
| **Offline** | ✅ Fully offline |
| **Quality** | ★★☆☆☆ **Robotic** — uses OS system voices |
| **Streaming** | ❌ Generates full audio, then plays |
| **MockMate fit** | ❌ Too robotic for professional interviewer persona |

---

#### gTTS (Google Translate TTS)

```python
# pip install gTTS
from gtts import gTTS
tts = gTTS("Please introduce yourself.", lang='en')
tts.save("output.mp3")  # Generates entire file — no streaming
```

| Attribute | Details |
|---|---|
| **Cost** | $0 (uses Google Translate API) |
| **Quality** | ★★★☆☆ Decent but monotone |
| **Streaming** | ❌ No — generates complete file |
| **MockMate fit** | ❌ No streaming, too slow for real-time |

---

#### Coqui TTS — High Quality (Unmaintained)

| Attribute | Details |
|---|---|
| **License** | MPL 2.0 |
| **Quality** | ★★★★☆ Very natural with XTTS-v2, supports voice cloning |
| **GPU** | ✅ Recommended for real-time |
| **Status** | ⚠️ CoquiAI ceased active maintenance in 2024 |
| **MockMate fit** | ⚠️ Great quality but risky due to no maintenance |

---

#### Qwen3-TTS — Cutting Edge (Jan 2026)

| Attribute | Details |
|---|---|
| **Latency** | **97ms end-to-end** (extremely fast) |
| **Quality** | ★★★★★ State-of-the-art |
| **Languages** | 10 languages |
| **Models** | 0.6B and 1.7B parameters |
| **GPU** | ✅ Required |
| **MockMate fit** | ❌ Too large, requires GPU infrastructure |

---

### 4.2 Cloud API TTS

#### Deepgram Aura-2

| Attribute | Details |
|---|---|
| **Free tier** | Included in $200 credits |
| **Paid price** | $0.030/1K characters |
| **Latency** | Sub-200ms TTFB |
| **Quality** | ★★★★☆ |
| **Streaming** | ✅ Real-time |

#### Google Cloud TTS

| Attribute | Details |
|---|---|
| **Free tier** | 🆓 4M chars/month (Standard), 1M chars/month (WaveNet/Chirp) |
| **Standard** | $4/1M characters |
| **WaveNet** | $16/1M characters |
| **Chirp 3 HD** | $30/1M characters |
| **Quality** | ★★★★☆ WaveNet is very natural |
| **Latency** | ~200-400ms |

#### Gemini TTS (Current)

| Attribute | Details |
|---|---|
| **Free tier** | Very limited (5-15 RPM) |
| **Paid price** | $10-12/1M output audio tokens 💰 |
| **Quality** | ★★★★★ Best natural voice |
| **Latency** | ~100-300ms |

---

## 5. Pricing Comparison

### STT — Cost per 1 Hour of Interview

| Service | Cost/Hour | Free Tier | Hours Free |
|---|---|---|---|
| **Vosk** | **$0** | ♾️ Unlimited | ∞ |
| **Web Speech API** | **$0** | ♾️ (Chrome only) | ∞ (but 60s timeout) |
| **AssemblyAI** | $0.15 | $50 credits | ~333 hrs |
| **Deepgram Nova-3** | $0.46 | $200 credits | ~433 hrs |
| **Google Cloud STT** | $0.96 | 60 min/month | 1 hr/month |
| **Gemini Live** | ~$1.08 | Very limited | ~few hours |

### TTS — Cost per 1 Hour of AI Speech (~12,000 characters)

| Service | Cost/Hour | Free Tier |
|---|---|---|
| **Edge-TTS** | **$0** | ♾️ Unlimited |
| **pyttsx3** | **$0** | ♾️ (robotic quality) |
| **Piper** | **$0** | ♾️ (decent quality) |
| **Google Cloud Standard** | $0.05 | 4M chars/month |
| **Google Cloud WaveNet** | $0.19 | 1M chars/month |
| **Deepgram Aura-2** | $0.36 | In $200 credits |
| **Gemini Live TTS** | ~$1.44 | Very limited |

---

## 6. Architecture Options

### Option A: Full Free — Vosk + Gemini LLM + Edge-TTS [$0]

```
Browser Mic (16kHz PCM)
    → WebSocket
    → FastAPI Backend
         ├→ Vosk STT (local, ~100ms)
         │    → Partial text → "Repeat?" keyword match
         │    → Final text → Silence detection → Answer finalized
         │
         ├→ Gemini 2.0 Flash Lite (free tier LLM)
         │    → Evaluate answer / Generate transition / Pick next question
         │
         └→ Edge-TTS (streaming, ~300ms TTFB)
              → Audio chunks → WebSocket → Browser Speaker
```

| Metric | Value |
|---|---|
| **Total cost** | **$0** |
| **STT latency** | ~100-150ms (local) |
| **LLM latency** | ~500-1500ms |
| **TTS latency** | ~200-500ms TTFB |
| **Total response** | **~0.8-2.1 seconds** |
| **Accuracy** | ~85-90% (Vosk) |
| **Reliability** | ⚠️ Edge-TTS depends on Microsoft |
| **Code changes** | Medium — refactor `gemini_live_service.py` |

**Files that need changes:**
1. `gemini_live_service.py` → Replace with `vosk_stt_service.py` + `edge_tts_service.py`
2. `interview_ws.py` → Route audio to Vosk; route questions to Edge-TTS
3. `requirements.txt` → Add `vosk`, `edge-tts`
4. Download Vosk model (~40-200MB) to server

---

### Option B: Best Free Credits — Deepgram + Gemini LLM + Edge-TTS [$0 for months]

```
Browser Mic → WebSocket → Backend → Deepgram WebSocket API (STT, 200-300ms)
                                       → Gemini Flash Lite (LLM)
                                       → Edge-TTS (streaming) → WebSocket → Browser
```

| Metric | Value |
|---|---|
| **Total cost** | **$0 for ~433 hours** (Deepgram credits), then $0.0077/min |
| **STT latency** | ~200-300ms |
| **Total response** | **~0.7-2 seconds** |
| **Accuracy** | ~95% (much better accents) |
| **Reliability** | ✅ Deepgram is production-grade |
| **Code changes** | Medium — Deepgram WebSocket client |

---

### Option C: Simplest Fix — Enable Gemini Billing [~$1-3/hr]

```
Keep current architecture EXACTLY as-is.
Just enable billing on Google Cloud project.
Zero code changes.
```

| Metric | Value |
|---|---|
| **Total cost** | ~$1-3 per interview hour |
| **Code changes** | **Zero** |
| **Latency** | ~100-300ms (best possible — current) |
| **Reliability** | ✅ Already working and tested |

---

### Option D: Premium — Deepgram STT + Deepgram TTS [Lowest Latency]

```
Mic → Deepgram STT (200ms) → Gemini LLM → Deepgram TTS (sub-200ms) → Speaker
```

| Metric | Value |
|---|---|
| **Total cost** | $0.0077/min STT + $0.030/1K chars TTS |
| **Total response** | **~0.4-0.8 seconds** (near real-time) |
| **When to use** | Production / demo day |

---

## 7. Technical Integration Details

### 7.1 How Vosk Replaces Gemini Live STT

**Current code** in `interview_ws.py`:
```python
# audio_chunk → Gemini Live → on_input_transcript callback
await gemini_live.send_audio(pcm_bytes)
```

**New code** with Vosk:
```python
from vosk import Model, KaldiRecognizer
import json

model = Model("models/vosk-model-en-us-0.22")
recognizer = KaldiRecognizer(model, 16000)  # 16kHz matches our AudioWorklet

# In _handle_client_message when audio_chunk received:
if recognizer.AcceptWaveform(pcm_bytes):
    result = json.loads(recognizer.Result())
    text = result.get("text", "")
    if text:
        manager.receive_speech_text(text)  # Same as current on_input_transcript
else:
    partial = json.loads(recognizer.PartialResult())
    partial_text = partial.get("partial", "")
    # Use partial results for real-time "repeat?" detection
    if partial_text and manager.check_repeat_request(partial_text):
        # Handle repeat request...
```

**Key compatibility:** Vosk's `AcceptWaveform()` accepts 16-bit PCM at 16kHz — **exactly what our `pcm-processor.js` AudioWorklet produces**. Zero format conversion needed.

---

### 7.2 How Edge-TTS Replaces Gemini Live TTS

**Current code:**
```python
# text → Gemini Live → on_audio callback → WebSocket → browser
await gemini_live.send_text("Please introduce yourself.")
```

**New code:**
```python
import edge_tts, base64

async def speak_to_client(websocket, text, voice="en-US-GuyNeural"):
    communicate = edge_tts.Communicate(text, voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            encoded = base64.b64encode(chunk["data"]).decode("ascii")
            await websocket.send_json({"type": "audio_data", "data": encoded})
    await websocket.send_json({"type": "turn_complete"})

# Usage in interview_ws.py (replaces gemini_live.send_text()):
await speak_to_client(websocket, "Please introduce yourself.")
```

---

### 7.3 Silence Detection (Python Built-in `struct` Module)

With Gemini Live, silence detection was built-in (VAD). With Vosk, we need audio-level silence detection for the **7-second timer**:

```python
import struct

def detect_silence(pcm_bytes: bytes, threshold: int = 500) -> bool:
    """Check if audio chunk is below silence threshold using built-in struct module."""
    samples = struct.unpack(f"<{len(pcm_bytes) // 2}h", pcm_bytes)
    rms = (sum(s * s for s in samples) / len(samples)) ** 0.5
    return rms < threshold
```

This is a ~5-line function using **only the Python built-in `struct` module**. No extra dependencies.

---

### 7.4 Barge-In / Interruption Detection

**With Gemini Live (current):** `on_interrupted` callback fires automatically.

**With Vosk + Edge-TTS (new):** Manual detection during TTS streaming:

```python
# While TTS is streaming to client, if we receive an audio_chunk from user:
if is_tts_playing and not detect_silence(pcm_bytes, threshold=800):
    # User is speaking while AI is talking → barge-in!
    is_tts_playing = False  # Stop sending TTS chunks
    await websocket.send_json({"type": "turn_complete"})
    response = await manager.user_started_speaking()
    await websocket.send_json(response)
```

---

### 7.5 Speaking Pace Calculation (Built-in Python)

```python
import time

class PaceTracker:
    def __init__(self):
        self.word_count = 0
        self.start_time = None

    def add_text(self, text: str):
        if self.start_time is None:
            self.start_time = time.time()
        self.word_count += len(text.split())

    def get_wps(self) -> float:
        if not self.start_time:
            return 0
        elapsed = time.time() - self.start_time
        return self.word_count / max(elapsed, 0.1)

    def get_feedback(self) -> str:
        wps = self.get_wps()
        if wps < 2.5: return "too_slow"
        if wps > 4.0: return "too_fast"
        return "good"
```

Uses only built-in `time` module. No dependencies.

---

## 8. Recommendation & Phased Plan

### 🚀 Phase 1: Get It Working NOW — $0

> Immediately switch from Gemini Live to a **separated pipeline** using free tools:

| Component | Tool | Install | Cost |
|---|---|---|---|
| **STT** | Vosk (offline) | `pip install vosk` + 40MB model | $0 |
| **LLM** | Gemini 2.0 Flash Lite | Already configured — change model name | $0 |
| **TTS** | Edge-TTS | `pip install edge-tts` | $0 |
| **Silence** | Python `struct` | Built-in, zero install | $0 |
| **Pace** | Python `time` | Built-in, zero install | $0 |

**Latency:** ~0.8-2.1s total | **Cost:** $0

---

### 🔄 Phase 2: Improve Accuracy — Still $0

> Upgrade STT to Deepgram for better accent handling (Indian English, etc.):

| Component | Tool | Cost |
|---|---|---|
| **STT** | Deepgram Nova-3 ($200 free credits) | Free for 433 hours |
| **LLM** | Gemini 2.0 Flash Lite | $0 |
| **TTS** | Edge-TTS OR Google Cloud WaveNet (1M free chars/month) | $0 |

**Latency:** ~0.7-2s | **Accuracy:** ~95%

---

### 💎 Phase 3: Production / Demo Day

| Component | Tool | Cost |
|---|---|---|
| **STT** | Deepgram Nova-3 | $0.0077/min |
| **LLM** | Gemini 2.5 Flash | Pay-as-you-go |
| **TTS** | Deepgram Aura-2 OR keep Edge-TTS | $0.030/1K chars or $0 |

**Latency:** ~0.4-0.8s (near real-time)

---

### Quick Decision Table

| If your situation is... | Use this option |
|---|---|
| **Budget = absolute $0** | **Phase 1:** Vosk + Gemini Free + Edge-TTS |
| **Budget = $0 but want quality** | **Phase 2:** Deepgram (free credits) + Edge-TTS |
| **Want zero code changes** | **Option C:** Enable Gemini billing (~$1-3/hr) |
| **Want lowest latency possible** | **Option D:** Deepgram STT + Deepgram TTS (~400ms) |
| **Demo day / presentation** | **Phase 3:** Deepgram + Gemini Paid + Deepgram TTS |

---

### Dependency Summary for Phase 1

```txt
# Add to backend/requirements.txt
vosk==0.3.45          # Offline real-time STT engine
edge-tts==7.0.2       # Free Microsoft neural TTS (streaming)

# Download one Vosk English model (one-time):
# Small  (40MB):   https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
# Medium (200MB):  https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip
# Large  (1.8GB):  https://alphacephei.com/vosk/models/vosk-model-en-us-0.42-gigaspeech.zip
```

### Python Built-in Modules Used (No Install Needed)
- `struct` — PCM audio processing for silence detection
- `json` — Vosk result parsing (already used)
- `asyncio` — Async TTS streaming (already used)
- `base64` — WebSocket audio encoding (already used)
- `time` — Speaking pace calculation (already used)

> [!IMPORTANT]
> **The simplest path is to enable billing on Google Cloud** (Option C) — zero code changes. But if budget is truly $0, **Option A (Vosk + Edge-TTS) is the best free stack** and the total ~0.8-2.1s latency is perfectly acceptable for interview pacing where humans naturally take 1-3 seconds between turns.

---

## 9. Executive Summary: The Ultimate Cost-Saving Plan

If the primary goal is to **minimize API costs to absolutely $0** while maintaining an acceptable real-time interview experience, the definitive architecture path is **Architecture Option A (The Full Offline/Free Stack)**.

### The $0 Cost Stack Blueprint:
1. **Speech-to-Text (STT):** Migrate away from Gemini Live's audio input and implement **Vosk**. 
   - *Why:* It runs 100% locally on your machine, requires no API keys, processes 16kHz PCM natively, and costs exactly $0 per hour.
2. **LLM Brain:** Use **Gemini 1.5 Flash** (via the standard Text API, not the Gemini Live API).
   - *Why:* It is highly cost-efficient, lightning-fast for text generation, and easily handles generating the next question.
3. **Text-to-Speech (TTS):** Implement **Edge-TTS**.
   - *Why:* It leverages Microsoft's Edge neural voices for free, streams audio asynchronously back to the WebSocket, and provides a highly professional interviewer persona without the steep $12/1M token cost of Gemini Live audio output.

### Migration Action Items to Save Costs:
- **Drop `gemini_live_service.py`**: Completely stop using the bidirectional Gemini Live WebSocket. While convenient, it is far too expensive for 30-minute interviews.
- **Install Local Voice Dependencies**: Run `pip install vosk edge-tts` and download the small 40MB `vosk-model-small-en-us` model.
- **Update `interview_ws.py`**: Rewrite the WebSocket ingestion loop so that incoming `audio_data` bytes are fed directly into `KaldiRecognizer.AcceptWaveform()`, and generated question strings are piped sequentially into `edge_tts.Communicate.stream()`. 

### How to Reduce Costs While Staying on Gemini Live API

If you decide to remain 100% on the **Gemini Live API** architecture, here are the most aggressive strategies you can implement to shrink the ~$2.52/hr operational cost:

1. **Strict Frontend VAD (Voice Activity Detection):**
   - *Problem:* Real-time WebSockets continuously stream ambient static/silence when the user is thinking, consuming massive amounts of Input Audio Tokens.
   - *Solution:* Modify `useAudioCapture.js` to include a local VAD threshold. **Only** trigger `websocket.send(pcm_bytes)` when the user is actively vocalizing. Dropping 50% of dead silence will slash your input costs by exactly 50%.
2. **Compress System Prompts & Context History:**
   - *Problem:* The Live API repeatedly factors in the massive initial system prompt (which contains the full JD and Resume) into *every single conversational turn*.
   - *Solution:* Shrink the resume JSON payload down to bare minimums (array of keywords only). Do not pass full bullet descriptions into the live context.
3. **Hard-Cap Interview Limits:**
   - *Solution:* Force the AI to transition to the "Feedback/End" state immediately after 15 minutes or 7 total questions. Set a hard 90-second answer limit on the frontend where the mic automatically mutes to prevent endless rambling.
4. **Enforce the 'Lite' Flash Models:**
   - *Solution:* Ensure the WebSocket configuration explicitly binds to `gemini-2.0-flash-lite` (once out of beta) or `gemini-1.5-flash-8b`. These heavily quantized models are mathematically cheaper per audio token than standard `1.5-flash`.

### Operational Costs per Hour: Existing vs Suggested

| Component | Existing Architecture (Gemini Live) | Suggested Architecture ($0 Stack) |
|-----------|-------------------------------------|-----------------------------------|
| **STT (Listening)** | ~$1.08 / hr (Audio Input Tokens) | **$0.00** / hr (Vosk Local) |
| **LLM (Thinking)** | (Included in audio input/output) | **$0.001** / hr (Gemini 1.5 Flash Text) |
| **TTS (Speaking)** | ~$1.44 / hr (Audio Output Tokens) | **$0.00** / hr (Edge-TTS Microsoft) |
| **Total Cost** | **~$2.52 per hour** of interviewing | **~$0.00 per hour** |

By executing this exact blueprint, MockMate AI's real-time voice pipeline operational costs will drop from ~$2.52 per interview hour straight to **$0.00**.
