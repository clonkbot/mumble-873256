import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  LogOut,
  Clock,
  FileText,
  Sparkles,
  Settings,
  Menu,
  X,
  TrendingUp
} from "lucide-react";
import { RecordingPanel } from "./RecordingPanel";
import { TranscriptionList } from "./TranscriptionList";
import { TranscriptionView } from "./TranscriptionView";
import { Id } from "../../convex/_generated/dataModel";

type View = "record" | "history" | "view";

export function Dashboard() {
  const { signOut } = useAuthActions();
  const stats = useQuery(api.transcriptions.getStats);
  const [currentView, setCurrentView] = useState<View>("record");
  const [selectedId, setSelectedId] = useState<Id<"transcriptions"> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectTranscription = (id: Id<"transcriptions">) => {
    setSelectedId(id);
    setCurrentView("view");
    setMobileMenuOpen(false);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <header className="relative z-50 border-b border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white hidden sm:block">Mumble</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {[
                { id: "record" as const, icon: Mic, label: "Record" },
                { id: "history" as const, icon: Clock, label: "History" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === item.id || (currentView === "view" && item.id === "history")
                      ? "bg-white/[0.08] text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => signOut()}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {[
                  { id: "record" as const, icon: Mic, label: "Record" },
                  { id: "history" as const, icon: Clock, label: "History" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      currentView === item.id
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats Cards */}
          {stats && currentView === "record" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
            >
              {[
                {
                  icon: FileText,
                  label: "Transcriptions",
                  value: stats.totalTranscriptions.toString(),
                  color: "violet"
                },
                {
                  icon: Clock,
                  label: "Total Time",
                  value: formatDuration(stats.totalDuration),
                  color: "cyan"
                },
                {
                  icon: TrendingUp,
                  label: "Words",
                  value: stats.totalWords.toLocaleString(),
                  color: "emerald"
                },
                {
                  icon: Sparkles,
                  label: "Refined",
                  value: stats.refinedCount.toString(),
                  color: "fuchsia"
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-300"
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}-400`} />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Content Views */}
          <AnimatePresence mode="wait">
            {currentView === "record" && (
              <motion.div
                key="record"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <RecordingPanel onComplete={(id) => handleSelectTranscription(id)} />
              </motion.div>
            )}

            {currentView === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TranscriptionList onSelect={handleSelectTranscription} />
              </motion.div>
            )}

            {currentView === "view" && selectedId && (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TranscriptionView
                  id={selectedId}
                  onBack={() => setCurrentView("history")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center border-t border-white/[0.04]">
        <p className="text-xs text-gray-600">
          Requested by <span className="text-gray-500">@web-user</span> · Built by <span className="text-gray-500">@clonkbot</span>
        </p>
      </footer>
    </motion.div>
  );
}
