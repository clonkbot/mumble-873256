import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Wand2,
  Save,
  Trash2,
  Clock,
  FileText,
  Sparkles,
  Loader2,
  Edit3
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface TranscriptionViewProps {
  id: Id<"transcriptions">;
  onBack: () => void;
}

export function TranscriptionView({ id, onBack }: TranscriptionViewProps) {
  const transcription = useQuery(api.transcriptions.get, { id });
  const updateTranscription = useMutation(api.transcriptions.update);
  const removeTranscription = useMutation(api.transcriptions.remove);

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [title, setTitle] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (transcription === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (transcription === null) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Transcription not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-violet-400 hover:text-violet-300 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  const displayText = transcription.refinedText || transcription.rawText;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRefine = async () => {
    setIsRefining(true);

    // Simulate AI refinement
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const refined = transcription.rawText
      .trim()
      .replace(/\s+/g, " ")
      .replace(/(^\s*\w|[.!?]\s*\w)/g, (c: string) => c.toUpperCase())
      .replace(/\bi\b/g, "I")
      .replace(/\s+([.,!?])/g, "$1");

    await updateTranscription({
      id,
      refinedText: refined,
      status: "refined",
    });

    setIsRefining(false);
  };

  const handleEdit = () => {
    setEditedText(displayText);
    setTitle(transcription.title || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateTranscription({
      id,
      refinedText: editedText,
      title: title || undefined,
      status: "refined",
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await removeTranscription({ id });
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title..."
                className="text-xl font-display font-bold text-white bg-transparent border-b border-violet-500/50 focus:outline-none focus:border-violet-500 pb-1"
              />
            ) : (
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                {transcription.title || "Untitled Transcription"}
              </h2>
            )}
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(transcription.duration)}
              </span>
              <span className="hidden sm:inline">{formatDate(transcription.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {transcription.status === "refined" && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Refined
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Main text display */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {transcription.status === "refined" ? (
                <Sparkles className="w-4 h-4 text-violet-400" />
              ) : (
                <FileText className="w-4 h-4 text-gray-400" />
              )}
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                {transcription.status === "refined" ? "Refined Text" : "Raw Transcript"}
              </h3>
            </div>
            <button
              onClick={() => handleCopy(displayText)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? "Copied!" : "Copy"}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[200px] p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 resize-y transition-all"
            />
          ) : (
            <p className="text-white leading-relaxed whitespace-pre-wrap break-words">
              {displayText}
            </p>
          )}
        </div>

        {/* Show raw text if refined exists */}
        {transcription.refinedText && !isEditing && (
          <details className="group">
            <summary className="flex items-center gap-2 p-3 rounded-xl text-sm text-gray-500 hover:text-gray-400 cursor-pointer transition-colors">
              <FileText className="w-4 h-4" />
              View original transcript
            </summary>
            <div className="mt-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {transcription.rawText}
              </p>
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isEditing ? (
            <>
              <motion.button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-5 h-5" />
                Save Changes
              </motion.button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-gray-300 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {transcription.status !== "refined" && (
                <motion.button
                  onClick={handleRefine}
                  disabled={isRefining}
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
              )}

              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-gray-300 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
              >
                <Edit3 className="w-5 h-5" />
                Edit
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 disabled:opacity-50 transition-all"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
