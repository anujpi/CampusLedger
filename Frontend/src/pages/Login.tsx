import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Eye, EyeOff, ChevronLeft, Wallet, GraduationCap, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!isFlipped) {
        await login(email, password);
      } else {
        await new Promise((res) => setTimeout(res, 1000));
        alert("Password reset link sent to " + email);
        setIsFlipped(false);
      }
    } catch (err: any) {
      let msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("403") || msg.toLowerCase().includes("forbidden") || msg.includes("Bad credentials")) {
        msg = "Invalid credentials. Please verify your email and password.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full bg-[#030303] min-h-screen font-sans selection:bg-white/20 overflow-x-hidden">
      
      {/* 
        MAIN CONTENT AREA 
        High z-index to stay above the fixed footer until scroll reaches the bottom.
      */}
      <main className="relative z-10 w-full bg-[#030303] flex flex-col text-white shadow-2xl rounded-b-[40px] pb-32">
        
        {/* Hero Section containing Auth Form */}
        <HeroGeometric 
          badge="Campus Platform"
          title1="Campus"
          title2="Ledger"
        >
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              <motion.div
                key="login"
                initial={{ rotateY: -180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 180, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl w-full relative shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Access Portal</h2>
                  <p className="text-sm text-white/40 mt-2 font-medium">Enter your credentials to sync</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="peer w-full bg-transparent border-b border-white/20 px-0 py-2 text-white placeholder-transparent focus:outline-none focus:border-white transition-all"
                      placeholder="Email"
                      required
                    />
                    <label 
                      htmlFor="email"
                      className="absolute left-0 -top-3.5 text-xs text-white/50 font-medium transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-white"
                    >
                      Email Address
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="peer w-full bg-transparent border-b border-white/20 px-0 py-2 text-white placeholder-transparent focus:outline-none focus:border-white transition-all pr-10"
                      placeholder="Password"
                      required
                    />
                    <label 
                      htmlFor="password"
                      className="absolute left-0 -top-3.5 text-xs text-white/50 font-medium transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-white"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {error && (
                    <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 font-medium">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      className="text-xs font-medium text-white/40 hover:text-white transition-colors"
                    >
                      Lost your signal?
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-3.5 bg-white text-black rounded-xl font-bold transition-all duration-300 hover:bg-neutral-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        Initialize Sync
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -180, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl w-full relative shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Recover Signal</h2>
                  <p className="text-sm text-white/40 mt-2 font-medium">We'll beam a reset link to your inbox</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="relative group">
                    <input
                      type="email"
                      id="reset-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="peer w-full bg-transparent border-b border-white/20 px-0 py-2 text-white placeholder-transparent focus:outline-none focus:border-white transition-all"
                      placeholder="Email"
                      required
                    />
                    <label 
                      htmlFor="reset-email"
                      className="absolute left-0 -top-3.5 text-xs text-white/50 font-medium transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-white"
                    >
                      Email Address
                    </label>
                  </div>

                  {error && (
                    <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 font-medium">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full py-3.5 bg-white text-black rounded-xl font-bold transition-all duration-300 hover:bg-neutral-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                         <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="flex items-center justify-center gap-2 text-sm text-white/40 font-medium hover:text-white transition-colors py-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Access Portal
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </HeroGeometric>

        {/* Features Info Section */}
        <section className="w-full max-w-7xl mx-auto py-24 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
              <Wallet className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Smart Finances</h3>
            <p className="text-white/40 leading-relaxed font-light">
              Track pending fees, generate PDF receipts, and settle dues instantly with Razorpay.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
              <GraduationCap className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Dynamic Attendance</h3>
            <p className="text-white/40 leading-relaxed font-light">
              Real-time attendance mapping against fine generation algorithms for zero-latency administration.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20">
              <Ticket className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Ethereal Club Hub</h3>
            <p className="text-white/40 leading-relaxed font-light">
              Immerse yourself in a dedicated space for communities with live event RSVPs and real-time Discord-style chat.
            </p>
          </motion.div>
        </section>

      </main>

      {/* The Cinematic Footer is injected here */}
      <CinematicFooter />
      
    </div>
  );
}
