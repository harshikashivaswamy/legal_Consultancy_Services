import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Globe,
  Mic,
  MicOff,
  Send,
  Sparkle,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type SupportedLanguage,
  useSpeechRecognition,
  useSpeechSynthesis,
} from "@/lib/useSpeech";

const SUGGESTIONS_KANNADA = [
  "ನನ್ನ ಬಾಡಿಗೆ ಠೇವಣಿ ಮರಳಿ ಪಡೆಯುವುದು ಹೇಗೆ?",
  "ಚೆಕ್ ಬೌನ್ಸ್ ಕೇಸ್‌ಗೆ ಯಾವ ವಕೀಲರನ್ನು ಆಯ್ಕೆ ಮಾಡಬೇಕು?",
  "ಪರಸ್ಪರ ಒಪ್ಪಿಗೆಯ ವಿಚ್ಛೇದನದ ಪ್ರಕ್ರಿಯೆ ಹೇಗೆ?",
  "ಆಸ್ತಿ ನೋಂದಣಿ ವಿವಾದಕ್ಕೆ ಏನು ಮಾಡಬೇಕು?",
];

const SUGGESTIONS_ENGLISH = [
  "What are my rights if my landlord withholds the deposit?",
  "Which lawyer should I book for a cheque bounce case?",
  "Summarise what a mutual divorce process involves",
  "How do I book a verified lawyer appointment here?",
];

const SUGGESTIONS_HINDI = [
  "मकान मालिक अगर सिक्योरिटी डिपॉजिट न लौटाए तो क्या करें?",
  "चेक बाउंस केस के लिए कौन सा वकील चुनना चाहिए?",
  "आपसी सहमति से तलाक की प्रक्रिया क्या है?",
  "प्रॉपर्टी विवाद के लिए क्या कानूनी विकल्प हैं?",
];

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function NyayaAIPanel({ className }: { className?: string }) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("kn-IN");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { speak, stop: stopSpeaking, isSpeaking, currentText } = useSpeechSynthesis();

  const {
    isListening,
    error: speechError,
    isSupported: isMicSupported,
    toggleListening,
    stopListening,
  } = useSpeechRecognition({
    lang: selectedLang,
    onTranscript: (liveTranscript) => {
      if (liveTranscript) {
        setInput(liveTranscript);
      }
    },
  });

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  // Auto-scroll when messages update
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Auto-focus when reply completes
  useEffect(() => {
    if (!busy && !isListening) {
      inputRef.current?.focus();
    }
  }, [busy, isListening]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;

    stopListening();
    stopSpeaking();
    setInput("");

    void sendMessage({ text: value });
  };

  const currentSuggestions =
    selectedLang === "kn-IN"
      ? SUGGESTIONS_KANNADA
      : selectedLang === "hi-IN"
      ? SUGGESTIONS_HINDI
      : SUGGESTIONS_ENGLISH;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Top Language Switcher Bar */}
      <div className="flex items-center justify-between border-b bg-card/60 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="size-3.5 text-accent" />
          <span className="text-[11px] font-medium">ಭಾಷೆ / Language:</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              setSelectedLang("kn-IN");
            }}
            className={cn(
              "rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
              selectedLang === "kn-IN"
                ? "bg-gold text-[oklch(0.24_0.05_262)] font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            ಕನ್ನಡ
          </button>
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              setSelectedLang("en-IN");
            }}
            className={cn(
              "rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
              selectedLang === "en-IN"
                ? "bg-gold text-[oklch(0.24_0.05_262)] font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              setSelectedLang("hi-IN");
            }}
            className={cn(
              "rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
              selectedLang === "hi-IN"
                ? "bg-gold text-[oklch(0.24_0.05_262)] font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 shadow-soft">
              <p className="text-sm font-medium">
                {selectedLang === "kn-IN"
                  ? "ನಮಸ್ಕಾರ — ನಾನು ಟೆಕೋರಾ ಎಐ (TekoraAI)."
                  : "Namaste — I'm TekoraAI."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedLang === "kn-IN"
                  ? "ನಿಮ್ಮ ಕಾನೂನು ಸಮಸ್ಯೆಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಿ. ನಾನು ಸೂಕ್ತ ಮಾಹಿತಿ ಮತ್ತು ವಕೀಲರ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ."
                  : "Ask me about your legal situation by typing or speaking through the microphone below. I'll explain the basics and guide you to the right verified lawyer."}
              </p>
            </div>
            <div className="grid gap-2">
              {currentSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  disabled={busy}
                  className="rounded-xl border bg-background/60 px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:bg-accent/10 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const text = messageText(message);
          if (!text) return null;
          const isUser = message.role === "user";
          const isCurrentlySpeakingThis = isSpeaking && currentText === text;

          return (
            <div key={message.id} className={cn("flex gap-3", isUser && "justify-end")}>
              {!isUser && (
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-gold">
                  <Sparkle className="size-4 text-[oklch(0.24_0.05_262)]" />
                </span>
              )}
              <div
                className={cn(
                  "group relative max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed",
                  isUser
                    ? "rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-primary-foreground"
                    : "rounded-2xl rounded-bl-sm border bg-card px-3.5 py-2.5 text-foreground shadow-soft"
                )}
              >
                {text}

                {/* Read aloud button on AI messages in Kannada / English */}
                {!isUser && (
                  <div className="mt-2 flex items-center gap-2 border-t border-border/50 pt-1.5 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCurrentlySpeakingThis) {
                          stopSpeaking();
                        } else {
                          speak(text);
                        }
                      }}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
                      title={isCurrentlySpeakingThis ? "ಧ್ವನಿ ನಿಲ್ಲಿಸಿ / Stop" : "ಕೇಳಿಸಿಕೊಳ್ಳಿ / Listen to response"}
                    >
                      {isCurrentlySpeakingThis ? (
                        <>
                          <VolumeX className="size-3.5 text-destructive animate-pulse" />
                          <span className="text-[11px] text-destructive">ನಿಲ್ಲಿಸಿ / Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="size-3.5 text-accent" />
                          <span className="text-[11px]">ಕೇಳಿ / Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <p className="animate-pulse pl-10 text-sm text-muted-foreground">
            {selectedLang === "kn-IN" ? "ಟೆಕೋರಾ ಎಐ ಉತ್ತರಿಸುತ್ತಿದೆ…" : "TekoraAI is thinking…"}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            TekoraAI is unavailable right now. Please ensure the backend is running.
          </p>
        )}
        {speechError && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {speechError}
          </p>
        )}
      </div>

      {/* Live Voice Recording Status Bar */}
      {isListening && (
        <div className="flex items-center justify-between border-t bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-red-500"></span>
            </span>
            <span>
              {selectedLang === "kn-IN"
                ? "🎙️ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ… ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ"
                : "🎙️ Listening to your microphone… Speak now"}
            </span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="rounded px-2 py-0.5 font-semibold text-destructive underline hover:bg-destructive/10"
          >
            Done
          </button>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="border-t bg-card/60 p-3"
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !busy) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={
              busy
                ? selectedLang === "kn-IN"
                  ? "ಟೆಕೋರಾ ಎಐ ಉತ್ತರಿಸುತ್ತಿದೆ…"
                  : "TekoraAI is answering…"
                : isListening
                ? selectedLang === "kn-IN"
                  ? "ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ…"
                  : "Listening… speak your question"
                : selectedLang === "kn-IN"
                ? "ನಿಮ್ಮ ಕಾನೂನು ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ…"
                : "Describe your legal issue or click mic to talk…"
            }
            rows={1}
            className={cn(
              "max-h-32 min-h-[44px] resize-none rounded-xl transition-opacity",
              isListening && "border-destructive/60 bg-destructive/5",
              busy && "opacity-60 cursor-not-allowed"
            )}
          />

          {/* Voice Microphone Button */}
          {isMicSupported && (
            <Button
              type="button"
              disabled={busy}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={() => {
                stopSpeaking();
                toggleListening();
              }}
              title={
                isListening
                  ? "Stop listening"
                  : selectedLang === "kn-IN"
                  ? "ಕನ್ನಡದಲ್ಲಿ ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ"
                  : "Click to talk with your voice"
              }
              className={cn(
                "size-11 shrink-0 rounded-xl transition-all",
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse"
                  : "hover:border-accent hover:text-accent",
                busy && "opacity-50 cursor-not-allowed"
              )}
            >
              {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </Button>
          )}

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={busy || !input.trim()}
            className="size-11 shrink-0 rounded-xl"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {selectedLang === "kn-IN"
            ? "ಸಾಮಾನ್ಯ ಕಾನೂನು ಮಾಹಿತಿ ಮಾತ್ರ — ಅಧಿಕೃತ ವಕೀಲರ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ."
            : "General legal information only — not a substitute for advice from a licensed advocate."}
        </p>
      </form>
    </div>
  );
}

export function NyayaAIWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 right-4 z-50 flex h-[560px] max-h-[75vh] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border bg-background shadow-lift sm:right-6"
          >
            <div className="flex items-center justify-between gap-3 bg-hero px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-gold">
                  <Bot className="size-4 text-[oklch(0.24_0.05_262)]" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-[oklch(0.98_0.004_250)]">TekoraAI</p>
                  <p className="text-[11px] text-[oklch(0.85_0.02_250)]">ಕನ್ನಡ & Multilingual Legal Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close TekoraAI"
                className="rounded-lg p-1.5 text-[oklch(0.9_0.01_250)] transition-colors hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
            <NyayaAIPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open TekoraAI assistant"
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full bg-hero px-4 py-3.5 shadow-lift sm:right-6"
      >
        <span className="grid size-6 place-items-center rounded-full bg-gold">
          <Sparkle className="size-3.5 text-[oklch(0.24_0.05_262)]" />
        </span>
        <span className="text-sm font-medium text-[oklch(0.98_0.004_250)]">TekoraAI</span>
      </motion.button>
    </>
  );
}