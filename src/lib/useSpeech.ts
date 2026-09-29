import { useCallback, useEffect, useRef, useState } from "react";

// Cross-browser SpeechRecognition types
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type SupportedLanguage = "kn-IN" | "en-IN" | "hi-IN";

export function useSpeechRecognition({
  onTranscript,
  lang = "kn-IN",
}: {
  onTranscript?: (transcript: string) => void;
  lang?: SupportedLanguage;
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as unknown as IWindow) : null;
    const hasAPI = Boolean(win?.SpeechRecognition || win?.webkitSpeechRecognition);
    setIsSupported(hasAPI);
  }, []);

  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async (explicitLang?: SupportedLanguage) => {
    const win = typeof window !== "undefined" ? (window as unknown as IWindow) : null;
    const SpeechRecognitionAPI = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      setIsSupported(false);
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    setError(null);
    isActiveRef.current = true;

    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr: any) {
          console.warn("Microphone permission check:", permErr);
          if (permErr.name === "NotAllowedError" || permErr.name === "PermissionDeniedError") {
            setError("Microphone permission denied. Please allow microphone access in your browser bar.");
            setIsListening(false);
            isActiveRef.current = false;
            return;
          }
        }
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = explicitLang || langRef.current || "kn-IN";

      recognition.onstart = () => {
        if (!isActiveRef.current) {
          try {
            recognition.abort();
          } catch {
            /* ignore */
          }
          return;
        }
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        if (!isActiveRef.current) return;
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript && isActiveRef.current) {
          onTranscriptRef.current?.(fullTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error event:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone permission denied. Please allow microphone in browser.");
        } else if (event.error === "network") {
          setError("Speech recognition network error. Please check your internet connection.");
        } else if (event.error !== "no-speech") {
          setError(`Mic notice: ${event.error}`);
        }
        setIsListening(false);
        isActiveRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        isActiveRef.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err: any) {
      console.warn("Error starting speech recognition:", err);
      setError("Could not start microphone. Please check browser settings.");
      setIsListening(false);
      isActiveRef.current = false;
    }
  }, []);

  const toggleListening = useCallback(
    (explicitLang?: SupportedLanguage) => {
      if (isListening || isActiveRef.current) {
        stopListening();
      } else {
        void startListening(explicitLang);
      }
    },
    [isListening, startListening, stopListening]
  );

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return {
    isListening,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  const cleanTextForSpeech = (raw: string) => {
    return raw
      .replace(/\*\*(.*?)\*\*/g, "$1") // bold
      .replace(/\*(.*?)\*/g, "$1") // italics
      .replace(/`([^`]+)`/g, "$1") // code
      .replace(/^#+\s+/gm, "") // headers
      .replace(/[•\-\*]\s+/g, "") // bullets
      .replace(/₹/g, " ರೂಪಾಯಿ ") // currency in Kannada/Indian
      .replace(/\s+/g, " ")
      .trim();
  };

  const detectLanguage = (text: string): "kn-IN" | "hi-IN" | "en-IN" => {
    // Kannada Unicode block: \u0C80-\u0CFF
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return "kn-IN";
    }
    // Devanagari / Hindi Unicode block: \u0900-\u097F
    if (/[\u0900-\u097F]/.test(text)) {
      return "hi-IN";
    }
    return "en-IN";
  };

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // Stop any active speech

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    const targetLang = detectLanguage(cleaned);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 0.95; // slightly natural rate for clarity
    utterance.pitch = 1.0;
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();

    if (targetLang === "kn-IN") {
      // Find Kannada specific voice (Chrome / Windows / Android / Mac)
      const knVoice =
        voices.find((v) => v.lang.toLowerCase().includes("kn") || v.lang.toLowerCase().includes("kan")) ||
        voices.find((v) => v.name.toLowerCase().includes("kannada") || v.name.toLowerCase().includes("kn_in")) ||
        voices.find((v) => v.name.toLowerCase().includes("gagan") || v.name.toLowerCase().includes("sapna")) ||
        voices.find((v) => v.lang.includes("IN"));
      if (knVoice) {
        utterance.voice = knVoice;
      }
    } else if (targetLang === "hi-IN") {
      const hiVoice =
        voices.find((v) => v.lang.toLowerCase().includes("hi")) ||
        voices.find((v) => v.name.toLowerCase().includes("hindi")) ||
        voices.find((v) => v.lang.includes("IN"));
      if (hiVoice) {
        utterance.voice = hiVoice;
      }
    } else {
      const enVoice =
        voices.find((v) => v.lang.includes("en-IN") || v.name.includes("India")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentText(null);
      onEnd?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentText(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentText(null);
  }, []);

  return {
    isSpeaking,
    currentText,
    speak,
    stop,
  };
}
