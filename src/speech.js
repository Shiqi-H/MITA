/**
 * speech.js
 * Browser-native Web Speech API wrapper.
 *
 * STT: SpeechRecognition — continuous listening with push-to-talk support
 * TTS: SpeechSynthesis   — speak text aloud with optional voice selection
 */

// ─────────────────────────────────────────────
// Speech-to-Text (STT)
// ─────────────────────────────────────────────

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * @typedef {Object} STTOptions
 * @property {string} [lang]            - BCP-47 language tag, default 'zh-CN'
 * @property {Function} onResult        - Callback (transcript: string, isFinal: boolean) => void
 * @property {Function} [onStart]       - Called when recognition starts
 * @property {Function} [onEnd]         - Called when recognition ends
 * @property {Function} [onError]       - Called with error event
 */

export class STTController {
  /**
   * @param {STTOptions} opts
   */
  constructor(opts) {
    if (!SpeechRecognition) {
      console.warn('[stt] Web Speech API not supported in this browser.');
      this._supported = false;
      return;
    }
    this._supported = true;
    this._opts = opts;
    this._recognition = new SpeechRecognition();
    this._recognition.lang = opts.lang || 'zh-CN';
    this._recognition.interimResults = true;
    this._recognition.maxAlternatives = 1;
    this._listening = false;

    this._recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim();
      const isFinal = result.isFinal;
      opts.onResult(transcript, isFinal);
    };

    this._recognition.onstart = () => {
      this._listening = true;
      opts.onStart?.();
    };

    this._recognition.onend = () => {
      this._listening = false;
      opts.onEnd?.();
    };

    this._recognition.onerror = (event) => {
      console.error('[stt] Error:', event.error);
      this._listening = false;
      opts.onError?.(event);
    };
  }

  get isSupported() {
    return this._supported;
  }

  get isListening() {
    return this._listening;
  }

  /** Start a single utterance recognition session. */
  start() {
    if (!this._supported || this._listening) return;
    try {
      this._recognition.start();
    } catch (e) {
      console.warn('[stt] start() error:', e.message);
    }
  }

  /** Stop recognition manually. */
  stop() {
    if (!this._supported || !this._listening) return;
    this._recognition.stop();
  }

  /** Toggle listening state. */
  toggle() {
    this._listening ? this.stop() : this.start();
  }
}

// ─────────────────────────────────────────────
// Text-to-Speech (TTS)
// ─────────────────────────────────────────────

/**
 * Speak text using the browser's SpeechSynthesis API.
 * @param {string} text
 * @param {Object} [opts]
 * @param {string} [opts.lang]    - BCP-47 tag, default 'zh-CN'
 * @param {number} [opts.rate]    - Speed, 0.1–10, default 1
 * @param {number} [opts.pitch]   - Pitch, 0–2, default 1
 * @returns {SpeechSynthesisUtterance}
 */
export function speak(text, opts = {}) {
  if (!window.speechSynthesis) {
    console.warn('[tts] SpeechSynthesis not supported.');
    return null;
  }

  // Cancel any in-progress speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = opts.lang || 'zh-CN';
  utterance.rate = opts.rate ?? 1;
  utterance.pitch = opts.pitch ?? 1;

  // Prefer a Chinese voice if available
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(
    (v) => v.lang.startsWith('zh') && !v.name.includes('Google')
  ) || voices.find((v) => v.lang.startsWith('zh'));
  if (zhVoice) utterance.voice = zhVoice;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop any currently playing speech.
 */
export function stopSpeech() {
  window.speechSynthesis?.cancel();
}
