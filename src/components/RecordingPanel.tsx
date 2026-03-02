import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Wand2, Copy, Check, Loader2, Sparkles } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

// Declare types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionType extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}

interface RecordingPanelProps {
  onComplete?: (id: Id<"transcriptions">) => void;
}

export function RecordingPanel({ onComplete }: RecordingPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [refinedText, setRefinedText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const createTranscription = useMutation(api.transcriptions.create);
  const settings = useQuery(api.settings.get);

  // Audio level visualization
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.error("Could not access microphone for visualization:", err);
    }
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionConstructor();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = settings?.language || "en-US";

    let finalTranscript = "";

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        stopRecording();
      }
    };

    recognitionRef.current.onend = () => {
      // Restart if still supposed to be recording
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    recognitionRef.current.start();
    setIsRecording(true);
    setDuration(0);
    startAudioVisualization();

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, [settings?.language, isRecording, startAudioVisualization]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopAudioVisualization();
    setIsRecording(false);
  }, [stopAudioVisualization]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const handleRefine = async () => {
    if (!transcript.trim()) return;

    setIsRefining(true);

    // Simulate AI refinement (in production, this would call an AI API)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple refinement: capitalize sentences, fix common issues
    const refined = transcript
      .trim()
      .replace(/\s+/g, " ")
      .replace(/(^\s*\w|[.!?]\s*\w)/g, (c: string) => c.toUpperCase())
      .replace(/\bi\b/g, "I")
      .replace(/\s+([.,!?])/g, "$1");

    setRefinedText(refined);
    setIsRefining(false);
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;

    const id = await createTranscription({
      rawText: transcript,
      duration,
    });

    if (onComplete) {
      onComplete(id);
    }

    // Reset state
    setTranscript("");
    setRefinedText("");
    setDuration(0);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Recording Button Section */}
      <div className="flex flex-col items-center justify-center py-8 sm:py-12">
        <div className="relative">
          {/* Animated rings when recording */}
          <AnimatePresence>
            {isRecording && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-violet-500/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{
                    scale: 1 + audioLevel * 0.5,
                    opacity: 0.3 + audioLevel * 0.3
                  }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-fuchsia-500/20"
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{
                    scale: [1.2, 1.8, 1.2],
                    opacity: [0.2, 0, 0.2]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-pink-500/20"
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{
                    scale: [1.4, 2.2, 1.4],
                    opacity: [0.15, 0, 0.15]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? "bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/30"
                : "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="stop"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                >
                  <Square className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                >
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Recording status */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-gray-400 mb-2">
            {isRecording ? "Recording..." : "Tap to start recording"}
          </p>
          <motion.p
            className="text-3xl sm:text-4xl font-mono font-bold text-white"
            animate={{ opacity: isRecording ? [1, 0.5, 1] : 1 }}
            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          >
            {formatTime(duration)}
          </motion.p>
        </motion.div>
      </div>

      {/* Transcript Display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Raw Transcript */}
            <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Raw Transcript
                </h3>
                <button
                  onClick={() => handleCopy(transcript)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-white leading-relaxed whitespace-pre-wrap break-words">
                {transcript}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={handleRefine}
                disabled={isRefining || !transcript.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isRefining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Refine with AI
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={handleSave}
                disabled={!transcript.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-gray-300 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Transcription
              </motion.button>
            </div>

            {/* Refined Text */}
            <AnimatePresence>
              {refinedText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <h3 className="text-sm font-medium text-violet-300 uppercase tracking-wider">
                        Refined Text
                      </h3>
                    </div>
                    <button
                      onClick={() => handleCopy(refinedText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-violet-300 hover:text-white hover:bg-violet-500/20 transition-all"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-white leading-relaxed whitespace-pre-wrap break-words">
                    {refinedText}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!transcript && !isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-gray-500 text-sm">
            Press the microphone button to start transcribing your voice
          </p>
        </motion.div>
      )}
    </div>
  );
}
