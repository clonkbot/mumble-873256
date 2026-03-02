import { useConvexAuth } from "convex/react";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/10 via-fuchsia-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-900/5 to-transparent rounded-full" />
      </div>

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" />
        ) : isAuthenticated ? (
          <Dashboard key="dashboard" />
        ) : (
          <AuthScreen key="auth" />
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="relative">
        {/* Pulsing rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-violet-500/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-fuchsia-500/30"
          animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />

        {/* Central orb */}
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500"
          animate={{
            boxShadow: [
              "0 0 20px rgba(139, 92, 246, 0.5)",
              "0 0 40px rgba(139, 92, 246, 0.8)",
              "0 0 20px rgba(139, 92, 246, 0.5)"
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
