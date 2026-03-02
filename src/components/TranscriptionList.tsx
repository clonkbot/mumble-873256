import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Clock, Trash2, Sparkles, Search } from "lucide-react";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface TranscriptionListProps {
  onSelect: (id: Id<"transcriptions">) => void;
}

export function TranscriptionList({ onSelect }: TranscriptionListProps) {
  const transcriptions = useQuery(api.transcriptions.list, { limit: 50 });
  const removeTranscription = useMutation(api.transcriptions.remove);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<Id<"transcriptions"> | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDelete = async (e: React.MouseEvent, id: Id<"transcriptions">) => {
    e.stopPropagation();
    setDeletingId(id);
    await removeTranscription({ id });
    setDeletingId(null);
  };

  const filteredTranscriptions = transcriptions?.filter((t: Doc<"transcriptions">) => {
    if (!searchQuery) return true;
    const text = (t.refinedText || t.rawText).toLowerCase();
    const title = (t.title || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return text.includes(query) || title.includes(query);
  });

  if (transcriptions === undefined) {
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
            Transcription History
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {transcriptions.length} transcription{transcriptions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search transcriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>

      {/* List */}
      {filteredTranscriptions && filteredTranscriptions.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTranscriptions.map((transcription: Doc<"transcriptions">, index: number) => (
              <motion.div
                key={transcription._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(transcription._id)}
                className="group p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-violet-500/20 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                    transcription.status === "refined"
                      ? "bg-violet-500/20"
                      : "bg-white/[0.06]"
                  }`}>
                    {transcription.status === "refined" ? (
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                    ) : (
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {transcription.title || "Untitled Transcription"}
                      </h3>
                      {transcription.status === "refined" && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300">
                          Refined
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {transcription.refinedText || transcription.rawText}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(transcription.duration)}
                      </span>
                      <span>{formatDate(transcription.createdAt)}</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, transcription._id)}
                    disabled={deletingId === transcription._id}
                    className="flex-shrink-0 p-2 rounded-lg text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    {deletingId === transcription._id ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-500 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 sm:py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">
            {searchQuery ? "No matching transcriptions" : "No transcriptions yet"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery ? "Try a different search term" : "Start recording to create your first one"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
